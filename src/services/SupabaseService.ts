import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js';
import type { Word, QuizRecord, StudyMode, WordTier, VoiceAccent } from '../types';
import type { AppSettings } from './StorageService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xbzaljjexltqqtjrcrbe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  theme?: 'dark' | 'light' | 'system';
  voice_accent?: VoiceAccent;
  voice_play_mode?: 'single' | 'all';
  speech_rate?: number;
  daily_goal?: number;
  enabled_tiers?: WordTier[];
  study_mode?: StudyMode;
  last_selected_day?: number;
  last_selected_tier?: WordTier;
  quiz_timer_seconds?: number;
  streak?: number;
  last_study_date?: string;
}

class SupabaseService {
  public client: SupabaseClient | null = null;
  public isConfigured: boolean = false;

  constructor() {
    if (supabaseUrl && supabaseAnonKey && supabaseAnonKey.trim().length > 0) {
      try {
        this.client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
        this.isConfigured = true;
      } catch (e) {
        console.error('[Supabase] Failed to initialize client:', e);
      }
    } else {
      console.warn('[Supabase] VITE_SUPABASE_ANON_KEY is not set. Running in local/offline mode.');
    }
  }

  // MARK: - Auth Methods
  public async getSession(): Promise<Session | null> {
    if (!this.client) return null;
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  public async getCurrentUser(): Promise<User | null> {
    if (!this.client) return null;
    const { data } = await this.client.auth.getUser();
    return data.user;
  }

  public onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!this.client) return { data: { subscription: { unsubscribe: () => {} } } };
    return this.client.auth.onAuthStateChange(callback);
  }

  public async signUp(email: string, password: string, displayName?: string) {
    if (!this.client) throw new Error('尚未設定 Supabase Anon API Key');
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    if (error) throw error;
    return data;
  }

  public async signIn(email: string, password: string) {
    if (!this.client) throw new Error('尚未設定 Supabase Anon API Key');
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  public async signOut() {
    if (!this.client) return;
    const { error } = await this.client.auth.signOut();
    if (error) console.error('[Supabase] Sign out error:', error);
  }

  // MARK: - Profiles & Settings
  public async fetchProfile(userId: string): Promise<UserProfile | null> {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.warn('[Supabase] fetchProfile error:', error);
      }
      return data;
    } catch {
      return null;
    }
  }

  public async saveProfile(userId: string, profile: Partial<UserProfile>) {
    if (!this.client) return;
    try {
      const { error } = await this.client
        .from('profiles')
        .upsert({ id: userId, ...profile, updated_at: new Date().toISOString() });
      if (error) console.warn('[Supabase] saveProfile error:', error);
    } catch (e) {
      console.warn('[Supabase] saveProfile exception:', e);
    }
  }

  // MARK: - Word Progress
  public async fetchAllWordProgress(userId: string): Promise<Record<string, number>> {
    if (!this.client) return {};
    try {
      const { data, error } = await this.client
        .from('user_word_progress')
        .select('study_mode, unit_key, current_index')
        .eq('user_id', userId);
      if (error) return {};
      const result: Record<string, number> = {};
      data?.forEach((row: { study_mode: string; unit_key: string; current_index: number }) => {
        result[`${row.study_mode}_${row.unit_key}`] = row.current_index;
      });
      return result;
    } catch {
      return {};
    }
  }

  public async saveWordProgress(userId: string, studyMode: string, unitKey: string, index: number) {
    if (!this.client) return;
    try {
      await this.client
        .from('user_word_progress')
        .upsert(
          {
            user_id: userId,
            study_mode: studyMode,
            unit_key: unitKey,
            current_index: index,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,study_mode,unit_key' }
        );
    } catch (e) {
      console.warn('[Supabase] saveWordProgress exception:', e);
    }
  }

  // MARK: - Favorites
  public async fetchFavorites(userId: string): Promise<Word[]> {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map((r: any) => ({
        id: r.word_id,
        word: r.word,
        phonetic: r.phonetic || '',
        chinese: r.definition || r.chinese || '',
        pos: r.part_of_speech || r.pos || '',
        example_en: r.example_en || '',
        example_zh: r.example_zh || '',
        tier: r.tier || 'score_basic',
        day: r.day || 1,
      }));
    } catch {
      return [];
    }
  }

  public async addFavorite(userId: string, word: Word) {
    if (!this.client) return;
    try {
      await this.client.from('user_favorites').upsert(
        {
          user_id: userId,
          word_id: word.id,
          word: word.word,
          phonetic: word.phonetic,
          definition: word.chinese,
          part_of_speech: word.pos,
          example_en: word.example_en,
          example_zh: word.example_zh,
          tier: word.tier,
          day: word.day,
        },
        { onConflict: 'user_id,word_id' }
      );
    } catch (e) {
      console.warn('[Supabase] addFavorite error:', e);
    }
  }

  public async removeFavorite(userId: string, wordId: string) {
    if (!this.client) return;
    try {
      await this.client
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('word_id', wordId);
    } catch (e) {
      console.warn('[Supabase] removeFavorite error:', e);
    }
  }

  // MARK: - Mastered Words
  public async fetchMasteredWords(userId: string): Promise<string[]> {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('user_mastered_words')
        .select('word_id')
        .eq('user_id', userId);
      if (error || !data) return [];
      return data.map((r: { word_id: string }) => r.word_id);
    } catch {
      return [];
    }
  }

  public async toggleMasteredWord(userId: string, wordId: string, isMastered: boolean) {
    if (!this.client) return;
    try {
      if (isMastered) {
        await this.client.from('user_mastered_words').upsert(
          { user_id: userId, word_id: wordId },
          { onConflict: 'user_id,word_id' }
        );
      } else {
        await this.client
          .from('user_mastered_words')
          .delete()
          .eq('user_id', userId)
          .eq('word_id', wordId);
      }
    } catch (e) {
      console.warn('[Supabase] toggleMasteredWord error:', e);
    }
  }

  // MARK: - Mistake Book
  public async fetchMistakeBook(userId: string): Promise<Word[]> {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('user_mistake_book')
        .select('word_data')
        .eq('user_id', userId)
        .order('last_mistaken_at', { ascending: false });
      if (error || !data) return [];
      return data.map((r: { word_data: any }) => r.word_data as Word);
    } catch {
      return [];
    }
  }

  public async saveMistakes(userId: string, words: Word[]) {
    if (!this.client || !words.length) return;
    try {
      const upserts = words.map(w => ({
        user_id: userId,
        word_id: w.id,
        word_data: w,
        last_mistaken_at: new Date().toISOString(),
      }));
      await this.client.from('user_mistake_book').upsert(upserts, { onConflict: 'user_id,word_id' });
    } catch (e) {
      console.warn('[Supabase] saveMistakes error:', e);
    }
  }

  public async removeMistake(userId: string, wordId: string) {
    if (!this.client) return;
    try {
      await this.client
        .from('user_mistake_book')
        .delete()
        .eq('user_id', userId)
        .eq('word_id', wordId);
    } catch (e) {
      console.warn('[Supabase] removeMistake error:', e);
    }
  }

  // MARK: - Quiz Records
  public async fetchQuizRecords(userId: string): Promise<QuizRecord[]> {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('user_quiz_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(50);
      if (error || !data) return [];
      return data.map((r: any) => ({
        id: r.id,
        timestamp: r.date,
        scopeTitle: r.scope_title,
        totalQuestions: r.total_questions,
        correctCount: r.correct_count,
        wrongCount: r.total_questions - r.correct_count,
        scorePercentage: r.score_percentage,
        mistakeWords: r.mistake_words || [],
      }));
    } catch {
      return [];
    }
  }

  public async saveQuizRecord(userId: string, record: QuizRecord) {
    if (!this.client) return;
    try {
      await this.client.from('user_quiz_records').insert({
        id: record.id,
        user_id: userId,
        date: record.timestamp,
        scope_title: record.scopeTitle,
        total_questions: record.totalQuestions,
        correct_count: record.correctCount,
        score_percentage: record.scorePercentage,
        mistake_words: record.mistakeWords,
      });
    } catch (e) {
      console.warn('[Supabase] saveQuizRecord error:', e);
    }
  }

  // MARK: - Sync Local Data into Cloud on First Login
  public async syncLocalDataToCloud(
    userId: string,
    localData: {
      settings: AppSettings;
      favorites: Word[];
      masteredWords: string[];
      mistakes: Word[];
      quizRecords: QuizRecord[];
    }
  ) {
    if (!this.client) return;
    try {
      // 1. Sync Profile Settings
      await this.saveProfile(userId, {
        theme: localData.settings.theme,
        voice_accent: localData.settings.voiceAccent,
        voice_play_mode: localData.settings.voicePlayMode,
        speech_rate: localData.settings.speechRate,
        daily_goal: localData.settings.dailyGoal,
        enabled_tiers: localData.settings.enabledTiers,
        study_mode: localData.settings.studyMode,
        last_selected_day: localData.settings.lastSelectedDay,
        last_selected_tier: localData.settings.lastSelectedTier,
        quiz_timer_seconds: localData.settings.quizTimerSeconds,
      });

      // 2. Sync Favorites
      for (const fav of localData.favorites) {
        await this.addFavorite(userId, fav);
      }

      // 3. Sync Mastered Words
      for (const wordId of localData.masteredWords) {
        await this.toggleMasteredWord(userId, wordId, true);
      }

      // 4. Sync Mistakes
      if (localData.mistakes.length > 0) {
        await this.saveMistakes(userId, localData.mistakes);
      }

      // 5. Sync Quiz Records
      for (const q of localData.quizRecords) {
        await this.saveQuizRecord(userId, q);
      }
    } catch (e) {
      console.warn('[Supabase] syncLocalDataToCloud error:', e);
    }
  }
}

export const supabaseService = new SupabaseService();
