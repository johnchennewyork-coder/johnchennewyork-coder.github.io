// SARSA Algorithm (On-Policy Value-Based)

import { RLAlgorithm } from './base';
import { GridWorld, GridWorldState } from '../environments/gridworld';

export class SARSA implements RLAlgorithm {
  private Q: Map<string, number[]> = new Map();
  private learningRate: number = 0.1;
  private discountFactor: number = 0.95;
  private epsilon: number = 0.1;
  private env: GridWorld;
  private lastLoss: number = 0;

  constructor(env: GridWorld, learningRate: number = 0.1, discountFactor: number = 0.95, epsilon: number = 0.1) {
    this.env = env;
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.epsilon = epsilon;
  }

  private getQ(state: GridWorldState, action: number): number {
    const key = this.env.getStateKey(state);
    if (!this.Q.has(key)) {
      this.Q.set(key, new Array(this.env.getNumActions()).fill(0));
    }
    return this.Q.get(key)![action];
  }

  private setQ(state: GridWorldState, action: number, value: number): void {
    const key = this.env.getStateKey(state);
    if (!this.Q.has(key)) {
      this.Q.set(key, new Array(this.env.getNumActions()).fill(0));
    }
    this.Q.get(key)![action] = value;
  }

  selectAction(state: GridWorldState, training: boolean = true): number {
    if (training && Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.env.getNumActions());
    }

    const key = this.env.getStateKey(state);
    if (!this.Q.has(key)) {
      this.Q.set(key, new Array(this.env.getNumActions()).fill(0));
    }
    const qValues = this.Q.get(key)!;
    const maxQ = Math.max(...qValues);
    const bestActions = qValues.map((q, idx) => q === maxQ ? idx : -1).filter(idx => idx !== -1);
    return bestActions[Math.floor(Math.random() * bestActions.length)];
  }

  update(state: GridWorldState, action: number, reward: number, nextState: GridWorldState, done: boolean, nextAction?: number): void {
    const currentQ = this.getQ(state, action);
    let nextQ = 0;

    if (!done && nextAction !== undefined) {
      nextQ = this.getQ(nextState, nextAction);
    }

    const targetQ = reward + this.discountFactor * nextQ;
    const newQ = currentQ + this.learningRate * (targetQ - currentQ);
    this.setQ(state, action, newQ);

    this.lastLoss = Math.abs(targetQ - currentQ);
  }

  getQValues(state: GridWorldState): number[] {
    const key = this.env.getStateKey(state);
    if (!this.Q.has(key)) {
      this.Q.set(key, new Array(this.env.getNumActions()).fill(0));
    }
    return [...this.Q.get(key)!];
  }

  getAllQValues(): Map<string, number[]> {
    return new Map(this.Q);
  }

  getLoss(): number {
    return this.lastLoss;
  }

  reset(): void {
    this.Q.clear();
    this.lastLoss = 0;
  }

  setHyperparameters(params: { learningRate?: number; discountFactor?: number; epsilon?: number }): void {
    if (params.learningRate !== undefined) this.learningRate = params.learningRate;
    if (params.discountFactor !== undefined) this.discountFactor = params.discountFactor;
    if (params.epsilon !== undefined) this.epsilon = params.epsilon;
  }

  isValueBased(): boolean {
    return true;
  }

  getPolicyProbabilities(state: GridWorldState, temperature: number = 1.0): number[] {
    const qValues = this.getQValues(state);
    return this.softmax(qValues, temperature);
  }

  private softmax(values: number[], temperature: number): number[] {
    const scaled = values.map(v => v / temperature);
    const maxScaled = Math.max(...scaled);
    const expValues = scaled.map(v => Math.exp(v - maxScaled));
    const sum = expValues.reduce((a, b) => a + b, 0);
    return expValues.map(v => v / sum);
  }
}

