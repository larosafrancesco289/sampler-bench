# Sampler Bench

A professional quality-focused benchmarking platform for evaluating LLM sampling strategies on creative writing tasks. Built with Next.js for a modern, streamlined experience!

## 🚀 Quick Start

### Web Interface

1. **Start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The web interface will be available at http://localhost:3000

2. **Generate benchmark data (optional):**
   To create new benchmark results, use the Python scripts:
   ```bash
   # Set up environment
   cp .env.example .env
   # Add your OPENROUTER_API_KEY to .env for multi-judge evaluation
   # (or OPENAI_API_KEY for legacy single-judge mode)
   
   # Run benchmarks
   python scripts/run_full_benchmark.py
   ```

### Command Line Interface

1. **Set up environment:**
   ```bash
   cp .env.example .env
   # Add your OPENROUTER_API_KEY to .env for multi-judge evaluation
   # (or OPENAI_API_KEY for legacy single-judge mode)
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

### Models (Active Testing)
- `llama-3.1-8b-instruct` - Llama 3.1 8B (KoboldCpp, port 5002)
- `mistral-small-24b` - Mistral Small 24B (KoboldCpp, port 5001)
- `mistral-nemo-12b` - Mistral Nemo 12B (KoboldCpp, port 5006)
- `gemma-3-12b-instruct` - Gemma 3 12B (KoboldCpp, port 5006)
- `qwen-3-8b` - Qwen 3 8B (KoboldCpp)
- `gpt-4.5` - Manual baseline (ChatGPT interface)

### Core Samplers (5 strategies)
- `model_default` - Dynamic model-specific defaults
- `standard_minp` - Min-p sampling (temp 0.7, min_p 0.02)
- `creative_minp` - Min-p sampling (temp 1.0, min_p 0.02)
- `standard_sigma` - Top-n-sigma sampling (temp 1.5, sigma 1.0)
- `creative_sigma` - Top-n-sigma sampling (temp 1.0, sigma 1.5)

## 💡 Usage Examples

### Basic Benchmark
```bash
python scripts/run_full_benchmark.py \
  --samplers model_default standard_minp creative_sigma
```

### Custom Prompts
```bash
python scripts/run_full_benchmark.py \
  --custom-prompts "Write a story about time travel" \
  --max-length 400
```

### Different Model
```bash
./scripts/start_model_server.sh mistral-small-24b
python scripts/run_full_benchmark.py --model mistral-small-24b
```

### Decoupled Testing
```bash
# Generate with core samplers
python scripts/run_benchmark.py \
  --samplers model_default standard_minp creative_minp standard_sigma creative_sigma

# Judge results later using multi-judge evaluation
python scripts/judge_results.py --auto-find
```

### Complete Benchmark Pipeline
```bash
# Start model server
./scripts/start_model_server.sh mistral-small-24b

# Run complete benchmark with all 5 core samplers
python scripts/run_full_benchmark.py --model mistral-small-24b
```

**Methodology:**
- **Multi-judge evaluation** provides reliable consensus scoring
- **Quality control** includes instruction-following penalties
- **20 samples per sampler** (5 prompts × 4 repetitions) for statistical validity

## 📊 Output

### Generation Results
`results/MODEL_benchmark_TIMESTAMP.json` contains:
- Generated text samples (300-400 word creative stories)
- Sampler configurations and parameters
- Generation metadata and timestamps
- Performance metrics

### Multi-Judge Evaluation Results  
`results/MODEL_judged_TIMESTAMP.json` contains:
- **Consensus scores** (1-10 scale) from multiple LLM judges
- **Individual judge breakdowns** with per-criterion scores
- **Statistical reliability** metrics (standard deviation, consensus strength)
- **Quality control penalties** (instruction following, word count compliance)
- **Detailed judge reasoning** for each evaluation

## 🎭 Quality Evaluation

### Multi-Judge Consensus System (Primary)
Uses multiple LLM judges via OpenRouter for enhanced reliability:

**Judge Models**: `openai/gpt-4.1-nano`, `google/gemini-2.0-flash-001` via OpenRouter
**Evaluation Method**: Parallel evaluation with consensus scoring

**Quality Criteria** (5 dimensions):
- **Narrative Structure** (30%) - Story organization, pacing, and plot coherence
- **Creativity Execution** (25%) - Creative premise handling and original elements
- **Character Voice** (20%) - Character development and authentic voice
- **Prose Quality** (15%) - Writing craft, style, and language use
- **Engagement** (10%) - Reader interest and emotional impact

**Quality Control Features**:
- **Instruction Penalties**: -1.5 points for word count violations (>100 words off target)
- **Meta-commentary Detection**: -0.8 points for author notes/commentary
- **Empty Generation Penalty**: -3.0 points for failed generations
- **Statistical Reliability**: Standard deviation and consensus strength metrics

### Legacy Single Judge Mode
Fallback mode using gpt-4.1-nano with different criteria weights.

## 🔄 Workflow

The benchmarking system follows a script-based workflow:

### 1. Generation Phase
- **Script**: `run_benchmark.py` or `run_full_benchmark.py`
- **Process**: Connects to KoboldCpp servers, generates text samples using configured samplers
- **Output**: Raw benchmark results in JSON format

### 2. Evaluation Phase  
- **Script**: `judge_results.py` (automatically called by `run_full_benchmark.py`)
- **Process**: Multi-judge evaluation via OpenRouter API with quality control
- **Output**: Enhanced results with consensus scores and detailed breakdowns

### 3. Visualization
- **Frontend**: Next.js application reads results directly from JSON files
- **Features**: Interactive leaderboards, filtering, aggregation across models

## 🏗️ Architecture

```
sampler-bench/
├── scripts/              # Main execution scripts
│   ├── start_model_server.sh    # Start KoboldCpp servers
│   ├── run_full_benchmark.py    # Complete benchmark pipeline
│   ├── run_benchmark.py         # Generation only
│   ├── judge_results.py         # Multi-judge evaluation
│   └── analyze_results.py       # Result analysis utilities
├── backend/              # Core benchmarking system
│   ├── config/          # YAML configurations (samplers, prompts)
│   ├── evaluation/      # Multi-judge evaluation system
│   │   ├── multi_judge.py       # OpenRouter multi-judge
│   │   ├── llm_judge.py         # Legacy single judge
│   │   ├── instruction_penalties.py # Quality control
│   │   └── quality_aggregator.py    # Score aggregation
│   ├── api/             # API utilities
│   └── inference/       # Text generation utilities
├── frontend/            # Next.js visualization interface
│   ├── app/            # Next.js 15 App Router
│   │   ├── api/results/ # API route for data access
│   │   └── methodology/ # Methodology documentation page
│   ├── components/     # React UI components
│   ├── contexts/       # React state management
│   ├── hooks/          # Data fetching hooks
│   └── types/          # TypeScript definitions
├── results/             # JSON benchmark and evaluation results
├── requirements.txt     # Python dependencies
└── CLAUDE.md           # Development guidelines
```

## 🔧 Prerequisites

1. **KoboldCpp Server** - For model inference
2. **API Keys** - For quality evaluation:
   - **OpenRouter API Key** (recommended) - For multi-judge evaluation
   - **OpenAI API Key** (legacy) - For single-judge evaluation
3. **Python 3.12+** - Runtime environment
4. **Node.js** - For frontend development

## ⚙️ Environment Configuration

Required environment variables:

### Multi-Judge Mode (Recommended)
```bash
OPENROUTER_API_KEY=your_openrouter_api_key
LLM_JUDGE_MODELS=openai/gpt-4.1-nano,google/gemini-2.0-flash-001
MULTI_JUDGE_ENABLED=true
JUDGE_CONSENSUS_METHOD=average
```

### Legacy Single Judge Mode
```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-nano
```

## 📝 Notes

- **Decoupled Design**: Generation and judging are independent
- **API-Based**: Uses KoboldCpp API for model inference
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