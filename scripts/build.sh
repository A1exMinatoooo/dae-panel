#!/bin/bash
set -e

if [ -z "${VERSION:-}" ]; then
    VERSION="$(git describe --tags --always --dirty 2>/dev/null || printf 'dev')"
fi
export VITE_APP_VERSION="$VERSION"

echo "Building frontend..."
cd web
npm install
npm run build
cd ..

echo "Building backend..."
CGO_ENABLED=0 go build \
    -ldflags="-X github.com/daeuniverse/dae-panel/internal/version.Version=$VERSION" \
    -o dae-panel .

echo "Build complete: ./dae-panel"
