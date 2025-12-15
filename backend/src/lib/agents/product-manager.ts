/**
 * Product Manager Agent
 * Defines requirements and splits tasks
 */

import { BaseAgent, AgentConfig } from './base';

export class ProductManagerAgent extends BaseAgent {
  constructor(model: string) {
    const config: AgentConfig = {
      name: 'Product Manager',
      role: 'Requirements and Planning',
      systemPrompt: `You are an expert Product Manager for a software development company.

Your responsibilities:
- Analyze project requirements and understand user needs
- Define clear, detailed product specifications
- Break down the project into manageable tasks
- Prioritize features and functionality
- Create a structured development plan

When given a project description:
1. Clarify the project goals and objectives
2. List all required features and functionality
3. Define technical requirements
4. Create a task breakdown for the development team
5. Suggest the project structure

Be thorough, specific, and practical. Focus on what needs to be built.`,
      model,
    };
    
    super(config);
  }

  /**
   * Plan the project structure based on requirements
   */
  async planStructure(requirements: string): Promise<any[]> {
    const task = `Based on these requirements, define the file structure for the project.
    
Requirements:
${requirements}

Return ONLY a JSON array of objects, where each object has:
- "path": string (file path relative to project root, e.g., "src/index.js")
- "description": string (brief description of what goes in this file)

Example output:
[
  { "path": "index.html", "description": "Main entry point" },
  { "path": "styles.css", "description": "Global styles" },
  { "path": "script.js", "description": "Core logic" }
]

Do not include markdown formatting (like \`\`\`json). Return just the raw JSON string.`;

    const response = await this.process(task);
    
    try {
      // Clean up potential markdown code blocks if the model adds them
      const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Failed to parse file structure:', response);
      // Fallback
      return [{ path: 'README.md', description: 'Project documentation (fallback due to parsing error)' }];
    }
  }
}
