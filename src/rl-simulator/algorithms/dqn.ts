// Simplified DQN Algorithm (Deep Q-Network)

import { RLAlgorithm } from './base';
import { GridWorld, GridWorldState } from '../environments/gridworld';

declare const tf: any;

export class DQN implements RLAlgorithm {
  private qNetwork: any;
  private targetNetwork: any;
  private optimizer: any;
  private replayBuffer: Array<{ state: GridWorldState; action: number; reward: number; nextState: GridWorldState; done: boolean }> = [];
  private bufferSize: number = 1000;
  private batchSize: number = 32;
  private learningRate: number = 0.001;
  private discountFactor: number = 0.95;
  private epsilon: number = 0.1;
  private epsilonDecay: number = 0.995;
  private epsilonMin: number = 0.01;
  private targetUpdateFreq: number = 10;
  private updateCounter: number = 0;
  private env: GridWorld;
  private lastLoss: number = 0;

  constructor(env: GridWorld, learningRate: number = 0.001, discountFactor: number = 0.95, epsilon: number = 0.1) {
    this.env = env;
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.epsilon = epsilon;
    this.initializeNetworks();
  }

  private stateToTensor(state: GridWorldState): any {
    // One-hot encoding of state
    const stateArray = new Array(this.env.getNumStates()).fill(0);
    const stateKey = this.env.getStateKey(state);
    const [row, col] = stateKey.split(',').map(Number);
    stateArray[row * 10 + col] = 1;
    return tf.tensor2d([stateArray]);
  }

  private initializeNetworks(): void {
    this.qNetwork = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [this.env.getNumStates()], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: this.env.getNumActions() })
      ]
    });

    this.targetNetwork = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [this.env.getNumStates()], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: this.env.getNumActions() })
      ]
    });

    this.updateTargetNetwork();
    this.optimizer = tf.train.adam(this.learningRate);
  }

  private updateTargetNetwork(): void {
    this.targetNetwork.setWeights(this.qNetwork.getWeights().map((w: any) => w.clone()));
  }

  selectAction(state: GridWorldState, training: boolean = true): number {
    if (training && Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.env.getNumActions());
    }

    const stateTensor = this.stateToTensor(state);
    const qValues = this.qNetwork.predict(stateTensor);
    const action = qValues.argMax(1).dataSync()[0];
    
    stateTensor.dispose();
    qValues.dispose();
    
    return action;
  }

  update(state: GridWorldState, action: number, reward: number, nextState: GridWorldState, done: boolean): void {
    // Store in replay buffer
    this.replayBuffer.push({ state, action, reward, nextState, done });
    if (this.replayBuffer.length > this.bufferSize) {
      this.replayBuffer.shift();
    }

    // Train if we have enough samples
    if (this.replayBuffer.length >= this.batchSize) {
      this.train();
    }

    // Decay epsilon
    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
  }

  private train(): void {
    // Sample batch
    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      batch.push(this.replayBuffer[Math.floor(Math.random() * this.replayBuffer.length)]);
    }

    const states = batch.map(b => this.stateToTensor(b.state));
    const nextStates = batch.map(b => this.stateToTensor(b.nextState));
    const statesBatch = tf.concat(states);
    const nextStatesBatch = tf.concat(nextStates);

    // Get current Q values
    const currentQValues = this.qNetwork.apply(statesBatch);
    
    // Get next Q values from target network
    const nextQValues = this.targetNetwork.apply(nextStatesBatch);
    const maxNextQ = nextQValues.max(1);

    // Compute targets
    const targets = currentQValues.arraySync();
    for (let i = 0; i < batch.length; i++) {
      const target = batch[i].reward + (batch[i].done ? 0 : this.discountFactor * maxNextQ.dataSync()[i]);
      targets[i][batch[i].action] = target;
    }

    const targetsTensor = tf.tensor2d(targets);

    // Train
    const loss = () => {
      const predictions = this.qNetwork.apply(statesBatch);
      return tf.losses.meanSquaredError(targetsTensor, predictions);
    };

    this.optimizer.minimize(loss);
    this.lastLoss = loss().dataSync()[0];

    // Update target network
    this.updateCounter++;
    if (this.updateCounter % this.targetUpdateFreq === 0) {
      this.updateTargetNetwork();
    }

    // Cleanup
    states.forEach(t => t.dispose());
    nextStates.forEach(t => t.dispose());
    statesBatch.dispose();
    nextStatesBatch.dispose();
    currentQValues.dispose();
    nextQValues.dispose();
    maxNextQ.dispose();
    targetsTensor.dispose();
  }

  getQValues(state: GridWorldState): number[] {
    const stateTensor = this.stateToTensor(state);
    const qValues = this.qNetwork.predict(stateTensor);
    const qArray = qValues.arraySync()[0];
    
    stateTensor.dispose();
    qValues.dispose();
    
    return qArray;
  }

  getLoss(): number {
    return this.lastLoss;
  }

  reset(): void {
    this.replayBuffer = [];
    this.epsilon = 0.1;
    this.updateCounter = 0;
    this.lastLoss = 0;
    this.initializeNetworks();
  }

  setHyperparameters(params: { learningRate?: number; discountFactor?: number; epsilon?: number }): void {
    if (params.learningRate !== undefined) {
      this.learningRate = params.learningRate;
      this.optimizer = tf.train.adam(this.learningRate);
    }
    if (params.discountFactor !== undefined) this.discountFactor = params.discountFactor;
    if (params.epsilon !== undefined) this.epsilon = params.epsilon;
  }
}

