export type WordTier = 'score_basic' | 'score_600' | 'score_800' | 'score_900';

export type StudyMode = 'byDay' | 'byLevel' | 'random';

export type QuizType = 'enToZh' | 'zhToEn' | 'listening' | 'fillInBlank';

export type VoiceAccent = 'us' | 'uk' | 'au' | 'ca' | 'random';

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  pos: string;
  chinese: string;
  example_en: string;
  example_zh: string;
  day: number;
  tier: WordTier;
}

export interface DayPlan {
  day: number;
  title: string;
  total_words: number;
  counts: Record<string, number>;
  vocabulary: Word[];
}

export interface QuizQuestion {
  word: Word;
  type: QuizType;
  stem: string;
  options: string[];
  correctIndex: number;
  selectedIndex?: number;
  isAnswered?: boolean;
}

export interface QuizRecord {
  id: string;
  timestamp: string;
  scopeTitle: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  scorePercentage: number;
  mistakeWords: Word[];
}

export interface UserStats {
  streak: number;
  lastStudyDate: string;
  totalLearnedWords: number;
}
