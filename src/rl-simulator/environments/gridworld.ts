// GridWorld Environment for Value-Based RL Algorithms

export interface GridWorldState {
  row: number;
  col: number;
}

export class GridWorld {
  private gridSize: number = 10;
  private agentPos: GridWorldState = { row: 0, col: 0 };
  private goalPos: GridWorldState = { row: 9, col: 9 };
  private obstacles: GridWorldState[] = [
    { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 },
    { row: 5, col: 5 }, { row: 5, col: 6 }, { row: 6, col: 5 },
    { row: 7, col: 7 }, { row: 7, col: 8 }
  ];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 40;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    this.resize();
  }

  resize() {
    const container = this.canvas.parentElement;
    if (container) {
      const width = Math.min(container.clientWidth - 32, this.gridSize * this.cellSize);
      this.canvas.width = width;
      this.canvas.height = width;
      this.cellSize = width / this.gridSize;
    }
  }

  reset(): GridWorldState {
    this.agentPos = { row: 0, col: 0 };
    return { ...this.agentPos };
  }

  getState(): GridWorldState {
    return { ...this.agentPos };
  }

  getStateKey(state?: GridWorldState): string {
    const s = state || this.agentPos;
    return `${s.row},${s.col}`;
  }

  getNumStates(): number {
    return this.gridSize * this.gridSize;
  }

  getNumActions(): number {
    return 4; // Up, Down, Left, Right
  }

  step(action: number): { nextState: GridWorldState; reward: number; done: boolean } {
    const newPos = { ...this.agentPos };
    
    // 0: Up, 1: Down, 2: Left, 3: Right
    switch (action) {
      case 0: newPos.row = Math.max(0, newPos.row - 1); break;
      case 1: newPos.row = Math.min(this.gridSize - 1, newPos.row + 1); break;
      case 2: newPos.col = Math.max(0, newPos.col - 1); break;
      case 3: newPos.col = Math.min(this.gridSize - 1, newPos.col + 1); break;
    }

    // Check if hit obstacle
    const hitObstacle = this.obstacles.some(obs => obs.row === newPos.row && obs.col === newPos.col);
    if (hitObstacle) {
      return { nextState: this.agentPos, reward: -1, done: false };
    }

    this.agentPos = newPos;

    // Check if reached goal
    if (newPos.row === this.goalPos.row && newPos.col === this.goalPos.col) {
      return { nextState: this.agentPos, reward: 10, done: true };
    }

    return { nextState: this.agentPos, reward: -0.1, done: false };
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    for (let i = 0; i <= this.gridSize; i++) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.cellSize, 0);
      this.ctx.lineTo(i * this.cellSize, this.canvas.height);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.cellSize);
      this.ctx.lineTo(this.canvas.width, i * this.cellSize);
      this.ctx.stroke();
    }

    // Draw obstacles
    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
    this.obstacles.forEach(obs => {
      this.ctx.fillRect(
        obs.col * this.cellSize + 2,
        obs.row * this.cellSize + 2,
        this.cellSize - 4,
        this.cellSize - 4
      );
    });

    // Draw goal
    this.ctx.fillStyle = 'rgba(34, 197, 94, 0.7)';
    this.ctx.fillRect(
      this.goalPos.col * this.cellSize + 2,
      this.goalPos.row * this.cellSize + 2,
      this.cellSize - 4,
      this.cellSize - 4
    );

    // Draw agent
    this.ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
    this.ctx.beginPath();
    this.ctx.arc(
      this.agentPos.col * this.cellSize + this.cellSize / 2,
      this.agentPos.row * this.cellSize + this.cellSize / 2,
      this.cellSize / 3,
      0,
      2 * Math.PI
    );
    this.ctx.fill();
  }

  getActionName(action: number): string {
    const names = ['Up', 'Down', 'Left', 'Right'];
    return names[action] || 'Unknown';
  }
}

