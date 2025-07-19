#!/bin/bash

# Start llama.cpp server with enhanced logits access for sampling visualization
#
# This server provides:
# - 20 clean tokens per request (vs 5-6 from KoboldCpp) 
# - Authentic probability distributions from Gemma
# - Better sampling visualization in frontend
#
# Usage: ./scripts/start_llama_server.sh
#
# Note: Uses port 5007 to avoid conflict with KoboldCpp (5006)

MODEL_PATH="/home/franc/llms/google_gemma-3-12b-it-Q4_K_M.gguf"
PORT=5007  # Different port from KoboldCpp

echo "Starting llama.cpp server with full logits access..."
echo "Model: $MODEL_PATH"
echo "Port: $PORT"
echo "Access at: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

llama-server \
    --model "$MODEL_PATH" \
    --port $PORT \
    --host 0.0.0.0 \
    --ctx-size 8192 \
    --n-gpu-layers -1 \
    --log-disable \
    --verbose \
    --slots