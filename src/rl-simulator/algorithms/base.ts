// Base interfaces and types for RL algorithms

export interface RLAlgorithm {
  selectAction(state: any, training?: boolean): number;
  update(state: any, action: number, reward: number, nextState: any, done: boolean): void;
  reset(): void;
  getQValues?(state: any): number[];
  getLoss?(): number;
  isValueBased?(): boolean;
  getPolicyProbabilities?(state: any, temperature?: number): number[];
}

export enum RLParadigm {
  VALUE_BASED_OFF_POLICY = 'Value-Based (Off-Policy)',
  VALUE_BASED_ON_POLICY = 'Value-Based (On-Policy)',
  POLICY_BASED = 'Policy-Based',
  ACTOR_CRITIC_ON_POLICY = 'Actor-Critic (On-Policy)',
  ACTOR_CRITIC_OFF_POLICY = 'Actor-Critic (Off-Policy)'
}

export interface TrainingStats {
  episode: number;
  step: number;
  reward: number;
  totalReward: number;
  averageReward: number;
  loss?: number;
}

