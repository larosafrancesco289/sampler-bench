"""Results aggregation module for combining generation stats with judgment scores."""

import json
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

from .llm_judge import JudgmentResult

@dataclass
class SampleResult:
    """Combined result for a single generated sample."""
    # Generation metadata
    prompt: str
    sampler_config: Dict[str, Any]
    sampler_name: str
    model_name: str
    
    # Generated content
    generated_text: str
    word_count: int
    generation_time: float
    tokens_per_second: float
    
    # Quality assessment
    judgment: Optional[JudgmentResult] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        result = asdict(self)
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

@dataclass
class BenchmarkResults:
    """Aggregated results for a complete benchmark run."""
    # Metadata
    benchmark_name: str
    timestamp: str
    model_name: str
    
    # Sample results
    samples: List[SampleResult]
    
    # Aggregated statistics
    performance_stats: Dict[str, Any]
    quality_stats: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'benchmark_name': self.benchmark_name,
            'timestamp': self.timestamp,
            'model_name': self.model_name,
            'samples': [sample.to_dict() for sample in self.samples],
            'performance_stats': self.performance_stats,
            'quality_stats': self.quality_stats
        }
    
    def save_json(self, filepath: Path):
        """Save results to JSON file."""
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
    
    @classmethod
    def load_json(cls, filepath: Path) -> 'BenchmarkResults':
        """Load results from JSON file."""
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        # Reconstruct samples
        samples = []
        for sample_data in data['samples']:
            judgment = None
            if sample_data.get('judgment'):
                judgment_data = sample_data['judgment']
                judgment = JudgmentResult(
                    overall_score=judgment_data['overall_score'],
                    criterion_scores=[],  # Simplified for loading
                    summary=judgment_data['summary'],
                    evaluation_time=judgment_data['evaluation_time'],
                    model_used=judgment_data['model_used']
                )
            
            sample = SampleResult(
                prompt=sample_data['prompt'],
                sampler_config=sample_data['sampler_config'],
                sampler_name=sample_data['sampler_name'],
                model_name=sample_data['model_name'],
                generated_text=sample_data['generated_text'],
                word_count=sample_data['word_count'],
                generation_time=sample_data['generation_time'],
                tokens_per_second=sample_data['tokens_per_second'],
                judgment=judgment
            )
            samples.append(sample)
        
        return cls(
            benchmark_name=data['benchmark_name'],
            timestamp=data['timestamp'],
            model_name=data['model_name'],
            samples=samples,
            performance_stats=data['performance_stats'],
            quality_stats=data['quality_stats']
        )

class ResultsAggregator:
    """Aggregates generation results with judgment scores."""
    
    def __init__(self):
        self.results: List[SampleResult] = []
    
    def add_sample(self, 
                   prompt: str,
                   sampler_config: Dict[str, Any],
                   sampler_name: str,
                   model_name: str,
                   generated_text: str,
                   generation_time: float,
                   tokens_per_second: float,
                   judgment: Optional[JudgmentResult] = None) -> SampleResult:
        """Add a sample result."""
        
        # Calculate word count
        word_count = len(generated_text.split())
        
        sample = SampleResult(
            prompt=prompt,
            sampler_config=sampler_config,
            sampler_name=sampler_name,
            model_name=model_name,
            generated_text=generated_text,
            word_count=word_count,
            generation_time=generation_time,
            tokens_per_second=tokens_per_second,
            judgment=judgment
        )
        
        self.results.append(sample)
        return sample
    
    def calculate_performance_stats(self) -> Dict[str, Any]:
        """Calculate aggregated performance statistics."""
        if not self.results:
            return {}
        
        # Group by sampler
        sampler_groups = {}
        for sample in self.results:
            sampler_name = sample.sampler_name
            if sampler_name not in sampler_groups:
                sampler_groups[sampler_name] = []
            sampler_groups[sampler_name].append(sample)
        
        stats = {}
        for sampler_name, samples in sampler_groups.items():
            speeds = [s.tokens_per_second for s in samples]
            word_counts = [s.word_count for s in samples]
            generation_times = [s.generation_time for s in samples]
            
            stats[sampler_name] = {
                'count': len(samples),
                'avg_speed': sum(speeds) / len(speeds),
                'min_speed': min(speeds),
                'max_speed': max(speeds),
                'avg_words': sum(word_counts) / len(word_counts),
                'avg_generation_time': sum(generation_times) / len(generation_times),
                'config': samples[0].sampler_config if samples else {}
            }
        
        return stats
    
    def calculate_quality_stats(self) -> Dict[str, Any]:
        """Calculate aggregated quality statistics."""
        if not self.results:
            return {}
        
        # Filter samples with judgments
        judged_samples = [s for s in self.results if s.judgment is not None]
        
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
            
            # Calculate criterion averages
            criterion_stats = {}
            if samples[0].judgment.criterion_scores:
                criterion_names = [cs.criterion for cs in samples[0].judgment.criterion_scores]
                for criterion in criterion_names:
                    scores = []
                    for sample in samples:
                        for cs in sample.judgment.criterion_scores:
                            if cs.criterion == criterion:
                                scores.append(cs.score)
                                break
                    if scores:
                        criterion_stats[criterion] = {
                            'avg': sum(scores) / len(scores),
                            'min': min(scores),
                            'max': max(scores)
                        }
            
            stats[sampler_name] = {
                'count': len(samples),
                'avg_overall_score': sum(overall_scores) / len(overall_scores),
                'min_overall_score': min(overall_scores),
                'max_overall_score': max(overall_scores),
                'criterion_stats': criterion_stats,
                'judge_model': samples[0].judgment.model_used if samples else 'unknown'
            }
        
        return stats
    
    def get_benchmark_results(self, 
                             benchmark_name: str = "Creative Writing Benchmark",
                             model_name: str = "Unknown") -> BenchmarkResults:
        """Get complete benchmark results."""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        
        performance_stats = self.calculate_performance_stats()
        quality_stats = self.calculate_quality_stats()
        
        return BenchmarkResults(
            benchmark_name=benchmark_name,
            timestamp=timestamp,
            model_name=model_name,
            samples=self.results.copy(),
            performance_stats=performance_stats,
            quality_stats=quality_stats
        )
    
    def print_summary(self):
        """Print a summary of the results."""
        if not self.results:
            print("No results to summarize.")
            return
        
        print(f"\n📊 BENCHMARK SUMMARY")
        print(f"{'='*60}")
        
        # Performance summary
        perf_stats = self.calculate_performance_stats()
        print(f"\n🚀 PERFORMANCE STATS:")
        for sampler_name, stats in perf_stats.items():
            print(f"  {sampler_name}:")
            print(f"    Average Speed: {stats['avg_speed']:.1f} tok/s")
            print(f"    Average Words: {stats['avg_words']:.1f}")
            print(f"    Samples: {stats['count']}")
        
        # Quality summary
        quality_stats = self.calculate_quality_stats()
        if 'message' not in quality_stats:
            print(f"\n⭐ QUALITY STATS:")
            for sampler_name, stats in quality_stats.items():
                print(f"  {sampler_name}:")
                print(f"    Overall Score: {stats['avg_overall_score']:.2f}/10")
                print(f"    Samples Judged: {stats['count']}")
                
                # Top criterion
                if stats['criterion_stats']:
                    best_criterion = max(stats['criterion_stats'].items(), 
                                       key=lambda x: x[1]['avg'])
                    print(f"    Best Criterion: {best_criterion[0]} ({best_criterion[1]['avg']:.2f})")
        else:
            print(f"\n⭐ QUALITY STATS: {quality_stats['message']}")
        
        print(f"{'='*60}")
    
    def clear(self):
        """Clear all results."""
        self.results.clear() 