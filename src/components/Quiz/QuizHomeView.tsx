import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { QuizType, Word } from '../../types';
import { quizEngine } from '../../services/QuizEngine';
import { storageService } from '../../services/StorageService';
import { DAY_TITLES } from '../../services/DataLoader';
import { Play, Clock, CheckCircle2, History, RotateCcw, Sparkles } from 'lucide-react';
import { MistakeReviewModal } from './MistakeReviewModal';

export const QuizHomeView: React.FC = () => {
  const { words, allWordsPool, currentDay, currentTier, studyMode, enabledTiers, startQuiz, startRetest } = useApp();

  const [scope, setScope] = useState<'current' | 'all' | 'mistakes'>('current');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [enabledTypes, setEnabledTypes] = useState<QuizType[]>(['enToZh', 'zhToEn', 'listening', 'fillInBlank']);
  const [useTimer, setUseTimer] = useState<boolean>(true);

  const [reviewMistakes, setReviewMistakes] = useState<Word[] | null>(null);

  const quizRecords = storageService.getQuizRecords();
  const mistakeWords = storageService.getMistakeWords();

  const toggleType = (t: QuizType) => {
    if (enabledTypes.includes(t)) {
      if (enabledTypes.length > 1) {
        setEnabledTypes(enabledTypes.filter(x => x !== t));
      }
    } else {
      setEnabledTypes([...enabledTypes, t]);
    }
  };

  const handleStart = () => {
    let targetWords: Word[] = [];
    let title = '';

    const filteredGlobalPool = allWordsPool.filter(w => enabledTiers.includes(w.tier));

    if (scope === 'current') {
      targetWords = words;
      if (studyMode === 'byDay') {
        title = `Day ${String(currentDay).padStart(2, '0')} · ${DAY_TITLES[currentDay] || ''}`;
      } else if (studyMode === 'byLevel') {
        title = `目標等級 · ${currentTier.replace('score_', '').toUpperCase()} 測驗`;
      } else {
        title = '當前學習單元測驗';
      }
    } else if (scope === 'all') {
      targetWords = filteredGlobalPool.length > 0 ? filteredGlobalPool : allWordsPool;
      title = `全真題庫測驗 (${targetWords.length} 字)`;
    } else {
      targetWords = mistakeWords;
      title = `🔥 錯題專項強化測驗 (${mistakeWords.length} 字)`;
    }

    if (targetWords.length === 0) {
      alert('所選範圍目前沒有單字可進行測驗！請至設定頁面確認已啟用的階級。');
      return;
    }

    const questions = quizEngine.generateQuiz(targetWords, allWordsPool, enabledTypes, questionCount);
    startQuiz(questions, title);
  };

  return (
    <div className="quiz-home-container">
      {/* Top Hero Banner */}
      <div className="quiz-hero-card">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>全真模擬測驗</span>
        </div>
        <h2 className="hero-title">TOEIC 實戰防作弊測驗</h2>
        <p className="hero-desc">4 大題型智慧出題，同詞性智能干擾選項，檢測您的真實商務詞彙量</p>
      </div>

      {/* Quiz Configuration */}
      <div className="glass-panel config-card">
        <h3 className="section-title">測驗設定</h3>

        {/* Scope */}
        <div className="config-group">
          <label className="config-label">測驗範圍</label>
          <div className="scope-grid">
            <button
              className={`scope-btn ${scope === 'current' ? 'active' : ''}`}
              onClick={() => setScope('current')}
            >
              <b>當前單元</b>
              <span>({words.length} 字)</span>
            </button>
            <button
              className={`scope-btn ${scope === 'all' ? 'active' : ''}`}
              onClick={() => setScope('all')}
            >
              <b>全書題庫</b>
              <span>(6,800+ 字)</span>
            </button>
            <button
              className={`scope-btn ${scope === 'mistakes' ? 'active' : ''}`}
              onClick={() => setScope('mistakes')}
              disabled={mistakeWords.length === 0}
            >
              <b>錯題本專項</b>
              <span>({mistakeWords.length} 字)</span>
            </button>
          </div>
        </div>

        {/* Question Types */}
        <div className="config-group">
          <label className="config-label">測驗題型 (多選)</label>
          <div className="types-grid">
            {[
              { id: 'enToZh', label: '英翻中 (EN ➔ 中)' },
              { id: 'zhToEn', label: '中翻英 (中 ➔ EN)' },
              { id: 'listening', label: '聽力測驗 (Audio)' },
              { id: 'fillInBlank', label: '例句克漏字 (Blank)' },
            ].map(t => (
              <button
                key={t.id}
                className={`type-toggle-btn ${enabledTypes.includes(t.id as QuizType) ? 'active' : ''}`}
                onClick={() => toggleType(t.id as QuizType)}
              >
                <CheckCircle2 size={16} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question Count & Timer */}
        <div className="config-row">
          <div className="config-group flex-1">
            <label className="config-label">題目數量</label>
            <div className="count-pills">
              {[10, 20, 30, 50].map(cnt => (
                <button
                  key={cnt}
                  className={`count-pill ${questionCount === cnt ? 'active' : ''}`}
                  onClick={() => setQuestionCount(cnt)}
                >
                  {cnt} 題
                </button>
              ))}
            </div>
          </div>

          <div className="config-group">
            <label className="config-label">作答倒數計時</label>
            <button
              className={`timer-toggle ${useTimer ? 'active' : ''}`}
              onClick={() => setUseTimer(!useTimer)}
            >
              <Clock size={16} />
              <span>{useTimer ? '每題 15 秒' : '無時限'}</span>
            </button>
          </div>
        </div>

        {/* Start Button */}
        <button className="btn-primary start-quiz-btn" onClick={handleStart}>
          <Play size={20} fill="white" />
          <span>開始測驗</span>
        </button>
      </div>

      {/* History Records Section */}
      <div className="history-section">
        <div className="history-header">
          <div className="history-title-row">
            <History size={18} />
            <h3 className="section-title">歷史測驗紀錄</h3>
          </div>
          <span className="history-count">共 {quizRecords.length} 次紀錄</span>
        </div>

        {quizRecords.length === 0 ? (
          <div className="glass-panel empty-history">
            <p>尚無測驗紀錄，點擊上方按鈕開始您的第一次實戰測驗！</p>
          </div>
        ) : (
          <div className="history-list">
            {quizRecords.map(rec => (
              <div key={rec.id} className="glass-panel history-item">
                <div className="history-left">
                  <div
                    className="score-badge"
                    style={{
                      background: rec.scorePercentage >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: rec.scorePercentage >= 80 ? 'var(--accent-success)' : 'var(--accent-error)',
                    }}
                  >
                    {rec.scorePercentage}%
                  </div>
                  <div>
                    <h4 className="record-title">{rec.scopeTitle}</h4>
                    <p className="record-meta">
                      {rec.timestamp} · 答對 {rec.correctCount} / {rec.totalQuestions} 題
                    </p>
                  </div>
                </div>

                {rec.mistakeWords && rec.mistakeWords.length > 0 && (
                  <div className="history-actions">
                    <button
                      className="btn-secondary retest-small-btn"
                      onClick={() => startRetest(rec.mistakeWords)}
                      title="立即重測錯題"
                    >
                      <RotateCcw size={14} />
                      <span>錯題重測 ({rec.mistakeWords.length})</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mistake Review Modal */}
      {reviewMistakes && (
        <MistakeReviewModal
          mistakes={reviewMistakes}
          onClose={() => setReviewMistakes(null)}
        />
      )}

      <style>{`
        .quiz-home-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 24px 16px 120px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .quiz-hero-card {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(124, 58, 237, 0.15));
          border: 1px solid var(--border-glow);
          border-radius: var(--radius-xl);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-card);
          color: var(--accent-primary);
          font-size: 12px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
          width: fit-content;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .hero-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .config-card {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .section-title {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .config-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .config-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .scope-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .scope-btn {
          padding: 12px 10px;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .scope-btn b {
          font-size: 13px;
          color: var(--text-primary);
        }
        .scope-btn span {
          font-size: 11px;
          color: var(--text-muted);
        }
        .scope-btn.active {
          border-color: var(--accent-primary);
          background: var(--bg-card);
          box-shadow: var(--shadow-sm);
        }
        .scope-btn.active b {
          color: var(--accent-primary);
        }
        .scope-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .types-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .type-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .type-toggle-btn.active {
          background: var(--bg-card);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        .config-row {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .flex-1 {
          flex: 1;
        }
        .count-pills {
          display: flex;
          gap: 8px;
        }
        .count-pill {
          padding: 8px 14px;
          border-radius: 9999px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .count-pill.active {
          background: var(--accent-primary);
          color: white;
          border-color: transparent;
        }
        .timer-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 9999px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .timer-toggle.active {
          color: var(--accent-gold);
          border-color: var(--accent-gold);
        }
        .start-quiz-btn {
          width: 100%;
          height: 52px;
          font-size: 16px;
          margin-top: 8px;
        }
        .history-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .history-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-primary);
        }
        .history-count {
          font-size: 12px;
          color: var(--text-muted);
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .history-item {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .history-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .score-badge {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .record-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .record-meta {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .retest-small-btn {
          font-size: 12px;
          padding: 6px 12px;
        }
        .empty-history {
          padding: 32px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};
