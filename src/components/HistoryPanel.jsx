import React from 'react';
import { Trash2, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function HistoryPanel({
  isOpen,
  onClose,
  history,
  onClearAll,
  onDeleteItem,
  onSelectCalculation,
  theme,
}) {
  const isDark = theme === 'dark';

  const formatItemFormula = (form) => {
    return form
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/-/g, ' − ');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Semi-transparent Backdrop for mobile/tablet overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black md:hidden"
          />

          {/* Sliding panel container */}
          <motion.div
            initial={{ x: '100%', opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`fixed md:absolute top-0 right-0 h-full w-full max-w-[320px] z-50 shadow-2xl p-6 flex flex-col justify-between transition-all duration-300 rounded-l-2xl ${
              isDark
                ? 'glass text-white'
                : 'glass-light text-slate-800'
            }`}
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/20">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <h3 className="font-semibold text-base tracking-wide">History</h3>
                </div>
                <button
                  id="close-history-btn"
                  onClick={onClose}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List */}
              <div className="mt-4 overflow-y-auto max-h-[calc(100vh-180px)] md:max-h-[380px] custom-scrollbar pr-1">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 opacity-30 mb-2" />
                    <p className="text-xs">No calculations logged yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {history.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`relative group p-3 rounded-xl border text-right transition-all cursor-pointer ${
                            isDark
                              ? 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-850/50 hover:border-indigo-500/30'
                              : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/85 hover:border-indigo-500/30 shadow-sm'
                          }`}
                          onClick={() => onSelectCalculation(item.expression, item.result)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteItem(item.id);
                            }}
                            className={`absolute top-2 left-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-250 ${
                              isDark
                                ? 'hover:bg-slate-700 text-slate-400 hover:text-rose-400'
                                : 'hover:bg-slate-200 text-slate-500 hover:text-rose-600'
                            }`}
                            title="Delete this calculation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className={`text-xs font-mono truncate mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formatItemFormula(item.expression)}
                          </div>
                          <div className={`font-mono font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            = {item.result}
                          </div>
                          <div className={`text-[9px] font-mono mt-1 opacity-40 text-left`}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Footer containing clear all */}
            {history.length > 0 && (
              <button
                id="clear-all-history-btn"
                onClick={onClearAll}
                className={`w-full py-2.5 px-4 rounded-xl border font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                  isDark
                    ? 'bg-slate-850 border-slate-700 hover:bg-rose-950/20 hover:border-rose-900/30 text-rose-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-600 shadow-sm'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All History
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
