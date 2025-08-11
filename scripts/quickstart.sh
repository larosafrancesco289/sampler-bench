#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

echo "Activate venv: source .venv/bin/activate"
echo "Starting frontend dev server and running a small benchmark example."

# Start frontend in background
cd "$ROOT_DIR/frontend"
npm run dev >/dev/null 2>&1 &
FRONTEND_PID=$!
cd "$ROOT_DIR"

trap 'kill $FRONTEND_PID >/dev/null 2>&1 || true' EXIT

# Run a tiny benchmark to produce one results file (requires a local model server)
python scripts/run_benchmark.py --model llama-3.1-8b-instruct --samplers llama_default --repetitions 1 --max-length 256 || true

echo "Open the dashboard at http://localhost:3000"

