-- ==============================================================================
-- TOEIC 30 Supabase Database Schema
-- 支援多用戶進度同步、背單字記錄、測驗歷史、錯題本與個人設定
-- ==============================================================================

-- 1. 個人檔案與設定資料表 (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    theme TEXT DEFAULT 'dark',
    voice_accent TEXT DEFAULT 'us',
    voice_play_mode TEXT DEFAULT 'all',
    speech_rate REAL DEFAULT 1.0,
    daily_goal INT DEFAULT 20,
    enabled_tiers JSONB DEFAULT '["score_basic", "score_600", "score_800", "score_900"]'::jsonb,
    study_mode TEXT DEFAULT 'byDay',
    last_selected_day INT DEFAULT 1,
    last_selected_tier TEXT DEFAULT 'score_basic',
    quiz_timer_seconds INT DEFAULT 15,
    streak INT DEFAULT 1,
    last_study_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 單元/天數閱讀位置 (user_word_progress)
CREATE TABLE IF NOT EXISTS public.user_word_progress (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    study_mode TEXT NOT NULL, -- 'byDay' | 'byLevel' | 'random'
    unit_key TEXT NOT NULL,   -- 'day_1', 'tier_score_800', etc.
    current_index INT DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_mode_unit UNIQUE (user_id, study_mode, unit_key)
);

-- 3. 收藏單字庫 (user_favorites)
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    word_id TEXT NOT NULL,
    word TEXT NOT NULL,
    phonetic TEXT,
    definition TEXT,
    part_of_speech TEXT,
    example_en TEXT,
    example_zh TEXT,
    tier TEXT,
    day INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_fav_word UNIQUE (user_id, word_id)
);

-- 4. 已熟記單字庫 (user_mastered_words)
CREATE TABLE IF NOT EXISTS public.user_mastered_words (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    word_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_mastered_word UNIQUE (user_id, word_id)
);

-- 5. 錯題本 (user_mistake_book)
CREATE TABLE IF NOT EXISTS public.user_mistake_book (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    word_id TEXT NOT NULL,
    word_data JSONB NOT NULL,
    mistake_count INT DEFAULT 1 NOT NULL,
    last_mistaken_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_mistake_word UNIQUE (user_id, word_id)
);

-- 6. 全真測驗紀錄 (user_quiz_records)
CREATE TABLE IF NOT EXISTS public.user_quiz_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    scope_title TEXT NOT NULL,
    total_questions INT NOT NULL,
    correct_count INT NOT NULL,
    score_percentage INT NOT NULL,
    time_spent_seconds INT NOT NULL,
    mistake_words JSONB DEFAULT '[]'::jsonb,
    is_retest BOOLEAN DEFAULT false
);

-- ==============================================================================
-- 自動為新註冊使用者建立 profile 的觸發器 (Trigger)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 啟用 Row Level Security (RLS) 確保用戶數據隔離
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mastered_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mistake_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_records ENABLE ROW LEVEL SECURITY;

-- 1. profiles 權限原則
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. user_word_progress 權限原則
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_word_progress;
CREATE POLICY "Users can manage own progress" ON public.user_word_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. user_favorites 權限原則
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage own favorites" ON public.user_favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. user_mastered_words 權限原則
DROP POLICY IF EXISTS "Users can manage own mastered words" ON public.user_mastered_words;
CREATE POLICY "Users can manage own mastered words" ON public.user_mastered_words FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. user_mistake_book 權限原則
DROP POLICY IF EXISTS "Users can manage own mistake book" ON public.user_mistake_book;
CREATE POLICY "Users can manage own mistake book" ON public.user_mistake_book FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. user_quiz_records 權限原則
DROP POLICY IF EXISTS "Users can manage own quiz records" ON public.user_quiz_records;
CREATE POLICY "Users can manage own quiz records" ON public.user_quiz_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
