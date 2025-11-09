/**
 * Project history service
 * Manages saving and loading project history
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectHistoryEntry {
  id: string;
  name: string;
  description: string;
  model: string;
  status: 'success' | 'failed' | 'in-progress';
  createdAt: number;
  completedAt?: number;
  filesGenerated: string[];
  error?: string;
  outputPath?: string;
}

export class HistoryService {
  private historyFile: string;
  private projectsDir: string;

  constructor() {
    this.historyFile = path.join(process.cwd(), 'generated', 'history.json');
    this.projectsDir = path.join(process.cwd(), 'generated', 'projects');
  }

  /**
   * Initialize directories
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.historyFile), { recursive: true });
      await fs.mkdir(this.projectsDir, { recursive: true });
      
      // Create history file if it doesn't exist
      try {
        await fs.access(this.historyFile);
      } catch {
        await fs.writeFile(this.historyFile, JSON.stringify([], null, 2));
      }
      
      console.log('[History] Initialized successfully');
    } catch (error) {
      console.error('[History] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Add a new project to history
   */
  async addProject(
    name: string,
    description: string,
    model: string
  ): Promise<string> {
    const entry: ProjectHistoryEntry = {
      id: uuidv4(),
      name,
      description,
      model,
      status: 'in-progress',
      createdAt: Date.now(),
      filesGenerated: [],
    };

    const history = await this.loadHistory();
    history.unshift(entry);
    await this.saveHistory(history);

    console.log(`[History] Added project: ${name} (${entry.id})`);
    return entry.id;
  }

  /**
   * Update project status
   */
  async updateProject(
    id: string,
    updates: Partial<ProjectHistoryEntry>
  ): Promise<void> {
    const history = await this.loadHistory();
    const index = history.findIndex(p => p.id === id);

    if (index === -1) {
      throw new Error(`Project not found: ${id}`);
    }

    history[index] = { ...history[index], ...updates };
    await this.saveHistory(history);

    console.log(`[History] Updated project: ${id}`);
  }

  /**
   * Mark project as completed
   */
  async completeProject(
    id: string,
    filesGenerated: string[],
    outputPath: string
  ): Promise<void> {
    await this.updateProject(id, {
      status: 'success',
      completedAt: Date.now(),
      filesGenerated,
      outputPath,
    });
  }

  /**
   * Mark project as failed
   */
  async failProject(id: string, error: string): Promise<void> {
    await this.updateProject(id, {
      status: 'failed',
      completedAt: Date.now(),
      error,
    });
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<ProjectHistoryEntry[]> {
    return await this.loadHistory();
  }

  /**
   * Get a specific project
   */
  async getProject(id: string): Promise<ProjectHistoryEntry | null> {
    const history = await this.loadHistory();
    return history.find(p => p.id === id) || null;
  }

  /**
   * Get recent projects
   */
  async getRecentProjects(count: number = 10): Promise<ProjectHistoryEntry[]> {
    const history = await this.loadHistory();
    return history.slice(0, count);
  }

  /**
   * Delete a project from history
   */
  async deleteProject(id: string): Promise<void> {
    const history = await this.loadHistory();
    const filtered = history.filter(p => p.id !== id);
    await this.saveHistory(filtered);

    // Try to delete project directory
    const project = history.find(p => p.id === id);
    if (project?.outputPath) {
      try {
        await fs.rm(project.outputPath, { recursive: true, force: true });
        console.log(`[History] Deleted project directory: ${project.outputPath}`);
      } catch (error) {
        console.error('[History] Failed to delete project directory:', error);
      }
    }

    console.log(`[History] Deleted project: ${id}`);
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    await this.saveHistory([]);
    console.log('[History] Cleared all history');
  }

  /**
   * Load history from file
   */
  private async loadHistory(): Promise<ProjectHistoryEntry[]> {
    try {
      const data = await fs.readFile(this.historyFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[History] Failed to load history:', error);
      return [];
    }
  }

  /**
   * Save history to file
   */
  private async saveHistory(history: ProjectHistoryEntry[]): Promise<void> {
    try {
      await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('[History] Failed to save history:', error);
      throw error;
    }
  }

  /**
   * Get project output directory
   */
  getProjectDir(projectId: string): string {
    return path.join(this.projectsDir, projectId);
  }
}

// Export singleton instance
export const historyService = new HistoryService();
