// Simplified TD3 Algorithm (Twin Delayed DDPG)

import { RLAlgorithm } from './base';
import { Pendulum, PendulumState } from '../environments/pendulum';

declare const tf: any;

export class TD3 implements RLAlgorithm {
  private actorNet: any;
  private criticNet1: any;
  private criticNet2: any;
  private targetActor: any;
  private targetCritic1: any;
  private targetCritic2: any;
  private optimizer: any;
  private replayBuffer: Array<{ state: number[]; action: number; reward: number; nextState: number[]; done: boolean }> = [];
  private bufferSize: number = 10000;
  private batchSize: number = 64;
  private learningRate: number = 0.001;
  private discountFactor: number = 0.99;
  private tau: number = 0.005;
  private noiseScale: number = 0.1;
  private policyNoise: number = 0.2;
  private policyDelay: number = 2;
  private updateCounter: number = 0;
  private env: Pendulum;
  private lastLoss: number = 0;

  constructor(env: Pendulum, learningRate: number = 0.001, discountFactor: number = 0.99) {
    this.env = env;
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.initializeNetworks();
  }

  private initializeNetworks(): void {
    // Actor
    this.actorNet = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [3], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'tanh' })
      ]
    });

    // Twin critics
    this.criticNet1 = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    this.criticNet2 = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 64, activation: 'relu' }),
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

    this.targetCritic1 = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    this.targetCritic2 = tf.sequential({
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
    this.targetCritic1.setWeights(this.criticNet1.getWeights().map((w: any) => w.clone()));
    this.targetCritic2.setWeights(this.criticNet2.getWeights().map((w: any) => w.clone()));
  }

  private softUpdate(): void {
    const actorWeights = this.actorNet.getWeights();
    const critic1Weights = this.criticNet1.getWeights();
    const critic2Weights = this.criticNet2.getWeights();
    const targetActorWeights = this.targetActor.getWeights();
    const targetCritic1Weights = this.targetCritic1.getWeights();
    const targetCritic2Weights = this.targetCritic2.getWeights();

    for (let i = 0; i < actorWeights.length; i++) {
      targetActorWeights[i] = tf.add(
        tf.mul(targetActorWeights[i], 1 - this.tau),
        tf.mul(actorWeights[i], this.tau)
      );
    }

    for (let i = 0; i < critic1Weights.length; i++) {
      targetCritic1Weights[i] = tf.add(
        tf.mul(targetCritic1Weights[i], 1 - this.tau),
        tf.mul(critic1Weights[i], this.tau)
      );
      targetCritic2Weights[i] = tf.add(
        tf.mul(targetCritic2Weights[i], 1 - this.tau),
        tf.mul(critic2Weights[i], this.tau)
      );
    }

    this.targetActor.setWeights(targetActorWeights);
    this.targetCritic1.setWeights(targetCritic1Weights);
    this.targetCritic2.setWeights(targetCritic2Weights);
  }

  selectAction(_state: PendulumState, training: boolean = true): number {
    const stateArray = this.env.getStateArray();
    const stateTensor = tf.tensor2d([stateArray]);
    const action = this.actorNet.predict(stateTensor);
    let actionValue = action.dataSync()[0] * 2;
    
    stateTensor.dispose();
    action.dispose();

    if (training) {
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

    // Critic update with twin networks
    const criticLoss = () => {
      const stateActions = tf.concat([states, actions], 1);
      const q1 = this.criticNet1.apply(stateActions);
      const q2 = this.criticNet2.apply(stateActions);
      
      // Target action with noise (delayed policy)
      const nextActions = this.targetActor.apply(nextStates);
      const noise = tf.randomNormal([this.batchSize, 1], 0, this.policyNoise);
      const clippedNoise = tf.clipByValue(noise, -0.5, 0.5);
      const noisyNextActions = tf.clipByValue(tf.add(nextActions, clippedNoise), -2, 2);
      
      const nextStateActions = tf.concat([nextStates, noisyNextActions], 1);
      const nextQ1 = this.targetCritic1.apply(nextStateActions);
      const nextQ2 = this.targetCritic2.apply(nextStateActions);
      const nextQ = tf.minimum(nextQ1, nextQ2);
      
      const targets = tf.add(rewards, tf.mul(tf.mul(tf.sub(1, dones), this.discountFactor), nextQ.squeeze()));
      
      const loss1 = tf.losses.meanSquaredError(targets, q1.squeeze());
      const loss2 = tf.losses.meanSquaredError(targets, q2.squeeze());
      
      noise.dispose();
      clippedNoise.dispose();
      
      return tf.add(loss1, loss2);
    };

    this.optimizer.minimize(criticLoss);
    this.lastLoss = criticLoss().dataSync()[0];

    // Delayed policy update
    this.updateCounter++;
    if (this.updateCounter % this.policyDelay === 0) {
      const actorLoss = () => {
        const predictedActions = this.actorNet.apply(states);
        const statePredictedActions = tf.concat([states, predictedActions], 1);
        const qValues = this.criticNet1.apply(statePredictedActions);
        return tf.neg(tf.mean(qValues));
      };

      this.optimizer.minimize(actorLoss);
      this.softUpdate();
    }

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
    this.updateCounter = 0;
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

