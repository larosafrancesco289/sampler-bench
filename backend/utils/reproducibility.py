"""Reproducibility utilities for Sampler Bench."""

import os
import random
import hashlib
import json
from typing import Dict, Any, Optional
import numpy as np
import torch
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class ReproducibilityState:
    """Container for reproducibility state information."""
    global_seed: int
    python_seed: int
    numpy_seed: int
    torch_seed: int
    torch_cuda_seed: int
    environment_hash: str
    timestamp: str
    git_commit: Optional[str] = None
    cuda_deterministic: bool = True
    torch_backends_cudnn_deterministic: bool = True
    torch_backends_cudnn_benchmark: bool = False


class ReproducibilityManager:
    """Manages reproducibility settings and state across experiments."""
    
    def __init__(self, base_seed: int = 42):
        self.base_seed = base_seed
        self.state = None
        
    def set_global_seed(self, seed: int) -> ReproducibilityState:
        """Set all random seeds for reproducibility.
        
        Args:
            seed: Global seed value to use
            
        Returns:
            ReproducibilityState object with all seed information
        """
        # Set Python random seed
        random.seed(seed)
        
        # Set NumPy seed
        np.random.seed(seed)
        
        # Set PyTorch seeds
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed(seed)
            torch.cuda.manual_seed_all(seed)
        
        # Set deterministic behavior
        if torch.cuda.is_available():
            torch.backends.cudnn.deterministic = True
            torch.backends.cudnn.benchmark = False
        
        # Create state object
        self.state = ReproducibilityState(
            global_seed=seed,
            python_seed=seed,
            numpy_seed=seed,
            torch_seed=seed,
            torch_cuda_seed=seed,
            environment_hash=self._get_environment_hash(),
            timestamp=datetime.now().isoformat(),
            git_commit=self._get_git_commit(),
            cuda_deterministic=True,
            torch_backends_cudnn_deterministic=True,
            torch_backends_cudnn_benchmark=False
        )
        
        return self.state
    
    def get_experiment_seed(self, experiment_name: str, condition_id: str) -> int:
        """Generate a deterministic seed for a specific experimental condition.
        
        Args:
            experiment_name: Name of the experiment
            condition_id: Unique identifier for the condition
            
        Returns:
            Deterministic seed value for this condition
        """
        # Create deterministic seed from experiment and condition
        combined_str = f"{self.base_seed}_{experiment_name}_{condition_id}"
        hash_obj = hashlib.md5(combined_str.encode())
        return int(hash_obj.hexdigest()[:8], 16) % (2**31)
    
    def save_state(self, output_path: str) -> None:
        """Save reproducibility state to file.
        
        Args:
            output_path: Path to save the state file
        """
        if self.state is None:
            raise ValueError("No reproducibility state to save. Call set_global_seed() first.")
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(asdict(self.state), f, indent=2)
    
    def load_state(self, state_path: str) -> ReproducibilityState:
        """Load and apply reproducibility state from file.
        
        Args:
            state_path: Path to the state file
            
        Returns:
            Loaded ReproducibilityState object
        """
        with open(state_path, 'r') as f:
            state_dict = json.load(f)
        
        loaded_state = ReproducibilityState(**state_dict)
        
        # Apply the loaded state
        self.set_global_seed(loaded_state.global_seed)
        
        return loaded_state
    
    def _get_environment_hash(self) -> str:
        """Generate a hash of the current environment for reproducibility tracking."""
        env_info = {
            'python_version': os.sys.version,
            'torch_version': torch.__version__,
            'cuda_available': torch.cuda.is_available(),
            'cuda_version': torch.version.cuda if torch.cuda.is_available() else None,
            'device_count': torch.cuda.device_count() if torch.cuda.is_available() else 0,
        }
        
        # Add GPU info if available
        if torch.cuda.is_available():
            env_info['gpu_name'] = torch.cuda.get_device_name(0)
        
        env_str = json.dumps(env_info, sort_keys=True)
        return hashlib.sha256(env_str.encode()).hexdigest()[:16]
    
    def _get_git_commit(self) -> Optional[str]:
        """Get current git commit hash if available."""
        try:
            import subprocess
            result = subprocess.run(
                ['git', 'rev-parse', 'HEAD'], 
                capture_output=True, 
                text=True, 
                cwd=os.getcwd()
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except (subprocess.SubprocessError, FileNotFoundError):
            pass
        return None
    
    def validate_environment(self, reference_state: ReproducibilityState) -> bool:
        """Validate that current environment matches reference state.
        
        Args:
            reference_state: Reference state to compare against
            
        Returns:
            True if environments match, False otherwise
        """
        current_hash = self._get_environment_hash()
        return current_hash == reference_state.environment_hash


class ConditionSeedManager:
    """Manages seeds for individual experimental conditions."""
    
    def __init__(self, reproducibility_manager: ReproducibilityManager):
        self.repro_manager = reproducibility_manager
        self._condition_seeds = {}
    
    def get_condition_seed(self, model: str, sampler: str, task: str, sample_idx: int) -> int:
        """Get a deterministic seed for a specific condition and sample.
        
        Args:
            model: Model identifier
            sampler: Sampler identifier  
            task: Task identifier
            sample_idx: Sample index within condition
            
        Returns:
            Deterministic seed for this specific condition and sample
        """
        condition_id = f"{model}_{sampler}_{task}_{sample_idx}"
        
        if condition_id not in self._condition_seeds:
            self._condition_seeds[condition_id] = self.repro_manager.get_experiment_seed(
                "condition", condition_id
            )
        
        return self._condition_seeds[condition_id]
    
    def save_condition_seeds(self, output_path: str) -> None:
        """Save all condition seeds to file for reproducibility."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(self._condition_seeds, f, indent=2)


def ensure_reproducible_environment(seed: int = 42) -> ReproducibilityManager:
    """Set up a reproducible environment with the given seed.
    
    Args:
        seed: Global seed to use
        
    Returns:
        Configured ReproducibilityManager instance
    """
    repro_manager = ReproducibilityManager(base_seed=seed)
    repro_manager.set_global_seed(seed)
    
    # Additional environment variables for reproducibility
    os.environ['PYTHONHASHSEED'] = str(seed)
    os.environ['CUBLAS_WORKSPACE_CONFIG'] = ':4096:8'
    
    # Enable deterministic operations in PyTorch
    torch.use_deterministic_algorithms(True, warn_only=True)
    
    return repro_manager


def create_experiment_manifest(
    experiment_name: str,
    config: Dict[str, Any],
    repro_state: ReproducibilityState,
    output_dir: str
) -> str:
    """Create a comprehensive experiment manifest for reproducibility.
    
    Args:
        experiment_name: Name of the experiment
        config: Experiment configuration
        repro_state: Reproducibility state
        output_dir: Directory to save manifest
        
    Returns:
        Path to the created manifest file
    """
    manifest = {
        'experiment_name': experiment_name,
        'created_at': datetime.now().isoformat(),
        'config': config,
        'reproducibility': asdict(repro_state),
        'system_info': {
            'platform': os.uname()._asdict() if hasattr(os, 'uname') else str(os.name),
            'python_executable': os.sys.executable,
            'working_directory': os.getcwd(),
        }
    }
    
    manifest_path = os.path.join(output_dir, f"{experiment_name}_manifest.json")
    os.makedirs(output_dir, exist_ok=True)
    
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2, default=str)
    
    return manifest_path 