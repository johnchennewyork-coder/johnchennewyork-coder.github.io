// Policy Transformer UI Component - Handles animated transformation from Q-values to policy

export interface PolicyTransformState {
  isTransformed: boolean;
  temperature: number;
  animationProgress: number; // 0 to 1
  isAnimating: boolean;
}

export class PolicyTransformer {
  private state: PolicyTransformState = {
    isTransformed: false,
    temperature: 1.0,
    animationProgress: 0,
    isAnimating: false
  };
  private animationFrameId: number | null = null;
  private onStateChange: (state: PolicyTransformState) => void;

  constructor(onStateChange: (state: PolicyTransformState) => void) {
    this.onStateChange = onStateChange;
  }

  toggleTransformation(): void {
    if (this.state.isAnimating) return;
    
    this.state.isAnimating = true;
    this.state.animationProgress = 0;
    
    const targetProgress = this.state.isTransformed ? 0 : 1;
    const direction = targetProgress > this.state.animationProgress ? 1 : -1;
    
    const animate = () => {
      this.state.animationProgress += direction * 0.05;
      
      if ((direction > 0 && this.state.animationProgress >= 1) ||
          (direction < 0 && this.state.animationProgress <= 0)) {
        this.state.animationProgress = targetProgress;
        this.state.isTransformed = !this.state.isTransformed;
        this.state.isAnimating = false;
        this.onStateChange({ ...this.state });
        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
        return;
      }
      
      this.onStateChange({ ...this.state });
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  setTemperature(temperature: number): void {
    this.state.temperature = temperature;
    this.onStateChange({ ...this.state });
  }

  getState(): PolicyTransformState {
    return { ...this.state };
  }

  reset(): void {
    this.state.isTransformed = false;
    this.state.animationProgress = 0;
    this.state.isAnimating = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.onStateChange({ ...this.state });
  }

  // Helper function to interpolate between Q-values and policy probabilities
  interpolateValues(qValues: number[], policyProbs: number[], progress: number): number[] {
    return qValues.map((q, i) => {
      // Interpolate between Q-value (normalized) and policy probability
      const normalizedQ = (q - Math.min(...qValues)) / (Math.max(...qValues) - Math.min(...qValues) || 1);
      return normalizedQ * (1 - progress) + policyProbs[i] * progress;
    });
  }
}

