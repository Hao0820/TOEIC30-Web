import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/SpeechService';
import { spacedRepetitionService } from '../../services/SpacedRepetitionService';
import { TIER_CONFIG, DAY_TITLES } from '../../services/DataLoader';
import type { VoiceAccent } from '../../types';
import {
  Volume2,
  Star,
  ChevronLeft,
  ChevronRight,
  List,
  VolumeX,
  CheckCircle2,
  Gauge,
  Check,
  Play,
  Pause,
  Brain,
} from 'lucide-react';
import { DynamicPickerHeader } from './DynamicPickerHeader';

export const FlashcardView: React.FC<{ onOpenWordList: () => void }> = ({ onOpenWordList }) => {
  const {
    words,
    currentIndex,
    nextWord,
    prevWord,
    toggleFavorite,
    isFavorite,
    masteredWords,
    toggleMastered,
    isMastered,
    settings,
    updateSettings,
    isSpeaking,
    currentSpeakingText,
    isLoading,
    studyMode,
    currentDay,
    currentTier,
    setActiveTab,
  } = useApp();

  const [activeAccent, setActiveAccent] = useState<VoiceAccent | null>(null);

  // Voice selection states: All vs Custom multi-select
  const [isAllAccents, setIsAllAccents] = useState<boolean>(true);
  const [selectedAccents, setSelectedAccents] = useState<VoiceAccent[]>(['us', 'uk', 'au']);

  // 🎧 Auto-Play Mode State
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const autoPlayCancelledRef = useRef<boolean>(false);

  // 📱 Mobile Swipe Gesture State
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const [swipeDeltaX, setSwipeDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  useEffect(() => {
    const unsubAccent = speechService.subscribeAccent((acc) => {
      setActiveAccent(acc);
    });
    return unsubAccent;
  }, []);

  const currentWord = words[currentIndex] || null;
  const isStarred = currentWord ? isFavorite(currentWord.id) : false;
  const isWordMastered = currentWord ? isMastered(currentWord.id) : false;

  // Track word in Ebbinghaus Spaced Repetition system when viewed
  useEffect(() => {
    if (currentWord) {
      spacedRepetitionService.recordWordLearned(currentWord.id);
    }
  }, [currentWord]);

  // 🎧 Auto-Play Commute Loop
  useEffect(() => {
    if (!isAutoPlaying || !currentWord) return;

    autoPlayCancelledRef.current = false;

    const runAutoPlayCycle = async () => {
      try {
        // 1. Short initial pause
        await new Promise((r) => setTimeout(r, 350));
        if (autoPlayCancelledRef.current) return;

        // 2. Play word pronunciation (All accents or single selected)
        const accentsToPlay = isAllAccents ? (['us', 'uk', 'au'] as VoiceAccent[]) : selectedAccents;
        if (accentsToPlay.length > 1) {
          await speechService.speakAllAccents(currentWord.word, currentWord.phonetic, settings.speechRate, accentsToPlay);
        } else {
          await speechService.speakAsync(currentWord.word, currentWord.phonetic, accentsToPlay[0] || 'us', settings.speechRate);
        }

        if (autoPlayCancelledRef.current) return;

        // 3. Pause between word and example sentence
        await new Promise((r) => setTimeout(r, 1200));
        if (autoPlayCancelledRef.current) return;

        // 4. Play example sentence if available
        if (currentWord.example_en) {
          if (accentsToPlay.length > 1) {
            await speechService.speakSentenceAllAccents(
              currentWord.example_en,
              currentWord.word,
              currentWord.phonetic,
              settings.speechRate,
              accentsToPlay
            );
          } else {
            await speechService.speakSentenceAsync(
              currentWord.example_en,
              currentWord.word,
              currentWord.phonetic,
              accentsToPlay[0] || 'us',
              settings.speechRate
            );
          }
        }

        if (autoPlayCancelledRef.current) return;

        // 5. Pause before advancing to next card
        await new Promise((r) => setTimeout(r, 1800));
        if (autoPlayCancelledRef.current) return;

        // 6. Advance to next word
        if (currentIndex < words.length - 1) {
          nextWord();
        } else {
          // Finished playlist
          setIsAutoPlaying(false);
        }
      } catch {
        setIsAutoPlaying(false);
      }
    };

    runAutoPlayCycle();

    return () => {
      autoPlayCancelledRef.current = true;
      speechService.stop();
    };
  }, [isAutoPlaying, currentIndex, currentWord]);

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      autoPlayCancelledRef.current = true;
      speechService.stop();
      setIsAutoPlaying(false);
    } else {
      setIsAutoPlaying(true);
    }
  };

  // 📱 Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Only swipe if horizontal movement is dominant
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setSwipeDeltaX(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    if (swipeDeltaX < -50) {
      // Swiped Left -> Next Word
      nextWord();
    } else if (swipeDeltaX > 50) {
      // Swiped Right -> Prev Word
      prevWord();
    }
    setSwipeDeltaX(0);
  };

  // Toggle All accents mode
  const handleToggleAll = () => {
    if (isAllAccents) {
      setIsAllAccents(false);
      setSelectedAccents(['us']);
    } else {
      setIsAllAccents(true);
      setSelectedAccents(['us', 'uk', 'au']);
    }
  };

  // Toggle individual accent
  const handleToggleAccent = (accent: VoiceAccent) => {
    if (isAllAccents) {
      setIsAllAccents(false);
      setSelectedAccents([accent]);
    } else {
      if (selectedAccents.includes(accent)) {
        if (selectedAccents.length > 1) {
          setSelectedAccents(selectedAccents.filter((a) => a !== accent));
        }
      } else {
        const next = [...selectedAccents, accent];
        if (next.length === 3) {
          setIsAllAccents(true);
          setSelectedAccents(['us', 'uk', 'au']);
        } else {
          setSelectedAccents(next);
        }
      }
    }
  };

  const handleSpeakWord = () => {
    if (!currentWord) return;
    if (isWordSpeaking) {
      speechService.stop();
    } else {
      const accentsToPlay = isAllAccents ? (['us', 'uk', 'au'] as VoiceAccent[]) : selectedAccents;
      if (accentsToPlay.length > 1) {
        speechService.speakAllAccents(currentWord.word, currentWord.phonetic, settings.speechRate, accentsToPlay);
      } else if (accentsToPlay.length === 1) {
        speechService.speak(currentWord.word, currentWord.phonetic, accentsToPlay[0], settings.speechRate);
      }
    }
  };

  const handleSpeakSingleAccent = (accent: VoiceAccent) => {
    if (!currentWord) return;
    if (isWordSpeaking && activeAccent === accent) {
      speechService.stop();
    } else {
      speechService.speak(currentWord.word, currentWord.phonetic, accent, settings.speechRate);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextWord();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevWord();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleSpeakWord();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (currentWord) {
          toggleFavorite(currentWord);
        }
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (currentWord) {
          toggleMastered(currentWord);
        }
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        toggleAutoPlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWord, nextWord, prevWord, isAllAccents, selectedAccents, settings.speechRate, toggleFavorite, toggleMastered, isAutoPlaying]);

  const getUnitTitle = () => {
    if (studyMode === 'byDay') {
      const titleZh = DAY_TITLES[currentDay] || '';
      return `Day ${String(currentDay).padStart(2, '0')} · ${titleZh}`;
    }
    if (studyMode === 'byLevel') {
      return `${TIER_CONFIG[currentTier]?.name || ''} (${TIER_CONFIG[currentTier]?.badge || ''})`;
    }
    return '全真隨機 6,800+ 題庫';
  };

  const tierMeta = currentWord ? TIER_CONFIG[currentWord.tier] || TIER_CONFIG.score_basic : TIER_CONFIG.score_basic;
  const isWordSpeaking = currentWord ? isSpeaking && currentSpeakingText === currentWord.word : false;
  const isSentenceSpeaking = currentWord ? isSpeaking && currentSpeakingText === currentWord.example_en : false;
  const srsRecord = currentWord ? spacedRepetitionService.getRecord(currentWord.id) : null;

  const handleSpeakSentence = () => {
    if (!currentWord) return;
    if (isSentenceSpeaking) {
      speechService.stop();
    } else {
      const accentsToPlay = isAllAccents ? (['us', 'uk', 'au'] as VoiceAccent[]) : selectedAccents;
      if (accentsToPlay.length > 1) {
        speechService.speakSentenceAllAccents(
          currentWord.example_en,
          currentWord.word,
          currentWord.phonetic,
          settings.speechRate,
          accentsToPlay
        );
      } else if (accentsToPlay.length === 1) {
        speechService.speakSentence(
          currentWord.example_en,
          currentWord.word,
          currentWord.phonetic,
          accentsToPlay[0],
          settings.speechRate
        );
      }
    }
  };

  const progressPercent = words.length > 0 ? Math.round(((currentIndex + 1) / words.length) * 100) : 0;

  return (
    <div className="flashcard-page-container">
      {/* 1. Dynamic Mode & Level Picker Header */}
      <DynamicPickerHeader />

      {/* 2. Unit Title & Actions Row */}
      <div className="unit-header-bar">
        <div>
          <h2 className="unit-main-title">{getUnitTitle()}</h2>
          <p className="unit-sub-info">
            {words.length > 0 ? `共收錄 ${words.length} 筆精選單字 · 已背熟 ${masteredWords.length} 字` : '目前無符合篩選條件的單字'}
          </p>
        </div>

        <div className="header-actions-group">
          {/* 🎧 Auto-Play Commute Mode Button */}
          <button
            className={`btn-autoplay ${isAutoPlaying ? 'active-playing' : ''}`}
            onClick={toggleAutoPlay}
            title={isAutoPlaying ? '暫停自動輪播 (P)' : '開啟通勤免動手自動輪播 (P)'}
          >
            {isAutoPlaying ? (
              <>
                <Pause size={15} />
                <span className="equalizer-bar" />
                <span>輪播中</span>
              </>
            ) : (
              <>
                <Play size={15} />
                <span>自動輪播</span>
              </>
            )}
          </button>

          <button className="btn-all-words" onClick={onOpenWordList}>
            <List size={16} />
            <span>All ({words.length})</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flashcard-center-empty">
          <div className="loading-spinner" />
          <p>載入單字庫中...</p>
        </div>
      ) : !currentWord ? (
        <div className="flashcard-center-empty glass-panel">
          <p>此篩選條件下無單字，請至上方或「TOEIC 30」啟用更多分數階級。</p>
        </div>
      ) : (
        <>
          {/* Top Progress */}
          <div className="progress-section">
            <div className="progress-info">
              <span className="counter-text">
                第 <b>{currentIndex + 1}</b> / {words.length} 字
              </span>
              <span className="percent-text">{progressPercent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* 📱 Main Card with Touch Swipe Physics */}
          <div
            className="flashcard-wrapper fade-in"
            key={currentWord.id}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: isSwiping ? `translateX(${swipeDeltaX}px) rotate(${swipeDeltaX * 0.035}deg)` : 'none',
              transition: isSwiping ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            <div className="card-top-bar">
              <div className="tier-tag-group">
                <div
                  className="tier-tag"
                  style={{
                    background: `var(--tier-${currentWord.tier.replace('score_', '')}-bg)`,
                    color: tierMeta.color,
                  }}
                >
                  {tierMeta.badge}
                </div>

                {/* 🧠 Ebbinghaus SRS Stage Indicator */}
                {srsRecord && (
                  <div className="srs-stage-pill" title={`艾賓浩斯記憶階段: Stage ${srsRecord.stage + 1}`}>
                    <Brain size={12} color="var(--accent-primary)" />
                    <span>Lv.{srsRecord.stage + 1}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Mastered Checkmark + Favorite Star */}
              <div className="card-top-actions">
                <button
                  className={`master-btn ${isWordMastered ? 'mastered' : ''}`}
                  onClick={(e) => {
                    (e.currentTarget as HTMLElement)?.blur();
                    toggleMastered(currentWord);
                  }}
                  title={isWordMastered ? '已背熟' : '標記為已背熟 (C)'}
                >
                  <CheckCircle2
                    size={28}
                    fill={isWordMastered ? 'var(--accent-success)' : 'transparent'}
                    color={isWordMastered ? 'white' : 'var(--text-muted)'}
                  />
                </button>

                <button
                  className={`star-btn ${isStarred ? 'starred' : ''}`}
                  onClick={() => toggleFavorite(currentWord)}
                  title="收藏此單字 (F)"
                >
                  <Star
                    size={22}
                    fill={isStarred ? '#F59E0B' : 'transparent'}
                    color={isStarred ? '#F59E0B' : 'var(--text-muted)'}
                  />
                </button>
              </div>
            </div>

            {/* Word Hero */}
            <div className="word-hero-box">
              <div className="word-title-row">
                <h2 className="word-text">{currentWord.word}</h2>

                {/* Main Speaker Play Button */}
                <button
                  className={`speaker-btn ${isWordSpeaking ? 'speaking' : ''}`}
                  onClick={(e) => {
                    (e.currentTarget as HTMLElement)?.blur();
                    handleSpeakWord();
                  }}
                  title="播放發音 (空白鍵)"
                >
                  <Volume2 size={24} />
                </button>
              </div>

              <div className="phonetic-row">
                {currentWord.pos && <span className="pos-badge">{currentWord.pos}</span>}
                {currentWord.phonetic && <span className="phonetic-text">{currentWord.phonetic}</span>}
              </div>

              {/* Accent Checkbox Controls + Speed Controls Toolbar */}
              <div className="audio-control-deck">
                <div className="accent-checkbox-group">
                  {/* All Checkbox */}
                  <button
                    className={`accent-chk-btn all-btn ${isAllAccents ? 'checked' : ''} ${
                      isWordSpeaking && isAllAccents ? 'speaking-pulse' : ''
                    }`}
                    onClick={(e) => {
                      (e.currentTarget as HTMLElement)?.blur();
                      handleToggleAll();
                    }}
                    title="勾選 All：播放時自動依序朗讀 美 ➔ 英 ➔ 澳 全口音"
                  >
                    <div className={`chk-box ${isAllAccents ? 'checked' : ''}`}>
                      {isAllAccents && <Check size={12} strokeWidth={3.5} color="white" />}
                    </div>
                    <span>All</span>
                  </button>

                  {/* US, UK, AU Checkboxes */}
                  {[
                    { id: 'us', label: '美' },
                    { id: 'uk', label: '英' },
                    { id: 'au', label: '澳' },
                  ].map((item) => {
                    const isChecked = !isAllAccents && selectedAccents.includes(item.id as VoiceAccent);
                    const isDimmed = isAllAccents;
                    const isPlayingThis = isWordSpeaking && activeAccent === item.id;

                    return (
                      <button
                        key={item.id}
                        className={`accent-chk-btn ${isChecked ? 'checked' : ''} ${isDimmed ? 'dimmed' : ''} ${
                          isPlayingThis ? 'active-speaking' : ''
                        }`}
                        onClick={(e) => {
                          (e.currentTarget as HTMLElement)?.blur();
                          handleToggleAccent(item.id as VoiceAccent);
                        }}
                        onDoubleClick={(e) => {
                          (e.currentTarget as HTMLElement)?.blur();
                          handleSpeakSingleAccent(item.id as VoiceAccent);
                        }}
                        title={
                          isDimmed
                            ? `點擊切換為單獨自選 ${item.label} 音`
                            : `勾選/取消 ${item.label} 音 (雙擊直接試聽)`
                        }
                      >
                        <div className={`chk-box ${isChecked ? 'checked' : ''}`}>
                          {isChecked && <Check size={12} strokeWidth={3.5} color="white" />}
                        </div>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Inline Speech Speed Picker */}
                <div className="speed-deck-group">
                  <Gauge size={13} color="var(--text-muted)" />
                  <div className="speed-options">
                    {[0.8, 1.0, 1.2].map((rate) => (
                      <button
                        key={rate}
                        className={`speed-option-btn ${settings.speechRate === rate ? 'active' : ''}`}
                        onClick={() => updateSettings({ speechRate: rate })}
                        title={`設定發音語速 ${rate.toFixed(1)}x`}
                      >
                        {rate.toFixed(1)}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Chinese Definition */}
            <div className="definition-box">
              <p className="chinese-text">{currentWord.chinese}</p>
            </div>

            {/* Example Sentence Box */}
            {currentWord.example_en && (
              <div className="example-box">
                <div className="example-header">
                  <span className="example-label">商務全真例句</span>
                  <button
                    className={`example-speak-btn ${isSentenceSpeaking ? 'speaking' : ''}`}
                    onClick={handleSpeakSentence}
                    title="朗讀例句全文"
                  >
                    {isSentenceSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    <span>{isSentenceSpeaking ? '停止' : '例句發音'}</span>
                  </button>
                </div>
                <p className="example-en">{currentWord.example_en}</p>
                {currentWord.example_zh && <p className="example-zh">{currentWord.example_zh}</p>}
              </div>
            )}
          </div>

          {/* 📱 Mobile Swipe Gesture Guidance Hint */}
          <div className="swipe-hint-banner">
            <span>👈 左右滑動切換單字 👉</span>
          </div>

          {/* Navigation Controls with "測驗本單元" button */}
          <div className="card-nav-controls">
            <button
              className="nav-arrow-btn circle-btn"
              disabled={currentIndex === 0}
              onClick={prevWord}
              title="上一個單字 (←)"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              className="nav-quiz-btn"
              onClick={() => setActiveTab('quiz')}
              title="一鍵前往測驗本單元"
            >
              <CheckCircle2 size={18} />
              <span>測驗本單元</span>
            </button>

            <button
              className="nav-arrow-btn circle-btn"
              disabled={currentIndex === words.length - 1}
              onClick={nextWord}
              title="下一個單字 (→)"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Keyboard Shortcuts Bar (Hidden on Mobile) */}
          <div className="keyboard-hints">
            <span className="hint-pill"><b>Space</b> 發音</span>
            <span className="hint-pill"><b>P</b> 自動輪播</span>
            <span className="hint-pill"><b>← / →</b> 切換</span>
            <span className="hint-pill"><b>C</b> 標記背熟</span>
            <span className="hint-pill"><b>F</b> 收藏</span>
          </div>
        </>
      )}

      <style>{`
        .flashcard-page-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 24px 16px 120px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .flashcard-page-container {
            padding: max(12px, env(safe-area-inset-top)) 12px 100px;
            gap: 12px;
          }
        }
        .unit-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 4px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .unit-main-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .unit-sub-info {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .header-actions-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-autoplay {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(37, 99, 235, 0.12);
          border: 1px solid rgba(37, 99, 235, 0.3);
          color: var(--accent-primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-autoplay:hover {
          background: var(--accent-primary);
          color: white;
        }
        .btn-autoplay.active-playing {
          background: linear-gradient(135deg, #10B981, #059669);
          border-color: #10B981;
          color: white;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.45);
          animation: pulseGlow 2s infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.7); }
        }
        .btn-all-words {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-all-words:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-glow);
        }
        .progress-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: var(--text-muted);
        }
        .counter-text b {
          color: var(--text-primary);
          font-size: 15px;
        }
        .percent-text {
          font-weight: 700;
          color: var(--accent-primary);
        }
        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background: var(--bg-secondary);
          border-radius: 9999px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 9999px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .flashcard-wrapper {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          box-shadow: var(--shadow-lg);
          user-select: none;
          touch-action: pan-y;
        }
        @media (max-width: 768px) {
          .flashcard-wrapper {
            padding: 22px 18px;
            gap: 18px;
          }
        }
        .card-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tier-tag-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tier-tag {
          font-size: 12px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 9999px;
          border: 1px solid currentColor;
          letter-spacing: 0.5px;
        }
        .srs-stage-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.2);
          color: var(--accent-primary);
        }
        .card-top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .master-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: transform 0.2s;
        }
        .master-btn:hover {
          transform: scale(1.15);
        }
        .star-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: transform 0.2s;
        }
        .star-btn:hover {
          transform: scale(1.15);
        }
        .word-hero-box {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .word-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .word-text {
          font-family: var(--font-display);
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -1px;
          color: var(--text-primary);
        }
        @media (max-width: 768px) {
          .word-text {
            font-size: 32px;
          }
        }
        .speaker-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--accent-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .speaker-btn:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          transform: scale(1.08);
        }
        .speaker-btn.speaking {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
          animation: pulseSpeaking 1.5s infinite;
        }
        @keyframes pulseSpeaking {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); transform: scale(1); }
          50% { box-shadow: 0 0 0 12px rgba(37, 99, 235, 0); transform: scale(1.1); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); transform: scale(1); }
        }
        .phonetic-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pos-badge {
          font-size: 13px;
          font-weight: 700;
          color: var(--accent-secondary);
          background: rgba(124, 58, 237, 0.12);
          padding: 2px 8px;
          border-radius: 6px;
          font-style: italic;
        }
        .phonetic-text {
          font-family: var(--font-mono);
          font-size: 16px;
          color: var(--text-muted);
        }
        .audio-control-deck {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 10px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .accent-checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .accent-chk-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 9999px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .accent-chk-btn.checked {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          background: rgba(37, 99, 235, 0.08);
        }
        .accent-chk-btn.dimmed {
          opacity: 0.7;
        }
        .accent-chk-btn.active-speaking {
          border-color: var(--accent-success);
          color: var(--accent-success);
        }
        .chk-box {
          width: 15px;
          height: 15px;
          border-radius: 4px;
          border: 1.5px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
        }
        .chk-box.checked {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }
        .speed-deck-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .speed-options {
          display: flex;
          gap: 4px;
        }
        .speed-option-btn {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-muted);
          cursor: pointer;
        }
        .speed-option-btn.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }
        .definition-box {
          padding: 16px 20px;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border-left: 4px solid var(--accent-primary);
        }
        .chinese-text {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .example-box {
          padding: 16px 20px;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 1px solid var(--border-color);
        }
        .example-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .example-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .example-speak-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: var(--accent-primary);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .example-speak-btn:hover {
          background: var(--bg-card);
        }
        .example-en {
          font-size: 16px;
          font-weight: 500;
          line-height: 1.5;
          color: var(--text-primary);
        }
        .example-zh {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .swipe-hint-banner {
          display: none;
          text-align: center;
          font-size: 11px;
          color: var(--text-muted);
          padding: 2px 0;
        }
        @media (max-width: 768px) {
          .swipe-hint-banner {
            display: block;
          }
        }
        .card-nav-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .circle-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .circle-btn:hover:not(:disabled) {
          background: var(--bg-card-hover);
          border-color: var(--border-glow);
          transform: translateY(-2px);
        }
        .circle-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .nav-quiz-btn {
          flex: 1;
          height: 50px;
          border-radius: 9999px;
          border: none;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: white;
          font-size: 15px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
          transition: all 0.2s;
        }
        .nav-quiz-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
        }
        .keyboard-hints {
          display: flex;
          justify-content: center;
          gap: 10px;
          padding-top: 4px;
        }
        .hint-pill {
          font-size: 11px;
          color: var(--text-muted);
          background: var(--bg-secondary);
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
        }
        @media (max-width: 768px), (pointer: coarse) {
          .keyboard-hints {
            display: none !important;
          }
        }
        .flashcard-center-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
          border-radius: var(--radius-xl);
        }
        .loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border-color);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
