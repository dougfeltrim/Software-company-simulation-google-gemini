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

    res.json({
      models: mappedModels,
    });
  } catch (error) {
    console.error('Failed to list models:', error);
    // Fallback to static list if Ollama is down, but maybe empty is better?
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

  // 2. Clear DB state
  const resetCount = await historyService.resetInProgressProjects();

  logger.logStatus(`[System] Reset complete. Cleared ${resetCount} stuck projects.`);
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
        const fileContext = `Project: ${name}\n\nGlobal Requirements:\n${requirements}\n\nFile Description (${file.path}): ${file.description}\n\nThis file is part of a larger project. Ensure it integrates well.`;

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
    await historyService.completeProject(
      projectId,
      generatedFiles,
      projectDir
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
