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
    try:
        import yaml
        config_path = Path(__file__).parent.parent / "backend/config/experiments.yaml"
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        # Extract prompts from task definitions
        prompts = []
        tasks = config.get('tasks', {})
        story_task = tasks.get('story_writing', {})
        templates = story_task.get('prompt_templates', [])
        
        # Convert templates to actual prompts (simplified)
        base_prompts = [
            "Write a short story about a mysterious package that appears on someone's doorstep.",
            "Write a story about two strangers who meet during a power outage.",
            "Write a short tale about a character who discovers they can hear other people's thoughts.",
            "Write a story about someone who finds an old diary that predicts the future.",
            "Write a short story about a world where colors have been banned."
        ]
        
        return base_prompts
        
    except Exception as e:
        print(f"⚠️ Could not load prompts from config: {e}")
        # Fallback prompts
        return [
            "Write a short story about a mysterious package that appears on someone's doorstep.",
            "Write a story about two strangers who meet during a power outage.",
            "Write a short tale about a character who discovers they can hear other people's thoughts.",
        ]

def run_benchmark(model_name: str, 
                 sampler_names: List[str], 
                 prompts: List[str],
                 max_length: int = 512,
                 output_dir: str = "results") -> str:
    """
    Run benchmark and save results to JSON.
    
    Args:
        model_name: Name of the model to use
        sampler_names: List of sampler configurations to test
        prompts: List of prompts to test
        max_length: Maximum generation length
        output_dir: Directory to save results
    
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
            'total_samples': len(sampler_names) * len(prompts)
        }
    }
    
    # Store sampler configs for reference
    for sampler_name in sampler_names:
        if sampler_name in api.samplers:
            results['sampler_configs'][sampler_name] = api.samplers[sampler_name]
    
    total_samples = len(sampler_names) * len(prompts)
    current_sample = 0
    failed_samples = 0
    
    print(f"\n📝 Generating {total_samples} samples...")
    
    # Generate samples
    for sampler_name in sampler_names:
        print(f"\n🎯 Testing sampler: {sampler_name}")
        
        for i, prompt in enumerate(prompts, 1):
            current_sample += 1
            
            print(f"  {current_sample}/{total_samples} - Prompt {i}")
            print(f"    Prompt: {prompt[:60]}...")
            
            start_time = time.time()
            
            # Generate sample
            gen_result = api.generate_single_sample(prompt, sampler_name, max_length)
            
            generation_time = time.time() - start_time
            
            if gen_result['success']:
                # Calculate tokens per second (approximate)
                word_count = gen_result['word_count']
                estimated_tokens = int(word_count * 1.3)  # Rough estimate
                tokens_per_second = estimated_tokens / generation_time if generation_time > 0 else 0
                
                sample = {
                    'sample_id': current_sample,
                    'prompt': prompt,
                    'sampler_name': sampler_name,
                    'sampler_config': gen_result['sampler_config'],
                    'generated_text': gen_result['generated_text'],
                    'word_count': word_count,
                    'generation_time': generation_time,
                    'tokens_per_second': tokens_per_second,
                    'timestamp': datetime.now().isoformat()
                }
                
                results['samples'].append(sample)
                
                print(f"    ✅ Generated {word_count} words in {generation_time:.2f}s ({tokens_per_second:.1f} tok/s)")
                
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
                    'generation_time': generation_time,
                    'timestamp': datetime.now().isoformat()
                }
                
                results['samples'].append(sample)
            
            # Brief pause to be gentle on the API
            time.sleep(0.1)
    
    # Update metadata with final counts
    results['metadata']['completed_samples'] = total_samples - failed_samples
    results['metadata']['failed_samples'] = failed_samples
    results['metadata']['total_generation_time'] = sum(
        s.get('generation_time', 0) for s in results['samples']
    )
    
    # Save results
    Path(output_dir).mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"benchmark_results_{model_name}_{timestamp}.json"
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
                       default=["llama_default", "focused", "balanced", "creative"],
                       help="Sampler names to test")
    parser.add_argument("--max-length", "-l",
                       type=int,
                       default=512,
                       help="Maximum generation length (default: 512)")
    parser.add_argument("--output-dir", "-o",
                       default="results",
                       help="Output directory (default: results)")
    parser.add_argument("--custom-prompts", "-p",
                       nargs="+",
                       help="Custom prompts to use instead of defaults")
    
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
        output_dir=args.output_dir
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