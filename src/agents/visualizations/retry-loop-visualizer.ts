// Retry Loop Visualizer

import { AgentStep } from '../agents/base';

export class RetryLoopVisualizer {
  private container: HTMLElement;
  private retrySteps: AgentStep[] = [];

  constructor() {
    this.container = document.getElementById('retry-loop-visualization')!;
  }

  update(steps: AgentStep[]): void {
    this.retrySteps = steps.filter(s => s.type === 'retry' || (s.type === 'action' && s.error));
    this.render();
  }

  private render(): void {
    if (this.retrySteps.length === 0) {
      this.container.innerHTML = '<div class="text-muted text-center" style="padding-top: 100px;">No retry attempts yet</div>';
      return;
    }

    // Create flowchart-like visualization
    let html = '<div style="font-family: monospace; font-size: 0.85rem;">';
    
    this.retrySteps.forEach((step, idx) => {
      const isRetry = step.type === 'retry';
      const isSuccess = step.result !== undefined;
      const isFailure = step.error !== undefined;
      
      let color = '#6366f1'; // Default blue
      let icon = '🔄';
      let status = '';
      
      if (isRetry) {
        if (isSuccess) {
          color = '#22c55e'; // Green
          icon = '✅';
          status = 'SUCCESS';
        } else if (isFailure) {
          color = '#ef4444'; // Red
          icon = '❌';
          status = 'FAILED';
        } else {
          color = '#f59e0b'; // Yellow
          icon = '⏳';
          status = 'PENDING';
        }
      } else if (isFailure) {
        color = '#ef4444';
        icon = '⚠️';
        status = 'ERROR';
      }
      
      const time = new Date(step.timestamp).toLocaleTimeString();
      const strategy = step.retryStrategy ? `Strategy: ${step.retryStrategy}` : '';
      const attempt = step.retryAttempt ? `Attempt #${step.retryAttempt}` : '';
      
      html += `
        <div class="mb-3 p-3" style="background: rgba(0, 0, 0, 0.2); border-left: 4px solid ${color}; border-radius: 4px;">
          <div style="color: ${color}; font-weight: 600;">
            ${icon} ${status} ${attempt ? `(${attempt})` : ''}
          </div>
          <div class="text-muted small mt-1">${time} ${strategy}</div>
          <div class="mt-2 small">
            <strong>Tool:</strong> ${step.tool || 'N/A'}<br>
            ${step.content ? `<div class="mt-1">${this.escapeHtml(step.content)}</div>` : ''}
            ${step.result !== undefined ? `<div class="mt-1 text-success">Result: ${this.escapeHtml(String(step.result))}</div>` : ''}
            ${step.error ? `<div class="mt-1 text-danger">Error: ${this.escapeHtml(step.error)}</div>` : ''}
          </div>
        </div>
      `;
      
      // Add arrow between steps
      if (idx < this.retrySteps.length - 1) {
        html += '<div class="text-center mb-2" style="color: var(--text-secondary);">↓</div>';
      }
    });
    
    html += '</div>';
    this.container.innerHTML = html;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getRetryCount(): number {
    return this.retrySteps.filter(s => s.type === 'retry').length;
  }

  getSuccessCount(): number {
    return this.retrySteps.filter(s => s.type === 'retry' && s.result !== undefined).length;
  }

  reset(): void {
    this.retrySteps = [];
    this.container.innerHTML = '<div class="text-muted text-center" style="padding-top: 100px;">Retry attempts will appear here</div>';
  }
}

