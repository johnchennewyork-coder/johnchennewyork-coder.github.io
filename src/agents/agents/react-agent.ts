// ReAct Agent - Reasoning and Acting

import { Agent, AgentStep, RetryStrategy } from './base';
import { AgentMemoryManager } from '../memory/agent-memory';
import { Tool, ToolRegistry } from '../tools/base';
import { CalculatorTool } from '../tools/calculator';
import { WebSearchTool } from '../tools/web-search';
import { CodeExecutorTool } from '../tools/code-executor';
import { GeminiAPI } from '../services/gemini-api';

export class ReActAgent implements Agent {
  name: string;
  type = 'react';
  private memory: AgentMemoryManager;
  private tools: Tool[] = [];
  private toolRegistry: ToolRegistry;
  private maxRetries = 3;
  private geminiAPI?: GeminiAPI;
  private useLLM: boolean = false;

  constructor(name: string, availableTools: string[] = [], apiKey?: string) {
    this.name = name;
    this.memory = new AgentMemoryManager();
    this.toolRegistry = new ToolRegistry();
    
    // Register all tools
    this.toolRegistry.register(new CalculatorTool());
    this.toolRegistry.register(new WebSearchTool());
    this.toolRegistry.register(new CodeExecutorTool());
    
    // Select tools based on availability
    availableTools.forEach(toolName => {
      const tool = this.toolRegistry.get(toolName);
      if (tool) {
        this.tools.push(tool);
      }
    });
    
    // Default to calculator if no tools selected
    if (this.tools.length === 0) {
      this.tools.push(this.toolRegistry.get('calculator')!);
    }
    
    // Initialize Gemini API if API key is provided
    if (apiKey && apiKey.trim().length > 0) {
      this.geminiAPI = new GeminiAPI(apiKey.trim());
      this.useLLM = true;
    }
  }

  getAvailableTools(): Tool[] {
    return [...this.tools];
  }

  async execute(task: string): Promise<AgentStep[]> {
    this.memory.addMessage('user', task);
    
    // Parse multi-step task
    const taskSteps = this.parseMultiStepTask(task);
    const steps: AgentStep[] = [];
    let lastResult: any = null;
    
    for (let i = 0; i < taskSteps.length; i++) {
      const currentTask = taskSteps[i];
      let attemptCount = 0;
      const maxAttempts = 5;
      let stepCompleted = false;
      
      while (attemptCount < maxAttempts && !stepCompleted) {
        attemptCount++;
        
        // Replace placeholders in task with previous results
        const taskWithContext = this.injectContext(currentTask, lastResult, i);
        
      // Step 1: Reasoning
      const reasoningStep = await this.reason(taskWithContext, steps);
      steps.push(reasoningStep);
      
      // Step 2: Action
      const actionStep = await this.act(reasoningStep);
      steps.push(actionStep);
      
      // Step 3: Observation
      if (actionStep.result !== undefined) {
        const observationStep = this.observe(actionStep);
        steps.push(observationStep);
          
          // Update memory
          this.memory.addMessage('agent', `Step ${i + 1}/${taskSteps.length}: Executed ${actionStep.tool} with result: ${actionStep.result}`);
          this.memory.addIntermediateResult(actionStep.result);
          this.memory.addFact(`step_${i + 1}_result`, actionStep.result, actionStep.tool);
          
          lastResult = actionStep.result;
          stepCompleted = true;
        } else if (actionStep.error) {
        // Handle error with retry
        const retryStep = await this.handleRetry(actionStep, steps);
        if (retryStep) {
          steps.push(retryStep);
            
            if (retryStep.type === 'retry' && retryStep.result !== undefined) {
              // Retry succeeded
              this.memory.addMessage('agent', `Step ${i + 1}: Retry succeeded: ${retryStep.result}`);
              this.memory.addIntermediateResult(retryStep.result);
              this.memory.addFact(`step_${i + 1}_result`, retryStep.result, retryStep.tool);
              lastResult = retryStep.result;
              stepCompleted = true;
            } else {
              // Retry failed, try again
              continue;
            }
          } else {
            // No more retry strategies
            this.memory.addMessage('agent', `Step ${i + 1} failed after retries: ${actionStep.error}`);
            break;
          }
        }
      }
      
      if (!stepCompleted) {
        break; // Stop if a step failed completely
      }
    }
    
    if (lastResult !== null) {
      this.memory.addMessage('agent', `Task completed. Final result: ${lastResult}`);
    }
    
    return steps;
  }
  
  private parseMultiStepTask(task: string): string[] {
    // Split task by common connectors: "then", "and", "finally", ","
    const connectors = /,\s*(?:then|and|finally)\s+/i;
    const parts = task.split(connectors);
    
    // If no connectors found, try simpler patterns
    if (parts.length === 1) {
      // Try "then" or "and" without comma
      const simpleSplit = task.split(/\s+(?:then|and|finally)\s+/i);
      if (simpleSplit.length > 1) {
        return simpleSplit;
      }
      // Single step
      return [task];
    }
    
    return parts;
  }
  
  private injectContext(task: string, previousResult: any, stepIndex: number): string {
    // Replace "the result" or "it" with actual previous result
    if (previousResult !== null && previousResult !== undefined) {
      task = task.replace(/\b(the result|it|previous result)\b/gi, String(previousResult));
      task = task.replace(/\bresult\b/gi, String(previousResult));
    }
    
    // Also check memory for step results
    const prevStepResult = this.memory.getFact(`step_${stepIndex}_result`);
    if (prevStepResult !== undefined) {
      task = task.replace(/\b(previous step|last step)\b/gi, String(prevStepResult));
    }
    
    return task;
  }

  private async reason(task: string, previousSteps: AgentStep[]): Promise<AgentStep> {
    const stepId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use LLM if available, otherwise use rule-based reasoning
    if (this.useLLM && this.geminiAPI) {
      try {
        const availableToolNames = this.tools.map(t => t.name);
        const geminiResponse = await this.geminiAPI.generateReasoning(
          task,
          previousSteps,
          availableToolNames
        );
        
        return {
          stepId,
          timestamp: Date.now(),
          type: 'reasoning',
          content: geminiResponse.reasoning || `Analyzing task: "${task}"`,
          tool: geminiResponse.tool,
          toolParams: geminiResponse.toolParams
        };
      } catch (error) {
        // Fall back to rule-based if LLM fails
        console.warn('LLM reasoning failed, falling back to rule-based:', error);
        return this.ruleBasedReason(task, previousSteps, stepId);
      }
    } else {
      return this.ruleBasedReason(task, previousSteps, stepId);
    }
  }
  
  private ruleBasedReason(task: string, previousSteps: AgentStep[], stepId: string): AgentStep {
    // Simple reasoning: identify what tool to use and what operation to perform
    let reasoning = `Analyzing task: "${task}"\n`;
    
    // Check if we need a calculation
    if (this.needsCalculation(task)) {
      reasoning += 'I need to perform a calculation. I will use the calculator tool.';
    } else if (this.needsSearch(task)) {
      reasoning += 'I need to search for information. I will use the web search tool.';
    } else if (this.needsCodeExecution(task)) {
      reasoning += 'I need to execute code. I will use the code executor tool.';
    } else {
      reasoning += 'I will attempt to break down the task into steps.';
    }
    
    // Consider previous steps
    if (previousSteps.length > 0) {
      const lastStep = previousSteps[previousSteps.length - 1];
      if (lastStep.result !== undefined) {
        reasoning += `\nPrevious step result: ${lastStep.result}`;
      }
    }
    
    return {
      stepId,
      timestamp: Date.now(),
      type: 'reasoning',
      content: reasoning
    };
  }

  private async act(reasoningStep: AgentStep): Promise<AgentStep> {
    const stepId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract task from reasoning step
    let task = reasoningStep.content;
    // Try to extract the actual task description
    const taskMatch = reasoningStep.content.match(/task:\s*"([^"]+)"/) ||
                     reasoningStep.content.match(/Analyzing task:\s*"([^"]+)"/);
    if (taskMatch) {
      task = taskMatch[1];
    }
    
    // Determine which tool to use - prefer tool from LLM if available
    let tool: Tool | null = null;
    if (reasoningStep.tool) {
      tool = this.toolRegistry.get(reasoningStep.tool) || null;
    }
    
    // Fall back to rule-based selection
    if (!tool) {
      tool = this.selectTool(reasoningStep.content, task);
    }
    
    if (!tool) {
      return {
        stepId,
        timestamp: Date.now(),
        type: 'action',
        content: 'No suitable tool found',
        error: 'No tool available for this task'
      };
    }
    
    // Use tool params from LLM if available, otherwise extract from task
    const params = reasoningStep.toolParams || this.extractToolParams(reasoningStep.content, task, tool.name);
    
    // Execute tool
    try {
      const result = await tool.execute(params);
      
      if (result.success) {
        return {
          stepId,
          timestamp: Date.now(),
          type: 'action',
          content: `Executed ${tool.name} with params: ${JSON.stringify(params)}`,
          tool: tool.name,
          toolParams: params,
          result: result.result
        };
      } else {
        return {
          stepId,
          timestamp: Date.now(),
          type: 'action',
          content: `Failed to execute ${tool.name}`,
          tool: tool.name,
          toolParams: params,
          error: result.error || 'Unknown error'
        };
      }
    } catch (error) {
      return {
        stepId,
        timestamp: Date.now(),
        type: 'action',
        content: `Error executing ${tool.name}`,
        tool: tool.name,
        toolParams: params,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private observe(actionStep: AgentStep): AgentStep {
    const stepId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let observation = '';
    if (actionStep.result !== undefined) {
      observation = `Observation: Tool execution succeeded. Result: ${actionStep.result}`;
    } else if (actionStep.error) {
      observation = `Observation: Tool execution failed. Error: ${actionStep.error}`;
    }
    
    return {
      stepId,
      timestamp: Date.now(),
      type: 'observation',
      content: observation,
      result: actionStep.result,
      error: actionStep.error
    };
  }

  private async handleRetry(failedStep: AgentStep, previousSteps: AgentStep[]): Promise<AgentStep | null> {
    const retryCount = previousSteps.filter(s => s.type === 'retry' && s.tool === failedStep.tool).length;
    
    if (retryCount >= this.maxRetries) {
      return null; // Max retries reached
    }
    
    const stepId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use LLM for retry strategy if available
    let strategy: RetryStrategy;
    let llmRetryResponse: any = null;
    
    if (this.useLLM && this.geminiAPI) {
      try {
        const availableToolNames = this.tools.map(t => t.name);
        llmRetryResponse = await this.geminiAPI.generateRetryStrategy(
          failedStep,
          retryCount,
          availableToolNames
        );
        // Map LLM strategy to RetryStrategy enum
        const strategyMap: Record<string, RetryStrategy> = {
          'simple_retry': RetryStrategy.SIMPLE_RETRY,
          'alternative_tool': RetryStrategy.ALTERNATIVE_TOOL,
          'refined_approach': RetryStrategy.REFINED_APPROACH,
          'fallback': RetryStrategy.FALLBACK
        };
        strategy = strategyMap[llmRetryResponse.strategy?.toLowerCase()] || this.selectRetryStrategy(failedStep, retryCount);
      } catch (error) {
        console.warn('LLM retry strategy failed, using rule-based:', error);
        strategy = this.selectRetryStrategy(failedStep, retryCount);
      }
    } else {
      strategy = this.selectRetryStrategy(failedStep, retryCount);
    }
    
    if (strategy === RetryStrategy.SIMPLE_RETRY) {
      // Retry with same tool and params
      const tool = this.toolRegistry.get(failedStep.tool!);
      if (tool) {
        try {
          const result = await tool.execute(failedStep.toolParams || {});
          if (result.success) {
            return {
              stepId,
              timestamp: Date.now(),
              type: 'retry',
              content: `Retry ${retryCount + 1} succeeded with simple retry`,
              tool: failedStep.tool,
              toolParams: failedStep.toolParams,
              result: result.result,
              retryAttempt: retryCount + 1,
              retryStrategy: strategy
            };
          }
        } catch (error) {
          // Continue to next strategy
        }
      }
    } else if (strategy === RetryStrategy.ALTERNATIVE_TOOL) {
      // Try different tool - use LLM suggestion if available
      let alternativeTool: Tool | null = null;
      if (llmRetryResponse?.tool) {
        alternativeTool = this.toolRegistry.get(llmRetryResponse.tool) || null;
      }
      if (!alternativeTool) {
        alternativeTool = this.findAlternativeTool(failedStep.tool!);
      }
      if (alternativeTool) {
        const params = llmRetryResponse?.toolParams || this.adaptParamsForTool(failedStep.toolParams, alternativeTool.name);
        try {
          const result = await alternativeTool.execute(params);
          if (result.success) {
            return {
              stepId,
              timestamp: Date.now(),
              type: 'retry',
              content: `Retry ${retryCount + 1} succeeded with alternative tool: ${alternativeTool.name}`,
              tool: alternativeTool.name,
              toolParams: params,
              result: result.result,
              retryAttempt: retryCount + 1,
              retryStrategy: strategy
            };
          }
        } catch (error) {
          // Continue
        }
      }
    } else if (strategy === RetryStrategy.REFINED_APPROACH) {
      // Modify parameters - use LLM suggestion if available
      const refinedParams = llmRetryResponse?.toolParams || this.refineParams(failedStep.toolParams);
      const tool = this.toolRegistry.get(failedStep.tool!);
      if (tool) {
        try {
          const result = await tool.execute(refinedParams);
          if (result.success) {
            return {
              stepId,
              timestamp: Date.now(),
              type: 'retry',
              content: `Retry ${retryCount + 1} succeeded with refined approach`,
              tool: failedStep.tool,
              toolParams: refinedParams,
              result: result.result,
              retryAttempt: retryCount + 1,
              retryStrategy: strategy
            };
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    // All retry strategies failed
    return {
      stepId,
      timestamp: Date.now(),
      type: 'retry',
      content: `Retry ${retryCount + 1} failed with strategy: ${strategy}`,
      tool: failedStep.tool,
      toolParams: failedStep.toolParams,
      error: 'All retry strategies exhausted',
      retryAttempt: retryCount + 1,
      retryStrategy: strategy
    };
  }

  private selectTool(reasoning: string, task: string): Tool | null {
    // Simple tool selection based on keywords
    const lowerTask = task.toLowerCase();
    const lowerReasoning = reasoning.toLowerCase();
    
    if (lowerTask.includes('calculate') || lowerTask.includes('math') || 
        lowerReasoning.includes('calculation') || 
        /[\d+\-*/().]/.test(task)) {
      return this.tools.find(t => t.name === 'calculator') || null;
    }
    
    if (lowerTask.includes('search') || lowerTask.includes('find') || 
        lowerReasoning.includes('search')) {
      return this.tools.find(t => t.name === 'web_search') || null;
    }
    
    if (lowerTask.includes('code') || lowerTask.includes('execute') || 
        lowerTask.includes('javascript')) {
      return this.tools.find(t => t.name === 'code_executor') || null;
    }
    
    // Default to calculator
    return this.tools.find(t => t.name === 'calculator') || null;
  }

  private extractToolParams(_reasoning: string, task: string, toolName: string): any {
    if (toolName === 'calculator') {
      // Extract mathematical expression
      const mathMatch = task.match(/(?:calculate|compute|evaluate|solve)\s+(.+?)(?:\.|$|,)/i) ||
                       task.match(/([\d+\-*/().\s]+)/);
      if (mathMatch) {
        return { expression: mathMatch[1] || mathMatch[0] };
      }
      // Try to find any expression
      const exprMatch = task.match(/([\d+\-*/().\s]+)/);
      if (exprMatch) {
        return { expression: exprMatch[0].trim() };
      }
      return { expression: task };
    }
    
    if (toolName === 'web_search') {
      return { query: task };
    }
    
    if (toolName === 'code_executor') {
      const codeMatch = task.match(/```(?:javascript|js)?\n?([\s\S]+?)\n?```/) ||
                       task.match(/code:\s*(.+)/i);
      if (codeMatch) {
        return { code: codeMatch[1] };
      }
      return { code: task };
    }
    
    return {};
  }

  private needsCalculation(task: string): boolean {
    return /calculate|compute|evaluate|solve|math|[\d+\-*/().]/.test(task.toLowerCase());
  }

  private needsSearch(task: string): boolean {
    return /search|find|lookup|query/.test(task.toLowerCase());
  }

  private needsCodeExecution(task: string): boolean {
    return /code|execute|javascript|program/.test(task.toLowerCase());
  }


  private selectRetryStrategy(_failedStep: AgentStep, retryCount: number): RetryStrategy {
    // Progressive retry strategy selection
    if (retryCount === 0) return RetryStrategy.SIMPLE_RETRY;
    if (retryCount === 1) return RetryStrategy.REFINED_APPROACH;
    if (retryCount === 2) return RetryStrategy.ALTERNATIVE_TOOL;
    return RetryStrategy.FALLBACK;
  }

  private findAlternativeTool(failedToolName: string): Tool | null {
    // Find a different tool that might work
    const alternatives = this.tools.filter(t => t.name !== failedToolName);
    return alternatives.length > 0 ? alternatives[0] : null;
  }

  private adaptParamsForTool(originalParams: any, newToolName: string): any {
    // Adapt parameters for different tool
    if (newToolName === 'calculator' && originalParams.expression) {
      return { expression: originalParams.expression };
    }
    if (newToolName === 'web_search') {
      return { query: String(originalParams.expression || originalParams.code || '') };
    }
    return originalParams;
  }

  private refineParams(params: any): any {
    // Try to refine parameters (e.g., simplify expression, fix syntax)
    if (params.expression) {
      // Try to clean up expression
      let expr = params.expression.trim();
      // Remove extra spaces
      expr = expr.replace(/\s+/g, ' ');
      return { expression: expr };
    }
    return params;
  }

  getMemory() {
    return this.memory.getMemory();
  }

  reset(): void {
    this.memory.reset();
  }
}

