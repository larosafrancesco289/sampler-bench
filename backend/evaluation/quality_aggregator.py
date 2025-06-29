"""Quality-focused results aggregation for frontend integration."""

import json
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

from .llm_judge import JudgmentResult

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

@dataclass
class QualityBenchmarkResults:
    """Quality-focused benchmark results for frontend."""
    # Metadata
    benchmark_name: str
    timestamp: str
    model_name: str
    
    # Samples
    samples: List[QualitySample]
    
    # Quality-only statistics
    quality_stats: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'benchmark_name': self.benchmark_name,
            'timestamp': self.timestamp,
            'model_name': self.model_name,
            'samples': [sample.to_dict() for sample in self.samples],
            'quality_stats': self.quality_stats
        }
    
    def save_json(self, filepath: Path):
        """Save results to JSON file."""
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
    
    @classmethod
    def load_json(cls, filepath: Path) -> 'QualityBenchmarkResults':
        """Load results from JSON file."""
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        # Reconstruct samples (simplified for loading)
        samples = []
        for sample_data in data['samples']:
            sample = QualitySample(
                prompt=sample_data['prompt'],
                sampler_name=sample_data['sampler_name'],
                sampler_config=sample_data['sampler_config'],
                generated_text=sample_data['generated_text'],
                word_count=sample_data['word_count'],
                judgment=None  # Simplified for now
            )
            samples.append(sample)
        
        return cls(
            benchmark_name=data['benchmark_name'],
            timestamp=data['timestamp'],
            model_name=data['model_name'],
            samples=samples,
            quality_stats=data['quality_stats']
        )

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
                             model_name: str = "Unknown") -> QualityBenchmarkResults:
        """Get complete quality benchmark results."""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        quality_stats = self.calculate_quality_stats()
        
        return QualityBenchmarkResults(
            benchmark_name=benchmark_name,
            timestamp=timestamp,
            model_name=model_name,
            samples=self.samples.copy(),
            quality_stats=quality_stats
        )
    
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