# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **creative writing sampler benchmarking system** that evaluates different text generation sampling strategies (temperature, top-p, min-p, top-n-sigma, etc.) for creative writing tasks. The system is built with:

### Backend (Python)
- **Core API**: `backend/api/quality_api.py` - Main API for benchmark operations
- **Evaluation**: `backend/evaluation/` - LLM-based quality judging system using OpenAI models
- **Configuration**: `backend/config/` - YAML configs for samplers, models, and experiments

### Frontend (Next.js)
- **Visualization**: Interactive dashboard for viewing benchmark results and sampler performance
- **Components**: Chart components for probability distributions, quality metrics, and leaderboards
- **Data Processing**: Client-side analysis of benchmark JSON results

### Scripts
- **`scripts/run_benchmark.py`**: Generate text samples using different sampling strategies
- **`scripts/judge_results.py`**: Evaluate generated samples using LLM judges
- **`scripts/run_full_benchmark.py`**: Combined generation + judging workflow
- **`scripts/analyze_results.py`**: Result analysis and statistics

## Common Development Commands

### Backend Development
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run benchmark generation
python scripts/run_benchmark.py --model llama-3.1-8b-instruct --samplers llama_default standard_minp creative_minp

# Judge existing results
python scripts/judge_results.py --auto-find

# Full benchmark (generate + judge)
python scripts/run_full_benchmark.py --model llama-3.1-8b-instruct

# Start model server (KoboldCpp for benchmarking)
bash scripts/start_model_server.sh

# Start llama.cpp server (for visualization with more tokens)
bash scripts/start_llama_server.sh
```

### Frontend Development
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build production
npm run build

# Lint code
npm run lint
```

### Data Processing
```bash
# Generate visualization data (from KoboldCpp - limited tokens)
python scripts/generate_logits_data.py

# Generate visualization data (from llama.cpp - 20 clean tokens)
python scripts/generate_logits_llamacpp.py --port 5007

# Analyze results
python scripts/analyze_results.py
```

## Model Server Options

The system supports two inference servers depending on your use case:

### KoboldCpp Server (Port 5006)
- **Use for**: Benchmarking and text generation
- **Script**: `scripts/start_model_server.sh`
- **Features**: Full benchmarking capabilities, limited logprobs (5-6 tokens)
- **Data script**: `scripts/generate_logits_data.py`

### llama.cpp Server (Port 5007)
- **Use for**: Sampling visualization with more tokens
- **Script**: `scripts/start_llama_server.sh`  
- **Features**: Clean 20-token probability distributions for visualization
- **Data script**: `scripts/generate_logits_llamacpp.py`
- **Visualization**: Provides authentic token distributions for sampler comparison

## Key Configuration Files

- **`backend/config/samplers.yaml`**: Sampling strategy definitions (temperature, top-p, min-p, etc.)
- **`backend/config/robust_creative_writing.yaml`**: Experimental design and evaluation criteria
- **`frontend/package.json`**: Frontend dependencies and build scripts
- **`requirements.txt`**: Python dependencies

## Benchmark Workflow

1. **Generate samples**: Use `run_benchmark.py` to create text samples with different sampling strategies
2. **Judge quality**: Use `judge_results.py` to evaluate samples using LLM judges (GPT-4, etc.)
3. **Visualize results**: Frontend dashboard displays comparative analysis of sampling strategies

## Data Structure

- **`results/`**: JSON files containing benchmark results and judgments
- **`frontend/public/logits-data.json`**: Pre-computed visualization data
- Benchmark results include: generated text, sampler configs, quality scores, and metadata

## Working with Samplers

The system supports multiple sampling strategies:
- **Model defaults**: Provider-recommended settings for each model family
- **Min-p sampling**: Minimum probability threshold sampling
- **Top-n-sigma**: Standard deviation-based sampling
- **Traditional**: Top-p, top-k, temperature-only sampling

Sampler configurations are defined in `backend/config/samplers.yaml` with parameters like temperature, top_p, min_p, etc.