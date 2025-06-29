#!/bin/bash
# Startup script for Llama 3.1 8B development model
# Usage: ./start_llama_dev.sh

echo "🦙 Starting Llama 3.1 8B Instruct for development..."
echo "🚀 RTX 5070 Ti | GPU layers: auto-detect (-1) | Flash Attention: ON | Port: 5002"
echo "📊 Expected performance: ~68+ tokens/second (with Flash Attention boost)"
echo ""

# Kill any existing KoboldCPP on port 5002
echo "🔄 Checking for existing KoboldCPP processes..."
if lsof -ti:5002 > /dev/null 2>&1; then
    echo "⚠️  Stopping existing process on port 5002..."
    kill $(lsof -ti:5002) 2>/dev/null || true
    sleep 2
fi

# Start KoboldCPP with Llama 3.1 8B
echo "🚀 Starting KoboldCPP server..."
cd /home/franc
./koboldcpp-linux-x64 \
    /home/franc/llms/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \
    --port 5002 \
    --gpulayers -1 \
    --contextsize 8192 \
    --flashattention

echo ""
echo "🎯 Llama 3.1 8B ready at: http://localhost:5002"
echo "💡 Test with: python test_llama_3_1_8b.py" 