// REINFORCE Algorithm (Policy-Based)

import { RLAlgorithm } from './base';
import { CartPole, CartPoleState } from '../environments/cartpole';

declare const tf: any;

export class REINFORCE implements RLAlgorithm {
  private policyNet: any;
  private optimizer: any;
  private episodeStates: number[][] = [];
  private episodeActions: number[] = [];
  private episodeRewards: number[] = [];
  private learningRate: number = 0.01;
  private discountFactor: number = 0.99;
  private env: CartPole;
  private lastLoss: number = 0;

  constructor(env: CartPole, learningRate: number = 0.01, discountFactor: number = 0.99) {
    this.env = env;
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.initializeNetwork();
  }

  private initializeNetwork(): void {
    this.policyNet = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 2, activation: 'softmax' })
      ]
    });

    this.optimizer = tf.train.adam(this.learningRate);
  }

  selectAction(_state: CartPoleState, training: boolean = true): number {
    const stateArray = this.env.getStateArray();
    const stateTensor = tf.tensor2d([stateArray]);
    const probs = this.policyNet.predict(stateTensor);
    const probsArray = probs.arraySync()[0];
    
    stateTensor.dispose();
    probs.dispose();

    if (training) {
      // Sample from distribution
      const rand = Math.random();
      let cumProb = 0;
      for (let i = 0; i < probsArray.length; i++) {
        cumProb += probsArray[i];
        if (rand < cumProb) {
          return i;
        }
      }
    }

    // Greedy action
    return probsArray[0] > probsArray[1] ? 0 : 1;
  }

  update(_state: CartPoleState, action: number, reward: number, _nextState: CartPoleState, done: boolean): void {
    this.episodeStates.push(this.env.getStateArray());
    this.episodeActions.push(action);
    this.episodeRewards.push(reward);

    if (done) {
      this.trainEpisode();
    }
  }

  private trainEpisode(): void {
    if (this.episodeStates.length === 0) return;

    // Calculate discounted returns
    const returns: number[] = [];
    let G = 0;
    for (let i = this.episodeRewards.length - 1; i >= 0; i--) {
      G = this.episodeRewards[i] + this.discountFactor * G;
      returns.unshift(G);
    }

    // Normalize returns
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length);
    const normalizedReturns = returns.map(r => (r - mean) / (std + 1e-8));

    // Train
    const statesTensor = tf.tensor2d(this.episodeStates);
    const actionsTensor = tf.tensor1d(this.episodeActions, 'int32');
    const returnsTensor = tf.tensor1d(normalizedReturns);

    const loss = () => {
      const probs = this.policyNet.apply(statesTensor);
      const actionProbs = tf.gather(probs, actionsTensor, 1);
      const logProbs = tf.log(actionProbs + 1e-8);
      const weightedLogProbs = tf.mul(logProbs, returnsTensor);
      return tf.neg(tf.mean(weightedLogProbs));
    };

    this.optimizer.minimize(loss);
    this.lastLoss = loss().dataSync()[0];

    statesTensor.dispose();
    actionsTensor.dispose();
    returnsTensor.dispose();

    // Clear episode
    this.episodeStates = [];
    this.episodeActions = [];
    this.episodeRewards = [];
  }

  getQValues(_state: CartPoleState): number[] {
    const stateArray = this.env.getStateArray();
    const stateTensor = tf.tensor2d([stateArray]);
    const probs = this.policyNet.predict(stateTensor);
    const probsArray = probs.arraySync()[0];
    
    stateTensor.dispose();
    probs.dispose();
    
    return probsArray;
  }

  getLoss(): number {
    return this.lastLoss;
  }

  reset(): void {
    this.episodeStates = [];
    this.episodeActions = [];
    this.episodeRewards = [];
    this.lastLoss = 0;
    this.initializeNetwork();
  }

  setHyperparameters(params: { learningRate?: number; discountFactor?: number }): void {
    if (params.learningRate !== undefined) {
      this.learningRate = params.learningRate;
      this.optimizer = tf.train.adam(this.learningRate);
    }
    if (params.discountFactor !== undefined) this.discountFactor = params.discountFactor;
  }
}

