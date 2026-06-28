import React from 'react';
import { motion } from 'motion/react';
import { playClickSound } from '../utils/audio';

export default function CalculatorButton({
  id,
  value,
  onClick,
  variant = 'number',
  icon,
  span = 1,
  soundEnabled,
  isPressed = false,
  theme,
}) {
  const isDark = theme === 'dark';

  // Get color schemes based on variants and light/dark theme modes
  const getStyles = () => {
    switch (variant) {
      case 'operator':
        return isDark
          ? 'bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base md:text-lg shadow-md shadow-orange-950/20'
          : 'bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base md:text-lg shadow-md shadow-orange-500/10';
      
      case 'equal':
        return isDark
          ? 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base md:text-lg shadow-lg shadow-emerald-500/20'
          : 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base md:text-lg shadow-lg shadow-emerald-500/20';

      case 'clear':
        return isDark
          ? 'glass text-orange-400 hover:bg-white/10 font-semibold border border-white/10'
          : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200/50 font-semibold shadow-sm';

      case 'science':
        return isDark
          ? 'bg-white/5 text-indigo-300 hover:bg-white/10 border border-white/5 text-xs font-semibold'
          : 'bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200/30 text-xs font-semibold shadow-sm';

      case 'memory':
        return isDark
          ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5 text-[10px] md:text-xs font-bold'
          : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/80 border border-slate-250/30 text-[10px] md:text-xs font-bold shadow-sm';

      case 'utility':
        return isDark
          ? 'glass text-orange-400 hover:bg-white/10 font-semibold border border-white/10'
          : 'bg-orange-50/70 text-orange-500 hover:bg-orange-100/70 border border-orange-200/30 font-semibold shadow-sm';

      case 'number':
      default:
        return isDark
          ? 'bg-white/5 hover:bg-white/10 border border-white/5 text-white font-medium text-sm md:text-base'
          : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200/60 shadow-sm font-medium text-sm md:text-base';
    }
  };

  const handlePress = () => {
    if (soundEnabled) {
      let soundType = 'normal';
      if (variant === 'operator') soundType = 'operator';
      else if (variant === 'equal') soundType = 'equal';
      else if (variant === 'clear') soundType = 'clear';
      playClickSound(soundType);
    }
    onClick();
  };

  // Grid span styling helper
  const getColSpanClass = () => {
    switch (span) {
      case 2:
        return 'col-span-2';
      case 3:
        return 'col-span-3';
      case 4:
        return 'col-span-4';
      default:
        return 'col-span-1';
    }
  };

  return (
    <motion.button
      id={id}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.02 }}
      animate={
        isPressed
          ? { scale: 0.94, filter: 'brightness(1.2)' }
          : { scale: 1, filter: 'brightness(1)' }
      }
      transition={{ duration: 0.08 }}
      onClick={handlePress}
      className={`w-full h-11 md:h-12 flex items-center justify-center rounded-xl md:rounded-2xl transition-all duration-150 cursor-pointer text-sm font-sans select-none ${getColSpanClass()} ${getStyles()}`}
    >
      {icon ? <span className="flex items-center justify-center">{icon}</span> : value}
    </motion.button>
  );
}
