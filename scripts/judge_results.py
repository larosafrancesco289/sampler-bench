#!/usr/bin/env python3
"""
Results Judging Script
Evaluates existing benchmark results for quality using LLM-as-a-Judge.
Decoupled from generation to allow independent re-evaluation.
"""

import json
import time
import argparse
import sys
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import random
import os

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from evaluation.llm_judge import CreativeWritingJudge, JudgmentResult, JudgmentScore
from evaluation.multi_judge import create_judge
from evaluation.quality_aggregator import QualityAggregator

def load_benchmark_results(filepath: str) -> Dict[str, Any]:
    """Load benchmark results from JSON file."""
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise Exception(f"Failed to load results file: {e}")

def judge_benchmark_results(results_file: str, 
                          output_dir: str = "results",
                          judge_model: str = None,
                          api_key: str = None,
                          config_file: str = None) -> str:
    """
    Judge existing benchmark results and save enhanced results.
    
    Args:
        results_file: Path to the benchmark results JSON file
        output_dir: Directory to save judged results
        judge_model: OpenAI model to use for judging (optional)
        api_key: OpenAI API key (optional, can use .env)
    
    Returns:
        Path to the saved judged results file
    """
    
    print("⚖️ Starting Results Judging")
    print("=" * 50)
    print(f"📁 Results file: {results_file}")
    
    # Load existing results
    print(f"\n📂 Loading benchmark results...")
    try:
        data = load_benchmark_results(results_file)
        print(f"✅ Loaded {len(data.get('samples', []))} samples")
    except Exception as e:
        print(f"❌ Failed to load results: {e}")
        return None
    
    # Explicitly disable penalties to avoid muddling quality scores in full benchmark outputs
    # (Instruction adherence can be visualized separately in the dashboard.)
    penalty_config = None
    
    # Initialize judge (multi-judge if enabled, single judge otherwise)
    print(f"\n⚖️ Initializing judge system...")
    try:
        judge = create_judge()  # Auto-detects multi-judge mode from environment
        
        # Check if it's multi-judge or single judge
        if hasattr(judge, 'judge_models'):
            print(f"✅ Multi-judge initialized with {len(judge.judge_models)} judges:")
            for i, model in enumerate(judge.judge_models, 1):
                print(f"   {i}. {model}")
            print(f"📊 Consensus method: {judge.consensus_method}")
        else:
            print(f"✅ Single judge initialized: {judge.model}")
        
        print(f"📋 Evaluation criteria: {', '.join(judge.get_criteria_info().keys())}")
    except Exception as e:
        print(f"❌ Failed to initialize judge: {e}")
        print("💡 Tip: Make sure you have OPENROUTER_API_KEY in your .env file for multi-judge")
        print("💡 Or OPENAI_API_KEY for single-judge mode")
        return None
    
    # Initialize aggregator for quality tracking
    aggregator = QualityAggregator()
    
    # Process samples
    samples = data.get('samples', [])
    valid_samples = [s for s in samples if s.get('generated_text') is not None]
    failed_samples = len(samples) - len(valid_samples)
    
    if failed_samples > 0:
        print(f"⚠️ Skipping {failed_samples} failed generation samples")
    
    print(f"\n🔍 Evaluating {len(valid_samples)} valid samples...")

    # Deterministic evaluation order if configured via environment variable
    order_seed_env = os.getenv('EVALUATION_ORDER_SEED') or os.getenv('evaluation_order_seed')
    if order_seed_env is not None:
        try:
            order_seed = int(order_seed_env)
            rnd = random.Random(order_seed)
            rnd.shuffle(valid_samples)
            print(f"   🔒 Using deterministic evaluation order with seed {order_seed}")
        except ValueError:
            print(f"   ⚠️ Invalid EVALUATION_ORDER_SEED: {order_seed_env}")
    
    judged_samples = []
    evaluation_failures = 0
    
    # Prepare samples for batch judging
    batch_samples = []
    for sample in valid_samples:
        prompt = sample.get('prompt', '')
        generated_text = sample.get('generated_text', '')
        sampler_name = sample.get('sampler_name', 'unknown')
        sampler_config = sample.get('sampler_config', {})
        
        batch_samples.append({
            'text': generated_text,
            'prompt': prompt,
            'sampler_config': {**sampler_config, 'type': sampler_name},
            'original_sample': sample  # Keep reference to original
        })
    
    print(f"\n⚖️ Judging {len(batch_samples)} samples using batched evaluation...")
    
    # Progress callback for batch processing
    def progress_callback(completed, total):
        print(f"   📊 Progress: {completed}/{total} samples evaluated...")
    
    try:
        # Get max concurrent evaluations from environment (default to 5)
        max_concurrent = int(os.getenv('MAX_CONCURRENT_EVALUATIONS', '5'))
        
        # Handle both multi-judge and single-judge evaluation
        if hasattr(judge, 'judge_models'):
            # Multi-judge evaluation with sample-level parallelization
            print(f"   Using multi-judge evaluation with {max_concurrent} concurrent samples...")
            judgments = [None] * len(batch_samples)  # Pre-allocate list to maintain order
            
            def evaluate_sample(index_and_sample):
                i, batch_sample = index_and_sample
                try:
                    judgment = judge.evaluate_text(
                        text=batch_sample['text'],
                        prompt=batch_sample['prompt'],
                        sampler_config=batch_sample['sampler_config'],
                        penalty_config=None  # penalties disabled for full-benchmark scoring
                    )
                    return i, judgment
                except Exception as e:
                    print(f"   ❌ Error evaluating sample {i+1}: {e}")
                    return i, None
            
            # Process samples in parallel
            with ThreadPoolExecutor(max_workers=max_concurrent) as executor:
                # Submit all tasks
                future_to_index = {
                    executor.submit(evaluate_sample, (i, sample)): i 
                    for i, sample in enumerate(batch_samples)
                }
                
                completed = 0
                for future in as_completed(future_to_index):
                    index, judgment = future.result()
                    judgments[index] = judgment
                    completed += 1
                    progress_callback(completed, len(batch_samples))
            
            # Filter out None results (failed evaluations)
            valid_judgments = [j for j in judgments if j is not None]
            if len(valid_judgments) != len(judgments):
                print(f"   ⚠️  Warning: {len(judgments) - len(valid_judgments)} samples failed evaluation")
            judgments = valid_judgments
            
        else:
            # Single-judge batch evaluation
            print(f"   Using single-judge batch evaluation...")
            judgments = judge.judge_batch(
                samples=batch_samples,
                batch_size=5,  # Process 5 samples per API call
                progress_callback=progress_callback
            )
        
        print(f"\n✅ Completed evaluation of {len(judgments)} samples")
        
        # Process the judgment results (unified handling for both judge types)
        for i, (judgment, batch_sample) in enumerate(zip(judgments, batch_samples)):
            original_sample = batch_sample['original_sample']
            
            print(f"\n📊 Sample {i+1}/{len(valid_samples)}")
            print(f"   Sampler: {original_sample.get('sampler_name', 'unknown')}")
            print(f"   Prompt: {original_sample.get('prompt', 'N/A')[:60]}...")
            print(f"   📊 Quality score: {judgment.overall_score:.2f}/10")
            
            # Handle different result structures (multi-judge vs single-judge)
            if hasattr(judge, 'judge_models'):
                # Multi-judge result structure
                judgment_data = {
                    'overall_score': judgment.overall_score,
                    'overall_std': judgment.overall_std,
                    'criterion_scores': [
                        {
                            'criterion': cs.criterion,
                            'score': cs.mean_score,
                            'std': cs.std_score,
                            'reasoning': f"Consensus across {len(cs.judge_models)} judges",
                            'individual_scores': cs.individual_scores,
                            'consensus_strength': cs.consensus_strength
                        }
                        for cs in judgment.criterion_scores
                    ],
                    'summary': judgment.summary,
                    'evaluation_time': judgment.evaluation_time,
                    'judge_models': judgment.judge_models,
                    'judge_count': judgment.judge_count,
                    'consensus_method': judgment.consensus_method,
                    'individual_results': judgment.individual_results,
                    'judged_at': datetime.now().isoformat()
                }
            else:
                # Single-judge result structure
                judgment_data = {
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
                    'evaluation_time': judgment.evaluation_time,
                    'model_used': judgment.model_used,
                    'judged_at': datetime.now().isoformat()
                }
            
            # Create enhanced sample with judgment
            enhanced_sample = {
                **original_sample,  # Keep all original data
                'judgment': judgment_data
            }
            
            judged_samples.append(enhanced_sample)
            
            # Add to aggregator for statistics  
            aggregator.add_sample(
                prompt=batch_sample['prompt'],
                sampler_name=original_sample.get('sampler_name', 'unknown'),
                sampler_config=batch_sample['sampler_config'],
                generated_text=batch_sample['text'],
                judgment=judgment,
                repetition=original_sample.get('repetition', 1)
            )
    
    except Exception as e:
        evaluation_failures = len(valid_samples)
        print(f"   ❌ Batch judging failed: {e}")
        print(f"   📉 Using fallback: no quality scores will be available")
        
        # Keep samples without judgment
        for sample in valid_samples:
            enhanced_sample = {
                **sample,
                'judgment': None,
                'judgment_error': str(e),
                'judged_at': datetime.now().isoformat()
            }
            judged_samples.append(enhanced_sample)
    
    # Create enhanced results
    enhanced_results = {
        **data,  # Keep all original metadata
        'samples': judged_samples,
        'judgment_metadata': {
            'judge_type': 'multi_judge' if hasattr(judge, 'judge_models') else 'single_judge',
            'judge_model': getattr(judge, 'judge_models', [getattr(judge, 'model', 'unknown')]),
            'judge_count': getattr(judge, 'judge_count', 1),
            'consensus_method': getattr(judge, 'consensus_method', 'single'),
            'judged_at': datetime.now().isoformat(),
            'total_samples': len(valid_samples),
            'successfully_judged': len(valid_samples) - evaluation_failures,
            'judgment_failures': evaluation_failures,
            'original_results_file': results_file
        }
    }
    
    # Add enhanced quality statistics
    try:
        benchmark_results = aggregator.get_enhanced_benchmark_results(
            benchmark_name=data.get('benchmark_name', 'Creative Writing Benchmark'),
            model_name=data.get('model_name', 'Unknown')
        )
        
        # Extract traditional format for compatibility
        sampler_ranking = []
        for sampler, stats in benchmark_results.sampler_stats.items():
            sampler_ranking.append({
                'sampler_name': sampler,
                'avg_quality': stats.overall_mean,
                'consistency': stats.prompt_consistency,
                'sample_count': stats.total_samples,
                'config': stats.sampler_config
            })
        sampler_ranking.sort(key=lambda x: x['avg_quality'], reverse=True)
        
        enhanced_results['quality_statistics'] = {
            'overall_stats': {sampler: {
                'overall_quality': {'avg_score': stats.overall_mean, 'consistency': stats.prompt_consistency},
                'sample_count': stats.total_samples,
                'sampler_config': stats.sampler_config
            } for sampler, stats in benchmark_results.sampler_stats.items()},
            'sampler_ranking': sampler_ranking
        }
        
        # Enhanced statistics
        enhanced_results['enhanced_statistics'] = {
            'sampler_stats': {sampler: {
                'overall_mean': stats.overall_mean,
                'overall_std': stats.overall_std,
                'confidence_interval': stats.overall_confidence_interval,
                'prompt_consistency': stats.prompt_consistency,
                'total_samples': stats.total_samples,
                'prompts_covered': stats.prompts_covered,
                'criterion_stats': stats.criterion_stats
            } for sampler, stats in benchmark_results.sampler_stats.items()},
            'effect_sizes': benchmark_results.effect_sizes,
            'statistical_significance': benchmark_results.statistical_significance,
            'best_sampler_per_prompt': benchmark_results.best_sampler_per_prompt,
            'most_consistent_sampler': benchmark_results.most_consistent_sampler,
            'highest_quality_sampler': benchmark_results.highest_quality_sampler
        }
        
    except Exception as e:
        print(f"⚠️ Could not generate quality statistics: {e}")
        import traceback
        traceback.print_exc()
        
        # Provide empty structure to keep JSON schema stable
        enhanced_results['quality_statistics'] = {
            'overall_stats': {},
            'sampler_ranking': []
        }
        enhanced_results['enhanced_statistics'] = {}
    
    # Save enhanced results
    Path(output_dir).mkdir(exist_ok=True)
    
    # Extract model name and create clean filename
    model_name = data.get('model_name', 'unknown')
    clean_model_name = model_name.replace("-", "").replace(".", "").replace("_", "")
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    
    enhanced_filename = f"{clean_model_name}_judged_{timestamp}.json"
    enhanced_filepath = Path(output_dir) / enhanced_filename
    
    with open(enhanced_filepath, 'w') as f:
        json.dump(enhanced_results, f, indent=2)
    
    print(f"\n💾 Enhanced results saved to: {enhanced_filepath}")
    print(f"📊 Judgment Summary:")
    print(f"   ✅ Successfully judged: {len(valid_samples) - evaluation_failures}")
    print(f"   ❌ Judgment failures: {evaluation_failures}")
    print(f"   📈 Success rate: {((len(valid_samples) - evaluation_failures) / len(valid_samples) * 100):.1f}%")
    
    # Print enhanced quality analysis if available
    if 'enhanced_statistics' in enhanced_results and enhanced_results['enhanced_statistics']:
        print(f"\n🎭 ENHANCED QUALITY ANALYSIS:")
        enhanced_stats = enhanced_results['enhanced_statistics']
        
        # Overall ranking with confidence intervals
        print(f"\n🏆 QUALITY RANKING (with 95% confidence intervals):")
        ranking = enhanced_results['quality_statistics']['sampler_ranking']
        for rank, sampler_data in enumerate(ranking, 1):
            sampler_name = sampler_data['sampler_name']
            if sampler_name in enhanced_stats['sampler_stats']:
                stats = enhanced_stats['sampler_stats'][sampler_name]
                ci_low, ci_high = stats['confidence_interval']
                consistency_icon = "🔸" if stats['prompt_consistency'] > 8.0 else "🔹"
                
                print(f"   {rank}. {sampler_name}: {stats['overall_mean']:.2f}/10 "
                      f"[{ci_low:.2f}-{ci_high:.2f}] {consistency_icon}")
                print(f"      Consistency: {stats['prompt_consistency']:.1f}/10, "
                      f"Samples: {stats['total_samples']}")
        
        # Best performers analysis
        print(f"\n📊 PERFORMANCE INSIGHTS:")
        print(f"   🏅 Highest Quality: {enhanced_stats['highest_quality_sampler']}")
        print(f"   🎯 Most Consistent: {enhanced_stats['most_consistent_sampler']}")
        
        # Per-prompt winners
        print(f"\n📝 BEST SAMPLER PER PROMPT:")
        for prompt, best_sampler in enhanced_stats['best_sampler_per_prompt'].items():
            print(f"   • {prompt[:50]}... → {best_sampler}")
        
    elif 'quality_statistics' in enhanced_results:
        # Fallback to basic ranking
        print(f"\n🏆 QUALITY RANKING:")
        ranking = enhanced_results['quality_statistics']['sampler_ranking']
        for rank, sampler_data in enumerate(ranking, 1):
            print(f"   {rank}. {sampler_data['sampler_name']}: {sampler_data['avg_quality']:.2f}/10")
    
    return str(enhanced_filepath)

def find_latest_results_file(directory: str = "results") -> str:
    """Find the most recent benchmark results file."""
    results_dir = Path(directory)
    if not results_dir.exists():
        return None
    
    # Look for benchmark results files
    benchmark_files = list(results_dir.glob("benchmark_results_*.json"))
    
    if not benchmark_files:
        # Fallback to any JSON files
        benchmark_files = [f for f in results_dir.glob("*.json") 
                          if not f.name.startswith("judged_")]
    
    if not benchmark_files:
        return None
    
    # Return the most recent file
    latest_file = max(benchmark_files, key=lambda x: x.stat().st_mtime)
    return str(latest_file)

def main():
    """Main function with command line interface."""
    parser = argparse.ArgumentParser(description="Judge benchmark results for quality")
    parser.add_argument("results_file", 
                       nargs="?",
                       help="Path to benchmark results JSON file (optional)")
    parser.add_argument("--output-dir", "-o",
                       default="results",
                       help="Output directory (default: results)")
    parser.add_argument("--judge-model", "-j",
                       help="OpenAI model for judging (e.g., gpt-4o-mini)")
    parser.add_argument("--api-key", "-k",
                       help="OpenAI API key (optional if in .env)")
    parser.add_argument("--auto-find", "-a",
                       action="store_true",
                       help="Automatically find the latest results file")
    parser.add_argument("--config", "-c",
                       help="Configuration file for penalty settings")
    
    args = parser.parse_args()
    
    # Determine results file
    results_file = args.results_file
    
    if not results_file and args.auto_find:
        results_file = find_latest_results_file()
        if results_file:
            print(f"🔍 Auto-found latest results file: {results_file}")
        else:
            print("❌ No results files found in results/ directory")
            sys.exit(1)
    
    if not results_file:
        print("❌ No results file specified")
        print("💡 Usage: python judge_results.py <results_file.json>")
        print("💡 Or use --auto-find to find the latest file automatically")
        sys.exit(1)
    
    if not Path(results_file).exists():
        print(f"❌ Results file not found: {results_file}")
        sys.exit(1)
    
    # Run judging
    judged_file = judge_benchmark_results(
        results_file=results_file,
        output_dir=args.output_dir,
        judge_model=args.judge_model,
        api_key=args.api_key,
        config_file=args.config
    )
    
    if judged_file:
        print(f"\n🎉 Judging completed successfully!")
        print(f"📁 Enhanced results file: {judged_file}")
    else:
        print(f"\n💥 Judging failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 