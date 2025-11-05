# Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- 8GB+ RAM available
- 20GB free disk space

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/dougfeltrim/Software-company-simulation-google-gemini.git
cd Software-company-simulation-google-gemini
```

### 2. Run Setup

```bash
chmod +x setup.sh start.sh stop.sh pull-model.sh
./setup.sh
```

This will:
- Check Docker installation
- Detect GPU/CPU capabilities
- Create configuration files
- Build Docker containers

### 3. Start Services

```bash
./start.sh
```

Wait for services to start (about 30 seconds).

### 4. Pull a Model

```bash
./pull-model.sh llama3:3b
```

This downloads the AI model (about 2GB). First time takes a few minutes.

### 5. Access the Interface

Open your browser: **http://localhost:7860**

## Creating Your First Project

1. In the web interface, enter a project description:
   ```
   Create a simple calculator for terminal use
   ```

2. Click **"Generate Project"**

3. Wait 3-5 minutes while AI agents work

4. Review the output:
   - **Requirements**: What the software should do
   - **Architecture**: How it's designed
   - **Code**: The actual Python code
   - **Testing**: Test plan and validation
   - **Documentation**: User guide

5. Download the complete project

## Using the Command Line

Quick generation without the web interface:

```bash
python main.py cli --description "Create a todo list CLI app"
```

Results saved to `output/` directory.

## Check Your System

See what models work best for your hardware:

```bash
python main.py benchmark
```

## Common Commands

```bash
# Start services
./start.sh

# Stop services
./stop.sh

# Pull a different model
./pull-model.sh mistral:7b

# View logs
docker-compose logs -f

# List available models
docker exec -it ollama ollama list
```

## Model Recommendations

Choose based on your hardware:

- **Low-end CPU** (4-8GB RAM): `tinyllama:1.1b` or `gemma:2b`
- **Good CPU** (8-16GB RAM): `llama3:3b` or `phi3:mini`
- **GPU with 4GB VRAM**: `llama3:3b` or `phi3:mini`
- **GPU with 8GB+ VRAM**: `llama3:8b` or `mistral:7b`

## Troubleshooting

**Service won't start:**
```bash
docker ps  # Check running containers
./stop.sh && ./start.sh  # Restart
```

**Model not found:**
```bash
./pull-model.sh llama3:3b  # Pull it first
```

**Out of memory:**
- Use a smaller model
- Close other applications
- Add more RAM if possible

**Slow generation:**
- Use a smaller model
- Check if GPU is being used
- Reduce project complexity

## Next Steps

- Read [ADVANCED.md](ADVANCED.md) for detailed configuration
- Experiment with different models
- Try complex project descriptions
- Check the [README.md](README.md) for more information

## Getting Help

- Check [ADVANCED.md](ADVANCED.md) for troubleshooting
- Open an issue on GitHub
- Review Ollama documentation

## Examples

Try these project descriptions:

1. **Simple Projects** (2-3 minutes):
   - "Create a password generator script"
   - "Build a file renaming utility"
   - "Make a temperature converter"

2. **Medium Projects** (5-7 minutes):
   - "Develop a web scraper for news headlines"
   - "Create a CLI task manager with JSON storage"
   - "Build a simple HTTP server with routing"

3. **Complex Projects** (10-15 minutes):
   - "Create a REST API for a blog with authentication"
   - "Build a data analysis tool for CSV files"
   - "Develop a chat application with WebSockets"

---

**Ready to create? Access http://localhost:7860 and start building!**
