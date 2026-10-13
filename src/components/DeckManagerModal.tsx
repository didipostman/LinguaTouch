import React, { useState } from 'react';
import { VocabDeck, VocabItem, SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Download,
  Upload,
  Layers,
  Wand2,
  Check,
} from 'lucide-react';

interface DeckManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: VocabDeck[];
  activeDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onAddCustomDeck: (deck: VocabDeck) => void;
  onDeleteDeck: (deckId: string) => void;
  onOpenAIGenerator: () => void;
  activeLanguage: SupportedLanguage;
}

export const DeckManagerModal: React.FC<DeckManagerModalProps> = ({
  isOpen,
  onClose,
  decks,
  activeDeckId,
  onSelectDeck,
  onAddCustomDeck,
  onDeleteDeck,
  onOpenAIGenerator,
  activeLanguage,
}) => {
  const [selectedDeckForView, setSelectedDeckForView] = useState<string>(activeDeckId);
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newExampleTarget, setNewExampleTarget] = useState('');
  const [newExampleTranslation, setNewExampleTranslation] = useState('');
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');

  if (!isOpen) return null;

  const currentDeck = decks.find((d) => d.id === selectedDeckForView) || decks[0];

  const handleCreateEmptyDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckTitle.trim()) return;

    const deck: VocabDeck = {
      id: `custom-${Date.now()}`,
      title: newDeckTitle.trim(),
      description: newDeckDesc.trim() || 'Custom user vocabulary deck',
      language: activeLanguage,
      level: 'Beginner',
      category: 'Custom Decks',
      isCustom: true,
      items: [],
    };

    onAddCustomDeck(deck);
    setSelectedDeckForView(deck.id);
    setIsCreatingNewDeck(false);
    setNewDeckTitle('');
    setNewDeckDesc('');
  };

  const handleAddWordToCurrentDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newTranslation.trim() || !currentDeck) return;

    const newItem: VocabItem = {
      id: `item-${Date.now()}`,
      word: newWord.trim(),
      translation: newTranslation.trim(),
      phonetic: newPhonetic.trim() || `/${newWord.trim().toLowerCase()}/`,
      exampleTarget: newExampleTarget.trim(),
      exampleTranslation: newExampleTranslation.trim(),
      difficulty: 'medium',
    };

    currentDeck.items.push(newItem);
    setIsAddingWord(false);
    setNewWord('');
    setNewTranslation('');
    setNewPhonetic('');
    setNewExampleTarget('');
    setNewExampleTranslation('');
  };

  const handleDeleteWord = (itemId: string) => {
    if (!currentDeck) return;
    currentDeck.items = currentDeck.items.filter((i) => i.id !== itemId);
    setSelectedDeckForView(currentDeck.id); // re-render
  };

  const handleExportDeck = () => {
    if (!currentDeck) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentDeck, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentDeck.title.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportDeck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.title && Array.isArray(parsed.items)) {
          const importedDeck: VocabDeck = {
            ...parsed,
            id: `imported-${Date.now()}`,
            isCustom: true,
          };
          onAddCustomDeck(importedDeck);
          setSelectedDeckForView(importedDeck.id);
        }
      } catch (err) {
        alert('Invalid JSON deck format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Vocabulary Deck Library</h3>
              <p className="text-xs text-slate-400">
                Browse, customize, or generate vocabulary sets for {activeLanguage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAIGenerator}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Deck Creator</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left deck list, Right card viewer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[380px]">
          {/* Deck List Sidebar */}
          <div className="w-full md:w-72 border-r border-slate-800/80 p-4 overflow-y-auto space-y-2 bg-slate-950/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Your Decks ({decks.length})
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNewDeck(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            </div>

            {decks.map((deck) => {
              const isSelected = deck.id === selectedDeckForView;
              const isActive = deck.id === activeDeckId;

              return (
                <div
                  key={deck.id}
                  onClick={() => setSelectedDeckForView(deck.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/60 shadow-md'
                      : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-bold text-white truncate">{deck.title}</h4>
                    {isActive && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {deck.description}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <span>{deck.items.length} words</span>
                    <span>{deck.level}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Deck Details Panel */}
          <div className="flex-1 p-5 overflow-y-auto bg-slate-900/70">
            {currentDeck ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-white">{currentDeck.title}</h4>
                      {currentDeck.id === activeDeckId ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Currently Practicing
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectDeck(currentDeck.id);
                            onClose();
                          }}
                          className="text-xs px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-sm"
                        >
                          Select for Practice
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{currentDeck.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingWord(true)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Add Word</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportDeck}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
                      title="Export Deck to JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {currentDeck.isCustom && (
                      <button
                        type="button"
                        onClick={() => onDeleteDeck(currentDeck.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition-all"
                        title="Delete Deck"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Add Word Form */}
                {isAddingWord && (
                  <form
                    onSubmit={handleAddWordToCurrentDeck}
                    className="p-4 mb-4 rounded-2xl bg-slate-800/70 border border-slate-700 animate-in fade-in"
                  >
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                      Add New Vocabulary Word
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">
                          Word in {activeLanguage} *
                        </label>
                        <input
                          type="text"
                          value={newWord}
                          onChange={(e) => setNewWord(e.target.value)}
                          placeholder="e.g. Encantado"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">
                          English Translation *
                        </label>
                        <input
                          type="text"
                          value={newTranslation}
                          onChange={(e) => setNewTranslation(e.target.value)}
                          placeholder="e.g. Delighted / Nice to meet you"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="text-[11px] text-slate-300 block mb-1">
                          Phonetic IPA (optional)
                        </label>
                        <input
                          type="text"
                          value={newPhonetic}
                          onChange={(e) => setNewPhonetic(e.target.value)}
                          placeholder="e.g. /en.kanˈta.do/"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-300 block mb-1">
                          Example Sentence (optional)
                        </label>
                        <input
                          type="text"
                          value={newExampleTarget}
                          onChange={(e) => setNewExampleTarget(e.target.value)}
                          placeholder="e.g. Encantado de conocerle."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingWord(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs font-medium text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                      >
                        Save Word
                      </button>
                    </div>
                  </form>
                )}

                {/* Words Table */}
                <div className="space-y-2">
                  {currentDeck.items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all"
                    >
                      <div className="flex-1 pr-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold text-white">{it.word}</span>
                          {it.phonetic && (
                            <span className="text-xs font-mono text-emerald-400/80">
                              {it.phonetic}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">{it.translation}</p>
                        {it.exampleTarget && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5">
                            "{it.exampleTarget}"
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteWord(it.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-all"
                        title="Delete word"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {currentDeck.items.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No words in this deck yet. Click "Add Word" or use the AI Deck Creator to populate it!
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">Select a deck to view</div>
            )}
          </div>
        </div>

        {/* Modal Footer with Import Option */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 text-xs text-slate-400">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import Deck (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportDeck}
              className="hidden"
            />
          </label>

          <span>Tip: Master custom vocabulary with tactile keyboard drills</span>
        </div>
      </div>
    </div>
  );
};
