"""KoboldCpp inference engine for GPU-accelerated text generation."""

import json
import requests
import time
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from typing import Dict, Any, Optional
from utils.logging import get_logger
from inference.base import BaseInferenceEngine, GenerationResult, SamplingParameters, BaseSampler

logger = get_logger(__name__)

class KoboldCppEngine(BaseInferenceEngine):
    """KoboldCpp HTTP API inference engine with GPU acceleration."""
    
    def __init__(self, model_path: str, model_config: Dict[str, Any]):
        """Initialize KoboldCpp engine.
        
        Args:
            model_path: Path to the model file (for compatibility)
            model_config: Model configuration dict
        """
        super().__init__(model_path, model_config)
        self.base_url = f"http://localhost:{model_config.get('port', 5001)}"
        self.api_url = f"{self.base_url}/api/v1/generate"
        
        logger.info(f"Initialized KoboldCpp engine for {model_config.get('name', 'Unknown')}")
        
    def load_model(self) -> None:
        """Check if KoboldCpp server is ready."""
        try:
            # Test if server is responding
            response = requests.get(self.base_url, timeout=5)
            if response.status_code == 200:
                self._is_loaded = True
                logger.info("✅ KoboldCpp server is ready")
            else:
                logger.error(f"❌ KoboldCpp server not ready: {response.status_code}")
                raise RuntimeError(f"KoboldCpp server not ready: {response.status_code}")
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Cannot connect to KoboldCpp server: {e}")
            raise RuntimeError(f"Cannot connect to KoboldCpp server: {e}")
    
    def unload_model(self) -> None:
        """KoboldCpp runs as separate process, so just mark as unloaded."""
        self._is_loaded = False
        logger.info("Marked KoboldCpp engine as unloaded")
    
    def generate(
        self, 
        prompt: str, 
        sampler: BaseSampler,
        sampling_params: SamplingParameters,
        **kwargs
    ) -> GenerationResult:
        """Generate text using KoboldCpp API.
        
        Args:
            prompt: Input text prompt
            sampler: Sampler instance (for compatibility)
            sampling_params: Sampling configuration
            
        Returns:
            GenerationResult with generation results and metadata
        """
        if not self._is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        # Convert sampling params to KoboldCpp format
        kobold_params = self._convert_sampling_params(sampling_params)
        kobold_params["prompt"] = prompt
        
        # Add model-specific parameters
        model_params = self.model_config.get('parameters', {})
        kobold_params["max_length"] = model_params.get('max_tokens', sampling_params.max_tokens)
        
        logger.debug(f"Sending request to KoboldCpp: {kobold_params}")
        
        start_time = time.time()
        
        try:
            response = requests.post(
                self.api_url,
                json=kobold_params,
                headers={"Content-Type": "application/json"},
                timeout=120  # 2 minute timeout for generation
            )
            response.raise_for_status()
            
            generation_time = time.time() - start_time
            result = response.json()
            
            # Extract the generated text
            if "results" in result and len(result["results"]) > 0:
                generated_text = result["results"][0]["text"]
                prompt_tokens = result["results"][0].get("prompt_tokens", 0)
                completion_tokens = result["results"][0].get("completion_tokens", 0)
                finish_reason = result["results"][0].get("finish_reason", "unknown")
                
                logger.info(f"✅ Generated {completion_tokens} tokens in {generation_time:.2f}s ({completion_tokens/generation_time:.1f} tok/s)")
                
                return GenerationResult(
                    text=generated_text,
                    prompt=prompt,
                    model_name=self.model_name,
                    sampler_name=sampler.name if sampler else "unknown",
                    sampling_params=sampling_params,
                    generation_time=generation_time,
                    tokens_generated=completion_tokens,
                    prompt_tokens=prompt_tokens,
                    total_tokens=prompt_tokens + completion_tokens,
                    finish_reason=finish_reason,
                    metadata={
                        "tokens_per_second": completion_tokens / generation_time if generation_time > 0 else 0,
                        "engine": "KoboldCpp"
                    }
                )
            else:
                raise ValueError("No results in KoboldCpp response")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ KoboldCpp API error: {e}")
            raise RuntimeError(f"Generation failed: {e}")
        except (KeyError, ValueError) as e:
            logger.error(f"❌ Invalid response format: {e}")
            raise RuntimeError(f"Invalid response: {e}")
    
    def _convert_sampling_params(self, params: SamplingParameters) -> Dict[str, Any]:
        """Convert SamplingParameters to KoboldCpp API format.
        
        Args:
            params: SamplingParameters object
            
        Returns:
            KoboldCpp-compatible parameters dict
        """
        kobold_params = {
            "temperature": params.temperature,
            "rep_pen": params.repeat_penalty,
        }
        
        # Add sampling method parameters
        if params.top_p > 0 and params.top_p < 1.0:
            kobold_params["top_p"] = params.top_p
            
        if params.top_k > 0:
            kobold_params["top_k"] = params.top_k
            
        if params.min_p > 0:
            kobold_params["min_p"] = params.min_p
        
        # Add stop tokens if specified in model config
        stop_tokens = self.model_config.get('parameters', {}).get('stop_tokens', [])
        if stop_tokens:
            kobold_params["stop_sequence"] = stop_tokens
        
        return kobold_params
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        return {
            "name": self.model_config.get('name', 'Unknown'),
            "path": self.model_config.get('path', 'Unknown'),
            "quantization": self.model_config.get('quantization', 'Unknown'),
            "context_length": self.model_config.get('context_length', 'Unknown'),
            "gpu_layers": self.model_config.get('gpu_layers', 'Unknown'),
            "engine": "KoboldCpp",
            "api_url": self.api_url,
            "is_loaded": self._is_loaded
        }


# Simplified compatibility interface for legacy code
class LegacyKoboldCppEngine:
    """Legacy interface for backwards compatibility."""
    
    def __init__(self, model_config: Dict[str, Any]):
        """Initialize with legacy interface."""
        self.engine = KoboldCppEngine(
            model_path=model_config.get('path', ''), 
            model_config=model_config
        )
    
    def load_model(self) -> bool:
        """Legacy load_model interface."""
        try:
            self.engine.load_model()
            return True
        except Exception:
            return False
    
    def generate(self, prompt: str, sampler_config: Dict[str, Any]) -> Dict[str, Any]:
        """Legacy generate interface."""
        # Convert dict config to SamplingParameters
        sampling_params = SamplingParameters(
            temperature=sampler_config.get('temperature', 1.0),
            top_p=sampler_config.get('p', sampler_config.get('top_p', 0.95)),
            top_k=sampler_config.get('k', sampler_config.get('top_k', -1)),
            min_p=sampler_config.get('min_p', 0.0),
            repeat_penalty=sampler_config.get('repetition_penalty', 1.1),
            max_tokens=sampler_config.get('max_tokens', 512)
        )
        
        # Create a simple sampler for compatibility
        class SimpleSampler:
            def __init__(self, sampler_type):
                self.name = sampler_type
        
        sampler = SimpleSampler(sampler_config.get('type', 'unknown'))
        
        result = self.engine.generate(prompt, sampler, sampling_params)
        
        # Convert GenerationResult back to legacy dict format
        return {
            "generated_text": result.text,
            "prompt_tokens": result.prompt_tokens,
            "completion_tokens": result.tokens_generated,
            "total_tokens": result.total_tokens,
            "generation_time": result.generation_time,
            "tokens_per_second": result.metadata.get("tokens_per_second", 0),
            "finish_reason": result.finish_reason,
            "sampler_config": sampler_config,
            "model_name": result.model_name
        }
    
    def is_loaded(self) -> bool:
        """Legacy is_loaded interface."""
        return self.engine.is_loaded()
    
    def unload_model(self) -> bool:
        """Legacy unload_model interface."""
        try:
            self.engine.unload_model()
            return True
        except Exception:
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Legacy get_model_info interface."""
        return self.engine.get_model_info() 