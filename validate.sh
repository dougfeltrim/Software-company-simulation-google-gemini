#!/bin/bash

# Validation script for AI Software Company
echo "🔍 Validating AI Software Company Setup..."
echo ""

# Check Node.js version
echo "1️⃣  Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Node.js: $NODE_VERSION"
else
    echo "   ❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm version
echo "2️⃣  Checking npm version..."
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ npm: $NPM_VERSION"
else
    echo "   ❌ npm not found"
    exit 1
fi

# Check if dependencies are installed
echo "3️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ Root dependencies installed"
else
    echo "   ⚠️  Root dependencies not installed. Run: npm install"
fi

if [ -d "backend/node_modules" ]; then
    echo "   ✅ Backend dependencies installed"
else
    echo "   ⚠️  Backend dependencies not installed"
fi

if [ -d "frontend/node_modules" ]; then
    echo "   ✅ Frontend dependencies installed"
else
    echo "   ⚠️  Frontend dependencies not installed"
fi

# Check .env file
echo "4️⃣  Checking configuration..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
else
    echo "   ⚠️  .env file not found. Copy from .env.example"
fi

# Check Ollama
echo "5️⃣  Checking Ollama..."
OLLAMA_CHECK=$(curl -s http://localhost:11434/api/tags 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "   ✅ Ollama is running"
    MODEL_COUNT=$(echo $OLLAMA_CHECK | grep -o '"name"' | wc -l)
    echo "   ℹ️  Models installed: $MODEL_COUNT"
else
    echo "   ⚠️  Ollama not running or not accessible"
    echo "      Start Ollama with: ollama serve"
fi

# Try to build backend
echo "6️⃣  Testing backend build..."
cd backend
BUILD_OUTPUT=$(npm run build 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Backend builds successfully"
else
    echo "   ❌ Backend build failed"
    echo "$BUILD_OUTPUT"
fi
cd ..

# Try to build frontend
echo "7️⃣  Testing frontend build..."
cd frontend
BUILD_OUTPUT=$(npm run build 2>&1)
if [ $? -eq 0 ]; then
    echo "   ✅ Frontend builds successfully"
else
    echo "   ❌ Frontend build failed"
    echo "$BUILD_OUTPUT"
fi
cd ..

echo ""
echo "✨ Validation complete!"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "Then visit:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
