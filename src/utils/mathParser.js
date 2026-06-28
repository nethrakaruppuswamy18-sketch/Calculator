export function calculateExpression(expression, angleMode) {
  // Normalize symbols for the parser
  let normalized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi');

  // Tokenizer
  let pos = 0;

  function peek() {
    return pos < normalized.length ? normalized[pos] : '';
  }

  function consume() {
    return pos < normalized.length ? normalized[pos++] : '';
  }

  function isDigit(c) {
    return /[0-9.]/.test(c);
  }

  function isAlpha(c) {
    return /[a-zA-Z]/.test(c);
  }

  function skipWhitespace() {
    while (peek() === ' ') {
      consume();
    }
  }

  // Parse a number
  function parseNumber() {
    skipWhitespace();
    let start = pos;
    if (peek() === '.') {
      consume();
    }
    while (isDigit(peek())) {
      consume();
    }
    const val = parseFloat(normalized.slice(start, pos));
    if (isNaN(val)) {
      throw new Error('Invalid Number');
    }
    return val;
  }

  // Factorial helper
  function factorial(n) {
    if (n < 0) throw new Error('Undefined (factorial of negative)');
    if (!Number.isInteger(n)) throw new Error('Undefined (factorial of decimal)');
    if (n > 170) return Infinity; // Avoid call stack overflow/Infinity limits
    let res = 1;
    for (let i = 2; i <= n; i++) {
      res *= i;
    }
    return res;
  }

  // Recursive Descent Parser
  // Expression = Term ( ( "+" | "-" ) Term )*
  function parseExpression() {
    let result = parseTerm();
    skipWhitespace();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      if (op === '+') {
        result += right;
      } else {
        result -= right;
      }
      skipWhitespace();
    }
    return result;
  }

  // Term = Factor ( ( "*" | "/" | "%" ) Factor )*
  function parseTerm() {
    let result = parseFactor();
    skipWhitespace();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = consume();
      const right = parseFactor();
      if (op === '*') {
        result *= right;
      } else if (op === '/') {
        if (right === 0) {
          throw new Error('Cannot divide by zero');
        }
        result /= right;
      } else {
        // Percentage/Modulo operator
        result = result % right;
      }
      skipWhitespace();
    }
    return result;
  }

  // Factor = Power ( "^" Power )*
  function parseFactor() {
    let result = parsePower();
    skipWhitespace();
    while (peek() === '^') {
      consume();
      const right = parsePower();
      result = Math.pow(result, right);
      skipWhitespace();
    }
    return result;
  }

  // Power = Primary [ "!" ]
  function parsePower() {
    let result = parsePrimary();
    skipWhitespace();
    // Support factorial post-fix
    while (peek() === '!') {
      consume();
      result = factorial(result);
      skipWhitespace();
    }
    return result;
  }

  // Primary = Number | Constant | Function | "(" Expression ")" | "+" Primary | "-" Primary
  function parsePrimary() {
    skipWhitespace();
    const c = peek();

    // Unary Operators
    if (c === '+') {
      consume();
      return parsePrimary();
    }
    if (c === '-') {
      consume();
      return -parsePrimary();
    }

    // Parentheses
    if (c === '(') {
      consume(); // consume '('
      const val = parseExpression();
      skipWhitespace();
      if (peek() === ')') {
        consume(); // consume ')'
      }
      return val;
    }

    // Constants or Functions
    if (isAlpha(c) || c === '√') {
      let name = '';
      if (c === '√') {
        name = consume(); // consume '√'
      } else {
        while (isAlpha(peek())) {
          name += consume();
        }
      }

      skipWhitespace();

      // Check for constants
      if (name === 'pi') {
        return Math.PI;
      }
      if (name === 'e') {
        return Math.E;
      }

      // Must be a function, check for '('
      if (peek() === '(') {
        consume(); // consume '('
        const arg = parseExpression();
        skipWhitespace();
        if (peek() === ')') {
          consume(); // consume ')'
        }

        // Evaluate function
        switch (name.toLowerCase()) {
          case 'sin':
            return angleMode === 'deg' ? Math.sin(arg * Math.PI / 180) : Math.sin(arg);
          case 'cos':
            return angleMode === 'deg' ? Math.cos(arg * Math.PI / 180) : Math.cos(arg);
          case 'tan':
            return angleMode === 'deg' ? Math.tan(arg * Math.PI / 180) : Math.tan(arg);
          case 'asin': {
            const rad = Math.asin(arg);
            return angleMode === 'deg' ? rad * 180 / Math.PI : rad;
          }
          case 'acos': {
            const rad = Math.acos(arg);
            return angleMode === 'deg' ? rad * 180 / Math.PI : rad;
          }
          case 'atan': {
            const rad = Math.atan(arg);
            return angleMode === 'deg' ? rad * 180 / Math.PI : rad;
          }
          case 'sqrt':
          case '√':
            if (arg < 0) throw new Error('Invalid input for square root');
            return Math.sqrt(arg);
          case 'log':
            if (arg <= 0) throw new Error('Invalid input for log');
            return Math.log10(arg);
          case 'ln':
            if (arg <= 0) throw new Error('Invalid input for ln');
            return Math.log(arg);
          default:
            throw new Error(`Unknown function: ${name}`);
        }
      } else {
        throw new Error(`Unexpected token: ${name}`);
      }
    }

    // Numbers
    if (isDigit(c)) {
      return parseNumber();
    }

    throw new Error('Syntax Error');
  }

  // Start parsing
  const result = parseExpression();
  skipWhitespace();
  if (pos < normalized.length) {
    throw new Error('Extra input after calculation');
  }
  return result;
}
