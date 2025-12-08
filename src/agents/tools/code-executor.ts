// Code Executor Tool (Sandboxed JavaScript Execution)

import { Tool, ToolResult } from './base';

export class CodeExecutorTool implements Tool {
  name = 'code_executor';
  description = 'Executes JavaScript code in a sandboxed environment (limited functionality for safety)';

  execute(params: { code: string }): ToolResult {
    try {
      // Very limited sandbox - only allow basic operations
      const code = params.code.trim();
      
      // Security: Block dangerous operations
      const dangerousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /setTimeout/,
        /setInterval/,
        /XMLHttpRequest/,
        /fetch\s*\(/,
        /import\s+/,
        /require\s*\(/,
        /process\./,
        /global\./,
        /window\./,
        /document\./
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
          return {
            success: false,
            error: 'Code contains potentially unsafe operations',
            metadata: { code }
          };
        }
      }
      
      // Create a limited execution context
      const context = {
        Math,
        Number,
        String,
        Array,
        Object,
        JSON,
        Date,
        console: {
          log: (...args: any[]) => {
            // Capture console output
            return args.map(arg => String(arg)).join(' ');
          }
        }
      };
      
      // Wrap code in a function to isolate scope
      const wrappedCode = `
        (function() {
          ${code}
        })();
      `;
      
      // Execute in isolated context (still not fully safe, but better than eval)
      const func = new Function(...Object.keys(context), wrappedCode);
      const result = func(...Object.values(context));
      
      return {
        success: true,
        result: result !== undefined ? String(result) : 'Code executed successfully',
        metadata: {
          code: params.code,
          outputType: typeof result
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          code: params.code
        }
      };
    }
  }
}

