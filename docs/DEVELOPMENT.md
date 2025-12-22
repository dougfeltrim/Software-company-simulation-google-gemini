# 🛠️ Development Guide

This guide provides detailed information for developers working on the AI Software Company project.

## Project Structure

```
/
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── config.ts            # Configuration (Ollama models)
│   │   │   ├── providers/
│   │   │   │   └── ollama.ts        # Ollama provider (streaming support)
│   │   │   ├── services/
│   │   │   │   ├── logger.ts        # Real-time logging (WebSocket)
│   │   │   │   └── history.ts       # Project history management
│   │   │   └── agents/
│   │   │       ├── base.ts          # Base agent class
│   │   │       ├── product-manager.ts
│   │   │       └── developer.ts
│   │   └── index.ts                 # Express server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js 14 frontend
│   ├── app/
│   │   ├── page.tsx                 # Main page (split-screen UI)
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css              # Global styles
│   ├── components/
│   │   ├── RealtimeLogs.tsx         # Real-time log viewer
│   │   └── ProjectHistory.tsx       # Project history panel
│   ├── package.json
│   └── tsconfig.json
├── generated/                # Generated projects (gitignored)
├── package.json              # Root package (workspaces)
├── .env.example              # Environment variables example
└── README.md                 # User documentation
```

## Prerequisites

### Required Software

1. **Node.js 18+** and npm 9+
   ```bash
   node --version  # should be >= 18.0.0
   npm --version   # should be >= 9.0.0
   ```

2. **Ollama**
   - macOS: `brew install ollama`
   - Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
   - Windows: Download from https://ollama.ai/download

3. **At least one Ollama model**
   ```bash
   ollama pull gemma3:4b
   ```

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/dougfeltrim/Software-company-simulation-google-gemini.git
cd Software-company-simulation-google-gemini
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if needed:
```env
OLLAMA_HOST=http://localhost:11434
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 3. Start Ollama

```bash
ollama serve
```

Keep this running in a separate terminal.

### 4. Start Development Servers

```bash
npm run dev
```

This starts:
- Backend on http://localhost:3001
- Frontend on http://localhost:3000

## Development Workflow

### Backend Development

The backend is an Express.js server with TypeScript.

#### Start backend only
```bash
npm run dev:backend
```

#### Build backend
```bash
npm run build:backend
```

#### Type check backend
```bash
cd backend
npm run type-check
```

#### Adding a new agent

1. Create file in `backend/src/lib/agents/`
2. Extend `BaseAgent` class
3. Define system prompt
4. Export the agent

Example:
```typescript
import { BaseAgent, AgentConfig } from './base';

export class MyAgent extends BaseAgent {
  constructor(model: string) {
    const config: AgentConfig = {
      name: 'My Agent',
      role: 'My Role',
      systemPrompt: 'You are an expert...',
      model,
    };
    super(config);
  }
}
```

#### Adding a new endpoint

Edit `backend/src/index.ts`:
```typescript
app.get('/api/my-endpoint', async (req: Request, res: Response) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});
```

### Frontend Development

The frontend is built with Next.js 14 and React.

#### Start frontend only
```bash
npm run dev:frontend
```

#### Build frontend
```bash
npm run build:frontend
```

#### Adding a new component

1. Create file in `frontend/components/`
2. Use TypeScript and React hooks
3. Style with Tailwind CSS

Example:
```tsx
'use client'

import { useState } from 'react'

export function MyComponent() {
  const [value, setValue] = useState('')
  
  return (
    <div className="p-4">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border rounded px-2 py-1"
      />
    </div>
  )
}
```

#### Connecting to backend API

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const response = await fetch(`${apiUrl}/api/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'value' }),
})

const result = await response.json()
```

#### WebSocket connection

```typescript
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
const ws = new WebSocket(`${wsUrl}/ws`)

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Received:', data)
}
```

## Building for Production

### Build all
```bash
npm run build
```

This compiles:
- Backend to `backend/dist/`
- Frontend to `frontend/.next/`

### Start production server
```bash
npm start
```

## Testing

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Code Style

### TypeScript
- Use strict type checking
- Avoid `any` type
- Prefer interfaces over types
- Use async/await over promises

### React/Next.js
- Use functional components
- Use hooks for state management
- Mark client components with `'use client'`
- Use Tailwind CSS for styling

### Backend
- Use Express.js patterns
- Handle errors properly
- Add console.log for debugging
- Use WebSocket for real-time updates

## Common Tasks

### Adding a new model to the list

Edit `backend/src/lib/config.ts`:
```typescript
export const AVAILABLE_MODELS: ModelConfig[] = [
  // ... existing models
  {
    name: 'new-model:7b',
    displayName: 'New Model 7B',
    category: 'common',
    description: 'Description here',
    maxTokens: 4096,
  },
]
```

### Changing log messages

Edit `backend/src/lib/services/logger.ts` to modify how logs are emitted.

### Customizing the UI

Edit files in `frontend/`:
- `app/page.tsx` - Main page layout
- `components/` - Individual components
- `app/globals.css` - Global styles

## Debugging

### Backend logs
The backend logs to console. Check the terminal where `npm run dev:backend` is running.

### Frontend logs
Open browser DevTools (F12) and check the Console tab.

### WebSocket issues
Check browser DevTools → Network tab → WS filter to see WebSocket connections.

### Ollama connection
```bash
curl http://localhost:11434/api/tags
```

Should return a list of installed models.

## Troubleshooting

### "Cannot find module 'ollama'"
```bash
cd backend
npm install
```

### "Port 3000 already in use"
Change port in frontend:
```bash
cd frontend
npm run dev -- -p 3002
```

### "WebSocket connection failed"
- Ensure backend is running
- Check NEXT_PUBLIC_WS_URL in .env
- Verify no firewall blocking

### "Model not found"
```bash
ollama pull gemma3:4b
```

## Architecture

### Backend Architecture
- **Express.js** - Web server framework
- **WebSocket (ws)** - Real-time communication
- **Ollama client** - LLM integration
- **File system** - Project and history storage

### Frontend Architecture
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS
- **Sonner** - Toast notifications
- **Lucide React** - Icons

### Data Flow
1. User submits form → Frontend sends POST to `/api/generate`
2. Backend creates project entry → Starts generation async
3. Backend emits logs → WebSocket broadcasts to frontend
4. Frontend receives logs → Updates UI in real-time
5. Backend completes → Saves files and updates history
6. Frontend polls history → Shows updated status

## Performance

### Backend
- Streams responses from Ollama when possible
- Runs project generation async (non-blocking)
- Keeps WebSocket connections alive

### Frontend
- Static generation for pages
- Client-side state management
- Efficient re-renders with React

## Security Notes

- Backend doesn't expose sensitive data
- File system access limited to `generated/` directory
- WebSocket only sends logs, no sensitive info
- No authentication required (local use only)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

MIT License - see LICENSE file for details.
