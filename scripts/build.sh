#!/bin/bash
set -e

echo "Building frontend..."
cd web
npm install
npm run build
cd ..

echo "Building backend..."
CGO_ENABLED=0 go build -o dae-panel .

echo "Build complete: ./dae-panel"
