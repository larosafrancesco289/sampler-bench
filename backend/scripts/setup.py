#!/usr/bin/env python3
"""Setup script for Sampler Bench."""

import os
import sys
import argparse
import subprocess
from pathlib import Path
from typing import List
import requests
from tqdm import tqdm


def create_directories():
    """Create necessary directories for the project."""
    directories = [
        "models",
        "data/datasets",
        "data/raw_outputs", 
        "data/processed",
        "data/visualizations",
        "data/metadata",
        "cache",
        "logs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")


def copy_config_files():
    """Copy example configuration files to working configurations."""
    config_files = [
        ("backend/config/models.example.yaml", "backend/config/models.yaml"),
        ("backend/config/experiments.example.yaml", "backend/config/experiments.yaml"),
        ("environment.example", ".env")
    ]
    
    for src, dst in config_files:
        if not Path(dst).exists():
            if Path(src).exists():
                import shutil
                shutil.copy2(src, dst)
                print(f"✅ Copied {src} → {dst}")
            else:
                print(f"⚠️  Source file not found: {src}")
        else:
            print(f"ℹ️  Config file already exists: {dst}")


def install_dependencies():
    """Install Python dependencies."""
    print("📦 Installing Python dependencies...")
    
    # Check if Poetry is available
    try:
        subprocess.run(["poetry", "--version"], check=True, capture_output=True)
        print("Using Poetry for dependency management...")
        subprocess.run(["poetry", "install"], check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Poetry not found, using pip...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    
    print("✅ Dependencies installed successfully")


def download_file(url: str, output_path: str, description: str = None):
    """Download a file with progress bar."""
    if Path(output_path).exists():
        print(f"ℹ️  File already exists: {output_path}")
        return
    
    print(f"📥 Downloading {description or url}...")
    
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    total_size = int(response.headers.get('content-length', 0))
    
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'wb') as f, tqdm(
        desc=description,
        total=total_size,
        unit='B',
        unit_scale=True,
        unit_divisor=1024,
    ) as pbar:
        for chunk in response.iter_content(chunk_size=8192):
            size = f.write(chunk)
            pbar.update(size)
    
    print(f"✅ Downloaded: {output_path}")


def download_models(models: List[str]):
    """Download specified models."""
    model_urls = {
        "llama-3-8b-q4": {
            "url": "https://huggingface.co/bartowski/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
            "path": "models/llama-3-8b-instruct.gguf",
            "description": "Llama 3 8B Instruct (Q4_K_M)"
        },
        "mistral-7b-q4": {
            "url": "https://huggingface.co/bartowski/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/Mistral-7B-Instruct-v0.2-Q4_K_M.gguf",
            "path": "models/mistral-7b-instruct-v0.2.gguf", 
            "description": "Mistral 7B Instruct v0.2 (Q4_K_M)"
        }
    }
    
    for model in models:
        if model in model_urls:
            model_info = model_urls[model]
            try:
                download_file(
                    model_info["url"],
                    model_info["path"],
                    model_info["description"]
                )
            except Exception as e:
                print(f"❌ Failed to download {model}: {e}")
        else:
            print(f"⚠️  Unknown model: {model}")
            print(f"Available models: {list(model_urls.keys())}")


def setup_git_hooks():
    """Set up git hooks for code quality."""
    if Path(".git").exists():
        hooks_dir = Path(".git/hooks")
        hooks_dir.mkdir(exist_ok=True)
        
        pre_commit_hook = hooks_dir / "pre-commit"
        pre_commit_content = """#!/bin/bash
# Run code formatting and linting before commit
echo "Running pre-commit checks..."

# Format code with black
black backend/ --check --quiet || {
    echo "❌ Code formatting check failed. Run 'black backend/' to fix."
    exit 1
}

# Check imports with isort
isort backend/ --check-only --quiet || {
    echo "❌ Import sorting check failed. Run 'isort backend/' to fix."
    exit 1
}

echo "✅ Pre-commit checks passed"
"""
        
        with open(pre_commit_hook, 'w') as f:
            f.write(pre_commit_content)
        
        pre_commit_hook.chmod(0o755)
        print("✅ Git pre-commit hook installed")


def validate_environment():
    """Validate that the environment is set up correctly."""
    print("🔍 Validating environment...")
    
    # Check Python version
    if sys.version_info < (3, 11):
        print("⚠️  Python 3.11+ recommended")
    else:
        print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}")
    
    # Check for GPU
    try:
        import torch
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
            print(f"✅ GPU: {gpu_name} ({gpu_memory:.1f}GB)")
        else:
            print("⚠️  No GPU detected - CPU inference will be slow")
    except ImportError:
        print("⚠️  PyTorch not installed yet")
    
    # Check disk space
    import shutil
    free_space = shutil.disk_usage(".").free / 1e9
    if free_space < 50:
        print(f"⚠️  Low disk space: {free_space:.1f}GB (50GB+ recommended)")
    else:
        print(f"✅ Disk space: {free_space:.1f}GB available")


def main():
    """Main setup function."""
    parser = argparse.ArgumentParser(description="Set up Sampler Bench")
    parser.add_argument(
        "--models", 
        nargs="*", 
        default=[], 
        help="Models to download (llama-3-8b-q4, mistral-7b-q4)"
    )
    parser.add_argument(
        "--skip-deps", 
        action="store_true", 
        help="Skip dependency installation"
    )
    parser.add_argument(
        "--quick", 
        action="store_true", 
        help="Quick setup (no model downloads)"
    )
    
    args = parser.parse_args()
    
    print("🚀 Setting up Sampler Bench...")
    print("=" * 50)
    
    # Basic setup
    create_directories()
    copy_config_files()
    
    if not args.skip_deps:
        install_dependencies()
    
    # Git hooks
    setup_git_hooks()
    
    # Download models if requested
    if not args.quick and args.models:
        download_models(args.models)
    
    # Validation
    validate_environment()
    
    print("\n" + "=" * 50)
    print("🎉 Setup complete!")
    print("\nNext steps:")
    print("1. Edit .env with your OpenAI API key")
    print("2. Edit backend/config/models.yaml if needed")
    print("3. Run a test: python backend/run_benchmark.py --help")
    
    if args.quick:
        print("4. Download models: python backend/scripts/setup.py --models llama-3-8b-q4")


if __name__ == "__main__":
    main() 