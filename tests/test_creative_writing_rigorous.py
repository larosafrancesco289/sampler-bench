#!/usr/bin/env python3
"""Rigorous Creative Writing Evaluation - Systematic Sampler Testing."""

import sys
import time
import json
import yaml
import statistics
from datetime import datetime
from pathlib import Path
sys.path.insert(0, 'backend')

from utils.config import config_manager
from utils.logging import get_logger, setup_logging
from inference.koboldcpp import LegacyKoboldCppEngine

def main():
    """Comprehensive creative writing evaluation across all sampling presets."""
    
    # Setup logging
    setup_logging(level="INFO")
    logger = get_logger(__name__)
    
    logger.info("🎨 Rigorous Creative Writing Evaluation - Llama 3.1 8B")
    logger.info("🔬 Testing 7 sampling configurations systematically")
    
    # Load configuration
    try:
        model_config = config_manager.get_model_config("llama-3.1-8b-instruct")
        logger.info(f"✅ Model: {model_config.name}")
        
        # Load sampling presets and test framework
        with open('backend/config/samplers.yaml', 'r') as f:
            samplers_yaml = yaml.safe_load(f)
        
        presets = samplers_yaml.get('presets', {})
        test_framework = samplers_yaml.get('test_framework', {})
        test_prompts = test_framework.get('test_prompts', [])
        
        logger.info(f"✅ Loaded {len(presets)} sampling presets")
        logger.info(f"✅ Loaded {len(test_prompts)} test prompts")
        
    except Exception as e:
        logger.error(f"❌ Configuration error: {e}")
        return
    
    # Initialize engine
    model_config_dict = {
        'name': model_config.name,
        'path': model_config.path,
        'context_length': model_config.context_length,
        'quantization': model_config.quantization,
        'inference_engine': model_config.inference_engine,
        'template': model_config.template,
        'parameters': model_config.parameters,
        'port': model_config.port,
        'gpu_layers': model_config.gpu_layers
    }
    
    try:
        engine = LegacyKoboldCppEngine(model_config_dict)
        logger.info("✅ KoboldCpp engine initialized")
    except Exception as e:
        logger.error(f"❌ Engine initialization failed: {e}")
        return
    
    # Check server readiness
    if not engine.load_model():
        logger.error("❌ KoboldCpp server not ready. Start with: ./start_llama_dev.sh")
        return
    
    logger.info("✅ KoboldCpp server ready!")
    
    # Systematic evaluation
    results = {
        'metadata': {
            'model': model_config.name,
            'test_timestamp': datetime.now().isoformat(),
            'total_presets': len(presets),
            'total_prompts': len(test_prompts),
            'samples_per_preset': len(test_prompts)
        },
        'preset_results': {},
        'performance_summary': {},
        'quality_analysis': {}
    }
    
    preset_order = [
        'llama_default', 'standard_minp', 'creative_minp', 'ultra_minp',
        'balanced_sigma', 'creative_sigma', 'ultra_sigma'
    ]
    
    # Test each preset systematically
    for preset_name in preset_order:
        if preset_name not in presets:
            logger.warning(f"⚠️  Preset '{preset_name}' not found, skipping")
            continue
            
        preset_config = presets[preset_name]
        logger.info(f"\n🧪 Testing preset: {preset_name}")
        logger.info(f"📋 Description: {preset_config['description']}")
        
        preset_results = {
            'config': preset_config,
            'samples': [],
            'performance_metrics': {}
        }
        
        # Convert preset to test format
        test_sampler = _convert_preset_to_sampler(preset_config)
        
        # Test on all prompts
        for i, prompt in enumerate(test_prompts, 1):
            logger.info(f"  📝 Prompt {i}/{len(test_prompts)}: {prompt[:60]}...")
            
            try:
                start_time = time.time()
                result = engine.generate(prompt, test_sampler)
                generation_time = time.time() - start_time
                
                if result and 'generated_text' in result:
                    generated_text = result['generated_text']
                    tokens_generated = result.get('completion_tokens', len(generated_text.split()))
                    tokens_per_second = result.get('tokens_per_second', 0)
                    
                    # Quality metrics
                    word_count = len(generated_text.split())
                    char_count = len(generated_text)
                    avg_word_length = char_count / word_count if word_count > 0 else 0
                    
                    sample_result = {
                        'prompt': prompt,
                        'generated_text': generated_text,
                        'performance': {
                            'tokens_generated': tokens_generated,
                            'generation_time': generation_time,
                            'tokens_per_second': tokens_per_second,
                            'word_count': word_count,
                            'char_count': char_count,
                            'avg_word_length': avg_word_length
                        }
                    }
                    
                    preset_results['samples'].append(sample_result)
                    logger.info(f"    ✅ {tokens_generated} tokens in {generation_time:.2f}s ({tokens_per_second:.1f} tok/s)")
                    logger.info(f"    📊 {word_count} words, {char_count} characters")
                    
                else:
                    logger.error(f"    ❌ Generation failed for prompt {i}")
                    
            except Exception as e:
                logger.error(f"    ❌ Error generating for prompt {i}: {e}")
        
        # Calculate preset performance metrics
        if preset_results['samples']:
            performances = [s['performance'] for s in preset_results['samples']]
            
            preset_results['performance_metrics'] = {
                'avg_tokens_per_second': statistics.mean([p['tokens_per_second'] for p in performances]),
                'avg_generation_time': statistics.mean([p['generation_time'] for p in performances]),
                'avg_word_count': statistics.mean([p['word_count'] for p in performances]),
                'avg_char_count': statistics.mean([p['char_count'] for p in performances]),
                'avg_word_length': statistics.mean([p['avg_word_length'] for p in performances]),
                'total_samples': len(preset_results['samples']),
                'success_rate': len(preset_results['samples']) / len(test_prompts)
            }
            
            metrics = preset_results['performance_metrics']
            logger.info(f"  📈 Preset Summary:")
            logger.info(f"    Speed: {metrics['avg_tokens_per_second']:.1f} tok/s")
            logger.info(f"    Word count: {metrics['avg_word_count']:.1f} words/sample")
            logger.info(f"    Success rate: {metrics['success_rate']:.1%}")
        
        results['preset_results'][preset_name] = preset_results
        
        # Brief pause between presets
        time.sleep(2)
    
    # Generate performance summary
    logger.info(f"\n🎯 Performance Summary Across All Presets:")
    
    performance_summary = {}
    for preset_name, preset_data in results['preset_results'].items():
        if 'performance_metrics' in preset_data:
            metrics = preset_data['performance_metrics']
            performance_summary[preset_name] = {
                'speed_toks': round(metrics['avg_tokens_per_second'], 1),
                'words_per_sample': round(metrics['avg_word_count'], 1),
                'success_rate': round(metrics['success_rate'], 3),
                'avg_word_length': round(metrics['avg_word_length'], 2)
            }
            
            logger.info(f"  {preset_name:15}: {metrics['avg_tokens_per_second']:5.1f} tok/s | "
                      f"{metrics['avg_word_count']:5.1f} words | {metrics['success_rate']:5.1%} success")
    
    results['performance_summary'] = performance_summary
    
    # Find best performers
    if performance_summary:
        fastest_preset = max(performance_summary.items(), key=lambda x: x[1]['speed_toks'])
        longest_preset = max(performance_summary.items(), key=lambda x: x[1]['words_per_sample'])
        
        logger.info(f"\n🏆 Best Performers:")
        logger.info(f"  Fastest: {fastest_preset[0]} ({fastest_preset[1]['speed_toks']} tok/s)")
        logger.info(f"  Most verbose: {longest_preset[0]} ({longest_preset[1]['words_per_sample']} words)")
        
        results['quality_analysis'] = {
            'fastest_preset': fastest_preset[0],
            'most_verbose_preset': longest_preset[0],
            'speed_range': [
                min(s['speed_toks'] for s in performance_summary.values()),
                max(s['speed_toks'] for s in performance_summary.values())
            ],
            'word_count_range': [
                min(s['words_per_sample'] for s in performance_summary.values()),
                max(s['words_per_sample'] for s in performance_summary.values())
            ]
        }
    
    # Save comprehensive results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"creative_writing_rigorous_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"\n💾 Results saved to: {results_file}")
    logger.info(f"🔬 Total samples generated: {sum(len(p['samples']) for p in results['preset_results'].values())}")
    logger.info("🎉 Rigorous creative writing evaluation complete!")

def _convert_preset_to_sampler(preset_config):
    """Convert preset configuration to test sampler format."""
    params = preset_config['parameters']
    
    # Base sampler configuration
    sampler = {
        'type': preset_config.get('sampler', 'unknown'),
        'temperature': params.get('temperature', 1.0),
        'repetition_penalty': 1.0,  # No repetition penalty as requested
        'max_tokens': params.get('max_tokens', 512)
    }
    
    # Add sampler-specific parameters
    if 'top_p' in params:
        sampler['top_p'] = params['top_p']
    if 'top_k' in params:
        sampler['top_k'] = params['top_k']
    if 'min_p' in params:
        sampler['min_p'] = params['min_p']
    if 'top_n_sigma' in params:
        sampler['top_n_sigma'] = params['top_n_sigma']
    
    return sampler

if __name__ == "__main__":
    main() 