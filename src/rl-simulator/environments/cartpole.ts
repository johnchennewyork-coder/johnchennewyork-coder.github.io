// CartPole Environment for Policy-Based RL Algorithms

export interface CartPoleState {
  cartPos: number;
  cartVel: number;
  poleAngle: number;
  poleVel: number;
}

export class CartPole {
  private state: CartPoleState;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gravity: number = 9.8;
  private massCart: number = 1.0;
  private massPole: number = 0.1;
  private totalMass: number = this.massCart + this.massPole;
  private length: number = 0.5;
  private poleMassLength: number = this.massPole * this.length;
  private forceMag: number = 10.0;
  private tau: number = 0.02; // Time step
  private xThreshold: number = 2.4;
  private thetaThreshold: number = 12 * Math.PI / 180;
  private maxEpisodeSteps: number = 500; // Maximum steps per episode
  private stepCount: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    this.state = this.reset();
    this.resize();
  }

  resize() {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = Math.min(container.clientWidth - 32, 600);
      this.canvas.height = 300;
    }
  }

  reset(): CartPoleState {
    // Start with more challenging initial conditions
    // Pole angle: random between -0.2 and 0.2 radians (~±11.5 degrees)
    // This makes it harder to balance initially
    this.state = {
      cartPos: (Math.random() - 0.5) * 0.2,
      cartVel: (Math.random() - 0.5) * 0.2,
      poleAngle: (Math.random() - 0.5) * 0.4, // Increased from 0.1 to 0.4
      poleVel: (Math.random() - 0.5) * 0.2
    };
    this.stepCount = 0;
    return { ...this.state };
  }

  getState(): CartPoleState {
    return { ...this.state };
  }

  getStateArray(): number[] {
    return [
      this.state.cartPos,
      this.state.cartVel,
      this.state.poleAngle,
      this.state.poleVel
    ];
  }

  getNumStates(): number {
    return 4; // Continuous state space
  }

  getNumActions(): number {
    return 2; // Left (0) or Right (1)
  }

  step(action: number): { nextState: CartPoleState; reward: number; done: boolean } {
    this.stepCount++;
    
    const force = action === 1 ? this.forceMag : -this.forceMag;
    const sinTheta = Math.sin(this.state.poleAngle);
    const cosTheta = Math.cos(this.state.poleAngle);

    const temp = (force + this.poleMassLength * this.state.poleVel * this.state.poleVel * sinTheta) / this.totalMass;
    const thetaAcc = (this.gravity * sinTheta - cosTheta * temp) / (this.length * (4.0/3.0 - this.massPole * cosTheta * cosTheta / this.totalMass));
    const xAcc = temp - this.poleMassLength * thetaAcc * cosTheta / this.totalMass;

    // Update state
    this.state.cartPos += this.tau * this.state.cartVel;
    this.state.cartVel += this.tau * xAcc;
    this.state.poleAngle += this.tau * this.state.poleVel;
    this.state.poleVel += this.tau * thetaAcc;

    // Normalize angle to [-π, π]
    while (this.state.poleAngle > Math.PI) this.state.poleAngle -= 2 * Math.PI;
    while (this.state.poleAngle < -Math.PI) this.state.poleAngle += 2 * Math.PI;

    // Check termination: failure conditions OR maximum steps reached
    const failed = Math.abs(this.state.cartPos) > this.xThreshold ||
                   Math.abs(this.state.poleAngle) > this.thetaThreshold;
    const maxStepsReached = this.stepCount >= this.maxEpisodeSteps;
    const done = failed || maxStepsReached;

    // Reward: 1 for each step, 0 if failed
    // If max steps reached without failing, still give reward (successful episode)
    const reward = failed ? 0 : 1;

    return { nextState: { ...this.state }, reward, done };
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const scale = 50;

    // Draw ground
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, centerY + 50);
    this.ctx.lineTo(this.canvas.width, centerY + 50);
    this.ctx.stroke();

    // Calculate cart position
    const cartX = centerX + this.state.cartPos * scale;
    const cartY = centerY + 50;

    // Draw cart
    this.ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
    this.ctx.fillRect(cartX - 20, cartY - 10, 40, 20);

    // Draw pole
    const poleEndX = cartX + Math.sin(this.state.poleAngle) * this.length * scale;
    const poleEndY = cartY - Math.cos(this.state.poleAngle) * this.length * scale;

    this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.9)';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(cartX, cartY);
    this.ctx.lineTo(poleEndX, poleEndY);
    this.ctx.stroke();

    // Draw pole tip
    this.ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
    this.ctx.beginPath();
    this.ctx.arc(poleEndX, poleEndY, 5, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  getActionName(action: number): string {
    return action === 0 ? 'Left' : 'Right';
  }
}

