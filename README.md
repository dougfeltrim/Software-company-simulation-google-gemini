# 🏢 AI Software Company - Ollama Edition

> **Create complete software projects with AI agents powered by Ollama and local LLMs**

A modern, real-time software company simulation using only local Ollama models. Features a split-screen interface with live logs, project history, and toast notifications.

## ✨ Features

- 🤖 **100% Local with Ollama** - No API keys, completely offline
- ⚡ **Dual Generation Engine** - Choose between fast TypeScript generation or advanced LangGraph Multi-Agent system
- 🎨 **Modern Split-Screen Interface** - Three-panel layout for efficient workflow
- 📊 **Real-time Logs & Visualization** - Watch logs and visualized agent workflows live
- 📚 **Project History** - Track all your projects with full details
- 🔔 **Toast Notifications** - Get notified when projects start, succeed, or fail
- 🚀 **10 Real Ollama Models** - Choose from code, thinking, and general models (up to 14B)

## 🤖 Available Models

### Code Models (Best for development)
- **DeepSeek Coder 6.7B** (`deepseek-coder:6.7b`) - Specialized in code generation
- **Code Llama 13B** (`codellama:13b`) - Meta's code-focused model
- **Phind CodeLlama 34B** (`phind-codellama:34b-v2`) - Enhanced for complex coding

### Thinking Models (Best for planning)
- **DeepSeek R1 7B** (`deepseek-r1:7b`) - Advanced reasoning
- **Qwen 2.5 14B** (`qwen2.5:14b`) - Strong analytical capabilities

### General Models (Balanced)
- **Llama 3.1 8B** (`gemma3:4b`) - Recommended default
- **Mistral 7B** (`mistral:7b`) - Fast and efficient
- **Gemma 2 9B** (`gemma2:9b`) - Google's open model
- **Phi-3 14B** (`phi3:14b`) - Microsoft's compact model
- **Neural Chat 7B** (`neural-chat:7b`) - Optimized for conversations

## 📋 Prerequisites

1. **Install Ollama**
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai/download
   ```

2. **Pull at least one model**
   ```bash
   ollama pull gemma3:4b
   ollama pull deepseek-coder:6.7b
   ollama pull qwen2.5:14b
   ```

3. **Start Ollama service**
   ```bash
   ollama serve
   ```

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dougfeltrim/Software-company-simulation-google-gemini.git
   cd Software-company-simulation-google-gemini
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This starts both:
   - Backend server on http://localhost:3001
   - Frontend on http://localhost:3000

## 📖 Usage

1. **Access the interface** at http://localhost:3000

2. **Select a model** from the dropdown
   - Code models for development tasks
   - Thinking models for complex planning
   - General models for balanced work

3. **Enter project details**
   - Give your project a name (optional)
   - Describe what you want to build (be specific!)

4. **Click "Generate Project"**
   - Watch real-time logs in the middle panel
   - See progress updates as files are created
   - Get notified when complete

5. **View project history** in the right panel
   - All projects are saved
   - Click to view details
   - Delete projects you don't need

## 🏗️ Project Structure

```
/
├── backend/                  # Express.js backend
│   └── src/                  # TypeScript source code
├── frontend/                 # Next.js frontend
│   ├── app/                  # Next.js App Router
│   └── components/           # React components
├── crewai-service/           # Python/LangGraph multi-agent service
│   ├── graph.py              # LangGraph workflow
│   ├── agents.py             # Agent definitions
│   └── server.py             # FastAPI server
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # System architecture
│   ├── DEVELOPMENT.md        # Developer guide
│   └── QUICKSTART.md         # Quick start guide
├── generated/                # Generated projects (gitignored)
├── package.json              # Root workspace
└── README.md
```

## 🔧 Configuration

Edit `.env` file:

```env
# Ollama
OLLAMA_HOST=http://localhost:11434

# Backend
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

## 🛠️ Development

### Start in development mode
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

### Type checking
```bash
npm run type-check
```

## 📝 API Endpoints

### Backend API (http://localhost:3001)

- `GET /api/health` - Health check and Ollama status
- `GET /api/models` - List available models
- `GET /api/history` - Get all projects
- `GET /api/history/:id` - Get specific project
- `DELETE /api/history/:id` - Delete project
- `POST /api/generate` - Generate new project
- `WS /ws` - WebSocket for real-time logs

### Generate Project Request
```json
{
  "name": "My Project",
  "description": "Build a calculator app",
  "model": "gemma3:4b"
}
```

## 🔍 Troubleshooting

**Ollama not connecting?**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

**Model not found?**
```bash
# List installed models
ollama list

# Pull a model
ollama pull gemma3:4b
```

**Port already in use?**
```bash
# Change ports in .env file
PORT=3002
```

**WebSocket not connecting?**
- Check if backend is running on port 3001
- Verify NEXT_PUBLIC_WS_URL in .env
- Check browser console for errors

## 🎯 Tips for Best Results

1. **Be specific in descriptions** - The more detail, the better the result
2. **Use code models for development** - They generate better code
3. **Use thinking models for planning** - They excel at architecture
4. **Start small** - Test with simple projects first
5. **Check real-time logs** - Monitor progress and catch issues early

## 📦 Technology Stack

- **Backend**: TypeScript, Express.js, Ollama, WebSocket
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Notifications**: Sonner (toast notifications)
- **Icons**: Lucide React

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) for local LLM infrastructure
- Meta, DeepSeek, Mistral, Google, Microsoft for open models
- The open-source community

---

**Made with ❤️ using 100% local AI**
