/**
 * Configuration for Ollama integration
 * Only uses Ollama local instance - no OpenAI, Anthropic, or Google
 */

export interface ModelConfig {
  name: string;
  displayName: string;
  category: 'code' | 'thinking' | 'common';
  description: string;
  maxTokens: number;
}

export const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
export const PORT = process.env.PORT || 3001;

/**
 * List of 10 real Ollama models (up to 14B parameters)
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  // Code Models
  {
    name: 'deepseek-coder:6.7b',
    displayName: 'DeepSeek Coder 6.7B',
    category: 'code',
    description: 'Specialized in code generation and understanding',
    maxTokens: 4096,
  },
  {
    name: 'codellama:13b',
    displayName: 'Code Llama 13B',
    category: 'code',
    description: 'Meta\'s code-focused model, excellent for development',
    maxTokens: 4096,
  },
  {
    name: 'phind-codellama:34b-v2',
    displayName: 'Phind CodeLlama 34B',
    category: 'code',
    description: 'Enhanced CodeLlama for complex coding tasks',
    maxTokens: 4096,
  },
  // Thinking Models
  {
    name: 'deepseek-r1:7b',
    displayName: 'DeepSeek R1 7B',
    category: 'thinking',
    description: 'Advanced reasoning and problem-solving',
    maxTokens: 4096,
  },
  {
    name: 'qwen2.5:14b',
    displayName: 'Qwen 2.5 14B',
    category: 'thinking',
    description: 'Strong analytical and reasoning capabilities',
    maxTokens: 4096,
  },
  // Common Models
  {
    name: 'llama3.1:8b',
    displayName: 'Llama 3.1 8B',
    category: 'common',
    description: 'Balanced general-purpose model',
    maxTokens: 4096,
  },
  {
    name: 'mistral:7b',
    displayName: 'Mistral 7B',
    category: 'common',
    description: 'Fast and efficient general model',
    maxTokens: 4096,
  },
  {
    name: 'gemma2:9b',
    displayName: 'Gemma 2 9B',
    category: 'common',
    description: 'Google\'s efficient open model',
    maxTokens: 4096,
  },
  {
    name: 'phi3:14b',
    displayName: 'Phi-3 14B',
    category: 'common',
    description: 'Microsoft\'s compact powerful model',
    maxTokens: 4096,
  },
  {
    name: 'neural-chat:7b',
    displayName: 'Neural Chat 7B',
    category: 'common',
    description: 'Optimized for conversational tasks',
    maxTokens: 4096,
  },
];

export const DEFAULT_MODEL = 'llama3.1:8b';
export const DEFAULT_TEMPERATURE = 0.7;

export function getModelByName(modelName: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find(m => m.name === modelName);
}

export function getModelsByCategory(category: 'code' | 'thinking' | 'common'): ModelConfig[] {
  return AVAILABLE_MODELS.filter(m => m.category === category);
}
