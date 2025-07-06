#!/bin/bash

# Generate Real Logits Data for Visualizer
# This script generates real token distributions from KoboldCpp and saves them for the frontend

# Default model
MODEL=${1:-"llama-3.1-8b-instruct"}

echo "🚀 Generating logits data for visualizer..."
echo "📱 Using model: $MODEL"

# Model port mapping (from models.yaml)
declare -A MODEL_PORTS
MODEL_PORTS["mistral-small-24b"]=5001
MODEL_PORTS["llama-3.1-8b-instruct"]=5002
MODEL_PORTS["ministral-8b-instruct"]=5003
MODEL_PORTS["qwen3-8b"]=5004
MODEL_PORTS["mistral-nemo-12b"]=5005
MODEL_PORTS["gemma3-12b-it"]=5006

# Get port for the specified model
PORT=${MODEL_PORTS[$MODEL]}

if [ -z "$PORT" ]; then
    echo "❌ Unknown model: $MODEL"
    echo "Available models:"
    for model in "${!MODEL_PORTS[@]}"; do
        echo "  - $model (port ${MODEL_PORTS[$model]})"
    done
    exit 1
fi

echo "🔍 Checking KoboldCpp server on port $PORT..."

# Check if model server is running
if ! curl -s http://localhost:$PORT/api/v1/info > /dev/null 2>&1; then
    echo "❌ KoboldCpp server not running on port $PORT"
    echo "Please start the server first:"
    echo "  ./scripts/start_model_server.sh $MODEL"
    echo ""
    echo "Available models:"
    for model in "${!MODEL_PORTS[@]}"; do
        echo "  ./scripts/start_model_server.sh $model"
    done
    exit 1
fi

echo "✅ KoboldCpp server detected on port $PORT"

# Run the logits generation script
python scripts/generate_logits_data.py \
    --model $MODEL \
    --output frontend/public/logits-data.json \
    --scenarios 5

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Logits data generated successfully!"
    echo "📊 The visualizer will now use real model data"
    echo ""
    echo "You can now view the visualizer at:"
    echo "  http://localhost:3000/visualizer"
else
    echo "❌ Failed to generate logits data"
    echo "The visualizer will use fallback simulated data"
fi