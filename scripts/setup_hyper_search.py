#!/usr/bin/env python3
"""
Hyperparameter Search Setup Verification

This script checks all prerequisites and guides you through setting up
the hyperparameter search system.
"""

import os
import sys
import subprocess
import requests
import time
from pathlib import Path

def print_step(step_num, title):
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {title}")
    print(f"{'='*60}")

def check_mark(success):
    return "✅" if success else "❌"

def check_virtual_environment():
    """Check if we're in a virtual environment."""
    return hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)

def check_dependencies():
    """Check if required packages are installed."""
    required_packages = ['requests', 'yaml', 'openai']
    missing = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            if package == 'yaml':
                try:
                    import pyyaml
                except ImportError:
                    missing.append('pyyaml')
            else:
                missing.append(package)
    
    return missing

def check_openai_api():
    """Check if OpenAI API key is configured and working."""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return False, "No API key found in environment"
    
    try:
        import openai
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        # Test with a minimal request
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[{'role': 'user', 'content': 'test'}],
            max_tokens=1
        )
        return True, "API working"
    except ImportError:
        return False, "OpenAI package not installed"
    except Exception as e:
        return False, f"API error: {str(e)[:100]}"

def check_model_server(model_name="llama-3.1-8b-instruct"):
    """Check if model server is running."""
    # Load model config to get port
    try:
        import yaml
        config_path = Path("backend/config/models.yaml")
        if config_path.exists():
            with open(config_path, 'r') as f:
                models_config = yaml.safe_load(f)
            
            if model_name in models_config.get('models', {}):
                port = models_config['models'][model_name].get('port', 5002)
            else:
                port = 5002  # default
        else:
            port = 5002
        
        # Test connection
        response = requests.get(f"http://localhost:{port}/api/v1/model", timeout=5)
        if response.status_code == 200:
            return True, f"Server running on port {port}"
        else:
            return False, f"Server responded with status {response.status_code}"
    
    except requests.exceptions.ConnectionError:
        return False, f"No server found on port {port}"
    except Exception as e:
        return False, f"Error checking server: {str(e)[:100]}"

def check_backend_imports():
    """Check if backend modules can be imported."""
    backend_path = Path("backend")
    if not backend_path.exists():
        return False, "Backend directory not found"
    
    sys.path.insert(0, str(backend_path))
    
    try:
        from api.quality_api import SamplerBenchAPI
        from evaluation.llm_judge import CreativeWritingJudge
        from utils.hyper_search import HyperParameterSearcher
        return True, "All imports working"
    except ImportError as e:
        return False, f"Import error: {str(e)[:100]}"

def main():
    print("🔍 HYPERPARAMETER SEARCH SETUP VERIFICATION")
    print("=" * 60)
    print("This script will check if everything is ready for hyperparameter search.")
    
    all_good = True
    
    # Step 1: Check virtual environment
    print_step(1, "Virtual Environment")
    venv_active = check_virtual_environment()
    print(f"{check_mark(venv_active)} Virtual environment: {'Active' if venv_active else 'Not active'}")
    
    if not venv_active:
        print("⚠️  Consider activating virtual environment:")
        print("   source venv/bin/activate  # Linux/Mac")
        print("   venv\\Scripts\\activate    # Windows")
        all_good = False
    
    # Step 2: Check dependencies
    print_step(2, "Python Dependencies")
    missing_deps = check_dependencies()
    deps_ok = len(missing_deps) == 0
    print(f"{check_mark(deps_ok)} Dependencies: {'All installed' if deps_ok else f'Missing: {missing_deps}'}")
    
    if missing_deps:
        print("🔧 Install missing dependencies:")
        print("   pip install -r requirements.txt")
        all_good = False
    
    # Step 3: Check OpenAI API
    print_step(3, "OpenAI API Configuration")
    api_ok, api_msg = check_openai_api()
    print(f"{check_mark(api_ok)} OpenAI API: {api_msg}")
    
    if not api_ok:
        print("🔧 Setup OpenAI API:")
        print("   1. Copy .env.example to .env")
        print("   2. Add your OpenAI API key to .env")
        print("   3. Reload environment variables")
        all_good = False
    
    # Step 4: Check backend imports
    print_step(4, "Backend Modules")
    imports_ok, imports_msg = check_backend_imports()
    print(f"{check_mark(imports_ok)} Backend imports: {imports_msg}")
    
    if not imports_ok:
        print("🔧 Check backend modules:")
        print("   1. Ensure you're in the project root directory")
        print("   2. Verify backend/ directory exists")
        print("   3. Check file permissions")
        all_good = False
    
    # Step 5: Check model server
    print_step(5, "Model Server")
    server_ok, server_msg = check_model_server()
    print(f"{check_mark(server_ok)} Model server: {server_msg}")
    
    if not server_ok:
        print("🔧 Start model server:")
        print("   ./scripts/start_model_server.sh llama-3.1-8b-instruct")
        print("   Wait for 'Loading complete' message")
        all_good = False
    
    # Summary
    print_step("✅" if all_good else "⚠️", "Setup Summary")
    
    if all_good:
        print("🎉 Everything looks good! You're ready to run hyperparameter search.")
        print("\n🚀 Try a quick test:")
        print("   python scripts/run_hyper_search.py --model llama-3.1-8b-instruct --config-section quick_test")
        
        # Offer to run quick test
        if input("\n🤔 Run quick test now? (y/n): ").lower().strip() == 'y':
            print("\n🔄 Running quick test...")
            try:
                result = subprocess.run([
                    sys.executable, "scripts/run_hyper_search.py",
                    "--model", "llama-3.1-8b-instruct",
                    "--config-section", "quick_test"
                ], check=True, capture_output=False)
                print("\n✅ Quick test completed successfully!")
            except subprocess.CalledProcessError:
                print("\n❌ Quick test failed. Check the output above for errors.")
            except KeyboardInterrupt:
                print("\n🛑 Test interrupted by user.")
    
    else:
        print("❌ Some issues need to be resolved before running hyperparameter search.")
        print("Please follow the 🔧 instructions above and run this script again.")
        
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code) 