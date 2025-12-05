// Control Panel UI Component

export interface HyperparameterConfig {
  learningRate?: { min: number; max: number; step: number; default: number };
  discountFactor?: { min: number; max: number; step: number; default: number };
  epsilon?: { min: number; max: number; step: number; default: number };
  clipEpsilon?: { min: number; max: number; step: number; default: number };
}

export class ControlPanel {
  private hyperparametersContainer: HTMLElement;
  private hyperparameters: Map<string, number> = new Map();

  constructor(containerId: string = 'hyperparameters') {
    this.hyperparametersContainer = document.getElementById(containerId)!;
  }

  createHyperparameters(config: HyperparameterConfig): void {
    this.hyperparametersContainer.innerHTML = '';

    if (config.learningRate) {
      this.createSlider('learningRate', 'Learning Rate', config.learningRate);
    }
    if (config.discountFactor) {
      this.createSlider('discountFactor', 'Discount Factor (γ)', config.discountFactor);
    }
    if (config.epsilon) {
      this.createSlider('epsilon', 'Epsilon (ε)', config.epsilon);
    }
    if (config.clipEpsilon) {
      this.createSlider('clipEpsilon', 'Clip Epsilon', config.clipEpsilon);
    }
  }

  private createSlider(key: string, label: string, config: { min: number; max: number; step: number; default: number }): void {
    const div = document.createElement('div');
    div.className = 'col-md-3 mb-2';
    
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label';
    labelEl.textContent = `${label}: `;
    
    const valueSpan = document.createElement('span');
    valueSpan.id = `${key}-value`;
    valueSpan.textContent = config.default.toFixed(3);
    labelEl.appendChild(valueSpan);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'form-range';
    slider.id = `${key}-slider`;
    slider.min = config.min.toString();
    slider.max = config.max.toString();
    slider.step = config.step.toString();
    slider.value = config.default.toString();
    
    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      valueSpan.textContent = value.toFixed(3);
      this.hyperparameters.set(key, value);
    });
    
    this.hyperparameters.set(key, config.default);
    
    div.appendChild(labelEl);
    div.appendChild(slider);
    this.hyperparametersContainer.appendChild(div);
  }

  getHyperparameters(): Map<string, number> {
    return new Map(this.hyperparameters);
  }

  setHyperparameter(key: string, value: number): void {
    this.hyperparameters.set(key, value);
    const slider = document.getElementById(`${key}-slider`) as HTMLInputElement;
    const valueSpan = document.getElementById(`${key}-value`);
    if (slider) {
      slider.value = value.toString();
    }
    if (valueSpan) {
      valueSpan.textContent = value.toFixed(3);
    }
  }
}

