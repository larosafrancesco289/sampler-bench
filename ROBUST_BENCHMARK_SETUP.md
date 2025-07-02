# Robust Creative Writing Benchmark Setup

This guide explains how to set up and run the improved Creative Writing benchmark with 50 total samples, optimized for quality and practical execution.

## Key Improvements

### 1. **Optimized Sample Size & Statistical Power**
- **Total samples**: 45 (5 samplers × 3 prompts × 3 repetitions)
- **Samples per sampler**: 9 (enables robust statistical analysis)
- **Execution time**: ~20-25 minutes for generation + 10-15 minutes for evaluation
- **Statistical power**: High power for detecting meaningful differences (Cohen's d ≥ 0.5)

### 2. **Model-Agnostic Sampler Configuration**
- `model_default`: Automatically selects provider-recommended settings
  - Llama models → `llama_default` (temp 0.6, top_p 0.9)
  - Mistral models → `mistral_default` (temp 0.3, top_p 1.0)
  - Qwen models → `qwen_default` (temp 0.7, top_p 0.8)
- Universal samplers work across all models:
  - `standard_minp`, `creative_minp`, `creative_sigma`, `standard_sigma`

### 3. **Strategic Prompt Selection**
- 3 carefully chosen prompts representing core creative writing dimensions:
  - **Character-Driven**: Power outage connection story (dialogue, relationships, emotional authenticity)
  - **Speculative Concept**: Mind reading story (premise exploration, creative logic, world-building)  
  - **Atmospheric Narrative**: Mysterious package story (mood creation, descriptive writing, tension)
- Each prompt tests different fundamental creative writing skills
- 3 repetitions per prompt provide reliable measurement of sampler performance

### 4. **Enhanced Statistical Robustness**
- **Cross-validation**: Train rankings on 2 prompts, validate on the 3rd
- **Effect size analysis**: Cohen's d for practical significance assessment  
- **Bootstrap confidence intervals**: Robust uncertainty quantification
- **Outlier detection**: Automatic identification of generation failures
- **Power analysis**: Verification that sample size is adequate
- **Ranking stability**: Assessment of how reliable sampler rankings are

## Why This Approach is More Robust

### Statistical Benefits:
- **9 samples per sampler** (vs 10 in original) with much better distribution
- **3 repetitions per condition** reduces measurement error significantly  
- **Cross-validation** prevents overfitting to specific prompts
- **Effect size focus** distinguishes statistical vs practical significance

### Practical Benefits:
- **Faster execution** (~35-40 minutes vs 40-45 minutes)
- **Better prompt coverage** of fundamental creative writing skills
- **More reliable rankings** due to increased repetitions
- **Easier interpretation** with fewer but more meaningful prompts

## Setup Instructions

### 1. Environment Configuration (.env)

Create or update your `.env` file with judge configuration:

```bash
# LLM Judge Configuration
LLM_JUDGE_MODEL=gpt-4-turbo  # or claude-3-opus, gpt-4, etc.
LLM_JUDGE_API_KEY=your_api_key_here

# For OpenAI models
OPENAI_API_KEY=your_openai_key

# For Anthropic models  
ANTHROPIC_API_KEY=your_anthropic_key

# Optional: Custom judge settings
LLM_JUDGE_BATCH_SIZE=5
LLM_JUDGE_TIMEOUT=60
```

### 2. Model Server Setup

Start your model server as usual:

```bash
# For Llama models
./scripts/start_model_server.sh llama-3.1-8b-instruct

# For Mistral models  
./scripts/start_model_server.sh mistral-small-24b

# For other models
./scripts/start_model_server.sh your-model-name
```

### 3. Run the Robust Benchmark

Update your benchmark script to use the new configuration:

```bash
# Basic usage with robust config
python scripts/run_full_benchmark.py \
  --config backend/config/robust_creative_writing.yaml \
  --model your-model-name

# Or specify samplers manually (using the 5 robust samplers)
python scripts/run_full_benchmark.py \
  --samplers model_default standard_minp creative_minp creative_sigma standard_sigma \
  --prompts-from-config robust_creative_writing
```

## Configuration Details

### Sampler Strategy

The benchmark tests 5 distinct sampling approaches:

1. **model_default**: Provider-recommended baseline
2. **standard_minp**: Moderate creativity with min-p (temp 0.7, min_p 0.2)
3. **creative_minp**: Higher creativity with min-p (temp 1.0, min_p 0.2)  
4. **creative_sigma**: Moderate sigma sampling (temp 1.0, sigma 1.5)
5. **standard_sigma**: Standard sigma sampling (temp 1.5, sigma 1.0 - paper settings)

### Evaluation Criteria

Enhanced scoring with clear rubrics:

- **Narrative Structure** (30%): Story organization and coherence
- **Creativity Execution** (25%): Original premise development  
- **Character Voice** (20%): Character development and authenticity
- **Prose Quality** (15%): Writing craft and style
- **Engagement** (10%): Reader interest and emotional impact

### Performance Optimizations

- **Sequential generation**: No prompt batching (preserves speed)
- **Batched evaluation**: Judge calls batched in groups of 5
- **Quality control**: Automated length and coherence checks
- **Caching**: Evaluation results cached to avoid re-judging

## Expected Results

### Sample Output Structure

```json
{
  "benchmark_name": "Robust Creative Writing Benchmark v2",
  "total_samples": 45,
  "model_name": "llama-3.1-8b-instruct",
  "sampler_results": {
    "model_default": {
      "mean_score": 7.2,
      "std_dev": 1.1,
      "confidence_interval": [6.4, 8.0],
      "samples": 9,
      "best_prompt": "atmospheric_narrative"
    },
    "creative_minp": {
      "mean_score": 7.8,
      "std_dev": 0.9,
      "confidence_interval": [7.1, 8.5],
      "samples": 9,
      "best_prompt": "speculative_concept"
    }
  },
  "statistical_analysis": {
    "effect_sizes": {
      "creative_minp_vs_model_default": {"cohens_d": 0.72, "magnitude": "medium"},
      "standard_sigma_vs_model_default": {"cohens_d": 0.45, "magnitude": "small"}
    },
    "cross_validation": {
      "training_ranking": ["creative_minp", "standard_sigma", "model_default"],
      "holdout_validation": ["creative_minp", "model_default", "standard_sigma"],
      "ranking_stability": 0.85
    }
  }
}
```

### Timing Expectations

- **Generation**: ~20-25 minutes (45 samples)
- **Evaluation**: ~10-15 minutes (batched judge calls)
- **Total runtime**: ~35-40 minutes

### Statistical Analysis

The benchmark provides:
- **Confidence intervals** for sampler means
- **Effect sizes** (Cohen's d) between samplers
- **Best/worst examples** for each sampler
- **Prompt difficulty analysis**

## Troubleshooting

### Common Issues

1. **Judge model not configured**: Check `.env` file has correct `LLM_JUDGE_MODEL` and API key
2. **Model default not found**: Ensure your model name matches the mapping in `samplers.yaml`
3. **Generation timeouts**: Increase timeout in performance config if using slower models
4. **Judge API rate limits**: Reduce `batch_size` in evaluation config

### Model Name Mapping

The `model_default` sampler automatically maps based on model name:
- Names containing "llama" → `llama_default`
- Names containing "mistral" or "ministral" → `mistral_default`  
- Names containing "qwen" → `qwen_default`
- Unknown models → `llama_default` (fallback)

## Customization

### Adding New Model Defaults

Edit `backend/config/samplers.yaml`:

```yaml
# Add new model default
gemma_default:
  description: "Default Gemma provider-recommended settings"
  sampler: "top_p"
  parameters:
    temperature: 0.8
    top_p: 0.95
    max_tokens: 512

# Add to model mapping
model_defaults:
  "gemma": "gemma_default"
```

### Adjusting Sample Size

Modify `robust_creative_writing.yaml`:

```yaml
# Current: 5 samplers × 3 prompts × 3 reps = 45 samples (recommended)

# For more statistical power: 5 samplers × 3 prompts × 4 reps = 60 samples
repetitions_per_prompt_per_sampler: 4

# For faster execution: 5 samplers × 3 prompts × 2 reps = 30 samples  
repetitions_per_prompt_per_sampler: 2

# For minimal viable test: 3 samplers × 3 prompts × 2 reps = 18 samples
# (comment out 2 samplers and reduce repetitions)
```

This robust benchmark configuration provides reliable, statistically meaningful results while maintaining practical execution times and model flexibility. 