/**
 * Unified Ollama Provider
 * Handles all LLM interactions with streaming support
 */

import Ollama from 'ollama';
import { OLLAMA_HOST, DEFAULT_TEMPERATURE } from '../config';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export interface GenerateOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export class OllamaProvider {
  private client: Ollama;
  private host: string;

  constructor(host: string = OLLAMA_HOST) {
    this.host = host;
    this.client = new Ollama({ host });
  }

  /**
   * Generate a response from Ollama
   */
  async generate(
    messages: OllamaMessage[],
    options: GenerateOptions
  ): Promise<string> {
    const { model, temperature = DEFAULT_TEMPERATURE, maxTokens = 4096 } = options;

    console.log(`[Ollama] Generating with model: ${model}`);
    console.log(`[Ollama] Messages count: ${messages.length}`);

    try {
      const response = await this.client.chat({
        model,
        messages,
        options: {
          temperature,
          num_predict: maxTokens,
        },
        stream: false,
      });

      console.log(`[Ollama] Response generated successfully`);
      return response.message.content;
    } catch (error) {
      console.error('[Ollama] Error generating response:', error);
      throw new Error(`Ollama generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a streaming response from Ollama
   */
  async *generateStream(
    messages: OllamaMessage[],
    options: GenerateOptions
  ): AsyncGenerator<string, void, unknown> {
    const { model, temperature = DEFAULT_TEMPERATURE, maxTokens = 4096 } = options;

    console.log(`[Ollama] Starting stream with model: ${model}`);

    try {
      const stream = await this.client.chat({
        model,
        messages,
        options: {
          temperature,
          num_predict: maxTokens,
        },
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.message?.content) {
          yield chunk.message.content;
        }
      }

      console.log(`[Ollama] Stream completed successfully`);
    } catch (error) {
      console.error('[Ollama] Error in stream:', error);
      throw new Error(`Ollama streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.list();
      return response.models.map(m => m.name);
    } catch (error) {
      console.error('[Ollama] Error listing models:', error);
      return [];
    }
  }

  /**
   * Check if a model is available
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    const models = await this.listModels();
    return models.some(m => m.includes(modelName.split(':')[0]));
  }

  /**
   * Pull a model if not available
   */
  async pullModel(modelName: string): Promise<void> {
    console.log(`[Ollama] Pulling model: ${modelName}`);
    
    try {
      await this.client.pull({ model: modelName, stream: false });
      console.log(`[Ollama] Model ${modelName} pulled successfully`);
    } catch (error) {
      console.error(`[Ollama] Error pulling model ${modelName}:`, error);
      throw new Error(`Failed to pull model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get connection status
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.listModels();
      return true;
    } catch (error) {
      console.error('[Ollama] Connection check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const ollamaProvider = new OllamaProvider();
