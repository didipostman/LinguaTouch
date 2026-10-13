import React, { useState, useEffect, useCallback } from 'react';
import { VocabItem, SupportedLanguage, AppSettings } from '../types';
import { audioEngine } from '../services/audioEngine';
import confetti from 'canvas-confetti';
import {
  Volume2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Shuffle,
  Turtle,
} from 'lucide-react';

interface WordScrambleProps {
  item: VocabItem;
  language: SupportedLanguage;
  settings: AppSettings;
  onComplete: () => void;
}

interface Tile {
  id: string;
  char: string;
  isUsed: boolean;
}

export const WordScrambleExercise: React.FC<WordScrambleProps> = ({
  item,
  language,
  settings,
  onComplete,
}) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const targetChars = item.word.split('').filter((c) => c !== ' ');

  // Initialize and shuffle letters
  const initializeTiles = useCallback(() => {
    const chars = targetChars.map((char, index) => ({
      id: `${char}-${index}-${Math.random()}`,
      char,
      isUsed: false,
    }));

    // Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    setTiles(chars);
    setSelectedTiles([]);
    setIsCompleted(false);
  }, [item.word]);

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
    initializeTiles();
    if (settings.autoPlayAudioOnWord) {
      handlePlayAudio();
    }
  }, [item.id, initializeTiles, settings.autoPlayAudioOnWord, handlePlayAudio]);

  // Click on a scrambled pool tile to place it
  const handleSelectTile = (tile: Tile) => {
    if (tile.isUsed || isCompleted) return;

    if (settings.keyboardClickSound) {
      audioEngine.playKeyClick('type');
    }

    const updatedTiles = tiles.map((t) => (t.id === tile.id ? { ...t, isUsed: true } : t));
    const newSelected = [...selectedTiles, tile];

    setTiles(updatedTiles);
    setSelectedTiles(newSelected);

    // Check if full word formed
    const assembledString = newSelected.map((t) => t.char).join('');
    const targetNoSpaces = targetChars.join('');

    if (newSelected.length === targetChars.length) {
      if (assembledString.toLowerCase() === targetNoSpaces.toLowerCase()) {
        setIsCompleted(true);
        audioEngine.playSuccessChime();
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#6366f1', '#f59e0b'],
        });
      } else {
        if (settings.soundEffects) {
          audioEngine.playTypo();
        }
      }
    }
  };

  // Remove tile from assembled slots
  const handleDeselectTile = (tile: Tile) => {
    if (isCompleted) return;

    if (settings.keyboardClickSound) {
      audioEngine.playKeyClick('backspace');
    }

    const updatedTiles = tiles.map((t) => (t.id === tile.id ? { ...t, isUsed: false } : t));
    const newSelected = selectedTiles.filter((t) => t.id !== tile.id);

    setTiles(updatedTiles);
    setSelectedTiles(newSelected);
  };

  // Physical keyboard typing support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        if (selectedTiles.length > 0) {
          e.preventDefault();
          const last = selectedTiles[selectedTiles.length - 1];
          handleDeselectTile(last);
        }
      } else if (e.key === 'Enter') {
        if (isCompleted) {
          e.preventDefault();
          onComplete();
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handlePlayAudio();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        const char = e.key.toLowerCase();
        const available = tiles.find((t) => !t.isUsed && t.char.toLowerCase() === char);
        if (available) {
          e.preventDefault();
          handleSelectTile(available);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tiles, selectedTiles, isCompleted, onComplete, handlePlayAudio]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center select-none">
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header Prompt */}
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center justify-center gap-1.5">
            <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
            Assemble the Word
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {item.translation}
          </h2>
          {item.phonetic && (
            <p className="text-sm font-mono text-emerald-400/90 mt-1 font-semibold">
              {item.phonetic}
            </p>
          )}
        </div>

        {/* Audio control */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => handlePlayAudio(1.0)}
            disabled={isPlayingAudio}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-md transition-all"
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Listen (1.0x)</span>
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

          <button
            type="button"
            onClick={initializeTiles}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-700 transition-all"
            title="Reset tiles"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>

        {/* Assembled Target Slots */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 min-h-[58px] p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          {targetChars.map((_, idx) => {
            const placed = selectedTiles[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => placed && handleDeselectTile(placed)}
                disabled={isCompleted || !placed}
                className={`w-11 h-13 rounded-xl border flex items-center justify-center font-mono text-xl font-bold transition-all ${
                  placed
                    ? isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 scale-105 shadow-md shadow-emerald-500/20'
                      : 'bg-indigo-600/30 text-indigo-200 border-indigo-500 hover:bg-rose-950/40 hover:border-rose-500 cursor-pointer'
                    : 'bg-slate-900 border-slate-800 text-transparent'
                }`}
                title={placed ? 'Click to remove letter' : ''}
              >
                {placed ? placed.char : '·'}
              </button>
            );
          })}
        </div>

        {/* Scrambled Pool of Letter Tiles */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {tiles.map((tile) => {
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleSelectTile(tile)}
                disabled={tile.isUsed || isCompleted}
                className={`w-11 h-12 rounded-xl border font-mono text-lg font-bold transition-all transform active:scale-95 shadow-md ${
                  tile.isUsed
                    ? 'opacity-20 border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700 hover:border-emerald-500/70 hover:scale-105'
                }`}
              >
                {tile.char}
              </button>
            );
          })}
        </div>

        {/* Completion Message & Next Button */}
        {isCompleted && (
          <div className="mt-8 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Word Completed!</h4>
                <p className="text-xs text-emerald-300">"{item.word}" spelled correctly</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onComplete}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
