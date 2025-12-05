// GridWorld Environment for Value-Based RL Algorithms

export interface GridWorldState {
  row: number;
  col: number;
}

export interface RewardConfig {
  goalReward: number;
  obstaclePenalty: number;
  stepPenalty: number;
  timePenalty: number; // Penalty per step after a certain number of steps
  timePenaltyThreshold: number; // Number of steps before time penalty kicks in
}

export class GridWorld {
  private gridSize: number = 6;
  private agentPos: GridWorldState = { row: 0, col: 0 };
  private goalPos: GridWorldState = { row: 5, col: 5 };
  private obstacles: GridWorldState[] = [
    { row: 1, col: 2 }, { row: 2, col: 1 },
    { row: 3, col: 3 }, { row: 4, col: 2 }
  ];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 40;
  private rewardConfig: RewardConfig = {
    goalReward: 10,
    obstaclePenalty: -1,
    stepPenalty: -0.1,
    timePenalty: -0.5,
    timePenaltyThreshold: 20
  };
  private episodeStepCount: number = 0;

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
    this.episodeStepCount = 0;
    return { ...this.agentPos };
  }

  setRewardConfig(config: Partial<RewardConfig>): void {
    this.rewardConfig = { ...this.rewardConfig, ...config };
  }

  getRewardConfig(): RewardConfig {
    return { ...this.rewardConfig };
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

    this.episodeStepCount++;

    // Check if hit obstacle
    const hitObstacle = this.obstacles.some(obs => obs.row === newPos.row && obs.col === newPos.col);
    if (hitObstacle) {
      return { nextState: this.agentPos, reward: this.rewardConfig.obstaclePenalty, done: false };
    }

    this.agentPos = newPos;

    // Check if reached goal
    if (newPos.row === this.goalPos.row && newPos.col === this.goalPos.col) {
      return { nextState: this.agentPos, reward: this.rewardConfig.goalReward, done: true };
    }

    // Calculate step penalty + time penalty if applicable
    let reward = this.rewardConfig.stepPenalty;
    if (this.episodeStepCount > this.rewardConfig.timePenaltyThreshold) {
      reward += this.rewardConfig.timePenalty;
    }

    return { nextState: this.agentPos, reward, done: false };
  }

  getRewardForState(state: GridWorldState): number {
    // Get reward that would be received in this state (for visualization)
    const isObstacle = this.obstacles.some(obs => obs.row === state.row && obs.col === state.col);
    if (isObstacle) {
      return this.rewardConfig.obstaclePenalty;
    }
    if (state.row === this.goalPos.row && state.col === this.goalPos.col) {
      return this.rewardConfig.goalReward;
    }
    return this.rewardConfig.stepPenalty;
  }

  render(qValuesMap?: Map<string, number[]>, policyMap?: Map<string, number[]>, showPolicy: boolean = false, animationProgress: number = 0): void {
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

    // Draw Q-values or policy probabilities for each cell
    if (qValuesMap || policyMap) {
      for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
          const stateKey = `${row},${col}`;
          const qValues = qValuesMap?.get(stateKey);
          const policyProbs = policyMap?.get(stateKey);
          
          // Skip if no values or if it's an obstacle/goal/agent position
          const isObstacle = this.obstacles.some(obs => obs.row === row && obs.col === col);
          const isGoal = row === this.goalPos.row && col === this.goalPos.col;
          const isAgent = row === this.agentPos.row && col === this.agentPos.col;
          
          if ((qValues || policyProbs) && !isObstacle && !isGoal && !isAgent) {
            const cellX = col * this.cellSize;
            const cellY = row * this.cellSize;
            const actionArrows = ['↑', '↓', '←', '→'];
            
            // Interpolate between Q-values and policy if animating
            let displayValues: number[];
            let bestAction: number;
            
            if (showPolicy && policyProbs) {
              // Show policy probabilities
              displayValues = policyProbs;
              bestAction = policyProbs.indexOf(Math.max(...policyProbs));
            } else if (qValues && policyProbs && animationProgress > 0) {
              // Interpolate during animation
              const normalizedQ = qValues.map((q) => {
                const minQ = Math.min(...qValues);
                const maxQ = Math.max(...qValues);
                return maxQ !== minQ ? (q - minQ) / (maxQ - minQ) : 0.5;
              });
              displayValues = normalizedQ.map((nq, i) => 
                nq * (1 - animationProgress) + (policyProbs[i] || 0) * animationProgress
              );
              bestAction = displayValues.indexOf(Math.max(...displayValues));
            } else if (qValues) {
              // Show Q-values
              displayValues = qValues;
              bestAction = qValues.indexOf(Math.max(...qValues));
            } else {
              continue;
            }
            
            // Draw action arrows with thickness/opacity based on probability
            const arrowLength = this.cellSize * 0.25;
            const arrowWidth = 2;
            
            // Up arrow
            this.drawActionArrow(
              cellX + this.cellSize / 2,
              cellY + this.cellSize * 0.25,
              0,
              displayValues[0],
              showPolicy || animationProgress > 0,
              arrowLength,
              arrowWidth
            );
            
            // Down arrow
            this.drawActionArrow(
              cellX + this.cellSize / 2,
              cellY + this.cellSize * 0.75,
              Math.PI,
              displayValues[1],
              showPolicy || animationProgress > 0,
              arrowLength,
              arrowWidth
            );
            
            // Left arrow
            this.drawActionArrow(
              cellX + this.cellSize * 0.25,
              cellY + this.cellSize / 2,
              -Math.PI / 2,
              displayValues[2],
              showPolicy || animationProgress > 0,
              arrowLength,
              arrowWidth
            );
            
            // Right arrow
            this.drawActionArrow(
              cellX + this.cellSize * 0.75,
              cellY + this.cellSize / 2,
              Math.PI / 2,
              displayValues[3],
              showPolicy || animationProgress > 0,
              arrowLength,
              arrowWidth
            );
            
            // Draw values/probabilities as text
            this.ctx.font = `${Math.max(8, this.cellSize * 0.15)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = showPolicy || animationProgress > 0 
              ? 'rgba(34, 197, 94, 0.95)' 
              : 'rgba(255, 255, 255, 0.9)';
            
            // Up (top center)
            this.ctx.fillText(
              (showPolicy || animationProgress > 0) 
                ? displayValues[0].toFixed(2) 
                : (qValues?.[0]?.toFixed(1) || '0.0'),
              cellX + this.cellSize / 2,
              cellY + this.cellSize * 0.15
            );
            
            // Down (bottom center)
            this.ctx.fillText(
              (showPolicy || animationProgress > 0) 
                ? displayValues[1].toFixed(2) 
                : (qValues?.[1]?.toFixed(1) || '0.0'),
              cellX + this.cellSize / 2,
              cellY + this.cellSize * 0.85
            );
            
            // Left (left center)
            this.ctx.fillText(
              (showPolicy || animationProgress > 0) 
                ? displayValues[2].toFixed(2) 
                : (qValues?.[2]?.toFixed(1) || '0.0'),
              cellX + this.cellSize * 0.15,
              cellY + this.cellSize / 2
            );
            
            // Right (right center)
            this.ctx.fillText(
              (showPolicy || animationProgress > 0) 
                ? displayValues[3].toFixed(2) 
                : (qValues?.[3]?.toFixed(1) || '0.0'),
              cellX + this.cellSize * 0.85,
              cellY + this.cellSize / 2
            );
            
            // Draw best action indicator in center
            this.ctx.font = `${this.cellSize * 0.4}px Arial`;
            this.ctx.fillStyle = showPolicy || animationProgress > 0
              ? 'rgba(34, 197, 94, 0.9)'
              : 'rgba(139, 92, 246, 0.9)';
            this.ctx.fillText(
              actionArrows[bestAction],
              cellX + this.cellSize / 2,
              cellY + this.cellSize / 2 + this.cellSize * 0.15
            );
          }
        }
      }
    }

    // Draw obstacles with fire emoji
    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    this.obstacles.forEach(obs => {
      // Draw background
      this.ctx.fillRect(
        obs.col * this.cellSize + 2,
        obs.row * this.cellSize + 2,
        this.cellSize - 4,
        this.cellSize - 4
      );
      // Draw fire emoji
      this.ctx.font = `${this.cellSize * 0.6}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        '🔥',
        obs.col * this.cellSize + this.cellSize / 2,
        obs.row * this.cellSize + this.cellSize / 2
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

  private drawActionArrow(x: number, y: number, angle: number, value: number, isPolicy: boolean, length: number, width: number): void {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    
    // Set opacity and thickness based on value
    const opacity = isPolicy ? value : Math.min(1, (value + 5) / 10); // Normalize Q-values roughly
    const arrowWidth = isPolicy ? width * (0.5 + value * 2) : width;
    
    this.ctx.strokeStyle = isPolicy 
      ? `rgba(34, 197, 94, ${opacity})`
      : `rgba(139, 92, 246, ${opacity})`;
    this.ctx.lineWidth = arrowWidth;
    this.ctx.lineCap = 'round';
    
    // Draw arrow line
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, -length);
    this.ctx.stroke();
    
    // Draw arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(0, -length);
    this.ctx.lineTo(-arrowWidth * 2, -length + arrowWidth * 2);
    this.ctx.lineTo(arrowWidth * 2, -length + arrowWidth * 2);
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
  }

  renderRewardFunction(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = Math.min(canvas.width, canvas.height) / this.gridSize;
    canvas.width = this.gridSize * cellSize;
    canvas.height = this.gridSize * cellSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find min and max rewards for color scaling
    const rewards: number[] = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const state = { row, col };
        rewards.push(this.getRewardForState(state));
      }
    }
    const minReward = Math.min(...rewards);
    const maxReward = Math.max(...rewards);
    const rewardRange = maxReward - minReward || 1;

    // Draw grid with color-coded rewards
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const state = { row, col };
        const reward = this.getRewardForState(state);
        
        // Normalize reward to 0-1 for color mapping
        const normalized = (reward - minReward) / rewardRange;
        
        // Color: red for negative, green for positive
        let r, g, b;
        if (reward < 0) {
          r = 239;
          g = 68;
          b = 68;
        } else {
          r = 34;
          g = 197;
          b = 94;
        }
        
        const alpha = Math.min(0.8, 0.3 + Math.abs(normalized) * 0.5);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);

        // Draw reward value
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `${cellSize * 0.25}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          reward.toFixed(1),
          col * cellSize + cellSize / 2,
          row * cellSize + cellSize / 2
        );

        // Draw special markers
        const isObstacle = this.obstacles.some(obs => obs.row === row && obs.col === col);
        const isGoal = row === this.goalPos.row && col === this.goalPos.col;
        
        if (isObstacle) {
          ctx.font = `${cellSize * 0.5}px Arial`;
          ctx.fillText('🔥', col * cellSize + cellSize / 2, row * cellSize + cellSize / 2 - cellSize * 0.15);
        }
        if (isGoal) {
          ctx.font = `${cellSize * 0.4}px Arial`;
          ctx.fillText('🎯', col * cellSize + cellSize / 2, row * cellSize + cellSize / 2 - cellSize * 0.2);
        }
      }
    }
  }
}

