# Hyperparameter Search Quick Guide

## Quick Start

```bash
# 1. Setup (one-time)
source venv/bin/activate
python scripts/setup_hyper_search.py

# 2. Start model server (separate terminal)
./scripts/start_model_server.sh llama-3.1-8b-instruct

# 3. Run search
python scripts/run_hyper_search.py --model llama-3.1-8b-instruct --config-section quick_test

# 4. Analyze results
python scripts/analyze_hyper_search.py --latest --export best_configs.yaml
```

## Search Strategies

### Quick Test (5-10 minutes)
```bash
python scripts/run_hyper_search.py --model MODEL --config-section quick_test
```

### Bayesian Optimization (30-60 minutes)
```bash
python scripts/run_hyper_search.py --model MODEL --strategy bayesian --iterations 50
```

### Grid Search (2-4 hours)
```bash
python scripts/run_hyper_search.py --model MODEL --strategy grid --config-section intensive_search
```

## Sampler Types

- **min_p**: `temperature: 0.7-1.6, min_p: 0.005-0.15`
- **top_p**: `temperature: 0.6-1.3, top_p: 0.8-0.99`
- **top_n_sigma**: `temperature: 0.8-2.2, top_n_sigma: 0.5-3.0`

## Integration

Export optimal configurations and add to `backend/config/samplers.yaml`:

```bash
python scripts/analyze_hyper_search.py --latest --export optimal_samplers.yaml
# Copy best configs to samplers.yaml with custom names
```

## Troubleshooting

- **Model server not ready**: Wait for "Loading complete" message
- **API errors**: Check OPENAI_API_KEY in .env file  
- **Low scores**: Verify prompts are appropriate for creative writing
- **Import errors**: Run `pip install -r requirements.txt`

See `backend/config/hyper_search_config.yaml` for detailed configuration options.