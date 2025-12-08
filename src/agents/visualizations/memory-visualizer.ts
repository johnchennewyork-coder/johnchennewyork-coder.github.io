// Memory Visualizer

import { AgentMemory, Message } from '../memory/agent-memory';

export class MemoryVisualizer {
  private container: HTMLElement;
  private conversationContainer: HTMLElement;
  private workingMemoryContainer: HTMLElement;

  constructor() {
    this.container = document.getElementById('memory-visualization')!;
    this.conversationContainer = document.getElementById('conversation-history')!;
    this.workingMemoryContainer = document.getElementById('working-memory')!;
  }

  update(memory: AgentMemory): void {
    this.updateConversationHistory(memory.conversationHistory);
    this.updateWorkingMemory(memory.workingMemory);
  }

  private updateConversationHistory(messages: Message[]): void {
    if (messages.length === 0) {
      this.conversationContainer.innerHTML = '<div class="text-muted small">No conversation yet</div>';
      return;
    }

    const html = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const roleClass = msg.role === 'user' ? 'text-primary' : msg.role === 'agent' ? 'text-success' : 'text-muted';
      const roleIcon = msg.role === 'user' ? '👤' : msg.role === 'agent' ? '🤖' : '⚙️';
      
      return `
        <div class="mb-2 p-2" style="background: rgba(0, 0, 0, 0.2); border-radius: 4px;">
          <div class="small ${roleClass}">
            <strong>${roleIcon} ${msg.role.toUpperCase()}</strong> <span class="text-muted">(${time})</span>
          </div>
          <div class="small mt-1">${this.escapeHtml(msg.content)}</div>
        </div>
      `;
    }).join('');

    this.conversationContainer.innerHTML = html;
    this.conversationContainer.scrollTop = this.conversationContainer.scrollHeight;
  }

  private updateWorkingMemory(workingMemory: AgentMemory['workingMemory']): void {
    const facts = Array.from(workingMemory.facts.entries());
    const context = Array.from(workingMemory.context.entries());
    const results = workingMemory.intermediateResults;

    if (facts.length === 0 && context.length === 0 && results.length === 0) {
      this.workingMemoryContainer.innerHTML = '<div class="text-muted small">No working memory yet</div>';
      return;
    }

    let html = '';

    if (facts.length > 0) {
      html += '<div class="mb-2"><strong class="text-info">Facts:</strong></div>';
      facts.forEach(([key, value]) => {
        html += `<div class="small mb-1"><code>${this.escapeHtml(key)}</code>: ${this.formatValue(value.value)}</div>`;
      });
    }

    if (context.length > 0) {
      html += '<div class="mb-2 mt-3"><strong class="text-info">Context:</strong></div>';
      context.forEach(([key, value]) => {
        html += `<div class="small mb-1"><code>${this.escapeHtml(key)}</code>: ${this.formatValue(value)}</div>`;
      });
    }

    if (results.length > 0) {
      html += '<div class="mb-2 mt-3"><strong class="text-info">Intermediate Results:</strong></div>';
      results.forEach((item, idx) => {
        html += `<div class="small mb-1">[${idx + 1}] ${this.formatValue(item.result)}</div>`;
      });
    }

    this.workingMemoryContainer.innerHTML = html;
    this.workingMemoryContainer.scrollTop = this.workingMemoryContainer.scrollHeight;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  reset(): void {
    this.conversationContainer.innerHTML = '<div class="text-muted small">No conversation yet</div>';
    this.workingMemoryContainer.innerHTML = '<div class="text-muted small">No working memory yet</div>';
    this.container.innerHTML = '<div class="text-muted text-center" style="padding-top: 150px;">Memory will appear here</div>';
  }
}

