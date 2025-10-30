#!/bin/bash

# Setup script for AI Software Company

set -e

echo "=========================================="
echo "AI Software Company Setup"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✅ Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker Compose is installed"

# Check for GPU support
echo ""
echo "Checking for GPU support..."
if command -v nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected"
    COMPOSE_FILE="docker-compose.yml"
    GPU_MODE="GPU"
else
    echo "ℹ️  No NVIDIA GPU detected. Will use CPU mode."
    COMPOSE_FILE="docker-compose.cpu.yml"
    GPU_MODE="CPU"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi

# Pull Ollama image
echo ""
echo "Pulling Ollama Docker image..."
docker pull ollama/ollama:latest

# Build the application
echo ""
echo "Building application..."
if [ "$GPU_MODE" = "GPU" ]; then
    docker-compose -f docker-compose.yml build
else
    docker-compose -f docker-compose.cpu.yml build
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Hardware Mode: $GPU_MODE"
echo ""
echo "To start the application, run:"
if [ "$GPU_MODE" = "GPU" ]; then
    echo "  ./start.sh"
else
    echo "  ./start.sh cpu"
fi
echo ""
echo "After starting, you can:"
echo "  1. Pull models: ./pull-model.sh <model-name>"
echo "  2. Access the web interface at: http://localhost:7860"
echo ""
