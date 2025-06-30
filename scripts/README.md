# Sampler Bench Scripts

This directory contains decoupled scripts for running benchmarks and judging results.

## Scripts Overview

### 🎯 `run_full_benchmark.py` - Complete Benchmark (Recommended)
Runs both generation and judging in sequence for a complete benchmark workflow.

**Usage:**
```bash
# Basic full benchmark
python scripts/run_full_benchmark.py

# Custom configuration
python scripts/run_full_benchmark.py \
  --model llama_3_1_8b \
  --samplers focused balanced creative \
  --judge-model gpt-4o-mini

# Generation only
python scripts/run_full_benchmark.py --no-judge

# Judge existing results only
python scripts/run_full_benchmark.py --judge-only
```

### 🚀 `run_benchmark.py` - Benchmark Runner
Generates text samples using different sampling strategies and saves results for later evaluation.

**Usage:**
```bash
# Basic usage with defaults
python scripts/run_benchmark.py

# Specify model and samplers
python scripts/run_benchmark.py --model llama_3_1_8b --samplers focused balanced creative

# Custom prompts and settings
python scripts/run_benchmark.py --max-length 1024 --custom-prompts "Write a story about robots" "Create a tale of magic"

# Save to specific directory
python scripts/run_benchmark.py --output-dir my_results
```

**Default behavior:**
- Model: `llama_3_1_8b`
- Samplers: `llama_default`, `focused`, `balanced`, `creative`
- Prompts: 5 creative writing prompts from config
- Max length: 512 tokens
- Output: `results/benchmark_results_MODEL_TIMESTAMP.json`

### ⚖️ `judge_results.py` - Results Judge
Evaluates existing benchmark results for quality using LLM-as-a-Judge.

**Usage:**
```bash
# Judge specific results file
python scripts/judge_results.py results/benchmark_results_llama_3_1_8b_20240115_143022.json

# Auto-find and judge latest results
python scripts/judge_results.py --auto-find

# Specify judge model and API key
python scripts/judge_results.py --auto-find --judge-model gpt-4o-mini --api-key your_key

# Custom output directory
python scripts/judge_results.py results/my_results.json --output-dir judged_results
```

**Requirements:**
- OpenAI API key (in `.env` file or via `--api-key`)
- Existing benchmark results JSON file

**Output:** `results/judged_ORIGINAL_NAME_TIMESTAMP.json`

## Workflow Examples

### Standard Workflow (Recommended)
```bash
# All-in-one: generation + judging
python scripts/run_full_benchmark.py --samplers focused balanced creative natural
```

### Decoupled Workflow
```bash
# 1. Run benchmark
python scripts/run_benchmark.py --samplers focused balanced creative natural

# 2. Judge the results (auto-finds latest)
python scripts/judge_results.py --auto-find

# 3. Results are saved with quality scores and rankings
```

### Experimenting with Different Models
```bash
# Test different models with full benchmark
python scripts/run_full_benchmark.py --model llama_3_1_8b
python scripts/run_full_benchmark.py --model mistral_7b

# Or separately for more control
python scripts/run_benchmark.py --model llama_3_1_8b
python scripts/run_benchmark.py --model mistral_7b
python scripts/judge_results.py --auto-find
```

### Custom Evaluation
```bash
# Generate with specific settings
python scripts/run_benchmark.py \
  --model llama_3_1_8b \
  --samplers ultra_creative focused \
  --max-length 1024 \
  --custom-prompts "Write a technical manual for time travel"

# Judge with specific model
python scripts/judge_results.py \
  --auto-find \
  --judge-model gpt-4o-mini
```

## Configuration

### Model Configuration
Models are configured in `backend/config/models.yaml`:
```yaml
models:
  llama_3_1_8b:
    port: 5001
    description: "Llama 3.1 8B via KoboldCpp"
```

### Sampler Configuration  
Samplers are configured in `backend/config/samplers.yaml`:
```yaml
samplers:
  focused:
    description: "Conservative, focused generation"
    parameters:
      temperature: 0.6
      top_p: 0.9
```

## Output Formats

### Benchmark Results (`benchmark_results_*.json`)
```json
{
  "benchmark_name": "Creative Writing Benchmark - llama_3_1_8b",
  "timestamp": "2024-01-15T14:30:22",
  "model_name": "llama_3_1_8b",
  "samples": [
    {
      "sample_id": 1,
      "prompt": "Write a story about...",
      "sampler_name": "focused", 
      "generated_text": "Generated story...",
      "word_count": 247,
      "generation_time": 3.45,
      "tokens_per_second": 93.2
    }
  ]
}
```

### Judged Results (`judged_*.json`)
```json
{
  "samples": [
    {
      "judgment": {
        "overall_score": 7.2,
        "criterion_scores": [
          {
            "criterion": "narrative_coherence",
            "score": 8,
            "reasoning": "Strong plot flow..."
          }
        ],
        "summary": "Well-structured story with good pacing"
      }
    }
  ],
  "quality_statistics": {
    "sampler_ranking": [
      ["focused", 7.42],
      ["balanced", 6.89]
    ]
  }
}
```

## Prerequisites

1. **KoboldCpp Server**: Model server must be running
   ```bash
   # Example: Start Llama 3.1 8B on port 5001
   ./koboldcpp.py --model path/to/model --port 5001
   ```

2. **OpenAI API Key**: Required for judging
   ```bash
   # Add to .env file
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Dependencies**: Install Python packages
   ```bash
   pip install -r requirements.txt
   ```

## Tips

- **Decoupled Design**: Run generation and judging separately for flexibility
- **API Rate Limiting**: Judge script includes automatic rate limiting for OpenAI API
- **Error Handling**: Both scripts handle failures gracefully and save partial results
- **Reproducibility**: Results include full configuration and timestamps
- **File Organization**: Uses consistent naming conventions for easy tracking 