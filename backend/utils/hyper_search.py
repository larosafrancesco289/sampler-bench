"""
Hyperparameter Search Module for Sampler Optimization

This module provides various search strategies to automatically find optimal
sampler configurations for different tasks. It integrates with the existing
benchmark and evaluation infrastructure.
"""

import json
import yaml
import time
import random
import itertools
from typing import Dict, List, Any, Optional, Tuple, Iterator
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, asdict
import logging

# Statistical functions (fallback if numpy not available)
def mean(values):
    return sum(values) / len(values) if values else 0

def std(values):
    if len(values) <= 1:
        return 0
    mean_val = sum(values) / len(values)
    variance = sum((x - mean_val) ** 2 for x in values) / len(values)
    return variance ** 0.5

try:
    from ..api.quality_api import SamplerBenchAPI
    from ..evaluation.llm_judge import CreativeWritingJudge
    from ..evaluation.quality_aggregator import QualityAggregator
except ImportError:
    import sys
    from pathlib import Path
    backend_dir = Path(__file__).parent.parent
    sys.path.insert(0, str(backend_dir))
    from api.quality_api import SamplerBenchAPI
    from evaluation.llm_judge import CreativeWritingJudge
    from evaluation.quality_aggregator import QualityAggregator

@dataclass
class SearchResult:
    """Individual hyperparameter search result."""
    parameters: Dict[str, Any]
    mean_score: float
    std_score: float
    scores: List[float]
    sampler_type: str
    evaluation_time: float
    sample_count: int
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass 
class SearchConfiguration:
    """Configuration for hyperparameter search."""
    sampler_types: List[str]
    parameter_ranges: Dict[str, Dict[str, List[Any]]]
    search_strategy: str = "grid"  # grid, random, bayesian
    n_iterations: int = 100
    samples_per_config: int = 3
    max_length: int = 512
    seed: Optional[int] = None
    parallel_workers: int = 1
    
class HyperParameterSearcher:
    """Main hyperparameter search engine."""
    
    def __init__(self, api: SamplerBenchAPI, judge: CreativeWritingJudge):
        self.api = api
        self.judge = judge
        self.results: List[SearchResult] = []
        self.best_config: Optional[SearchResult] = None
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def grid_search(self, config: SearchConfiguration, 
                   prompts: List[str]) -> List[SearchResult]:
        """Perform exhaustive grid search over parameter space."""
        self.logger.info("Starting grid search...")
        
        all_configs = []
        for sampler_type in config.sampler_types:
            if sampler_type not in config.parameter_ranges:
                self.logger.warning(f"No parameter ranges defined for {sampler_type}")
                continue
                
            # Generate all parameter combinations for this sampler
            param_names = list(config.parameter_ranges[sampler_type].keys())
            param_values = [config.parameter_ranges[sampler_type][name] 
                          for name in param_names]
            
            for combination in itertools.product(*param_values):
                param_dict = dict(zip(param_names, combination))
                all_configs.append((sampler_type, param_dict))
        
        self.logger.info(f"Generated {len(all_configs)} configurations to test")
        
        results = []
        for i, (sampler_type, params) in enumerate(all_configs):
            self.logger.info(f"Testing config {i+1}/{len(all_configs)}: {sampler_type} {params}")
            
            result = self._evaluate_configuration(
                sampler_type, params, prompts, config
            )
            if result:
                results.append(result)
                self.logger.info(f"Score: {result.mean_score:.3f} ± {result.std_score:.3f}")
        
        return results
    
    def random_search(self, config: SearchConfiguration,
                     prompts: List[str]) -> List[SearchResult]:
        """Perform random search over parameter space."""
        self.logger.info(f"Starting random search with {config.n_iterations} iterations...")
        
        results = []
        for i in range(config.n_iterations):
            # Randomly select sampler type
            sampler_type = random.choice(config.sampler_types)
            
            if sampler_type not in config.parameter_ranges:
                continue
                
            # Randomly sample parameters
            params = {}
            for param_name, param_values in config.parameter_ranges[sampler_type].items():
                params[param_name] = random.choice(param_values)
            
            self.logger.info(f"Testing random config {i+1}/{config.n_iterations}: {sampler_type} {params}")
            
            result = self._evaluate_configuration(
                sampler_type, params, prompts, config
            )
            if result:
                results.append(result)
                self.logger.info(f"Score: {result.mean_score:.3f} ± {result.std_score:.3f}")
        
        return results
    
    def bayesian_search(self, config: SearchConfiguration,
                       prompts: List[str]) -> List[SearchResult]:
        """Perform Bayesian optimization search (simplified implementation)."""
        self.logger.info("Starting Bayesian optimization search...")
        
        # Note: This is a simplified version. For production use, consider
        # integrating with scikit-optimize or similar library
        
        results = []
        
        # Start with some random samples
        n_random = min(10, config.n_iterations // 3)
        self.logger.info(f"Starting with {n_random} random samples...")
        
        for i in range(n_random):
            sampler_type = random.choice(config.sampler_types)
            if sampler_type not in config.parameter_ranges:
                continue
                
            params = {}
            for param_name, param_values in config.parameter_ranges[sampler_type].items():
                params[param_name] = random.choice(param_values)
            
            result = self._evaluate_configuration(
                sampler_type, params, prompts, config
            )
            if result:
                results.append(result)
                self.logger.info(f"Random sample {i+1}: Score {result.mean_score:.3f}")
        
        # For the remaining iterations, use exploitation vs exploration
        # (simplified heuristic-based approach)
        for i in range(n_random, config.n_iterations):
            if random.random() < 0.7:  # Exploit: vary best configuration
                if results:
                    best_result = max(results, key=lambda x: x.mean_score)
                    sampler_type = best_result.sampler_type
                    params = self._vary_parameters(
                        best_result.parameters, 
                        config.parameter_ranges[sampler_type]
                    )
                else:
                    continue
            else:  # Explore: random configuration
                sampler_type = random.choice(config.sampler_types)
                if sampler_type not in config.parameter_ranges:
                    continue
                params = {}
                for param_name, param_values in config.parameter_ranges[sampler_type].items():
                    params[param_name] = random.choice(param_values)
            
            self.logger.info(f"Testing Bayesian config {i+1}/{config.n_iterations}: {sampler_type} {params}")
            
            result = self._evaluate_configuration(
                sampler_type, params, prompts, config
            )
            if result:
                results.append(result)
                self.logger.info(f"Score: {result.mean_score:.3f} ± {result.std_score:.3f}")
        
        return results
    
    def _vary_parameters(self, base_params: Dict[str, Any], 
                        param_ranges: Dict[str, List[Any]]) -> Dict[str, Any]:
        """Create variation of parameters around a base configuration."""
        varied_params = base_params.copy()
        
        # Randomly vary 1-2 parameters
        params_to_vary = random.sample(
            list(param_ranges.keys()), 
            min(2, len(param_ranges))
        )
        
        for param_name in params_to_vary:
            possible_values = param_ranges[param_name]
            current_value = base_params.get(param_name)
            
            if isinstance(current_value, (int, float)) and len(possible_values) > 1:
                # For numeric values, try adjacent values
                try:
                    current_idx = possible_values.index(current_value)
                    # Choose adjacent value
                    if current_idx == 0:
                        new_idx = 1
                    elif current_idx == len(possible_values) - 1:
                        new_idx = current_idx - 1
                    else:
                        new_idx = current_idx + random.choice([-1, 1])
                    varied_params[param_name] = possible_values[new_idx]
                except ValueError:
                    # Current value not in list, choose random
                    varied_params[param_name] = random.choice(possible_values)
            else:
                # For other types, just choose randomly
                varied_params[param_name] = random.choice(possible_values)
        
        return varied_params
    
    def _evaluate_configuration(self, sampler_type: str, 
                              parameters: Dict[str, Any],
                              prompts: List[str],
                              config: SearchConfiguration) -> Optional[SearchResult]:
        """Evaluate a single configuration."""
        start_time = time.time()
        
        try:
            # Create temporary sampler configuration
            temp_sampler_config = {
                'description': f'Hyper-search generated {sampler_type}',
                'sampler': sampler_type,
                'parameters': parameters
            }
            
            # Add to API samplers temporarily
            temp_sampler_name = f"hypersearch_{int(time.time() * 1000)}"
            self.api.samplers[temp_sampler_name] = temp_sampler_config
            
            scores = []
            
            # Generate and evaluate samples
            for prompt in prompts:
                for rep in range(config.samples_per_config):
                    # Generate sample
                    # Generate sample (handle optional seed)
                    gen_args = {
                        'prompt': prompt,
                        'sampler_name': temp_sampler_name,
                        'max_length': config.max_length
                    }
                    if config.seed is not None:
                        gen_args['seed'] = config.seed + rep
                    
                    gen_result = self.api.generate_single_sample(**gen_args)
                    
                    if not gen_result.get('success'):
                        self.logger.warning(f"Generation failed: {gen_result.get('error')}")
                        continue
                    
                    generated_text = gen_result['generated_text']
                    
                    # Evaluate quality
                    eval_result = self.api.evaluate_quality(
                        text=generated_text,
                        prompt=prompt,
                        sampler_config=parameters
                    )
                    
                    if eval_result.get('success'):
                        scores.append(eval_result['overall_score'])
                    else:
                        self.logger.warning(f"Evaluation failed: {eval_result.get('error')}")
            
            # Clean up temporary sampler
            del self.api.samplers[temp_sampler_name]
            
            if not scores:
                self.logger.warning("No valid scores obtained for configuration")
                return None
            
            # Calculate statistics
            mean_score = mean(scores)
            std_score = std(scores)
            
            evaluation_time = time.time() - start_time
            
            return SearchResult(
                parameters=parameters,
                mean_score=mean_score,
                std_score=std_score,
                scores=scores,
                sampler_type=sampler_type,
                evaluation_time=evaluation_time,
                sample_count=len(scores)
            )
            
        except Exception as e:
            self.logger.error(f"Error evaluating configuration: {e}")
            return None
    
    def run_search(self, config: SearchConfiguration,
                   prompts: List[str]) -> List[SearchResult]:
        """Run hyperparameter search with specified strategy."""
        self.logger.info(f"Starting hyperparameter search with {config.search_strategy} strategy")
        
        if config.search_strategy == "grid":
            results = self.grid_search(config, prompts)
        elif config.search_strategy == "random":
            results = self.random_search(config, prompts)
        elif config.search_strategy == "bayesian":
            results = self.bayesian_search(config, prompts)
        else:
            raise ValueError(f"Unknown search strategy: {config.search_strategy}")
        
        # Sort results by score
        results.sort(key=lambda x: x.mean_score, reverse=True)
        
        self.results = results
        if results:
            self.best_config = results[0]
            self.logger.info(f"Best configuration found: {self.best_config.sampler_type} "
                           f"with score {self.best_config.mean_score:.3f}")
        
        return results
    
    def save_results(self, filepath: str):
        """Save search results to file."""
        results_data = {
            'search_metadata': {
                'timestamp': datetime.now().isoformat(),
                'total_configurations': len(self.results),
                'best_score': self.best_config.mean_score if self.best_config else None
            },
            'best_configuration': self.best_config.to_dict() if self.best_config else None,
            'all_results': [result.to_dict() for result in self.results]
        }
        
        with open(filepath, 'w') as f:
            json.dump(results_data, f, indent=2)
        
        self.logger.info(f"Results saved to {filepath}")

def load_search_configuration(config_path: str) -> SearchConfiguration:
    """Load search configuration from YAML file."""
    with open(config_path, 'r') as f:
        config_data = yaml.safe_load(f)
    
    return SearchConfiguration(**config_data)

def create_default_search_config() -> SearchConfiguration:
    """Create a default search configuration for creative writing."""
    return SearchConfiguration(
        sampler_types=["top_p", "min_p", "top_n_sigma"],
        parameter_ranges={
            "top_p": {
                "temperature": [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2],
                "top_p": [0.8, 0.85, 0.9, 0.95, 0.99],
                "max_tokens": [512]
            },
            "min_p": {
                "temperature": [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5],
                "min_p": [0.01, 0.02, 0.03, 0.05, 0.08, 0.1],
                "max_tokens": [512]
            },
            "top_n_sigma": {
                "temperature": [0.8, 1.0, 1.2, 1.5, 1.8, 2.0],
                "top_n_sigma": [0.8, 1.0, 1.2, 1.5, 2.0, 2.5],
                "max_tokens": [512]
            }
        },
        search_strategy="bayesian",
        n_iterations=50,
        samples_per_config=3,
        max_length=512
    ) 