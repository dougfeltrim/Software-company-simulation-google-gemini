/**
 * Backend API Server
 * Main entry point for the backend
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

import { PORT, AVAILABLE_MODELS, OLLAMA_HOST } from './lib/config';
import { ollamaProvider } from './lib/providers/ollama';
import { logger } from './lib/services/logger';
import { historyService } from './lib/services/history';
import { ProductManagerAgent } from './lib/agents/product-manager';
import { DeveloperAgent } from './lib/agents/developer';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  logger.addClient(ws);
});

// Initialize services
historyService.init().catch(console.error);

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  const ollamaConnected = await ollamaProvider.checkConnection();
  
  res.json({
    status: 'ok',
    ollama: {
      connected: ollamaConnected,
      host: OLLAMA_HOST,
    },
    clients: logger.getClientCount(),
  });
});

// Get available models
app.get('/api/models', (req: Request, res: Response) => {
  res.json({
    models: AVAILABLE_MODELS,
  });
});

// Get project history
app.get('/api/history', async (req: Request, res: Response) => {
  try {
    const projects = await historyService.getProjects();
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to load history' 
    });
  }
});

// Get specific project
app.get('/api/history/:id', async (req: Request, res: Response) => {
  try {
    const project = await historyService.getProject(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ project });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to load project' 
    });
  }
});

// Delete project from history
app.delete('/api/history/:id', async (req: Request, res: Response) => {
  try {
    await historyService.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete project' 
    });
  }
});

// Generate project endpoint
app.post('/api/generate', async (req: Request, res: Response) => {
  const { description, model, name } = req.body;

  if (!description || !model) {
    return res.status(400).json({ 
      error: 'Missing required fields: description and model' 
    });
  }

  const projectName = name || `Project-${Date.now()}`;
  
  try {
    logger.logStatus(`Starting project: ${projectName}`);
    
    // Create project in history
    const projectId = await historyService.addProject(
      projectName,
      description,
      model
    );

    // Start project generation (don't wait)
    generateProject(projectId, projectName, description, model)
      .catch(error => {
        console.error('Project generation failed:', error);
        historyService.failProject(
          projectId, 
          error instanceof Error ? error.message : 'Unknown error'
        );
      });

    res.json({ 
      projectId,
      message: 'Project generation started',
      name: projectName,
    });
  } catch (error) {
    logger.logError('Failed to start project', error as Error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to start project' 
    });
  }
});

/**
 * Generate project (async function)
 */
async function generateProject(
  projectId: string,
  name: string,
  description: string,
  model: string
): Promise<void> {
  const startTime = Date.now();
  
  try {
    logger.logProgress('Initializing agents...', 10);
    
    // Create agents
    const pm = new ProductManagerAgent(model);
    const dev = new DeveloperAgent(model);

    // Step 1: Product Manager defines requirements
    logger.logProgress('Product Manager analyzing requirements...', 20);
    const requirements = await pm.process(
      `Analyze this project request and create detailed requirements:\n\n${description}`
    );

    // Step 2: Developer generates code
    logger.logProgress('Developer generating code...', 50);
    const code = await dev.generateFile(
      'main.js',
      `Project: ${name}\n\nRequirements:\n${requirements}`
    );

    // Save files
    logger.logProgress('Saving files...', 80);
    const projectDir = historyService.getProjectDir(projectId);
    await fs.mkdir(projectDir, { recursive: true });

    const files = [
      { name: 'requirements.md', content: requirements },
      { name: 'main.js', content: code },
      { name: 'README.md', content: `# ${name}\n\n${description}\n\n## Generated Files\n\n- requirements.md\n- main.js` },
    ];

    for (const file of files) {
      const filePath = path.join(projectDir, file.name);
      await fs.writeFile(filePath, file.content);
    }

    // Complete project
    await historyService.completeProject(
      projectId,
      files.map(f => f.name),
      projectDir
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.logProgress(`Project completed in ${duration}s`, 100);
    logger.logStatus(`✅ Project "${name}" completed successfully`);
  } catch (error) {
    logger.logError(`Project "${name}" failed`, error as Error);
    await historyService.failProject(
      projectId,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   AI Software Company - Backend        ║
║   Port: ${PORT}                           ║
║   Ollama: ${OLLAMA_HOST}  ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
