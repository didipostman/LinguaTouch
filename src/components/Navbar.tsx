import React from 'react';
import { SupportedLanguage, ExerciseMode, VocabDeck } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import {
  Keyboard as KeyboardIcon,
  Mic,
  EyeOff,
  Layers,
  Sparkles,
  Settings,
  Flame,
  ChevronDown,
  Wand2,
  BookOpen,
  Shuffle,
} from 'lucide-react';

interface NavbarProps {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  currentMode: ExerciseMode;
  onSelectMode: (mode: ExerciseMode) => void;
  activeDeck: VocabDeck | null;
  onOpenDeckManager: () => void;
  onOpenAIGenerator: () => void;
  onOpenSettings: () => void;
  streak: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onSelectLanguage,
  currentMode,
  onSelectMode,
  activeDeck,
  onOpenDeckManager,
  onOpenAIGenerator,
  onOpenSettings,
  streak,
}) => {
  const languages = Object.values(SUPPORTED_LANGUAGES);

  const modes: { id: ExerciseMode; label: string; icon: React.ReactNode }[] = [
    { id: 'typing', label: 'Typing Drill', icon: <KeyboardIcon className="w-4 h-4" /> },
    { id: 'pronunciation', label: 'Pronunciation Studio', icon: <Mic className="w-4 h-4" /> },
    { id: 'dictation', label: 'Listen & Type', icon: <EyeOff className="w-4 h-4" /> },
    { id: 'scramble', label: 'Tile Builder', icon: <Shuffle className="w-4 h-4" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Language Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <KeyboardIcon className="w-5 h-5 text-slate-950" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-extrabold text-white tracking-tight leading-none block">
                LinguaTouch
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                Keyboard & Voice Tutor
              </span>
            </div>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative group ml-1">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 transition-all"
            >
              <span className="text-base leading-none">
                {SUPPORTED_LANGUAGES[currentLanguage]?.flag}
              </span>
              <span className="hidden sm:inline">{currentLanguage}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <div className="absolute left-0 mt-1.5 w-48 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => onSelectLanguage(lang.id)}
                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors ${
                    currentLanguage === lang.id
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {lang.nativeName.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Mode Switcher Pills */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
          {modes.map((m) => {
            const isActive = currentMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Actions: Deck Selector, AI Deck, Streak, Settings */}
        <div className="flex items-center gap-2">
          {/* Deck Button */}
          <button
            type="button"
            onClick={onOpenDeckManager}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all max-w-[140px] sm:max-w-[200px]"
            title="Browse & Customize Vocabulary Decks"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{activeDeck?.title || 'Decks'}</span>
          </button>

          {/* AI Generator Shortcut */}
          <button
            type="button"
            onClick={onOpenAIGenerator}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 text-xs font-semibold border border-slate-700/80 transition-all"
            title="Generate custom vocabulary with AI"
          >
            <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Deck</span>
          </button>

          {/* Streak indicator */}
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{streak}</span>
            </div>
          )}

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-all"
            title="Settings & Audio Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Mode Switcher Scrollbar */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-slate-850 gap-1.5 no-scrollbar bg-slate-900/50">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
