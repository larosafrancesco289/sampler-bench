"""
Apply LLM-as-a-Judge evaluation to existing benchmark results.
This script loads existing JSON results and evaluates them for quality.
"""

import json
import sys
import time
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

from evaluation.llm_judge import CreativeWritingJudge
from evaluation.aggregator import ResultsAggregator, SampleResult

def load_existing_results(filepath):
    """Load existing benchmark results from JSON file."""
    with open(filepath, 'r') as f:
        data = json.load(f)
    return data

def convert_to_sample_results(data, judge):
    """Convert existing data to SampleResult objects with judging."""
    samples = []
    aggregator = ResultsAggregator()
    
    # Extract samples from the data
    sample_data = []
    
    if 'samples' in data:
        # New format with samples array
        sample_data = data['samples']
    elif 'preset_results' in data:
        # Rigorous results format with preset_results
        for sampler_name, sampler_data in data['preset_results'].items():
            config = sampler_data.get('config', {})
            samples = sampler_data.get('samples', [])
            
            for sample in samples:
                sample_data.append({
                    'sampler_name': sampler_name,
                    'sampler_config': config.get('parameters', {}),
                    **sample
                })
    else:
        # Old format - convert from grouped structure
        for sampler_name, sampler_results in data.items():
            if isinstance(sampler_results, dict) and 'results' in sampler_results:
                for result in sampler_results['results']:
                    sample_data.append({
                        'sampler_name': sampler_name,
                        'sampler_config': sampler_results.get('config', {}),
                        **result
                    })
    
    print(f"Found {len(sample_data)} samples to evaluate")
    
    # Process each sample
    for i, sample in enumerate(sample_data, 1):
        print(f"\n🔍 Evaluating sample {i}/{len(sample_data)}")
        print(f"   Sampler: {sample.get('sampler_name', 'unknown')}")
        print(f"   Prompt: {sample.get('prompt', 'N/A')[:50]}...")
        
        # Extract sample data
        prompt = sample.get('prompt', '')
        generated_text = sample.get('text', sample.get('generated_text', ''))
        sampler_name = sample.get('sampler_name', 'unknown')
        sampler_config = sample.get('sampler_config', {})
        
        if not generated_text:
            print("   ⚠️ No generated text found, skipping...")
            continue
        
        # Get performance metrics
        word_count = sample.get('word_count', len(generated_text.split()))
        generation_time = sample.get('generation_time', 0)
        tokens_per_second = sample.get('tokens_per_second', 0)
        
        # Judge the text
        print("   ⚖️ Judging quality...")
        try:
            judgment = judge.judge_text(
                text=generated_text,
                prompt=prompt,
                sampler_config={**sampler_config, 'type': sampler_name}
            )
            print(f"   📊 Quality score: {judgment.overall_score:.2f}/10")
            
            # Add to aggregator
            aggregator.add_sample(
                prompt=prompt,
                sampler_config=sampler_config,
                sampler_name=sampler_name,
                model_name="llama_3_1_8b",
                generated_text=generated_text,
                generation_time=generation_time,
                tokens_per_second=tokens_per_second,
                judgment=judgment
            )
            
        except Exception as e:
            print(f"   ❌ Judging failed: {e}")
            # Still add sample without judgment
            aggregator.add_sample(
                prompt=prompt,
                sampler_config=sampler_config,
                sampler_name=sampler_name,
                model_name="llama_3_1_8b",
                generated_text=generated_text,
                generation_time=generation_time,
                tokens_per_second=tokens_per_second,
                judgment=None
            )
        
        # Brief pause to respect API rate limits
        time.sleep(0.5)
    
    return aggregator

def main():
    """Main function to judge existing results."""
    print("🎭 LLM Judge for Existing Results")
    print("=" * 50)
    
    # Get the latest results file
    result_files = list(Path(".").glob("creative_writing_rigorous_results_*.json"))
    if not result_files:
        # Fallback to other JSON files
        result_files = [
            Path("creative_writing_results.json"),
            Path("llama_3_1_8b_test_results.json")
        ]
        result_files = [f for f in result_files if f.exists()]
    
    if not result_files:
        print("❌ No result files found!")
        return
    
    # Use the most recent file
    latest_file = max(result_files, key=lambda x: x.stat().st_mtime)
    print(f"📂 Loading results from: {latest_file}")
    
    # Load existing results
    try:
        data = load_existing_results(latest_file)
        print(f"✅ Loaded results from {latest_file}")
    except Exception as e:
        print(f"❌ Failed to load results: {e}")
        return
    
    # Initialize judge
    try:
        judge = CreativeWritingJudge()
        print(f"⚖️ Judge initialized: {judge.model}")
    except Exception as e:
        print(f"❌ Failed to initialize judge: {e}")
        print("📝 Note: Make sure you have OPENAI_API_KEY in your .env file")
        return
    
    # Convert and judge samples
    aggregator = convert_to_sample_results(data, judge)
    
    # Print comprehensive results
    aggregator.print_summary()
    
    # Save enhanced results
    results_dir = Path("results")
    results_dir.mkdir(exist_ok=True)
    
    benchmark_results = aggregator.get_benchmark_results(
        benchmark_name="Creative Writing with Quality Evaluation",
        model_name="llama_3_1_8b"
    )
    
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    results_file = results_dir / f"judged_results_{timestamp}.json"
    benchmark_results.save_json(results_file)
    
    print(f"\n💾 Enhanced results saved to: {results_file}")
    
    # Quality ranking
    quality_stats = aggregator.calculate_quality_stats()
    if 'message' not in quality_stats:
        print(f"\n🏆 QUALITY RANKING:")
        sorted_samplers = sorted(quality_stats.items(), 
                               key=lambda x: x[1]['avg_overall_score'], 
                               reverse=True)
        
        for rank, (sampler_name, stats) in enumerate(sorted_samplers, 1):
            print(f"  {rank}. {sampler_name}: {stats['avg_overall_score']:.2f}/10 (n={stats['count']})")
    
    # Performance ranking  
    perf_stats = aggregator.calculate_performance_stats()
    print(f"\n🚀 SPEED RANKING:")
    sorted_perf = sorted(perf_stats.items(), 
                        key=lambda x: x[1]['avg_speed'], 
                        reverse=True)
    
    for rank, (sampler_name, stats) in enumerate(sorted_perf, 1):
        print(f"  {rank}. {sampler_name}: {stats['avg_speed']:.1f} tok/s (n={stats['count']})")
    
    # Combined ranking (quality + speed)
    print(f"\n🎯 COMBINED RANKING (Quality × Speed):")
    combined_stats = {}
    for sampler_name in quality_stats.keys():
        if sampler_name in perf_stats:
            quality_score = quality_stats[sampler_name]['avg_overall_score']
            speed_score = perf_stats[sampler_name]['avg_speed'] / 100  # Normalize speed
            combined_score = quality_score * speed_score
            combined_stats[sampler_name] = {
                'combined_score': combined_score,
                'quality': quality_score,
                'speed': perf_stats[sampler_name]['avg_speed']
            }
    
    if combined_stats:
        sorted_combined = sorted(combined_stats.items(), 
                               key=lambda x: x[1]['combined_score'], 
                               reverse=True)
        
        for rank, (sampler_name, stats) in enumerate(sorted_combined, 1):
            print(f"  {rank}. {sampler_name}: {stats['combined_score']:.2f} "
                  f"(Q:{stats['quality']:.1f} × S:{stats['speed']:.0f})")

if __name__ == "__main__":
    main() 