// Main Simulator Controller

import { GridWorld } from './environments/gridworld';
import { CartPole } from './environments/cartpole';
import { Pendulum } from './environments/pendulum';
import { QLearning } from './algorithms/qlearning';
import { SARSA } from './algorithms/sarsa';

// Type guard for SARSA
function isSARSA(algorithm: RLAlgorithm): algorithm is SARSA {
  return algorithm instanceof SARSA;
}
import { ExpectedSARSA } from './algorithms/expected-sarsa';
import { REINFORCE } from './algorithms/reinforce';
import { DQN } from './algorithms/dqn';
import { PPO } from './algorithms/ppo';
import { A3C } from './algorithms/a3c';
import { SAC } from './algorithms/sac';
import { DDPG } from './algorithms/ddpg';
import { TD3 } from './algorithms/td3';
import { PlotlyManager } from './visualizations/plotly-manager';
import { ControlPanel, HyperparameterConfig } from './ui/control-panel';
import { AlgorithmSelector } from './ui/algorithm-selector';
import { EnvironmentViewer } from './ui/environment-viewer';
import { RLAlgorithm } from './algorithms/base';

export class Simulator {
  private currentEnv: GridWorld | CartPole | Pendulum | null = null;
  private currentAlgorithm: RLAlgorithm | null = null;
  private plotlyManager: PlotlyManager;
  private controlPanel: ControlPanel;
  private algorithmSelector: AlgorithmSelector;
  private environmentViewer: EnvironmentViewer;
  private environmentSelect: HTMLSelectElement;
  private trainBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private speedSlider: HTMLInputElement;
  private speedValue: HTMLElement;
  
  private isTraining: boolean = false;
  private trainingInterval: number | null = null;
  private currentSpeed: number = 1;
  private episode: number = 0;
  private step: number = 0;
  private episodeReward: number = 0;
  private totalReward: number = 0;
  private episodeRewards: number[] = [];

  constructor() {
    this.plotlyManager = new PlotlyManager();
    this.controlPanel = new ControlPanel();
    this.environmentViewer = new EnvironmentViewer();
    
    this.algorithmSelector = new AlgorithmSelector('algorithm-select', (algorithm) => {
      this.onAlgorithmChange(algorithm);
    });

    this.environmentSelect = document.getElementById('environment-select') as HTMLSelectElement;
    this.environmentSelect.addEventListener('change', () => {
      this.onEnvironmentChange(this.environmentSelect.value);
    });

    this.trainBtn = document.getElementById('train-btn') as HTMLButtonElement;
    this.stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    this.speedValue = document.getElementById('speed-value')!;

    this.trainBtn.addEventListener('click', () => this.startTraining());
    this.stopBtn.addEventListener('click', () => this.stopTraining());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.speedSlider.addEventListener('input', () => {
      this.currentSpeed = parseFloat(this.speedSlider.value);
      this.speedValue.textContent = `${this.currentSpeed.toFixed(1)}x`;
    });

    // Initialize with default
    this.onAlgorithmChange(this.algorithmSelector.getSelectedAlgorithm());
  }

  private onAlgorithmChange(algorithm: string): void {
    const info = this.algorithmSelector.getAlgorithmInfo(algorithm);
    
    // Set environment based on algorithm
    if (this.environmentSelect.value !== info.environment) {
      this.environmentSelect.value = info.environment;
    }
    
    this.onEnvironmentChange(info.environment);
    this.initializeAlgorithm(algorithm);
  }

  private onEnvironmentChange(environment: string): void {
    this.stopTraining();
    this.initializeEnvironment(environment);
    const algorithm = this.algorithmSelector.getSelectedAlgorithm();
    this.initializeAlgorithm(algorithm);
  }

  private initializeEnvironment(environment: string): void {
    const canvas = this.environmentViewer.getCanvas();
    
    if (environment === 'gridworld') {
      this.currentEnv = new GridWorld(canvas);
    } else if (environment === 'cartpole') {
      this.currentEnv = new CartPole(canvas);
    } else if (environment === 'pendulum') {
      this.currentEnv = new Pendulum(canvas);
    }

    if (this.currentEnv) {
      this.currentEnv.reset();
      this.currentEnv.render();
      this.environmentViewer.startAnimation(() => {
        if (this.currentEnv) {
          this.currentEnv.render();
        }
      });
    }
  }

  private initializeAlgorithm(algorithm: string): void {
    if (!this.currentEnv) return;

    const hyperparams = this.controlPanel.getHyperparameters();
    
    if (algorithm === 'qlearning' && this.currentEnv instanceof GridWorld) {
      this.currentAlgorithm = new QLearning(
        this.currentEnv,
        hyperparams.get('learningRate') || 0.1,
        hyperparams.get('discountFactor') || 0.95,
        hyperparams.get('epsilon') || 0.1
      );
      this.setupHyperparameters({
        learningRate: { min: 0.01, max: 1.0, step: 0.01, default: 0.1 },
        discountFactor: { min: 0.1, max: 0.99, step: 0.01, default: 0.95 },
        epsilon: { min: 0.01, max: 1.0, step: 0.01, default: 0.1 }
      });
    } else if (algorithm === 'sarsa' && this.currentEnv instanceof GridWorld) {
      this.currentAlgorithm = new SARSA(
        this.currentEnv,
        hyperparams.get('learningRate') || 0.1,
        hyperparams.get('discountFactor') || 0.95,
        hyperparams.get('epsilon') || 0.1
      );
      this.setupHyperparameters({
        learningRate: { min: 0.01, max: 1.0, step: 0.01, default: 0.1 },
        discountFactor: { min: 0.1, max: 0.99, step: 0.01, default: 0.95 },
        epsilon: { min: 0.01, max: 1.0, step: 0.01, default: 0.1 }
      });
    } else if (algorithm === 'expected-sarsa' && this.currentEnv instanceof GridWorld) {
      this.currentAlgorithm = new ExpectedSARSA(
        this.currentEnv,
        hyperparams.get('learningRate') || 0.1,
        hyperparams.get('discountFactor') || 0.95,
        hyperparams.get('epsilon') || 0.1
      );
      this.setupHyperparameters({
        learningRate: { min: 0.01, max: 1.0, step: 0.01, default: 0.1 },
        discountFactor: { min: 0.1, max: 0.99, step: 0.01, default: 0.95 },
        epsilon: { min: 0.01, max: 1.0, step: 0.01, default: 0.1 }
      });
    } else if (algorithm === 'reinforce' && this.currentEnv instanceof CartPole) {
      this.currentAlgorithm = new REINFORCE(
        this.currentEnv,
        hyperparams.get('learningRate') || 0.01,
        hyperparams.get('discountFactor') || 0.99
      );
      this.setupHyperparameters({
        learningRate: { min: 0.001, max: 0.1, step: 0.001, default: 0.01 },
        discountFactor: { min: 0.1, max: 0.99, step: 0.01, default: 0.99 }
      });
    } else if (algorithm === 'dqn' && this.currentEnv instanceof GridWorld) {
      this.currentAlgorithm = new DQN(
        this.currentEnv,
        hyperparams.get('learningRate') || 0.001,
        hyperparams.get('discountFactor') || 0.95,
        hyperparams.get('epsilon') || 0.1
      );
      this.setupHyperparameters({
        learningRate: { min: 0.0001, max: 0.01, step: 0.0001, default: 0.001 },
        discountFactor: { min: 0.1, max: 0.99, step: 0.01, default: 0.95 },
        epsilon: { min: 0.01, max: 1.0, step: 0.01, default: 0.1 }
      });
    } else if (algorithm === 'ppo' && this.currentEnv instanceof CartPole) {
      this.currentAlgorithm = new PPO(
        this.currentEnv,
        hyperparams.get('learningRate') || 0.0003,
        hyperparams.get('discountFactor') || 0.99,
        hyperparams.get('clipEpsilon') || 0.2
      );
      this.setupHyperparameters({
        learningRate: { min: 0.0001, max: 0.001, step: 0.0001, default: 0.0003 },
        discountFactor: { min: 0.1, max: 0.99, step: 0.01, default: 0.99 },
        clipEpsilon: { min: 0.1, max: 0.5, step: 0.01, default: 0.2 }
      });
    } else if (algorithm === 'a3c' && this.currentEnv instanceof CartPole) {
      this.currentAlgorithm = new A3C(
        this.currentEnv,
        hyperparams.get('learningRate') || 0.0001,
        hyperparams.get('discountFactor') || 0.99
      );
      this.setupHyperparameters({
        learningRate: { min: 0.00001, max: 0.001, step: 0.00001, default: 0.0001 },
        discountFactor: { min: 0.1, max: 0.99, step: 0.01, default: 0.99 }
      });
    } else if (algorithm === 'sac' && this.currentEnv instanceof Pendulum) {
      this.currentAlgorithm = new SAC(
        this.currentEnv,
        hyperparams.get('learningRate') || 0.0003,
        hyperparams.get('discountFactor') || 0.99
      );
      this.setupHyperparameters({
        learningRate: { min: 0.0001, max: 0.001, step: 0.0001, default: 0.0003 },
        discountFactor: { min: 0.1, max: 0.99, step: 0.01, default: 0.99 }
      });
    } else if (algorithm === 'ddpg' && this.currentEnv instanceof Pendulum) {
      this.currentAlgorithm = new DDPG(
        this.currentEnv,
        hyperparams.get('learningRate') || 0.001,
        hyperparams.get('discountFactor') || 0.99
      );
      this.setupHyperparameters({
        learningRate: { min: 0.0001, max: 0.01, step: 0.0001, default: 0.001 },
        discountFactor: { min: 0.1, max: 0.99, step: 0.01, default: 0.99 }
      });
    } else if (algorithm === 'td3' && this.currentEnv instanceof Pendulum) {
      this.currentAlgorithm = new TD3(
        this.currentEnv,
        hyperparams.get('learningRate') || 0.001,
        hyperparams.get('discountFactor') || 0.99
      );
      this.setupHyperparameters({
        learningRate: { min: 0.0001, max: 0.01, step: 0.0001, default: 0.001 },
        discountFactor: { min: 0.1, max: 0.99, step: 0.01, default: 0.99 }
      });
    }
  }

  private setupHyperparameters(config: HyperparameterConfig): void {
    this.controlPanel.createHyperparameters(config);
    
    // Update algorithm when hyperparameters change
    const sliders = document.querySelectorAll('#hyperparameters input[type="range"]');
    sliders.forEach(slider => {
      slider.addEventListener('input', () => {
        if (this.currentAlgorithm) {
          const hyperparams = this.controlPanel.getHyperparameters();
          if ('setHyperparameters' in this.currentAlgorithm) {
            (this.currentAlgorithm as any).setHyperparameters({
              learningRate: hyperparams.get('learningRate'),
              discountFactor: hyperparams.get('discountFactor'),
              epsilon: hyperparams.get('epsilon'),
              clipEpsilon: hyperparams.get('clipEpsilon')
            });
          }
        }
      });
    });
  }

  private startTraining(): void {
    if (!this.currentEnv || !this.currentAlgorithm) return;
    
    this.isTraining = true;
    this.trainBtn.disabled = true;
    this.stopBtn.disabled = false;
    
    let lastState: any = null;
    let lastAction: number | null = null;
    let lastReward: number | null = null;
    
    const step = () => {
      if (!this.isTraining || !this.currentEnv || !this.currentAlgorithm) return;
      
      const state = this.currentEnv.getState();
      const action = this.currentAlgorithm.selectAction(state, true);
      const result = this.currentEnv.step(action);
      
      // Handle SARSA on-policy update (needs next action before updating)
      if (isSARSA(this.currentAlgorithm)) {
        if (lastState !== null && lastAction !== null && lastReward !== null) {
          const nextAction = result.done ? undefined : this.currentAlgorithm.selectAction(result.nextState, true);
          this.currentAlgorithm.update(lastState, lastAction, lastReward, state, false, nextAction);
        }
        lastState = state;
        lastAction = action;
        lastReward = result.reward;
        if (result.done) {
          // Update final transition
          if (lastState !== null && lastAction !== null && lastReward !== null) {
            this.currentAlgorithm.update(lastState, lastAction, lastReward, result.nextState, true);
          }
          lastState = null;
          lastAction = null;
          lastReward = null;
        }
      } else {
        this.currentAlgorithm.update(state, action, result.reward, result.nextState, result.done);
      }
      
      this.episodeReward += result.reward;
      this.step++;
      
      // Update visualizations
      if (this.currentAlgorithm.getLoss) {
        const loss = this.currentAlgorithm.getLoss();
        if (loss > 0) {
          this.plotlyManager.updateLoss(this.step, loss);
        }
      }
      
      if (this.currentAlgorithm.getQValues) {
        const qValues = this.currentAlgorithm.getQValues(result.nextState);
        this.plotlyManager.updateQValues(qValues);
      }
      
      // Update stats
      this.updateStats();
      
      if (result.done) {
        this.episode++;
        this.episodeRewards.push(this.episodeReward);
        this.totalReward += this.episodeReward;
        this.plotlyManager.updateLearningCurve(this.episode, this.episodeReward);
        
        this.episodeReward = 0;
        this.currentEnv.reset();
        lastState = null;
        lastAction = null;
        lastReward = null;
      }
      
      const delay = Math.max(10, 100 / this.currentSpeed);
      this.trainingInterval = window.setTimeout(step, delay);
    };
    
    step();
  }

  private stopTraining(): void {
    this.isTraining = false;
    this.trainBtn.disabled = false;
    this.stopBtn.disabled = true;
    if (this.trainingInterval !== null) {
      clearTimeout(this.trainingInterval);
      this.trainingInterval = null;
    }
  }

  private reset(): void {
    this.stopTraining();
    this.episode = 0;
    this.step = 0;
    this.episodeReward = 0;
    this.totalReward = 0;
    this.episodeRewards = [];
    
    if (this.currentAlgorithm) {
      this.currentAlgorithm.reset();
    }
    
    if (this.currentEnv) {
      this.currentEnv.reset();
    }
    
    this.plotlyManager.reset();
    this.updateStats();
  }

  private updateStats(): void {
    document.getElementById('episode-count')!.textContent = this.episode.toString();
    document.getElementById('step-count')!.textContent = this.step.toString();
    document.getElementById('current-reward')!.textContent = this.episodeReward.toFixed(2);
    
    const avgReward = this.episodeRewards.length > 0
      ? this.episodeRewards.reduce((a, b) => a + b, 0) / this.episodeRewards.length
      : 0;
    document.getElementById('avg-reward')!.textContent = avgReward.toFixed(2);
  }
}

