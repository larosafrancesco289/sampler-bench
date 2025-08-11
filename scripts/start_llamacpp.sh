#!/usr/bin/env bash

# Thin wrapper around the legacy script name. Prefer this name in docs.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/start_llama_server.sh" "$@"

