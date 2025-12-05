// Simplified A3C Algorithm (Asynchronous Advantage Actor-Critic)

import { RLAlgorithm } from './base';
import { CartPole, CartPoleState } from '../environments/cartpole';

declare const tf: any;

export class A3C implements RLAlgorithm {
  private actorNet: any;
  private criticNet: any;
  private optimizer: any;
  private episodeStates: number[][] = [];
  private episodeActions: number[] = [];
  private episodeRewards: number[] = [];
  private learningRate: number = 0.0001;
  private discountFactor: number = 0.99;
  private entropyCoeff: number = 0.01;
  private env: CartPole;
  private lastLoss: number = 0;

  constructor(env: CartPole, learningRate: number = 0.0001, discountFactor: number = 0.99) {
    this.env = env;
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.initializeNetworks();
  }

  private initializeNetworks(): void {
    this.actorNet = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 2, activation: 'softmax' })
      ]
    });

    this.criticNet = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    this.optimizer = tf.train.adam(this.learningRate);
  }

  selectAction(_state: CartPoleState, training: boolean = true): number {
    const stateArray = this.env.getStateArray();
    const stateTensor = tf.tensor2d([stateArray]);
    const probs = this.actorNet.predict(stateTensor);
    const probsArray = probs.arraySync()[0];
    
    stateTensor.dispose();
    probs.dispose();

    if (training) {
      const rand = Math.random();
      let cumProb = 0;
      for (let i = 0; i < probsArray.length; i++) {
        cumProb += probsArray[i];
        if (rand < cumProb) {
          return i;
        }
      }
    }

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

    // Calculate returns and advantages
    const returns: number[] = [];
    let G = 0;
    for (let i = this.episodeRewards.length - 1; i >= 0; i--) {
      G = this.episodeRewards[i] + this.discountFactor * G;
      returns.unshift(G);
    }

    const statesTensor = tf.tensor2d(this.episodeStates);
    const values = this.criticNet.predict(statesTensor);
    const valuesArray = values.arraySync().flat();
    
    const advantages = returns.map((r, i) => r - valuesArray[i]);
    const meanAdv = advantages.reduce((a, b) => a + b, 0) / advantages.length;
    const stdAdv = Math.sqrt(advantages.reduce((sum, a) => sum + Math.pow(a - meanAdv, 2), 0) / advantages.length);
    const normalizedAdvantages = advantages.map(a => (a - meanAdv) / (stdAdv + 1e-8));

    // A3C update
    const loss = () => {
      const probs = this.actorNet.apply(statesTensor);
      const actionProbs = tf.gather(probs, tf.tensor1d(this.episodeActions, 'int32'), 1);
      const logProbs = tf.log(actionProbs + 1e-8);
      
      // Policy loss
      const policyLoss = tf.neg(tf.mean(tf.mul(logProbs, tf.tensor1d(normalizedAdvantages))));
      
      // Entropy bonus
      const entropy = tf.neg(tf.mean(tf.sum(tf.mul(probs, tf.log(probs + 1e-8)), 1)));
      
      // Value loss
      const valueLoss = tf.losses.meanSquaredError(
        tf.tensor1d(returns),
        this.criticNet.apply(statesTensor).squeeze()
      );

      return tf.add(tf.add(policyLoss, tf.mul(entropy, this.entropyCoeff)), valueLoss);
    };

    this.optimizer.minimize(loss);
    this.lastLoss = loss().dataSync()[0];

    statesTensor.dispose();
    values.dispose();

    // Clear episode
    this.episodeStates = [];
    this.episodeActions = [];
    this.episodeRewards = [];
  }

  getQValues(_state: CartPoleState): number[] {
    const stateArray = this.env.getStateArray();
    const stateTensor = tf.tensor2d([stateArray]);
    const probs = this.actorNet.predict(stateTensor);
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

