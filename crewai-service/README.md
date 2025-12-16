# CrewAI Software Company Service

This Python service provides AI-powered software generation using CrewAI.

## Setup

1. Create virtual environment:
   ```bash
   cd crewai-service
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. Run the service:
   ```bash
   python server.py
   ```

## Agents

- **Product Manager**: Analyzes requirements and plans file structure
- **Senior Developer**: Writes production-quality code
- **QA Engineer**: Reviews code for issues (optional)

## API

- `GET /health` - Health check
- `POST /generate` - Generate project
- `WS /ws` - Real-time log streaming

## Integration

The TypeScript backend proxies requests to this service at `http://localhost:3002`.
