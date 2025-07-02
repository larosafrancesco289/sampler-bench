# Sampler Bench

A professional quality-focused benchmarking platform for evaluating LLM sampling strategies on creative writing tasks. Now with a modern FastAPI backend and Next.js frontend!

## 🚀 Quick Start

### Option 1: Web Interface (Recommended)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Add your OPENAI_API_KEY to .env
   ```

3. **Start the FastAPI backend:**
   ```bash
   python start_backend.py
   ```
   The API will be available at http://localhost:8000 with docs at http://localhost:8000/docs

4. **Start the frontend (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The web interface will be available at http://localhost:3000

### Option 2: Command Line Interface

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Add your OPENAI_API_KEY to .env
   ```

3. **Start model server:**
   ```bash
   ./scripts/start_model_server.sh llama-3.1-8b-instruct
   ```

4. **Run benchmark:**
   ```bash
   python scripts/run_full_benchmark.py
   ```

## 📋 Available Scripts

### 🎯 Complete Workflow (Recommended)
```bash
python scripts/run_full_benchmark.py [options]
```
Runs generation + judging in one command.

### 🔧 Decoupled Workflow
```bash
# 1. Generate samples
python scripts/run_benchmark.py [options]

# 2. Judge results  
python scripts/judge_results.py --auto-find
```

### 🚀 Model Server
```bash
./scripts/start_model_server.sh [model-name]
```

## 🎛️ Configuration

### Models (`backend/config/models.yaml`)
- `llama-3.1-8b-instruct` - Fast 8B model (port 5002)
- `mistral-small-24b` - Larger 24B model (port 5001)

### Samplers (`backend/config/samplers.yaml`)
- `llama_default` - Conservative (temp 0.6, top_p 0.9)
- `standard_minp` - Min-p sampling (temp 0.7)
- `creative_minp` - Higher creativity (temp 1.0)
- `ultra_minp` - Maximum creativity (temp 1.5)
- `balanced_sigma` - Sigma sampling (temp 1.0)
- `creative_sigma` - High-temp sigma (temp 1.5)
- `ultra_sigma` - Max-temp sigma (temp 2.0)

## 💡 Usage Examples

### Basic Benchmark
```bash
python scripts/run_full_benchmark.py \
  --samplers llama_default creative_minp ultra_sigma
```

### Custom Prompts
```bash
python scripts/run_full_benchmark.py \
  --custom-prompts "Write a story about time travel" \
  --max-length 500
```

### Different Model
```bash
./scripts/start_model_server.sh mistral-small-24b
python scripts/run_full_benchmark.py --model mistral-small-24b
```

### Decoupled Testing
```bash
# Generate with multiple samplers
python scripts/run_benchmark.py \
  --samplers llama_default standard_minp creative_minp

# Judge results later (when you improve criteria)
python scripts/judge_results.py --auto-find
```

## 📊 Output

### Generation Results
`results/benchmark_results_MODEL_TIMESTAMP.json` contains:
- Generated text samples
- Performance metrics (tokens/sec)
- Sampler configurations
- Generation metadata

### Judged Results  
`results/judged_*.json` contains:
- Quality scores (1-10 scale)
- Detailed criterion breakdowns
- LLM judge reasoning
- Quality rankings

## 🎭 Quality Evaluation

Uses OpenAI GPT for quality assessment on 5 criteria:
- **Narrative Coherence** (25%) - Story flow and consistency
- **Creativity & Originality** (25%) - Unique ideas and expression  
- **Character Development** (20%) - Character depth and believability
- **Engagement & Readability** (20%) - Reader interest and accessibility
- **Stylistic Quality** (10%) - Writing technique and language use

## 🌐 FastAPI Endpoints

The new FastAPI backend provides a comprehensive REST API:

### Core Endpoints
- `GET /api/models` - List available models
- `GET /api/samplers` - List available samplers  
- `GET /api/results` - Get benchmark results (for frontend)
- `GET /health` - Health check

### Initialization
- `POST /api/judge/initialize` - Initialize LLM judge
- `POST /api/generator/initialize` - Initialize text generator

### Generation & Evaluation
- `POST /api/generate` - Generate single text sample
- `POST /api/evaluate` - Evaluate text quality
- `POST /api/benchmark/run` - Run complete benchmark
- `POST /api/results/load` - Load existing results

### Documentation
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

## 🏗️ Architecture

```
sampler-bench/
├── start_backend.py      # FastAPI server startup
├── scripts/              # Execution scripts
│   ├── start_model_server.sh    # Start KoboldCpp
│   ├── run_full_benchmark.py    # Complete pipeline
│   ├── run_benchmark.py         # Generation only
│   └── judge_results.py         # Judging only
├── backend/              # Core system
│   ├── fastapi_server.py # FastAPI web server
│   ├── api/             # API interfaces
│   ├── config/          # Model & sampler configs
│   ├── evaluation/      # Quality evaluation
│   ├── inference/       # Text generation
│   └── utils/           # Utilities
├── frontend/            # Next.js web interface
│   ├── app/            # Next.js app router
│   ├── components/     # React components
│   ├── hooks/          # React hooks
│   └── types/          # TypeScript types
├── results/             # Benchmark results
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables
└── README.md           # This file
```

## 🔧 Prerequisites

1. **KoboldCpp Server** - For model inference
2. **OpenAI API Key** - For quality evaluation
3. **Python 3.12+** - Runtime environment

## 🔍 NEW: Hyperparameter Search

Automatically find optimal sampler configurations for your tasks:

```bash
# 1. Setup and verify everything is ready
source venv/bin/activate
python scripts/setup_hyper_search.py

# 2. Start model server (in separate terminal)
./scripts/start_model_server.sh llama-3.1-8b-instruct

# 3. Run hyperparameter search
python scripts/run_hyper_search.py --model llama-3.1-8b-instruct --config-section quick_test

# 4. Analyze results and get recommendations  
python scripts/analyze_hyper_search.py --latest --export best_configs.yaml
```

The setup script will guide you through all prerequisites. See [HYPERPARAMETER_SEARCH.md](HYPERPARAMETER_SEARCH.md) for complete documentation.

## 📝 Notes

- **Decoupled Design**: Generation and judging are independent
- **API-Based**: Uses KoboldCpp API to avoid CUDA issues
- **Quality-Focused**: Prioritizes writing quality over speed
- **Reproducible**: Full configuration tracking
- **Flexible**: Easy to add new models/samplers

## 🎯 Results Interpretation

Higher scores indicate better quality:
- **9-10**: Exceptional creative writing
- **7-8**: Good quality with strong elements  
- **5-6**: Average, adequate quality
- **3-4**: Below average with issues
- **1-2**: Poor quality with major problems

The system provides both overall scores and detailed criterion breakdowns for comprehensive analysis. 