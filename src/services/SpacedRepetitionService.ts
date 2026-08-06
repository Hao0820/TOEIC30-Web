import type { Word } from '../types';

export interface SpacedRepetitionRecord {
  wordId: string;
  stage: number; // 0 to 5
  lastReviewedAt: string; // ISO date string
  nextReviewDate: string; // YYYY-MM-DD
  correctStreak: number;
  mistakeCount: number;
}

const STORAGE_KEY = 'toeic30_spaced_repetition_v1';
// Ebbinghaus intervals in days: Stage 0: 1d, Stage 1: 2d, Stage 2: 4d, Stage 3: 7d, Stage 4: 15d, Stage 5: 30d
const INTERVALS_DAYS = [1, 2, 4, 7, 15, 30];

class SpacedRepetitionService {
  private records: Map<string, SpacedRepetitionRecord> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Record<string, SpacedRepetitionRecord> = JSON.parse(raw);
        this.records = new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.error('[SRS] Failed to load records:', e);
      this.records = new Map();
    }
  }

  private saveToStorage() {
    try {
      const obj: Record<string, SpacedRepetitionRecord> = {};
      this.records.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.error('[SRS] Failed to save records:', e);
    }
  }

  private getTodayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private addDaysToDate(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  public recordWordLearned(wordId: string) {
    if (!this.records.has(wordId)) {
      const record: SpacedRepetitionRecord = {
        wordId,
        stage: 0,
        lastReviewedAt: new Date().toISOString(),
        nextReviewDate: this.addDaysToDate(INTERVALS_DAYS[0]),
        correctStreak: 1,
        mistakeCount: 0,
      };
      this.records.set(wordId, record);
      this.saveToStorage();
    }
  }

  public recordReviewResult(wordId: string, isCorrect: boolean) {
    const existing = this.records.get(wordId);
    let stage = existing ? existing.stage : 0;
    let correctStreak = existing ? existing.correctStreak : 0;
    let mistakeCount = existing ? existing.mistakeCount : 0;

    if (isCorrect) {
      correctStreak += 1;
      stage = Math.min(stage + 1, INTERVALS_DAYS.length - 1);
    } else {
      correctStreak = 0;
      mistakeCount += 1;
      stage = 0; // Reset to 1-day interval upon forgetting
    }

    const nextInterval = INTERVALS_DAYS[stage] || 1;
    const record: SpacedRepetitionRecord = {
      wordId,
      stage,
      lastReviewedAt: new Date().toISOString(),
      nextReviewDate: this.addDaysToDate(nextInterval),
      correctStreak,
      mistakeCount,
    };

    this.records.set(wordId, record);
    this.saveToStorage();
  }

  public getRecord(wordId: string): SpacedRepetitionRecord | undefined {
    return this.records.get(wordId);
  }

  public getDueWords(allWords: Word[]): Word[] {
    const today = this.getTodayString();
    const wordMap = new Map(allWords.map((w) => [w.id, w]));

    const dueWordIds: string[] = [];
    this.records.forEach((record, wordId) => {
      if (record.nextReviewDate <= today) {
        dueWordIds.push(wordId);
      }
    });

    const result: Word[] = [];
    for (const id of dueWordIds) {
      const w = wordMap.get(id);
      if (w) result.push(w);
    }
    return result;
  }

  public getSRSStats(allWordsCount: number) {
    const today = this.getTodayString();
    let dueToday = 0;
    let stage0 = 0;
    let stage1 = 0;
    let stage2 = 0;
    let stage3 = 0;
    let stage4 = 0;
    let stage5 = 0;

    this.records.forEach((record) => {
      if (record.nextReviewDate <= today) {
        dueToday++;
      }
      switch (record.stage) {
        case 0:
          stage0++;
          break;
        case 1:
          stage1++;
          break;
        case 2:
          stage2++;
          break;
        case 3:
          stage3++;
          break;
        case 4:
          stage4++;
          break;
        case 5:
          stage5++;
          break;
      }
    });

    const inSystemTotal = this.records.size;
    return {
      inSystemTotal,
      dueToday,
      stage0, // 1d
      stage1, // 2d
      stage2, // 4d
      stage3, // 7d
      stage4, // 15d
      stage5, // 30d (長期記憶牢固)
      untracked: Math.max(0, allWordsCount - inSystemTotal),
    };
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
