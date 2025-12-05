// Simplified PPO Algorithm (Proximal Policy Optimization)

import { RLAlgorithm } from './base';
import { CartPole, CartPoleState } from '../environments/cartpole';

declare const tf: any;

export class PPO implements RLAlgorithm {
  private policyNet: any;
  private valueNet: any;
  private optimizer: any;
  private episodeStates: number[][] = [];
  private episodeActions: number[] = [];
  private episodeRewards: number[] = [];
  private learningRate: number = 0.0003;
  private discountFactor: number = 0.99;
  private clipEpsilon: number = 0.2;
  private env: CartPole;
  private lastLoss: number = 0;

  constructor(env: CartPole, learningRate: number = 0.0003, discountFactor: number = 0.99, clipEpsilon: number = 0.2) {
    this.env = env;
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.clipEpsilon = clipEpsilon;
    this.initializeNetworks();
  }

  private initializeNetworks(): void {
    this.policyNet = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 64, activation: 'tanh' }),
        tf.layers.dense({ units: 64, activation: 'tanh' }),
        tf.layers.dense({ units: 2, activation: 'softmax' })
      ]
    });

    this.valueNet = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [4], units: 64, activation: 'tanh' }),
        tf.layers.dense({ units: 64, activation: 'tanh' }),
        tf.layers.dense({ units: 1 })
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

    // Calculate advantages
    const returns: number[] = [];
    let G = 0;
    for (let i = this.episodeRewards.length - 1; i >= 0; i--) {
      G = this.episodeRewards[i] + this.discountFactor * G;
      returns.unshift(G);
    }

    // Get baseline values
    const statesTensor = tf.tensor2d(this.episodeStates);
    const values = this.valueNet.predict(statesTensor);
    const valuesArray = values.arraySync().flat();
    
    // Calculate advantages
    const advantages = returns.map((r, i) => r - valuesArray[i]);
    const meanAdv = advantages.reduce((a, b) => a + b, 0) / advantages.length;
    const stdAdv = Math.sqrt(advantages.reduce((sum, a) => sum + Math.pow(a - meanAdv, 2), 0) / advantages.length);
    const normalizedAdvantages = advantages.map(a => (a - meanAdv) / (stdAdv + 1e-8));

    // Get old policy probabilities
    const oldProbs = this.policyNet.predict(statesTensor);

    // PPO update
    const loss = () => {
      const newProbs = this.policyNet.apply(statesTensor);
      const actionProbs = tf.gather(newProbs, tf.tensor1d(this.episodeActions, 'int32'), 1);
      const oldActionProbs = tf.gather(oldProbs, tf.tensor1d(this.episodeActions, 'int32'), 1);
      
      const ratio = tf.div(actionProbs, oldActionProbs + 1e-8);
      const advantagesTensor = tf.tensor1d(normalizedAdvantages);
      const clippedRatio = tf.clipByValue(ratio, 1 - this.clipEpsilon, 1 + this.clipEpsilon);
      
      const policyLoss = tf.neg(tf.mean(tf.minimum(
        tf.mul(ratio, advantagesTensor),
        tf.mul(clippedRatio, advantagesTensor)
      )));

      const valueLoss = tf.losses.meanSquaredError(
        tf.tensor1d(returns),
        this.valueNet.apply(statesTensor).squeeze()
      );

      return tf.add(policyLoss, valueLoss);
    };

    this.optimizer.minimize(loss);
    this.lastLoss = loss().dataSync()[0];

    statesTensor.dispose();
    values.dispose();
    oldProbs.dispose();

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
    this.initializeNetworks();
  }

  setHyperparameters(params: { learningRate?: number; discountFactor?: number; clipEpsilon?: number }): void {
    if (params.learningRate !== undefined) {
      this.learningRate = params.learningRate;
      this.optimizer = tf.train.adam(this.learningRate);
    }
    if (params.discountFactor !== undefined) this.discountFactor = params.discountFactor;
    if (params.clipEpsilon !== undefined) this.clipEpsilon = params.clipEpsilon;
  }
}

