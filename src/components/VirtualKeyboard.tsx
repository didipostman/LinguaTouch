import React, { useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { audioEngine } from '../services/audioEngine';
import { Delete, CornerDownLeft, Sparkles } from 'lucide-react';

interface VirtualKeyboardProps {
  language: SupportedLanguage;
  nextExpectedChar?: string;
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onEnter?: () => void;
  soundEnabled?: boolean;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  language,
  nextExpectedChar,
  onKeyPress,
  onBackspace,
  onEnter,
  soundEnabled = true,
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [shift, setShift] = useState(false);

  const langConfig = SUPPORTED_LANGUAGES[language];

  // Base rows
  const row1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const row3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  // Add language-specific extra key to row2 if applicable
  if (language === 'Spanish' && !row2.includes('ñ')) {
    row2.push('ñ');
  }

  // Listen to physical keyboard to highlight keys virtually
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKey(key);
      if (soundEnabled && key.length === 1) {
        audioEngine.playKeyClick('type');
      } else if (soundEnabled && (key === 'backspace' || key === 'delete')) {
        audioEngine.playKeyClick('backspace');
      }
    };

    const handleKeyUp = () => {
      setActiveKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [soundEnabled]);

  const handleKeyClick = (char: string) => {
    if (soundEnabled) audioEngine.playKeyClick('type');
    onKeyPress(shift ? char.toUpperCase() : char);
    if (shift) setShift(false);
  };

  const handleSpecialCharClick = (char: string) => {
    if (soundEnabled) audioEngine.playKeyClick('type');
    onKeyPress(char);
  };

  const isNextKey = (char: string) => {
    if (!nextExpectedChar) return false;
    return (
      nextExpectedChar.toLowerCase() === char.toLowerCase() ||
      (nextExpectedChar === ' ' && char === 'SPACE')
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-3 sm:p-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl select-none">
      {/* Special characters quick-bar for the active language */}
      {langConfig?.specialChars && langConfig.specialChars.length > 0 && (
        <div className="mb-3 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              {langConfig.name} Accents & Characters
            </span>
            <span className="text-[10px] text-slate-400">Click or use shortcuts</span>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
            {langConfig.specialChars.map((char) => {
              const highlighted = isNextKey(char);
              return (
                <button
                  key={char}
                  type="button"
                  onClick={() => handleSpecialCharClick(char)}
                  className={`h-9 px-3 rounded-lg font-medium text-base transition-all duration-150 transform active:scale-95 shadow-sm ${
                    highlighted
                      ? 'bg-emerald-500 text-slate-950 font-bold ring-2 ring-emerald-300 ring-offset-2 ring-offset-slate-900 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-900/50 hover:border-emerald-500/60'
                  }`}
                  title={`Insert ${char}`}
                >
                  {char}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main QWERTY keyboard rows */}
      <div className="space-y-1.5">
        {/* Row 1 */}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          {row1.map((key) => {
            const displayChar = shift ? key.toUpperCase() : key;
            const isTarget = isNextKey(key);
            const isPhysicallyPressed = activeKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyClick(key)}
                className={`h-11 sm:h-12 flex-1 min-w-[28px] max-w-[58px] rounded-lg font-mono text-sm sm:text-base font-semibold flex items-center justify-center transition-all duration-100 ${
                  isPhysicallyPressed
                    ? 'bg-emerald-600 text-white translate-y-0.5 shadow-inner'
                    : isTarget
                    ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                    : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700/90 border border-slate-700/80 shadow-md active:translate-y-0.5'
                }`}
              >
                {displayChar}
              </button>
            );
          })}
        </div>

        {/* Row 2 */}
        <div className="flex justify-center gap-1 sm:gap-1.5 px-2">
          {row2.map((key) => {
            const displayChar = shift ? key.toUpperCase() : key;
            const isTarget = isNextKey(key);
            const isPhysicallyPressed = activeKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyClick(key)}
                className={`h-11 sm:h-12 flex-1 min-w-[28px] max-w-[58px] rounded-lg font-mono text-sm sm:text-base font-semibold flex items-center justify-center transition-all duration-100 ${
                  isPhysicallyPressed
                    ? 'bg-emerald-600 text-white translate-y-0.5 shadow-inner'
                    : isTarget
                    ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                    : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700/90 border border-slate-700/80 shadow-md active:translate-y-0.5'
                }`}
              >
                {displayChar}
              </button>
            );
          })}
        </div>

        {/* Row 3 with Shift & Backspace */}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setShift(!shift)}
            className={`h-11 sm:h-12 px-2 sm:px-3 rounded-lg text-xs font-semibold flex items-center justify-center transition-all border ${
              shift
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-slate-700'
            }`}
          >
            SHIFT
          </button>

          {row3.map((key) => {
            const displayChar = shift ? key.toUpperCase() : key;
            const isTarget = isNextKey(key);
            const isPhysicallyPressed = activeKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyClick(key)}
                className={`h-11 sm:h-12 flex-1 min-w-[28px] max-w-[58px] rounded-lg font-mono text-sm sm:text-base font-semibold flex items-center justify-center transition-all duration-100 ${
                  isPhysicallyPressed
                    ? 'bg-emerald-600 text-white translate-y-0.5 shadow-inner'
                    : isTarget
                    ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                    : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700/90 border border-slate-700/80 shadow-md active:translate-y-0.5'
                }`}
              >
                {displayChar}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              if (soundEnabled) audioEngine.playKeyClick('backspace');
              onBackspace();
            }}
            className="h-11 sm:h-12 px-3 sm:px-4 rounded-lg bg-slate-800 text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 border border-slate-700 flex items-center justify-center transition-all active:translate-y-0.5"
            title="Backspace (Delete)"
          >
            <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Spacebar & Action Row */}
        <div className="flex justify-center items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleKeyClick(' ')}
            className={`h-11 sm:h-12 flex-1 max-w-[340px] rounded-lg font-mono text-xs text-slate-400 flex items-center justify-center tracking-widest transition-all duration-100 ${
              isNextKey(' ')
                ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-400 ring-2 ring-emerald-400/50 animate-pulse'
                : activeKey === ' '
                ? 'bg-emerald-600 text-white translate-y-0.5 shadow-inner'
                : 'bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 shadow-md active:translate-y-0.5'
            }`}
          >
            SPACEBAR
          </button>

          {onEnter && (
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) audioEngine.playKeyClick('enter');
                onEnter();
              }}
              className="h-11 sm:h-12 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:translate-y-0.5"
            >
              <span>ENTER</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
