#!/usr/bin/env bash

set -euo pipefail

# Minimal project setup: Python venv + backend deps + frontend deps

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

echo "Setting up Python environment..."

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi

if [ -z "${VIRTUAL_ENV:-}" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

pip install --upgrade pip >/dev/null
pip install -r requirements.txt

echo "Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install

echo "Setup complete."
echo "Activate the venv before running Python scripts:"
echo "  source .venv/bin/activate"

