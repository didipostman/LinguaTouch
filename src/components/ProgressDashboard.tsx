import React from 'react';
import { UserStats, SupportedLanguage } from '../types';
import {
  Trophy,
  Flame,
  Zap,
  Activity,
  CheckCircle2,
  Keyboard as KeyboardIcon,
  Sparkles,
  Award,
} from 'lucide-react';

interface ProgressDashboardProps {
  stats: UserStats;
  activeLanguage: SupportedLanguage;
  deckCount: number;
  totalWordsInLanguage: number;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  stats,
  activeLanguage,
  deckCount,
  totalWordsInLanguage,
}) => {
  // XP level calculation: level every 100 XP
  const level = Math.floor(stats.levelXP / 100) + 1;
  const currentLevelXP = stats.levelXP % 100;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 mb-8">
      {/* Top Banner Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Streak */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Daily Streak
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">
              {stats.streakDays} <span className="text-xs text-amber-400 font-normal">days</span>
            </span>
          </div>
        </div>

        {/* Typing Accuracy */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Typing Accuracy
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">
              {stats.accuracyRate}%
            </span>
          </div>
        </div>

        {/* Pronunciation Average */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Voice Accuracy
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">
              {stats.averageVoiceScore > 0 ? `${stats.averageVoiceScore}%` : '—'}
            </span>
          </div>
        </div>

        {/* Words Mastered */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-lg flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Words Practiced
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">
              {stats.wordsCompleted}
            </span>
          </div>
        </div>
      </div>

      {/* Level XP Bar */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
            {level}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                Level {level} Speaker
              </h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-semibold border border-emerald-500/20">
                {stats.levelXP} XP Total
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Practice words and pronunciation drills to reach Level {level + 1}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
            <span>{currentLevelXP} / 100 XP</span>
            <span>{100 - currentLevelXP} XP to Level {level + 1}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${currentLevelXP}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
