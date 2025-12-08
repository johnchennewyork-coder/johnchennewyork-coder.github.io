// Plotly Manager for Agents Visualizations

declare const Plotly: any;

export class PlotlyManager {
  private memoryUsageData: Array<{ step: number; size: number }> = [];
  private retryData: Array<{ step: number; success: boolean }> = [];
  private maxDataPoints: number = 100;

  constructor() {
    // Initialize charts if needed
    // For now, we'll create them on demand
  }

  updateMemoryUsage(step: number, size: number): void {
    this.memoryUsageData.push({ step, size });
    
    if (this.memoryUsageData.length > this.maxDataPoints) {
      this.memoryUsageData.shift();
    }
  }

  updateRetry(step: number, success: boolean): void {
    this.retryData.push({ step, success });
    
    if (this.retryData.length > this.maxDataPoints) {
      this.retryData.shift();
    }
  }

  renderMemoryChart(containerId: string): void {
    const x = this.memoryUsageData.map(d => d.step);
    const y = this.memoryUsageData.map(d => d.size);

    Plotly.newPlot(containerId, [{
      x: x,
      y: y,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Memory Size',
      line: { color: '#6366f1', width: 2 },
      marker: { size: 4 }
    }], {
      title: 'Memory Usage Over Time',
      xaxis: { title: 'Step' },
      yaxis: { title: 'Memory Size' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#b4b8c5' },
      margin: { l: 50, r: 20, t: 30, b: 50 }
    }, { responsive: true, displayModeBar: false });
  }

  renderRetryChart(containerId: string): void {
    const successCount = this.retryData.filter(d => d.success).length;
    const failureCount = this.retryData.filter(d => !d.success).length;

    Plotly.newPlot(containerId, [{
      x: ['Success', 'Failure'],
      y: [successCount, failureCount],
      type: 'bar',
      marker: {
        color: ['#22c55e', '#ef4444']
      }
    }], {
      title: 'Retry Success Rate',
      xaxis: { title: 'Outcome' },
      yaxis: { title: 'Count' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#b4b8c5' },
      margin: { l: 50, r: 20, t: 30, b: 50 }
    }, { responsive: true, displayModeBar: false });
  }

  reset(): void {
    this.memoryUsageData = [];
    this.retryData = [];
  }
}

