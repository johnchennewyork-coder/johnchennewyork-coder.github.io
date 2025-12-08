// Base Agent Interface

import { AgentMemory } from '../memory/agent-memory';
import { Tool } from '../tools/base';

export interface AgentStep {
  stepId: string;
  timestamp: number;
  type: 'reasoning' | 'action' | 'observation' | 'retry';
  content: string;
  tool?: string;
  toolParams?: any;
  result?: any;
  error?: string;
  retryAttempt?: number;
  retryStrategy?: string;
}

export interface Agent {
  name: string;
  type: string;
  execute(task: string): Promise<AgentStep[]>;
  getMemory(): AgentMemory;
  reset(): void;
  getAvailableTools(): Tool[];
}

export enum RetryStrategy {
  SIMPLE_RETRY = 'simple_retry',
  ALTERNATIVE_TOOL = 'alternative_tool',
  REFINED_APPROACH = 'refined_approach',
  FALLBACK = 'fallback'
}

