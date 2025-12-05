// Simplified SAC Algorithm (Soft Actor-Critic)

import { RLAlgorithm } from './base';
import { Pendulum, PendulumState } from '../environments/pendulum';

declare const tf: any;

export class SAC implements RLAlgorithm {
  private actorNet: any;
  private criticNet1: any;
  private criticNet2: any;
  private optimizer: any;
  private replayBuffer: Array<{ state: number[]; action: number; reward: number; nextState: number[]; done: boolean }> = [];
  private bufferSize: number = 10000;
  private batchSize: number = 64;
  private learningRate: number = 0.0003;
  private discountFactor: number = 0.99;
  private env: Pendulum;
  private lastLoss: number = 0;

  constructor(env: Pendulum, learningRate: number = 0.0003, discountFactor: number = 0.99) {
    this.env = env;
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.initializeNetworks();
  }

  private initializeNetworks(): void {
    // Actor: outputs mean and std for action distribution
    this.actorNet = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [3], units: 256, activation: 'relu' }),
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dense({ units: 2 }) // mean and log_std
      ]
    });

    // Twin critics
    this.criticNet1 = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 256, activation: 'relu' }), // state + action
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    this.criticNet2 = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 256, activation: 'relu' }),
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    this.optimizer = tf.train.adam(this.learningRate);
  }

  selectAction(_state: PendulumState, training: boolean = true): number {
    const stateArray = this.env.getStateArray();
    const stateTensor = tf.tensor2d([stateArray]);
    const output = this.actorNet.predict(stateTensor);
    const [mean, logStd] = output.arraySync()[0];
    const std = Math.exp(Math.max(-20, Math.min(2, logStd)));
    
    stateTensor.dispose();
    output.dispose();

    if (training) {
      // Sample from normal distribution
      const noise = this.sampleNormal(0, std);
      return Math.max(-2, Math.min(2, mean + noise));
    }

    return Math.max(-2, Math.min(2, mean));
  }

  private sampleNormal(_mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * std;
  }

  update(_state: PendulumState, action: number, reward: number, _nextState: PendulumState, done: boolean): void {
    const stateArray = this.env.getStateArray();
    const nextStateArray = this.env.getStateArray();
    
    this.replayBuffer.push({
      state: stateArray,
      action,
      reward,
      nextState: nextStateArray,
      done
    });

    if (this.replayBuffer.length > this.bufferSize) {
      this.replayBuffer.shift();
    }

    if (this.replayBuffer.length >= this.batchSize) {
      this.train();
    }
  }

  private train(): void {
    // Sample batch
    interface ReplaySample {
      state: number[];
      action: number;
      reward: number;
      nextState: number[];
      done: boolean;
    }
    const batch: ReplaySample[] = [];
    for (let i = 0; i < this.batchSize; i++) {
      batch.push(this.replayBuffer[Math.floor(Math.random() * this.replayBuffer.length)]);
    }

    // Simplified SAC update (very simplified)
    const states = tf.tensor2d(batch.map(b => b.state));
    const actions = tf.tensor2d(batch.map(b => [b.action]));
    const rewards = tf.tensor1d(batch.map(b => b.reward));
    const nextStates = tf.tensor2d(batch.map(b => b.nextState));
    const dones = tf.tensor1d(batch.map(b => b.done ? 1 : 0));

    // Critic update (simplified)
    const loss = () => {
      const stateActions = tf.concat([states, actions], 1);
      const q1 = this.criticNet1.apply(stateActions);
      const q2 = this.criticNet2.apply(stateActions);
      
      // Simplified target (would normally use actor network for next action)
      const nextActions = tf.tensor2d(batch.map(() => [0]) as number[][]);
      const nextStateActions = tf.concat([nextStates, nextActions], 1);
      const nextQ1 = this.criticNet1.apply(nextStateActions);
      const nextQ2 = this.criticNet2.apply(nextStateActions);
      const nextQ = tf.minimum(nextQ1, nextQ2);
      
      const targets = tf.add(rewards, tf.mul(tf.mul(tf.sub(1, dones), this.discountFactor), nextQ.squeeze()));
      
      const loss1 = tf.losses.meanSquaredError(targets, q1.squeeze());
      const loss2 = tf.losses.meanSquaredError(targets, q2.squeeze());
      
      return tf.add(loss1, loss2);
    };

    this.optimizer.minimize(loss);
    this.lastLoss = loss().dataSync()[0];

    states.dispose();
    actions.dispose();
    rewards.dispose();
    nextStates.dispose();
    dones.dispose();
  }

  getQValues(_state: PendulumState): number[] {
    // Return action probabilities (simplified)
    return [0.5, 0.5];
  }

  getLoss(): number {
    return this.lastLoss;
  }

  reset(): void {
    this.replayBuffer = [];
    this.lastLoss = 0;
    this.initializeNetworks();
  }

  setHyperparameters(params: { learningRate?: number; discountFactor?: number }): void {
    if (params.learningRate !== undefined) {
      this.learningRate = params.learningRate;
      this.optimizer = tf.train.adam(this.learningRate);
    }
    if (params.discountFactor !== undefined) this.discountFactor = params.discountFactor;
  }
}

