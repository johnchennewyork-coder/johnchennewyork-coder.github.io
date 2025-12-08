// Agent Creator UI Component

export interface AgentConfig {
  name: string;
  type: 'react' | 'simple';
  tools: string[];
  apiKey?: string;
}

export class AgentCreator {
  private nameInput: HTMLInputElement;
  private typeSelect: HTMLSelectElement;
  private toolCheckboxes: Map<string, HTMLInputElement> = new Map();
  private apiKeyInput: HTMLInputElement;
  private createButton: HTMLButtonElement;
  private onAgentCreated: (config: AgentConfig) => void;

  constructor(onAgentCreated: (config: AgentConfig) => void) {
    this.onAgentCreated = onAgentCreated;
    
    this.nameInput = document.getElementById('agent-name') as HTMLInputElement;
    this.typeSelect = document.getElementById('agent-type') as HTMLSelectElement;
    this.apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    this.createButton = document.getElementById('create-agent-btn') as HTMLButtonElement;
    
    // Setup tool checkboxes
    const calculatorCheckbox = document.getElementById('tool-calculator') as HTMLInputElement;
    const webSearchCheckbox = document.getElementById('tool-web-search') as HTMLInputElement;
    const codeExecutorCheckbox = document.getElementById('tool-code-executor') as HTMLInputElement;
    
    this.toolCheckboxes.set('calculator', calculatorCheckbox);
    this.toolCheckboxes.set('web_search', webSearchCheckbox);
    this.toolCheckboxes.set('code_executor', codeExecutorCheckbox);
    
    this.createButton.addEventListener('click', () => this.createAgent());
  }

  private createAgent(): void {
    const name = this.nameInput.value.trim() || 'Agent-1';
    const type = this.typeSelect.value as 'react' | 'simple';
    
    const tools: string[] = [];
    this.toolCheckboxes.forEach((checkbox, toolName) => {
      if (checkbox.checked) {
        tools.push(toolName);
      }
    });
    
    // Ensure at least one tool is selected
    if (tools.length === 0) {
      tools.push('calculator');
      this.toolCheckboxes.get('calculator')!.checked = true;
    }
    
    const apiKey = this.apiKeyInput.value.trim() || undefined;
    
    const config: AgentConfig = {
      name,
      type,
      tools,
      apiKey
    };
    
    this.onAgentCreated(config);
  }

  getConfig(): AgentConfig {
    const tools: string[] = [];
    this.toolCheckboxes.forEach((checkbox, toolName) => {
      if (checkbox.checked) {
        tools.push(toolName);
      }
    });
    
    const apiKey = this.apiKeyInput.value.trim() || undefined;
    
    return {
      name: this.nameInput.value.trim() || 'Agent-1',
      type: this.typeSelect.value as 'react' | 'simple',
      tools: tools.length > 0 ? tools : ['calculator'],
      apiKey
    };
  }

  reset(): void {
    this.nameInput.value = 'Agent-1';
    this.typeSelect.value = 'react';
    this.apiKeyInput.value = '';
    this.toolCheckboxes.forEach(checkbox => {
      checkbox.checked = checkbox.id === 'tool-calculator';
    });
  }
}

