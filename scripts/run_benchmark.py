#!/usr/bin/env python3
"""
Benchmark Runner Script
Generates text samples using different sampling strategies and saves results for later evaluation.
Decoupled from judging to allow independent re-runs.
"""

import json
import time
import argparse
import sys
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from api.quality_api import SamplerBenchAPI

def load_prompts_from_config() -> List[str]:
    """Load prompts from experiments config or use defaults."""
    # Fallback prompts
    return [
        # Curated high-quality creative writing prompts for reproducible benchmarking
        "Write a short story about a mysterious package that appears on someone's doorstep one rainy evening.",
        "Write a story about two strangers who meet during a citywide power outage and discover an unexpected connection.",
        "Write a tale about a character who suddenly discovers they can hear other people's thoughts for exactly 24 hours.",
        "Write a story about someone who finds an old diary that seems to predict future events with disturbing accuracy.",
        "Write a short story about a small town where all the residents have agreed never to mention a particular year.",
        "Write a story about a librarian who discovers that books in their library are rewriting themselves overnight."
    ]

def run_benchmark(model_name: str, 
                 sampler_names: List[str], 
                 prompts: List[str],
                 max_length: int = 1024,
                 output_dir: str = "results",
                 seed: int = None,
                 repetitions: int = 1) -> str:
    """
    Run benchmark and save results to JSON.
    
    Args:
        model_name: Name of the model to use
        sampler_names: List of sampler configurations to test
        prompts: List of prompts to test
        max_length: Maximum generation length
        output_dir: Directory to save results
        seed: Optional random seed for generation (deterministic decoding)
    
    Returns:
        Path to the saved results file
    """
    
    print("🚀 Starting Sampler Benchmark")
    print("=" * 50)
    print(f"Model: {model_name}")
    print(f"Samplers: {', '.join(sampler_names)}")
    print(f"Prompts: {len(prompts)}")
    print(f"Max length: {max_length}")
    
    # Initialize API
    api = SamplerBenchAPI()
    
    # Initialize generator
    print(f"\n🔌 Initializing model: {model_name}")
    gen_result = api.initialize_generator(model_name)
    if not gen_result['success']:
        print(f"❌ Failed to initialize generator: {gen_result['error']}")
        return None
    
    print(f"✅ Connected to model on port {gen_result['config']['port']}")
    
    # Prepare results structure
    results = {
        'benchmark_name': f"Creative Writing Benchmark - {model_name}",
        'timestamp': datetime.now().isoformat(),
        'model_name': model_name,
        'model_config': gen_result['config'],
        'prompts': prompts,
        'sampler_configs': {},
        'samples': [],
        'metadata': {
            'max_length': max_length,
            'total_samplers': len(sampler_names),
            'total_prompts': len(prompts),
            'repetitions': repetitions,
            'total_samples': len(sampler_names) * len(prompts) * repetitions
        }
    }
    
    # Store sampler configs for reference
    for sampler_name in sampler_names:
        if sampler_name in api.samplers:
            results['sampler_configs'][sampler_name] = api.samplers[sampler_name]
    
    total_samples = len(sampler_names) * len(prompts) * repetitions
    current_sample = 0
    failed_samples = 0
    
    print(f"\n📝 Generating {total_samples} samples...")
    
    # Generate samples with repetitions
    for sampler_name in sampler_names:
        print(f"\n🎯 Testing sampler: {sampler_name}")
        
        for i, prompt in enumerate(prompts, 1):
            print(f"\n  📋 Prompt {i}: {prompt[:60]}...")
            
            for rep in range(repetitions):
                current_sample += 1
                
                print(f"    {current_sample}/{total_samples} - Repetition {rep+1}/{repetitions}")
                
                # Generate sample
                gen_result = api.generate_single_sample(prompt, sampler_name, max_length, seed=seed)
                
                if gen_result['success']:
                    word_count = gen_result['word_count']
                    
                    sample = {
                        'sample_id': current_sample,
                        'prompt': prompt,
                        'sampler_name': sampler_name,
                        'sampler_config': gen_result['sampler_config'],
                        'generated_text': gen_result['generated_text'],
                        'word_count': word_count,
                        'repetition': rep + 1,  # Track which repetition this is
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    results['samples'].append(sample)
                    
                    print(f"    ✅ Generated {word_count} words")
                    
                else:
                    failed_samples += 1
                    print(f"    ❌ Generation failed: {gen_result['error']}")
                    
                    # Still record the failed attempt
                    sample = {
                        'sample_id': current_sample,
                        'prompt': prompt,
                        'sampler_name': sampler_name,
                        'sampler_config': api.samplers.get(sampler_name, {}).get('parameters', {}),
                        'generated_text': None,
                        'error': gen_result['error'],
                        'repetition': rep + 1,  # Track which repetition this is
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    results['samples'].append(sample)
            
            # Brief pause to be gentle on the API
            time.sleep(0.1)
    
    # Update metadata with final counts
    results['metadata']['completed_samples'] = total_samples - failed_samples
    results['metadata']['failed_samples'] = failed_samples
    
    # Save results
    Path(output_dir).mkdir(exist_ok=True)
    
    # Clean up model name for filename
    clean_model_name = model_name.replace("-", "").replace(".", "").replace("_", "")
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"{clean_model_name}_benchmark_{timestamp}.json"
    filepath = Path(output_dir) / filename
    
    with open(filepath, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: {filepath}")
    print(f"📊 Summary:")
    print(f"   ✅ Successful samples: {total_samples - failed_samples}")
    print(f"   ❌ Failed samples: {failed_samples}")
    print(f"   📈 Success rate: {((total_samples - failed_samples) / total_samples * 100):.1f}%")
    
    return str(filepath)

def main():
    """Main function with command line interface."""
    parser = argparse.ArgumentParser(description="Run sampler benchmark")
    parser.add_argument("--model", "-m", 
                       default="llama-3.1-8b-instruct",
                       help="Model name to use (default: llama-3.1-8b-instruct)")
    parser.add_argument("--samplers", "-s",
                       nargs="+",
                       default=["llama_default", "standard_minp", "creative_minp"],
                       help="Sampler names to test")
    parser.add_argument("--max-length", "-l",
                       type=int,
                       default=1024,
                       help="Maximum generation length (default: 1024)")
    parser.add_argument("--output-dir", "-o",
                       default="results",
                       help="Output directory (default: results)")
    parser.add_argument("--custom-prompts", "-p",
                       nargs="+",
                       help="Custom prompts to use instead of defaults")
    parser.add_argument("--seed", "-d",
                       type=int,
                       help="Optional random seed for generation (deterministic decoding)")
    parser.add_argument("--repetitions", "-r",
                       type=int,
                       default=1,
                       help="Number of repetitions per prompt-sampler combination (default: 1)")
    
    args = parser.parse_args()
    
    # Load prompts
    if args.custom_prompts:
        prompts = args.custom_prompts
        print(f"📝 Using {len(prompts)} custom prompts")
    else:
        prompts = load_prompts_from_config()
        print(f"📝 Using {len(prompts)} default prompts")
    
    # Run benchmark
    result_file = run_benchmark(
        model_name=args.model,
        sampler_names=args.samplers,
        prompts=prompts,
        max_length=args.max_length,
        output_dir=args.output_dir,
        seed=args.seed,
        repetitions=args.repetitions
    )
    
    if result_file:
        print(f"\n🎉 Benchmark completed successfully!")
        print(f"📁 Results file: {result_file}")
        print(f"📋 Next step: Run judge_results.py on this file")
    else:
        print(f"\n💥 Benchmark failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 