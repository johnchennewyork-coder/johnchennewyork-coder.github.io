// Web Search Tool (Mock Implementation)

import { Tool, ToolResult } from './base';

export class WebSearchTool implements Tool {
  name = 'web_search';
  description = 'Searches the web for information (mock implementation - returns simulated results)';

  private mockResults: Record<string, string> = {
    'weather': 'The weather today is sunny with a temperature of 72°F.',
    'news': 'Latest news: Technology advances in AI continue to accelerate.',
    'time': `Current time: ${new Date().toLocaleString()}`,
    'default': 'Search results: This is a mock implementation. In a real system, this would query a search API.'
  };

  async execute(params: { query: string }): Promise<ToolResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const query = params.query.toLowerCase();
    let result = this.mockResults['default'];
    
    // Simple keyword matching for mock results
    for (const [key, value] of Object.entries(this.mockResults)) {
      if (query.includes(key)) {
        result = value;
        break;
      }
    }
    
    return {
      success: true,
      result: result,
      metadata: {
        query: params.query,
        source: 'mock'
      }
    };
  }
}

