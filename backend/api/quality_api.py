"""
Quality evaluation API for frontend integration.
Provides clean, simple interfaces for quality-focused sampler evaluation.
"""

import json
import yaml
from typing import Dict, List, Any, Optional
from pathlib import Path

import requests

try:
    from ..evaluation.llm_judge import CreativeWritingJudge
    from ..evaluation.quality_aggregator import QualityAggregator
except ImportError:
    # Fallback for when running from different directories
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    sys.path.insert(0, str(backend_dir))
    from evaluation.llm_judge import CreativeWritingJudge
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
        
    def _load_yaml(self, filepath: Path) -> Dict[str, Any]:
        """Load YAML configuration file."""
        try:
            with open(filepath, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Warning: Could not load {filepath}: {e}")
            return {}
    
    def initialize_judge(self, api_key: str = None, model: str = None) -> Dict[str, Any]:
        """Initialize the LLM judge."""
        try:
            self.judge = CreativeWritingJudge(api_key=api_key, model=model)
            return {
                'success': True,
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
            self.generator_config = model_config
            
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
                              max_length: int = 512) -> Dict[str, Any]:
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
        
        try:
            sampler_config = self.samplers[sampler_name]['parameters'].copy()
            
            # Prepare KoboldCpp API request
            url = f"http://localhost:{self.generator_config['port']}/api/v1/generate"
            payload = {
                "prompt": prompt,
                "max_length": max_length,
                "stop_sequence": ["<|eot_id|>", "<|end_of_text|>"],
                **sampler_config
            }
            
            response = requests.post(url, json=payload, timeout=60)
            
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
                return {
                    'success': False,
                    'error': f"HTTP {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
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
                             max_length: int = 512) -> Dict[str, Any]:
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
        
        # Get comprehensive results
        benchmark_results = aggregator.get_benchmark_results(
            benchmark_name="Frontend Quality Benchmark",
            model_name=list(self.models.keys())[0] if self.models else "Unknown"
        )
        
        results['quality_stats'] = benchmark_results.quality_stats
        results['quality_ranking'] = aggregator.get_quality_ranking()
        
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