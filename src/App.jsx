import React, { useState, useEffect, useCallback } from 'react';
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Calculator as CalcIcon,
} from 'lucide-react';
import { calculateExpression } from './utils/mathParser';
import { playClickSound } from './utils/audio';
import CalculatorScreen from './components/CalculatorScreen';
import CalculatorButton from './components/CalculatorButton';
import HistoryPanel from './components/HistoryPanel';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // --------------------------------------------------------
  // 1. Settings & Persistence States
  // --------------------------------------------------------
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('calc_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('calc_sound');
    return saved !== 'false'; // Default to true
  });

  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('calc_mode');
    return saved === 'scientific' ? 'scientific' : 'basic';
  });

  const [angleMode, setAngleMode] = useState('deg');

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('calc_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [historyOpen, setHistoryOpen] = useState(false);

  // --------------------------------------------------------
  // 2. Calculator Main States
  // --------------------------------------------------------
  const [state, setState] = useState({
    display: '0',
    formula: '',
    isFinished: false,
    memory: 0,
    angleMode: 'deg',
  });

  // Track physically pressed keys to trigger button feedback
  const [pressedKeyId, setPressedKeyId] = useState(null);

  // Status / Toast feedback
  const [toastMessage, setToastMessage] = useState(null);

  // --------------------------------------------------------
  // 3. LocalStorage Syncing
  // --------------------------------------------------------
  useEffect(() => {
    localStorage.setItem('calc_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('calc_sound', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('calc_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  // Toast feedback timeout helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  // Toggle Theme
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    if (soundEnabled) playClickSound('operator');
  };

  // Toggle Sound
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playClickSound('normal');
  };

  // Toggle Mode (Basic vs Scientific)
  const toggleMode = (m) => {
    setMode(m);
    if (soundEnabled) playClickSound('operator');
  };

  // --------------------------------------------------------
  // 4. Calculator Functional Logic Handlers
  // --------------------------------------------------------

  // Clear display and active formula
  const handleClear = useCallback(() => {
    setState((prev) => ({
      ...prev,
      display: '0',
      formula: '',
      isFinished: false,
    }));
  }, []);

  // Backspace - Delete last char
  const handleBackspace = useCallback(() => {
    setState((prev) => {
      if (prev.isFinished) {
        return { ...prev, formula: '', display: '0', isFinished: false };
      }
      
      let nextFormula = prev.formula;
      // Handle deletion of multicharacter scientific terms like "sin(", "cos(", "tan("
      const sciFunctions = ['asin(', 'acos(', 'atan(', 'sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt('];
      let deletedFunc = false;
      
      for (const func of sciFunctions) {
        if (nextFormula.endsWith(func)) {
          nextFormula = nextFormula.slice(0, -func.length);
          deletedFunc = true;
          break;
        }
      }

      if (!deletedFunc) {
        nextFormula = nextFormula.slice(0, -1);
      }

      const nextDisplay = nextFormula === '' ? '0' : nextFormula;
      return {
        ...prev,
        formula: nextFormula,
        display: nextDisplay,
      };
    });
  }, []);

  // Append a standard symbol/character (number, bracket, etc.)
  const handleInputSymbol = useCallback((symbol) => {
    setState((prev) => {
      let nextFormula = prev.formula;
      let nextDisplay = prev.display;

      // If we just clicked '=', start fresh for numbers/parentheses, but keep result for operators
      const isOperator = ['+', '-', '*', '/', '%', '^'].includes(symbol);
      const isFinished = prev.isFinished;

      if (isFinished) {
        if (isOperator) {
          // Continue calculations using the previous result
          nextFormula = prev.display + symbol;
          nextDisplay = prev.display + symbol;
        } else {
          // Start a brand-new calculation
          nextFormula = symbol;
          nextDisplay = symbol;
        }
      } else {
        // Normal append
        if (nextFormula === '0' && !isOperator && symbol !== '.') {
          nextFormula = symbol;
          nextDisplay = symbol;
        } else {
          nextFormula += symbol;
          nextDisplay = nextFormula;
        }
      }

      return {
        ...prev,
        formula: nextFormula,
        display: nextDisplay,
        isFinished: false,
      };
    });
  }, []);

  // Scientific function append
  const handleSciFunction = useCallback((func) => {
    setState((prev) => {
      let nextFormula = prev.formula;
      
      if (prev.isFinished) {
        // Apply function to the current result (e.g. sin(result) ) or start fresh
        nextFormula = `${func}(${prev.display})`;
      } else {
        if (nextFormula === '0' || nextFormula === '') {
          nextFormula = `${func}(`;
        } else {
          nextFormula += `${func}(`;
        }
      }

      return {
        ...prev,
        formula: nextFormula,
        display: nextFormula,
        isFinished: false,
      };
    });
  }, []);

  // Append Decimal Point safely
  const handleDecimal = useCallback(() => {
    setState((prev) => {
      if (prev.isFinished) {
        return { ...prev, formula: '0.', display: '0.', isFinished: false };
      }

      // Check the active number block being written
      // A number block is separated by operators +, -, *, /, %, ^, (, )
      const blocks = prev.formula.split(/[+\-*/%^()]/);
      const lastBlock = blocks[blocks.length - 1];

      if (lastBlock.includes('.')) {
        // Block already has a decimal, reject
        return prev;
      }

      const nextFormula = prev.formula === '' ? '0.' : prev.formula + '.';
      return {
        ...prev,
        formula: nextFormula,
        display: nextFormula,
      };
    });
  }, []);

  // Plus/Minus negation toggle
  const handlePlusMinus = useCallback(() => {
    setState((prev) => {
      if (prev.isFinished) {
        // Toggle negative sign on the current result
        const negated = prev.display.startsWith('-') ? prev.display.slice(1) : '-' + prev.display;
        return { ...prev, display: negated, formula: negated };
      }

      // Find the last number block in the formula
      const formulaStr = prev.formula;
      if (!formulaStr || formulaStr === '0') {
        return { ...prev, formula: '-', display: '-' };
      }

      // Check if it already ends with a negative token or can be parsed
      // Simple toggle: replace or wrap last digits with negative sign
      const match = formulaStr.match(/(-)?(\d+(?:\.\d+)?)$/);
      if (match) {
        const fullMatch = match[0];
        const hasMinus = !!match[1];
        const numberPart = match[2];

        const startIndex = formulaStr.lastIndexOf(fullMatch);
        const prefix = formulaStr.substring(0, startIndex);

        const replacement = hasMinus ? numberPart : `-${numberPart}`;
        const nextFormula = prefix + replacement;

        return {
          ...prev,
          formula: nextFormula,
          display: nextFormula,
        };
      } else {
        // No trailing number block, just toggle negation at the end
        if (formulaStr.endsWith('-')) {
          const nextFormula = formulaStr.slice(0, -1);
          return { ...prev, formula: nextFormula, display: nextFormula || '0' };
        } else {
          const nextFormula = formulaStr + '-';
          return { ...prev, formula: nextFormula, display: nextFormula };
        }
      }
    });
  }, []);

  // Equal Trigger (=) - Performs calculation & logs to History
  const handleEqual = useCallback(() => {
    setState((prev) => {
      if (!prev.formula || prev.isFinished) return prev;

      // Auto-complete unbalanced parenthesis before evaluating
      let expressionToEvaluate = prev.formula;
      const leftParenCount = (expressionToEvaluate.match(/\(/g) || []).length;
      const rightParenCount = (expressionToEvaluate.match(/\)/g) || []).length;
      const missingParens = leftParenCount - rightParenCount;
      if (missingParens > 0) {
        expressionToEvaluate += ')'.repeat(missingParens);
      }

      try {
        const calculated = calculateExpression(expressionToEvaluate, angleMode);
        
        // Clean float representation (floating point correction)
        let resultStr = calculated.toString();
        if (Number.isFinite(calculated) && !Number.isInteger(calculated)) {
          // If result has many decimals, round to 10 decimals to eliminate 0.1+0.2 binary float bugs
          resultStr = Number(calculated.toFixed(10)).toString();
        }

        // Add to history list
        const newHistoryItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          expression: expressionToEvaluate,
          result: resultStr,
          timestamp: new Date(),
        };
        setHistory((curr) => [newHistoryItem, ...curr]);

        return {
          ...prev,
          display: resultStr,
          formula: expressionToEvaluate, // Display the fully balanced expression in formula line
          isFinished: true,
        };
      } catch (err) {
        return {
          ...prev,
          display: 'Error',
          isFinished: true,
        };
      }
    });
  }, [angleMode]);

  // Handle individual past calculation selections
  const handleSelectHistoryItem = (expression, result) => {
    setState({
      display: result,
      formula: expression,
      isFinished: true,
      memory: state.memory,
      angleMode,
    });
    setHistoryOpen(false);
    showToast('Calculation loaded from history!');
    if (soundEnabled) playClickSound('normal');
  };

  // --------------------------------------------------------
  // 5. Memory Management Handlers
  // --------------------------------------------------------
  const handleMemory = (action) => {
    if (soundEnabled) playClickSound('operator');

    setState((prev) => {
      let currentVal = parseFloat(prev.display);
      if (isNaN(currentVal) || prev.display === 'Error') {
        currentVal = 0;
      }

      switch (action) {
        case 'MC':
          showToast('Memory Cleared (MC)');
          return { ...prev, memory: 0 };
        case 'MR':
          showToast(`Recalled: ${prev.memory}`);
          // Paste memory register into current formula
          return {
            ...prev,
            formula: prev.isFinished ? String(prev.memory) : prev.formula + String(prev.memory),
            display: prev.isFinished ? String(prev.memory) : prev.formula + String(prev.memory),
            isFinished: false,
          };
        case 'M+': {
          const nextMemory = prev.memory + currentVal;
          showToast(`Added to Memory: +${currentVal}`);
          return { ...prev, memory: nextMemory, isFinished: true };
        }
        case 'M-': {
          const nextMemory = prev.memory - currentVal;
          showToast(`Subtracted from Memory: -${currentVal}`);
          return { ...prev, memory: nextMemory, isFinished: true };
        }
        default:
          return prev;
      }
    });
  };

  // --------------------------------------------------------
  // 6. Keyboard Binding Event Listeners
  // --------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key;
      let targetId = '';

      // Direct key maps
      if (/[0-9]/.test(key)) {
        targetId = `btn-${key}`;
        handleInputSymbol(key);
      } else if (key === '.') {
        targetId = 'btn-dot';
        handleDecimal();
      } else if (key === '+') {
        targetId = 'btn-plus';
        handleInputSymbol('+');
      } else if (key === '-') {
        targetId = 'btn-minus';
        handleInputSymbol('-');
      } else if (key === '*') {
        targetId = 'btn-multiply';
        handleInputSymbol('*');
      } else if (key === 'x' || key === 'X') {
        targetId = 'btn-multiply';
        handleInputSymbol('*');
      } else if (key === '/') {
        // Prevent default browser find triggers
        e.preventDefault();
        targetId = 'btn-divide';
        handleInputSymbol('/');
      } else if (key === '%') {
        targetId = 'btn-percent';
        handleInputSymbol('%');
      } else if (key === '(') {
        targetId = 'btn-lparen';
        handleInputSymbol('(');
      } else if (key === ')') {
        targetId = 'btn-rparen';
        handleInputSymbol(')');
      } else if (key === '^') {
        targetId = 'btn-power';
        handleInputSymbol('^');
      } else if (key === '!') {
        targetId = 'btn-factorial';
        handleInputSymbol('!');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        targetId = 'btn-equal';
        handleEqual();
      } else if (key === 'Backspace') {
        targetId = 'btn-backspace';
        handleBackspace();
      } else if (key === 'Escape') {
        targetId = 'btn-clear';
        handleClear();
      }

      // Briefly highlight button
      if (targetId) {
        setPressedKeyId(targetId);
        if (soundEnabled) {
          let soundType = 'normal';
          if (targetId === 'btn-equal') soundType = 'equal';
          else if (targetId === 'btn-clear') soundType = 'clear';
          else if (['btn-plus', 'btn-minus', 'btn-multiply', 'btn-divide'].includes(targetId)) {
            soundType = 'operator';
          }
          playClickSound(soundType);
        }
      }
    };

    const handleKeyUp = () => {
      setPressedKeyId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleInputSymbol, handleDecimal, handleEqual, handleBackspace, handleClear, soundEnabled]);

  const isDark = theme === 'dark';

  return (
    <div
      id="calculator-app"
      className={`relative w-full min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-500 overflow-hidden animate-mesh-slow ${
        isDark
          ? 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white'
          : 'bg-gradient-to-br from-slate-100 via-slate-50 to-purple-50 text-slate-800'
      }`}
    >
      {/* Decorative Orbs behind calculator */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Floating Status / Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 z-50 px-4 py-2 rounded-xl text-xs font-medium shadow-lg border backdrop-blur-md transition-all duration-200 ${
              isDark
                ? 'bg-slate-900/90 border-slate-700/50 text-indigo-300 shadow-black/50'
                : 'bg-white/90 border-slate-200 text-indigo-600 shadow-slate-200/50'
            }`}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Calculator Container with Sleek Glass styling */}
      <div
        id="calc-container"
        className={`relative w-full max-w-lg rounded-[40px] p-8 transition-all duration-300 shadow-2xl ${
          isDark
            ? 'glass shadow-black/60'
            : 'glass-light shadow-slate-300/40'
        }`}
      >
        {/* Header Options Row */}
        <div className="flex items-center justify-between mb-5 w-full select-none">
          {/* Logo Brand Title */}
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              <CalcIcon className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-wide font-sans">Calculator</span>
          </div>

          {/* Quick toggle settings bar */}
          <div className="flex items-center gap-1">
            {/* Mode Toggle Tabs (Basic vs Scientific) */}
            <div
              className={`flex p-0.5 rounded-lg mr-2 ${
                isDark ? 'bg-slate-950/60' : 'bg-slate-200/60'
              }`}
            >
              <button
                id="mode-basic-btn"
                onClick={() => toggleMode('basic')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'basic'
                    ? isDark
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Basic
              </button>
              <button
                id="mode-sci-btn"
                onClick={() => toggleMode('scientific')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  mode === 'scientific'
                    ? isDark
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Scientific
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
              }`}
              title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* History Toggle */}
            <button
              id="history-toggle-btn"
              onClick={() => {
                setHistoryOpen(!historyOpen);
                if (soundEnabled) playClickSound('operator');
              }}
              className={`relative p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
              }`}
              title="Show calculation history"
            >
              <Clock className="w-4 h-4" />
              {history.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Screen Component */}
        <CalculatorScreen
          formula={state.formula}
          display={state.display}
          memory={state.memory}
          angleMode={angleMode}
          theme={theme}
        />

        {/* Main Keyboard Grid */}
        <div className="flex flex-col gap-4">
          {/* Scientific Controls (Only visible/active in Scientific mode) */}
          <AnimatePresence>
            {mode === 'scientific' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                {/* Trigonometry & Mode subrow */}
                <div className="grid grid-cols-5 gap-2 pb-2 border-b border-slate-700/15 mb-2">
                  {/* Rad / Deg Toggle */}
                  <button
                    id="btn-angle-toggle"
                    onClick={() => {
                      setAngleMode((prev) => (prev === 'deg' ? 'rad' : 'deg'));
                      showToast(`Angle Mode: ${angleMode === 'deg' ? 'Radians' : 'Degrees'}`);
                      if (soundEnabled) playClickSound('operator');
                    }}
                    className={`col-span-1 h-9 flex items-center justify-center rounded-lg text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    {angleMode}
                  </button>

                  <CalculatorButton
                    id="btn-sin"
                    value="sin"
                    onClick={() => handleSciFunction('sin')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-cos"
                    value="cos"
                    onClick={() => handleSciFunction('cos')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-tan"
                    value="tan"
                    onClick={() => handleSciFunction('tan')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-factorial"
                    value="x!"
                    onClick={() => handleInputSymbol('!')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                </div>

                {/* Additional scientific parameters */}
                <div className="grid grid-cols-5 gap-2 pb-2">
                  <CalculatorButton
                    id="btn-asin"
                    value="asin"
                    onClick={() => handleSciFunction('asin')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-acos"
                    value="acos"
                    onClick={() => handleSciFunction('acos')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-atan"
                    value="atan"
                    onClick={() => handleSciFunction('atan')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-pi"
                    value="π"
                    onClick={() => handleInputSymbol('π')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-e"
                    value="e"
                    onClick={() => handleInputSymbol('e')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <CalculatorButton
                    id="btn-ln"
                    value="ln"
                    onClick={() => handleSciFunction('ln')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-log"
                    value="log"
                    onClick={() => handleSciFunction('log')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-sqrt"
                    value="√"
                    onClick={() => handleSciFunction('√')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-power"
                    value="xʸ"
                    onClick={() => handleInputSymbol('^')}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                  <CalculatorButton
                    id="btn-reciprocal"
                    value="1/x"
                    onClick={() => {
                      setState((prev) => {
                        if (prev.isFinished) {
                          return {
                            ...prev,
                            formula: `1÷(${prev.display})`,
                            display: `1÷(${prev.display})`,
                            isFinished: false,
                          };
                        }
                        return {
                          ...prev,
                          formula: prev.formula === '' ? '1÷(' : prev.formula + '1÷(',
                          display: prev.formula === '' ? '1÷(' : prev.formula + '1÷(',
                        };
                      });
                    }}
                    variant="science"
                    soundEnabled={soundEnabled}
                    theme={theme}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Memory Row */}
          <div className="grid grid-cols-4 gap-2">
            <CalculatorButton
              id="btn-mc"
              value="MC"
              onClick={() => handleMemory('MC')}
              variant="memory"
              soundEnabled={soundEnabled}
              theme={theme}
            />
            <CalculatorButton
              id="btn-mr"
              value="MR"
              onClick={() => handleMemory('MR')}
              variant="memory"
              soundEnabled={soundEnabled}
              theme={theme}
            />
            <CalculatorButton
              id="btn-mplus"
              value="M+"
              onClick={() => handleMemory('M+')}
              variant="memory"
              soundEnabled={soundEnabled}
              theme={theme}
            />
            <CalculatorButton
              id="btn-mminus"
              value="M-"
              onClick={() => handleMemory('M-')}
              variant="memory"
              soundEnabled={soundEnabled}
              theme={theme}
            />
          </div>

          {/* Standard Key Matrix Grid */}
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {/* Row 1 */}
            <CalculatorButton
              id="btn-clear"
              value="C"
              onClick={handleClear}
              variant="clear"
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-clear'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-lparen"
              value="("
              onClick={() => handleInputSymbol('(')}
              variant="utility"
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-lparen'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-rparen"
              value=")"
              onClick={() => handleInputSymbol(')')}
              variant="utility"
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-rparen'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-backspace"
              value="⌫"
              onClick={handleBackspace}
              variant="utility"
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-backspace'}
              theme={theme}
            />

            {/* Row 2 */}
            <CalculatorButton
              id="btn-7"
              value="7"
              onClick={() => handleInputSymbol('7')}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-7'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-8"
              value="8"
              onClick={() => handleInputSymbol('8')}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-8'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-9"
              value="9"
              onClick={() => handleInputSymbol('9')}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-9'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-divide"
              value="÷"
              onClick={() => handleInputSymbol('/')}
              variant="operator"
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-divide'}
              theme={theme}
            />

            {/* Row 3 */}
            <CalculatorButton
              id="btn-4"
              value="4"
              onClick={() => handleInputSymbol('4')}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-4'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-5"
              value="5"
              onClick={() => handleInputSymbol('5')}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-5'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-6"
              value="6"
              onClick={() => handleInputSymbol('6')}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-6'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-multiply"
              value="×"
              onClick={() => handleInputSymbol('*')}
              variant="operator"
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-multiply'}
              theme={theme}
            />

            {/* Row 4 */}
            <CalculatorButton
              id="btn-1"
              value="1"
              onClick={() => handleInputSymbol('1')}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-1'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-2"
              value="2"
              onClick={() => handleInputSymbol('2')}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-2'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-3"
              value="3"
              onClick={() => handleInputSymbol('3')}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-3'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-minus"
              value="−"
              onClick={() => handleInputSymbol('-')}
              variant="operator"
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-minus'}
              theme={theme}
            />

            {/* Row 5 */}
            <CalculatorButton
              id="btn-plusminus"
              value="±"
              onClick={handlePlusMinus}
              variant="utility"
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-plusminus'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-0"
              value="0"
              onClick={() => handleInputSymbol('0')}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-0'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-dot"
              value="."
              onClick={handleDecimal}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-dot'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-plus"
              value="+"
              onClick={() => handleInputSymbol('+')}
              variant="operator"
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-plus'}
              theme={theme}
            />
          </div>

          {/* Equal row (Full span button for standard easy access) */}
          <div className="grid grid-cols-4 gap-2">
            <CalculatorButton
              id="btn-percent"
              value="%"
              onClick={() => handleInputSymbol('%')}
              variant="utility"
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-percent'}
              theme={theme}
            />
            <CalculatorButton
              id="btn-equal"
              value="="
              onClick={handleEqual}
              variant="equal"
              span={3}
              soundEnabled={soundEnabled}
              isPressed={pressedKeyId === 'btn-equal'}
              theme={theme}
            />
          </div>
        </div>

        {/* Sliding History Drawer */}
        <HistoryPanel
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          history={history}
          onClearAll={() => {
            setHistory([]);
            showToast('All calculation history cleared!');
          }}
          onDeleteItem={(id) => {
            setHistory((curr) => curr.filter((item) => item.id !== id));
            showToast('Item deleted');
          }}
          onSelectCalculation={handleSelectHistoryItem}
          theme={theme}
        />
      </div>

      {/* Subtle Keyboard usage instructions at the bottom */}
      <div
        className={`mt-4 text-[11px] font-mono select-none flex items-center gap-1 opacity-50 ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>Full keyboard support active (Enter, Backspace, Esc, Operators, Numbers)</span>
      </div>
    </div>
  );
}
