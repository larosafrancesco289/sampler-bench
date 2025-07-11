#!/usr/bin/env python3
"""
Full Benchmark Script
Convenience script that runs both benchmark generation and judging in sequence.
For users who want the traditional all-in-one workflow.
"""

import argparse
import sys
import subprocess
import yaml
from pathlib import Path

def load_config(config_path: str) -> dict:
    """Load configuration from YAML file."""
    try:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"❌ Error loading config file {config_path}: {e}")
        sys.exit(1)

def extract_config_settings(config: dict) -> tuple:
    """Extract prompts, samplers, and repetitions from config."""
    try:
        exp_design = config['benchmark_config']['experimental_design']
        
        # Extract prompts
        prompts_dict = exp_design['prompts']
        prompts = [prompt_info['text'] for prompt_info in prompts_dict.values()]
        
        # Extract samplers
        samplers = exp_design['samplers']
        
        # Extract repetitions
        repetitions = exp_design.get('repetitions_per_prompt_per_sampler', 1)
        
        return prompts, samplers, repetitions
        
    except KeyError as e:
        print(f"❌ Config file missing required field: {e}")
        sys.exit(1)

def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")
    print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False
    except Exception as e:
        print(f"❌ {description} failed with error: {e}")
        return False

def main():
    """Main function with command line interface."""
    parser = argparse.ArgumentParser(
        description="Run full benchmark: generation + judging",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic full benchmark
  python scripts/run_full_benchmark.py

  # Custom configuration
  python scripts/run_full_benchmark.py \\
    --model llama_3_1_8b \\
    --samplers focused balanced creative \\
    --judge-model gpt-4o-mini

  # Skip judging (generation only)
  python scripts/run_full_benchmark.py --no-judge

  # Judge only (use existing results)
  python scripts/run_full_benchmark.py --judge-only
        """
    )
    
    # Configuration options
    config_group = parser.add_argument_group('configuration options')
    config_group.add_argument("--config", "-c",
                             help="YAML config file to use (e.g., backend/config/robust_creative_writing.yaml)")
    
    # Generation options
    gen_group = parser.add_argument_group('generation options')
    gen_group.add_argument("--model", "-m", 
                          default="llama-3.1-8b-instruct",
                          help="Model name to use (default: llama-3.1-8b-instruct)")
    gen_group.add_argument("--samplers", "-s",
                          nargs="+",
                          help="Sampler names to test (overrides config file)")
    gen_group.add_argument("--max-length", "-l",
                          type=int,
                          default=1024,
                          help="Maximum generation length (default: 1024)")
    gen_group.add_argument("--custom-prompts", "-p",
                          nargs="+",
                          help="Custom prompts to use instead of defaults/config")
    
    # Deterministic generation support
    gen_group.add_argument("--seed", "-d",
                          type=int,
                          help="Optional random seed for generation (deterministic decoding)")
    
    # Judging options
    judge_group = parser.add_argument_group('judging options')
    judge_group.add_argument("--judge-model", "-j",
                            help="OpenAI model for judging (e.g., gpt-4o-mini)")
    judge_group.add_argument("--api-key", "-k",
                            help="OpenAI API key (optional if in .env)")
    
    # Output options
    output_group = parser.add_argument_group('output options')
    output_group.add_argument("--output-dir", "-o",
                             default="results",
                             help="Output directory (default: results)")
    
    # Workflow options
    workflow_group = parser.add_argument_group('workflow options')
    workflow_group.add_argument("--no-judge",
                               action="store_true",
                               help="Skip judging step (generation only)")
    workflow_group.add_argument("--judge-only",
                               action="store_true",
                               help="Skip generation, judge latest results only")
    workflow_group.add_argument("--judge-file",
                               help="Specific results file to judge (for --judge-only)")
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.no_judge and args.judge_only:
        print("❌ Cannot use both --no-judge and --judge-only")
        sys.exit(1)
    
    # Load configuration if provided
    config_prompts = None
    config_samplers = None
    repetitions = 1
    
    if args.config:
        print(f"📋 Loading configuration from: {args.config}")
        config = load_config(args.config)
        config_prompts, config_samplers, repetitions = extract_config_settings(config)
        print(f"✅ Config loaded: {len(config_prompts)} prompts, {len(config_samplers)} samplers, {repetitions} repetitions each")
    
    # Determine final settings (command line overrides config)
    final_samplers = args.samplers if args.samplers else config_samplers or ["llama_default", "standard_minp", "creative_minp"]
    final_prompts = args.custom_prompts if args.custom_prompts else config_prompts
    
    # Get script directory
    script_dir = Path(__file__).parent
    
    success = True
    
    # Step 1: Run benchmark generation (unless judge-only)
    if not args.judge_only:
        print("🚀 STEP 1: Running Benchmark Generation")
        
        # Build benchmark command
        benchmark_cmd = [
            sys.executable, str(script_dir / "run_benchmark.py"),
            "--model", args.model,
            "--output-dir", args.output_dir,
            "--max-length", str(args.max_length)
        ]
        
        # Add samplers
        benchmark_cmd.extend(["--samplers"] + final_samplers)
        
        # Add prompts if we have them (either custom or from config)
        if final_prompts:
            benchmark_cmd.extend(["--custom-prompts"] + final_prompts)
        
        # Add repetitions if > 1
        if repetitions > 1:
            benchmark_cmd.extend(["--repetitions", str(repetitions)])
        
        # Pass seed if provided
        if args.seed is not None:
            benchmark_cmd.extend(["--seed", str(args.seed)])
        
        success = run_command(benchmark_cmd, "Benchmark Generation")
        
        if not success:
            print("\n💥 Full benchmark failed at generation step!")
            sys.exit(1)
    
    # Step 2: Run judging (unless no-judge)
    if not args.no_judge:
        print("\n⚖️ STEP 2: Running Results Judging")
        
        # Build judge command
        judge_cmd = [
            sys.executable, str(script_dir / "judge_results.py"),
            "--output-dir", args.output_dir
        ]
        
        # Add specific file or auto-find
        if args.judge_file:
            judge_cmd.append(args.judge_file)
        else:
            judge_cmd.append("--auto-find")
        
        # Add judging options
        if args.judge_model:
            judge_cmd.extend(["--judge-model", args.judge_model])
        
        if args.api_key:
            judge_cmd.extend(["--api-key", args.api_key])
        
        # Pass config file for penalty configuration
        if args.config:
            judge_cmd.extend(["--config", args.config])
        
        success = run_command(judge_cmd, "Results Judging")
        
        if not success:
            print("\n💥 Full benchmark failed at judging step!")
            print("📝 Note: Generation results are still saved and can be judged later")
            sys.exit(1)
    
    # Success summary
    print(f"\n{'='*60}")
    print("🎉 FULL BENCHMARK COMPLETED SUCCESSFULLY!")
    print(f"{'='*60}")
    
    if args.judge_only:
        print("📊 Results have been judged and enhanced with quality scores")
    elif args.no_judge:
        print("📝 Benchmark generation completed")
        print("💡 Run with judging: python scripts/judge_results.py --auto-find")
    else:
        print("✅ Generation completed")
        print("✅ Judging completed")
        print("📊 Results include quality scores and rankings")
    
    print(f"\n📁 Check the '{args.output_dir}/' directory for results")

if __name__ == "__main__":
    main() 