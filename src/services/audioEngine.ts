import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private audioCache = new Map<string, AudioBuffer>();
  private isMuted = false;

  constructor() {
    // Lazily initialized on first user gesture
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public stopAll() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // ignore if already stopped
      }
      this.currentSource = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Synthesize sound effects using Web Audio API (tactile keyboard click, success chime, etc.)
  public playKeyClick(variant: 'type' | 'backspace' | 'enter' = 'type') {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      if (variant === 'type') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (variant === 'backspace') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (err) {
      // AudioContext may be restricted before interaction
    }
  }

  public playTypo() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.09);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      // ignore
    }
  }

  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.05;
        const dur = 0.22;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (e) {
      // ignore
    }
  }

  public playMicBeep(type: 'start' | 'stop') {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      if (type === 'start') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      } else {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      }
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // ignore
    }
  }

  // Play PCM raw audio returned by Gemini 3.8 Flash Lite TTS
  private async playPcmAudio(base64: string, sampleRate = 24000, playbackRate = 1.0): Promise<void> {
    const ctx = this.getAudioContext();
    this.stopAll();

    // Convert base64 to Uint8Array
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Check if it's WAV container or raw 16-bit PCM
    let audioBuffer: AudioBuffer;
    if (binary.startsWith('RIFF')) {
      audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
    } else {
      // Raw 16-bit little-endian PCM
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }
      audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32);
    }

    return new Promise((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackRate;
      source.connect(ctx.destination);
      source.onended = () => {
        if (this.currentSource === source) {
          this.currentSource = null;
        }
        resolve();
      };
      this.currentSource = source;
      source.start(0);
    });
  }

  // Browser speech synthesis fallback
  private playWebSpeech(text: string, language: SupportedLanguage, speed = 1.0): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      this.stopAll();

      const langConfig = SUPPORTED_LANGUAGES[language];
      const bcp47 = langConfig ? langConfig.bcp47 : 'en-US';

      // Clean text of parentheses or notes for cleaner speech
      const cleaned = text.replace(/\([^)]*\)/g, '').trim();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = bcp47;
      utterance.rate = Math.max(0.4, Math.min(2.0, speed));
      utterance.pitch = 1.0;

      // Select best matching native voice if available
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(
        (v) => v.lang.startsWith(bcp47.split('-')[0]) || v.lang === bcp47
      );
      if (match) {
        utterance.voice = match;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  // High-level speak function: tries Gemini TTS first, with instant fallback to WebSpeech
  public async speakText({
    text,
    language,
    voiceName = 'Kore',
    speed = 1.0,
    forceWebSpeech = false,
  }: {
    text: string;
    language: SupportedLanguage;
    voiceName?: string;
    speed?: number;
    forceWebSpeech?: boolean;
  }): Promise<void> {
    if (!text || !text.trim()) return;

    if (forceWebSpeech) {
      return this.playWebSpeech(text, language, speed);
    }

    const cacheKey = `${language}:${voiceName}:${speed}:${text.trim()}`;
    const cachedBuffer = this.audioCache.get(cacheKey);

    if (cachedBuffer) {
      const ctx = this.getAudioContext();
      this.stopAll();
      return new Promise((resolve) => {
        const source = ctx.createBufferSource();
        source.buffer = cachedBuffer;
        source.playbackRate.value = speed;
        source.connect(ctx.destination);
        source.onended = () => {
          if (this.currentSource === source) {
            this.currentSource = null;
          }
          resolve();
        };
        this.currentSource = source;
        source.start(0);
      });
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.replace(/\([^)]*\)/g, '').trim(),
          language,
          voiceName,
          speed,
        }),
      });

      if (!res.ok) {
        throw new Error(`TTS server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data.audio) {
        await this.playPcmAudio(data.audio, data.sampleRate || 24000, speed);
        return;
      }
    } catch (err) {
      console.warn('Gemini TTS unavailable, falling back to Web Speech Synthesis:', err);
    }

    // Seamless fallback to browser speech synthesis
    await this.playWebSpeech(text, language, speed);
  }
}

export const audioEngine = new AudioEngine();
