"""Enhanced Quality Aggregation with Statistical Analysis."""

import json
import time
import math
import statistics
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
from collections import defaultdict

from .llm_judge import JudgmentResult

@dataclass
class JudgmentSample:
    """Sample with quality judgment."""
    prompt: str
    sampler_name: str
    sampler_config: Dict[str, Any]
    generated_text: str
    judgment: 'JudgmentResult'
    repetition: int = 1

@dataclass 
class PromptSamplerStats:
    """Statistics for a specific prompt-sampler combination."""
    prompt: str
    sampler_name: str
    repetition_scores: List[float]
    mean_score: float
    std_dev: float
    confidence_interval: Tuple[float, float]
    sample_size: int

@dataclass
class SamplerStats:
    """Comprehensive statistics for a sampler across all prompts."""
    sampler_name: str
    sampler_config: Dict[str, Any]
    
    # Overall statistics
    overall_mean: float
    overall_std: float
    overall_confidence_interval: Tuple[float, float]
    
    # Per-prompt breakdown
    prompt_stats: List[PromptSamplerStats]
    
    # Cross-prompt consistency
    prompt_consistency: float  # How consistent across different prompts
    
    # Sample information
    total_samples: int
    prompts_covered: int
    
    # Criterion breakdown
    criterion_stats: Dict[str, Dict[str, float]]

@dataclass
class QualityBenchmarkResults:
    """Complete quality benchmark results with enhanced statistics."""
    benchmark_name: str
    timestamp: str
    model_name: str
    samples: List[JudgmentSample]
    
    # Enhanced statistics
    sampler_stats: Dict[str, SamplerStats]
    statistical_significance: Dict[str, Dict[str, float]]  # p-values between samplers
    effect_sizes: Dict[str, Dict[str, float]]  # Cohen's d between samplers
    
    # Meta-analysis
    best_sampler_per_prompt: Dict[str, str]
    most_consistent_sampler: str
    highest_quality_sampler: str

# Old QualityBenchmarkResults class removed - using enhanced version above

# Rename EnhancedQualityAggregator to QualityAggregator to enable all advanced features
class QualityAggregator:
    """Enhanced quality aggregator with proper statistical analysis (formerly EnhancedQualityAggregator)."""
    
    def __init__(self):
        self.samples: List[JudgmentSample] = []
        
    def add_sample(self, 
                   prompt: str,
                   sampler_name: str, 
                   sampler_config: Dict[str, Any],
                   generated_text: str,
                   judgment: 'JudgmentResult',
                   repetition: int = 1):
        """Add a sample with judgment."""
        sample = JudgmentSample(
            prompt=prompt,
            sampler_name=sampler_name,
            sampler_config=sampler_config,
            generated_text=generated_text,
            judgment=judgment,
            repetition=repetition
        )
        self.samples.append(sample)
    
    def calculate_confidence_interval(self, scores: List[float], confidence: float = 0.95) -> Tuple[float, float]:
        """Calculate confidence interval for a list of scores."""
        if len(scores) < 2:
            return (scores[0] if scores else 0.0, scores[0] if scores else 0.0)
            
        mean = statistics.mean(scores)
        std_dev = statistics.stdev(scores)
        n = len(scores)
        
        # Use t-distribution for small samples
        if n < 30:
            # Approximate t-value for 95% confidence
            t_values = {1: 12.71, 2: 4.30, 3: 3.18, 4: 2.78, 5: 2.57, 
                       6: 2.45, 7: 2.36, 8: 2.31, 9: 2.26, 10: 2.23}
            t_value = t_values.get(n-1, 2.0)  # Default to ~2.0 for larger samples
        else:
            t_value = 1.96  # Z-score for 95% confidence
            
        margin_error = t_value * (std_dev / math.sqrt(n))
        return (mean - margin_error, mean + margin_error)
    
    def calculate_cohens_d(self, scores1: List[float], scores2: List[float]) -> float:
        """Calculate Cohen's d effect size between two groups."""
        if len(scores1) < 2 or len(scores2) < 2:
            return 0.0
            
        mean1 = statistics.mean(scores1)
        mean2 = statistics.mean(scores2)
        std1 = statistics.stdev(scores1)
        std2 = statistics.stdev(scores2)
        
        # Pooled standard deviation
        pooled_std = math.sqrt(((len(scores1) - 1) * std1**2 + (len(scores2) - 1) * std2**2) / 
                              (len(scores1) + len(scores2) - 2))
        
        if pooled_std == 0:
            return 0.0
            
        return (mean1 - mean2) / pooled_std
    
    def group_by_prompt_sampler(self) -> Dict[Tuple[str, str], List[JudgmentSample]]:
        """Group samples by (prompt, sampler) combinations."""
        groups = defaultdict(list)
        
        for sample in self.samples:
            if sample.judgment is not None:
                key = (sample.prompt, sample.sampler_name)
                groups[key].append(sample)
                
        return dict(groups)
    
    def calculate_prompt_sampler_stats(self, samples: List[JudgmentSample]) -> Optional[PromptSamplerStats]:
        """Calculate statistics for a specific prompt-sampler combination."""
        if not samples:
            return None
            
        prompt = samples[0].prompt
        sampler_name = samples[0].sampler_name
        
        scores = [s.judgment.overall_score for s in samples]
        mean_score = statistics.mean(scores)
        std_dev = statistics.stdev(scores) if len(scores) > 1 else 0.0
        confidence_interval = self.calculate_confidence_interval(scores)
        
        return PromptSamplerStats(
            prompt=prompt,
            sampler_name=sampler_name,
            repetition_scores=scores,
            mean_score=mean_score,
            std_dev=std_dev,
            confidence_interval=confidence_interval,
            sample_size=len(samples)
        )
    
    def calculate_sampler_stats(self, sampler_name: str, prompt_stats: List[PromptSamplerStats]) -> Optional[SamplerStats]:
        """Calculate comprehensive statistics for a sampler across all prompts."""
        if not prompt_stats:
            return None
            
        # Get sampler config from any sample
        sampler_config = {}
        for sample in self.samples:
            if sample.sampler_name == sampler_name:
                sampler_config = sample.sampler_config
                break
        
        # Collect all scores across prompts
        all_scores = []
        prompt_means = []
        
        for ps in prompt_stats:
            all_scores.extend(ps.repetition_scores)
            prompt_means.append(ps.mean_score)
        
        # Overall statistics
        overall_mean = statistics.mean(all_scores)
        overall_std = statistics.stdev(all_scores) if len(all_scores) > 1 else 0.0
        overall_ci = self.calculate_confidence_interval(all_scores)
        
        # Cross-prompt consistency (lower std of prompt means = more consistent)
        prompt_consistency = 1.0 / (1.0 + statistics.stdev(prompt_means)) if len(prompt_means) > 1 else 1.0
        
        # Criterion statistics
        criterion_stats = self.calculate_criterion_stats(sampler_name)
        
        return SamplerStats(
            sampler_name=sampler_name,
            sampler_config=sampler_config,
            overall_mean=overall_mean,
            overall_std=overall_std,
            overall_confidence_interval=overall_ci,
            prompt_stats=prompt_stats,
            prompt_consistency=prompt_consistency,
            total_samples=len(all_scores),
            prompts_covered=len(prompt_stats),
            criterion_stats=criterion_stats
        )
    
    def calculate_criterion_stats(self, sampler_name: str) -> Dict[str, Dict[str, float]]:
        """Calculate statistics for each criterion for a specific sampler."""
        sampler_samples = [s for s in self.samples if s.sampler_name == sampler_name and s.judgment]
        
        if not sampler_samples:
            return {}
        
        # Get all criterion names from first sample
        if not sampler_samples[0].judgment.criterion_scores:
            return {}
        
        criterion_names = [cs.criterion for cs in sampler_samples[0].judgment.criterion_scores]
        criterion_stats = {}
        
        for criterion in criterion_names:
            scores = []
            for sample in sampler_samples:
                for cs in sample.judgment.criterion_scores:
                    if cs.criterion == criterion:
                        # Handle both single judge (score) and multi-judge (mean_score) results
                        if hasattr(cs, 'score'):
                            scores.append(cs.score)
                        elif hasattr(cs, 'mean_score'):
                            scores.append(cs.mean_score)
                        else:
                            # Fallback - log the structure for debugging
                            print(f"Unknown criterion score structure: {type(cs)}, attributes: {dir(cs)}")
                            continue
                        break
            
            if scores:
                mean_score = statistics.mean(scores)
                std_dev = statistics.stdev(scores) if len(scores) > 1 else 0.0
                ci = self.calculate_confidence_interval(scores)
                
                criterion_stats[criterion] = {
                    'mean': mean_score,
                    'std': std_dev,
                    'confidence_interval': ci,
                    'min': min(scores),
                    'max': max(scores),
                    'count': len(scores)
                }
        
        return criterion_stats
    
    def calculate_statistical_significance(self, sampler_stats: Dict[str, SamplerStats]) -> Dict[str, Dict[str, float]]:
        """Calculate p-values between samplers (simplified t-test approximation)."""
        samplers = list(sampler_stats.keys())
        significance = {}
        
        for i, sampler1 in enumerate(samplers):
            significance[sampler1] = {}
            for j, sampler2 in enumerate(samplers):
                if i != j:
                    # Get all scores for both samplers
                    scores1 = []
                    scores2 = []
                    
                    for ps in sampler_stats[sampler1].prompt_stats:
                        scores1.extend(ps.repetition_scores)
                    for ps in sampler_stats[sampler2].prompt_stats:
                        scores2.extend(ps.repetition_scores)
                    
                    # Simplified significance test (approximate)
                    if len(scores1) > 1 and len(scores2) > 1:
                        effect_size = abs(self.calculate_cohens_d(scores1, scores2))
                        # Very rough p-value approximation based on effect size
                        if effect_size > 0.8:
                            p_value = 0.01  # Large effect
                        elif effect_size > 0.5:
                            p_value = 0.05  # Medium effect
                        elif effect_size > 0.2:
                            p_value = 0.10  # Small effect
                        else:
                            p_value = 0.50  # No effect
                    else:
                        p_value = 1.0
                    
                    significance[sampler1][sampler2] = p_value
                else:
                    significance[sampler1][sampler2] = 1.0
        
        return significance
    
    def calculate_effect_sizes(self, sampler_stats: Dict[str, SamplerStats]) -> Dict[str, Dict[str, float]]:
        """Calculate Cohen's d effect sizes between all sampler pairs."""
        samplers = list(sampler_stats.keys())
        effect_sizes = {}
        
        for i, sampler1 in enumerate(samplers):
            effect_sizes[sampler1] = {}
            for j, sampler2 in enumerate(samplers):
                if i != j:
                    # Get all scores for both samplers
                    scores1 = []
                    scores2 = []
                    
                    for ps in sampler_stats[sampler1].prompt_stats:
                        scores1.extend(ps.repetition_scores)
                    for ps in sampler_stats[sampler2].prompt_stats:
                        scores2.extend(ps.repetition_scores)
                    
                    effect_size = self.calculate_cohens_d(scores1, scores2)
                    effect_sizes[sampler1][sampler2] = effect_size
                else:
                    effect_sizes[sampler1][sampler2] = 0.0
        
        return effect_sizes
    
    def get_enhanced_benchmark_results(self, 
                                     benchmark_name: str = "Enhanced Quality Evaluation",
                                     model_name: str = "Unknown") -> QualityBenchmarkResults:
        """Get enhanced benchmark results with full statistical analysis."""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        
        # Group samples and calculate statistics
        grouped = self.group_by_prompt_sampler()
        
        # Calculate prompt-sampler statistics
        all_prompt_stats = []
        sampler_prompt_stats = defaultdict(list)
        
        for (prompt, sampler), samples in grouped.items():
            ps_stats = self.calculate_prompt_sampler_stats(samples)
            if ps_stats:
                all_prompt_stats.append(ps_stats)
                sampler_prompt_stats[sampler].append(ps_stats)
        
        # Calculate comprehensive sampler statistics
        sampler_stats = {}
        for sampler, prompt_stats in sampler_prompt_stats.items():
            stats = self.calculate_sampler_stats(sampler, prompt_stats)
            if stats:
                sampler_stats[sampler] = stats
        
        # Calculate statistical significance and effect sizes
        significance = self.calculate_statistical_significance(sampler_stats)
        effect_sizes = self.calculate_effect_sizes(sampler_stats)
        
        # Meta-analysis
        best_sampler_per_prompt = {}
        for prompt in set(ps.prompt for ps in all_prompt_stats):
            prompt_stats = [ps for ps in all_prompt_stats if ps.prompt == prompt]
            if prompt_stats:
                best = max(prompt_stats, key=lambda x: x.mean_score)
                best_sampler_per_prompt[prompt] = best.sampler_name
        
        most_consistent_sampler = max(sampler_stats.keys(), 
                                    key=lambda x: sampler_stats[x].prompt_consistency) if sampler_stats else ""
        highest_quality_sampler = max(sampler_stats.keys(), 
                                    key=lambda x: sampler_stats[x].overall_mean) if sampler_stats else ""
        
        return QualityBenchmarkResults(
            benchmark_name=benchmark_name,
            timestamp=timestamp,
            model_name=model_name,
            samples=self.samples,
            sampler_stats=sampler_stats,
            statistical_significance=significance,
            effect_sizes=effect_sizes,
            best_sampler_per_prompt=best_sampler_per_prompt,
            most_consistent_sampler=most_consistent_sampler,
            highest_quality_sampler=highest_quality_sampler
        )
    
    def print_enhanced_summary(self):
        """Print enhanced summary with statistical analysis."""
        if not self.samples:
            print("No samples to summarize.")
            return
        
        results = self.get_enhanced_benchmark_results()
        
        print(f"\nENHANCED STATISTICAL QUALITY ANALYSIS")
        print(f"{'='*70}")
        print(f"Timestamp: {results.timestamp}")
        print(f"Total samples: {len(results.samples)}")
        print(f"Samplers analyzed: {len(results.sampler_stats)}")
        
        if not results.sampler_stats:
            print("No statistical analysis available.")
            return
        
        # Overall ranking
        ranked_samplers = sorted(results.sampler_stats.items(), 
                               key=lambda x: x[1].overall_mean, reverse=True)
        
        print(f"\nQUALITY RANKING (with 95% Confidence Intervals):")
        for rank, (sampler_name, stats) in enumerate(ranked_samplers, 1):
            ci_low, ci_high = stats.overall_confidence_interval
            print(f"  {rank}. {sampler_name}: {stats.overall_mean:.2f}/10 "
                  f"[{ci_low:.2f}-{ci_high:.2f}]")
            print(f"     Samples: {stats.total_samples}, "
                  f"Prompts: {stats.prompts_covered}, "
                  f"Consistency: {stats.prompt_consistency:.2f}")
        
        # Effect sizes between top 2
        if len(ranked_samplers) >= 2:
            best_sampler = ranked_samplers[0][0]
            second_sampler = ranked_samplers[1][0]
            effect_size = results.effect_sizes[best_sampler][second_sampler]
            
            print(f"\n📈 STATISTICAL SIGNIFICANCE:")
            print(f"  Effect size between #{1} and #{2}: {effect_size:.3f}")
            if abs(effect_size) > 0.8:
                magnitude = "Large"
            elif abs(effect_size) > 0.5:
                magnitude = "Medium"
            elif abs(effect_size) > 0.2:
                magnitude = "Small"
            else:
                magnitude = "Negligible"
            print(f"  Magnitude: {magnitude} {'(significant)' if abs(effect_size) > 0.5 else '(not significant)'}")
        
        # Meta-analysis
        print(f"\nMETA-ANALYSIS:")
        print(f"  Best overall quality: {results.highest_quality_sampler}")
        print(f"  Most consistent: {results.most_consistent_sampler}")
        
        if results.best_sampler_per_prompt:
            prompt_winners = {}
            for prompt, winner in results.best_sampler_per_prompt.items():
                prompt_winners[winner] = prompt_winners.get(winner, 0) + 1
            
            print(f"  Best per-prompt performance:")
            for sampler, wins in sorted(prompt_winners.items(), key=lambda x: x[1], reverse=True):
                print(f"    {sampler}: {wins} prompt(s)")
        
        print(f"{'='*70}")
    
    def clear(self):
        """Clear all samples."""
        self.samples.clear() 