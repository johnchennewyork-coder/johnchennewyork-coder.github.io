// Algorithm Selector UI Component

export interface AlgorithmInfo {
  name: string;
  category: string;
  environment: string;
}

// Compatibility mapping: which algorithms work with which environments
const ALGORITHM_ENVIRONMENT_COMPATIBILITY: Record<string, string[]> = {
  'gridworld': ['qlearning', 'dqn', 'sarsa', 'expected-sarsa'],
  'cartpole': ['reinforce', 'ppo', 'a3c'],
  'pendulum': ['sac', 'ddpg', 'td3']
};

// Reverse mapping: which environments work with which algorithms
const ENVIRONMENT_ALGORITHM_COMPATIBILITY: Record<string, string[]> = {
  'qlearning': ['gridworld'],
  'dqn': ['gridworld'],
  'sarsa': ['gridworld'],
  'expected-sarsa': ['gridworld'],
  'reinforce': ['cartpole'],
  'ppo': ['cartpole'],
  'a3c': ['cartpole'],
  'sac': ['pendulum'],
  'ddpg': ['pendulum'],
  'td3': ['pendulum']
};

export class AlgorithmSelector {
  private selectElement: HTMLSelectElement;
  private onAlgorithmChange: (algorithm: string) => void;

  constructor(selectId: string = 'algorithm-select', onAlgorithmChange: (algorithm: string) => void) {
    this.selectElement = document.getElementById(selectId) as HTMLSelectElement;
    this.onAlgorithmChange = onAlgorithmChange;
    this.selectElement.addEventListener('change', () => {
      this.onAlgorithmChange(this.selectElement.value);
    });
  }

  getSelectedAlgorithm(): string {
    return this.selectElement.value;
  }

  setAlgorithm(algorithm: string): void {
    this.selectElement.value = algorithm;
    this.onAlgorithmChange(algorithm);
  }

  /**
   * Update algorithm options based on selected environment
   * Disables algorithms that are incompatible with the environment
   */
  updateForEnvironment(environment: string): void {
    const compatibleAlgorithms = ALGORITHM_ENVIRONMENT_COMPATIBILITY[environment] || [];
    const allOptions = this.selectElement.querySelectorAll('option');
    
    allOptions.forEach((option) => {
      const optionValue = (option as HTMLOptionElement).value;
      if (!optionValue) return; // Skip optgroup labels
      
      const isCompatible = compatibleAlgorithms.includes(optionValue);
      (option as HTMLOptionElement).disabled = !isCompatible;
      
      // If current selection is incompatible, switch to first compatible option
      if (this.selectElement.value === optionValue && !isCompatible) {
        if (compatibleAlgorithms.length > 0) {
          this.setAlgorithm(compatibleAlgorithms[0]);
        }
      }
    });
  }

  /**
   * Get list of compatible environments for an algorithm
   */
  getCompatibleEnvironments(algorithm: string): string[] {
    return ENVIRONMENT_ALGORITHM_COMPATIBILITY[algorithm] || [];
  }

  getAlgorithmInfo(algorithm: string): AlgorithmInfo {
    const algorithmMap: Record<string, AlgorithmInfo> = {
      'qlearning': { name: 'Q-Learning', category: 'Value-Based (Off-Policy)', environment: 'gridworld' },
      'dqn': { name: 'DQN', category: 'Value-Based (Off-Policy)', environment: 'gridworld' },
      'sarsa': { name: 'SARSA', category: 'Value-Based (On-Policy)', environment: 'gridworld' },
      'expected-sarsa': { name: 'Expected SARSA', category: 'Value-Based (On-Policy)', environment: 'gridworld' },
      'reinforce': { name: 'REINFORCE', category: 'Policy-Based', environment: 'cartpole' },
      'ppo': { name: 'PPO', category: 'Policy-Based', environment: 'cartpole' },
      'a3c': { name: 'A3C', category: 'Actor-Critic (On-Policy)', environment: 'cartpole' },
      'sac': { name: 'SAC', category: 'Actor-Critic (Off-Policy)', environment: 'pendulum' },
      'ddpg': { name: 'DDPG', category: 'Actor-Critic (Off-Policy)', environment: 'pendulum' },
      'td3': { name: 'TD3', category: 'Actor-Critic (Off-Policy)', environment: 'pendulum' }
    };

    return algorithmMap[algorithm] || { name: 'Unknown', category: 'Unknown', environment: 'gridworld' };
  }
}

