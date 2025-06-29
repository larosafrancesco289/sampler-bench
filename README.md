# Sampler Bench - Model Testing Platform

A high-performance model testing and benchmarking platform that finds optimal sampling strategies for any LLM across different tasks. Powered by **KoboldCpp** and **GPU acceleration**.

**Vision:** Download a model, run comprehensive benchmarks, get the best sampling settings for each task (creative writing, reasoning, coding, etc.) via a web dashboard.

**MVP Scope:** Creative writing task only, with plans for frontend dashboard on Vercel.

## Current Features

- **GPU-Accelerated Performance**: 40+ tokens/sec with KoboldCpp on RTX 5070 Ti
- **Creative Writing Benchmarks**: Optimized presets for stories, dialogue, and brainstorming
- **Multiple Sampling Strategies**: Top-p, Min-p, and temperature-based sampling
- **Performance Measurement**: Speed and quality metrics across configurations
- **JSON Results Export**: Ready for frontend consumption

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- NVIDIA GPU with CUDA support (16GB+ recommended)
- KoboldCpp with CUDA acceleration

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd sampler-bench
```

2. **Set up Python environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure your model** (edit `backend/config/models.yaml`):
```yaml
models:
  mistral-small-24b:
    name: "Mistral Small 3.2 24B Instruct"
    path: "/path/to/your/model.gguf"
    context_length: 2048
    inference_engine: "koboldcpp"
    port: 5001
    gpu_layers: 43  # Adjust for your GPU
```

### Running Tests

1. **Start KoboldCpp server**:
```bash
./koboldcpp-linux-x64 --model /path/to/model.gguf --usecublas normal 0 --gpulayers 43 --contextsize 2048 --port 5001
```

2. **Run creative writing tests**:
```bash
python test_creative_writing.py
```

## 📊 Performance Results

**RTX 5070 Ti Performance** (with Mistral Small 24B):
- **Focused preset**: 38-42 tokens/sec (coherent, minimal repetition)
- **Balanced preset**: 35-40 tokens/sec (creative + coherent)
- **Creative preset**: 32-38 tokens/sec (high diversity)
- **Natural preset**: 36-41 tokens/sec (min-p sampling)

## 🎭 Creative Writing Presets

### Focused
- **Best for**: Coherent stories, technical writing
- **Settings**: Temperature 0.7, Top-p 0.9
- **Characteristics**: Logical flow, minimal repetition

### Balanced  
- **Best for**: General creative writing, novels
- **Settings**: Temperature 0.8, Top-p 0.95
- **Characteristics**: Creative yet coherent

### Creative
- **Best for**: Brainstorming, experimental writing
- **Settings**: Temperature 1.0, Top-p 0.99
- **Characteristics**: High diversity and originality

### Natural
- **Best for**: Dialogue, conversational content
- **Settings**: Temperature 0.8, Min-p 0.05
- **Characteristics**: Natural flow using min-p sampling

## 🏗️ Project Structure

```
sampler-bench/
├── backend/
│   ├── config/           # Model and sampling configurations
│   ├── inference/        # KoboldCpp integration
│   └── utils/           # Logging and configuration utilities
├── data/                # Experiment results and datasets
├── test_creative_writing.py  # Main testing script
└── README.md
```

## ⚙️ Configuration

### Models (`backend/config/models.yaml`)
Define your model paths and GPU settings:
- Model path and quantization
- Context length and GPU layers
- KoboldCpp server configuration

### Sampling Presets (`backend/config/samplers.yaml`)
Creative writing optimized presets:
- Temperature and top-p settings
- Repetition penalty configuration
- Task-specific recommendations

### Experiments (`backend/config/experiments.yaml`)
Predefined creative writing experiments:
- Story generation benchmarks
- Dialogue quality tests
- Performance comparisons

## 🎯 Supported Tasks

- **Story Writing**: Long-form narrative generation
- **Dialogue**: Character conversations and responses
- **Brainstorming**: Idea generation and exploration
- **World Building**: Setting and environment description

## 📈 Results and Analysis

Test results are saved to `creative_writing_results.json` with:
- Performance metrics (tokens/sec, generation time)
- Quality samples for each preset
- Configuration details and timestamps

## 🔧 Hardware Requirements

**Recommended**:
- RTX 4070/5070 Ti or better (16GB+ VRAM)
- 32GB+ system RAM
- Fast SSD storage

**Minimum**:
- RTX 3060 12GB (with reduced layers)
- 16GB+ system RAM

## 🤝 Contributing

This project focuses on creative writing applications. Future improvements:
- Additional task types (code, analysis, etc.)
- More inference engines
- Advanced evaluation metrics
- Web interface for easy testing

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to optimize your model sampling strategies? Start benchmarking!** 