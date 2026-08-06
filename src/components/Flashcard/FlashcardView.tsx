import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/SpeechService';
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

  useEffect(() => {
    const unsubAccent = speechService.subscribeAccent((acc) => {
      setActiveAccent(acc);
    });
    return unsubAccent;
  }, []);

  const currentWord = words[currentIndex] || null;
  const isStarred = currentWord ? isFavorite(currentWord.id) : false;
  const isWordMastered = currentWord ? isMastered(currentWord.id) : false;

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
      // Switching from All to single accent
      setIsAllAccents(false);
      setSelectedAccents([accent]);
    } else {
      if (selectedAccents.includes(accent)) {
        if (selectedAccents.length > 1) {
          setSelectedAccents(selectedAccents.filter(a => a !== accent));
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWord, nextWord, prevWord, isAllAccents, selectedAccents, settings.speechRate, toggleFavorite, toggleMastered]);

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

  const tierMeta = currentWord ? (TIER_CONFIG[currentWord.tier] || TIER_CONFIG.score_basic) : TIER_CONFIG.score_basic;
  const isWordSpeaking = currentWord ? (isSpeaking && currentSpeakingText === currentWord.word) : false;
  const isSentenceSpeaking = currentWord ? (isSpeaking && currentSpeakingText === currentWord.example_en) : false;

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
      } else {
        speechService.speakSentence(
          currentWord.example_en,
          currentWord.word,
          currentWord.phonetic,
          'us',
          settings.speechRate
        );
      }
    }
  };

  const progressPercent = words.length > 0 ? Math.round(((currentIndex + 1) / words.length) * 100) : 0;

  return (
    <div className="flashcard-page-container">
      {/* Top Dynamic Picker Header (Day 1~30 scroll or Level pills) */}
      <DynamicPickerHeader />

      {/* Unit Title & Words Count Row */}
      <div className="unit-header-bar">
        <div>
          <h2 className="unit-main-title">{getUnitTitle()}</h2>
          <p className="unit-sub-info">
            {words.length > 0 ? `共收錄 ${words.length} 筆精選單字 · 已背熟 ${masteredWords.length} 字` : '目前無符合篩選條件的單字'}
          </p>
        </div>

        <button className="btn-all-words" onClick={onOpenWordList}>
          <List size={16} />
          <span>All ({words.length})</span>
        </button>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flashcard-center-empty">
          <div className="loading-spinner" />
          <p>載入單字庫中...</p>
        </div>
      ) : !currentWord ? (
        <div className="flashcard-center-empty glass-panel">
          <p>此篩選條件下無單字，請至上方或「設定」啟用更多分數階級。</p>
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

          {/* Main Card */}
          <div className="flashcard-wrapper fade-in" key={currentWord.id}>
            <div className="card-top-bar">
              <div
                className="tier-tag"
                style={{
                  background: `var(--tier-${currentWord.tier.replace('score_', '')}-bg)`,
                  color: tierMeta.color,
                }}
              >
                {tierMeta.badge}
              </div>

              {/* Action Buttons: Mastered Checkmark + Favorite Star */}
              <div className="card-top-actions">
                <button
                  className={`master-btn ${isWordMastered ? 'mastered' : ''}`}
                  onClick={() => toggleMastered(currentWord)}
                  title="標記為已背熟 (C)"
                >
                  <CheckCircle2
                    size={20}
                    fill={isWordMastered ? 'var(--accent-success)' : 'transparent'}
                    color={isWordMastered ? 'white' : 'var(--text-muted)'}
                  />
                  <span className="master-btn-label">{isWordMastered ? '已背熟' : '背好了'}</span>
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
                  onClick={handleSpeakWord}
                  title="播放發音 (空白鍵)"
                >
                  {isWordSpeaking ? <Volume2 size={24} className="anim-speaking" /> : <Volume2 size={24} />}
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
          padding: 8px 16px 120px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .flashcard-page-container {
            padding: max(8px, env(safe-area-inset-top)) 12px 100px;
            gap: 12px;
          }
        }
        .unit-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 4px;
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
        .btn-all-words {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(37, 99, 235, 0.12);
          border: 1px solid rgba(37, 99, 235, 0.25);
          color: var(--accent-primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-all-words:hover {
          background: var(--accent-primary);
          color: white;
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
        }
        .counter-text, .percent-text {
          font-size: 13px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }
        .progress-bar-bg {
          height: 6px;
          border-radius: 9999px;
          background: var(--bg-secondary);
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
          border-radius: 9999px;
          transition: width 0.25s ease-out;
        }
        .flashcard-wrapper {
          background: var(--bg-card);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 32px;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .card-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tier-tag {
          font-size: 12px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 9999px;
        }
        .card-top-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .master-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .master-btn:hover {
          border-color: var(--accent-success);
          color: var(--accent-success);
        }
        .master-btn.mastered {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.4);
          color: var(--accent-success);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
        }
        .master-btn.mastered:hover {
          background: rgba(16, 185, 129, 0.25);
        }
        .master-btn-label {
          font-weight: 800;
        }
        .star-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .star-btn:hover {
          transform: scale(1.15);
        }
        .word-hero-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .word-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .word-text {
          font-family: var(--font-display);
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--text-primary);
        }
        .speaker-btn {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-full);
          border: 1.5px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .speaker-btn:hover {
          background: var(--accent-primary);
          color: white;
          border-color: transparent;
          transform: scale(1.06);
        }
        .speaker-btn.speaking {
          background: var(--accent-primary);
          color: white;
          box-shadow: 0 0 20px var(--border-glow);
        }
        .phonetic-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pos-badge {
          background: var(--bg-secondary);
          color: var(--accent-primary);
          font-size: 13px;
          font-weight: 800;
          font-style: italic;
          padding: 2px 8px;
          border-radius: 6px;
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
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed var(--border-color);
        }
        .accent-checkbox-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .accent-chk-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .accent-chk-btn:focus, .accent-chk-btn:focus-visible {
          outline: none;
        }
        .accent-chk-btn:hover {
          border-color: var(--accent-primary);
          color: var(--text-primary);
        }
        .accent-chk-btn.checked {
          border-color: var(--accent-primary);
          background: rgba(37, 99, 235, 0.12);
          color: var(--accent-primary);
        }
        .accent-chk-btn.all-btn.checked {
          background: var(--accent-primary);
          color: white;
          border-color: transparent;
        }
        .accent-chk-btn.dimmed {
          opacity: 0.45;
          filter: grayscale(0.5);
        }
        .accent-chk-btn.dimmed:hover {
          opacity: 0.85;
          filter: grayscale(0);
        }
        .accent-chk-btn.active-speaking {
          background: var(--accent-primary) !important;
          color: white !important;
          border-color: transparent !important;
          opacity: 1 !important;
          filter: none !important;
          box-shadow: 0 0 14px rgba(37, 99, 235, 0.55);
          transform: scale(1.05);
        }
        .chk-box {
          width: 15px;
          height: 15px;
          border-radius: 4px;
          border: 1.5px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-card);
          transition: all 0.2s;
        }
        .chk-box.checked {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }
        .all-btn .chk-box {
          border-radius: 9999px;
        }
        .all-btn .chk-box.checked {
          background: white;
          border-color: white;
        }
        .all-btn .chk-box.checked svg {
          stroke: var(--accent-primary);
        }
        .speed-deck-group {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-secondary);
          padding: 3px 8px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
        }
        .speed-options {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .speed-option-btn {
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .speed-option-btn:hover {
          color: var(--text-primary);
        }
        .speed-option-btn.active {
          background: var(--bg-card);
          color: var(--accent-primary);
          box-shadow: var(--shadow-sm);
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
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          padding: 20px;
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
        /* Mobile: Hide keyboard shortcut hints bar */
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
