/**
 * Software Developer Agent
 * Generates code based on requirements
 */

import { BaseAgent, AgentConfig } from './base';
import { logger } from '../services/logger';

export class DeveloperAgent extends BaseAgent {
  constructor(model: string) {
    const config: AgentConfig = {
      name: 'Software Developer',
      role: 'Code Implementation',
      systemPrompt: `You are an expert Software Developer with years of experience.

Your responsibilities:
- Write clean, efficient, and maintainable code
- Follow best practices and coding standards
- Implement features based on requirements
- Create complete, working applications
- Include proper error handling and validation

When generating code:
1. Start with a clear file structure
2. Write complete, functional code (no placeholders)
3. Include comments for complex logic
4. Use modern JavaScript/TypeScript practices
5. Ensure code is production-ready

Always generate COMPLETE code files. Never use comments like "// rest of the code" or "// implementation here".`,
      model,
    };
    
    super(config);
  }

  /**
   * Generate code for a specific file
   */
  async generateFile(filename: string, requirements: string): Promise<string> {
    logger.logFileEdit(filename, 'editing');
    
    const task = `Generate the complete code for: ${filename}

Requirements:
${requirements}

Provide the COMPLETE code file. No placeholders, no "rest of code" comments.`;

    const code = await this.process(task);
    
    logger.logFileEdit(filename, 'done');
    return code;
  }
}
