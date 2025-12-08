// Agent Memory System - Conversation History + Working Memory

export interface Message {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  stepId?: string;
}

export interface WorkingMemoryItem {
  key: string;
  value: any;
  timestamp: number;
  source?: string; // Which step/tool created this
}

export interface AgentMemory {
  conversationHistory: Message[];
  workingMemory: {
    facts: Map<string, any>;
    context: Map<string, any>;
    intermediateResults: any[];
  };
}

export class AgentMemoryManager {
  private conversationHistory: Message[] = [];
  private workingMemory: {
    facts: Map<string, any>;
    context: Map<string, any>;
    intermediateResults: any[];
  } = {
    facts: new Map(),
    context: new Map(),
    intermediateResults: []
  };

  addMessage(role: 'user' | 'agent' | 'system', content: string, stepId?: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: Date.now(),
      stepId
    });
  }

  addFact(key: string, value: any, source?: string): void {
    this.workingMemory.facts.set(key, { value, timestamp: Date.now(), source });
  }

  getFact(key: string): any {
    return this.workingMemory.facts.get(key)?.value;
  }

  addContext(key: string, value: any): void {
    this.workingMemory.context.set(key, value);
  }

  getContext(key: string): any {
    return this.workingMemory.context.get(key);
  }

  addIntermediateResult(result: any): void {
    this.workingMemory.intermediateResults.push({
      result,
      timestamp: Date.now()
    });
  }

  getMemory(): AgentMemory {
    return {
      conversationHistory: [...this.conversationHistory],
      workingMemory: {
        facts: new Map(this.workingMemory.facts),
        context: new Map(this.workingMemory.context),
        intermediateResults: [...this.workingMemory.intermediateResults]
      }
    };
  }

  getConversationHistory(): Message[] {
    return [...this.conversationHistory];
  }

  getWorkingMemory(): typeof this.workingMemory {
    return {
      facts: new Map(this.workingMemory.facts),
      context: new Map(this.workingMemory.context),
      intermediateResults: [...this.workingMemory.intermediateResults]
    };
  }

  reset(): void {
    this.conversationHistory = [];
    this.workingMemory = {
      facts: new Map(),
      context: new Map(),
      intermediateResults: []
    };
  }

  getMemorySize(): number {
    return this.conversationHistory.length + 
           this.workingMemory.facts.size + 
           this.workingMemory.context.size + 
           this.workingMemory.intermediateResults.length;
  }
}

