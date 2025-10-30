#!/bin/bash

# Stop script for AI Software Company

echo "=========================================="
echo "Stopping AI Software Company"
echo "=========================================="
echo ""

# Stop both possible configurations
if [ -f docker-compose.yml ]; then
    docker-compose -f docker-compose.yml down
fi

if [ -f docker-compose.cpu.yml ]; then
    docker-compose -f docker-compose.cpu.yml down
fi

echo ""
echo "✅ Services stopped"
echo ""
echo "To start again, run: ./start.sh"
echo ""
