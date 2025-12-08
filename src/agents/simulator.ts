// Main Agents Simulator Controller

import { Agent } from './agents/base';
import { ReActAgent } from './agents/react-agent';
import { SimpleAgent } from './agents/simple-agent';
import { AgentCreator, AgentConfig } from './ui/agent-creator';
import { TaskInput } from './ui/task-input';
import { ControlPanel } from './ui/control-panel';
import { MemoryVisualizer } from './visualizations/memory-visualizer';
import { RetryLoopVisualizer } from './visualizations/retry-loop-visualizer';
import { PlotlyManager } from './visualizations/plotly-manager';

export class AgentsSimulator {
  private currentAgent: Agent | null = null;
  private agentCreator: AgentCreator;
  private taskInput: TaskInput;
  private controlPanel: ControlPanel;
  private memoryVisualizer: MemoryVisualizer;
  private retryLoopVisualizer: RetryLoopVisualizer;
  private plotlyManager: PlotlyManager;
  private consoleContainer: HTMLElement;
  private isExecuting: boolean = false;
  private shouldStop: boolean = false;
  private currentSteps: any[] = [];
  private stepCount: number = 0;
  private retryCount: number = 0;

  constructor() {
    this.agentCreator = new AgentCreator((config) => this.onAgentCreated(config));
    // agentCreator is used via its callback - accessing it to satisfy TypeScript
    void this.agentCreator;
    this.taskInput = new TaskInput();
    this.controlPanel = new ControlPanel(
      () => this.executeTask(),
      () => this.stopExecution(),
      () => this.reset()
    );
    this.memoryVisualizer = new MemoryVisualizer();
    this.retryLoopVisualizer = new RetryLoopVisualizer();
    this.plotlyManager = new PlotlyManager();
    this.consoleContainer = document.getElementById('execution-console')!;

    // Initialize UI
    this.updateUI();
  }

  private onAgentCreated(config: AgentConfig): void {
    // Create agent based on type
    if (config.type === 'react') {
      this.currentAgent = new ReActAgent(config.name, config.tools, config.apiKey);
    } else {
      this.currentAgent = new SimpleAgent(config.name, config.tools);
    }

    this.logToConsole(`✅ Agent "${config.name}" created (Type: ${config.type}, Tools: ${config.tools.join(', ')})`);
    this.updateUI();
  }

  private async executeTask(): Promise<void> {
    if (!this.currentAgent) {
      this.logToConsole('❌ No agent created. Please create an agent first.');
      return;
    }

    const task = this.taskInput.getTask();
    if (!task) {
      this.logToConsole('❌ No task provided. Please enter a task.');
      return;
    }

    this.isExecuting = true;
    this.shouldStop = false;
    this.controlPanel.setExecuteEnabled(false);
    this.controlPanel.setStopEnabled(true);
    this.stepCount = 0;
    this.retryCount = 0;
    this.currentSteps = [];

    this.logToConsole(`🚀 Starting task execution: "${task}"`);
    this.logToConsole(`Agent: ${this.currentAgent.name} (${this.currentAgent.type})`);

    try {
      const steps = await this.executeWithSpeedControl(task);
      this.currentSteps = steps;
      
      // Update visualizations
      this.updateVisualizations();
      
      // Update statistics
      this.updateStatistics();
      
      this.logToConsole('✅ Task execution completed');
    } catch (error) {
      this.logToConsole(`❌ Task execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isExecuting = false;
      this.controlPanel.setExecuteEnabled(true);
      this.controlPanel.setStopEnabled(false);
    }
  }

  private async executeWithSpeedControl(task: string): Promise<any[]> {
    // For now, execute normally - speed control can be added later
    const speed = this.controlPanel.getSpeed();
    const delay = Math.max(10, 100 / speed);

    if (this.currentAgent) {
      // Execute and log steps as they happen
      const steps = await this.currentAgent.execute(task);
      
      // Log each step with delay for visualization
      for (const step of steps) {
        if (this.shouldStop) {
          this.logToConsole('⏹️ Execution stopped by user');
          break;
        }
        
        this.logStep(step);
        this.stepCount++;
        
        if (step.type === 'retry') {
          this.retryCount++;
        }
        
        // Update visualizations incrementally
        this.updateVisualizations();
        this.updateStatistics();
        
        // Add delay for visualization
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return steps;
    }
    
    return [];
  }

  private logStep(step: any): void {
    const time = new Date(step.timestamp).toLocaleTimeString();
    let icon = '📝';
    let color = 'var(--text-secondary)';
    
    switch (step.type) {
      case 'reasoning':
        icon = '🧠';
        color = '#6366f1';
        break;
      case 'action':
        icon = step.error ? '❌' : '⚡';
        color = step.error ? '#ef4444' : '#22c55e';
        break;
      case 'observation':
        icon = '👁️';
        color = '#8b5cf6';
        break;
      case 'retry':
        icon = step.result !== undefined ? '✅' : '🔄';
        color = step.result !== undefined ? '#22c55e' : '#f59e0b';
        break;
    }
    
    const html = `
      <div class="mb-2 p-2" style="background: rgba(0, 0, 0, 0.2); border-left: 3px solid ${color}; border-radius: 4px;">
        <div class="small" style="color: ${color};">
          <strong>${icon} ${step.type.toUpperCase()}</strong> <span class="text-muted">(${time})</span>
        </div>
        <div class="small mt-1">${this.escapeHtml(step.content)}</div>
        ${step.tool ? `<div class="small text-muted mt-1">Tool: ${step.tool}</div>` : ''}
        ${step.result !== undefined ? `<div class="small text-success mt-1">Result: ${this.escapeHtml(String(step.result))}</div>` : ''}
        ${step.error ? `<div class="small text-danger mt-1">Error: ${this.escapeHtml(step.error)}</div>` : ''}
        ${step.retryStrategy ? `<div class="small text-muted mt-1">Retry Strategy: ${step.retryStrategy}</div>` : ''}
      </div>
    `;
    
    const div = document.createElement('div');
    div.innerHTML = html;
    this.consoleContainer.appendChild(div);
    this.consoleContainer.scrollTop = this.consoleContainer.scrollHeight;
  }

  private logToConsole(message: string): void {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = 'mb-2 small';
    div.textContent = `[${time}] ${message}`;
    this.consoleContainer.appendChild(div);
    this.consoleContainer.scrollTop = this.consoleContainer.scrollHeight;
  }

  private updateVisualizations(): void {
    if (this.currentAgent) {
      const memory = this.currentAgent.getMemory();
      this.memoryVisualizer.update(memory);
      
      // Update memory usage chart
      const memorySize = memory.conversationHistory.length + 
                        memory.workingMemory.facts.size + 
                        memory.workingMemory.context.size + 
                        memory.workingMemory.intermediateResults.length;
      this.plotlyManager.updateMemoryUsage(this.stepCount, memorySize);
    }
    
    if (this.currentSteps.length > 0) {
      this.retryLoopVisualizer.update(this.currentSteps);
      
      // Update retry chart
      const retrySteps = this.currentSteps.filter(s => s.type === 'retry');
      retrySteps.forEach(step => {
        this.plotlyManager.updateRetry(this.stepCount, step.result !== undefined);
      });
    }
  }

  private updateStatistics(): void {
    document.getElementById('step-count')!.textContent = this.stepCount.toString();
    document.getElementById('retry-count')!.textContent = this.retryCount.toString();
    
    const successCount = this.retryLoopVisualizer.getSuccessCount();
    const totalRetries = this.retryLoopVisualizer.getRetryCount();
    const successRate = totalRetries > 0 ? Math.round((successCount / totalRetries) * 100) : 0;
    document.getElementById('success-rate')!.textContent = `${successRate}%`;
    
    if (this.currentAgent) {
      const memory = this.currentAgent.getMemory();
      const memorySize = memory.conversationHistory.length + 
                        memory.workingMemory.facts.size + 
                        memory.workingMemory.context.size + 
                        memory.workingMemory.intermediateResults.length;
      document.getElementById('memory-size')!.textContent = memorySize.toString();
    }
  }

  private stopExecution(): void {
    this.shouldStop = true;
    this.logToConsole('⏹️ Stopping execution...');
  }

  private reset(): void {
    this.stopExecution();
    this.isExecuting = false;
    this.currentSteps = [];
    this.stepCount = 0;
    this.retryCount = 0;
    
    if (this.currentAgent) {
      this.currentAgent.reset();
    }
    
    this.consoleContainer.innerHTML = '<div class="text-muted">Console cleared. Create an agent and execute a task to begin.</div>';
    this.memoryVisualizer.reset();
    this.retryLoopVisualizer.reset();
    this.plotlyManager.reset();
    this.updateStatistics();
    this.updateUI();
  }

  private updateUI(): void {
    const hasAgent = this.currentAgent !== null;
    this.controlPanel.setExecuteEnabled(hasAgent && !this.isExecuting);
    this.taskInput.setEnabled(hasAgent);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

