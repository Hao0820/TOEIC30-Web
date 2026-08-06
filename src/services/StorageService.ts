import type { Word, QuizRecord, VoiceAccent, StudyMode, WordTier } from '../types';

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  voiceAccent: VoiceAccent;
  voicePlayMode: 'single' | 'all'; // 'single' = 播放單一口音, 'all' = 連播全口音 (美➔英➔澳)
  speechRate: number;
  dailyGoal: number;
  enabledTiers: WordTier[];
  studyMode: StudyMode;
  quizTimerSeconds: number; // 0 = 無時限, 5/10/15/20/30 秒
  lastSelectedDay: number; // 上次停留的天數 (1~30)
  lastSelectedTier: WordTier; // 上次停留的分數階段 (score_basic ~ score_900)
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  voiceAccent: 'us',
  voicePlayMode: 'all',
  speechRate: 1.0,
  dailyGoal: 20,
  enabledTiers: ['score_basic', 'score_600', 'score_800', 'score_900'],
  studyMode: 'byDay',
  quizTimerSeconds: 15,
  lastSelectedDay: 1,
  lastSelectedTier: 'score_basic',
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

  // Mastered Words (已背熟單字)
  public getMasteredWords(): string[] {
    try {
      const data = localStorage.getItem('toeic30_mastered_words');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public isMastered(wordId: string): boolean {
    const list = this.getMasteredWords();
    return list.includes(wordId);
  }

  public toggleMastered(wordId: string): boolean {
    const list = this.getMasteredWords();
    const idx = list.indexOf(wordId);
    let mastered = false;
    if (idx >= 0) {
      list.splice(idx, 1);
      mastered = false;
    } else {
      list.push(wordId);
      mastered = true;
    }
    localStorage.setItem('toeic30_mastered_words', JSON.stringify(list));
    
    // Update stats totalLearned
    const stats = this.getUserStats();
    stats.totalLearned = list.length;
    localStorage.setItem('toeic30_stats', JSON.stringify(stats));
    return mastered;
  }

  // User Stats & Streak
  public getUserStats() {
    const mastered = this.getMasteredWords().length;
    try {
      const data = localStorage.getItem('toeic30_stats');
      if (data) {
        const parsed = JSON.parse(data);
        return { ...parsed, totalLearned: mastered };
      }
      return { streak: 1, lastStudyDate: new Date().toISOString().split('T')[0], totalLearned: mastered };
    } catch {
      return { streak: 1, lastStudyDate: new Date().toISOString().split('T')[0], totalLearned: mastered };
    }
  }

  public recordStudyActivity() {
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
    stats.totalLearned = this.getMasteredWords().length;
    localStorage.setItem('toeic30_stats', JSON.stringify(stats));
  }
}

export const storageService = new StorageService();
