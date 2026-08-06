import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/SpeechService';
import { TIER_CONFIG, DAY_TITLES } from '../../services/DataLoader';
import { Volume2, Star, ChevronLeft, ChevronRight, List, VolumeX, CheckCircle2 } from 'lucide-react';
import { DynamicPickerHeader } from './DynamicPickerHeader';

export const FlashcardView: React.FC<{ onOpenWordList: () => void }> = ({ onOpenWordList }) => {
  const {
    words,
    currentIndex,
    nextWord,
    prevWord,
    toggleFavorite,
    isFavorite,
    settings,
    isSpeaking,
    currentSpeakingText,
    isLoading,
    studyMode,
    currentDay,
    currentTier,
    setActiveTab,
  } = useApp();

  const currentWord = words[currentIndex] || null;
  const isStarred = currentWord ? isFavorite(currentWord.id) : false;

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
        if (currentWord) {
          speechService.speak(currentWord.word, currentWord.phonetic, settings.voiceAccent, settings.speechRate);
        }
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (currentWord) {
          toggleFavorite(currentWord);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWord, nextWord, prevWord, settings, toggleFavorite]);

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

  const handleSpeakWord = () => {
    if (!currentWord) return;
    if (isWordSpeaking) {
      speechService.stop();
    } else {
      speechService.speak(currentWord.word, currentWord.phonetic, settings.voiceAccent, settings.speechRate);
    }
  };

  const handleSpeakSentence = () => {
    if (!currentWord) return;
    if (isSentenceSpeaking) {
      speechService.stop();
    } else {
      speechService.speakSentence(currentWord.example_en, currentWord.word, currentWord.phonetic, settings.voiceAccent, settings.speechRate);
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
            {words.length > 0 ? `共收錄 ${words.length} 筆精選單字` : '目前無符合篩選條件的單字'}
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
          <p>此篩選條件下無單字，請至「設定」啟用更多分數階級。</p>
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
              <div className="tier-tag" style={{ background: `var(--tier-${currentWord.tier.replace('score_', '')}-bg)`, color: tierMeta.color }}>
                {tierMeta.badge}
              </div>

              <button
                className={`star-btn ${isStarred ? 'starred' : ''}`}
                onClick={() => toggleFavorite(currentWord)}
                title="收藏此單字 (F)"
              >
                <Star size={22} fill={isStarred ? '#F59E0B' : 'transparent'} color={isStarred ? '#F59E0B' : 'var(--text-muted)'} />
              </button>
            </div>

            {/* Word Hero */}
            <div className="word-hero-box">
              <div className="word-title-row">
                <h2 className="word-text">{currentWord.word}</h2>
                
                {/* Stable Speaker Button */}
                <button
                  className={`speaker-btn ${isWordSpeaking ? 'speaking' : ''}`}
                  onClick={handleSpeakWord}
                  title="單字真人發音 (空白鍵)"
                >
                  {isWordSpeaking ? <Volume2 size={24} className="anim-speaking" /> : <Volume2 size={24} />}
                </button>
              </div>

              <div className="phonetic-row">
                {currentWord.pos && <span className="pos-badge">{currentWord.pos}</span>}
                {currentWord.phonetic && <span className="phonetic-text">{currentWord.phonetic}</span>}
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
                {currentWord.example_zh && (
                  <p className="example-zh">{currentWord.example_zh}</p>
                )}
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

          {/* Keyboard Shortcuts Bar */}
          <div className="keyboard-hints">
            <span className="hint-pill"><b>Space</b> 發音</span>
            <span className="hint-pill"><b>← / →</b> 切換</span>
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
          gap: 12px;
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
