# 🏗️ Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                           │
│                      (http://localhost:3000)                     │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTP/WebSocket
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 14)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Form Panel  │  │  Logs Panel  │  │History Panel │         │
│  │              │  │              │  │              │         │
│  │ • Model      │  │ • Real-time  │  │ • Projects   │         │
│  │ • Name       │  │ • WebSocket  │  │ • Status     │         │
│  │ • Desc       │  │ • Progress   │  │ • Files      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Components:                                                     │
│  • RealtimeLogs.tsx                                             │
│  • ProjectHistory.tsx                                           │
│  • NotificationSystem (Sonner)                                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ REST API + WebSocket
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Express.js + TypeScript)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  REST API Endpoints:                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  GET  /api/health       - Health check                 │    │
│  │  GET  /api/models       - List models                  │    │
│  │  GET  /api/history      - Get projects                 │    │
│  │  POST /api/generate     - Create project               │    │
│  │  WS   /ws               - WebSocket logs               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Services:                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ Logger Service │  │History Service │  │ Ollama Provider│   │
│  │                │  │                │  │                │   │
│  │ • WebSocket    │  │ • JSON storage │  │ • Chat API     │   │
│  │ • Events       │  │ • CRUD ops     │  │ • Streaming    │   │
│  │ • History      │  │ • Projects     │  │ • Health       │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                  │
│  Agents:                                                         │
│  ┌────────────────┐  ┌────────────────┐                        │
│  │ Product Manager│  │   Developer    │                        │
│  │                │  │                │                        │
│  │ • Requirements │  │ • Code Gen     │                        │
│  │ • Planning     │  │ • Files        │                        │
│  └────────────────┘  └────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTP API
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Ollama (http://localhost:11434)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Available Models (10):                                         │
│                                                                  │
│  Code Models:                                                   │
│  • deepseek-coder:6.7b                                          │
│  • codellama:13b                                                │
│  • phind-codellama:34b-v2                                       │
│                                                                  │
│  Thinking Models:                                               │
│  • deepseek-r1:7b                                               │
│  • qwen2.5:14b                                                  │
│                                                                  │
│  Common Models:                                                 │
│  • gemma3:4b (default)                                        │
│  • mistral:7b                                                   │
│  • gemma2:9b                                                    │
│  • phi3:14b                                                     │
│  • neural-chat:7b                                               │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │   Generated    │
                        │   Projects     │
                        │                │
                        │  generated/    │
                        │  └─projects/   │
                        └────────────────┘
```

## Data Flow

### 1. Project Generation Flow

```
User Input → Frontend Form
     │
     ├─► POST /api/generate
     │
     ▼
Backend API
     │
     ├─► Create project entry in history
     ├─► Start async generation
     └─► Return project ID
           │
           ▼
     Project Generation (Async)
           │
           ├─► Product Manager Agent
           │       │
           │       └─► Ollama → Requirements
           │
           ├─► Developer Agent
           │       │
           │       └─► Ollama → Code
           │
           ├─► Save files to disk
           │       │
           │       └─► generated/projects/{id}/
           │
           └─► Update history
                   │
                   └─► Status: success/failed
```

### 2. Real-time Logging Flow

```
Backend Event
     │
     ├─► logger.logStatus()
     │   logger.logProgress()
     │   logger.logFileEdit()
     │
     ▼
Logger Service
     │
     ├─► Broadcast via WebSocket
     │
     ▼
All Connected Clients
     │
     └─► Frontend RealtimeLogs Component
               │
               └─► Update UI in real-time
```

### 3. History Management Flow

```
Project Start
     │
     └─► historyService.addProject()
               │
               ▼
         history.json
               │
               ├─► id, name, model, status
               ├─► timestamp, files
               └─► outputPath
                     │
                     ▼
                 Frontend polls
                     │
                     └─► GET /api/history
                           │
                           └─► Update History Panel
```

## Component Interactions

### Frontend Components

```
page.tsx (Main Page)
    │
    ├─► RealtimeLogs.tsx
    │       │
    │       ├─► WebSocket connection
    │       ├─► Log display
    │       └─► Progress indicators
    │
    ├─► ProjectHistory.tsx
    │       │
    │       ├─► Fetch history
    │       ├─► Display projects
    │       └─► Delete actions
    │
    └─► Toaster (Sonner)
            │
            └─► Success/Error notifications
```

### Backend Services

```
index.ts (Express Server)
    │
    ├─► Ollama Provider
    │       │
    │       ├─► generate()
    │       ├─► generateStream()
    │       └─► listModels()
    │
    ├─► Logger Service
    │       │
    │       ├─► WebSocket server
    │       ├─► Event emission
    │       └─► History buffer
    │
    ├─► History Service
    │       │
    │       ├─► JSON file storage
    │       ├─► CRUD operations
    │       └─► Project management
    │
    └─► Agents
            │
            ├─► BaseAgent
            │       │
            │       └─► Conversation history
            │
            ├─► ProductManagerAgent
            │       │
            │       └─► Requirements analysis
            │
            └─► DeveloperAgent
                    │
                    └─► Code generation
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **LLM Client**: Ollama JS SDK
- **WebSocket**: ws 8.x
- **File I/O**: Node.js fs/promises

### Frontend
- **Framework**: Next.js 14.x (App Router)
- **UI Library**: React 18.x
- **Styling**: Tailwind CSS 3.x
- **Notifications**: Sonner 1.x
- **Icons**: Lucide React
- **Language**: TypeScript 5.x

### Development
- **Package Manager**: npm (workspaces)
- **Build Tool**: tsc (TypeScript)
- **Dev Server**: tsx (backend), next (frontend)
- **Hot Reload**: Supported on both

## File System Structure

```
/
├── backend/                         # Backend workspace
│   ├── src/
│   │   ├── index.ts                # Express server
│   │   └── lib/
│   │       ├── config.ts           # Models & config
│   │       ├── providers/
│   │       │   └── ollama.ts       # Ollama client
│   │       ├── services/
│   │       │   ├── logger.ts       # WebSocket logging
│   │       │   └── history.ts      # JSON storage
│   │       └── agents/
│   │           ├── base.ts         # Base agent
│   │           ├── product-manager.ts
│   │           └── developer.ts
│   ├── dist/                       # Compiled JS (gitignored)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                        # Frontend workspace
│   ├── app/
│   │   ├── page.tsx                # Main page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Global styles
│   ├── components/
│   │   ├── RealtimeLogs.tsx        # Log viewer
│   │   └── ProjectHistory.tsx      # History viewer
│   ├── .next/                      # Build output (gitignored)
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── generated/                       # Generated projects (gitignored)
│   ├── history.json                # Project history
│   └── projects/
│       └── {project-id}/           # Individual projects
│
├── node_modules/                    # Dependencies (gitignored)
├── package.json                     # Root workspace
├── .env                            # Environment vars (gitignored)
├── .env.example                    # Config template
└── README.md                       # Documentation
```

## Security Considerations

1. **Local Only** - No external API calls
2. **No Authentication** - Designed for local use
3. **File System Access** - Limited to `generated/` directory
4. **WebSocket** - No sensitive data transmitted
5. **CORS** - Open for local development
6. **Input Validation** - Basic validation on API endpoints

## Performance Characteristics

- **Backend Startup**: ~1-2 seconds
- **Frontend Build**: ~10 seconds
- **Frontend Load**: ~100KB First Load JS
- **Project Generation**: Depends on model (30s-5min)
- **WebSocket Latency**: <50ms
- **History Load**: <100ms

## Scalability Notes

Current implementation is designed for:
- Single user (local development)
- One project at a time
- Small to medium projects
- Models up to 14B parameters

For production/multi-user, consider:
- Authentication & authorization
- Rate limiting
- Project queuing
- Database instead of JSON
- Caching layer
- Load balancing

## Deployment Options

### Development
```bash
npm run dev
```

### Production (Local)
```bash
npm run build
npm start
```

### Docker (Future)
Could be containerized with:
- Multi-stage build
- Node.js base image
- Volume for generated/
- Health checks

## Monitoring & Debugging

### Backend Logs
- Console output in terminal
- Log levels: info, error
- Real-time via WebSocket

### Frontend Logs
- Browser DevTools Console
- Network tab for API calls
- WS tab for WebSocket

### Ollama Monitoring
```bash
curl http://localhost:11434/api/tags
```

---

**Last Updated**: 2025-11-09
**Architecture Version**: 2.0
**Status**: Production Ready
