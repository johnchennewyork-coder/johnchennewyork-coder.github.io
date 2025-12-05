// PlotlyManager for RL Simulator Visualizations

declare const Plotly: any;

export class PlotlyManager {
  private learningCurveData: Array<{ episode: number; reward: number }> = [];
  private lossData: Array<{ step: number; loss: number }> = [];
  private qValuesData: Map<string, number[]> = new Map();
  private maxDataPoints: number = 500;

  constructor() {
    this.initializeCharts();
  }

  private initializeCharts(): void {
    // Learning Curve Chart
    Plotly.newPlot('learning-curve-chart', [{
      x: [],
      y: [],
      type: 'scatter',
      mode: 'lines',
      name: 'Episode Reward',
      line: { color: '#6366f1', width: 2 }
    }], {
      title: 'Learning Curve',
      xaxis: { title: 'Episode' },
      yaxis: { title: 'Reward' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#b4b8c5' },
      margin: { l: 50, r: 20, t: 30, b: 50 }
    }, { responsive: true, displayModeBar: false });

    // Loss Chart
    Plotly.newPlot('loss-chart', [{
      x: [],
      y: [],
      type: 'scatter',
      mode: 'lines',
      name: 'Loss / TD Error',
      line: { color: '#ef4444', width: 2 }
    }], {
      title: 'Loss / TD Error',
      xaxis: { title: 'Step' },
      yaxis: { title: 'Loss' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#b4b8c5' },
      margin: { l: 50, r: 20, t: 30, b: 50 }
    }, { responsive: true, displayModeBar: false });

    // Q-Values Chart (will be updated based on algorithm type)
    Plotly.newPlot('q-values-chart', [{
      x: [],
      y: [],
      type: 'bar',
      name: 'Q-Values',
      marker: { color: '#8b5cf6' }
    }], {
      title: 'Q-Values',
      xaxis: { title: 'Action' },
      yaxis: { title: 'Q-Value' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#b4b8c5' },
      margin: { l: 50, r: 20, t: 30, b: 50 }
    }, { responsive: true, displayModeBar: false });
  }

  updateLearningCurve(episode: number, reward: number): void {
    this.learningCurveData.push({ episode, reward });
    
    // Keep only last maxDataPoints
    if (this.learningCurveData.length > this.maxDataPoints) {
      this.learningCurveData.shift();
    }

    const x = this.learningCurveData.map(d => d.episode);
    const y = this.learningCurveData.map(d => d.reward);

    // Calculate moving average
    const window = 10;
    const movingAvg: number[] = [];
    for (let i = 0; i < y.length; i++) {
      const start = Math.max(0, i - window + 1);
      const avg = y.slice(start, i + 1).reduce((a, b) => a + b, 0) / (i - start + 1);
      movingAvg.push(avg);
    }

    Plotly.update('learning-curve-chart', {
      x: [x, x],
      y: [y, movingAvg]
    }, {
      data: [
        { name: 'Episode Reward' },
        { name: 'Moving Average (10)', line: { color: '#8b5cf6', dash: 'dash' } }
      ]
    });
  }

  updateLoss(step: number, loss: number): void {
    this.lossData.push({ step, loss });
    
    if (this.lossData.length > this.maxDataPoints) {
      this.lossData.shift();
    }

    const x = this.lossData.map(d => d.step);
    const y = this.lossData.map(d => d.loss);

    Plotly.update('loss-chart', {
      x: [x],
      y: [y]
    });
  }

  updateQValues(qValues: number[], actionNames?: string[]): void {
    const actions = actionNames || qValues.map((_, i) => `Action ${i}`);
    
    Plotly.update('q-values-chart', {
      x: [actions],
      y: [qValues]
    });
  }

  updateQValuesHeatmap(qValuesMap: Map<string, number[]>, gridSize: number): void {
    // Create heatmap for GridWorld Q-values
    const heatmapData: number[][] = [];
    const actionNames = ['Up', 'Down', 'Left', 'Right'];
    
    for (let action = 0; action < 4; action++) {
      const row: number[] = [];
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const key = `${r},${c}`;
          const qVal = qValuesMap.get(key)?.[action] || 0;
          row.push(qVal);
        }
      }
      heatmapData.push(row);
    }

    const traces = actionNames.map((name, idx) => ({
      z: [heatmapData[idx]],
      type: 'heatmap',
      name: name,
      colorscale: 'Viridis',
      showscale: idx === 0
    }));

    Plotly.newPlot('q-values-chart', traces, {
      title: 'Q-Values Heatmap',
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#b4b8c5' }
    }, { responsive: true, displayModeBar: false });
  }

  updatePolicy(policyProbs: number[], actionNames?: string[]): void {
    const actions = actionNames || policyProbs.map((_, i) => `Action ${i}`);
    
    Plotly.update('q-values-chart', {
      x: [actions],
      y: [policyProbs],
      type: 'bar',
      marker: { color: '#22c55e' }
    }, {
      title: 'Policy Probabilities'
    });
  }

  reset(): void {
    this.learningCurveData = [];
    this.lossData = [];
    this.qValuesData.clear();
    this.initializeCharts();
  }

  setChartTitle(chartId: string, title: string): void {
    const update = { title: { text: title } };
    Plotly.relayout(chartId, update);
  }
}

