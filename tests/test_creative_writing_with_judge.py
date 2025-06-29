"""
Creative Writing Benchmark with LLM-as-a-Judge Evaluation
Generates text samples using different sampling strategies and evaluates them using OpenAI GPT.
"""

import os
import sys
import time
import yaml
import requests
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

from evaluation.llm_judge import CreativeWritingJudge
from evaluation.aggregator import ResultsAggregator

# Load configuration
def load_config():
    with open('backend/config/models.yaml', 'r') as f:
        models = yaml.safe_load(f)
    
    with open('backend/config/samplers.yaml', 'r') as f:
        samplers = yaml.safe_load(f)
    
    return models, samplers

def test_model_connection(model_config):
    """Test if the model server is running and accessible."""
    try:
        url = f"http://localhost:{model_config['port']}/api/v1/model"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            model_info = response.json()
            print(f"✅ Model server connected: {model_info.get('result', 'Unknown model')}")
            return True
        else:
            print(f"❌ Model server responded with status {response.status_code}")
            return False
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to model server: {e}")
        return False

def generate_text(prompt, sampler_config, model_config):
    """Generate text using the specified sampler configuration."""
    url = f"http://localhost:{model_config['port']}/api/v1/generate"
    
    # Prepare the request payload
    payload = {
        "prompt": prompt,
        "max_length": 512,
        "stop_sequence": ["<|eot_id|>", "<|end_of_text|>"],
        **sampler_config  # Merge sampler parameters
    }
    
    try:
        start_time = time.time()
        response = requests.post(url, json=payload, timeout=60)
        generation_time = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            generated_text = data.get('results', [{}])[0].get('text', '')
            
            # Calculate tokens per second (rough estimate)
            word_count = len(generated_text.split())
            tokens_estimate = word_count * 1.3  # Rough token estimate
            tokens_per_second = tokens_estimate / generation_time if generation_time > 0 else 0
            
            return {
                'text': generated_text,
                'generation_time': generation_time,
                'tokens_per_second': tokens_per_second,
                'word_count': word_count,
                'success': True,
                'error': None
            }
        else:
            return {
                'text': '',
                'generation_time': generation_time,
                'tokens_per_second': 0,
                'word_count': 0,
                'success': False,
                'error': f"HTTP {response.status_code}: {response.text}"
            }
    
    except Exception as e:
        return {
            'text': '',
            'generation_time': 0,
            'tokens_per_second': 0,
            'word_count': 0,
            'success': False,
            'error': str(e)
        }

def main():
    # Creative writing prompts for testing
    test_prompts = [
        "Write a short story about a robot discovering emotions",
        "Create a mysterious tale set in a haunted library",
        "Tell a story about someone who can taste colors",
        "Write about a world where music has magical properties",
        "Describe a character who wakes up in a world made entirely of clouds"
    ]
    
    print("🎭 Creative Writing Benchmark with LLM Judge")
    print("=" * 60)
    
    # Load configurations
    try:
        models, samplers = load_config()
        print(f"✅ Loaded {len(models)} models and {len(samplers)} samplers")
    except Exception as e:
        print(f"❌ Failed to load config: {e}")
        return
    
    # Select model (default to llama_3_1_8b)
    model_name = "llama_3_1_8b"
    if model_name not in models:
        print(f"❌ Model '{model_name}' not found in configuration")
        return
    
    model_config = models[model_name]
    print(f"🤖 Using model: {model_name}")
    
    # Test model connection
    if not test_model_connection(model_config):
        print("❌ Cannot connect to model. Please ensure the model server is running.")
        return
    
    # Initialize judge
    try:
        judge = CreativeWritingJudge()
        print(f"⚖️ Judge initialized: {judge.model}")
    except Exception as e:
        print(f"❌ Failed to initialize judge: {e}")
        print("📝 Note: Make sure you have OPENAI_API_KEY and OPENAI_MODEL in your .env file")
        return
    
    # Initialize results aggregator
    aggregator = ResultsAggregator()
    
    print(f"\n🎯 Running benchmark...")
    print(f"📝 {len(test_prompts)} prompts × {len(samplers)} samplers = {len(test_prompts) * len(samplers)} total samples")
    
    # Process each sampler
    for sampler_name, sampler_config in samplers.items():
        print(f"\n🔧 Testing sampler: {sampler_name}")
        print(f"   Config: {sampler_config}")
        
        # Generate text for each prompt
        for i, prompt in enumerate(test_prompts):
            print(f"   Prompt {i+1}/{len(test_prompts)}: {prompt[:50]}...")
            
            # Generate text
            result = generate_text(prompt, sampler_config, model_config)
            
            if result['success']:
                generated_text = result['text']
                print(f"   ✅ Generated {result['word_count']} words in {result['generation_time']:.2f}s ({result['tokens_per_second']:.1f} tok/s)")
                
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
                        model_name=model_name,
                        generated_text=generated_text,
                        generation_time=result['generation_time'],
                        tokens_per_second=result['tokens_per_second'],
                        judgment=judgment
                    )
                    
                except Exception as e:
                    print(f"   ❌ Judging failed: {e}")
                    # Still add sample without judgment
                    aggregator.add_sample(
                        prompt=prompt,
                        sampler_config=sampler_config,
                        sampler_name=sampler_name,
                        model_name=model_name,
                        generated_text=generated_text,
                        generation_time=result['generation_time'],
                        tokens_per_second=result['tokens_per_second'],
                        judgment=None
                    )
            else:
                print(f"   ❌ Generation failed: {result['error']}")
    
    # Print comprehensive results
    aggregator.print_summary()
    
    # Save detailed results
    results_dir = Path("results")
    results_dir.mkdir(exist_ok=True)
    
    benchmark_results = aggregator.get_benchmark_results(
        benchmark_name="Creative Writing with Judge",
        model_name=model_name
    )
    
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    results_file = results_dir / f"creative_writing_judge_{timestamp}.json"
    benchmark_results.save_json(results_file)
    
    print(f"\n💾 Detailed results saved to: {results_file}")
    
    # Quality ranking
    quality_stats = aggregator.calculate_quality_stats()
    if 'message' not in quality_stats:
        print(f"\n🏆 QUALITY RANKING:")
        sorted_samplers = sorted(quality_stats.items(), 
                               key=lambda x: x[1]['avg_overall_score'], 
                               reverse=True)
        
        for rank, (sampler_name, stats) in enumerate(sorted_samplers, 1):
            print(f"  {rank}. {sampler_name}: {stats['avg_overall_score']:.2f}/10")
    
    # Performance ranking  
    perf_stats = aggregator.calculate_performance_stats()
    print(f"\n🚀 SPEED RANKING:")
    sorted_perf = sorted(perf_stats.items(), 
                        key=lambda x: x[1]['avg_speed'], 
                        reverse=True)
    
    for rank, (sampler_name, stats) in enumerate(sorted_perf, 1):
        print(f"  {rank}. {sampler_name}: {stats['avg_speed']:.1f} tok/s")

if __name__ == "__main__":
    main() 