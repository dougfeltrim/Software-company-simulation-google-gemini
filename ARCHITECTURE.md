# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                                                                 │
│  ┌────────────────────┐              ┌────────────────────┐    │
│  │  Web Browser       │              │  Command Line      │    │
│  │  (Gradio)          │              │  Interface         │    │
│  │  Port: 7860        │              │  (CLI Mode)        │    │
│  └─────────┬──────────┘              └─────────┬──────────┘    │
└────────────┼─────────────────────────────────────┼──────────────┘
             │                                     │
             └──────────────┬──────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│                    (Python/Gradio)                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Interface Module                            │   │
│  │  • Gradio web interface                                  │   │
│  │  • CLI interface                                         │   │
│  │  • User input handling                                   │   │
│  │  • Output formatting                                     │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────▼─────────────────────────────────┐   │
│  │              Agent Orchestration Layer                   │   │
│  │              (CrewAI Framework)                          │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐        │   │
│  │  │  Product   │  │  Software  │  │ Developer  │        │   │
│  │  │  Manager   │  │ Architect  │  │            │        │   │
│  │  └────────────┘  └────────────┘  └────────────┘        │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐                         │   │
│  │  │    QA      │  │ Technical  │                         │   │
│  │  │  Engineer  │  │   Writer   │                         │   │
│  │  └────────────┘  └────────────┘                         │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────▼─────────────────────────────────┐   │
│  │              Utility Layer                               │   │
│  │  • System benchmark                                      │   │
│  │  • Configuration management                              │   │
│  │  • Model selection                                       │   │
│  └───────────────────────┬─────────────────────────────────┘   │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM Integration Layer                         │
│                    (LangChain + Ollama)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LangChain Community Ollama Integration                  │  │
│  │  • Request formatting                                     │  │
│  │  • Response parsing                                       │  │
│  │  • Context management                                     │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Ollama Service                                │
│                    (LLM Inference Engine)                        │
│                    Port: 11434                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Model Management                                         │  │
│  │  • Load models                                            │  │
│  │  • Manage memory                                          │  │
│  │  • Handle requests                                        │  │
│  └────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│  ┌────────────────────────▼─────────────────────────────────┐  │
│  │  Inference Engine                                         │  │
│  │  • GPU/CPU execution                                      │  │
│  │  • Token generation                                       │  │
│  │  • Context management                                     │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Hardware Layer                                │
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │   CPU            │              │   GPU (Optional) │        │
│  │   • Intel/AMD    │              │   • NVIDIA       │        │
│  │   • Multi-core   │              │   • CUDA Support │        │
│  └──────────────────┘              └──────────────────┘        │
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │   RAM            │              │   VRAM           │        │
│  │   • System Memory│              │   • GPU Memory   │        │
│  └──────────────────┘              └──────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Project Generation Flow

```
1. User Input
   ↓
2. Web/CLI Interface receives description
   ↓
3. System Benchmark selects optimal model
   ↓
4. CrewAI initializes agents with LLM connections
   ↓
5. Sequential Task Execution:
   
   Task 1: Product Manager → Requirements
            ↓
   Task 2: Architect → Architecture Design
            ↓ (uses Task 1 context)
   Task 3: Developer → Code Implementation
            ↓ (uses Task 1 & 2 context)
   Task 4: QA Engineer → Testing Plan
            ↓ (uses Task 3 context)
   Task 5: Technical Writer → Documentation
            ↓ (uses all previous context)
   
6. Results aggregation
   ↓
7. Output formatting and presentation
   ↓
8. User receives complete project
```

## Component Interactions

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │
       │ Project Description
       ▼
┌──────────────────────────┐
│  Gradio Interface        │
│  or CLI                  │
└──────┬───────────────────┘
       │
       │ Validated Input
       ▼
┌──────────────────────────┐
│  System Benchmark        │◄───── Reads Hardware Info
│  • CPU Detection         │
│  • GPU Detection         │
│  • RAM Detection         │
└──────┬───────────────────┘
       │
       │ Recommended Model
       ▼
┌──────────────────────────┐
│  CrewAI Crew             │
│  • Create Agents         │
│  • Setup Tasks           │
│  • Orchestrate Flow      │
└──────┬───────────────────┘
       │
       │ For Each Agent
       ▼
┌──────────────────────────┐
│  LangChain + Ollama      │
│  • Format Prompts        │
│  • Send to Ollama API    │
│  • Parse Responses       │
└──────┬───────────────────┘
       │
       │ API Request
       ▼
┌──────────────────────────┐
│  Ollama Service          │
│  • Load Model            │
│  • Generate Text         │
│  • Return Response       │
└──────┬───────────────────┘
       │
       │ Generated Text
       ▼
┌──────────────────────────┐
│  Agent Task Complete     │
│  • Store Output          │
│  • Pass to Next Agent    │
└──────┬───────────────────┘
       │
       │ All Tasks Done
       ▼
┌──────────────────────────┐
│  Final Output            │
│  • Requirements.md       │
│  • Architecture.md       │
│  • Code.py               │
│  • Testing.md            │
│  • Documentation.md      │
└──────┬───────────────────┘
       │
       │ Display/Save
       ▼
┌──────────────────────────┐
│  User Receives Project   │
└──────────────────────────┘
```

## Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Docker Host                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Docker Network: software-company-network          │    │
│  │                                                     │    │
│  │  ┌──────────────────────┐  ┌──────────────────┐   │    │
│  │  │  Container: ollama   │  │ Container: UI    │   │    │
│  │  │                      │  │                  │   │    │
│  │  │  • Port: 11434       │  │ • Port: 7860     │   │    │
│  │  │  • Ollama Service    │  │ • Gradio App     │   │    │
│  │  │  • Model Storage     │  │ • Python Runtime │   │    │
│  │  │  • GPU Access        │  │                  │   │    │
│  │  └──────────┬───────────┘  └─────┬────────────┘   │    │
│  │             │                    │                │    │
│  │             │ HTTP API           │ Web UI         │    │
│  │             │                    │                │    │
│  └─────────────┼────────────────────┼────────────────┘    │
│                │                    │                      │
│  ┌─────────────▼──────┐  ┌──────────▼─────────┐          │
│  │  Volume:           │  │  Volume:           │          │
│  │  ollama_data       │  │  project_outputs   │          │
│  │  • Models          │  │  • Generated Files │          │
│  │  • Config          │  │  • Temp Data       │          │
│  └────────────────────┘  └────────────────────┘          │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Hardware Access                                   │  │
│  │  • CPU: All cores                                  │  │
│  │  • GPU: NVIDIA devices (if available)              │  │
│  │  • RAM: Allocated memory                           │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Model Selection Logic

```
┌─────────────────┐
│ System Startup  │
└────────┬────────┘
         │
         ▼
┌────────────────────────┐
│ Detect Hardware        │
│ • CPU cores/threads    │
│ • RAM size             │
│ • GPU presence         │
│ • VRAM size            │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐     Yes    ┌─────────────────┐
│ GPU Available?         │────────────►│ GPU Mode        │
└────────┬───────────────┘             │ • Use GPU       │
         │ No                          │ • Large models  │
         ▼                             └─────────────────┘
┌────────────────────────┐
│ CPU Mode               │
│ • Use CPU              │
│ • Smaller models       │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────┐
│ Check Resources        │
├────────────────────────┤
│ 16GB+ RAM & 8+ cores   │──────► llama3:8b, mistral:7b
│ 8GB+ RAM & 4+ cores    │──────► llama3:3b, phi3:mini
│ 4GB+ RAM               │──────► gemma:2b, tinyllama:1.1b
└────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────┐
│            Security Layers                  │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  1. Network Isolation                 │ │
│  │     • Internal Docker network         │ │
│  │     • No external connections         │ │
│  │     • Local-only by default           │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  2. Data Privacy                      │ │
│  │     • All data local                  │ │
│  │     • No cloud services               │ │
│  │     • No telemetry                    │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  3. Container Security                │ │
│  │     • Isolated processes              │ │
│  │     • Limited permissions             │ │
│  │     • Volume separation               │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  4. No Credential Storage             │ │
│  │     • No API keys required            │ │
│  │     • No cloud authentication         │ │
│  │     • Self-contained operation        │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

This architecture provides:
- Complete data privacy
- Offline capability
- Scalable performance
- Modular design
- Easy deployment
