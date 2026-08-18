#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Building frontend..."
(cd frontend && npm install && npm run build)

echo "==> Starting backend (serves API + built frontend + assets)..."
dotnet run --project backend -- "$@"
