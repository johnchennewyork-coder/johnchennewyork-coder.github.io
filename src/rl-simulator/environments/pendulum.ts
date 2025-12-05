// Pendulum Environment for Continuous Control Actor-Critic Algorithms

export interface PendulumState {
  angle: number;
  angularVel: number;
}

export class Pendulum {
  private state: PendulumState;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private maxSpeed: number = 8.0;
  private maxTorque: number = 2.0;
  private dt: number = 0.05;
  private g: number = 10.0;
  private m: number = 1.0;
  private l: number = 1.0;

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
      this.canvas.height = 600;
    }
  }

  reset(): PendulumState {
    // Start from random angle
    this.state = {
      angle: (Math.random() - 0.5) * Math.PI,
      angularVel: (Math.random() - 0.5) * 2
    };
    return { ...this.state };
  }

  getState(): PendulumState {
    return { ...this.state };
  }

  getStateArray(): number[] {
    // Normalize angle to [-1, 1] and velocity to [-1, 1]
    return [
      Math.sin(this.state.angle),
      Math.cos(this.state.angle),
      this.state.angularVel / this.maxSpeed
    ];
  }

  getNumStates(): number {
    return 3; // sin(angle), cos(angle), normalized velocity
  }

  getNumActions(): number {
    return 1; // Continuous action (torque)
  }

  step(action: number): { nextState: PendulumState; reward: number; done: boolean } {
    // Clamp action to valid range
    const torque = Math.max(-this.maxTorque, Math.min(this.maxTorque, action));

    // Physics update
    const sintheta = Math.sin(this.state.angle);
    const newthdot = this.state.angularVel + (
      -3 * this.g / (2 * this.l) * sintheta +
      3.0 / (this.m * this.l * this.l) * torque
    ) * this.dt;
    const newth = this.state.angle + newthdot * this.dt;

    // Normalize angle to [-π, π]
    let normalizedAngle = newth;
    while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
    while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;

    // Clamp velocity
    const newthdotClamped = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, newthdot));

    this.state = {
      angle: normalizedAngle,
      angularVel: newthdotClamped
    };

    // Reward: angle should be at top (π), velocity should be 0
    // Reward = -(angle_normalized^2 + 0.1*velocity^2 + 0.001*torque^2)
    const angleCost = Math.pow((normalizedAngle + Math.PI) / (2 * Math.PI), 2);
    const velCost = 0.1 * Math.pow(newthdotClamped / this.maxSpeed, 2);
    const torqueCost = 0.001 * Math.pow(torque / this.maxTorque, 2);
    const reward = -(angleCost + velCost + torqueCost);

    return { nextState: { ...this.state }, reward, done: false };
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const pendulumLength = radius * 0.8;

    // Draw circle background
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.stroke();

    // Calculate pendulum position
    // Angle 0 is at top, positive is clockwise
    const angle = this.state.angle + Math.PI / 2; // Adjust for rendering
    const endX = centerX + Math.cos(angle) * pendulumLength;
    const endY = centerY + Math.sin(angle) * pendulumLength;

    // Draw pendulum rod
    this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.9)';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // Draw pivot point
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw bob
    this.ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
    this.ctx.beginPath();
    this.ctx.arc(endX, endY, 15, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw target (top position)
    this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(centerX, centerY - pendulumLength);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  getActionName(action: number): string {
    return `Torque: ${action.toFixed(2)}`;
  }
}

