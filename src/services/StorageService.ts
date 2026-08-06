import type { Word, QuizRecord, VoiceAccent, StudyMode, WordTier } from '../types';

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  voiceAccent: VoiceAccent;
  voicePlayMode: 'single' | 'all'; // 'single' = 播放單一口音, 'all' = 連播全口音 (美➔英➔澳)
  speechRate: number;
  dailyGoal: number;
  enabledTiers: WordTier[];
  studyMode: StudyMode;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  voiceAccent: 'us',
  voicePlayMode: 'all',
  speechRate: 1.0,
  dailyGoal: 20,
  enabledTiers: ['score_basic', 'score_600', 'score_800', 'score_900'],
  studyMode: 'byDay',
};

class StorageService {
  // Settings
  public getSettings(): AppSettings {
    try {
      const data = localStorage.getItem('toeic30_settings');
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: Partial<AppSettings>) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem('toeic30_settings', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  // Progress
  public getWordProgress(mode: StudyMode, unitId: string): number {
    try {
      const val = localStorage.getItem(`toeic30_progress_${mode}_${unitId}`);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  }

  public saveWordProgress(mode: StudyMode, unitId: string, index: number) {
    try {
      localStorage.setItem(`toeic30_progress_${mode}_${unitId}`, String(index));
    } catch (e) {
      console.error(e);
    }
  }

  // Favorites
  public getFavorites(): Word[] {
    try {
      const data = localStorage.getItem('toeic30_favorites');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public toggleFavorite(word: Word): boolean {
    const list = this.getFavorites();
    const existsIndex = list.findIndex(w => w.id === word.id || (w.word === word.word && w.day === word.day));
    let isFav = false;
    if (existsIndex >= 0) {
      list.splice(existsIndex, 1);
      isFav = false;
    } else {
      list.unshift(word);
      isFav = true;
    }
    localStorage.setItem('toeic30_favorites', JSON.stringify(list));
    return isFav;
  }

  public isFavorite(wordId: string): boolean {
    const list = this.getFavorites();
    return list.some(w => w.id === wordId);
  }

  // Quiz Records
  public getQuizRecords(): QuizRecord[] {
    try {
      const data = localStorage.getItem('toeic30_quiz_records');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveQuizRecord(record: QuizRecord) {
    try {
      const records = this.getQuizRecords();
      records.unshift(record);
      if (records.length > 50) records.pop();
      localStorage.setItem('toeic30_quiz_records', JSON.stringify(records));
      this.accumulateMistakes(record.mistakeWords);
    } catch (e) {
      console.error(e);
    }
  }

  // Accumulated Mistakes
  public getMistakeWords(): Word[] {
    try {
      const data = localStorage.getItem('toeic30_mistake_book');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public accumulateMistakes(words: Word[]) {
    if (!words || words.length === 0) return;
    const current = this.getMistakeWords();
    const map = new Map<string, Word>();
    current.forEach(w => map.set(w.id, w));
    words.forEach(w => map.set(w.id, w));
    localStorage.setItem('toeic30_mistake_book', JSON.stringify(Array.from(map.values())));
  }

  public removeMistake(wordId: string) {
    const current = this.getMistakeWords().filter(w => w.id !== wordId);
    localStorage.setItem('toeic30_mistake_book', JSON.stringify(current));
  }

  public clearMistakes() {
    localStorage.removeItem('toeic30_mistake_book');
  }

  // User Stats & Streak
  public getUserStats() {
    try {
      const data = localStorage.getItem('toeic30_stats');
      return data ? JSON.parse(data) : { streak: 1, lastStudyDate: new Date().toISOString().split('T')[0], totalLearned: 0 };
    } catch {
      return { streak: 1, lastStudyDate: new Date().toISOString().split('T')[0], totalLearned: 0 };
    }
  }

  public recordStudyActivity(wordsCount: number = 1) {
    const stats = this.getUserStats();
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (stats.lastStudyDate === yesterday) {
        stats.streak += 1;
      } else {
        stats.streak = 1;
      }
      stats.lastStudyDate = today;
    }
    stats.totalLearned = (stats.totalLearned || 0) + wordsCount;
    localStorage.setItem('toeic30_stats', JSON.stringify(stats));
  }
}

export const storageService = new StorageService();
