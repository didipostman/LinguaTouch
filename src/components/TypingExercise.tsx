import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VocabItem, SupportedLanguage, AppSettings } from '../types';
import { VirtualKeyboard } from './VirtualKeyboard';
import { audioEngine } from '../services/audioEngine';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Flame,
  Zap,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Keyboard as KeyboardIcon,
  Turtle,
} from 'lucide-react';

interface TypingExerciseProps {
  item: VocabItem;
  language: SupportedLanguage;
  settings: AppSettings;
  onComplete: (success: boolean, keystrokes: number, accuracy: number) => void;
  onNext: () => void;
  streak: number;
}

export const TypingExercise: React.FC<TypingExerciseProps> = ({
  item,
  language,
  settings,
  onComplete,
  onNext,
  streak,
}) => {
  const [typed, setTyped] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [revealedHint, setRevealedHint] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showVirtualKb, setShowVirtualKb] = useState(settings.showVirtualKeyboard);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [cpm, setCpm] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const targetWord = item.word;

  // Next expected character (normalized for typing)
  const nextChar = !isCompleted && typed.length < targetWord.length ? targetWord[typed.length] : undefined;

  // Play word audio
  const handlePlayAudio = useCallback(async (speed = settings.ttsSpeed) => {
    setIsPlayingAudio(true);
    await audioEngine.speakText({
      text: targetWord,
      language,
      voiceName: settings.ttsVoiceName,
      speed,
    });
    setIsPlayingAudio(false);
  }, [targetWord, language, settings.ttsVoiceName, settings.ttsSpeed]);

  // Reset state when new item appears
  useEffect(() => {
    setTyped('');
    setMistakes(0);
    setIsCompleted(false);
    setRevealedHint(false);
    setStartTime(null);
    setCpm(0);

    // Auto-play audio if enabled
    if (settings.autoPlayAudioOnWord) {
      handlePlayAudio();
    }
  }, [item.id, settings.autoPlayAudioOnWord, handlePlayAudio]);

  // Focus container on mount to catch physical keystrokes
  useEffect(() => {
    containerRef.current?.focus();
  }, [item.id]);

  // Handle keystroke logic
  const handleInputChar = useCallback(
    (char: string) => {
      if (isCompleted) return;

      if (!startTime) {
        setStartTime(Date.now());
      }

      const nextExpected = targetWord[typed.length];
      if (!nextExpected) return;

      // Match check: support case-insensitive or exact, but encourage exact
      const matches = char === nextExpected || char.toLowerCase() === nextExpected.toLowerCase();

      if (matches) {
        const newTyped = typed + nextExpected; // use exact target casing
        setTyped(newTyped);

        // Update CPM
        if (startTime) {
          const elapsedMinutes = (Date.now() - startTime) / 60000;
          if (elapsedMinutes > 0) {
            setCpm(Math.round(newTyped.length / elapsedMinutes));
          }
        }

        // Check if word completed
        if (newTyped.length === targetWord.length) {
          setIsCompleted(true);
          audioEngine.playSuccessChime();

          if (settings.autoPlayAudioOnWord) {
            handlePlayAudio();
          }

          if (mistakes === 0 && streak >= 2) {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.75 },
              colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b'],
            });
          }

          const accuracy = Math.max(0, Math.round(((targetWord.length) / (targetWord.length + mistakes)) * 100));
          onComplete(true, targetWord.length + mistakes, accuracy);
        }
      } else {
        // Mistake
        setMistakes((prev) => prev + 1);
        if (settings.soundEffects) {
          audioEngine.playTypo();
        }
      }
    },
    [typed, targetWord, isCompleted, startTime, mistakes, settings.soundEffects, settings.autoPlayAudioOnWord, handlePlayAudio, streak, onComplete]
  );

  const handleBackspace = useCallback(() => {
    if (isCompleted) return;
    setTyped((prev) => prev.slice(0, -1));
  }, [isCompleted]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input/textarea is focused elsewhere
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        handlePlayAudio();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setTyped('');
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (isCompleted) {
          onNext();
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleInputChar(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInputChar, handleBackspace, handlePlayAudio, isCompleted, onNext]);

  // Calculate accuracy
  const totalStrokes = typed.length + mistakes;
  const currentAccuracy = totalStrokes === 0 ? 100 : Math.max(0, Math.round((typed.length / totalStrokes) * 100));

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="w-full flex flex-col items-center outline-none select-none"
    >
      {/* Exercise Card Header Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Tactile Typing Drill
          </span>

          {streak > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {streak} streak
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle Blind / Dictation mode */}
          <button
            type="button"
            onClick={() => setIsBlindMode(!isBlindMode)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isBlindMode
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
            }`}
            title="Ear-training dictation mode: word is masked until typed!"
          >
            {isBlindMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isBlindMode ? 'Dictation Active' : 'Listen & Type'}</span>
          </button>

          {/* Toggle Virtual Keyboard */}
          <button
            type="button"
            onClick={() => setShowVirtualKb(!showVirtualKb)}
            className={`p-1.5 rounded-md border text-xs transition-all ${
              showVirtualKb
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
            }`}
            title="Toggle On-Screen Keyboard"
          >
            <KeyboardIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Flashcard / Display Area */}
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl mb-6">
        {/* Glow ambient accent */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Translation Prompt */}
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            Translate into {language}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            {item.translation}
          </h2>
          {item.phonetic && settings.showPhoneticGuides && (
            <p className="text-sm font-mono text-emerald-400/90 mt-1">
              {item.phonetic}
            </p>
          )}
        </div>

        {/* Audio Listen Buttons */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => handlePlayAudio(1.0)}
            disabled={isPlayingAudio}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-sm font-semibold border border-slate-700 shadow-md transition-all disabled:opacity-50"
          >
            <Volume2 className={`w-4 h-4 text-emerald-400 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
            <span>Listen (1.0x)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlayAudio(0.7)}
            disabled={isPlayingAudio}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-300 text-xs font-medium border border-slate-700/70 transition-all disabled:opacity-50"
            title="Slow audio (0.7x) for distinct syllable clarity"
          >
            <Turtle className="w-3.5 h-3.5 text-amber-400" />
            <span>Slow (0.7x)</span>
          </button>

          {isBlindMode && !revealedHint && (
            <button
              type="button"
              onClick={() => setRevealedHint(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-xs font-medium border border-indigo-800/50 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hint</span>
            </button>
          )}
        </div>

        {/* Letter Slots Interactive Display */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 my-6 min-h-[56px]">
          {targetWord.split('').map((char, index) => {
            const isTyped = index < typed.length;
            const isCurrent = index === typed.length && !isCompleted;
            const isSpace = char === ' ';

            // If in blind mode and not completed and not revealed hint
            const maskChar = isBlindMode && !revealedHint && !isCompleted;

            let slotStyle = 'border-slate-700 bg-slate-800/50 text-slate-400';
            if (isTyped) {
              slotStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm shadow-emerald-500/30 scale-105';
            } else if (isCurrent) {
              slotStyle = 'border-emerald-400 bg-emerald-500/10 text-white animate-pulse ring-2 ring-emerald-400/40';
            }

            if (isSpace) {
              return (
                <div
                  key={index}
                  className={`w-6 sm:w-8 h-12 flex items-end justify-center pb-1 ${
                    isCurrent ? 'border-b-2 border-emerald-400' : 'border-b border-slate-700'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 uppercase tracking-tighter">␣</span>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`w-9 sm:w-11 h-12 sm:h-14 rounded-xl border flex items-center justify-center font-mono text-xl sm:text-2xl font-bold transition-all duration-150 ${slotStyle}`}
              >
                {isTyped ? (
                  char
                ) : maskChar ? (
                  isCurrent ? '?' : '•'
                ) : (
                  <span className={isCurrent ? 'text-slate-300' : 'text-slate-400'}>
                    {char}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Example Sentence Context */}
        {item.exampleTarget && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-sm font-medium text-slate-300">
              "{item.exampleTarget}"
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              "{item.exampleTranslation}"
            </p>
            {item.notes && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 text-slate-400 text-xs">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Tip: {item.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Real-time stats footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Accuracy: <strong className="text-emerald-400">{currentAccuracy}%</strong></span>
            {cpm > 0 && <span>Speed: <strong className="text-indigo-400">{cpm} CPM</strong></span>}
            {mistakes > 0 && <span className="text-rose-400">{mistakes} typo{mistakes > 1 ? 's' : ''}</span>}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Tab</kbd> Audio</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Esc</kbd> Reset</span>
          </div>
        </div>

        {/* Success Card Overlay when completed */}
        {isCompleted && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Excellent Typing!</h4>
                <p className="text-xs text-emerald-300">
                  {mistakes === 0 ? 'Flawless keystrokes (+10 XP)' : `Completed with ${currentAccuracy}% accuracy`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onNext}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>Next Word</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Interactive Tactile Virtual Keyboard */}
      {showVirtualKb && (
        <VirtualKeyboard
          language={language}
          nextExpectedChar={nextChar}
          onKeyPress={handleInputChar}
          onBackspace={handleBackspace}
          onEnter={isCompleted ? onNext : undefined}
          soundEnabled={settings.keyboardClickSound}
        />
      )}
    </div>
  );
};
