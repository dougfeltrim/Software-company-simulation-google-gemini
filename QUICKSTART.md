# 🚀 Quick Start Guide

Get started with AI Software Company in 5 minutes!

## Step 1: Install Ollama

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows
Download from https://ollama.ai/download

## Step 2: Start Ollama and Pull a Model

```bash
# Start Ollama service (keep this running)
ollama serve

# In a new terminal, pull a model
ollama pull llama3.1:8b
```

**Recommended models:**
- `llama3.1:8b` - Best default (4.7GB)
- `deepseek-coder:6.7b` - Best for code (3.8GB)
- `mistral:7b` - Fast and efficient (4.1GB)

## Step 3: Install Dependencies

```bash
git clone https://github.com/dougfeltrim/Software-company-simulation-google-gemini.git
cd Software-company-simulation-google-gemini
npm install
```

## Step 4: Configure (Optional)

The default configuration works out of the box. To customize:

```bash
cp .env.example .env
# Edit .env if needed
```

## Step 5: Start the Application

```bash
npm run dev
```

Wait for both servers to start:
- ✅ Backend: http://localhost:3001
- ✅ Frontend: http://localhost:3000

## Step 6: Create Your First Project

1. Open http://localhost:3000 in your browser
2. Select a model (e.g., "Llama 3.1 8B")
3. Enter a project name (e.g., "Calculator App")
4. Describe your project:
   ```
   Create a simple calculator web application with:
   - Basic operations (add, subtract, multiply, divide)
   - A clean user interface
   - Input validation
   ```
5. Click **"Generate Project"**
6. Watch the real-time logs as your project is created!

## What Happens Next?

- **Left Panel**: Your form and settings
- **Middle Panel**: Real-time logs showing what's being created
- **Right Panel**: History of all your projects

Projects are saved in the `generated/` folder.

## Troubleshooting

### Ollama not connecting?
```bash
curl http://localhost:11434/api/tags
```
If this fails, ensure `ollama serve` is running.

### Port already in use?
Edit `.env` and change the PORT values.

### Model not found?
Pull the model first:
```bash
ollama pull llama3.1:8b
```

## Next Steps

- ✨ Try different models for different tasks
- 📚 Check the project history
- 🎨 Customize the UI in `frontend/`
- 🤖 Add new agents in `backend/src/lib/agents/`

See [DEVELOPMENT.md](DEVELOPMENT.md) for more details.

## Getting Help

- 📖 [Full README](README.md)
- 🛠️ [Development Guide](DEVELOPMENT.md)
- 🐛 [Report Issues](https://github.com/dougfeltrim/Software-company-simulation-google-gemini/issues)

---

**Happy Coding! 🎉**
