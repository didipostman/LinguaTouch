import React from 'react';
import { AppSettings, SupportedLanguage } from '../types';
import { audioEngine } from '../services/audioEngine';
import {
  X,
  Volume2,
  Keyboard as KeyboardIcon,
  Sliders,
  Sparkles,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetStats: () => void;
  activeLanguage: SupportedLanguage;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetStats,
  activeLanguage,
}) => {
  if (!isOpen) return null;

  const voices = ['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'];

  const testVoice = (voiceName: string) => {
    audioEngine.speakText({
      text: activeLanguage === 'Spanish' ? '¡Hola! Bienvenidos a LinguaTouch.' : 'Bonjour, bienvenue !',
      language: activeLanguage,
      voiceName,
      speed: settings.ttsSpeed,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Audio & Practice Settings</h3>
            <p className="text-xs text-slate-400">Tailor your tactile & vocal learning preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* TTS Voice Persona */}
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800">
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
              Gemini AI Native Voice
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {voices.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    onUpdateSettings({ ttsVoiceName: v });
                    testVoice(v);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    settings.ttsVoiceName === v
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-slate-800 text-slate-400 border-slate-700/80 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span>{v}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              High-fidelity Gemini speech model tuned for authentic phonetics. Click to sample.
            </p>
          </div>

          {/* Speech Playback Speed */}
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Default Speech Speed
              </label>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                {settings.ttsSpeed}x
              </span>
            </div>
            <div className="flex gap-2">
              {[0.75, 1.0, 1.25].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onUpdateSettings({ ttsSpeed: spd })}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    settings.ttsSpeed === spd
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {spd}x {spd === 1.0 ? '(Normal)' : spd < 1.0 ? '(Slow)' : '(Fast)'}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-all">
              <div className="pr-2">
                <span className="text-xs font-semibold text-white block">Mechanical Keyboard Audio</span>
                <span className="text-[11px] text-slate-400">Play crisp tactile click on keypress</span>
              </div>
              <input
                type="checkbox"
                checked={settings.keyboardClickSound}
                onChange={(e) => onUpdateSettings({ keyboardClickSound: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-all">
              <div className="pr-2">
                <span className="text-xs font-semibold text-white block">Sound Effects</span>
                <span className="text-[11px] text-slate-400">Success chimes & subtle typo notifications</span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => {
                  onUpdateSettings({ soundEffects: e.target.checked });
                  audioEngine.setMuted(!e.target.checked);
                }}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-all">
              <div className="pr-2">
                <span className="text-xs font-semibold text-white block">Auto-Play Audio</span>
                <span className="text-[11px] text-slate-400">Speak target word automatically when displayed</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoPlayAudioOnWord}
                onChange={(e) => onUpdateSettings({ autoPlayAudioOnWord: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/70 transition-all">
              <div className="pr-2">
                <span className="text-xs font-semibold text-white block">Show Phonetic IPA Guides</span>
                <span className="text-[11px] text-slate-400">Display International Phonetic Alphabet /.../</span>
              </div>
              <input
                type="checkbox"
                checked={settings.showPhoneticGuides}
                onChange={(e) => onUpdateSettings({ showPhoneticGuides: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
              />
            </label>
          </div>

          {/* Reset Stats */}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset your practice stats and streak counter?')) {
                  onResetStats();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Learning Stats</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
