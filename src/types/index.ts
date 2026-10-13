export type SupportedLanguage = 
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Italian'
  | 'Japanese'
  | 'Mandarin'
  | 'Portuguese';

export interface LanguageConfig {
  id: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  bcp47: string;
  defaultVoice: string;
  specialChars: string[];
  charShortcuts?: Record<string, string>;
  hasPinyinOrRomaji?: boolean;
}

export interface VocabItem {
  id: string;
  word: string;
  translation: string;
  phonetic: string;
  exampleTarget: string;
  exampleTranslation: string;
  notes?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  // Mastery stats
  timesPracticed?: number;
  timesCorrect?: number;
  bestVoiceScore?: number;
  lastPracticed?: number;
}

export interface VocabDeck {
  id: string;
  title: string;
  description: string;
  language: SupportedLanguage;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  isCustom?: boolean;
  items: VocabItem[];
}

export type ExerciseMode = 
  | 'typing'        // Tactile keyboard typing drill
  | 'pronunciation' // Voice & phonetic evaluation
  | 'dictation'     // Listen to audio, type what you hear (blind)
  | 'flashcards'    // Rapid card recall
  | 'scramble';     // Assemble word from letters

export interface PhonemeFeedbackItem {
  part: string;
  ipa?: string;
  status: 'good' | 'needs-work' | 'missed';
  feedback: string;
}

export interface PronunciationResult {
  overallScore: number;
  rating: string;
  phonemeFeedback: PhonemeFeedbackItem[];
  articulatoryTips: string;
  stressFeedback: string;
  encouragement: string;
  transcript?: string;
  userAudioUrl?: string;
}

export interface UserStats {
  totalKeystrokes: number;
  wordsCompleted: number;
  accuracyRate: number;
  streakDays: number;
  lastPracticeDate: string;
  pronunciationPractices: number;
  averageVoiceScore: number;
  levelXP: number;
}

export interface AppSettings {
  soundEffects: boolean;
  keyboardClickSound: boolean;
  autoPlayAudioOnWord: boolean;
  ttsVoiceName: string;
  ttsSpeed: number; // 0.75, 1.0, 1.25
  showVirtualKeyboard: boolean;
  showPhoneticGuides: boolean;
  highlightNextKey: boolean;
  theme: 'dark' | 'light' | 'slate';
}
