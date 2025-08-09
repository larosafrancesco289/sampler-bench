"""
Quality evaluation API for frontend integration.
Provides clean, simple interfaces for quality-focused sampler evaluation.
"""

import json
import yaml
from typing import Dict, List, Any, Optional
from pathlib import Path
import time

import requests

try:
    from ..evaluation.llm_judge import CreativeWritingJudge
    from ..evaluation.multi_judge import create_judge
    from ..evaluation.quality_aggregator import QualityAggregator
except ImportError:
    # Fallback for when running from different directories
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    sys.path.insert(0, str(backend_dir))
    from evaluation.llm_judge import CreativeWritingJudge
    from evaluation.multi_judge import create_judge
    from evaluation.quality_aggregator import QualityAggregator

class SamplerBenchAPI:
    """Main API for frontend integration."""
    
    def __init__(self, config_dir: str = "backend/config"):
        """Initialize the API with configuration."""
        # Handle different working directories
        config_path = Path(config_dir)
        if not config_path.exists():
            # Try from parent directory
            config_path = Path("..") / config_dir
        if not config_path.exists():
            # Try absolute from file location
            config_path = Path(__file__).parent.parent / "config"
        
        self.config_dir = config_path
        self.judge = None
        self.generator_config = None
        
        # Load configurations
        models_data = self._load_yaml(self.config_dir / "models.yaml")
        samplers_data = self._load_yaml(self.config_dir / "samplers.yaml")
        
        # Extract the actual models and samplers from nested structure
        self.models = models_data.get('models', {}) if models_data else {}
        # Use presets from the samplers config (the actual sampler configurations)
        self.samplers = samplers_data.get('presets', {}) if samplers_data else {}
        # Load model defaults mapping for dynamic resolution
        self.model_defaults = samplers_data.get('model_defaults', {}) if samplers_data else {}
        
    def _load_yaml(self, filepath: Path) -> Dict[str, Any]:
        """Load YAML configuration file."""
        try:
            with open(filepath, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Warning: Could not load {filepath}: {e}")
            return {}
    
    def _resolve_model_default(self) -> str:
        """Resolve model_default sampler to the appropriate model-specific default."""
        if not hasattr(self, 'generator_config') or not self.generator_config:
            return "llama_default"  # fallback
        
        # Get current model name from generator config
        current_model = self.generator_config.get('name', '').lower()
        
        # Find the most specific (longest) matching pattern
        best_match = None
        best_length = 0
        
        for model_pattern, default_sampler in self.model_defaults.items():
            pattern_lower = model_pattern.lower()
            if pattern_lower in current_model and len(pattern_lower) > best_length:
                best_match = default_sampler
                best_length = len(pattern_lower)
        
        # Return best match or fallback
        return best_match if best_match else self.model_defaults.get('default', 'llama_default')
    
    def initialize_judge(self, api_key: str = None, model: str = None, multi_judge_enabled: bool = None) -> Dict[str, Any]:
        """Initialize the LLM judge (single or multi-judge)."""
        try:
            # Use environment variable or parameter to determine multi-judge mode
            if multi_judge_enabled is None:
                import os
                multi_judge_enabled = os.getenv('MULTI_JUDGE_ENABLED', 'false').lower() == 'true'
            
            if multi_judge_enabled:
                # Initialize multi-judge system
                self.judge = create_judge(multi_judge_enabled=True)
                return {
                    'success': True,
                    'judge_type': 'multi_judge',
                    'judge_models': getattr(self.judge, 'judge_models', ['unknown']),
                    'criteria': self.judge.get_criteria_info()
                }
            else:
                # Initialize single judge (legacy mode)
                self.judge = CreativeWritingJudge(api_key=api_key, model=model)
                return {
                    'success': True,
                    'judge_type': 'single_judge',
                    'model': self.judge.model,
                    'criteria': self.judge.get_criteria_info()
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def initialize_generator(self, model_name: str) -> Dict[str, Any]:
        """Initialize the text generator."""
        if model_name not in self.models:
            return {
                'success': False,
                'error': f"Model '{model_name}' not found in configuration"
            }
        
        try:
            model_config = self.models[model_name]
            self.generator_config = model_config.copy()
            # Store the model name for model_default resolution
            self.generator_config['name'] = model_name
            
            # Test connection to KoboldCpp server
            test_url = f"http://localhost:{model_config['port']}/api/v1/model"
            response = requests.get(test_url, timeout=5)
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'model': model_name,
                    'config': model_config
                }
            else:
                return {
                    'success': False,
                    'error': f"Model server responded with status {response.status_code}"
                }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f"Cannot connect to model server: {e}"
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models."""
        return [
            {
                'name': name,
                'description': config.get('description', ''),
                'port': config.get('port'),
                'type': config.get('type', 'unknown')
            }
            for name, config in self.models.items()
        ]
    
    def get_available_samplers(self) -> List[Dict[str, Any]]:
        """Get list of available samplers."""
        return [
            {
                'name': name,
                'description': config.get('description', ''),
                'parameters': config.get('parameters', {}),
                'type': config.get('sampler', 'unknown')
            }
            for name, config in self.samplers.items()
        ]
    
    def generate_single_sample(self, 
                              prompt: str, 
                              sampler_name: str,
                              max_length: int = 1024,
                              seed: int = None,
                              max_retries: int = 3) -> Dict[str, Any]:
        """Generate a single text sample."""
        if not hasattr(self, 'generator_config'):
            return {
                'success': False,
                'error': "Generator not initialized"
            }
        
        if sampler_name not in self.samplers:
            return {
                'success': False,
                'error': f"Sampler '{sampler_name}' not found"
            }
        
        # Handle dynamic model_default sampler
        actual_sampler_name = sampler_name
        if sampler_name == 'model_default':
            actual_sampler_name = self._resolve_model_default()
            if actual_sampler_name not in self.samplers:
                return {
                    'success': False,
                    'error': f"Could not resolve model_default to valid sampler. Tried: {actual_sampler_name}"
                }
        
        sampler_config = self.samplers[actual_sampler_name]['parameters'].copy()
        
        # Prepare KoboldCpp API request
        url = f"http://localhost:{self.generator_config['port']}/api/v1/generate"
        payload_base = {
            "prompt": prompt,
            "max_length": max_length,
            "stop_sequence": ["<|eot_id|>", "<|end_of_text|>"],
            **sampler_config
        }
        if seed is not None:
            payload_base["seed"] = seed
        
        # Retry loop with exponential back-off
        attempt = 0
        while attempt < max_retries:
            try:
                response = requests.post(url, json=payload_base, timeout=60)
                if response.status_code == 200:
                    data = response.json()
                    generated_text = data.get('results', [{}])[0].get('text', '')
                    return {
                        'success': True,
                        'generated_text': generated_text,
                        'word_count': len(generated_text.split()),
                        'sampler_config': sampler_config
                    }
                else:
                    error_msg = f"HTTP {response.status_code}: {response.text}"
                    raise RuntimeError(error_msg)
            except Exception as e:
                # Last attempt -> return error
                if attempt == max_retries - 1:
                    return {
                        'success': False,
                        'error': str(e)
                    }
                # Wait and retry
                backoff = 2 ** attempt
                time.sleep(backoff)
                attempt += 1
    
    def evaluate_quality(self, 
                        text: str, 
                        prompt: str,
                        sampler_config: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate the quality of generated text."""
        if not self.judge:
            return {
                'success': False,
                'error': "Judge not initialized"
            }
        
        try:
            # Support both single-judge and multi-judge evaluators
            if hasattr(self.judge, 'evaluate_text'):
                # Multi-judge path
                mj = self.judge.evaluate_text(
                    text=text,
                    prompt=prompt,
                    sampler_config=sampler_config,
                    penalty_config=None  # Penalties are handled explicitly by callers
                )
                return {
                    'success': True,
                    'overall_score': mj.overall_score,
                    'overall_std': mj.overall_std,
                    'criterion_scores': [
                        {
                            'criterion': cs.criterion,
                            'score': cs.mean_score,
                            'std': cs.std_score,
                            'consensus_strength': cs.consensus_strength
                        }
                        for cs in mj.criterion_scores
                    ],
                    'summary': mj.summary,
                    'evaluation_time': mj.evaluation_time,
                    'judge_models': mj.judge_models,
                    'judge_count': mj.judge_count,
                    'consensus_method': mj.consensus_method
                }
            else:
                # Single-judge path
                judgment = self.judge.judge_text(text, prompt, sampler_config)
                return {
                    'success': True,
                    'overall_score': judgment.overall_score,
                    'criterion_scores': [
                        {
                            'criterion': cs.criterion,
                            'score': cs.score,
                            'reasoning': cs.reasoning
                        }
                        for cs in judgment.criterion_scores
                    ],
                    'summary': judgment.summary,
                    'evaluation_time': judgment.evaluation_time
                }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def run_quality_benchmark(self, 
                             prompts: List[str],
                             sampler_names: List[str] = None,
                             max_length: int = 1024) -> Dict[str, Any]:
        """Run a complete quality benchmark."""
        if not hasattr(self, 'generator_config') or not self.judge:
            return {
                'success': False,
                'error': "Generator and/or Judge not initialized"
            }
        
        if sampler_names is None:
            sampler_names = list(self.samplers.keys())
        
        aggregator = QualityAggregator()
        total_samples = len(prompts) * len(sampler_names)
        current_sample = 0
        
        results = {
            'success': True,
            'total_samples': total_samples,
            'completed_samples': 0,
            'failed_samples': 0,
            'samples': []
        }
        
        for sampler_name in sampler_names:
            for prompt in prompts:
                current_sample += 1
                
                # Generate text
                gen_result = self.generate_single_sample(prompt, sampler_name, max_length)
                
                if gen_result['success']:
                    # Evaluate quality
                    eval_result = self.evaluate_quality(
                        gen_result['generated_text'],
                        prompt,
                        gen_result['sampler_config']
                    )
                    
                    if eval_result['success']:
                        # Create judgment object (simplified)
                        try:
                            from ..evaluation.llm_judge import JudgmentResult, JudgmentScore
                        except ImportError:
                            from evaluation.llm_judge import JudgmentResult, JudgmentScore
                        
                        criterion_scores = [
                            JudgmentScore(cs['criterion'], cs['score'], cs['reasoning'])
                            for cs in eval_result['criterion_scores']
                        ]
                        
                        judgment = JudgmentResult(
                            overall_score=eval_result['overall_score'],
                            criterion_scores=criterion_scores,
                            summary=eval_result['summary'],
                            evaluation_time=eval_result['evaluation_time'],
                            model_used=self.judge.model
                        )
                        
                        # Add to aggregator
                        sample = aggregator.add_sample(
                            prompt=prompt,
                            sampler_name=sampler_name,
                            sampler_config=gen_result['sampler_config'],
                            generated_text=gen_result['generated_text'],
                            judgment=judgment
                        )
                        
                        results['samples'].append(sample.to_dict())
                        results['completed_samples'] += 1
                    else:
                        results['failed_samples'] += 1
                else:
                    results['failed_samples'] += 1
        
        # Get comprehensive results (use enhanced aggregator API)
        benchmark_results = aggregator.get_enhanced_benchmark_results(
            benchmark_name="Frontend Quality Benchmark",
            model_name=list(self.models.keys())[0] if self.models else "Unknown"
        )
        
        # Summarize key stats for API consumers
        results['quality_stats'] = {
            'sampler_stats': {
                name: {
                    'overall_mean': stats.overall_mean,
                    'overall_std': stats.overall_std,
                    'overall_confidence_interval': stats.overall_confidence_interval,
                    'prompt_consistency': stats.prompt_consistency,
                    'total_samples': stats.total_samples,
                    'prompts_covered': stats.prompts_covered
                }
                for name, stats in benchmark_results.sampler_stats.items()
            }
        }
        results['quality_ranking'] = sorted(
            (
                { 'sampler_name': name, 'avg_quality': stats.overall_mean }
                for name, stats in benchmark_results.sampler_stats.items()
            ),
            key=lambda x: x['avg_quality'],
            reverse=True
        )
        
        return results
    
    def load_existing_results(self, filepath: str) -> Dict[str, Any]:
        """Load and return existing benchmark results."""
        try:
            try:
                from ..evaluation.quality_aggregator import QualityBenchmarkResults
            except ImportError:
                from evaluation.quality_aggregator import QualityBenchmarkResults
            
            results = QualityBenchmarkResults.load_json(Path(filepath))
            
            return {
                'success': True,
                'benchmark_name': results.benchmark_name,
                'timestamp': results.timestamp,
                'model_name': results.model_name,
                'sample_count': len(results.samples),
                'quality_stats': results.quality_stats
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

# Convenience functions for direct use
def create_api(config_dir: str = "backend/config") -> SamplerBenchAPI:
    """Create and return a configured API instance."""
    return SamplerBenchAPI(config_dir)

def quick_evaluate(prompt: str, 
                  text: str, 
                  api_key: str = None) -> Dict[str, Any]:
    """Quick quality evaluation of a single text sample."""
    api = create_api()
    
    # Initialize judge
    judge_result = api.initialize_judge(api_key=api_key)
    if not judge_result['success']:
        return judge_result
    
    # Evaluate
    return api.evaluate_quality(text, prompt, {})

def get_quality_insights(results_file: str) -> Dict[str, Any]:
    """Get quality insights from existing results file."""
    api = create_api()
    return api.load_existing_results(results_file) 