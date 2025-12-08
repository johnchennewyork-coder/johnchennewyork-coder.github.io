// Google Gemini API Service

export interface GeminiResponse {
  reasoning: string;
  tool?: string;
  toolParams?: any;
  error?: string;
}

export class GeminiAPI {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateReasoning(task: string, previousSteps: any[], availableTools: string[]): Promise<GeminiResponse> {
    try {
      const prompt = this.buildPrompt(task, previousSteps, availableTools);
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return this.parseResponse(generatedText, availableTools);
    } catch (error) {
      return {
        reasoning: `Error calling Gemini API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private buildPrompt(task: string, previousSteps: any[], availableTools: string[]): string {
    let prompt = `You are an AI agent that executes multi-step tasks. Your job is to reason about what action to take next.

Current task: "${task}"

Available tools: ${availableTools.join(', ')}

Previous steps:
`;

    if (previousSteps.length > 0) {
      previousSteps.slice(-3).forEach((step, idx) => {
        prompt += `${idx + 1}. ${step.type}: ${step.content}\n`;
        if (step.result !== undefined) {
          prompt += `   Result: ${step.result}\n`;
        }
        if (step.error) {
          prompt += `   Error: ${step.error}\n`;
        }
      });
    } else {
      prompt += 'None (this is the first step)\n';
    }

    prompt += `\nAnalyze the task and determine:
1. What tool should be used? (one of: ${availableTools.join(', ')})
2. What parameters should be passed to the tool?
3. Provide your reasoning in 1-2 sentences.

Format your response as JSON:
{
  "reasoning": "Your reasoning here",
  "tool": "tool_name",
  "toolParams": { "param1": "value1" }
}

If you cannot determine a tool, set "tool" to null and explain why in "reasoning".`;

    return prompt;
  }

  private parseResponse(text: string, availableTools: string[]): GeminiResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reasoning: parsed.reasoning || text,
          tool: parsed.tool && availableTools.includes(parsed.tool) ? parsed.tool : undefined,
          toolParams: parsed.toolParams || {}
        };
      }
      
      // Fallback: try to extract tool name from text
      const toolMatch = availableTools.find(tool => 
        text.toLowerCase().includes(tool.toLowerCase())
      );
      
      return {
        reasoning: text,
        tool: toolMatch,
        toolParams: {}
      };
    } catch (error) {
      // If parsing fails, return the raw text
      return {
        reasoning: text,
        tool: undefined,
        toolParams: {}
      };
    }
  }

  async generateRetryStrategy(failedStep: any, retryCount: number, availableTools: string[]): Promise<GeminiResponse> {
    try {
      const prompt = `A tool execution failed. Suggest a retry strategy.

Failed step:
- Tool: ${failedStep.tool}
- Parameters: ${JSON.stringify(failedStep.toolParams)}
- Error: ${failedStep.error}
- Retry attempt: ${retryCount + 1}

Available tools: ${availableTools.join(', ')}

Suggest:
1. Should we retry with the same tool? (simple_retry)
2. Try a different tool? (alternative_tool) - which one?
3. Modify the parameters? (refined_approach) - how?
4. Use a fallback approach? (fallback)

Format as JSON:
{
  "reasoning": "Your reasoning",
  "strategy": "simple_retry|alternative_tool|refined_approach|fallback",
  "tool": "tool_name_if_alternative",
  "toolParams": { "modified": "params" }
}`;

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return this.parseRetryResponse(generatedText, availableTools);
    } catch (error) {
      return {
        reasoning: `Error getting retry strategy: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseRetryResponse(text: string, availableTools: string[]): GeminiResponse {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reasoning: parsed.reasoning || text,
          tool: parsed.tool && availableTools.includes(parsed.tool) ? parsed.tool : undefined,
          toolParams: parsed.toolParams || {}
        };
      }
      
      return {
        reasoning: text,
        tool: undefined,
        toolParams: {}
      };
    } catch (error) {
      return {
        reasoning: text,
        tool: undefined,
        toolParams: {}
      };
    }
  }
}

