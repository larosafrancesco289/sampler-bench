#!/usr/bin/env python3
"""
Hyperparameter Search Script

Automatically finds optimal sampler configurations for creative writing tasks
by searching through parameter spaces and evaluating quality using GPT judge.
"""

import argparse
import sys
import os
import yaml
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

# Add backend to Python path for imports
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    from api.quality_api import SamplerBenchAPI
    from evaluation.llm_judge import CreativeWritingJudge
    from utils.hyper_search import HyperParameterSearcher, SearchConfiguration, create_default_search_config
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running from the project root and backend modules are available")
    sys.exit(1)

def load_config_section(config_file: str, section: str = None) -> Dict[str, Any]:
    """Load configuration from YAML file, optionally from a specific section."""
    try:
        with open(config_file, 'r') as f:
            config = yaml.safe_load(f)
        
        if section and section in config:
            # Get the specific section and merge with root level defaults
            section_config = config[section].copy()
            # Add any root-level keys that aren't in the section
            for key, value in config.items():
                if key not in section_config and not isinstance(value, dict):
                    section_config[key] = value
            return section_config
        elif section:
            print(f"⚠️  Section '{section}' not found in config, using root configuration")
            return config
        else:
            return config
    except Exception as e:
        print(f"❌ Error loading config: {e}")
        sys.exit(1)

def setup_environment():
    """Setup environment and check requirements."""
    # Check for OpenAI API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set")
        print("Please add your OpenAI API key to .env or set as environment variable")
        sys.exit(1)
    
    return api_key

def initialize_components(model_name: str, api_key: str, judge_model: str = None):
    """Initialize API and judge components."""
    print("🔧 Initializing components...")
    
    # Initialize API
    api = SamplerBenchAPI()
    
    # Initialize generator
    print(f"🤖 Initializing generator with model: {model_name}")
    gen_result = api.initialize_generator(model_name)
    if not gen_result['success']:
        print(f"❌ Failed to initialize generator: {gen_result['error']}")
        sys.exit(1)
    
    # Initialize judge
    print(f"⚖️  Initializing judge with model: {judge_model or 'default'}")
    judge_result = api.initialize_judge(api_key=api_key, model=judge_model)
    if not judge_result['success']:
        print(f"❌ Failed to initialize judge: {judge_result['error']}")
        sys.exit(1)
    
    print("✅ All components initialized successfully")
    return api, api.judge

def run_hyperparameter_search(config: SearchConfiguration, 
                            api: SamplerBenchAPI, 
                            judge: CreativeWritingJudge,
                            prompts: List[str] = None) -> str:
    """Run the hyperparameter search and save results."""
    
    # Use prompts from config if not provided
    if prompts is None:
        prompts = [
            "Write a short story about discovering a hidden room in an old library.",
            "Create a story where the protagonist can hear other people's thoughts.",
            "Tell a tale about a world where colors have started disappearing."
        ]
    
    print(f"\n🚀 Starting hyperparameter search")
    print(f"📊 Strategy: {config.search_strategy}")
    print(f"🎯 Sampler types: {', '.join(config.sampler_types)}")
    print(f"📝 Test prompts: {len(prompts)}")
    print(f"🔢 Samples per config: {config.samples_per_config}")
    
    if config.search_strategy == "grid":
        total_configs = 1
        for sampler_type in config.sampler_types:
            if sampler_type in config.parameter_ranges:
                sampler_configs = 1
                for param_values in config.parameter_ranges[sampler_type].values():
                    sampler_configs *= len(param_values)
                total_configs += sampler_configs
        print(f"📈 Estimated configurations: {total_configs}")
    else:
        print(f"📈 Max configurations: {config.n_iterations}")
    
    # Initialize searcher
    searcher = HyperParameterSearcher(api, judge)
    
    # Run search
    results = searcher.run_search(config, prompts)
    
    if not results:
        print("❌ No valid results obtained from search")
        return ""
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"results/hyper_search_{config.search_strategy}_{timestamp}.json"
    
    # Ensure results directory exists
    os.makedirs("results", exist_ok=True)
    
    searcher.save_results(results_file)
    
    # Print summary
    print(f"\n🎉 Search completed!")
    print(f"📄 Results saved to: {results_file}")
    print(f"🏆 Best configuration:")
    best = searcher.best_config
    print(f"   Sampler: {best.sampler_type}")
    print(f"   Score: {best.mean_score:.3f} ± {best.std_score:.3f}")
    print(f"   Parameters: {best.parameters}")
    
    # Show top 5 results
    print(f"\n📊 Top 5 configurations:")
    for i, result in enumerate(results[:5]):
        print(f"   {i+1}. {result.sampler_type}: {result.mean_score:.3f} ± {result.std_score:.3f}")
        print(f"      {result.parameters}")
    
    return results_file

def main():
    """Main function with command line interface."""
    parser = argparse.ArgumentParser(
        description="Run hyperparameter search for sampler optimization",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic search with default configuration
  python scripts/run_hyper_search.py --model llama-3.1-8b-instruct

  # Use specific configuration section
  python scripts/run_hyper_search.py \\
    --model llama-3.1-8b-instruct \\
    --config backend/config/hyper_search_config.yaml \\
    --config-section quick_test

  # Grid search with custom prompts
  python scripts/run_hyper_search.py \\
    --model llama-3.1-8b-instruct \\
    --strategy grid \\
    --samplers min_p top_n_sigma \\
    --custom-prompts "Write about robots." "Create a mystery story."

  # Bayesian optimization with more iterations
  python scripts/run_hyper_search.py \\
    --model llama-3.1-8b-instruct \\
    --strategy bayesian \\
    --iterations 100 \\
    --samples-per-config 5
        """
    )
    
    # Basic options
    parser.add_argument("--model", "-m", 
                       default="llama-3.1-8b-instruct",
                       help="Model name to use for generation")
    
    parser.add_argument("--judge-model", "-j",
                       help="OpenAI model for judging (e.g., gpt-4o-mini)")
    
    # Configuration options
    parser.add_argument("--config", "-c",
                       default="backend/config/hyper_search_config.yaml",
                       help="Configuration file path")
    
    parser.add_argument("--config-section", "-s",
                       help="Use specific section from config file (e.g., quick_test, intensive_search)")
    
    # Search strategy options
    parser.add_argument("--strategy",
                       choices=["grid", "random", "bayesian"],
                       help="Search strategy (overrides config)")
    
    parser.add_argument("--iterations", "-i",
                       type=int,
                       help="Number of iterations for random/bayesian search")
    
    parser.add_argument("--samples-per-config", "-n",
                       type=int,
                       help="Number of samples per configuration")
    
    parser.add_argument("--samplers",
                       nargs="+",
                       help="Sampler types to search (overrides config)")
    
    # Prompt options
    parser.add_argument("--custom-prompts", "-p",
                       nargs="+",
                       help="Custom prompts to use for evaluation")
    
    # Other options
    parser.add_argument("--seed",
                       type=int,
                       help="Random seed for reproducible results")
    
    parser.add_argument("--output-dir", "-o",
                       default="results",
                       help="Output directory for results")
    
    args = parser.parse_args()
    
    # Setup environment
    api_key = setup_environment()
    
    # Load configuration
    print(f"📋 Loading configuration from: {args.config}")
    config_data = load_config_section(args.config, args.config_section)
    
    # Override config with command line arguments
    if args.strategy:
        config_data['search_strategy'] = args.strategy
    if args.iterations:
        config_data['n_iterations'] = args.iterations
    if args.samples_per_config:
        config_data['samples_per_config'] = args.samples_per_config
    if args.samplers:
        config_data['sampler_types'] = args.samplers
    if args.seed:
        config_data['seed'] = args.seed
    
    # Get prompts
    prompts = args.custom_prompts or config_data.get('test_prompts', [])
    if not prompts:
        prompts = [
            "Write a short story about discovering a hidden room in an old library.",
            "Create a story where the protagonist can hear other people's thoughts.",
            "Tell a tale about a world where colors have started disappearing."
        ]
    
    # Create search configuration
    try:
        search_config = SearchConfiguration(**config_data)
    except Exception as e:
        print(f"❌ Error creating search configuration: {e}")
        print("Using default configuration...")
        search_config = create_default_search_config()
        if args.strategy:
            search_config.search_strategy = args.strategy
    
    # Initialize components
    api, judge = initialize_components(args.model, api_key, args.judge_model)
    
    # Run search
    results_file = run_hyperparameter_search(search_config, api, judge, prompts)
    
    if results_file:
        print(f"\n✅ Hyperparameter search completed successfully!")
        print(f"📁 Results saved to: {results_file}")
    else:
        print(f"\n❌ Hyperparameter search failed")
        sys.exit(1)

if __name__ == "__main__":
    main() 