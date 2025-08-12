## Sampler Bench

Benchmark and compare text generation sampling strategies with a Python backend, a Next.js dashboard, and optional multi-judge evaluation.

[Live dashboard](https://sampler-bench.vercel.app/)

### Why
- Measure how different decoding settings affect output quality in creative writing.
- Keep generation and judging separate so you can re-evaluate prior runs.
- View results in a clear dashboard without custom notebooks.

### Features
- Multiple samplers: temperature, top-p, top-k, min-p, top-n-sigma.
- Single-judge or multi-judge scoring with an LLM as a judge.
- JSON results suitable for analysis or visualization.
- Next.js frontend for leaderboards, criteria breakdowns, and distributions.

### Setup
Prerequisites
- Python 3.9+
- Node.js 18+
- A local text generation server (KoboldCpp or llama.cpp) listening on localhost

Environment
- Copy `env.example` to `.env` and fill in values if you plan to use multi-judge evaluation.
- Activate a Python virtual environment before running scripts.

Install
```bash
./scripts/setup.sh
# Then activate the virtualenv in each new shell
source .venv/bin/activate
```

### Quickstart
Minimal flow (assumes a local model server is already running on the configured port):
```bash
# 1) Generate samples
python scripts/run_benchmark.py --model llama-3.1-8b-instruct --samplers llama_default

# 2) Judge the latest results
python scripts/judge_results.py --auto-find

# 3) Start the dashboard
cd frontend && npm run dev
```

Starting a local server
- KoboldCpp: `scripts/start_koboldcpp.sh` wraps `scripts/start_model_server.sh` and expects you to set executable and model paths inside that script.
- llama.cpp: `scripts/start_llamacpp.sh` wraps `scripts/start_llama_server.sh` and expects you to adjust model path.

### Usage examples
- Select samplers and limit length:
```bash
python scripts/run_benchmark.py \
  --model llama-3.1-8b-instruct \
  --samplers llama_default standard_minp creative_minp \
  --max-length 512
```

- End to end in one command:
```bash
python scripts/run_full_benchmark.py --model llama-3.1-8b-instruct
```

- Generate logits data for the frontend visualizer:
```bash
python scripts/generate_logits_data.py --model llama-3.1-8b-instruct
```

### Architecture overview
Backend
- `backend/api/quality_api.py`: orchestration for generation and scoring
- `backend/evaluation/`: judges and aggregation
- `backend/config/`: sampler and task presets

Frontend
- `frontend/`: Next.js dashboard and API route for results

Scripts
- `scripts/run_benchmark.py`: generation only
- `scripts/judge_results.py`: evaluate existing results
- `scripts/run_full_benchmark.py`: generation then judging
- `scripts/analyze_results.py`: quick stats on judged results
- `scripts/generate_logits_data.py`: data for the probability visualizer
- `scripts/start_koboldcpp.sh`, `scripts/start_llamacpp.sh`: wrappers around legacy server starters

Code tree
```
sampler-bench/
  backend/
    api/
    evaluation/
    config/
  frontend/
    app/
    components/
    lib/
    public/
  scripts/
  results/
```

### License
MIT