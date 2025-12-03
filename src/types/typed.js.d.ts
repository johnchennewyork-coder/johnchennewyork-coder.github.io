declare module 'typed.js' {
  export interface TypedOptions {
    strings?: string[];
    typeSpeed?: number;
    backSpeed?: number;
    backDelay?: number;
    loop?: boolean;
    showCursor?: boolean;
    cursorChar?: string;
  }

  export default class Typed {
    constructor(element: string | HTMLElement, options?: TypedOptions);
    destroy(): void;
    reset(): void;
    start(): void;
    stop(): void;
    toggle(): void;
  }
}

