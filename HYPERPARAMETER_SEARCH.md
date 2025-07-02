# Hyperparameter Search for Sampler Optimization

## Overview

The Sampler Hyperparameter Search system automatically finds optimal sampling configurations for creative writing tasks by systematically exploring parameter spaces and evaluating quality using your existing benchmark infrastructure.

## 🚀 Complete Setup & Quick Start

### Step 1: Environment Setup

```bash
# 1. Activate virtual environment
source venv/bin/activate  # On Linux/Mac
# OR
venv\Scripts\activate     # On Windows

# 2. Verify dependencies
pip install -r requirements.txt

# 3. Set up OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### Step 2: Start Model Server

```bash
# Start KoboldCpp server with your preferred model
./scripts/start_model_server.sh llama-3.1-8b-instruct

# This will:
# - Download the model if needed
# - Start KoboldCpp on the configured port
# - Wait for the server to be ready
```

**Wait for the server to fully load** (you'll see "Loading complete" or similar message)

### Step 3: Run Hyperparameter Search

```bash
# Quick test to verify everything works
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --config-section quick_test

# This will:
# ✅ Check OpenAI API connection
# ✅ Verify model server is running  
# ✅ Run a small search (~10 configs)
# ✅ Save results to results/ directory
```

### Step 4: Analyze Results

```bash
# Analyze the search results
python scripts/analyze_hyper_search.py --latest

# Export best configurations for future use
python scripts/analyze_hyper_search.py --latest --export best_configs.yaml
```

## 🔧 Detailed Prerequisites

### 1. Virtual Environment
```bash
# If venv doesn't exist, create it:
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Model Server Requirements
- **KoboldCpp**: Must be installed and accessible
- **Model**: Downloaded and configured (8GB+ disk space)
- **GPU Memory**: 6GB+ recommended for 8B models
- **Network**: Stable connection for model downloads

### 3. OpenAI API Setup
```bash
# In your .env file:
OPENAI_API_KEY=sk-your-key-here

# Test the API key:
python -c "import openai; print('API key works!' if openai.api_key else 'Set OPENAI_API_KEY')"
```

## 🚦 Complete Workflow Example

Here's a complete session from start to finish:

```bash
# 1. Activate environment
cd /path/to/sampler-bench
source venv/bin/activate

# 2. Start model server (in background or separate terminal)
./scripts/start_model_server.sh llama-3.1-8b-instruct
# Wait for "Loading complete..." message

# 3. Verify setup with quick test
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --config-section quick_test

# 4. If quick test works, run full search
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --strategy bayesian \
  --iterations 50

# 5. Analyze results
python scripts/analyze_hyper_search.py --latest

# 6. Export best configurations
python scripts/analyze_hyper_search.py --latest --export optimal_samplers.yaml

# 7. Use the discovered settings in your benchmarks
python scripts/run_full_benchmark.py \
  --model llama-3.1-8b-instruct \
  --samplers $(cat optimal_samplers.yaml | grep -A1 "best_overall:" | tail -1)
```

## ⚠️ Troubleshooting Setup Issues

### Model Server Not Starting
```bash
# Check if port is already in use
lsof -i :5002  # Default port for llama-3.1-8b-instruct

# Check model server logs
tail -f koboldcpp.log

# Restart with verbose logging
./scripts/start_model_server.sh llama-3.1-8b-instruct --verbose
```

### OpenAI API Issues
```bash
# Test API connection
python -c "
import os
from openai import OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
try:
    response = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=[{'role': 'user', 'content': 'test'}],
        max_tokens=5
    )
    print('✅ OpenAI API working')
except Exception as e:
    print(f'❌ API Error: {e}')
"
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Verify backend modules
python -c "
import sys
sys.path.insert(0, 'backend')
try:
    from api.quality_api import SamplerBenchAPI
    print('✅ Backend imports working')
except ImportError as e:
    print(f'❌ Import error: {e}')
"
```

## 🚀 Quick Start

### Prerequisites

1. **Model Server**: Ensure your KoboldCpp model server is running
2. **OpenAI API Key**: Set in `.env` for quality evaluation
3. **Dependencies**: Install requirements from `requirements.txt`

### Basic Usage

```bash
# Quick test with default settings
python scripts/run_hyper_search.py --model llama-3.1-8b-instruct

# Use predefined quick test configuration  
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --config-section quick_test

# Bayesian optimization with more iterations
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --strategy bayesian \
  --iterations 100 \
  --samples-per-config 5
```

## 📊 Search Strategies

### 1. Grid Search (`--strategy grid`)
- **Best for**: Small parameter spaces, thorough exploration
- **Pros**: Guaranteed to find global optimum in search space
- **Cons**: Exponential growth with parameters
- **Recommended**: 2-3 parameters with 3-5 values each

```bash
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --strategy grid \
  --samplers min_p \
  --config-section intensive_search
```

### 2. Random Search (`--strategy random`)
- **Best for**: Quick exploration, many parameters
- **Pros**: Fast, good for high-dimensional spaces
- **Cons**: May miss optimal regions
- **Recommended**: When you have limited time or many parameters

```bash
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --strategy random \
  --iterations 50
```

### 3. Bayesian Optimization (`--strategy bayesian`)
- **Best for**: Balanced exploration and exploitation
- **Pros**: Efficient, focuses on promising areas
- **Cons**: Simple implementation (can be improved)
- **Recommended**: Default choice for most cases

```bash
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --strategy bayesian \
  --iterations 75
```

## ⚙️ Configuration

### Configuration File Structure

The search is configured via YAML files (default: `backend/config/hyper_search_config.yaml`):

```yaml
# Search strategy: grid, random, bayesian
search_strategy: "bayesian"

# Number of iterations for non-grid searches
n_iterations: 50

# Samples per configuration for statistical robustness
samples_per_config: 3

# Sampler types to optimize
sampler_types:
  - "top_p"
  - "min_p"
  - "top_n_sigma"

# Parameter ranges for each sampler
parameter_ranges:
  min_p:
    temperature: [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5]
    min_p: [0.01, 0.02, 0.03, 0.05, 0.08, 0.1]
    max_tokens: [512]

# Test prompts for evaluation
test_prompts:
  - "Write a short story about discovering a hidden room in an old library."
  - "Create a story where the protagonist can hear other people's thoughts."
```

### Predefined Configurations

#### Quick Test (`quick_test`)
- **Purpose**: Fast validation, development testing
- **Time**: ~5-10 minutes
- **Configurations**: ~20 tested

#### Standard (`root level`)
- **Purpose**: Balanced exploration
- **Time**: ~30-60 minutes  
- **Configurations**: ~50 tested

#### Intensive Search (`intensive_search`)
- **Purpose**: Thorough optimization
- **Time**: 2-4 hours
- **Configurations**: Grid search over refined ranges

## 🎯 Sampler Types and Parameters

### Top-p (Nucleus) Sampling
- **temperature**: Controls randomness (0.6-1.3 recommended)
- **top_p**: Cumulative probability threshold (0.8-0.99)
- **Good for**: Balanced creativity and coherence

### Min-p Sampling  
- **temperature**: Higher values work well (0.7-1.6)
- **min_p**: Minimum probability threshold (0.005-0.15)
- **Good for**: Creative writing with controlled randomness

### Top-n-sigma Sampling
- **temperature**: Often higher values (0.8-2.2)
- **top_n_sigma**: Standard deviation multiplier (0.5-3.0)
- **Good for**: Experimental creativity, novel approaches

## 📈 Results Analysis

### Analyze Search Results

```bash
# Analyze latest results
python scripts/analyze_hyper_search.py --latest

# Analyze specific file
python scripts/analyze_hyper_search.py results/hyper_search_bayesian_20240101_120000.json

# Compare multiple searches
python scripts/analyze_hyper_search.py --compare results/hyper_search_*.json

# Export best configurations
python scripts/analyze_hyper_search.py --latest --export best_samplers.yaml
```

### Analysis Report Includes

1. **Search Overview**: Total configurations, best score, timestamp
2. **Sampler Performance**: Mean scores, variance, best configs per sampler
3. **Parameter Importance**: Which parameters affect quality most
4. **Optimal Ranges**: Parameter ranges for top-performing configs
5. **Recommendations**: Actionable insights for further optimization

### Example Output

```
🔍 HYPERPARAMETER SEARCH ANALYSIS REPORT
==================================================

📊 Search Overview:
   Total configurations tested: 47
   Best overall score: 8.234
   Search timestamp: 2024-01-01T12:00:00

🎯 Sampler Performance Analysis:

   MIN_P:
     Mean score: 7.845 ± 0.423
     Range: 6.890 - 8.234
     Configurations tested: 23
     Best config: {'temperature': 1.2, 'min_p': 0.02, 'max_tokens': 512}
     Best score: 8.234

🎯 Optimal Parameter Ranges:

   MIN_P:
     temperature: 1.0 - 1.3
     min_p: 0.015 - 0.03

💡 Recommendations:

   🏆 Best Overall Configuration:
     Sampler: min_p
     Score: 8.234 ± 0.156
     Parameters: {'temperature': 1.2, 'min_p': 0.02, 'max_tokens': 512}
```

## 🔧 Advanced Usage

### Custom Search Spaces

Create your own configuration file:

```yaml
# custom_search.yaml
search_strategy: "grid"
sampler_types: ["min_p"]
parameter_ranges:
  min_p:
    temperature: [1.0, 1.1, 1.2, 1.3]
    min_p: [0.01, 0.02, 0.03]
    max_tokens: [512]
test_prompts:
  - "Your custom prompt here"
```

```bash
python scripts/run_hyper_search.py \
  --config custom_search.yaml \
  --model llama-3.1-8b-instruct
```

### Command Line Overrides

```bash
# Override specific settings
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --strategy random \
  --iterations 30 \
  --samples-per-config 2 \
  --samplers min_p top_n_sigma \
  --custom-prompts "Write about AI" "Create a mystery"
```

### Reproducible Results

```bash
# Use seed for reproducible results
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --seed 42
```

## 📁 File Organization

```
sampler-bench/
├── backend/config/
│   └── hyper_search_config.yaml    # Search configurations
├── scripts/
│   ├── run_hyper_search.py         # Main search script
│   └── analyze_hyper_search.py     # Results analysis
├── results/
│   ├── hyper_search_*.json         # Search results
│   └── best_configs.yaml           # Exported best configurations
└── backend/utils/
    └── hyper_search.py             # Core search engine
```

## 🎨 Integration with Existing Workflow

### Use Discovered Configurations

1. **Export best configs**: `--export best_samplers.yaml`
2. **Add to samplers.yaml**: Copy best configurations to your samplers config
3. **Use in benchmarks**: Reference new sampler names in benchmark scripts

### Iterative Refinement

1. **Broad search**: Start with wide parameter ranges
2. **Analyze results**: Identify promising regions
3. **Focused search**: Create narrow ranges around good parameters
4. **Validate**: Run full benchmarks with discovered configurations

## 🚀 Best Practices

### Search Strategy Selection

- **Start with Bayesian**: Good default choice
- **Use Grid for final refinement**: When you know promising ranges
- **Random for exploration**: When parameter space is large

### Parameter Range Design

- **Start wide**: Include conservative and creative settings
- **Use logarithmic spacing**: For parameters like min_p, learning rates
- **Consider model characteristics**: Different models may prefer different ranges

### Evaluation Design

- **Multiple prompts**: Use diverse creative writing prompts
- **Sufficient samples**: 3-5 samples per config for statistical reliability
- **Consistent evaluation**: Use same judge model throughout

### Computational Efficiency

- **Quick tests first**: Use `quick_test` config for development
- **Batch similar searches**: Compare related strategies in one run
- **Monitor progress**: Check intermediate results during long searches

## 🔍 Troubleshooting

### Common Issues

1. **No valid results**: Check model server connection, API keys
2. **Low scores**: Verify judge is working, check prompt quality
3. **Search crashes**: Ensure sufficient disk space, stable network

### Performance Tips

- **Use faster judge models**: `gpt-4o-mini` instead of `gpt-4`
- **Reduce samples per config**: For quick exploration
- **Parallel execution**: Run multiple searches with different parameter ranges

### Result Interpretation

- **High variance**: Parameter ranges too wide or insufficient samples
- **Flat performance**: Parameter might not be important for your task
- **Clear winners**: Good candidates for focused refinement

## 📚 Examples and Tutorials

### Tutorial 1: Finding Optimal Min-p Settings

```bash
# 1. Quick exploration
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --samplers min_p \
  --strategy random \
  --iterations 25

# 2. Analyze results
python scripts/analyze_hyper_search.py --latest

# 3. Focused search on promising ranges
# (Edit config with discovered ranges)
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --samplers min_p \
  --strategy grid \
  --config focused_minp.yaml

# 4. Export best configuration
python scripts/analyze_hyper_search.py --latest --export optimal_minp.yaml
```

### Tutorial 2: Comparing All Sampler Types

```bash
# Comprehensive comparison
python scripts/run_hyper_search.py \
  --model llama-3.1-8b-instruct \
  --strategy bayesian \
  --iterations 100 \
  --samples-per-config 4

# Detailed analysis
python scripts/analyze_hyper_search.py --latest --export comparison_results.yaml
```

This hyperparameter search system integrates seamlessly with your existing benchmark infrastructure and provides a powerful way to optimize sampler configurations for your specific creative writing tasks. 