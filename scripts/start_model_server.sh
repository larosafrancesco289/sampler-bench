#!/bin/bash
# General Model Server Startup Script
# Starts KoboldCpp with different model configurations

set -e  # Exit on error

# Default values
MODEL_NAME=""
PORT=""
CONTEXT_SIZE=""
GPU_LAYERS=""
KOBOLDCPP_PATH="/home/franc/koboldcpp-linux-x64"
MODELS_DIR="/home/franc/llms"

# Model configurations (matches backend/config/models.yaml)
declare -A MODEL_CONFIGS
MODEL_CONFIGS[llama-3.1-8b-instruct]="Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf:5002:8192:-1"
MODEL_CONFIGS[mistral-small-24b]="mistralai_Mistral-Small-3.2-24B-Instruct-2506-IQ4_XS.gguf:5001:2048:43"
MODEL_CONFIGS[ministral-8b-instruct]="Ministral-8B-Instruct-2410-Q4_K_M.gguf:5003:8192:-1"
MODEL_CONFIGS[qwen3-8b]="Qwen_Qwen3-8B-Q4_K_M.gguf:5004:8192:-1"
MODEL_CONFIGS[mistral-nemo-12b]="Mistral-Nemo-Instruct-2407-Q4_K_M.gguf:5005:8192:-1"
MODEL_CONFIGS[gemma3-12b-it]="google_gemma-3-12b-it-Q4_K_M.gguf:5006:8192:-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

usage() {
    echo -e "${CYAN}🚀 Model Server Startup Script${NC}"
    echo ""
    echo "Usage: $0 [MODEL_NAME] [OPTIONS]"
    echo ""
    echo -e "${YELLOW}Available Models:${NC}"
    for model in "${!MODEL_CONFIGS[@]}"; do
        IFS=':' read -r file port context layers <<< "${MODEL_CONFIGS[$model]}"
        echo -e "  ${GREEN}$model${NC}"
        echo -e "    File: $file"
        echo -e "    Port: $port"
        echo -e "    Context: $context"
        echo -e "    GPU Layers: $layers"
        echo ""
    done
    echo -e "${YELLOW}Options:${NC}"
    echo "  --port PORT          Override default port"
    echo "  --context SIZE       Override context size"
    echo "  --gpu-layers N       Override GPU layers (-1 = auto)"
    echo "  --koboldcpp PATH     Path to koboldcpp executable"
    echo "  --models-dir DIR     Directory containing model files"
    echo "  --help               Show this help"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 llama-3.1-8b-instruct"
    echo "  $0 mistral-small-24b --port 5001"
    echo "  $0 llama-3.1-8b-instruct --context 4096 --gpu-layers 25"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            usage
            exit 0
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --context)
            CONTEXT_SIZE="$2"
            shift 2
            ;;
        --gpu-layers)
            GPU_LAYERS="$2"
            shift 2
            ;;
        --koboldcpp)
            KOBOLDCPP_PATH="$2"
            shift 2
            ;;
        --models-dir)
            MODELS_DIR="$2"
            shift 2
            ;;
        --*)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            usage
            exit 1
            ;;
        *)
            if [[ -z "$MODEL_NAME" ]]; then
                MODEL_NAME="$1"
            else
                echo -e "${RED}❌ Too many arguments: $1${NC}"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

# If no model specified, show available models and prompt
if [[ -z "$MODEL_NAME" ]]; then
    echo -e "${CYAN}🤖 Available Models:${NC}"
    for model in "${!MODEL_CONFIGS[@]}"; do
        echo -e "  ${GREEN}$model${NC}"
    done
    echo ""
    echo -e "${YELLOW}Usage: $0 [model-name]${NC}"
    echo -e "Or use: $0 --help for full options"
    exit 1
fi

# Validate model name
if [[ ! "${MODEL_CONFIGS[$MODEL_NAME]+_}" ]]; then
    echo -e "${RED}❌ Unknown model: $MODEL_NAME${NC}"
    echo -e "${YELLOW}Available models:${NC}"
    for model in "${!MODEL_CONFIGS[@]}"; do
        echo -e "  ${GREEN}$model${NC}"
    done
    exit 1
fi

# Parse model configuration
IFS=':' read -r MODEL_FILE DEFAULT_PORT DEFAULT_CONTEXT DEFAULT_GPU_LAYERS <<< "${MODEL_CONFIGS[$MODEL_NAME]}"

# Use provided values or defaults
PORT=${PORT:-$DEFAULT_PORT}
CONTEXT_SIZE=${CONTEXT_SIZE:-$DEFAULT_CONTEXT}
GPU_LAYERS=${GPU_LAYERS:-$DEFAULT_GPU_LAYERS}

# Full path to model file
MODEL_PATH="$MODELS_DIR/$MODEL_FILE"

# Validation
if [[ ! -f "$KOBOLDCPP_PATH" ]]; then
    echo -e "${RED}❌ KoboldCpp not found at: $KOBOLDCPP_PATH${NC}"
    echo -e "${YELLOW}💡 Use --koboldcpp to specify the correct path${NC}"
    exit 1
fi

if [[ ! -f "$MODEL_PATH" ]]; then
    echo -e "${RED}❌ Model file not found: $MODEL_PATH${NC}"
    echo -e "${YELLOW}💡 Use --models-dir to specify the correct directory${NC}"
    exit 1
fi

# Display startup info
echo -e "${CYAN}🚀 Starting Model Server${NC}"
echo -e "${PURPLE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}Model:${NC} $MODEL_NAME"
echo -e "${YELLOW}File:${NC} $MODEL_FILE"
echo -e "${YELLOW}Port:${NC} $PORT"
echo -e "${YELLOW}Context:${NC} $CONTEXT_SIZE"
echo -e "${YELLOW}GPU Layers:${NC} $GPU_LAYERS"
echo -e "${YELLOW}KoboldCpp:${NC} $KOBOLDCPP_PATH"
echo -e "${PURPLE}════════════════════════════════════════${NC}"
echo ""

# Kill any existing process on the port
echo -e "${BLUE}🔄 Checking for existing processes on port $PORT...${NC}"
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Stopping existing process on port $PORT...${NC}"
    kill $(lsof -ti:$PORT) 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}✅ Port $PORT is now free${NC}"
else
    echo -e "${GREEN}✅ Port $PORT is available${NC}"
fi

# Build KoboldCpp command
KOBOLD_CMD="$KOBOLDCPP_PATH \"$MODEL_PATH\" --port $PORT --contextsize $CONTEXT_SIZE --gpulayers $GPU_LAYERS"

# Add Flash Attention for supported models
if [[ "$MODEL_NAME" == "llama-3.1-8b-instruct" ]]; then
    KOBOLD_CMD="$KOBOLD_CMD --flashattention"
    echo -e "${GREEN}⚡ Flash Attention enabled for Llama${NC}"
fi

# Start the server
echo -e "${BLUE}🚀 Starting KoboldCpp server...${NC}"
echo -e "${CYAN}Command: $KOBOLD_CMD${NC}"
echo ""

# Change to home directory (where koboldcpp expects to run)
cd /home/franc

# Start KoboldCpp
eval $KOBOLD_CMD &
KOBOLD_PID=$!

# Wait a moment and check if it started successfully
sleep 3
if kill -0 $KOBOLD_PID 2>/dev/null; then
    echo ""
    echo -e "${GREEN}🎉 Model server started successfully!${NC}"
    echo -e "${PURPLE}════════════════════════════════════════${NC}"
    echo -e "${CYAN}🌐 Server URL:${NC} http://localhost:$PORT"
    echo -e "${CYAN}📊 Web UI:${NC} http://localhost:$PORT"
    echo -e "${CYAN}🔗 API Base:${NC} http://localhost:$PORT/api/v1"
    echo -e "${PURPLE}════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}💡 Testing commands:${NC}"
    echo -e "  ${GREEN}curl http://localhost:$PORT/api/v1/model${NC}"
    echo -e "  ${GREEN}python scripts/run_benchmark.py --model $MODEL_NAME${NC}"
    echo ""
    echo -e "${YELLOW}📝 To stop the server:${NC}"
    echo -e "  ${GREEN}kill $KOBOLD_PID${NC}"
    echo -e "  ${GREEN}pkill -f koboldcpp${NC}"
    echo ""
    
    # Keep the script running to show server output
    echo -e "${BLUE}📡 Server is running (PID: $KOBOLD_PID)${NC}"
    echo -e "${BLUE}Press Ctrl+C to stop the server${NC}"
    echo ""
    
    # Wait for the server process
    wait $KOBOLD_PID
else
    echo -e "${RED}❌ Failed to start model server${NC}"
    exit 1
fi 