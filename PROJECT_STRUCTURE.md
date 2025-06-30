# Sampler Bench - Project Structure

## Overview
A quality-focused benchmarking platform for evaluating different LLM sampling strategies on creative writing tasks using LLM-as-a-Judge evaluation.

## Directory Structure

```
sampler-bench/
├── backend/                    # Core backend modules
│   ├── api/                   # Frontend-ready API
│   │   ├── __init__.py
│   │   └── quality_api.py     # Main API for frontend integration
│   ├── config/                # Configuration files
│   │   ├── models.yaml        # Model configurations
│   │   ├── samplers.yaml      # Sampler presets
│   │   └── experiments.yaml   # Experiment templates
│   ├── evaluation/            # Quality evaluation system
│   │   ├── __init__.py
│   │   ├── llm_judge.py       # LLM-as-a-Judge implementation
│   │   ├── quality_aggregator.py  # Quality-focused results aggregation
│   │   └── aggregator.py      # Legacy aggregator (kept for compatibility)
│   ├── inference/             # Text generation
│   │   ├── __init__.py
│   │   ├── base.py           # Base generator interface
│   │   └── koboldcpp.py      # KoboldCpp integration
│   └── utils/                # Utilities
│       ├── __init__.py
│       ├── config.py         # Configuration management
│       ├── logging.py        # Logging utilities
│       └── reproducibility.py # Reproducibility helpers
├── scripts/                   # Main execution scripts
│   ├── run_benchmark.py      # Generate text samples (decoupled from judging)
│   ├── judge_results.py      # Evaluate existing results for quality
│   ├── legacy_judge_existing_results.py  # Legacy judge script
│   └── README.md             # Scripts usage documentation
├── tests/                     # Test files
│   ├── test_quality_api.py   # API validation tests
│   ├── test_judge_setup.py   # Judge setup validation
│   └── start_llama_dev.sh    # Development server starter
├── archive/                   # Archived results and data
├── results/                   # Current benchmark results
├── data/                      # Data and prompts
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables (user created)
├── .env.example              # Environment template
├── README.md                 # Main documentation
├── PLAN.md                   # Original project plan
├── JUDGE_SETUP.md           # Judge configuration guide
└── PROJECT_STRUCTURE.md     # This file
```

## Key Components

### Execution Scripts (`scripts/`)
- **`run_benchmark.py`**: Decoupled benchmark runner using KoboldCpp API
- **`judge_results.py`**: Standalone results evaluation with LLM-as-a-Judge
- Designed for independent execution and re-running of either phase
- Full command-line interfaces with flexible configuration options

### Backend API (`backend/api/`)
- **`quality_api.py`**: Main API class providing clean interfaces for frontend integration
- Handles model/sampler configuration, text generation, and quality evaluation
- Provides convenience functions for quick evaluation

### Evaluation System (`backend/evaluation/`)
- **`llm_judge.py`**: OpenAI-based quality evaluation using structured criteria
- **`quality_aggregator.py`**: Quality-focused results aggregation and analysis
- Evaluates on 5 criteria: narrative coherence, creativity, character development, engagement, style

### Configuration (`backend/config/`)
- **`models.yaml`**: Model server configurations (KoboldCpp endpoints)
- **`samplers.yaml`**: Predefined sampling strategies with parameters
- **`experiments.yaml`**: Experiment templates and prompts

### Text Generation (`backend/inference/`)
- **`koboldcpp.py`**: Interface to KoboldCpp model servers
- **`base.py`**: Abstract base class for generators
- Supports different model backends through plugin architecture

## Quality Focus

This project prioritizes **quality over speed**. Key metrics:

1. **Overall Quality Score** (1-10 scale)
2. **Criterion Breakdown** (5 specific writing criteria)
3. **Consistency Analysis** (how stable quality is across samples)
4. **Detailed Reasoning** (why specific scores were given)

## Script Usage (Recommended)

### Quick Benchmark Run
```bash
# Generate samples with default settings
python scripts/run_benchmark.py

# Judge the results automatically
python scripts/judge_results.py --auto-find
```

### Custom Benchmark
```bash
# Test specific samplers with custom prompts
python scripts/run_benchmark.py \
  --model llama_3_1_8b \
  --samplers focused balanced creative \
  --custom-prompts "Write a story about time travel"

# Judge with specific OpenAI model
python scripts/judge_results.py \
  --auto-find \
  --judge-model gpt-4o-mini
```

## API Usage (For Integration)

### Basic Setup
```python
from backend.api.quality_api import SamplerBenchAPI

api = SamplerBenchAPI()
api.initialize_judge(api_key="your_openai_key")
api.initialize_generator("llama_3_1_8b")
```

### Quick Evaluation
```python
from backend.api.quality_api import quick_evaluate

result = quick_evaluate(
    prompt="Write a story about robots",
    text="Generated story text...",
    api_key="your_openai_key"
)
print(f"Quality: {result['overall_score']}/10")
```

### Full Benchmark
```python
prompts = ["Write a story about...", "Create a tale of..."]
results = api.run_quality_benchmark(prompts)
print(f"Completed: {results['completed_samples']} samples")
```

## Frontend Integration

The API provides JSON-serializable responses perfect for web frontends:
- Model/sampler configuration endpoints
- Real-time generation and evaluation
- Comprehensive quality analytics
- Historical results loading

## Testing

Run the test suite to validate setup:
```bash
cd tests
python test_quality_api.py
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Add your OpenAI API key
3. Configure model endpoints
4. Install dependencies: `pip install -r requirements.txt`

## Quality Insights from Current Data

Based on evaluation of 35 samples across 7 sampling strategies:

1. **llama_default** (temp 0.6): **7.14/10** - Best overall quality
2. **ultra_minp** (temp 1.5): **6.46/10** - Good creative balance  
3. **ultra_sigma** (temp 2.0): **3.82/10** - Too chaotic for quality

**Key Finding**: Conservative temperature settings (0.6-0.7) produce the highest quality creative writing, despite common assumptions favoring higher temperatures for creativity. 