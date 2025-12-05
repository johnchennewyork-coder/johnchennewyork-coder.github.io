// Simplified DDPG Algorithm (Deep Deterministic Policy Gradient)

import { RLAlgorithm } from './base';
import { Pendulum, PendulumState } from '../environments/pendulum';

declare const tf: any;

export class DDPG implements RLAlgorithm {
  private actorNet: any;
  private criticNet: any;
  private targetActor: any;
  private targetCritic: any;
  private optimizer: any;
  private replayBuffer: Array<{ state: number[]; action: number; reward: number; nextState: number[]; done: boolean }> = [];
  private bufferSize: number = 10000;
  private batchSize: number = 64;
  private learningRate: number = 0.001;
  private discountFactor: number = 0.99;
  private tau: number = 0.005;
  private noiseScale: number = 0.1;
  private env: Pendulum;
  private lastLoss: number = 0;

  constructor(env: Pendulum, learningRate: number = 0.001, discountFactor: number = 0.99) {
    this.env = env;
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.initializeNetworks();
  }

  private initializeNetworks(): void {
    // Actor: state -> action
    this.actorNet = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [3], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'tanh' }) // Output in [-1, 1], scale to [-2, 2]
      ]
    });

    // Critic: (state, action) -> Q-value
    this.criticNet = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 64, activation: 'relu' }), // state + action
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    // Target networks
    this.targetActor = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [3], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'tanh' })
      ]
    });

    this.targetCritic = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    this.updateTargetNetworks();
    this.optimizer = tf.train.adam(this.learningRate);
  }

  private updateTargetNetworks(): void {
    this.targetActor.setWeights(this.actorNet.getWeights().map((w: any) => w.clone()));
    this.targetCritic.setWeights(this.criticNet.getWeights().map((w: any) => w.clone()));
  }

  private softUpdate(): void {
    const actorWeights = this.actorNet.getWeights();
    const criticWeights = this.criticNet.getWeights();
    const targetActorWeights = this.targetActor.getWeights();
    const targetCriticWeights = this.targetCritic.getWeights();

    for (let i = 0; i < actorWeights.length; i++) {
      targetActorWeights[i] = tf.add(
        tf.mul(targetActorWeights[i], 1 - this.tau),
        tf.mul(actorWeights[i], this.tau)
      );
    }

    for (let i = 0; i < criticWeights.length; i++) {
      targetCriticWeights[i] = tf.add(
        tf.mul(targetCriticWeights[i], 1 - this.tau),
        tf.mul(criticWeights[i], this.tau)
      );
    }

    this.targetActor.setWeights(targetActorWeights);
    this.targetCritic.setWeights(targetCriticWeights);
  }

  selectAction(_state: PendulumState, training: boolean = true): number {
    const stateArray = this.env.getStateArray();
    const stateTensor = tf.tensor2d([stateArray]);
    const action = this.actorNet.predict(stateTensor);
    let actionValue = action.dataSync()[0] * 2; // Scale from [-1, 1] to [-2, 2]
    
    stateTensor.dispose();
    action.dispose();

    if (training) {
      // Add exploration noise
      actionValue += (Math.random() - 0.5) * this.noiseScale;
    }

    return Math.max(-2, Math.min(2, actionValue));
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
    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      batch.push(this.replayBuffer[Math.floor(Math.random() * this.replayBuffer.length)]);
    }

    const states = tf.tensor2d(batch.map(b => b.state));
    const actions = tf.tensor2d(batch.map(b => [b.action]));
    const rewards = tf.tensor1d(batch.map(b => b.reward));
    const nextStates = tf.tensor2d(batch.map(b => b.nextState));
    const dones = tf.tensor1d(batch.map(b => b.done ? 1 : 0));

    // Critic update
    const criticLoss = () => {
      const stateActions = tf.concat([states, actions], 1);
      const qValues = this.criticNet.apply(stateActions);
      
      const nextActions = this.targetActor.apply(nextStates);
      const nextStateActions = tf.concat([nextStates, nextActions], 1);
      const nextQValues = this.targetCritic.apply(nextStateActions);
      
      const targets = tf.add(rewards, tf.mul(tf.mul(tf.sub(1, dones), this.discountFactor), nextQValues.squeeze()));
      
      return tf.losses.meanSquaredError(targets, qValues.squeeze());
    };

    this.optimizer.minimize(criticLoss);
    this.lastLoss = criticLoss().dataSync()[0];

    // Actor update (simplified)
    const actorLoss = () => {
      const predictedActions = this.actorNet.apply(states);
      const statePredictedActions = tf.concat([states, predictedActions], 1);
      const qValues = this.criticNet.apply(statePredictedActions);
      return tf.neg(tf.mean(qValues));
    };

    this.optimizer.minimize(actorLoss);

    // Soft update target networks
    this.softUpdate();

    states.dispose();
    actions.dispose();
    rewards.dispose();
    nextStates.dispose();
    dones.dispose();
  }

  getQValues(_state: PendulumState): number[] {
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

