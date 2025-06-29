# 🧪 Sampler Bench

A research-grade benchmarking and visualization suite for evaluating LLM sampling strategies across different model families and tasks.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- CUDA-capable GPU (RTX 5070 Ti or similar)
- 32GB+ RAM recommended
- 100GB+ free disk space for models and data

### Installation

1. **Clone and setup environment**:
```bash
git clone <repository-url>
cd sampler-bench
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure models and settings**:
```bash
# Copy example configs
cp backend/config/models.example.yaml backend/config/models.yaml
cp backend/config/experiments.example.yaml backend/config/experiments.yaml

# Edit configurations as needed
nano backend/config/models.yaml
```

3. **Download initial models**:
```bash
python backend/scripts/download_models.py --model llama-3-8b --quantization q4_k_m
```

4. **Run a test benchmark**:
```bash
python backend/run_benchmark.py --config experiments/pilot.yaml
```

5. **Start the frontend** (after generating some data):
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
sampler-bench/
├── backend/                 # Python backend for benchmarking
│   ├── inference/          # Model runners and sampling
│   ├── evaluation/         # Scoring and analysis
│   ├── benchmarks/         # Task-specific benchmarks
│   ├── config/             # Configuration files
│   ├── utils/              # Shared utilities
│   └── scripts/            # Setup and utility scripts
├── frontend/               # Next.js visualization platform
│   ├── components/         # React components
│   ├── pages/              # Application routes
│   ├── hooks/              # Custom hooks
│   └── utils/              # Frontend utilities
├── data/                   # Data storage
│   ├── datasets/           # Source datasets
│   ├── raw_outputs/        # Raw generations
│   ├── processed/          # Scored outputs
│   └── visualizations/     # Viz-ready data
├── docs/                   # Documentation
├── tests/                  # Test suites
└── scripts/                # Project-level scripts
```

## 🎯 Usage

### Running Benchmarks

1. **Single experiment**:
```bash
python backend/run_benchmark.py \
  --model llama-3-8b \
  --sampler top_p \
  --task creative_writing \
  --samples 100
```

2. **Full sampling sweep**:
```bash
python backend/run_benchmark.py --config experiments/full_sweep.yaml
```

3. **Custom experiment**:
```bash
python backend/run_benchmark.py \
  --config experiments/custom.yaml \
  --override model=mistral-7b sampler.temperature=0.8
```

### Visualization

1. **Start development server**:
```bash
cd frontend && npm run dev
```

2. **Build for production**:
```bash
cd frontend && npm run build && npm start
```

## 📊 Supported Features

### Models
- **Llama 3** (8B variants)
- **Mistral** (7B variants) 
- **Qwen** (7B variants)
- Quantization: Q4_K_M, Q5_K_M, Q8_0

### Sampling Methods
- **Top-k**: Traditional top-k sampling
- **Top-p** (Nucleus): Cumulative probability sampling
- **Min-p**: Minimum probability threshold
- **Top-n-sigma**: Novel sigma-based sampling
- **Temperature**: Temperature scaling

### Evaluation Tasks
- **Creative Writing**: Custom prompts + GPT-4 judge
- **Code Generation**: HumanEval dataset
- **Factual QA**: MMLU subset
- **Reasoning**: GSM8K mathematics

## 🔧 Configuration

### Model Configuration (`backend/config/models.yaml`)
```yaml
models:
  llama-3-8b:
    path: "models/llama-3-8b-instruct.gguf"
    context_length: 8192
    quantization: "q4_k_m"
    
  mistral-7b:
    path: "models/mistral-7b-instruct.gguf"
    context_length: 8192
    quantization: "q4_k_m"
```

### Sampling Configuration (`backend/config/samplers.yaml`)
```yaml
samplers:
  top_p:
    temperature: [0.7, 0.8, 0.9]
    top_p: [0.9, 0.95, 0.99]
    
  top_k:
    temperature: [0.7, 0.8, 0.9]
    top_k: [20, 40, 80]
```

## 📈 Development Status

- [x] Project structure and configuration
- [ ] Core sampling engine implementation
- [ ] Model loading and quantization
- [ ] Benchmark task implementations
- [ ] GPT-4 evaluation pipeline
- [ ] Frontend visualization components
- [ ] Full integration testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Llama.cpp community for high-performance inference
- HuggingFace for model hosting and evaluation frameworks
- OpenAI for GPT-4 evaluation capabilities
- Research community for sampling method innovations 