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

class EnhancedQualityAggregator:
    """Enhanced quality aggregator with proper statistical analysis."""
    
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
    
    def calculate_prompt_sampler_stats(self, samples: List[JudgmentSample]) -> PromptSamplerStats:
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
    
    def calculate_sampler_stats(self, sampler_name: str, prompt_stats: List[PromptSamplerStats]) -> SamplerStats:
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
        prompt_consistency = 10.0 - (statistics.stdev(prompt_means) if len(prompt_means) > 1 else 0.0)
        prompt_consistency = max(0.0, min(10.0, prompt_consistency))
        
        # Criterion breakdown
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
        """Calculate criterion-specific statistics for a sampler."""
        sampler_samples = [s for s in self.samples if s.sampler_name == sampler_name and s.judgment]
        
        if not sampler_samples:
            return {}
            
        # Get all criterion names
        criterion_names = set()
        for sample in sampler_samples:
            if sample.judgment.criterion_scores:
                for cs in sample.judgment.criterion_scores:
                    criterion_names.add(cs.criterion)
        
        criterion_stats = {}
        for criterion in criterion_names:
            scores = []
            for sample in sampler_samples:
                if sample.judgment.criterion_scores:
                    for cs in sample.judgment.criterion_scores:
                        if cs.criterion == criterion:
                            scores.append(cs.score)
                            break
            
            if scores:
                criterion_stats[criterion] = {
                    'mean': statistics.mean(scores),
                    'std': statistics.stdev(scores) if len(scores) > 1 else 0.0,
                    'min': min(scores),
                    'max': max(scores),
                    'count': len(scores)
                }
        
        return criterion_stats
    
    def calculate_statistical_significance(self, sampler_stats: Dict[str, SamplerStats]) -> Dict[str, Dict[str, float]]:
        """Calculate statistical significance (approximated p-values) between samplers."""
        significance = defaultdict(dict)
        
        samplers = list(sampler_stats.keys())
        for i, sampler1 in enumerate(samplers):
            for sampler2 in samplers[i+1:]:
                # Get all scores for both samplers
                scores1 = []
                scores2 = []
                
                for ps in sampler_stats[sampler1].prompt_stats:
                    scores1.extend(ps.repetition_scores)
                for ps in sampler_stats[sampler2].prompt_stats:
                    scores2.extend(ps.repetition_scores)
                
                # Approximate t-test (simplified)
                if len(scores1) > 1 and len(scores2) > 1:
                    mean1 = statistics.mean(scores1)
                    mean2 = statistics.mean(scores2)
                    std1 = statistics.stdev(scores1)
                    std2 = statistics.stdev(scores2)
                    
                    # Pooled standard error
                    se = math.sqrt((std1**2 / len(scores1)) + (std2**2 / len(scores2)))
                    
                    if se > 0:
                        t_stat = abs(mean1 - mean2) / se
                        # Rough p-value approximation (higher t = lower p)
                        p_value = max(0.001, 2.0 * math.exp(-t_stat))  # Simplified approximation
                    else:
                        p_value = 1.0
                else:
                    p_value = 1.0
                
                significance[sampler1][sampler2] = p_value
                significance[sampler2][sampler1] = p_value
        
        return dict(significance)
    
    def calculate_effect_sizes(self, sampler_stats: Dict[str, SamplerStats]) -> Dict[str, Dict[str, float]]:
        """Calculate Cohen's d effect sizes between samplers."""
        effect_sizes = defaultdict(dict)
        
        samplers = list(sampler_stats.keys())
        for i, sampler1 in enumerate(samplers):
            for sampler2 in samplers[i+1:]:
                # Get all scores for both samplers
                scores1 = []
                scores2 = []
                
                for ps in sampler_stats[sampler1].prompt_stats:
                    scores1.extend(ps.repetition_scores)
                for ps in sampler_stats[sampler2].prompt_stats:
                    scores2.extend(ps.repetition_scores)
                
                cohens_d = self.calculate_cohens_d(scores1, scores2)
                effect_sizes[sampler1][sampler2] = cohens_d
                effect_sizes[sampler2][sampler1] = -cohens_d  # Reverse sign
        
        return dict(effect_sizes)
    
    def get_enhanced_benchmark_results(self, 
                                     benchmark_name: str = "Enhanced Quality Evaluation",
                                     model_name: str = "Unknown") -> QualityBenchmarkResults:
        """Get comprehensive enhanced benchmark results."""
        
        # Group by prompt-sampler combinations
        prompt_sampler_groups = self.group_by_prompt_sampler()
        
        # Calculate prompt-sampler statistics
        sampler_prompt_stats = defaultdict(list)
        
        for (prompt, sampler), samples in prompt_sampler_groups.items():
            ps_stats = self.calculate_prompt_sampler_stats(samples)
            if ps_stats:
                sampler_prompt_stats[sampler].append(ps_stats)
        
        # Calculate overall sampler statistics
        sampler_stats = {}
        for sampler, prompt_stats in sampler_prompt_stats.items():
            sampler_stats[sampler] = self.calculate_sampler_stats(sampler, prompt_stats)
        
        # Calculate statistical comparisons
        significance = self.calculate_statistical_significance(sampler_stats)
        effect_sizes = self.calculate_effect_sizes(sampler_stats)
        
        # Meta-analysis
        best_per_prompt = {}
        all_prompts = set()
        for ps_stats in prompt_sampler_groups.keys():
            all_prompts.add(ps_stats[0])
        
        for prompt in all_prompts:
            best_score = 0.0
            best_sampler = ""
            for sampler, stats in sampler_stats.items():
                for ps in stats.prompt_stats:
                    if ps.prompt == prompt and ps.mean_score > best_score:
                        best_score = ps.mean_score
                        best_sampler = sampler
            best_per_prompt[prompt] = best_sampler
        
        # Most consistent sampler (highest prompt_consistency)
        most_consistent = max(sampler_stats.items(), key=lambda x: x[1].prompt_consistency)[0]
        
        # Highest quality sampler (highest overall_mean)
        highest_quality = max(sampler_stats.items(), key=lambda x: x[1].overall_mean)[0]
        
        return QualityBenchmarkResults(
            benchmark_name=benchmark_name,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            model_name=model_name,
            samples=self.samples.copy(),
            sampler_stats=sampler_stats,
            statistical_significance=significance,
            effect_sizes=effect_sizes,
            best_sampler_per_prompt=best_per_prompt,
            most_consistent_sampler=most_consistent,
            highest_quality_sampler=highest_quality
        )
    
    def print_enhanced_summary(self):
        """Print comprehensive enhanced summary with statistical analysis."""
        results = self.get_enhanced_benchmark_results()
        
        print(f"\n🎭 ENHANCED QUALITY EVALUATION SUMMARY")
        print(f"{'='*70}")
        print(f"📊 Model: {results.model_name}")
        print(f"📅 Timestamp: {results.timestamp}")
        print(f"📈 Total Samples: {len(results.samples)}")
        
        # Overall ranking
        ranking = sorted(results.sampler_stats.items(), key=lambda x: x[1].overall_mean, reverse=True)
        
        print(f"\n🏆 OVERALL QUALITY RANKING:")
        for rank, (sampler, stats) in enumerate(ranking, 1):
            ci_low, ci_high = stats.overall_confidence_interval
            consistency_icon = "🔸" if stats.prompt_consistency > 8.0 else "🔹"
            
            print(f"  {rank}. {sampler}: {stats.overall_mean:.2f}/10 "
                  f"[{ci_low:.2f}-{ci_high:.2f}] {consistency_icon}")
            print(f"     Consistency: {stats.prompt_consistency:.1f}/10, "
                  f"Samples: {stats.total_samples}, Prompts: {stats.prompts_covered}")
        
        # Per-prompt breakdown
        print(f"\n📋 PER-PROMPT BREAKDOWN:")
        all_prompts = set()
        for stats in results.sampler_stats.values():
            for ps in stats.prompt_stats:
                all_prompts.add(ps.prompt)
        
        for prompt in sorted(all_prompts):
            print(f"\n  📝 {prompt[:60]}...")
            prompt_results = []
            
            for sampler, stats in results.sampler_stats.items():
                for ps in stats.prompt_stats:
                    if ps.prompt == prompt:
                        prompt_results.append((sampler, ps))
            
            # Sort by mean score for this prompt
            prompt_results.sort(key=lambda x: x[1].mean_score, reverse=True)
            
            for rank, (sampler, ps) in enumerate(prompt_results, 1):
                ci_low, ci_high = ps.confidence_interval
                print(f"     {rank}. {sampler}: {ps.mean_score:.2f}/10 "
                      f"[{ci_low:.2f}-{ci_high:.2f}] (n={ps.sample_size})")
        
        # Statistical significance
        print(f"\n📊 STATISTICAL ANALYSIS:")
        print(f"  🏅 Highest Quality: {results.highest_quality_sampler}")
        print(f"  🎯 Most Consistent: {results.most_consistent_sampler}")
        
        # Effect sizes
        print(f"\n📈 EFFECT SIZES (Cohen's d):")
        for sampler1, comparisons in results.effect_sizes.items():
            for sampler2, effect_size in comparisons.items():
                if sampler1 < sampler2:  # Avoid duplicates
                    magnitude = ("Large" if abs(effect_size) > 0.8 else 
                               "Medium" if abs(effect_size) > 0.5 else "Small")
                    print(f"  {sampler1} vs {sampler2}: {effect_size:.2f} ({magnitude})")
        
        print(f"{'='*70}")
    
    def clear(self):
        """Clear all samples."""
        self.samples.clear()

# Maintain backward compatibility
QualityAggregator = EnhancedQualityAggregator

@dataclass
class QualitySample:
    """Quality-focused sample result."""
    # Core metadata
    prompt: str
    sampler_name: str
    sampler_config: Dict[str, Any]
    
    # Generated content
    generated_text: str
    word_count: int
    
    # Quality assessment (the focus)
    judgment: Optional[JudgmentResult] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API/frontend consumption."""
        result = {
            'prompt': self.prompt,
            'sampler_name': self.sampler_name,
            'sampler_config': self.sampler_config,
            'generated_text': self.generated_text,
            'word_count': self.word_count,
            'judgment': None
        }
        
        if self.judgment:
            result['judgment'] = {
                'overall_score': self.judgment.overall_score,
                'criterion_scores': [
                    {
                        'criterion': score.criterion,
                        'score': score.score,
                        'reasoning': score.reasoning
                    }
                    for score in self.judgment.criterion_scores
                ],
                'summary': self.judgment.summary,
                'evaluation_time': self.judgment.evaluation_time,
                'model_used': self.judgment.model_used
            }
        
        return result

# Old QualityBenchmarkResults class removed - using enhanced version above

class QualityAggregator:
    """Quality-focused aggregator for sampler evaluation."""
    
    def __init__(self):
        self.samples: List[QualitySample] = []
    
    def add_sample(self, 
                   prompt: str,
                   sampler_name: str,
                   sampler_config: Dict[str, Any],
                   generated_text: str,
                   judgment: Optional[JudgmentResult] = None) -> QualitySample:
        """Add a quality-focused sample result."""
        
        word_count = len(generated_text.split())
        
        sample = QualitySample(
            prompt=prompt,
            sampler_name=sampler_name,
            sampler_config=sampler_config,
            generated_text=generated_text,
            word_count=word_count,
            judgment=judgment
        )
        
        self.samples.append(sample)
        return sample
    
    def calculate_quality_stats(self) -> Dict[str, Any]:
        """Calculate comprehensive quality statistics."""
        if not self.samples:
            return {}
        
        # Filter samples with judgments
        judged_samples = [s for s in self.samples if s.judgment is not None]
        
        if not judged_samples:
            return {'message': 'No quality judgments available'}
        
        # Group by sampler
        sampler_groups = {}
        for sample in judged_samples:
            sampler_name = sample.sampler_name
            if sampler_name not in sampler_groups:
                sampler_groups[sampler_name] = []
            sampler_groups[sampler_name].append(sample)
        
        stats = {}
        for sampler_name, samples in sampler_groups.items():
            overall_scores = [s.judgment.overall_score for s in samples]
            
            # Calculate detailed criterion statistics
            criterion_stats = {}
            if samples[0].judgment.criterion_scores:
                criterion_names = [cs.criterion for cs in samples[0].judgment.criterion_scores]
                for criterion in criterion_names:
                    scores = []
                    reasonings = []
                    for sample in samples:
                        for cs in sample.judgment.criterion_scores:
                            if cs.criterion == criterion:
                                scores.append(cs.score)
                                reasonings.append(cs.reasoning)
                                break
                    
                    if scores:
                        criterion_stats[criterion] = {
                            'avg_score': sum(scores) / len(scores),
                            'min_score': min(scores),
                            'max_score': max(scores),
                            'scores': scores,
                            'sample_reasonings': reasonings[:3]  # First 3 reasonings for insight
                        }
            
            # Calculate quality consistency (how much scores vary)
            if len(overall_scores) > 1:
                mean_score = sum(overall_scores) / len(overall_scores)
                variance = sum((x - mean_score) ** 2 for x in overall_scores) / len(overall_scores)
                consistency = max(0, 10 - variance)  # Higher is more consistent
            else:
                consistency = 10.0
            
            stats[sampler_name] = {
                'sample_count': len(samples),
                'overall_quality': {
                    'avg_score': sum(overall_scores) / len(overall_scores),
                    'min_score': min(overall_scores),
                    'max_score': max(overall_scores),
                    'scores': overall_scores,
                    'consistency': consistency
                },
                'criterion_breakdown': criterion_stats,
                'sampler_config': samples[0].sampler_config,
                'judge_model': samples[0].judgment.model_used,
                'sample_summaries': [s.judgment.summary for s in samples[:3]]  # First 3 summaries
            }
        
        return stats
    
    def get_quality_ranking(self) -> List[Dict[str, Any]]:
        """Get samplers ranked by quality."""
        quality_stats = self.calculate_quality_stats()
        
        if 'message' in quality_stats:
            return []
        
        ranking = []
        for sampler_name, stats in quality_stats.items():
            ranking.append({
                'sampler_name': sampler_name,
                'avg_quality': stats['overall_quality']['avg_score'],
                'consistency': stats['overall_quality']['consistency'],
                'sample_count': stats['sample_count'],
                'config': stats['sampler_config'],
                'best_criterion': self._get_best_criterion(stats['criterion_breakdown'])
            })
        
        # Sort by average quality (descending)
        ranking.sort(key=lambda x: x['avg_quality'], reverse=True)
        
        return ranking
    
    def _get_best_criterion(self, criterion_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Get the best performing criterion for a sampler."""
        if not criterion_stats:
            return {'name': 'none', 'score': 0.0}
        
        best_criterion = max(criterion_stats.items(), key=lambda x: x[1]['avg_score'])
        return {
            'name': best_criterion[0],
            'score': best_criterion[1]['avg_score']
        }
    
    def get_benchmark_results(self, 
                             benchmark_name: str = "Quality Evaluation",
                             model_name: str = "Unknown") -> Dict[str, Any]:
        """Get quality benchmark results (legacy method)."""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        quality_stats = self.calculate_quality_stats()
        
        return {
            'benchmark_name': benchmark_name,
            'timestamp': timestamp,
            'model_name': model_name,
            'samples': [s.to_dict() for s in self.samples],
            'quality_stats': quality_stats
        }
    
    def print_quality_summary(self):
        """Print a quality-focused summary."""
        if not self.samples:
            print("No samples to summarize.")
            return
        
        print(f"\n🎭 QUALITY EVALUATION SUMMARY")
        print(f"{'='*60}")
        
        quality_stats = self.calculate_quality_stats()
        
        if 'message' not in quality_stats:
            ranking = self.get_quality_ranking()
            
            print(f"\n🏆 QUALITY RANKING:")
            for rank, sampler_data in enumerate(ranking, 1):
                consistency_indicator = "🔸" if sampler_data['consistency'] > 8 else "🔹"
                print(f"  {rank}. {sampler_data['sampler_name']}: "
                      f"{sampler_data['avg_quality']:.2f}/10 {consistency_indicator}")
                print(f"     Best at: {sampler_data['best_criterion']['name']} "
                      f"({sampler_data['best_criterion']['score']:.1f})")
                print(f"     Samples: {sampler_data['sample_count']}")
            
            print(f"\n📊 DETAILED BREAKDOWN:")
            for sampler_name, stats in quality_stats.items():
                print(f"\n  {sampler_name}:")
                print(f"    Overall: {stats['overall_quality']['avg_score']:.2f}/10 "
                      f"(consistency: {stats['overall_quality']['consistency']:.1f})")
                
                # Show top 3 criteria
                if stats['criterion_breakdown']:
                    sorted_criteria = sorted(stats['criterion_breakdown'].items(), 
                                           key=lambda x: x[1]['avg_score'], reverse=True)
                    for criterion, criterion_stats in sorted_criteria[:3]:
                        print(f"    {criterion}: {criterion_stats['avg_score']:.2f}/10")
        else:
            print(f"\n⭐ {quality_stats['message']}")
        
        print(f"{'='*60}")
    
    def clear(self):
        """Clear all samples."""
        self.samples.clear() 