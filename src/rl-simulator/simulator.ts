// Main Simulator Controller

declare const bootstrap: any;

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
import { RLAlgorithm, RLParadigm } from './algorithms/base';
import { PolicyTransformer } from './ui/policy-transformer';
import { TooltipManager } from './ui/tooltip-manager';

export class Simulator {
  private currentEnv: GridWorld | CartPole | Pendulum | null = null;
  private currentAlgorithm: RLAlgorithm | null = null;
  private plotlyManager: PlotlyManager;
  private controlPanel: ControlPanel;
  private algorithmSelector: AlgorithmSelector;
  private environmentViewer: EnvironmentViewer;
  private policyTransformer: PolicyTransformer;
  private environmentSelect: HTMLSelectElement;
  private trainBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private speedSlider: HTMLInputElement;
  private speedValue: HTMLElement;
  private rewardConfigSection: HTMLElement;
  private rewardVizSection: HTMLElement;
  private rewardCanvas: HTMLCanvasElement;
  private policyTransformSection: HTMLElement;
  private transformPolicyBtn: HTMLButtonElement;
  private temperatureSlider: HTMLInputElement;
  private temperatureValue: HTMLElement;
  private paradigmIndicator: HTMLElement;
  private learnsIndicator: HTMLElement;
  private viewModeIndicator: HTMLElement;
  
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
    
    this.policyTransformer = new PolicyTransformer((_state) => {
      this.updatePolicyVisualization();
    });
    
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

    // Reward configuration UI
    this.rewardConfigSection = document.getElementById('reward-config-section')!;
    this.rewardVizSection = document.getElementById('reward-viz-section')!;
    this.rewardCanvas = document.getElementById('reward-canvas') as HTMLCanvasElement;
    
    // Policy transformation UI
    this.policyTransformSection = document.getElementById('policy-transform-section')!;
    this.transformPolicyBtn = document.getElementById('transform-policy-btn') as HTMLButtonElement;
    this.temperatureSlider = document.getElementById('temperature-slider') as HTMLInputElement;
    this.temperatureValue = document.getElementById('temperature-value')!;
    this.paradigmIndicator = document.getElementById('paradigm-indicator')!;
    this.learnsIndicator = document.getElementById('learns-indicator')!;
    this.viewModeIndicator = document.getElementById('view-mode-indicator')!;
    
    this.setupRewardConfigUI();
    this.setupPolicyTransformUI();

    // Initialize tooltips for static HTML elements
    this.initializeTooltips();

    // Initialize with default - update compatibility on startup
    const defaultEnvironment = this.environmentSelect.value;
    this.algorithmSelector.updateForEnvironment(defaultEnvironment);
    // Initialize environment first, then algorithm
    this.onEnvironmentChange(defaultEnvironment);
  }

  private initializeTooltips(): void {
    // Wait for Bootstrap to be available, then initialize tooltips
    if (typeof (window as any).bootstrap !== 'undefined') {
      TooltipManager.initializeAllTooltips();
    } else {
      // If Bootstrap isn't ready yet, wait a bit and try again
      setTimeout(() => {
        if (typeof (window as any).bootstrap !== 'undefined') {
          TooltipManager.initializeAllTooltips();
        }
      }, 100);
    }
  }

  private setupPolicyTransformUI(): void {
    this.transformPolicyBtn.addEventListener('click', () => {
      this.policyTransformer.toggleTransformation();
      const state = this.policyTransformer.getState();
      this.transformPolicyBtn.textContent = state.isTransformed ? 'Transform to Q-Values' : 'Transform to Policy';
      this.updatePolicyVisualization();
    });

    this.temperatureSlider.addEventListener('input', () => {
      const temp = parseFloat(this.temperatureSlider.value);
      this.temperatureValue.textContent = temp.toFixed(1);
      this.policyTransformer.setTemperature(temp);
      this.updatePolicyVisualization();
    });
  }

  private setupRewardConfigUI(): void {
    const goalRewardSlider = document.getElementById('goal-reward') as HTMLInputElement;
    const obstaclePenaltySlider = document.getElementById('obstacle-penalty') as HTMLInputElement;
    const stepPenaltySlider = document.getElementById('step-penalty') as HTMLInputElement;
    const timePenaltySlider = document.getElementById('time-penalty') as HTMLInputElement;
    const timeThresholdSlider = document.getElementById('time-threshold') as HTMLInputElement;
    const applyBtn = document.getElementById('apply-reward-btn') as HTMLButtonElement;

    const goalRewardValue = document.getElementById('goal-reward-value')!;
    const obstaclePenaltyValue = document.getElementById('obstacle-penalty-value')!;
    const stepPenaltyValue = document.getElementById('step-penalty-value')!;
    const timePenaltyValue = document.getElementById('time-penalty-value')!;
    const timeThresholdValue = document.getElementById('time-threshold-value')!;

    goalRewardSlider.addEventListener('input', () => {
      goalRewardValue.textContent = parseFloat(goalRewardSlider.value).toFixed(1);
      this.updateRewardVisualization();
    });

    obstaclePenaltySlider.addEventListener('input', () => {
      obstaclePenaltyValue.textContent = parseFloat(obstaclePenaltySlider.value).toFixed(1);
      this.updateRewardVisualization();
    });

    stepPenaltySlider.addEventListener('input', () => {
      stepPenaltyValue.textContent = parseFloat(stepPenaltySlider.value).toFixed(2);
      this.updateRewardVisualization();
    });

    timePenaltySlider.addEventListener('input', () => {
      timePenaltyValue.textContent = parseFloat(timePenaltySlider.value).toFixed(1);
      this.updateRewardVisualization();
    });

    timeThresholdSlider.addEventListener('input', () => {
      timeThresholdValue.textContent = timeThresholdSlider.value;
      this.updateRewardVisualization();
    });

    applyBtn.addEventListener('click', () => {
      if (this.currentEnv instanceof GridWorld) {
        this.currentEnv.setRewardConfig({
          goalReward: parseFloat(goalRewardSlider.value),
          obstaclePenalty: parseFloat(obstaclePenaltySlider.value),
          stepPenalty: parseFloat(stepPenaltySlider.value),
          timePenalty: parseFloat(timePenaltySlider.value),
          timePenaltyThreshold: parseInt(timeThresholdSlider.value)
        });
        this.updateRewardVisualization();
      }
    });
  }

  private updateRewardVisualization(): void {
    if (this.currentEnv instanceof GridWorld && this.rewardCanvas) {
      // Set canvas size
      const container = this.rewardCanvas.parentElement;
      if (container) {
        const maxSize = Math.min(container.clientWidth - 32, 400);
        this.rewardCanvas.width = maxSize;
        this.rewardCanvas.height = maxSize;
      }
      this.currentEnv.renderRewardFunction(this.rewardCanvas);
    }
  }


  private onAlgorithmChange(algorithm: string): void {
    const info = this.algorithmSelector.getAlgorithmInfo(algorithm);
    
    // Check if current environment is compatible with the selected algorithm
    const compatibleEnvironments = this.algorithmSelector.getCompatibleEnvironments(algorithm);
    const currentEnv = this.environmentSelect.value;
    
    // If current environment is incompatible, switch to algorithm's default
    if (!compatibleEnvironments.includes(currentEnv)) {
      this.environmentSelect.value = info.environment;
      // Trigger environment change to update everything
      this.onEnvironmentChange(info.environment);
      return; // onEnvironmentChange will call initializeAlgorithm
    }
    
    // Update paradigm indicators
    this.updateParadigmIndicators(algorithm, info);
    
    // Show reward config only for Q-Learning with GridWorld
    const showRewardConfig = algorithm === 'qlearning' && currentEnv === 'gridworld';
    if (this.rewardConfigSection) {
      this.rewardConfigSection.style.display = showRewardConfig ? 'block' : 'none';
    }
    if (this.rewardVizSection) {
      this.rewardVizSection.style.display = showRewardConfig ? 'block' : 'none';
    }
    
    // Show policy transform only for value-based methods with GridWorld
    const showPolicyTransform = this.isValueBasedAlgorithm(algorithm) && currentEnv === 'gridworld';
    if (this.policyTransformSection) {
      this.policyTransformSection.style.display = showPolicyTransform ? 'block' : 'none';
    }
    
    // Reset policy transformer when changing algorithms
    this.policyTransformer.reset();
    
    // Use current environment, not algorithm's default
    this.initializeAlgorithm(algorithm);
    
    if (showRewardConfig && this.currentEnv instanceof GridWorld) {
      // Initialize reward config sliders with current values
      const config = this.currentEnv.getRewardConfig();
      const goalRewardSlider = document.getElementById('goal-reward') as HTMLInputElement;
      const obstaclePenaltySlider = document.getElementById('obstacle-penalty') as HTMLInputElement;
      const stepPenaltySlider = document.getElementById('step-penalty') as HTMLInputElement;
      const timePenaltySlider = document.getElementById('time-penalty') as HTMLInputElement;
      const timeThresholdSlider = document.getElementById('time-threshold') as HTMLInputElement;
      
      if (goalRewardSlider) {
        goalRewardSlider.value = config.goalReward.toString();
        document.getElementById('goal-reward-value')!.textContent = config.goalReward.toFixed(1);
      }
      if (obstaclePenaltySlider) {
        obstaclePenaltySlider.value = config.obstaclePenalty.toString();
        document.getElementById('obstacle-penalty-value')!.textContent = config.obstaclePenalty.toFixed(1);
      }
      if (stepPenaltySlider) {
        stepPenaltySlider.value = config.stepPenalty.toString();
        document.getElementById('step-penalty-value')!.textContent = config.stepPenalty.toFixed(2);
      }
      if (timePenaltySlider) {
        timePenaltySlider.value = config.timePenalty.toString();
        document.getElementById('time-penalty-value')!.textContent = config.timePenalty.toFixed(1);
      }
      if (timeThresholdSlider) {
        timeThresholdSlider.value = config.timePenaltyThreshold.toString();
        document.getElementById('time-threshold-value')!.textContent = config.timePenaltyThreshold.toString();
      }
      
      this.updateRewardVisualization();
    }
  }

  private onEnvironmentChange(environment: string): void {
    this.stopTraining();
    // Update algorithm options based on environment compatibility
    this.algorithmSelector.updateForEnvironment(environment);
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
      if (this.currentEnv instanceof GridWorld && this.currentAlgorithm?.getQValues) {
        // Initialize Q-values map for GridWorld
        let qValuesMap: Map<string, number[]>;
        if ('getAllQValues' in this.currentAlgorithm && typeof (this.currentAlgorithm as any).getAllQValues === 'function') {
          qValuesMap = (this.currentAlgorithm as any).getAllQValues();
        } else {
          qValuesMap = new Map<string, number[]>();
          for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
              const state = { row, col };
              const qValues = this.currentAlgorithm.getQValues(state);
              qValuesMap.set(this.currentEnv.getStateKey(state), qValues);
            }
          }
        }
        this.currentEnv.render(qValuesMap);
      } else {
        this.currentEnv.render();
      }
      
      // Update reward visualization
      if (this.currentEnv instanceof GridWorld) {
        this.updateRewardVisualization();
      }
      
      this.environmentViewer.startAnimation(() => {
        if (this.currentEnv) {
          if (this.currentEnv instanceof GridWorld && this.currentAlgorithm?.getQValues) {
            let qValuesMap: Map<string, number[]>;
            if ('getAllQValues' in this.currentAlgorithm && typeof (this.currentAlgorithm as any).getAllQValues === 'function') {
              qValuesMap = (this.currentAlgorithm as any).getAllQValues();
            } else {
              qValuesMap = new Map<string, number[]>();
              for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 6; col++) {
                  const state = { row, col };
                  const qValues = this.currentAlgorithm.getQValues(state);
                  qValuesMap.set(this.currentEnv.getStateKey(state), qValues);
                }
              }
            }
            this.currentEnv.render(qValuesMap);
          } else {
            this.currentEnv.render();
          }
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
    // Dispose existing tooltips in hyperparameters container before recreating
    const existingTooltips = document.querySelectorAll('#hyperparameters [data-bs-toggle="tooltip"]');
    existingTooltips.forEach(element => {
      const tooltipInstance = (bootstrap as any).Tooltip.getInstance(element);
      if (tooltipInstance) {
        tooltipInstance.dispose();
      }
    });
    
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
          const nextAction = result.done ? undefined : this.currentAlgorithm.selectAction(result.nextState as any, true);
          this.currentAlgorithm.update(lastState as any, lastAction, lastReward, state as any, false, nextAction);
        }
        lastState = state;
        lastAction = action;
        lastReward = result.reward;
        if (result.done) {
          // Update final transition
          if (lastState !== null && lastAction !== null && lastReward !== null) {
            this.currentAlgorithm.update(lastState as any, lastAction, lastReward, result.nextState as any, true);
          }
          lastState = null;
          lastAction = null;
          lastReward = null;
        }
      } else {
        this.currentAlgorithm.update(state as any, action, result.reward, result.nextState as any, result.done);
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
      
      // Update Q-values visualization
      if (this.currentAlgorithm.getQValues) {
        const qValues = this.currentAlgorithm.getQValues(result.nextState as any);
        this.plotlyManager.updateQValues(qValues);
      }
      
      // Update grid with Q-values or policy if it's GridWorld
      if (this.currentEnv instanceof GridWorld && this.currentAlgorithm.getQValues) {
        this.updatePolicyVisualization();
      } else if (this.currentEnv) {
        this.currentEnv.render();
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
      this.updatePolicyVisualization();
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

  private updateParadigmIndicators(algorithm: string, _info: any): void {
    const paradigmMap: Record<string, { paradigm: string; learns: string }> = {
      'qlearning': { paradigm: RLParadigm.VALUE_BASED_OFF_POLICY, learns: 'Q-values (Q(s,a))' },
      'dqn': { paradigm: RLParadigm.VALUE_BASED_OFF_POLICY, learns: 'Q-values (Q(s,a))' },
      'sarsa': { paradigm: RLParadigm.VALUE_BASED_ON_POLICY, learns: 'Q-values (Q(s,a))' },
      'expected-sarsa': { paradigm: RLParadigm.VALUE_BASED_ON_POLICY, learns: 'Q-values (Q(s,a))' },
      'reinforce': { paradigm: RLParadigm.POLICY_BASED, learns: 'Policy probabilities (π(a|s))' },
      'ppo': { paradigm: RLParadigm.POLICY_BASED, learns: 'Policy probabilities (π(a|s))' },
      'a3c': { paradigm: RLParadigm.ACTOR_CRITIC_ON_POLICY, learns: 'Both policy (π) and value (V)' },
      'sac': { paradigm: RLParadigm.ACTOR_CRITIC_OFF_POLICY, learns: 'Both policy (π) and Q-values (Q)' },
      'ddpg': { paradigm: RLParadigm.ACTOR_CRITIC_OFF_POLICY, learns: 'Both policy (π) and Q-values (Q)' },
      'td3': { paradigm: RLParadigm.ACTOR_CRITIC_OFF_POLICY, learns: 'Both policy (π) and Q-values (Q)' }
    };

    const indicators = paradigmMap[algorithm] || { paradigm: 'Unknown', learns: 'Unknown' };
    if (this.paradigmIndicator) {
      this.paradigmIndicator.textContent = indicators.paradigm;
    }
    if (this.learnsIndicator) {
      this.learnsIndicator.textContent = indicators.learns;
    }
  }

  private isValueBasedAlgorithm(algorithm: string): boolean {
    return ['qlearning', 'dqn', 'sarsa', 'expected-sarsa'].includes(algorithm);
  }

  private updatePolicyVisualization(): void {
    if (!(this.currentEnv instanceof GridWorld) || !this.currentAlgorithm?.getQValues) {
      return;
    }

    const transformState = this.policyTransformer.getState();
    const showPolicy = transformState.isTransformed;
    const animationProgress = transformState.animationProgress;

    // Get Q-values map
    let qValuesMap: Map<string, number[]>;
    if ('getAllQValues' in this.currentAlgorithm && typeof (this.currentAlgorithm as any).getAllQValues === 'function') {
      qValuesMap = (this.currentAlgorithm as any).getAllQValues();
    } else {
      qValuesMap = new Map<string, number[]>();
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          const state = { row, col };
          const qValues = this.currentAlgorithm.getQValues!(state);
          qValuesMap.set(this.currentEnv.getStateKey(state), qValues);
        }
      }
    }

    // Get policy probabilities map if transformed
    let policyMap: Map<string, number[]> | undefined;
    if (showPolicy || animationProgress > 0) {
      policyMap = new Map<string, number[]>();
      const temperature = transformState.temperature;
      
      if (this.currentAlgorithm.getPolicyProbabilities) {
        for (let row = 0; row < 6; row++) {
          for (let col = 0; col < 6; col++) {
            const state = { row, col };
            const probs = this.currentAlgorithm.getPolicyProbabilities!(state, temperature);
            policyMap.set(this.currentEnv.getStateKey(state), probs);
          }
        }
      }
    }

    // Update view mode indicator
    if (this.viewModeIndicator) {
      this.viewModeIndicator.textContent = showPolicy ? 'Policy Probabilities' : 'Q-Values';
    }

    // Render with appropriate mode
    this.currentEnv.render(qValuesMap, policyMap, showPolicy, animationProgress);
  }
}

