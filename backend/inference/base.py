"""Base classes and interfaces for model inference and sampling."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Union, Tuple
from dataclasses import dataclass
from enum import Enum
import time


class InferenceEngine(Enum):
    """Supported inference engines."""
    LLAMA_CPP = "llama_cpp"
    TRANSFORMERS = "transformers"
    VLLM = "vllm"


@dataclass
class SamplingParameters:
    """Parameters for text sampling."""
    temperature: float = 0.8
    top_p: float = 0.95
    top_k: int = -1  # -1 means disabled
    min_p: float = 0.0
    repeat_penalty: float = 1.1
    max_tokens: int = 1024
    stop_tokens: Optional[List[str]] = None
    seed: Optional[int] = None
    
    # Experimental parameters
    n_sigma: Optional[float] = None  # For top-n-sigma sampling
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'temperature': self.temperature,
            'top_p': self.top_p,
            'top_k': self.top_k,
            'min_p': self.min_p,
            'repeat_penalty': self.repeat_penalty,
            'max_tokens': self.max_tokens,
            'stop_tokens': self.stop_tokens,
            'seed': self.seed,
            'n_sigma': self.n_sigma
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SamplingParameters':
        """Create from dictionary."""
        return cls(**data)


@dataclass
class GenerationResult:
    """Result of text generation."""
    text: str
    prompt: str
    model_name: str
    sampler_name: str
    sampling_params: SamplingParameters
    generation_time: float
    tokens_generated: int
    prompt_tokens: int
    total_tokens: int
    finish_reason: str
    logprobs: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'text': self.text,
            'prompt': self.prompt,
            'model_name': self.model_name,
            'sampler_name': self.sampler_name,
            'sampling_params': self.sampling_params.to_dict(),
            'generation_time': self.generation_time,
            'tokens_generated': self.tokens_generated,
            'prompt_tokens': self.prompt_tokens,
            'total_tokens': self.total_tokens,
            'finish_reason': self.finish_reason,
            'logprobs': self.logprobs,
            'metadata': self.metadata or {}
        }


class BaseSampler(ABC):
    """Base class for sampling strategies."""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    @abstractmethod
    def get_sampling_params(self, **kwargs) -> SamplingParameters:
        """Get sampling parameters for this strategy."""
        pass
    
    @abstractmethod
    def validate_params(self, params: SamplingParameters) -> bool:
        """Validate that sampling parameters are compatible with this sampler."""
        pass
    
    def get_parameter_grid(self) -> List[Dict[str, Any]]:
        """Get parameter grid for hyperparameter sweeps."""
        return []


class BaseInferenceEngine(ABC):
    """Base class for inference engines."""
    
    def __init__(self, model_path: str, model_config: Dict[str, Any]):
        self.model_path = model_path
        self.model_config = model_config
        self.model_name = model_config.get('name', 'unknown')
        self._model = None
        self._is_loaded = False
    
    @abstractmethod
    def load_model(self) -> None:
        """Load the model into memory."""
        pass
    
    @abstractmethod
    def unload_model(self) -> None:
        """Unload the model from memory."""
        pass
    
    @abstractmethod
    def generate(
        self, 
        prompt: str, 
        sampler: BaseSampler,
        sampling_params: SamplingParameters,
        **kwargs
    ) -> GenerationResult:
        """Generate text using the specified sampler and parameters."""
        pass
    
    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        pass
    
    def is_loaded(self) -> bool:
        """Check if model is loaded."""
        return self._is_loaded
    
    def __enter__(self):
        """Context manager entry."""
        if not self._is_loaded:
            self.load_model()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        if self._is_loaded:
            self.unload_model()


class ModelManager:
    """Manages multiple models and their lifecycle."""
    
    def __init__(self):
        self._models: Dict[str, BaseInferenceEngine] = {}
        self._active_model: Optional[str] = None
    
    def register_model(self, model_id: str, inference_engine: BaseInferenceEngine) -> None:
        """Register a model with the manager."""
        self._models[model_id] = inference_engine
    
    def load_model(self, model_id: str) -> BaseInferenceEngine:
        """Load a specific model."""
        if model_id not in self._models:
            raise ValueError(f"Model '{model_id}' not registered")
        
        # Unload current model if different
        if self._active_model and self._active_model != model_id:
            self.unload_current_model()
        
        model = self._models[model_id]
        if not model.is_loaded():
            model.load_model()
        
        self._active_model = model_id
        return model
    
    def unload_current_model(self) -> None:
        """Unload the currently active model."""
        if self._active_model:
            model = self._models[self._active_model]
            if model.is_loaded():
                model.unload_model()
            self._active_model = None
    
    def get_active_model(self) -> Optional[BaseInferenceEngine]:
        """Get the currently active model."""
        if self._active_model:
            return self._models[self._active_model]
        return None
    
    def list_models(self) -> List[str]:
        """List all registered models."""
        return list(self._models.keys())


class SamplerRegistry:
    """Registry for sampling strategies."""
    
    def __init__(self):
        self._samplers: Dict[str, BaseSampler] = {}
    
    def register_sampler(self, sampler: BaseSampler) -> None:
        """Register a sampler."""
        self._samplers[sampler.name] = sampler
    
    def get_sampler(self, name: str) -> BaseSampler:
        """Get a sampler by name."""
        if name not in self._samplers:
            raise ValueError(f"Sampler '{name}' not registered")
        return self._samplers[name]
    
    def list_samplers(self) -> List[str]:
        """List all registered samplers."""
        return list(self._samplers.keys())
    
    def get_all_samplers(self) -> Dict[str, BaseSampler]:
        """Get all registered samplers."""
        return self._samplers.copy()


# Global instances
model_manager = ModelManager()
sampler_registry = SamplerRegistry() 