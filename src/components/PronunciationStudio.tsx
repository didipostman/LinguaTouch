import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VocabItem, SupportedLanguage, AppSettings, PronunciationResult } from '../types';
import { audioEngine } from '../services/audioEngine';
import { speechService } from '../services/speechService';
import { AudioWaveform } from './AudioWaveform';
import confetti from 'canvas-confetti';
import {
  Mic,
  Square,
  Volume2,
  Turtle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  Layers,
  Award,
} from 'lucide-react';

interface PronunciationStudioProps {
  item: VocabItem;
  language: SupportedLanguage;
  settings: AppSettings;
  onScoreSaved: (score: number) => void;
  onNext: () => void;
}

export const PronunciationStudio: React.FC<PronunciationStudioProps> = ({
  item,
  language,
  settings,
  onScoreSaved,
  onNext,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<PronunciationResult | null>(null);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [isPlayingNative, setIsPlayingNative] = useState(false);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Reset when item changes
  useEffect(() => {
    setIsRecording(false);
    setAudioLevel(0);
    setInterimTranscript('');
    setFinalTranscript('');
    setIsEvaluating(false);
    setEvaluationResult(null);
    if (userAudioUrl) {
      URL.revokeObjectURL(userAudioUrl);
    }
    setUserAudioUrl(null);
    setErrorMsg(null);
  }, [item.id]);

  // Clean up user audio URL on unmount
  useEffect(() => {
    return () => {
      if (userAudioUrl) {
        URL.revokeObjectURL(userAudioUrl);
      }
      speechService.stopListening();
    };
  }, [userAudioUrl]);

  // Play native speaker audio
  const handlePlayNative = useCallback(async (speed = settings.ttsSpeed) => {
    setIsPlayingNative(true);
    await audioEngine.speakText({
      text: item.word,
      language,
      voiceName: settings.ttsVoiceName,
      speed,
    });
    setIsPlayingNative(false);
  }, [item.word, language, settings.ttsVoiceName, settings.ttsSpeed]);

  // Start Voice Recording
  const startRecording = async () => {
    setErrorMsg(null);
    setInterimTranscript('');
    setFinalTranscript('');
    setEvaluationResult(null);

    const started = await speechService.startListening(language, {
      onInterimResult: (text) => setInterimTranscript(text),
      onFinalResult: (text) => setFinalTranscript((prev) => (prev ? prev + ' ' + text : text)),
      onAudioLevel: (lvl) => setAudioLevel(lvl),
      onError: (err) => {
        console.warn('Speech recognition notice:', err);
      },
    });

    if (started) {
      setIsRecording(true);
    } else {
      setErrorMsg('Microphone access denied or unavailable in this browser.');
    }
  };

  // Stop Recording & Trigger Real-Time Evaluation
  const stopRecordingAndEvaluate = async () => {
    setIsRecording(false);
    setIsEvaluating(true);

    try {
      const { blob, base64, mimeType } = await speechService.stopListening();

      let createdUrl: string | null = null;
      if (blob && blob.size > 0) {
        createdUrl = URL.createObjectURL(blob);
        setUserAudioUrl(createdUrl);
      }

      const activeTranscript = finalTranscript || interimTranscript;

      const evalData = await speechService.evaluatePronunciation({
        targetText: item.word,
        targetLanguage: language,
        phoneticExpected: item.phonetic,
        transcript: activeTranscript,
        audioBase64: base64,
        audioMimeType: mimeType,
      });

      if (createdUrl) {
        evalData.userAudioUrl = createdUrl;
      }
      evalData.transcript = activeTranscript;

      setEvaluationResult(evalData);
      onScoreSaved(evalData.overallScore);

      if (evalData.overallScore >= 85) {
        audioEngine.playSuccessChime();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      }
    } catch (err: any) {
      console.error('Evaluation error:', err);
      setErrorMsg(err.message || 'Pronunciation evaluation failed. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Play user recorded audio
  const handlePlayUserAudio = () => {
    if (!userAudioUrl) return;
    if (!userAudioElementRef.current) {
      userAudioElementRef.current = new Audio(userAudioUrl);
      userAudioElementRef.current.onended = () => setIsPlayingUser(false);
    } else {
      userAudioElementRef.current.src = userAudioUrl;
    }
    setIsPlayingUser(true);
    userAudioElementRef.current.play();
  };

  // Hotkey listener (Spacebar or M to toggle recording)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === ' ' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (isRecording) {
          stopRecordingAndEvaluate();
        } else if (!isEvaluating) {
          startRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, isEvaluating]);

  // Score badge helper
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 75) return 'text-sky-400 border-sky-500/40 bg-sky-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      {/* Studio Card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative backdrop-blur-xl mb-6">
        {/* Header tag */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Real-Time Pronunciation Studio
            </span>
            <span className="text-xs text-slate-400">Press Space or click mic to speak</span>
          </div>

          <div className="flex items-center gap-2">
            {item.difficulty && (
              <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                {item.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Word Display */}
        <div className="text-center my-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {item.word}
          </h2>
          <p className="text-lg text-emerald-400/90 font-mono mt-1 font-semibold">
            {item.phonetic}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            "{item.translation}"
          </p>
        </div>

        {/* Reference Audio Players */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 my-5">
          <button
            type="button"
            onClick={() => handlePlayNative(1.0)}
            disabled={isPlayingNative || isRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-sm font-semibold border border-slate-700 shadow-md transition-all disabled:opacity-50"
          >
            <Volume2 className={`w-4 h-4 text-emerald-400 ${isPlayingNative ? 'animate-bounce' : ''}`} />
            <span>Native Speaker (1.0x)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlayNative(0.7)}
            disabled={isPlayingNative || isRecording}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-300 text-xs font-medium border border-slate-700/70 transition-all disabled:opacity-50"
          >
            <Turtle className="w-3.5 h-3.5 text-amber-400" />
            <span>Slow Syllables (0.7x)</span>
          </button>

          {userAudioUrl && (
            <button
              type="button"
              onClick={handlePlayUserAudio}
              disabled={isPlayingUser || isRecording}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 text-xs font-semibold border border-sky-800/60 shadow-sm transition-all"
            >
              <Play className={`w-3.5 h-3.5 fill-sky-400 ${isPlayingUser ? 'animate-pulse' : ''}`} />
              <span>Hear My Attempt</span>
            </button>
          )}
        </div>

        {/* Live Audio Visualizer */}
        <div className="my-5">
          <AudioWaveform
            level={audioLevel}
            isRecording={isRecording}
            isPlaying={isPlayingNative || isPlayingUser}
          />
        </div>

        {/* Big Record / Stop Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            type="button"
            onClick={() => {
              if (isRecording) {
                stopRecordingAndEvaluate();
              } else {
                startRecording();
              }
            }}
            disabled={isEvaluating}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 transform active:scale-95 shadow-2xl relative ${
              isRecording
                ? 'bg-rose-500 text-white ring-8 ring-rose-500/20 shadow-rose-500/50 animate-pulse'
                : isEvaluating
                ? 'bg-slate-800 text-slate-400 ring-4 ring-slate-700 cursor-wait'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-8 ring-emerald-500/20 shadow-emerald-500/30'
            }`}
            title={isRecording ? 'Click to Stop & Evaluate' : 'Click to Speak'}
          >
            {isRecording ? (
              <Square className="w-7 h-7 fill-white" />
            ) : isEvaluating ? (
              <Sparkles className="w-7 h-7 animate-spin text-emerald-400" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>

          <span className="text-xs font-medium text-slate-400 mt-3">
            {isRecording
              ? 'Listening... Click square or hit Space when done'
              : isEvaluating
              ? 'AI Speech Coach analyzing phonemes & cadence...'
              : 'Press Space or tap to speak'}
          </span>

          {/* Live recognized transcript */}
          {(interimTranscript || finalTranscript) && (
            <div className="mt-3 px-4 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 font-mono flex items-center gap-2">
              <span className="text-slate-400 text-[10px] uppercase">Recognized:</span>
              <span className="text-emerald-300 font-semibold">"{finalTranscript || interimTranscript}"</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Real-Time AI Feedback Results Panel */}
        {evaluationResult && (
          <div className="mt-8 pt-6 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Score Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-850 border border-slate-800 mb-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-extrabold ${getScoreColor(
                    evaluationResult.overallScore
                  )}`}
                >
                  <span className="text-2xl leading-none">{evaluationResult.overallScore}</span>
                  <span className="text-[10px] uppercase tracking-wider mt-0.5">/ 100</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {evaluationResult.rating} Pronunciation
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {evaluationResult.overallScore >= 90
                        ? 'Native-like'
                        : evaluationResult.overallScore >= 75
                        ? 'Clear & Intelligible'
                        : 'Practice Needed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    {evaluationResult.encouragement}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <span>Next Word</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Phoneme Breakdown Chips */}
            {evaluationResult.phonemeFeedback && evaluationResult.phonemeFeedback.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Phoneme & Syllable Breakdown
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {evaluationResult.phonemeFeedback.map((pf, idx) => {
                    const statusColor =
                      pf.status === 'good'
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                        : pf.status === 'needs-work'
                        ? 'border-amber-500/40 bg-amber-950/20 text-amber-300'
                        : 'border-rose-500/40 bg-rose-950/20 text-rose-300';

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${statusColor} transition-all`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 font-mono font-bold text-sm">
                            <span>"{pf.part}"</span>
                            {pf.ipa && <span className="text-xs text-slate-400">{pf.ipa}</span>}
                          </div>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-900/60">
                            {pf.status === 'good' ? 'Accurate' : pf.status === 'needs-work' ? 'Needs Polish' : 'Missed'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {pf.feedback}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mouth / Tongue Physical Articulatory Tips */}
            {evaluationResult.articulatoryTips && (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 mb-4">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Articulatory & Mouth Placement</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {evaluationResult.articulatoryTips}
                </p>
              </div>
            )}

            {/* Syllable Stress Note */}
            {evaluationResult.stressFeedback && (
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-wider text-indigo-300">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Stress & Cadence</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {evaluationResult.stressFeedback}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
