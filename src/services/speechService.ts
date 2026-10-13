import { PronunciationResult, SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { audioEngine } from './audioEngine';

export interface SpeechRecognitionHandlers {
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onAudioLevel?: (level: number) => void; // 0.0 to 1.0
}

class SpeechService {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private isRecording = false;

  public isSpeechRecognitionSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  public async startListening(
    language: SupportedLanguage,
    handlers: SpeechRecognitionHandlers
  ): Promise<boolean> {
    if (this.isRecording) {
      this.stopListening();
    }

    const langConfig = SUPPORTED_LANGUAGES[language];
    const bcp47 = langConfig ? langConfig.bcp47 : 'en-US';

    try {
      // 1. Start Audio Stream & Analyzer for waveform
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtxClass();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // Audio level loop
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const checkAudioLevel = () => {
        if (!this.analyser || !this.isRecording) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1.0, avg / 128);
        handlers.onAudioLevel?.(normalized);
        this.animFrameId = requestAnimationFrame(checkAudioLevel);
      };

      // 2. Setup MediaRecorder to capture audio for Gemini Evaluation
      this.audioChunks = [];
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      let chosenMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          chosenMime = m;
          break;
        }
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, chosenMime ? { mimeType: chosenMime } : undefined);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      audioEngine.playMicBeep('start');
      this.animFrameId = requestAnimationFrame(checkAudioLevel);

      // 3. Web Speech Recognition for instant on-the-fly text
      const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechClass) {
        this.recognition = new SpeechClass();
        this.recognition.lang = bcp47;
        this.recognition.interimResults = true;
        this.recognition.continuous = true;
        this.recognition.maxAlternatives = 3;

        this.recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }
          if (interim) {
            handlers.onInterimResult?.(interim);
          }
          if (final) {
            handlers.onFinalResult?.(final);
          }
        };

        this.recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition error:', e);
          if (e.error !== 'no-speech') {
            handlers.onError?.(e.error);
          }
        };

        try {
          this.recognition.start();
        } catch (e) {
          // ignore already started
        }
      }

      return true;
    } catch (err: any) {
      console.error('Error starting audio capture:', err);
      handlers.onError?.(err?.message || 'Microphone access denied or unavailable');
      this.stopListening();
      return false;
    }
  }

  public stopListening(): Promise<{ blob: Blob | null; base64: string | null; mimeType: string }> {
    return new Promise((resolve) => {
      this.isRecording = false;
      audioEngine.playMicBeep('stop');

      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }

      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {
          // ignore
        }
        this.recognition = null;
      }

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        this.mediaRecorder.onstop = async () => {
          const blob = new Blob(this.audioChunks, { type: mimeType });
          const base64 = await this.blobToBase64(blob);

          this.cleanupTracks();
          resolve({ blob, base64, mimeType });
        };
        this.mediaRecorder.stop();
      } else {
        this.cleanupTracks();
        resolve({ blob: null, base64: null, mimeType: 'audio/webm' });
      }
    });
  }

  private cleanupTracks() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }
    this.analyser = null;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/xxx;base64, prefix
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  public async evaluatePronunciation({
    targetText,
    targetLanguage,
    phoneticExpected,
    transcript,
    audioBase64,
    audioMimeType,
  }: {
    targetText: string;
    targetLanguage: SupportedLanguage;
    phoneticExpected?: string;
    transcript?: string;
    audioBase64?: string | null;
    audioMimeType?: string;
  }): Promise<PronunciationResult> {
    const res = await fetch('/api/pronunciation-evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetText,
        targetLanguage,
        phoneticExpected,
        transcript,
        audioBase64,
        audioMimeType,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Evaluation failed');
    }

    const data: PronunciationResult = await res.json();
    return data;
  }
}

export const speechService = new SpeechService();
