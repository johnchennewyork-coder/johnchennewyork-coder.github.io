// Control Panel UI Component

export class ControlPanel {
  private executeBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private speedSlider: HTMLInputElement;
  private speedValue: HTMLElement;
  private currentSpeed: number = 1;

  constructor(
    onExecute: () => void,
    onStop: () => void,
    onReset: () => void
  ) {
    this.executeBtn = document.getElementById('execute-btn') as HTMLButtonElement;
    this.stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
    this.speedValue = document.getElementById('speed-value')!;

    this.executeBtn.addEventListener('click', onExecute);
    this.stopBtn.addEventListener('click', onStop);
    this.resetBtn.addEventListener('click', onReset);

    this.speedSlider.addEventListener('input', () => {
      this.currentSpeed = parseFloat(this.speedSlider.value);
      this.speedValue.textContent = `${this.currentSpeed.toFixed(1)}x`;
    });
  }

  setExecuteEnabled(enabled: boolean): void {
    this.executeBtn.disabled = !enabled;
  }

  setStopEnabled(enabled: boolean): void {
    this.stopBtn.disabled = !enabled;
  }

  getSpeed(): number {
    return this.currentSpeed;
  }

  reset(): void {
    this.setExecuteEnabled(false);
    this.setStopEnabled(false);
    this.speedSlider.value = '1';
    this.currentSpeed = 1;
    this.speedValue.textContent = '1x';
  }
}

