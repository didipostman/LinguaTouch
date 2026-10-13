import React, { useState, useEffect, useMemo } from 'react';
import {
  SupportedLanguage,
  ExerciseMode,
  VocabDeck,
  AppSettings,
  UserStats,
} from './types';
import { INITIAL_DECKS } from './data/defaultDecks';
import { SUPPORTED_LANGUAGES } from './data/languages';
import { audioEngine } from './services/audioEngine';
import { Navbar } from './components/Navbar';
import { TypingExercise } from './components/TypingExercise';
import { PronunciationStudio } from './components/PronunciationStudio';
import { FlashcardExercise } from './components/FlashcardExercise';
import { WordScrambleExercise } from './components/WordScrambleExercise';
import { DeckManagerModal } from './components/DeckManagerModal';
import { AIDeckModal } from './components/AIDeckModal';
import { SettingsModal } from './components/SettingsModal';
import { ProgressDashboard } from './components/ProgressDashboard';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'linguatouch_settings_v1';
const STATS_STORAGE_KEY = 'linguatouch_stats_v1';
const DECKS_STORAGE_KEY = 'linguatouch_decks_v1';

const DEFAULT_SETTINGS: AppSettings = {
  soundEffects: true,
  keyboardClickSound: true,
  autoPlayAudioOnWord: false,
  ttsVoiceName: 'Kore',
  ttsSpeed: 1.0,
  showVirtualKeyboard: true,
  showPhoneticGuides: true,
  highlightNextKey: true,
  theme: 'dark',
};

const DEFAULT_STATS: UserStats = {
  totalKeystrokes: 0,
  wordsCompleted: 0,
  accuracyRate: 100,
  streakDays: 1,
  lastPracticeDate: new Date().toISOString().split('T')[0],
  pronunciationPractices: 0,
  averageVoiceScore: 0,
  levelXP: 25,
};

export default function App() {
  // 1. Language & Deck Selection
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('Spanish');
  const [decks, setDecks] = useState<VocabDeck[]>(() => {
    try {
      const saved = localStorage.getItem(DECKS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved decks');
    }
    return INITIAL_DECKS;
  });

  const languageDecks = useMemo(() => {
    return decks.filter((d) => d.language === currentLanguage);
  }, [decks, currentLanguage]);

  const [activeDeckId, setActiveDeckId] = useState<string>(() => {
    return languageDecks[0]?.id || INITIAL_DECKS[0].id;
  });

  // Ensure activeDeck matches current language
  useEffect(() => {
    const activeDeck = decks.find((d) => d.id === activeDeckId);
    if (!activeDeck || activeDeck.language !== currentLanguage) {
      const firstForLang = decks.find((d) => d.language === currentLanguage);
      if (firstForLang) {
        setActiveDeckId(firstForLang.id);
      }
    }
  }, [currentLanguage, decks, activeDeckId]);

  const currentDeck = useMemo(() => {
    return decks.find((d) => d.id === activeDeckId) || languageDecks[0] || INITIAL_DECKS[0];
  }, [decks, activeDeckId, languageDecks]);

  // 2. Card Index & Mode
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<ExerciseMode>('typing');
  const [deckCompleted, setDeckCompleted] = useState(false);

  // 3. User Settings & Audio
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  // 4. Learning Stats & Gamification
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_STATS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_STATS;
  });

  // 5. Modals
  const [isDeckManagerOpen, setIsDeckManagerOpen] = useState(false);
  const [isAIDeckModalOpen, setIsAIDeckModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    audioEngine.setMuted(!settings.soundEffects);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  // Check Daily Streak
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastPracticeDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const isConsecutive = stats.lastPracticeDate === yesterday;
      setStats((prev) => ({
        ...prev,
        streakDays: isConsecutive ? prev.streakDays + 1 : 1,
        lastPracticeDate: today,
      }));
    }
  }, [stats.lastPracticeDate]);

  const currentItem = currentDeck?.items[currentIndex];

  // Navigation handlers
  const handleNextWord = () => {
    if (!currentDeck || currentDeck.items.length === 0) return;
    if (currentIndex < currentDeck.items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed full deck!
      setDeckCompleted(true);
      audioEngine.playSuccessChime();
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.5 },
      });
    }
  };

  const handlePrevWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestartDeck = () => {
    setCurrentIndex(0);
    setDeckCompleted(false);
  };

  const handleShuffleDeck = () => {
    if (!currentDeck) return;
    const shuffledItems = [...currentDeck.items].sort(() => Math.random() - 0.5);
    setDecks((prev) =>
      prev.map((d) => (d.id === currentDeck.id ? { ...d, items: shuffledItems } : d))
    );
    setCurrentIndex(0);
    setDeckCompleted(false);
  };

  // Stats updates
  const handleTypingComplete = (success: boolean, keystrokes: number, accuracy: number) => {
    setStats((prev) => {
      const newTotalKeystrokes = prev.totalKeystrokes + keystrokes;
      const newWordsCompleted = prev.wordsCompleted + 1;
      const newAccuracy = Math.round((prev.accuracyRate * 0.8) + (accuracy * 0.2));
      const xpGained = accuracy >= 95 ? 15 : 10;

      return {
        ...prev,
        totalKeystrokes: newTotalKeystrokes,
        wordsCompleted: newWordsCompleted,
        accuracyRate: Math.min(100, Math.max(1, newAccuracy)),
        levelXP: prev.levelXP + xpGained,
      };
    });
  };

  const handlePronunciationScore = (score: number) => {
    setStats((prev) => {
      const count = prev.pronunciationPractices + 1;
      const prevTotal = prev.averageVoiceScore * prev.pronunciationPractices;
      const newAvg = Math.round((prevTotal + score) / count);
      const xpGained = score >= 90 ? 20 : score >= 75 ? 15 : 10;

      return {
        ...prev,
        pronunciationPractices: count,
        averageVoiceScore: newAvg,
        levelXP: prev.levelXP + xpGained,
      };
    });
  };

  const handleFlashcardAnswer = (rating: 'hard' | 'good' | 'easy') => {
    const xp = rating === 'easy' ? 12 : rating === 'good' ? 8 : 4;
    setStats((prev) => ({
      ...prev,
      wordsCompleted: prev.wordsCompleted + 1,
      levelXP: prev.levelXP + xp,
    }));
    handleNextWord();
  };

  const handleAddCustomDeck = (deck: VocabDeck) => {
    setDecks((prev) => [deck, ...prev]);
    setActiveDeckId(deck.id);
    setCurrentIndex(0);
    setDeckCompleted(false);
  };

  const handleDeleteDeck = (deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    if (activeDeckId === deckId) {
      const remaining = decks.filter((d) => d.id !== deckId && d.language === currentLanguage);
      if (remaining.length > 0) {
        setActiveDeckId(remaining[0].id);
      }
    }
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetStats = () => {
    setStats(DEFAULT_STATS);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 antialiased">
      {/* Navigation Header */}
      <Navbar
        currentLanguage={currentLanguage}
        onSelectLanguage={(lang) => {
          setCurrentLanguage(lang);
          setCurrentIndex(0);
          setDeckCompleted(false);
        }}
        currentMode={currentMode}
        onSelectMode={(m) => {
          setCurrentMode(m);
          setDeckCompleted(false);
        }}
        activeDeck={currentDeck}
        onOpenDeckManager={() => setIsDeckManagerOpen(true)}
        onOpenAIGenerator={() => setIsAIDeckModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        streak={stats.streakDays}
      />

      {/* Main Learning Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col items-center">
        {/* Subheader: Deck Info & Progress Indicators */}
        <div className="w-full flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              {currentDeck?.title}
            </span>
            <span className="text-xs text-slate-400">
              ({currentDeck ? `${currentIndex + 1} of ${currentDeck.items.length}` : '0 words'})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShuffleDeck}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all text-xs flex items-center gap-1"
              title="Shuffle words"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>

            <button
              type="button"
              onClick={handlePrevWord}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 disabled:opacity-40 transition-all"
              title="Previous word"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNextWord}
              disabled={!currentDeck || currentIndex >= currentDeck.items.length - 1}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 disabled:opacity-40 transition-all"
              title="Next word"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Deck Progress Bar */}
        {currentDeck && currentDeck.items.length > 0 && (
          <div className="w-full h-1.5 bg-slate-900 rounded-full mb-6 overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / currentDeck.items.length) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Content Area */}
        {deckCompleted ? (
          /* Deck Complete Celebration Screen */
          <div className="w-full max-w-xl mx-auto my-auto p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-emerald-400 flex items-center justify-center text-slate-950 mx-auto mb-4 shadow-xl shadow-emerald-500/20">
              <Trophy className="w-9 h-9" />
            </div>

            <h3 className="text-2xl font-extrabold text-white">Deck Mastered!</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
              You completed all {currentDeck?.items.length} words in "{currentDeck?.title}". Tactile muscle memory and acoustic neural pathways reinforced!
            </p>

            <div className="grid grid-cols-2 gap-3 my-6">
              <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Words</span>
                <span className="text-xl font-bold text-emerald-400">{currentDeck?.items.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">XP Earned</span>
                <span className="text-xl font-bold text-amber-400">+{currentDeck?.items.length * 10} XP</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRestartDeck}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Again</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeckManagerOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>Browse Next Deck</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : !currentItem ? (
          /* Empty Deck State */
          <div className="w-full max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-white">This deck is currently empty</h4>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Add custom words or use the AI generator to auto-populate vocabulary for {currentLanguage}.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsAIDeckModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate with AI</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDeckManagerOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
              >
                Manage Deck
              </button>
            </div>
          </div>
        ) : (
          /* Exercise Modes */
          <div className="w-full flex justify-center">
            {currentMode === 'typing' && (
              <TypingExercise
                key={`${currentItem.id}-typing`}
                item={currentItem}
                language={currentLanguage}
                settings={settings}
                onComplete={handleTypingComplete}
                onNext={handleNextWord}
                streak={stats.streakDays}
              />
            )}

            {currentMode === 'dictation' && (
              <TypingExercise
                key={`${currentItem.id}-dictation`}
                item={currentItem}
                language={currentLanguage}
                settings={{ ...settings, autoPlayAudioOnWord: true }}
                onComplete={handleTypingComplete}
                onNext={handleNextWord}
                streak={stats.streakDays}
              />
            )}

            {currentMode === 'pronunciation' && (
              <PronunciationStudio
                key={`${currentItem.id}-pronunciation`}
                item={currentItem}
                language={currentLanguage}
                settings={settings}
                onScoreSaved={handlePronunciationScore}
                onNext={handleNextWord}
              />
            )}

            {currentMode === 'flashcards' && (
              <FlashcardExercise
                key={`${currentItem.id}-flashcards`}
                item={currentItem}
                language={currentLanguage}
                settings={settings}
                onAnswer={handleFlashcardAnswer}
              />
            )}

            {currentMode === 'scramble' && (
              <WordScrambleExercise
                key={`${currentItem.id}-scramble`}
                item={currentItem}
                language={currentLanguage}
                settings={settings}
                onComplete={handleNextWord}
              />
            )}
          </div>
        )}

        {/* Learning Stats & Progress Section */}
        <div className="w-full mt-10">
          <ProgressDashboard
            stats={stats}
            activeLanguage={currentLanguage}
            deckCount={languageDecks.length}
            totalWordsInLanguage={languageDecks.reduce((acc, d) => acc + d.items.length, 0)}
          />
        </div>
      </main>

      {/* Modals */}
      <DeckManagerModal
        isOpen={isDeckManagerOpen}
        onClose={() => setIsDeckManagerOpen(false)}
        decks={languageDecks}
        activeDeckId={activeDeckId}
        onSelectDeck={(deckId) => {
          setActiveDeckId(deckId);
          setCurrentIndex(0);
          setDeckCompleted(false);
        }}
        onAddCustomDeck={handleAddCustomDeck}
        onDeleteDeck={handleDeleteDeck}
        onOpenAIGenerator={() => {
          setIsDeckManagerOpen(false);
          setIsAIDeckModalOpen(true);
        }}
        activeLanguage={currentLanguage}
      />

      <AIDeckModal
        isOpen={isAIDeckModalOpen}
        onClose={() => setIsAIDeckModalOpen(false)}
        language={currentLanguage}
        onDeckCreated={(newDeck) => {
          handleAddCustomDeck(newDeck);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetStats={handleResetStats}
        activeLanguage={currentLanguage}
      />
    </div>
  );
}
