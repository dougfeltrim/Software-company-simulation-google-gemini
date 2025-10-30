#!/bin/bash

# Script to pull Ollama models

MODEL=${1:-llama3:3b}

echo "=========================================="
echo "Pulling Ollama Model: $MODEL"
echo "=========================================="
echo ""

if ! docker ps | grep -q ollama; then
    echo "❌ Ollama container is not running."
    echo "Please start the services first: ./start.sh"
    exit 1
fi

echo "Pulling model... This may take a while depending on model size."
echo ""

docker exec -it ollama ollama pull $MODEL

echo ""
echo "=========================================="
echo "✅ Model $MODEL pulled successfully!"
echo "=========================================="
echo ""
echo "You can now use this model in the web interface."
echo "Access the interface at: http://localhost:7860"
echo ""
