import React, { useState } from 'react';
import { SupportedLanguage, VocabDeck, VocabItem } from '../types';
import { Sparkles, X, Loader2, BookOpen, AlertCircle, Wand2 } from 'lucide-react';

interface AIDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onDeckCreated: (newDeck: VocabDeck) => void;
}

export const AIDeckModal: React.FC<AIDeckModalProps> = ({
  isOpen,
  onClose,
  language,
  onDeckCreated,
}) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [count, setCount] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickTopics = [
    'Airport & Customs Clearance',
    'Coffee Shop & Bakery Orders',
    'Hotel Check-in & Inquiries',
    'Tech & Remote Work Meetings',
    'Medical Symptoms & Pharmacy',
    'Dating & Compliments',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          topic: topic.trim(),
          level: level.toLowerCase(),
          count,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate vocabulary deck');
      }

      const data = await res.json();
      const newItems: VocabItem[] = (data.items || []).map((it: any, idx: number) => ({
        id: `ai-${Date.now()}-${idx}`,
        word: it.word,
        translation: it.translation,
        phonetic: it.phonetic || '',
        exampleTarget: it.exampleTarget || '',
        exampleTranslation: it.exampleTranslation || '',
        notes: it.notes || '',
        difficulty: (it.difficulty || 'medium').toLowerCase(),
      }));

      const deck: VocabDeck = {
        id: `deck-${Date.now()}`,
        title: data.title || `${topic} (${language})`,
        description: data.description || `AI-generated custom vocabulary for ${topic}`,
        language,
        level,
        category: 'Custom AI',
        isCustom: true,
        items: newItems,
      };

      onDeckCreated(deck);
      onClose();
    } catch (err: any) {
      console.error('AI deck generator error:', err);
      setErrorMsg(err.message || 'Something went wrong generating deck.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Custom Vocabulary Generator</h3>
            <p className="text-xs text-slate-400">Target Language: <strong className="text-emerald-400">{language}</strong></p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Topic or Conversation Theme
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Ordering craft beer in Barcelona, Negotiating apartment lease..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Quick topic pills */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">Quick Inspiration:</span>
            <div className="flex flex-wrap gap-1.5">
              {quickTopics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Beginner">Beginner (A1-A2)</option>
                <option value="Intermediate">Intermediate (B1-B2)</option>
                <option value="Advanced">Advanced (C1-C2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Number of Words
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={5}>5 Words</option>
                <option value={8}>8 Words (Recommended)</option>
                <option value={12}>12 Words</option>
                <option value={15}>15 Words</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !topic.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Deck...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Deck</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
