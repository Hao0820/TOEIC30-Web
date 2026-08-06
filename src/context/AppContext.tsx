import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Word, WordTier, StudyMode, QuizQuestion } from '../types';
import { dataLoader } from '../services/DataLoader';
import { storageService } from '../services/StorageService';
import type { AppSettings } from '../services/StorageService';
import { speechService } from '../services/SpeechService';
import { quizEngine } from '../services/QuizEngine';

interface AppContextType {
  activeTab: 'vocabulary' | 'quiz' | 'profile' | 'favorites' | 'mistakes';
  setActiveTab: (tab: 'vocabulary' | 'quiz' | 'profile' | 'favorites' | 'mistakes') => void;

  studyMode: StudyMode;
  setStudyMode: (mode: StudyMode) => void;

  currentDay: number;
  setCurrentDay: (day: number) => void;

  currentTier: WordTier;
  setCurrentTier: (tier: WordTier) => void;

  enabledTiers: WordTier[];
  toggleTier: (tier: WordTier) => void;

  words: Word[];
  allWordsPool: Word[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  nextWord: () => void;
  prevWord: () => void;

  favorites: Word[];
  toggleFavorite: (word: Word) => void;
  isFavorite: (wordId: string) => boolean;

  masteredWords: string[];
  toggleMastered: (word: Word) => void;
  isMastered: (wordId: string) => boolean;

  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  isLoading: boolean;
  isSpeaking: boolean;
  currentSpeakingText: string | null;

  // Active Quiz State
  activeQuizQuestions: QuizQuestion[] | null;
  quizScopeTitle: string;
  startQuiz: (questions: QuizQuestion[], title: string) => void;
  exitQuiz: () => void;
  startRetest: (mistakes: Word[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'quiz' | 'profile' | 'favorites' | 'mistakes'>('vocabulary');
  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  
  const [studyMode, setStudyModeState] = useState<StudyMode>(() => settings.studyMode || 'byDay');
  const [currentDay, setCurrentDayState] = useState<number>(() => settings.lastSelectedDay || 1);
  const [currentTier, setCurrentTierState] = useState<WordTier>(() => settings.lastSelectedTier || 'score_basic');
  const [enabledTiers, setEnabledTiers] = useState<WordTier[]>(() => settings.enabledTiers || ['score_basic', 'score_600', 'score_800', 'score_900']);

  const [words, setWords] = useState<Word[]>([]);
  const [allWordsPool, setAllWordsPool] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndexState] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [favorites, setFavorites] = useState<Word[]>(() => storageService.getFavorites());
  const [masteredWords, setMasteredWords] = useState<string[]>(() => storageService.getMasteredWords());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentSpeakingText, setCurrentSpeakingText] = useState<string | null>(null);

  // Fullscreen Quiz State
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [quizScopeTitle, setQuizScopeTitle] = useState<string>('');

  // Speech subscription
  useEffect(() => {
    const unsub = speechService.subscribe((speaking, text) => {
      setIsSpeaking(speaking);
      setCurrentSpeakingText(text);
    });
    return unsub;
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Load all words global pool initially
  useEffect(() => {
    dataLoader.loadAllWords().then(pool => {
      setAllWordsPool(pool);
    });
  }, []);

  const getUnitKey = useCallback(() => {
    if (studyMode === 'byDay') return `day_${currentDay}`;
    if (studyMode === 'byLevel') return `tier_${currentTier}`;
    return 'random';
  }, [studyMode, currentDay, currentTier]);

  // Load current words list based on mode & selection
  const loadActiveWords = useCallback(async () => {
    setIsLoading(true);
    let loaded: Word[] = [];

    if (studyMode === 'byDay') {
      const plan = await dataLoader.loadDay(currentDay);
      if (plan) {
        loaded = plan.vocabulary.filter(w => enabledTiers.includes(w.tier));
      }
    } else if (studyMode === 'byLevel') {
      loaded = await dataLoader.loadLevel(currentTier);
    } else {
      const pool = await dataLoader.loadAllWords();
      loaded = [...pool].sort(() => 0.5 - Math.random());
    }

    setWords(loaded);

    // Restore saved progress
    const unitKey = getUnitKey();
    const savedIndex = storageService.getWordProgress(studyMode, unitKey);
    const validIndex = loaded.length > 0 ? Math.min(Math.max(savedIndex, 0), loaded.length - 1) : 0;
    setCurrentIndexState(validIndex);

    setIsLoading(false);
  }, [studyMode, currentDay, currentTier, enabledTiers, getUnitKey]);

  useEffect(() => {
    loadActiveWords();
  }, [loadActiveWords]);

  const setCurrentIndex = (index: number) => {
    if (words.length === 0) return;
    const valid = Math.min(Math.max(index, 0), words.length - 1);
    setCurrentIndexState(valid);
    storageService.saveWordProgress(studyMode, getUnitKey(), valid);
    storageService.recordStudyActivity(1);
  };

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const setStudyMode = (mode: StudyMode) => {
    setStudyModeState(mode);
    updateSettings({ studyMode: mode });
  };

  const setCurrentDay = (day: number) => {
    setCurrentDayState(day);
    updateSettings({ lastSelectedDay: day });
  };

  const setCurrentTier = (tier: WordTier) => {
    setCurrentTierState(tier);
    updateSettings({ lastSelectedTier: tier });
  };

  const toggleTier = (tier: WordTier) => {
    let next: WordTier[];
    if (enabledTiers.includes(tier)) {
      if (enabledTiers.length > 1) {
        next = enabledTiers.filter(t => t !== tier);
      } else {
        return;
      }
    } else {
      next = [...enabledTiers, tier];
    }
    setEnabledTiers(next);
    updateSettings({ enabledTiers: next });
  };

  const toggleFavorite = (word: Word) => {
    storageService.toggleFavorite(word);
    setFavorites(storageService.getFavorites());
  };

  const isFavorite = (wordId: string) => {
    return favorites.some(w => w.id === wordId);
  };

  const toggleMastered = (word: Word) => {
    storageService.toggleMastered(word.id);
    setMasteredWords(storageService.getMasteredWords());
  };

  const isMastered = (wordId: string) => {
    return masteredWords.includes(wordId);
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    storageService.saveSettings(newSettings);
    setSettings(storageService.getSettings());
  };

  const startQuiz = (questions: QuizQuestion[], title: string) => {
    setActiveQuizQuestions(questions);
    setQuizScopeTitle(title);
  };

  const exitQuiz = () => {
    setActiveQuizQuestions(null);
    setQuizScopeTitle('');
  };

  const startRetest = (mistakes: Word[]) => {
    if (!mistakes || mistakes.length === 0) return;
    const questions = quizEngine.generateQuiz(mistakes, allWordsPool, ['enToZh', 'zhToEn', 'listening', 'fillInBlank']);
    startQuiz(questions, `🔥 錯題專項重測 (${mistakes.length} 題)`);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        studyMode,
        setStudyMode,
        currentDay,
        setCurrentDay,
        currentTier,
        setCurrentTier,
        enabledTiers,
        toggleTier,
        words,
        allWordsPool,
        currentIndex,
        setCurrentIndex,
        nextWord,
        prevWord,
        favorites,
        toggleFavorite,
        isFavorite,
        masteredWords,
        toggleMastered,
        isMastered,
        settings,
        updateSettings,
        isLoading,
        isSpeaking,
        currentSpeakingText,
        activeQuizQuestions,
        quizScopeTitle,
        startQuiz,
        exitQuiz,
        startRetest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
