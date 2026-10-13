import React from 'react';

interface AudioWaveformProps {
  level: number; // 0 to 1
  isRecording: boolean;
  isPlaying?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  level,
  isRecording,
  isPlaying,
}) => {
  const bars = 20;

  return (
    <div className="flex items-center justify-center gap-1 h-12 px-4 py-2 bg-slate-900/60 rounded-xl border border-slate-800">
      {Array.from({ length: bars }).map((_, i) => {
        // Pseudo-random wave pattern modulated by actual audio level
        const distFromCenter = Math.abs(i - bars / 2) / (bars / 2);
        const factor = Math.max(0.15, 1 - distFromCenter * 0.7);

        let heightPercent = 20;
        if (isRecording) {
          const jitter = Math.sin(Date.now() / 150 + i) * 0.2;
          heightPercent = Math.min(100, Math.max(15, (level * 90 + jitter * 20) * factor));
        } else if (isPlaying) {
          const wave = Math.sin(Date.now() / 200 + i * 0.6) * 0.5 + 0.5;
          heightPercent = Math.min(95, Math.max(20, wave * 80 * factor));
        }

        const barColor = isRecording
          ? 'bg-rose-500 shadow-rose-500/50'
          : isPlaying
          ? 'bg-emerald-400 shadow-emerald-400/50'
          : 'bg-slate-700';

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${barColor} shadow-sm`}
            style={{
              height: `${heightPercent}%`,
            }}
          />
        );
      })}
    </div>
  );
};
