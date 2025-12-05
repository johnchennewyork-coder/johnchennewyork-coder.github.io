// Base interfaces and types for RL algorithms

export interface RLAlgorithm {
  selectAction(state: any, training?: boolean): number;
  update(state: any, action: number, reward: number, nextState: any, done: boolean): void;
  reset(): void;
  getQValues?(state: any): number[];
  getLoss?(): number;
}

export interface TrainingStats {
  episode: number;
  step: number;
  reward: number;
  totalReward: number;
  averageReward: number;
  loss?: number;
}

