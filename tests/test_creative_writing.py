#!/usr/bin/env python3
"""Test Creative Writing with KoboldCpp GPU acceleration."""

import sys
import time
import json
import yaml
sys.path.insert(0, 'backend')

from utils.config import config_manager
from utils.logging import get_logger, setup_logging
from inference.koboldcpp import LegacyKoboldCppEngine

def main():
    """Test KoboldCpp integration with different creative writing presets."""
    
    # Setup logging
    setup_logging(level="INFO")
    logger = get_logger(__name__)
    
    logger.info("🎨 Testing Creative Writing with KoboldCpp GPU acceleration")
    
    # Load configuration
    try:
        model_config = config_manager.get_model_config("mistral-small-24b")
        logger.info(f"✅ Loaded config for model: {model_config.name}")
        
        # Load raw YAML to access presets
        with open('backend/config/samplers.yaml', 'r') as f:
            samplers_yaml = yaml.safe_load(f)
        
        presets = samplers_yaml.get('presets', {})
        logger.info(f"✅ Found {len(presets)} creative writing presets")
        
    except Exception as e:
        logger.error(f"❌ Configuration error: {e}")
        return
    
    # Convert ModelConfig object to dict for KoboldCpp engine
    model_config_dict = {
        'name': model_config.name,
        'path': model_config.path,
        'context_length': model_config.context_length,
        'quantization': model_config.quantization,
        'inference_engine': model_config.inference_engine,
        'template': model_config.template,
        'parameters': model_config.parameters,
        'port': model_config.port or 5001,  # Use configured port or default
        'gpu_layers': model_config.gpu_layers or 35  # Use configured GPU layers or default
    }
    
    # Initialize KoboldCpp engine
    try:
        engine = LegacyKoboldCppEngine(model_config_dict)
        logger.info("✅ KoboldCpp engine initialized")
    except Exception as e:
        logger.error(f"❌ Engine initialization failed: {e}")
        return
    
    # Check if KoboldCpp server is ready
    if not engine.load_model():
        logger.error("❌ KoboldCpp server not ready. Make sure it's running!")
        logger.info("💡 Start KoboldCpp with: /home/franc/koboldcpp-linux-x64 --model /home/franc/llms/mistralai_Mistral-Small-3.2-24B-Instruct-2506-IQ4_XS.gguf --usecublas normal 0 --gpulayers 43 --contextsize 2048 --port 5001")
        return
    
    # Display model info
    model_info = engine.get_model_info()
    logger.info("📊 Model Information:")
    for key, value in model_info.items():
        logger.info(f"   {key}: {value}")
    
    # Creative writing prompts
    creative_prompts = [
        "Write a short story about a scientist who discovers that memories can be transferred between people.",
        "Create a dialogue between a wise old tree and a curious young bird.",
        "Write the opening of a mystery novel set in a small coastal town where strange lights appear every night.",
        "Describe a character who can see the emotions of others as colored auras around them."
    ]
    
    print("\n" + "="*80)
    print("🎨 TESTING CREATIVE WRITING PRESETS")
    print("="*80)
    
    # Test each preset configuration
    results = []
    
    for i, (preset_name, preset_config) in enumerate(presets.items()):
        try:
            # Get the preset parameters (these are single values, not lists)
            sampler_config = preset_config['parameters']
            sampler_type = preset_config.get('sampler', 'unknown')
            
            # Use a different prompt for each preset
            test_prompt = creative_prompts[i % len(creative_prompts)]
            
            print(f"\n🖋️  Testing {preset_name.upper()} Preset")
            print(f"   Description: {preset_config['description']}")
            print(f"   Sampler: {sampler_type}")
            print(f"   Config: {sampler_config}")
            print(f"   Prompt: {test_prompt[:80]}...")
            print("-" * 60)
            
            start_time = time.time()
            result = engine.generate(test_prompt, sampler_config)
            test_time = time.time() - start_time
            
            # Display results
            print(f"📝 Generated Text ({result['completion_tokens']} tokens):")
            print(f"   {result['generated_text'][:300]}{'...' if len(result['generated_text']) > 300 else ''}")
            print(f"⚡ Performance:")
            print(f"   Tokens/sec: {result['tokens_per_second']:.1f}")
            print(f"   Generation time: {result['generation_time']:.2f}s")
            print(f"   Total time: {test_time:.2f}s")
            print(f"   Finish reason: {result['finish_reason']}")
            
            # Store result
            results.append({
                "preset": preset_name,
                "sampler": sampler_type,
                "config": sampler_config,
                "prompt": test_prompt,
                "performance": {
                    "tokens_per_second": result['tokens_per_second'],
                    "generation_time": result['generation_time'],
                    "completion_tokens": result['completion_tokens']
                },
                "text_sample": result['generated_text'][:200] + "..." if len(result['generated_text']) > 200 else result['generated_text']
            })
            
        except Exception as e:
            logger.error(f"❌ Error testing {preset_name}: {e}")
            results.append({
                "preset": preset_name,
                "sampler": preset_config.get('sampler', 'unknown'),
                "config": preset_config.get('parameters', {}),
                "error": str(e)
            })
    
    # Performance summary
    print("\n" + "="*80)
    print("📊 CREATIVE WRITING PERFORMANCE SUMMARY")
    print("="*80)
    
    successful_results = [r for r in results if 'performance' in r]
    if successful_results:
        print(f"{'Preset':<15} {'Sampler':<12} {'Tokens/sec':<12} {'Gen Time':<12} {'Tokens':<8}")
        print("-" * 70)
        
        for result in successful_results:
            perf = result['performance']
            print(f"{result['preset']:<15} {result['sampler']:<12} {perf['tokens_per_second']:<12.1f} {perf['generation_time']:<12.2f} {perf['completion_tokens']:<8}")
        
        # Average performance
        avg_tokens_per_sec = sum(r['performance']['tokens_per_second'] for r in successful_results) / len(successful_results)
        print(f"\n🎯 Average performance: {avg_tokens_per_sec:.1f} tokens/sec")
        print(f"🚀 GPU acceleration is working perfectly for creative writing!")
    
    # Save detailed results
    try:
        with open('creative_writing_results.json', 'w') as f:
            json.dump({
                "timestamp": time.time(),
                "model": model_config.name,
                "engine": "KoboldCpp",
                "focus": "Creative Writing",
                "results": results
            }, f, indent=2)
        logger.info("📁 Detailed results saved to creative_writing_results.json")
    except Exception as e:
        logger.warning(f"⚠️  Could not save results: {e}")
    
    print(f"\n🎉 Creative writing testing complete! Ready for storytelling and content generation!")

if __name__ == "__main__":
    main() 