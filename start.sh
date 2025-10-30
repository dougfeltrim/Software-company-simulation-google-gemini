#!/bin/bash

# Start script for AI Software Company

set -e

MODE=${1:-auto}

echo "=========================================="
echo "Starting AI Software Company"
echo "=========================================="
echo ""

# Determine which compose file to use
if [ "$MODE" = "cpu" ]; then
    COMPOSE_FILE="docker-compose.cpu.yml"
    echo "Mode: CPU"
elif [ "$MODE" = "gpu" ]; then
    COMPOSE_FILE="docker-compose.yml"
    echo "Mode: GPU"
else
    # Auto-detect
    if command -v nvidia-smi &> /dev/null; then
        COMPOSE_FILE="docker-compose.yml"
        echo "Mode: GPU (auto-detected)"
    else
        COMPOSE_FILE="docker-compose.cpu.yml"
        echo "Mode: CPU (auto-detected)"
    fi
fi

echo ""
echo "Starting services..."
docker-compose -f $COMPOSE_FILE up -d

echo ""
echo "Waiting for services to be ready..."
sleep 5

# Check if Ollama is ready
echo "Checking Ollama status..."
for i in {1..30}; do
    if curl -s http://localhost:11434/ > /dev/null; then
        echo "✅ Ollama is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Ollama failed to start"
        exit 1
    fi
    sleep 2
done

echo ""
echo "=========================================="
echo "✅ Services Started!"
echo "=========================================="
echo ""
echo "Ollama API: http://localhost:11434"
echo "Web Interface: http://localhost:7860"
echo ""
echo "To view logs:"
echo "  docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "To stop services:"
echo "  ./stop.sh"
echo ""
echo "⚠️  IMPORTANT: You need to pull at least one model first!"
echo "Run: ./pull-model.sh llama3:3b"
echo ""
