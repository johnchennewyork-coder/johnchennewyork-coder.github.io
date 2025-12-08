// Task Input UI Component

export class TaskInput {
  private textarea: HTMLTextAreaElement;

  constructor() {
    this.textarea = document.getElementById('task-input') as HTMLTextAreaElement;
  }

  getTask(): string {
    return this.textarea.value.trim();
  }

  setTask(task: string): void {
    this.textarea.value = task;
  }

  clear(): void {
    this.textarea.value = '';
  }

  isEnabled(): boolean {
    return !this.textarea.disabled;
  }

  setEnabled(enabled: boolean): void {
    this.textarea.disabled = !enabled;
  }
}

