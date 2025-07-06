# Sampler Bench: A Comprehensive Evaluation Framework for LLM Sampling Strategies

## Overview

Sampler Bench is a benchmarking platform designed to systematically evaluate different text generation sampling strategies for creative writing tasks. The framework employs multi-judge LLM-as-a-Judge evaluation with statistical rigor to assess the quality impact of various sampling methods across multiple language models.

## Key Features

- **5 Core Sampling Strategies**: Comprehensive evaluation of temperature, top-p, top-k, min-p, and top-n-sigma sampling methods
- **Multi-Judge Consensus Evaluation**: Parallel evaluation using multiple LLM judges via OpenRouter API for enhanced reliability
- **Statistical Rigor**: 20 samples per sampler (5 prompts × 4 repetitions) with reliability metrics and standard deviation tracking
- **Quality Control Framework**: Instruction following penalties and meta-commentary detection for objective scoring
- **Interactive Visualization**: Next.js frontend with comprehensive charts, probability distributions, and quality breakdowns
- **Production Architecture**: Decoupled generation and evaluation workflow with KoboldCpp integration

## Research Foundation

### Sampling Methods Evaluated

#### 1. Temperature Sampling
Traditional probability temperature scaling that controls generation randomness by modifying the softmax distribution:

```
P(token_i) = exp(logit_i / T) / Σ_j exp(logit_j / T)
```


#### 2. Top-p (Nucleus) Sampling
Dynamic vocabulary selection based on cumulative probability mass:

```
V_p = {token_i : Σ_{j=1}^{i} P(token_j) ≤ p}
```

#### 3. Top-k Sampling
Fixed vocabulary size sampling that considers only the k most probable tokens:

```
V_k = {token_1, token_2, ..., token_k}
```

#### 4. Min-p Sampling
Adaptive threshold sampling that sets minimum probability relative to the top token:

```
V_min-p = {token_i : P(token_i) ≥ α × max_j P(token_j)}
```

#### 5. Top-n-sigma Sampling
Statistical outlier detection in logit space using standard deviation thresholding:

```
V_n-sigma = {token_i : ℓ_i ≥ max_j(ℓ_j) - n × σ(ℓ)}
```

### Evaluation Framework

#### LLM-as-a-Judge Methodology
The evaluation system implements the LLM-as-a-Judge paradigm with multi-judge consensus for enhanced reliability:

- **Single Judge Mode**: OpenAI GPT-4 evaluation on 5 weighted criteria
- **Multi-Judge System**: Parallel evaluation using openai/gpt-4.1-nano and google/gemini-2.0-flash-001 via OpenRouter
- **Consensus Scoring**: Statistical aggregation with reliability metrics and standard deviation tracking

#### Quality Assessment Criteria

**Multi-Judge System (Primary)**:
- **Narrative Structure** (30%): Story organization, pacing, and plot coherence
- **Creativity Execution** (25%): Creative premise handling and original elements  
- **Character Voice** (20%): Character development and authentic voice
- **Prose Quality** (15%): Writing craft, style, and language use
- **Engagement** (10%): Reader interest and emotional impact

**Instruction Following Penalties**:
- Word count violations: -1.5 points
- Meta-commentary detection: -0.8 points
- Failed generation: -3.0 points

#### Statistical Design
- **Sample Size**: 20 samples per sampling strategy (5 prompts × 4 repetitions)
- **Target Length**: 300-400 word creative writing samples
- **Quality Scale**: 1-10 point scale with detailed rubrics
- **Reliability Metrics**: Standard deviation, consensus strength, judge agreement

## Architecture

### Backend Components

#### Core API (`backend/api/quality_api.py`)
Central orchestration system for benchmark operations:
- Model server initialization and management
- Sampling strategy configuration and execution
- Quality evaluation coordination
- Results aggregation and export

#### Evaluation System (`backend/evaluation/`)
- **`llm_judge.py`**: Single-judge evaluation with OpenAI GPT-4
- **`multi_judge.py`**: Multi-judge consensus system with OpenRouter integration
- **`quality_aggregator.py`**: Statistical aggregation and consensus scoring
- **`instruction_penalties.py`**: Objective quality control and penalty application

#### Configuration (`backend/config/`)
- **`samplers.yaml`**: Comprehensive sampling strategy definitions with model-specific defaults
- **`robust_creative_writing.yaml`**: Experimental design and evaluation criteria
- **Model mapping**: Dynamic resolution of optimal settings per model family

### Frontend Components

#### Interactive Dashboard (`frontend/`)
Next.js application providing comprehensive visualization:
- **Leaderboard**: Comparative sampler performance rankings
- **Quality Analysis**: Detailed criterion breakdowns and statistical metrics
- **Probability Distributions**: Visual analysis of sampling behavior
- **Methodology Documentation**: Comprehensive research methodology explanation

### Scripts and Workflow

#### Generation Pipeline
- **`scripts/run_benchmark.py`**: Text sample generation with configurable sampling strategies
- **`scripts/judge_results.py`**: LLM-based quality evaluation and scoring
- **`scripts/run_full_benchmark.py`**: Complete generation and evaluation workflow
- **`scripts/analyze_results.py`**: Statistical analysis and results processing

#### Data Processing
- **`scripts/generate_logits_data.py`**: Logit analysis and visualization data preparation
- **Model server management**: KoboldCpp integration for local inference

## Installation and Setup

### Prerequisites

- Python 3.8+ with pip
- Node.js 16+ with npm
- KoboldCpp for local model inference
- OpenRouter API key for multi-judge evaluation

### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp env.example .env
# Edit .env with your API keys:
# OPENROUTER_API_KEY=your_openrouter_key
# LLM_JUDGE_MODELS=openai/gpt-4.1-nano,google/gemini-2.0-flash-001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Model Server Setup

```bash
# Start KoboldCpp server (example for Llama model)
bash scripts/start_model_server.sh
```

## Usage

### Basic Benchmark Execution

```bash
# Generate samples with default settings
python scripts/run_benchmark.py --model llama-3.1-8b-instruct

# Evaluate generated samples
python scripts/judge_results.py --auto-find

# Complete workflow (generation + evaluation)
python scripts/run_full_benchmark.py --model llama-3.1-8b-instruct
```

### Custom Configuration

```bash
# Specific sampling strategies
python scripts/run_benchmark.py \
  --model llama-3.1-8b-instruct \
  --samplers model_default standard_minp creative_minp

# Custom evaluation configuration
python scripts/run_full_benchmark.py \
  --config backend/config/robust_creative_writing.yaml \
  --judge-model gpt-4o-mini
```

### Multi-Judge Evaluation

```bash
# Enable multi-judge system
export MULTI_JUDGE_ENABLED=true
export LLM_JUDGE_MODELS=openai/gpt-4.1-nano,google/gemini-2.0-flash-001

python scripts/judge_results.py --auto-find
```

## Sampling Strategy Configuration

### Model-Specific Defaults
The system automatically resolves optimal settings based on model families:

- **Llama models**: temperature 0.6, top_p 0.9
- **Mistral Small**: temperature 0.15, top_p 1.0  
- **Mistral Nemo**: temperature 0.35, top_p 1.0
- **Qwen models**: temperature 0.7, top_p 0.8, top_k 20
- **Gemma models**: temperature 1.0, top_p 0.95

### Research Configurations
- **standard_minp**: temperature 0.7, min_p 0.02
- **creative_minp**: temperature 1.0, min_p 0.02
- **standard_sigma**: temperature 1.5, sigma 1.0 (paper settings)
- **creative_sigma**: temperature 1.0, sigma 1.5

## Data Structure

### Benchmark Results
Results are stored as JSON files in the `results/` directory:

```json
{
  "benchmark_name": "Creative Writing Benchmark - Model Name",
  "timestamp": "ISO timestamp",
  "model_name": "model_identifier", 
  "model_config": {...},
  "prompts": [...],
  "sampler_configs": {...},
  "samples": [
    {
      "sample_id": 1,
      "prompt": "writing prompt",
      "sampler_name": "strategy_name",
      "generated_text": "sample output",
      "word_count": 350,
      "quality_scores": {...}
    }
  ],
  "metadata": {...}
}
```

### Evaluation Results
Judged results include comprehensive scoring:

```json
{
  "overall_score": 7.2,
  "overall_std": 0.8,
  "criterion_scores": [...],
  "judge_models": ["openai/gpt-4.1-nano", "google/gemini-2.0-flash-001"],
  "consensus_method": "average",
  "instruction_penalties": {...}
}
```

## Research Applications

### Comparative Analysis
The framework enables systematic comparison of sampling strategies across:
- **Quality dimensions**: Narrative structure, creativity, character development, prose quality, engagement
- **Model families**: Llama, Mistral, Qwen, Gemma architectures
- **Temperature ranges**: From conservative (0.1) to highly creative (2.0+)
- **Statistical reliability**: Multi-judge consensus with confidence intervals

### Novel Techniques Evaluation
- **Min-p sampling**: Assessment of adaptive threshold methods for high-temperature generation
- **Top-n-sigma sampling**: Evaluation of statistical approaches to logit-space token selection
- **Model-specific optimization**: Analysis of family-specific parameter tuning

### Quality Control Research
- **Instruction following**: Quantitative assessment of adherence to length and format requirements
- **Meta-commentary detection**: Automatic identification of authorial intrusion
- **Consensus reliability**: Inter-judge agreement and statistical validation

## License

MIT License