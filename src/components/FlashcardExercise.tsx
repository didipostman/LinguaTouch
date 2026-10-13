import React, { useState, useEffect, useCallback } from 'react';
import { VocabItem, SupportedLanguage, AppSettings } from '../types';
import { audioEngine } from '../services/audioEngine';
import {
  Volume2,
  RotateCw,
  Sparkles,
  Check,
  ArrowRight,
  ThumbsUp,
  Turtle,
} from 'lucide-react';

interface FlashcardExerciseProps {
  item: VocabItem;
  language: SupportedLanguage;
  settings: AppSettings;
  onAnswer: (rating: 'hard' | 'good' | 'easy') => void;
}

export const FlashcardExercise: React.FC<FlashcardExerciseProps> = ({
  item,
  language,
  settings,
  onAnswer,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Play audio
  const handlePlayAudio = useCallback(async (speed = settings.ttsSpeed) => {
    setIsPlayingAudio(true);
    await audioEngine.speakText({
      text: item.word,
      language,
      voiceName: settings.ttsVoiceName,
      speed,
    });
    setIsPlayingAudio(false);
  }, [item.word, language, settings.ttsVoiceName, settings.ttsSpeed]);

  useEffect(() => {
    setIsFlipped(false);
    if (settings.autoPlayAudioOnWord) {
      handlePlayAudio();
    }
  }, [item.id, settings.autoPlayAudioOnWord, handlePlayAudio]);

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handlePlayAudio();
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          onAnswer('hard');
        } else if (e.key === '2') {
          e.preventDefault();
          onAnswer('good');
        } else if (e.key === '3') {
          e.preventDefault();
          onAnswer('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handlePlayAudio, onAnswer]);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* 3D Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full h-80 cursor-pointer perspective-1000 select-none group"
      >
        <div
          className={`w-full h-full relative rounded-3xl border border-slate-800 transition-all duration-500 transform-style-3d shadow-2xl backdrop-blur-xl ${
            isFlipped ? 'rotate-y-180 bg-slate-900/95' : 'bg-slate-900/90 hover:border-slate-700'
          }`}
        >
          {/* FRONT: Target word & audio */}
          <div
            className={`absolute inset-0 p-8 flex flex-col items-center justify-between backface-hidden ${
              isFlipped ? 'hidden' : 'flex'
            }`}
          >
            <div className="w-full flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-emerald-400">
                {language}
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <RotateCw className="w-3.5 h-3.5 text-slate-400" /> Click or Space to flip
              </span>
            </div>

            <div className="text-center my-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                {item.word}
              </h2>
              {item.phonetic && (
                <p className="text-sm font-mono text-emerald-400/90 font-semibold">
                  {item.phonetic}
                </p>
              )}
            </div>

            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => handlePlayAudio(1.0)}
                disabled={isPlayingAudio}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-md transition-all"
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Listen Native</span>
              </button>

              <button
                type="button"
                onClick={() => handlePlayAudio(0.7)}
                disabled={isPlayingAudio}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all"
              >
                <Turtle className="w-3.5 h-3.5 text-amber-400" />
                <span>Slow</span>
              </button>
            </div>
          </div>

          {/* BACK: English translation, example, notes */}
          <div
            className={`absolute inset-0 p-8 flex flex-col items-center justify-between backface-hidden ${
              !isFlipped ? 'hidden' : 'flex'
            }`}
          >
            <div className="w-full flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-indigo-400">
                English Translation
              </span>
              <span className="text-[11px] text-slate-400">Rate your recall</span>
            </div>

            <div className="text-center my-auto">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                {item.translation}
              </h3>
              {item.exampleTarget && (
                <p className="text-sm font-medium text-slate-300 mt-2">
                  "{item.exampleTarget}"
                </p>
              )}
              {item.exampleTranslation && (
                <p className="text-xs text-slate-400 mt-0.5">
                  "{item.exampleTranslation}"
                </p>
              )}
              {item.notes && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 text-slate-300 text-xs">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{item.notes}</span>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400">
              <span>Use keys 1, 2, or 3 below</span>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Rating Buttons (shown after flip) */}
      <div className="w-full mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onAnswer('hard')}
          className="flex-1 max-w-[140px] py-2.5 px-3 rounded-xl bg-slate-850 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 border border-slate-700/80 hover:border-rose-800/80 text-xs font-bold flex flex-col items-center gap-1 transition-all"
        >
          <span>Hard (Key 1)</span>
          <span className="text-[10px] text-slate-400 font-normal">Review soon</span>
        </button>

        <button
          type="button"
          onClick={() => onAnswer('good')}
          className="flex-1 max-w-[140px] py-2.5 px-3 rounded-xl bg-slate-850 hover:bg-sky-950/40 text-sky-300 hover:text-sky-200 border border-slate-700/80 hover:border-sky-800/80 text-xs font-bold flex flex-col items-center gap-1 transition-all"
        >
          <span>Good (Key 2)</span>
          <span className="text-[10px] text-slate-400 font-normal">Solid recall</span>
        </button>

        <button
          type="button"
          onClick={() => onAnswer('easy')}
          className="flex-1 max-w-[140px] py-2.5 px-3 rounded-xl bg-slate-850 hover:bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 border border-slate-700/80 hover:border-emerald-800/80 text-xs font-bold flex flex-col items-center gap-1 transition-all"
        >
          <span>Easy (Key 3)</span>
          <span className="text-[10px] text-slate-400 font-normal">Mastered</span>
        </button>
      </div>
    </div>
  );
};
