# Advanced Usage Guide

## Table of Contents
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Model Management](#model-management)
- [Usage Examples](#usage-examples)
- [Performance Tuning](#performance-tuning)
- [Troubleshooting](#troubleshooting)

## Installation Methods

### Method 1: Docker (Recommended)

This is the easiest method and works on all platforms.

```bash
# Clone repository
git clone https://github.com/dougfeltrim/Software-company-simulation-google-gemini.git
cd Software-company-simulation-google-gemini

# Run setup
./setup.sh

# Start services
./start.sh

# Pull a model
./pull-model.sh llama3:3b
```

### Method 2: Local Python Installation

For development or if you prefer not to use Docker.

```bash
# Clone repository
git clone https://github.com/dougfeltrim/Software-company-simulation-google-gemini.git
cd Software-company-simulation-google-gemini

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install and start Ollama
# Follow instructions at: https://ollama.ai

# Pull a model
ollama pull llama3:3b

# Run the application
python main.py interface
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3:3b

# Hardware Configuration
USE_GPU=true
HARDWARE_MODE=auto  # auto, gpu, or cpu

# Model Configuration
TEMPERATURE=0.7      # Higher = more creative (0.0-1.0)
MAX_TOKENS=2048      # Maximum output length

# Application Configuration
PORT=7860
HOST=0.0.0.0

# Project Settings
DEFAULT_ROUNDS=3     # Number of agent collaboration rounds
```

### Model Selection

The system automatically recommends models based on your hardware. You can override this:

```python
from utils.config import Settings

settings = Settings(
    ollama_model="mistral:7b",
    temperature=0.8,
    max_tokens=4096
)
```

## Model Management

### Pulling Models

```bash
# Using the helper script (Docker)
./pull-model.sh llama3:3b

# Using Ollama directly
ollama pull llama3:3b

# Pull multiple models
./pull-model.sh llama3:3b
./pull-model.sh mistral:7b
./pull-model.sh phi3:mini
```

### Listing Models

```bash
# Docker
docker exec -it ollama ollama list

# Local
ollama list
```

### Removing Models

```bash
# Docker
docker exec -it ollama ollama rm llama3:3b

# Local
ollama rm llama3:3b
```

### Model Size Reference

| Model | Size | Min RAM | Min VRAM | Best For |
|-------|------|---------|----------|----------|
| tinyllama:1.1b | ~1GB | 2GB | 2GB | Very fast, limited quality |
| gemma:2b | ~2GB | 3GB | 3GB | CPU systems |
| phi3:mini | ~2GB | 4GB | 4GB | Balanced, efficient |
| llama3:3b | ~2GB | 4GB | 4GB | Good quality, reasonable speed |
| mistral:7b | ~4GB | 8GB | 6GB | High quality |
| llama3:8b | ~5GB | 8GB | 8GB | Best quality |

## Usage Examples

### Example 1: Simple Calculator

```bash
python main.py cli --description "Create a simple calculator that can add, subtract, multiply, and divide"
```

Output:
- `output/requirements.md` - Product requirements
- `output/architecture.md` - System architecture
- `output/code.py` - Python implementation
- `output/testing.md` - Test plan
- `output/documentation.md` - User documentation

### Example 2: Web Scraper

```bash
python main.py cli \
  --description "Build a web scraper for news articles with pagination support" \
  --model llama3:8b \
  --output ./web-scraper-project
```

### Example 3: REST API

```bash
python main.py cli \
  --description "Create a REST API for a task management system with user authentication" \
  --model mistral:7b
```

### Example 4: Using the Web Interface

1. Start the interface:
   ```bash
   python main.py interface --port 8080
   ```

2. Access http://localhost:8080

3. Enter your project description:
   ```
   Build a command-line file organizer that:
   - Organizes files by type (images, documents, videos)
   - Creates folders automatically
   - Handles duplicates
   - Has a dry-run mode
   - Logs all operations
   ```

4. Click "Generate Project" and wait

5. Review the output in each tab

6. Download the complete project

## Performance Tuning

### CPU Optimization

For CPU-only systems:

```bash
# Use CPU-specific Docker Compose
docker-compose -f docker-compose.cpu.yml up -d

# Or set environment variable
export HARDWARE_MODE=cpu
```

Choose lighter models:
- `tinyllama:1.1b` - Fastest
- `gemma:2b` - Good balance
- `phi3:mini` - Best quality for CPU

### GPU Optimization

For systems with NVIDIA GPUs:

```bash
# Use GPU Docker Compose
docker-compose -f docker-compose.yml up -d

# Or set environment variable
export HARDWARE_MODE=gpu
```

Choose appropriate models based on VRAM:
- 4GB VRAM: `llama3:3b`, `phi3:mini`
- 6GB VRAM: `mistral:7b`, `llama3:8b`
- 8GB+ VRAM: Any model

### Increasing Output Quality

Increase collaboration rounds (takes longer):

```python
# In your code
company = create_software_company(model_name="llama3:8b")
result = company.generate_project(description, verbose=True)
```

Or modify DEFAULT_ROUNDS in `.env`:
```env
DEFAULT_ROUNDS=5  # More rounds = better quality but slower
```

## Troubleshooting

### Issue: "Connection refused" to Ollama

**Solution:**
```bash
# Check if Ollama is running
docker ps | grep ollama

# Restart Ollama
docker restart ollama

# Check logs
docker logs ollama
```

### Issue: Out of Memory

**Solution:**
1. Use a smaller model:
   ```bash
   ./pull-model.sh tinyllama:1.1b
   ```

2. Reduce context window in `.env`:
   ```env
   MAX_TOKENS=1024
   ```

3. Close other applications

### Issue: Slow Generation

**Solution:**
1. Use a smaller model
2. Enable GPU if available
3. Reduce number of rounds
4. Check system load:
   ```bash
   python main.py benchmark
   ```

### Issue: Model Not Found

**Solution:**
```bash
# Pull the model first
./pull-model.sh llama3:3b

# Verify it's available
docker exec -it ollama ollama list
```

### Issue: Docker Container Won't Start

**Solution:**
```bash
# Check Docker logs
docker logs ollama
docker logs software-company-ui

# Restart all services
./stop.sh
./start.sh

# Check if ports are available
lsof -i :7860
lsof -i :11434
```

### Issue: GPU Not Being Used

**Solution:**
1. Check NVIDIA drivers:
   ```bash
   nvidia-smi
   ```

2. Install NVIDIA Container Toolkit:
   ```bash
   # Ubuntu/Debian
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
   sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

3. Use GPU Docker Compose:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Issue: Poor Output Quality

**Solution:**
1. Use a larger model (e.g., `llama3:8b` instead of `gemma:2b`)
2. Increase temperature for more creativity
3. Provide more detailed descriptions
4. Increase number of rounds

### Issue: Web Interface Not Loading

**Solution:**
```bash
# Check if service is running
docker ps

# Check logs
docker logs software-company-ui

# Try accessing directly
curl http://localhost:7860

# Restart the service
docker restart software-company-ui
```

## Advanced Configuration

### Custom Agent Roles

You can modify the agents in `src/agents/crew.py`:

```python
agents['custom_agent'] = Agent(
    role='Your Custom Role',
    goal='Your custom goal',
    backstory='Your custom backstory',
    verbose=True,
    allow_delegation=False,
    llm=self.llm
)
```

### Custom Tasks

Add custom tasks in the `_create_tasks` method:

```python
custom_task = Task(
    description="Your custom task description",
    agent=self.agents['custom_agent'],
    expected_output="Expected output description",
    context=[previous_tasks]
)
```

### Monitoring and Logging

Enable verbose logging:

```bash
# Docker
docker-compose logs -f software-company-ui

# Local
PYTHONPATH=src python -u main.py interface --verbose
```

## Best Practices

1. **Start small**: Test with simple projects first
2. **Use appropriate models**: Match model to hardware
3. **Be specific**: Detailed descriptions yield better results
4. **Iterate**: Review output and refine descriptions
5. **Save configurations**: Keep track of what works well
6. **Monitor resources**: Use `python main.py benchmark` regularly

## Getting Help

- **GitHub Issues**: https://github.com/dougfeltrim/Software-company-simulation-google-gemini/issues
- **Documentation**: Check the README.md
- **Ollama Docs**: https://ollama.ai/docs
- **CrewAI Docs**: https://docs.crewai.com/
