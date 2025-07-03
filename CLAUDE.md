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
- **Model-specific defaults**: Dynamic selection based on model type
- **Min-p sampling**: Various temperature levels with min_p threshold
- **Top-n-sigma sampling**: Standard deviation based sampling
- **Standard methods**: Top-p, top-k, temperature-only sampling

### Quality Evaluation Criteria
1. **Narrative Coherence** (25%): Story flow and consistency
2. **Creativity & Originality** (25%): Unique ideas and expression
3. **Character Development** (20%): Character depth and believability
4. **Engagement & Readability** (20%): Reader interest and accessibility
5. **Stylistic Quality** (10%): Writing technique and language use

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
1. Ensure KoboldCpp model server is running
2. Set OPENAI_API_KEY in .env file
3. Use `run_full_benchmark.py` for complete pipeline
4. Results stored in `results/` directory as JSON files

### Adding New Samplers
1. Define sampler in `backend/config/samplers.yaml`
2. Update sampler implementation in inference layer
3. Test with benchmark scripts

### Frontend Development
- Uses Next.js 15 with App Router
- Tailwind CSS for styling
- Radix UI components for accessible UI
- Dark mode support with next-themes
- TypeScript for type safety

## Key Dependencies

### Backend
- **FastAPI**: Web framework for API server
- **OpenAI**: LLM-as-a-Judge evaluation
- **PyYAML**: Configuration management
- **Requests**: HTTP client for KoboldCpp API

### Frontend
- **Next.js 15**: React framework with App Router
- **Radix UI**: Accessible component library
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization
- **TanStack Table**: Table management

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
- `OPENAI_API_KEY`: For LLM-as-a-Judge evaluation
- `OPENAI_MODEL`: OpenAI model to use (defaults to gpt-4o)

### Prerequisites
- Python 3.12+
- Node.js for frontend development
- KoboldCpp server for model inference
- OpenAI API access for evaluation