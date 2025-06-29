"""Configuration management utilities for Sampler Bench."""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from omegaconf import OmegaConf, DictConfig
from dataclasses import dataclass


@dataclass
class ModelConfig:
    """Configuration for a single model."""
    name: str
    path: str
    context_length: int
    quantization: str
    inference_engine: str
    template: str
    parameters: Dict[str, Any]


@dataclass
class SamplerConfig:
    """Configuration for a sampling strategy."""
    name: str
    description: str
    parameters: Dict[str, Any]


@dataclass
class ExperimentConfig:
    """Configuration for an experiment."""
    name: str
    description: str
    models: list[str]
    samplers: list[str]
    tasks: list[str]
    samples_per_condition: int
    seed: int
    evaluation: Dict[str, Any]
    output_dir: str


class ConfigManager:
    """Manages configuration loading and validation."""
    
    def __init__(self, config_dir: str = "backend/config"):
        self.config_dir = Path(config_dir)
        self._models_config = None
        self._samplers_config = None
        self._experiments_config = None
    
    def load_models_config(self) -> Dict[str, ModelConfig]:
        """Load and parse models configuration."""
        if self._models_config is None:
            config_path = self.config_dir / "models.yaml"
            if not config_path.exists():
                # Try example file if main config doesn't exist
                config_path = self.config_dir / "models.example.yaml"
            
            with open(config_path, 'r') as f:
                config_data = yaml.safe_load(f)
            
            self._models_config = {}
            for model_id, model_data in config_data.get("models", {}).items():
                self._models_config[model_id] = ModelConfig(
                    name=model_data["name"],
                    path=model_data["path"],
                    context_length=model_data["context_length"],
                    quantization=model_data["quantization"],
                    inference_engine=model_data["inference_engine"],
                    template=model_data["template"],
                    parameters=model_data.get("parameters", {})
                )
        
        return self._models_config
    
    def load_samplers_config(self) -> Dict[str, SamplerConfig]:
        """Load and parse samplers configuration."""
        if self._samplers_config is None:
            config_path = self.config_dir / "samplers.yaml"
            
            with open(config_path, 'r') as f:
                config_data = yaml.safe_load(f)
            
            self._samplers_config = {}
            for sampler_id, sampler_data in config_data.get("samplers", {}).items():
                self._samplers_config[sampler_id] = SamplerConfig(
                    name=sampler_data["name"],
                    description=sampler_data["description"],
                    parameters=sampler_data["parameters"]
                )
        
        return self._samplers_config
    
    def load_experiments_config(self) -> Dict[str, ExperimentConfig]:
        """Load and parse experiments configuration."""
        if self._experiments_config is None:
            config_path = self.config_dir / "experiments.yaml"
            if not config_path.exists():
                config_path = self.config_dir / "experiments.example.yaml"
            
            with open(config_path, 'r') as f:
                config_data = yaml.safe_load(f)
            
            self._experiments_config = {}
            for exp_id, exp_data in config_data.get("experiments", {}).items():
                self._experiments_config[exp_id] = ExperimentConfig(
                    name=exp_data["name"],
                    description=exp_data["description"],
                    models=exp_data["models"],
                    samplers=exp_data["samplers"],
                    tasks=exp_data["tasks"],
                    samples_per_condition=exp_data["samples_per_condition"],
                    seed=exp_data["seed"],
                    evaluation=exp_data["evaluation"],
                    output_dir=exp_data["output_dir"]
                )
        
        return self._experiments_config
    
    def get_model_config(self, model_id: str) -> ModelConfig:
        """Get configuration for a specific model."""
        models = self.load_models_config()
        if model_id not in models:
            raise ValueError(f"Model '{model_id}' not found in configuration")
        return models[model_id]
    
    def get_sampler_config(self, sampler_id: str) -> SamplerConfig:
        """Get configuration for a specific sampler."""
        samplers = self.load_samplers_config()
        if sampler_id not in samplers:
            raise ValueError(f"Sampler '{sampler_id}' not found in configuration")
        return samplers[sampler_id]
    
    def get_experiment_config(self, experiment_id: str) -> ExperimentConfig:
        """Get configuration for a specific experiment."""
        experiments = self.load_experiments_config()
        if experiment_id not in experiments:
            raise ValueError(f"Experiment '{experiment_id}' not found in configuration")
        return experiments[experiment_id]
    
    def validate_experiment(self, experiment_id: str) -> bool:
        """Validate that an experiment configuration is valid."""
        exp_config = self.get_experiment_config(experiment_id)
        models_config = self.load_models_config()
        samplers_config = self.load_samplers_config()
        
        # Check that all models exist
        for model_id in exp_config.models:
            if model_id not in models_config:
                raise ValueError(f"Model '{model_id}' in experiment '{experiment_id}' not found")
        
        # Check that all samplers exist
        for sampler_id in exp_config.samplers:
            if sampler_id not in samplers_config:
                raise ValueError(f"Sampler '{sampler_id}' in experiment '{experiment_id}' not found")
        
        return True


# Global config manager instance
config_manager = ConfigManager()


def load_config(config_file: str) -> DictConfig:
    """Load a configuration file using OmegaConf."""
    if not os.path.exists(config_file):
        raise FileNotFoundError(f"Configuration file not found: {config_file}")
    
    return OmegaConf.load(config_file)


def merge_configs(*configs: DictConfig) -> DictConfig:
    """Merge multiple configurations, with later configs overriding earlier ones."""
    if not configs:
        return OmegaConf.create({})
    
    merged = configs[0]
    for config in configs[1:]:
        merged = OmegaConf.merge(merged, config)
    
    return merged


def save_config(config: DictConfig, output_path: str) -> None:
    """Save a configuration to a YAML file."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        OmegaConf.save(config, f) 