import type { Word, WordTier, DayPlan } from '../types';

export const DAY_TITLES: Record<number, string> = {
  1: "雇用", 2: "規則、法律", 3: "一般工作 (1)", 4: "一般工作 (2)", 5: "一般工作 (3)",
  6: "休閒、社交", 7: "行銷 (1)", 8: "行銷 (2)", 9: "經濟", 10: "購物",
  11: "產品開發", 12: "生產", 13: "顧客服務", 14: "旅遊、機場", 15: "契約",
  16: "商業", 17: "貿易、貨運", 18: "住宿、餐廳", 19: "收益", 20: "會計",
  21: "公司動向", 22: "會議", 23: "員工福利", 24: "人事異動", 25: "交通",
  26: "銀行", 27: "投資", 28: "建築、住宅", 29: "環境", 30: "健康"
};

export const TIER_CONFIG: Record<WordTier, { name: string; badge: string; color: string; desc: string }> = {
  score_basic: { name: '核心基礎', badge: '基礎', color: 'var(--tier-basic)', desc: '目標 500-600 分基礎必考單字' },
  score_600:   { name: '600分必備', badge: '600分', color: 'var(--tier-600)', desc: '綠色證書核心實用商業單字' },
  score_800:   { name: '800分進階', badge: '800分', color: 'var(--tier-800)', desc: '藍色證書高頻進階商務單字' },
  score_900:   { name: '900分滿分', badge: '900分', color: 'var(--tier-900)', desc: '金色證書滿分衝刺高難度單字' },
};

interface RawWordItem {
  day?: number;
  word: string;
  phonetic?: string;
  part_of_speech?: string;
  definitions_summary?: string;
  example?: {
    en?: string;
    zh?: string;
  };
  tier?: string;
}

interface RawDayData {
  day?: number;
  title_zh?: string;
  title_en?: string;
  counts?: Record<string, number>;
  score_basic?: RawWordItem[];
  score_600?: RawWordItem[];
  score_800?: RawWordItem[];
  score_900?: RawWordItem[];
}

class DataLoaderService {
  private dayCache = new Map<number, DayPlan>();
  private levelCache = new Map<WordTier, Word[]>();
  private allWordsCache: Word[] | null = null;

  private transformRawWord(raw: RawWordItem, defaultDay: number, defaultTier: WordTier): Word {
    const d = raw.day ?? defaultDay;
    const t = (raw.tier as WordTier) || defaultTier;
    const w = raw.word?.trim() || '';
    return {
      id: `${w}_${d}_${t}`,
      word: w,
      phonetic: raw.phonetic || '',
      pos: raw.part_of_speech || '',
      chinese: raw.definitions_summary || '',
      example_en: raw.example?.en || '',
      example_zh: raw.example?.zh || '',
      day: d,
      tier: t,
    };
  }

  public async loadDay(day: number): Promise<DayPlan | null> {
    if (this.dayCache.has(day)) {
      return this.dayCache.get(day)!;
    }

    const dayStr = String(day).padStart(2, '0');
    try {
      const res = await fetch(`/data/days/day${dayStr}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RawDayData = await res.json();

      const words: Word[] = [];
      if (Array.isArray(data.score_basic)) {
        words.push(...data.score_basic.map(w => this.transformRawWord(w, day, 'score_basic')));
      }
      if (Array.isArray(data.score_600)) {
        words.push(...data.score_600.map(w => this.transformRawWord(w, day, 'score_600')));
      }
      if (Array.isArray(data.score_800)) {
        words.push(...data.score_800.map(w => this.transformRawWord(w, day, 'score_800')));
      }
      if (Array.isArray(data.score_900)) {
        words.push(...data.score_900.map(w => this.transformRawWord(w, day, 'score_900')));
      }

      const plan: DayPlan = {
        day,
        title: data.title_zh || data.title_en || DAY_TITLES[day] || `Day ${dayStr}`,
        total_words: words.length,
        counts: {
          score_basic: data.score_basic?.length || 0,
          score_600: data.score_600?.length || 0,
          score_800: data.score_800?.length || 0,
          score_900: data.score_900?.length || 0,
          total: words.length,
        },
        vocabulary: words,
      };

      this.dayCache.set(day, plan);
      return plan;
    } catch (e) {
      console.error(`Failed to load Day ${day}`, e);
      return null;
    }
  }

  public async loadLevel(tier: WordTier): Promise<Word[]> {
    if (this.levelCache.has(tier)) {
      return this.levelCache.get(tier)!;
    }

    try {
      const res = await fetch(`/data/levels/${tier}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rawWords: RawWordItem[] = data.words || data.vocabulary || (Array.isArray(data) ? data : []);

      const words = rawWords.map((w, index) => this.transformRawWord(w, w.day || Math.floor(index / 50) + 1, tier));
      this.levelCache.set(tier, words);
      return words;
    } catch (e) {
      console.error(`Failed to load Level ${tier}`, e);
      return [];
    }
  }

  public async loadAllWords(): Promise<Word[]> {
    if (this.allWordsCache) return this.allWordsCache;

    const all: Word[] = [];
    const promises: Promise<DayPlan | null>[] = [];
    for (let d = 1; d <= 30; d++) {
      promises.push(this.loadDay(d));
    }

    const results = await Promise.all(promises);
    for (const plan of results) {
      if (plan) {
        all.push(...plan.vocabulary);
      }
    }

    this.allWordsCache = all;
    return all;
  }
}

export const dataLoader = new DataLoaderService();
