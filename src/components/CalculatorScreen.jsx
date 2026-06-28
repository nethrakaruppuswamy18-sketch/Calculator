import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CalculatorScreen({
  formula,
  display,
  memory,
  angleMode,
  theme,
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (!display || display === 'Error' || display === 'NaN') return;
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDark = theme === 'dark';

  // Format the display to look nice (e.g. group numbers, or clean symbols)
  const formatDisplay = (val) => {
    if (!val) return '0';
    // Replace standard math symbols for beautiful layout representation
    return val
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/-/g, ' − ');
  };

  const formatFormula = (form) => {
    if (!form) return '';
    return form
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/-/g, ' − ');
  };

  // Dynamically calculate font size based on input length to prevent overflowing the screen
  const getFontSizeClass = (text) => {
    const len = text.length;
    if (len > 16) return 'text-xl md:text-2xl';
    if (len > 12) return 'text-2xl md:text-3xl';
    if (len > 8) return 'text-3xl md:text-4xl';
    return 'text-4xl md:text-5xl';
  };

  return (
    <div
      id="calc-screen"
      className={`relative w-full rounded-2xl p-6 mb-6 transition-all duration-300 flex flex-col justify-between min-h-[140px] md:min-h-[160px] ${
        isDark
          ? 'bg-black/45 border border-white/5 text-white shadow-inner shadow-black/60'
          : 'bg-white/40 border border-slate-200/55 text-slate-900 shadow-inner shadow-slate-100'
      }`}
    >
      {/* Top Indicators Row */}
      <div className="flex items-center justify-between w-full mb-2 text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          {/* Angle Mode Badge */}
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider transition-colors duration-200 ${
              isDark
                ? 'bg-slate-800 text-slate-300'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {angleMode ? angleMode.toUpperCase() : 'DEG'}
          </span>

          {/* Memory Indicator */}
          {memory !== 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                isDark
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-amber-100 text-amber-700 border border-amber-300/50'
              }`}
            >
              M ({memory})
            </motion.span>
          )}
        </div>

        {/* Copy Result Trigger */}
        {display && display !== 'Error' && display !== 'NaN' && (
          <button
            id="copy-result-btn"
            onClick={copyToClipboard}
            className={`p-1 rounded-md transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Copy current expression/result"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Check className="w-4 h-4 text-emerald-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Copy className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>

      {/* Formula view */}
      <div
        className={`w-full text-right text-sm md:text-base font-mono truncate select-none h-6 mb-1 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        {formatFormula(formula)}
      </div>

      {/* Main active input value */}
      <div className="w-full overflow-x-auto text-right custom-scrollbar select-all">
        <div
          className={`font-mono font-medium tracking-tight whitespace-nowrap leading-none transition-all duration-200 ${getFontSizeClass(
            display
          )} ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          {formatDisplay(display) || '0'}
        </div>
      </div>
    </div>
  );
}
