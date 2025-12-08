// Simple Agent - Basic implementation

import { Agent, AgentStep } from './base';
import { AgentMemoryManager } from '../memory/agent-memory';
import { Tool } from '../tools/base';
import { CalculatorTool } from '../tools/calculator';

export class SimpleAgent implements Agent {
  name: string;
  type = 'simple';
  private memory: AgentMemoryManager;
  private tools: Tool[] = [];

  constructor(name: string, availableTools: string[] = []) {
    this.name = name;
    this.memory = new AgentMemoryManager();
    
    // Simple agent only uses calculator by default
    if (availableTools.includes('calculator') || availableTools.length === 0) {
      this.tools.push(new CalculatorTool());
    }
  }

  getAvailableTools(): Tool[] {
    return [...this.tools];
  }

  async execute(task: string): Promise<AgentStep[]> {
    this.memory.addMessage('user', task);
    
    const steps: AgentStep[] = [];
    const stepId = `step-${Date.now()}`;
    
    // Simple agent: just try to execute with calculator
    const calculator = this.tools.find(t => t.name === 'calculator');
    
    if (calculator) {
      // Extract expression from task
      const expression = this.extractExpression(task);
      
      const actionStep: AgentStep = {
        stepId: `${stepId}-action`,
        timestamp: Date.now(),
        type: 'action',
        content: `Executing calculation: ${expression}`,
        tool: 'calculator',
        toolParams: { expression }
      };
      
      try {
        const result = await calculator.execute({ expression });
        if (result.success) {
          actionStep.result = result.result;
          this.memory.addMessage('agent', `Result: ${result.result}`);
          this.memory.addIntermediateResult(result.result);
        } else {
          actionStep.error = result.error;
        }
      } catch (error) {
        actionStep.error = error instanceof Error ? error.message : 'Unknown error';
      }
      
      steps.push(actionStep);
    } else {
      steps.push({
        stepId: `${stepId}-error`,
        timestamp: Date.now(),
        type: 'action',
        content: 'No calculator tool available',
        error: 'No tools available'
      });
    }
    
    return steps;
  }

  private extractExpression(task: string): string {
    // Try to extract mathematical expression
    const match = task.match(/([\d+\-*/().\s]+)/);
    if (match) {
      return match[0].trim();
    }
    return task;
  }

  getMemory() {
    return this.memory.getMemory();
  }

  reset(): void {
    this.memory.reset();
  }
}

