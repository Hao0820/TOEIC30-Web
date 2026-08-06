import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Word, WordTier, StudyMode, QuizQuestion, QuizRecord } from '../types';
import { dataLoader } from '../services/DataLoader';
import { storageService } from '../services/StorageService';
import type { AppSettings } from '../services/StorageService';
import { speechService } from '../services/SpeechService';
import { quizEngine } from '../services/QuizEngine';
import { supabaseService, type UserProfile } from '../services/SupabaseService';

interface AppContextType {
  activeTab: 'vocabulary' | 'quiz' | 'profile' | 'favorites' | 'mistakes';
  setActiveTab: (tab: 'vocabulary' | 'quiz' | 'profile' | 'favorites' | 'mistakes') => void;

  // Supabase User & Cloud Sync
  user: User | null;
  userProfile: UserProfile | null;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  isCloudSyncing: boolean;
  lastSyncTime: Date | null;
  syncCloudData: () => Promise<void>;

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

  mistakeWords: Word[];
  removeMistake: (wordId: string) => void;
  clearMistakes: () => void;

  quizRecords: QuizRecord[];
  addQuizRecord: (record: QuizRecord) => void;

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

  // User & Cloud State
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

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
  const [mistakeWords, setMistakeWords] = useState<Word[]>(() => storageService.getMistakeWords());
  const [quizRecords, setQuizRecords] = useState<QuizRecord[]>(() => storageService.getQuizRecords());

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

  // MARK: - Supabase Auth & Cloud Sync Listener
  const syncCloudData = useCallback(async () => {
    if (!user) return;
    setIsCloudSyncing(true);
    try {
      // 1. Fetch Profile
      const profile = await supabaseService.fetchProfile(user.id);
      if (profile) {
        setUserProfile(profile);
        if (profile.theme || profile.voice_accent) {
          const updatedSettings: Partial<AppSettings> = {
            ...(profile.theme && { theme: profile.theme }),
            ...(profile.voice_accent && { voiceAccent: profile.voice_accent }),
            ...(profile.voice_play_mode && { voicePlayMode: profile.voice_play_mode }),
            ...(profile.speech_rate && { speechRate: profile.speech_rate }),
            ...(profile.daily_goal && { dailyGoal: profile.daily_goal }),
            ...(profile.enabled_tiers && { enabledTiers: profile.enabled_tiers }),
            ...(profile.study_mode && { studyMode: profile.study_mode }),
            ...(profile.last_selected_day && { lastSelectedDay: profile.last_selected_day }),
            ...(profile.last_selected_tier && { lastSelectedTier: profile.last_selected_tier }),
            ...(profile.quiz_timer_seconds && { quizTimerSeconds: profile.quiz_timer_seconds }),
          };
          storageService.saveSettings(updatedSettings);
          setSettings(storageService.getSettings());
          if (profile.study_mode) setStudyModeState(profile.study_mode);
          if (profile.last_selected_day) setCurrentDayState(profile.last_selected_day);
          if (profile.last_selected_tier) setCurrentTierState(profile.last_selected_tier);
          if (profile.enabled_tiers) setEnabledTiers(profile.enabled_tiers);
        }
      }

      // 2. Fetch Favorites
      const cloudFavs = await supabaseService.fetchFavorites(user.id);
      if (cloudFavs.length > 0) {
        localStorage.setItem('toeic30_favorites', JSON.stringify(cloudFavs));
        setFavorites(cloudFavs);
      } else {
        // Push local favorites to cloud
        const localFavs = storageService.getFavorites();
        for (const fav of localFavs) {
          await supabaseService.addFavorite(user.id, fav);
        }
      }

      // 3. Fetch Mastered Words
      const cloudMastered = await supabaseService.fetchMasteredWords(user.id);
      if (cloudMastered.length > 0) {
        localStorage.setItem('toeic30_mastered_words', JSON.stringify(cloudMastered));
        setMasteredWords(cloudMastered);
      } else {
        const localMastered = storageService.getMasteredWords();
        for (const wId of localMastered) {
          await supabaseService.toggleMasteredWord(user.id, wId, true);
        }
      }

      // 4. Fetch Mistake Book
      const cloudMistakes = await supabaseService.fetchMistakeBook(user.id);
      if (cloudMistakes.length > 0) {
        localStorage.setItem('toeic30_mistake_book', JSON.stringify(cloudMistakes));
        setMistakeWords(cloudMistakes);
      }

      // 5. Fetch Quiz Records
      const cloudQuiz = await supabaseService.fetchQuizRecords(user.id);
      if (cloudQuiz.length > 0) {
        localStorage.setItem('toeic30_quiz_records', JSON.stringify(cloudQuiz));
        setQuizRecords(cloudQuiz);
      }

      setLastSyncTime(new Date());
    } catch (e) {
      console.warn('[AppContext] Cloud sync error:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    supabaseService.getCurrentUser().then((u) => {
      setUser(u);
    });

    const { data } = supabaseService.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      syncCloudData();
    }
  }, [user, syncCloudData]);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const signOut = async () => {
    await supabaseService.signOut();
    setUser(null);
    setUserProfile(null);
  };

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
    storageService.recordStudyActivity();

    if (user) {
      supabaseService.saveWordProgress(user.id, studyMode, getUnitKey(), valid);
    }
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
    const isFav = storageService.toggleFavorite(word);
    const updated = storageService.getFavorites();
    setFavorites(updated);

    if (user) {
      if (isFav) {
        supabaseService.addFavorite(user.id, word);
      } else {
        supabaseService.removeFavorite(user.id, word.id);
      }
    }
  };

  const isFavorite = (wordId: string) => {
    return favorites.some(w => w.id === wordId);
  };

  const toggleMastered = (word: Word) => {
    const mastered = storageService.toggleMastered(word.id);
    const updated = storageService.getMasteredWords();
    setMasteredWords(updated);

    if (user) {
      supabaseService.toggleMasteredWord(user.id, word.id, mastered);
    }
  };

  const isMastered = (wordId: string) => {
    return masteredWords.includes(wordId);
  };

  const removeMistake = (wordId: string) => {
    storageService.removeMistake(wordId);
    setMistakeWords(storageService.getMistakeWords());
    if (user) {
      supabaseService.removeMistake(user.id, wordId);
    }
  };

  const clearMistakes = () => {
    storageService.clearMistakes();
    setMistakeWords([]);
  };

  const addQuizRecord = (record: QuizRecord) => {
    storageService.saveQuizRecord(record);
    setQuizRecords(storageService.getQuizRecords());
    setMistakeWords(storageService.getMistakeWords());

    if (user) {
      supabaseService.saveQuizRecord(user.id, record);
      if (record.mistakeWords && record.mistakeWords.length > 0) {
        supabaseService.saveMistakes(user.id, record.mistakeWords);
      }
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    storageService.saveSettings(newSettings);
    const updated = storageService.getSettings();
    setSettings(updated);

    if (user) {
      supabaseService.saveProfile(user.id, {
        theme: updated.theme,
        voice_accent: updated.voiceAccent,
        voice_play_mode: updated.voicePlayMode,
        speech_rate: updated.speechRate,
        daily_goal: updated.dailyGoal,
        enabled_tiers: updated.enabledTiers,
        study_mode: updated.studyMode,
        last_selected_day: updated.lastSelectedDay,
        last_selected_tier: updated.lastSelectedTier,
        quiz_timer_seconds: updated.quizTimerSeconds,
      });
    }
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
        user,
        userProfile,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signOut,
        isCloudSyncing,
        lastSyncTime,
        syncCloudData,
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
        mistakeWords,
        removeMistake,
        clearMistakes,
        quizRecords,
        addQuizRecord,
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
