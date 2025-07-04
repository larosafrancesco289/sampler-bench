# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Sampler Bench is a professional quality-focused benchmarking platform for evaluating LLM sampling strategies on creative writing tasks. It consists of a FastAPI backend for benchmarking and a Next.js frontend for visualization.

## Key Commands

### Backend Development
- **Start backend server**: `python start_backend.py`
- **Install Python dependencies**: `pip install -r requirements.txt`
- **Run complete benchmark**: `python scripts/run_full_benchmark.py`
- **Run generation only**: `python scripts/run_benchmark.py`
- **Judge existing results**: `python scripts/judge_results.py --auto-find`
- **Start model server**: `./scripts/start_model_server.sh [model-name]`

### Frontend Development
- **Start frontend dev server**: `cd frontend && npm run dev`
- **Install frontend dependencies**: `cd frontend && npm install`
- **Build frontend**: `cd frontend && npm run build`
- **Lint frontend**: `cd frontend && npm run lint`

### Hyperparameter Search
- **Setup hyperparameter search**: `python scripts/setup_hyper_search.py`
- **Run hyperparameter search**: `python scripts/run_hyper_search.py --model [model] --config-section [section]`
- **Analyze search results**: `python scripts/analyze_hyper_search.py --latest --export best_configs.yaml`

### Testing and Quality
- **Single model test**: `python scripts/run_full_benchmark.py --model [model-name] --samplers [sampler1] [sampler2]`
- **Custom prompts**: `python scripts/run_full_benchmark.py --custom-prompts "Your prompt here" --max-length 500`
- **API health check**: `curl http://localhost:8000/health`
- **View API docs**: Visit `http://localhost:8000/docs` when backend is running

## Architecture

### Backend (`/backend/`)
- **FastAPI Server** (`fastapi_server.py`): Main web server with REST API
- **API Layer** (`api/`): API interfaces and request/response models
- **Configuration** (`config/`): YAML configs for models, samplers, and tasks
- **Evaluation** (`evaluation/`): LLM-as-a-Judge quality assessment system
- **Inference** (`inference/`): Text generation interfaces
- **Utils** (`utils/`): Utilities including hyperparameter search

### Frontend (`/frontend/`)
- **Next.js App Router** (`app/`): Next.js 15 application with App Router
- **Components** (`components/`): React components including UI components from Radix UI
- **Contexts** (`contexts/`): React contexts for state management
- **Hooks** (`hooks/`): Custom React hooks for data fetching
- **Types** (`types/`): TypeScript type definitions

### Core Workflow
1. **Model Server**: KoboldCpp server hosts the LLM model
2. **Generation**: Scripts generate text samples using various sampling strategies
3. **Evaluation**: OpenAI GPT-4 judges text quality on 5 criteria
4. **Visualization**: Frontend displays results with interactive charts and tables

## Configuration System

### Sampler Configurations (`backend/config/samplers.yaml`)
- **Model-specific defaults**: Dynamic selection based on model type (llama_default, mistral_default, qwen_default)
- **Min-p sampling**: Various temperature levels with min_p threshold (standard_minp, creative_minp, ultra_minp)
- **Top-n-sigma sampling**: Standard deviation based sampling (standard_sigma, creative_sigma)
- **Standard methods**: Top-p, top-k, temperature-only sampling

### Quality Evaluation Criteria

#### Single Judge (LLM Judge)
1. **Narrative Coherence** (25%): Story flow and consistency
2. **Creativity & Originality** (25%): Unique ideas and expression
3. **Character Development** (20%): Character depth and believability
4. **Engagement & Readability** (20%): Reader interest and accessibility
5. **Stylistic Quality** (10%): Writing technique and language use

#### Multi-Judge System (`backend/evaluation/multi_judge.py`)
1. **Narrative Structure** (30%): Story organization, pacing, and plot coherence
2. **Creativity Execution** (25%): Creative premise handling and original elements
3. **Character Voice** (20%): Character development and authentic voice
4. **Prose Quality** (15%): Writing craft, style, and language use
5. **Engagement** (10%): Reader interest and emotional impact

The multi-judge system uses parallel evaluation with multiple LLM judges and consensus scoring for enhanced reliability.

## API Endpoints

### Core Endpoints
- `GET /api/models`: List available models
- `GET /api/samplers`: List available samplers
- `GET /api/results`: Get benchmark results for frontend
- `POST /api/benchmark/run`: Run complete benchmark
- `POST /api/generate`: Generate single text sample
- `POST /api/evaluate`: Evaluate text quality

### Documentation
- `GET /docs`: Swagger UI documentation
- `GET /redoc`: Alternative API documentation

## Development Workflow

### Running Benchmarks
1. Ensure KoboldCpp model server is running via `./scripts/start_model_server.sh [model-name]`
2. Set up environment variables in `.env` file:
   - `OPENAI_API_KEY` for single judge mode
   - `OPENROUTER_API_KEY` and `LLM_JUDGE_MODELS` for multi-judge mode
3. Use `run_full_benchmark.py` for complete pipeline
4. Results stored in `results/` directory as JSON files

### Adding New Samplers
1. Define sampler in `backend/config/samplers.yaml` under `presets` section
2. Add model-specific defaults in `model_defaults` section if needed
3. Update sampler implementation in inference layer
4. Test with benchmark scripts

### Frontend Development
- Uses Next.js 15 with App Router
- Tailwind CSS for styling with custom dark mode
- Radix UI components for accessible UI
- Dark mode support with next-themes
- TypeScript for type safety
- Real-time data fetching with custom hooks

### Common Development Tasks
- **Debug API issues**: Check FastAPI logs and visit `/docs` endpoint
- **Add new models**: Update `backend/config/models.yaml` and sampler configs
- **Modify evaluation criteria**: Edit judge classes in `backend/evaluation/`
- **Update frontend components**: Modify files in `frontend/components/`

## Key Dependencies

### Backend
- **FastAPI**: Web framework for API server
- **OpenAI**: LLM-as-a-Judge evaluation (single and multi-judge via OpenRouter)
- **PyYAML**: Configuration management
- **Requests**: HTTP client for KoboldCpp API
- **OmegaConf**: Advanced configuration management
- **Rich**: Terminal formatting and progress bars
- **Python-dotenv**: Environment variable management

### Frontend
- **Next.js 15**: React framework with App Router
- **Radix UI**: Accessible component library (@radix-ui/react-*)
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization
- **TanStack Table**: Table management
- **Next-themes**: Dark mode support
- **Lucide React**: Icon library

## Testing and Quality

### Model Testing
- Supports multiple models: Llama 3.1, Mistral Small, Qwen
- Comprehensive sampling strategy evaluation
- Quality-focused metrics over speed

### Results Interpretation
- Scores range 1-10 (higher is better)
- Detailed criterion breakdowns available
- Reproducible with full configuration tracking

## Environment Setup

### Required Environment Variables
- `OPENAI_API_KEY`: For LLM-as-a-Judge evaluation (single judge mode)
- `OPENAI_MODEL`: OpenAI model to use (defaults to gpt-4o)
- `OPENROUTER_API_KEY`: For multi-judge evaluation via OpenRouter
- `LLM_JUDGE_MODELS`: Comma-separated list of judge models (e.g., "openai/gpt-4o,google/gemini-2.0-flash-001")
- `MULTI_JUDGE_ENABLED`: Set to 'true' to enable multi-judge evaluation
- `JUDGE_CONSENSUS_METHOD`: Method for combining judge scores (default: 'average')

### Prerequisites
- Python 3.12+
- Node.js for frontend development
- KoboldCpp server for model inference
- OpenAI API access for evaluation (single judge) or OpenRouter API access (multi-judge)

### Model Server Configuration
- Supports multiple models: Llama 3.1, Mistral Small, Qwen, etc.
- Uses KoboldCpp API for inference to avoid CUDA issues
- Default ports: llama-3.1-8b-instruct (5002), mistral-small-24b (5001)