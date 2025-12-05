// Tooltip Manager for RL Simulator - Manages tooltip content and initialization

declare const bootstrap: any;

export interface TooltipContent {
  title: string;
  content: string;
}

export class TooltipManager {
  private static contentMap: Map<string, TooltipContent> = new Map([
    ['learningRate', {
      title: 'Learning Rate (α)',
      content: 'Controls how much the Q-values are updated each step. Higher values learn faster but may overshoot optimal values. Lower values learn more slowly but more stably. Typical range: 0.001-0.1.'
    }],
    ['discountFactor', {
      title: 'Discount Factor (γ)',
      content: 'The discount factor determines how much future rewards are worth compared to immediate rewards. γ=0 means only immediate rewards matter, γ=1 means future rewards are equally important. Typically 0.9-0.99.'
    }],
    ['epsilon', {
      title: 'Epsilon (ε)',
      content: 'Controls exploration vs exploitation. ε=1 means always explore (random actions), ε=0 means always exploit (greedy actions). Typically starts high and decays over time to balance exploration and exploitation.'
    }],
    ['clipEpsilon', {
      title: 'Clip Epsilon',
      content: 'In PPO, this parameter controls how much the policy can change in each update. It clips the probability ratio to prevent large policy updates, ensuring stable learning. Typical range: 0.1-0.3.'
    }],
    ['tdError', {
      title: 'TD Error (Temporal Difference Error)',
      content: 'Temporal Difference error measures the difference between predicted and actual Q-values. It\'s calculated as: δ = r + γ·max Q(s\',a\') - Q(s,a). A decreasing TD error indicates the agent is learning better value estimates.'
    }],
    ['episode', {
      title: 'Episode',
      content: 'A complete run from initial state to terminal state. The agent collects rewards during an episode. Multiple episodes allow the agent to learn from experience and improve its policy over time.'
    }],
    ['learningCurve', {
      title: 'Learning Curve',
      content: 'Shows episode rewards over time. A good learning curve should trend upward, indicating the agent is improving. The moving average (dashed line) smooths out noise and shows the overall learning trend.'
    }],
    ['qValues', {
      title: 'Q-Values',
      content: 'Q(s,a) represents the expected total future reward when taking action \'a\' in state \'s\' and following the optimal policy. Higher Q-values indicate better actions. The agent learns to estimate these values through experience.'
    }],
    ['onPolicyVsOffPolicy', {
      title: 'On-Policy vs Off-Policy',
      content: 'On-policy methods (SARSA, Expected SARSA) learn about the policy they\'re following. Off-policy methods (Q-Learning, DQN) can learn about a different policy (optimal) while following an exploratory policy.'
    }],
    ['temperature', {
      title: 'Temperature (τ)',
      content: 'Controls the sharpness of the softmax distribution when converting Q-values to a policy. Lower temperature (τ→0) makes the policy more deterministic (closer to argmax), while higher temperature makes it more uniform (exploratory).'
    }],
    ['totalSteps', {
      title: 'Total Steps',
      content: 'The cumulative number of actions taken across all episodes. This metric helps track how much experience the agent has gathered during training.'
    }],
    ['averageReward', {
      title: 'Average Reward',
      content: 'The mean reward per episode across all completed episodes. This metric indicates the agent\'s overall performance and should increase as learning progresses.'
    }],
    ['currentReward', {
      title: 'Current Reward',
      content: 'The cumulative reward collected in the current episode. This updates in real-time as the agent interacts with the environment.'
    }],
    ['paradigm', {
      title: 'RL Paradigm',
      content: 'The learning paradigm indicates how the algorithm approaches reinforcement learning: Value-Based methods learn Q-values or state values, Policy-Based methods learn policies directly, and Actor-Critic methods combine both approaches.'
    }]
  ]);

  /**
   * Get tooltip content for a given concept
   */
  static getContent(key: string): TooltipContent | undefined {
    return this.contentMap.get(key);
  }

  /**
   * Initialize a Bootstrap tooltip on an element
   */
  static initializeTooltip(element: HTMLElement, contentKey: string, placement: string = 'top'): void {
    const content = this.getContent(contentKey);
    if (!content) {
      console.warn(`No tooltip content found for key: ${contentKey}`);
      return;
    }

    // Combine title and content
    const htmlContent = `<strong>${content.title}</strong><br>${content.content}`;

    new bootstrap.Tooltip(element, {
      title: htmlContent,
      html: true,
      placement: placement,
      trigger: 'hover focus',
      container: 'body'
    });
  }

  /**
   * Initialize tooltips for all elements with data-tooltip attribute
   */
  static initializeAllTooltips(): void {
    const elements = document.querySelectorAll('[data-tooltip]');
    elements.forEach((element) => {
      const contentKey = element.getAttribute('data-tooltip');
      const placement = element.getAttribute('data-tooltip-placement') || 'top';
      if (contentKey) {
        this.initializeTooltip(element as HTMLElement, contentKey, placement);
      }
    });
  }

  /**
   * Create an info icon element with tooltip
   */
  static createInfoIcon(contentKey: string, placement: string = 'top'): HTMLElement {
    const icon = document.createElement('i');
    icon.className = 'fas fa-info-circle tooltip-icon';
    icon.setAttribute('data-tooltip', contentKey);
    icon.setAttribute('data-tooltip-placement', placement);
    icon.setAttribute('aria-label', 'Information');
    icon.setAttribute('role', 'button');
    icon.setAttribute('tabindex', '0');
    
    // Initialize tooltip
    this.initializeTooltip(icon, contentKey, placement);
    
    return icon;
  }
}

