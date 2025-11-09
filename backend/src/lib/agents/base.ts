/**
 * Base Agent class
 * All agents extend this class
 */

import { ollamaProvider, OllamaMessage } from '../providers/ollama';
import { logger } from '../services/logger';

export interface AgentConfig {
  name: string;
  role: string;
  systemPrompt: string;
  model: string;
}

export class BaseAgent {
  protected name: string;
  protected role: string;
  protected systemPrompt: string;
  protected model: string;
  protected conversationHistory: OllamaMessage[] = [];

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.role = config.role;
    this.systemPrompt = config.systemPrompt;
    this.model = config.model;
    
    // Initialize with system prompt
    this.conversationHistory.push({
      role: 'system',
      content: this.systemPrompt,
    });
  }

  /**
   * Process a task and return response
   */
  async process(task: string): Promise<string> {
    logger.logStatus(`${this.name} is processing task...`);
    
    // Add user message
    this.conversationHistory.push({
      role: 'user',
      content: task,
    });

    try {
      // Generate response
      const response = await ollamaProvider.generate(
        this.conversationHistory,
        { model: this.model }
      );

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
      });

      logger.logStatus(`${this.name} completed task`);
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.logError(`${this.name} failed`, error as Error);
      throw new Error(`Agent ${this.name} failed: ${errorMsg}`);
    }
  }

  /**
   * Clear conversation history (keeping system prompt)
   */
  clearHistory(): void {
    this.conversationHistory = [this.conversationHistory[0]];
  }

  /**
   * Get agent info
   */
  getInfo(): { name: string; role: string } {
    return {
      name: this.name,
      role: this.role,
    };
  }
}
