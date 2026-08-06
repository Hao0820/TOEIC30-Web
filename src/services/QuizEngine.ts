import type { Word, QuizType, QuizQuestion } from '../types';

class QuizEngine {
  public generateQuiz(
    targetWords: Word[],
    allWordsPool: Word[],
    enabledTypes: QuizType[] = ['enToZh', 'zhToEn', 'listening', 'fillInBlank'],
    questionCount?: number
  ): QuizQuestion[] {
    if (!targetWords || targetWords.length === 0) return [];

    const types = enabledTypes.length > 0 ? enabledTypes : (['enToZh', 'zhToEn', 'listening', 'fillInBlank'] as QuizType[]);
    const shuffled = [...targetWords].sort(() => 0.5 - Math.random());
    const limit = questionCount && questionCount > 0 ? Math.min(questionCount, shuffled.length) : shuffled.length;
    const selected = shuffled.slice(0, limit);

    const questions: QuizQuestion[] = [];
    selected.forEach((word, index) => {
      const type = types[index % types.length];
      const q = this.makeQuestion(word, type, targetWords, allWordsPool);
      if (q) questions.push(q);
    });

    return questions;
  }

  private makeQuestion(
    word: Word,
    type: QuizType,
    contextPool: Word[],
    globalPool: Word[]
  ): QuizQuestion | null {
    let stem = '';
    let correctAnswer = '';
    let getOptionText: (w: Word) => string;

    switch (type) {
      case 'enToZh':
        stem = word.word;
        correctAnswer = word.chinese;
        getOptionText = (w) => w.chinese;
        break;

      case 'zhToEn':
        stem = word.chinese;
        correctAnswer = word.word;
        getOptionText = (w) => w.word;
        break;

      case 'listening':
        stem = '請點擊聽力發音選擇正確中文意思';
        correctAnswer = word.chinese;
        getOptionText = (w) => w.chinese;
        break;

      case 'fillInBlank':
        // Pure English masked sentence without Chinese translation
        stem = this.maskWordInSentence(word.example_en, word.word);
        correctAnswer = word.word;
        getOptionText = (w) => w.word;
        break;
    }

    const distractors = this.pickSmartDistractors(word, contextPool, globalPool, 3, getOptionText);
    const options = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());
    const correctIndex = options.indexOf(correctAnswer);

    if (correctIndex === -1) return null;

    return {
      word,
      type,
      stem,
      options,
      correctIndex,
    };
  }

  private pickSmartDistractors(
    correctWord: Word,
    contextPool: Word[],
    globalPool: Word[],
    count: number,
    transform: (w: Word) => string
  ): string[] {
    const picked = new Set<string>([transform(correctWord)]);
    const result: string[] = [];

    // 1. Same POS from context pool
    const sameUnitPos = contextPool.filter(w => w.id !== correctWord.id && w.pos === correctWord.pos).sort(() => 0.5 - Math.random());
    for (const w of sameUnitPos) {
      const text = transform(w).trim();
      if (text && !picked.has(text)) {
        picked.add(text);
        result.push(text);
        if (result.length === count) return result;
      }
    }

    // 2. Same POS from global pool
    const globalPos = globalPool.filter(w => w.id !== correctWord.id && w.pos === correctWord.pos).sort(() => 0.5 - Math.random());
    for (const w of globalPos) {
      const text = transform(w).trim();
      if (text && !picked.has(text)) {
        picked.add(text);
        result.push(text);
        if (result.length === count) return result;
      }
    }

    // 3. Fallback any words
    const fallback = [...contextPool, ...globalPool].sort(() => 0.5 - Math.random());
    for (const w of fallback) {
      const text = transform(w).trim();
      if (text && !picked.has(text)) {
        picked.add(text);
        result.push(text);
        if (result.length === count) return result;
      }
    }

    while (result.length < count) {
      result.push(`選項 ${result.length + 1}`);
    }

    return result;
  }

  private maskWordInSentence(sentence: string, word: string): string {
    if (!sentence) return '_______';
    try {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      const replaced = sentence.replace(regex, '_______');
      if (replaced !== sentence) return replaced;
    } catch {
      // fallback
    }
    return sentence.replace(new RegExp(word, 'gi'), '_______');
  }
}

export const quizEngine = new QuizEngine();
