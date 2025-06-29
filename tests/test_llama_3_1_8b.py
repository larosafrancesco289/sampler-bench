#!/usr/bin/env python3
"""Test Llama 3.1 8B with KoboldCpp GPU acceleration - Main Development Model."""

import sys
import time
import json
import yaml
sys.path.insert(0, 'backend')

from utils.config import config_manager
from utils.logging import get_logger, setup_logging
from inference.koboldcpp import LegacyKoboldCppEngine

def main():
    """Test KoboldCpp integration with Llama 3.1 8B model."""
    
    # Setup logging
    setup_logging(level="INFO")
    logger = get_logger(__name__)
    
    logger.info("🦙 Testing Llama 3.1 8B with KoboldCpp GPU acceleration")
    logger.info("🚀 RTX 5070 Ti with auto-detected GPU layers (-1)")
    
    # Load configuration for the new model
    try:
        model_config = config_manager.get_model_config("llama-3.1-8b-instruct")
        logger.info(f"✅ Loaded config for model: {model_config.name}")
        logger.info(f"📁 Model path: {model_config.path}")
        logger.info(f"🔧 GPU layers: {model_config.gpu_layers} (auto-detect)")
        logger.info(f"🌐 Port: {model_config.port}")
        
        # Load sampling presets
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
        'port': model_config.port,
        'gpu_layers': model_config.gpu_layers  # -1 for auto-detect
    }
    
    # Initialize KoboldCpp engine
    try:
        engine = LegacyKoboldCppEngine(model_config_dict)
        logger.info("✅ KoboldCpp engine initialized")
    except Exception as e:
        logger.error(f"❌ Engine initialization failed: {e}")
        return
    
    # Check if KoboldCpp server is running
    logger.info("🔍 Checking if KoboldCpp server is ready...")
    if not engine.load_model():
        logger.error("❌ KoboldCpp server not ready. Please start it first:")
        logger.info("💡 To start KoboldCpp server:")
        logger.info(f"   python koboldcpp.py {model_config.path} --port {model_config.port} --gpulayers {model_config.gpu_layers}")
        return
    
    logger.info("✅ KoboldCpp server is ready!")
    
    # Test with a few different samplers
    test_prompts = [
        "Write a short story about a robot discovering emotions:",
        "Explain quantum computing in simple terms:",
        "Write a Python function to calculate fibonacci numbers:"
    ]
    
    # Use a simple creative preset for testing
    test_sampler = {
        'type': 'creative_balanced',
        'temperature': 0.8,
        'top_p': 0.9,
        'top_k': 40,
        'min_p': 0.05,
        'repetition_penalty': 1.1,
        'max_tokens': 200
    }
    
    results = []
    
    for i, prompt in enumerate(test_prompts, 1):
        logger.info(f"\n📝 Test {i}/3: {prompt[:50]}...")
        
        try:
            start_time = time.time()
            result = engine.generate(prompt, test_sampler)
            generation_time = time.time() - start_time
            
            if result and 'generated_text' in result:
                generated_text = result['generated_text']
                tokens_generated = result.get('completion_tokens', len(generated_text.split()))
                tokens_per_second = result.get('tokens_per_second', tokens_generated / generation_time if generation_time > 0 else 0)
                
                logger.info(f"✅ Generated {tokens_generated} tokens in {generation_time:.2f}s")
                logger.info(f"🚀 Speed: {tokens_per_second:.1f} tokens/second")
                logger.info(f"📄 Preview: {generated_text[:100]}...")
                
                results.append({
                    'prompt': prompt,
                    'generated_text': generated_text,
                    'tokens_generated': tokens_generated,
                    'generation_time': generation_time,
                    'tokens_per_second': tokens_per_second,
                    'sampler': test_sampler,
                    'model_info': {
                        'name': result.get('model_name', 'Unknown'),
                        'prompt_tokens': result.get('prompt_tokens', 0),
                        'total_tokens': result.get('total_tokens', 0)
                    }
                })
                
            else:
                logger.error(f"❌ No results returned for prompt {i}: {result}")
                
        except Exception as e:
            logger.error(f"❌ Generation failed for prompt {i}: {e}")
    
    # Save results
    if results:
        with open('llama_3_1_8b_test_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        # Summary
        avg_speed = sum(r['tokens_per_second'] for r in results) / len(results)
        total_tokens = sum(r['tokens_generated'] for r in results)
        total_time = sum(r['generation_time'] for r in results)
        
        logger.info(f"\n🎯 Test Summary:")
        logger.info(f"   Model: {model_config.name}")
        logger.info(f"   Tests completed: {len(results)}/{len(test_prompts)}")
        logger.info(f"   Average speed: {avg_speed:.1f} tokens/second")
        logger.info(f"   Total tokens: {total_tokens}")
        logger.info(f"   Total time: {total_time:.2f}s")
        logger.info(f"   Results saved to: llama_3_1_8b_test_results.json")
        
        if avg_speed > 20:
            logger.info("🚀 Excellent performance! Ready for main development testing.")
        elif avg_speed > 10:
            logger.info("✅ Good performance. Should work well for development.")
        else:
            logger.info("⚠️  Performance may be slow. Consider checking GPU utilization.")
    
    else:
        logger.error("❌ No successful generations. Check KoboldCpp setup.")

if __name__ == "__main__":
    main() 