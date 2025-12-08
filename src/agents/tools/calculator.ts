// Calculator Tool

import { Tool, ToolResult } from './base';

export class CalculatorTool implements Tool {
  name = 'calculator';
  description = 'Performs arithmetic operations: addition, subtraction, multiplication, division, and more complex calculations';

  execute(params: { expression: string }): ToolResult {
    try {
      // Sanitize expression - only allow numbers, operators, and parentheses
      const sanitized = params.expression.replace(/[^0-9+\-*/().\s]/g, '');
      
      // Evaluate safely
      const result = this.evaluateExpression(sanitized);
      
      return {
        success: true,
        result: result,
        metadata: {
          expression: sanitized,
          originalExpression: params.expression
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          expression: params.expression
        }
      };
    }
  }

  private evaluateExpression(expr: string): number {
    // Remove whitespace
    expr = expr.replace(/\s/g, '');
    
    // Handle basic arithmetic with proper operator precedence
    // This is a simplified evaluator - in production, use a proper parser
    try {
      // Use Function constructor for safe evaluation (still limited to math)
      const func = new Function('return ' + expr);
      const result = func();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid expression result');
      }
      
      return result;
    } catch (error) {
      // Fallback to simple parsing for basic operations
      return this.simpleEvaluate(expr);
    }
  }

  private simpleEvaluate(expr: string): number {
    // Simple recursive descent parser for basic arithmetic
    let index = 0;
    
    const parseNumber = (): number => {
      let numStr = '';
      while (index < expr.length && /[0-9.]/.test(expr[index])) {
        numStr += expr[index++];
      }
      const num = parseFloat(numStr);
      if (isNaN(num)) throw new Error('Invalid number');
      return num;
    };
    
    const parseFactor = (): number => {
      if (index >= expr.length) throw new Error('Unexpected end');
      
      if (expr[index] === '(') {
        index++; // skip '('
        const result = parseExpression();
        if (index >= expr.length || expr[index] !== ')') {
          throw new Error('Missing closing parenthesis');
        }
        index++; // skip ')'
        return result;
      }
      
      if (expr[index] === '-') {
        index++;
        return -parseFactor();
      }
      
      return parseNumber();
    };
    
    const parseTerm = (): number => {
      let result = parseFactor();
      
      while (index < expr.length && (expr[index] === '*' || expr[index] === '/')) {
        const op = expr[index++];
        const right = parseFactor();
        if (op === '*') {
          result *= right;
        } else {
          if (right === 0) throw new Error('Division by zero');
          result /= right;
        }
      }
      
      return result;
    };
    
    const parseExpression = (): number => {
      let result = parseTerm();
      
      while (index < expr.length && (expr[index] === '+' || expr[index] === '-')) {
        const op = expr[index++];
        const right = parseTerm();
        if (op === '+') {
          result += right;
        } else {
          result -= right;
        }
      }
      
      return result;
    };
    
    return parseExpression();
  }
}

