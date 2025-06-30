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

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from evaluation.llm_judge import CreativeWritingJudge, JudgmentResult, JudgmentScore
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
                          api_key: str = None) -> str:
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
    
    # Initialize judge
    print(f"\n⚖️ Initializing LLM judge...")
    try:
        judge = CreativeWritingJudge(api_key=api_key, model=judge_model)
        print(f"✅ Judge initialized: {judge.model}")
        print(f"📋 Evaluation criteria: {', '.join(judge.get_criteria_info().keys())}")
    except Exception as e:
        print(f"❌ Failed to initialize judge: {e}")
        print("💡 Tip: Make sure you have OPENAI_API_KEY in your .env file")
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
    
    judged_samples = []
    evaluation_failures = 0
    
    for i, sample in enumerate(valid_samples, 1):
        print(f"\n📊 Sample {i}/{len(valid_samples)}")
        print(f"   Sampler: {sample.get('sampler_name', 'unknown')}")
        print(f"   Prompt: {sample.get('prompt', 'N/A')[:60]}...")
        
        # Extract sample data
        prompt = sample.get('prompt', '')
        generated_text = sample.get('generated_text', '')
        sampler_name = sample.get('sampler_name', 'unknown')
        sampler_config = sample.get('sampler_config', {})
        
        # Judge the text
        print("   ⚖️ Judging quality...")
        try:
            start_time = time.time()
            judgment = judge.judge_text(
                text=generated_text,
                prompt=prompt,
                sampler_config={**sampler_config, 'type': sampler_name}
            )
            evaluation_time = time.time() - start_time
            
            print(f"   📊 Quality score: {judgment.overall_score:.2f}/10 ({evaluation_time:.1f}s)")
            
            # Create enhanced sample with judgment
            enhanced_sample = {
                **sample,  # Keep all original data
                'judgment': {
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
                    'evaluation_time': evaluation_time,
                    'model_used': judgment.model_used,
                    'judged_at': datetime.now().isoformat()
                }
            }
            
            judged_samples.append(enhanced_sample)
            
            # Add to aggregator for statistics
            aggregator.add_sample(
                prompt=prompt,
                sampler_name=sampler_name,
                sampler_config=sampler_config,
                generated_text=generated_text,
                judgment=judgment
            )
            
        except Exception as e:
            evaluation_failures += 1
            print(f"   ❌ Judging failed: {e}")
            
            # Keep sample without judgment
            enhanced_sample = {
                **sample,
                'judgment': None,
                'judgment_error': str(e),
                'judged_at': datetime.now().isoformat()
            }
            judged_samples.append(enhanced_sample)
        
        # Rate limiting - be gentle on OpenAI API
        time.sleep(0.5)
    
    # Create enhanced results
    enhanced_results = {
        **data,  # Keep all original metadata
        'samples': judged_samples,
        'judgment_metadata': {
            'judge_model': judge.model,
            'judged_at': datetime.now().isoformat(),
            'total_samples': len(valid_samples),
            'successfully_judged': len(valid_samples) - evaluation_failures,
            'judgment_failures': evaluation_failures,
            'original_results_file': results_file
        }
    }
    
    # Add quality statistics
    try:
        benchmark_results = aggregator.get_benchmark_results(
            benchmark_name=data.get('benchmark_name', 'Creative Writing Benchmark'),
            model_name=data.get('model_name', 'Unknown')
        )
        
        enhanced_results['quality_statistics'] = {
            'overall_stats': benchmark_results.quality_stats,
            'sampler_ranking': aggregator.get_quality_ranking()
        }
        
    except Exception as e:
        print(f"⚠️ Could not generate quality statistics: {e}")
        
        # Provide empty structure to keep JSON schema stable
        enhanced_results['quality_statistics'] = {
            'overall_stats': {},
            'sampler_ranking': []
        }
    
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
    
    # Print quality ranking if available
    if 'quality_statistics' in enhanced_results:
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
        api_key=args.api_key
    )
    
    if judged_file:
        print(f"\n🎉 Judging completed successfully!")
        print(f"📁 Enhanced results file: {judged_file}")
    else:
        print(f"\n💥 Judging failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 