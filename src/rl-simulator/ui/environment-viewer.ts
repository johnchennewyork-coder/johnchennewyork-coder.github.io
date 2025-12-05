// Environment Viewer UI Component

export class EnvironmentViewer {
  private canvas: HTMLCanvasElement;
  private animationFrameId: number | null = null;

  constructor(canvasId: string = 'env-canvas') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas element with id ${canvasId} not found`);
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  startAnimation(renderFn: () => void): void {
    this.stopAnimation();
    const animate = () => {
      renderFn();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resize(): void {
    // Canvas will be resized by environment
  }
}

