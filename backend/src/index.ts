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
app.get('/api/models', async (req: Request, res: Response) => {
  try {
    const realModels = await ollamaProvider.listModels();

    // Map real models to config, using defaults for unknown ones
    const mappedModels = realModels.map(modelName => {
      const knownConfig = AVAILABLE_MODELS.find(m => m.name === modelName);
      if (knownConfig) {
        return knownConfig;
      }

      // Generic config for unknown models
      return {
        name: modelName,
        displayName: modelName,
        category: 'common',
        description: 'Local Ollama Model',
        maxTokens: 4096,
      };
    });

    res.json({ models: mappedModels });
  } catch (error) {
    console.error('Failed to fetch models:', error);
    // The user requirement implies strictly showing what is online. 
    // If we fail to fetch, we probably show nothing or an error.
    res.status(500).json({ error: 'Failed to fetch models from Ollama' });
  }
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

// Get project file content
app.get('/api/history/:id/file', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { path: filePath } = req.query;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'Missing file path' });
    }

    const project = await historyService.getProject(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectDir = await historyService.getProjectDir(id);
    const fullPath = path.join(projectDir, filePath);

    // Security check to prevent directory traversal
    if (!fullPath.startsWith(projectDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ content });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to read file'
    });
  }
});

// Track active cancellations
const activeCancellations = new Set<string>();
const activeProjects = new Set<string>(); // Track running projects

// New Endpoints

// Helper to add IDs to activeProjects
// See generateProject modification below

app.post('/api/stop-all', (req, res) => {
  const count = activeProjects.size;
  if (count === 0) {
    return res.json({ message: 'No active projects to stop', count: 0 });
  }

  // Mark all active projects for cancellation
  for (const projectId of activeProjects) {
    activeCancellations.add(projectId);
  }

  logger.logStatus(`[System] Stopping all ${count} active projects...`);
  res.json({ message: 'Stop signal sent to all active projects', count });
});

app.post('/api/reset', async (req, res) => {
  logger.logStatus('[System] Performing system reset...');

  // 1. Clear internal state
  activeProjects.clear();
  activeCancellations.clear();
  logger.clearLogs();

  // 2. Reset history status if needed
  // We can't easily "un-save" files, but we can mark in-progress tasks as failed in history.json
  const resetCount = await historyService.resetInProgressProjects();

  logger.logStatus(`[System] Reset complete. ${resetCount} in-progress projects marked as failed.`);
  res.json({ message: 'System reset active', resetCount });
});

// Stop project generation
app.post('/api/stop', (req: Request, res: Response) => {
  const { projectId } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'Missing projectId' });
  }

  activeCancellations.add(projectId);
  logger.logStatus('Stopping project generation...');
  res.json({ success: true });
});

// CrewAI Service URL
const CREWAI_SERVICE_URL = process.env.CREWAI_SERVICE_URL || 'http://localhost:3002';

// Check CrewAI service availability
app.get('/api/crewai/health', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${CREWAI_SERVICE_URL}/health`);
    const data = await response.json() as { status: string };
    res.json({ available: true, status: data.status });
  } catch (error) {
    res.json({ available: false, error: 'CrewAI service not running' });
  }
});

// Generate project using LangGraph (Multi-Agent)
app.post('/api/generate-crewai', async (req: Request, res: Response) => {
  const { description, model, name } = req.body;

  if (!description) {
    return res.status(400).json({
      error: 'Missing required field: description'
    });
  }

  let projectName = name || `LangGraph-Project-${Date.now()}`;
  // Sanitize for Windows (remove colons, etc)
  projectName = projectName.replace(/[:"<>|?*]/g, '-').replace(/[\/\\]/g, '-');

  try {
    logger.clearLogs();
    logger.logStatus(`🤖 Starting LangGraph generation: ${projectName}`);

    // Create project in history
    const projectId = await historyService.addProject(
      projectName,
      description,
      model || 'langgraph'
    );

    activeProjects.add(projectId);

    // Start generation in background (don't wait)
    generateWithLangGraph(projectId, projectName, description, model)
      .catch(error => {
        console.error('LangGraph generation failed:', error);
        historyService.failProject(
          projectId,
          error instanceof Error ? error.message : 'Unknown error'
        );
      });

    res.json({
      projectId,
      message: 'LangGraph project generation started',
      name: projectName,
    });

  } catch (error) {
    logger.logError('LangGraph generation failed', error as Error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'LangGraph generation failed'
    });
  }
});

/**
 * Generate project using LangGraph service (async function)
 */
async function generateWithLangGraph(
  projectId: string,
  name: string,
  description: string,
  model: string
): Promise<void> {
  try {
    // Check for cancellation
    if (activeCancellations.has(projectId)) throw new Error('Stopped by user');

    logger.logProgress('Connecting to LangGraph service...', 5);

    // Call LangGraph service
    const response = await fetch(`${CREWAI_SERVICE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, model })
    });

    if (!response.ok) {
      throw new Error(`LangGraph service error: ${response.statusText}`);
    }

    const result = await response.json() as { files: Array<{ path: string; content: string }> };

    // Check for cancellation
    if (activeCancellations.has(projectId)) throw new Error('Stopped by user');

    // Save generated files
    const projectDir = await historyService.getProjectDir(projectId);
    await fs.mkdir(projectDir, { recursive: true });

    const filesGenerated: string[] = [];

    for (const file of result.files) {
      if (activeCancellations.has(projectId)) throw new Error('Stopped by user');

      const fullPath = path.join(projectDir, file.path);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content);
      filesGenerated.push(file.path);
      logger.logStatus(`✅ Saved: ${file.path}`);
    }

    // Complete project
    const projectLogs = logger.getRecentLogs(1000).map(l => l.message || '').filter(Boolean);
    await historyService.completeProject(projectId, filesGenerated, projectDir, projectLogs);
    logger.logProgress(`🎉 Project completed with ${filesGenerated.length} files!`, 100);
    logger.logStatus(`✅ LangGraph project "${name}" completed successfully`);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.logError(`LangGraph project "${name}" failed: ${message}`);
    await historyService.failProject(projectId, message);
  } finally {
    activeProjects.delete(projectId);
    activeCancellations.delete(projectId);
  }
}

// Generate project endpoint
app.post('/api/generate', async (req: Request, res: Response) => {
  const { description, model, name } = req.body;

  if (!description || !model) {
    return res.status(400).json({
      error: 'Missing required fields: description and model'
    });
  }

  let projectName = name || `Project-${Date.now()}`;
  // Sanitize
  projectName = projectName.replace(/[:"<>|?*]/g, '-').replace(/[\/\\]/g, '-');


  try {
    logger.clearLogs(); // Clear previous logs
    logger.logStatus(`Starting project: ${projectName}`);

    // Create project in history
    const projectId = await historyService.addProject(
      projectName,
      description,
      model
    );

    activeCancellations.delete(projectId); // Ensure fresh start

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
    activeProjects.add(projectId);
    if (activeCancellations.has(projectId)) throw new Error('Stopped by user');
    logger.logProgress('Initializing agents...', 5);

    // Create agents
    const pm = new ProductManagerAgent(model);
    const dev = new DeveloperAgent(model);

    // Step 1: Product Manager defines requirements
    if (activeCancellations.has(projectId)) throw new Error('Stopped by user');
    logger.logProgress('Product Manager analyzing requirements...', 10);
    const requirements = await pm.process(
      `Analyze this project request and create detailed requirements:\n\n${description}`
    );

    // Step 2: Product Manager plans file structure
    if (activeCancellations.has(projectId)) throw new Error('Stopped by user');
    logger.logProgress('Planning project structure...', 20);
    const filesToCreate = await pm.planStructure(requirements);

    logger.logStatus(`Planned ${filesToCreate.length} files`);

    // Save files
    const projectDir = await historyService.getProjectDir(projectId);
    await fs.mkdir(projectDir, { recursive: true });

    // Step 3: Developer generates code for each file
    const generatedFiles = [];
    let completedFiles = 0;

    // Always create requirements.md first
    const reqPath = path.join(projectDir, 'requirements.md');
    await fs.writeFile(reqPath, requirements);
    generatedFiles.push('requirements.md');

    if (activeCancellations.has(projectId)) throw new Error('Stopped by user');

    for (const file of filesToCreate) {
      if (activeCancellations.has(projectId)) throw new Error('Stopped by user');

      const progress = 30 + Math.floor((completedFiles / filesToCreate.length) * 60);
      logger.logProgress(`Generating ${file.path}...`, progress);

      try {
        const fileContext = `
Project Name: ${name}
Project Description: ${description}
Requirements:
${requirements}

Current File: ${file.path}
File Purpose: ${file.purpose}
        `;

        const content = await dev.generateFile(file.path, fileContext);

        // Ensure directory exists for nested files
        const fullPath = path.join(projectDir, file.path);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);

        generatedFiles.push(file.path);
      } catch (err) {
        logger.logError(`Failed to generate ${file.path}`, err as Error);
      }

      completedFiles++;
    }

    // specific handling for README if not generated
    if (!generatedFiles.some(f => f.toLowerCase().includes('readme'))) {
      const readmeContent = `# ${name}\n\n${description}\n\n## Generated Files\n\n${generatedFiles.map(f => `- ${f}`).join('\n')}`;
      await fs.writeFile(path.join(projectDir, 'README.md'), readmeContent);
      generatedFiles.push('README.md');
    }

    // Complete project
    const projectLogs = logger.getRecentLogs(1000).map(l => l.message || '').filter(Boolean);
    await historyService.completeProject(
      projectId,
      generatedFiles,
      projectDir,
      projectLogs
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.logProgress(`Project completed in ${duration}s`, 100);
    logger.logStatus(`✅ Project "${name}" completed successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.logError(`Project "${name}" failed: ${message}`); // Don't pass full error obj if just string

    await historyService.failProject(
      projectId,
      message
    );
  } finally {
    activeCancellations.delete(projectId);
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
