import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { QuizType, Word } from '../../types';
import { quizEngine } from '../../services/QuizEngine';
import { storageService } from '../../services/StorageService';
import { DAY_TITLES } from '../../services/DataLoader';
import { spacedRepetitionService } from '../../services/SpacedRepetitionService';
import { Play, CheckCircle2, History, RotateCcw } from 'lucide-react';
import { MistakeReviewModal } from './MistakeReviewModal';
import { DynamicPickerHeader } from '../Flashcard/DynamicPickerHeader';

export const QuizHomeView: React.FC = () => {
  const { words, allWordsPool, currentDay, currentTier, studyMode, enabledTiers, startQuiz, startRetest, settings, updateSettings } = useApp();

  const [scope, setScope] = useState<'current' | 'srs' | 'all' | 'mistakes'>('current');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [enabledTypes, setEnabledTypes] = useState<QuizType[]>(['enToZh', 'zhToEn', 'listening', 'fillInBlank']);
  
  // 0 = 無時限；10/15/20 = 倒數秒數
  const [timerSec, setTimerSec] = useState<number>(() => settings.quizTimerSeconds ?? 15);

  const handleSelectTimer = (sec: number) => {
    setTimerSec(sec);
    updateSettings({ quizTimerSeconds: sec });
  };

  const [reviewMistakes, setReviewMistakes] = useState<Word[] | null>(null);

  const quizRecords = storageService.getQuizRecords();
  const mistakeWords = storageService.getMistakeWords();
  const dueSrsWords = spacedRepetitionService.getDueWords(allWordsPool);

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
    } else if (scope === 'srs') {
      targetWords = dueSrsWords;
      title = `🧠 艾賓浩斯遺忘曲線 · 今日到期複習 (${dueSrsWords.length} 字)`;
    } else if (scope === 'all') {
      targetWords = filteredGlobalPool.length > 0 ? filteredGlobalPool : allWordsPool;
      title = `全真題庫測驗 (${targetWords.length} 字)`;
    } else {
      targetWords = mistakeWords;
      title = `🔥 錯題專項強化測驗 (${mistakeWords.length} 字)`;
    }

    if (targetWords.length === 0) {
      if (scope === 'srs') {
        alert('太棒了！今天沒有任何艾賓浩斯到期的複習單字！請多背新單字或做單元測驗。');
      } else {
        alert('所選範圍目前沒有單字可進行測驗！請至設定頁面確認已啟用的階級。');
      }
      return;
    }

    const questions = quizEngine.generateQuiz(targetWords, allWordsPool, enabledTypes, questionCount);
    startQuiz(questions, title);
  };

  return (
    <div className="quiz-home-container">
      {/* Top Unit Selector Header (Day 1~30 or Basic~900) */}
      <DynamicPickerHeader />

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
              className={`scope-btn ${scope === 'srs' ? 'active' : ''}`}
              onClick={() => setScope('srs')}
            >
              <b>🧠 艾賓浩斯複習</b>
              <span>({dueSrsWords.length} 字今日到期)</span>
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

        {/* Question Count (Full-width 4-grid) */}
        <div className="config-group">
          <label className="config-label">題目數量</label>
          <div className="count-grid">
            {[10, 20, 30, 50].map(cnt => (
              <button
                key={cnt}
                className={`count-cell-btn ${questionCount === cnt ? 'active' : ''}`}
                onClick={() => setQuestionCount(cnt)}
              >
                {cnt} 題
              </button>
            ))}
          </div>
        </div>

        {/* Timer Setting Grid */}
        <div className="config-group">
          <label className="config-label">作答時限</label>
          <div className="count-grid">
            {([0, 10, 15, 20] as number[]).map(sec => (
              <button
                key={sec}
                className={`count-cell-btn timer-cell-btn ${timerSec === sec ? 'active-timer' : ''}`}
                onClick={() => handleSelectTimer(sec)}
              >
                {sec === 0 ? '無' : `${sec} 秒`}
              </button>
            ))}
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
          padding: 16px 16px 120px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .quiz-home-container {
            padding: max(8px, env(safe-area-inset-top)) 12px 100px;
            gap: 12px;
          }
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
        .count-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .count-cell-btn {
          height: 40px;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .count-cell-btn:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        .count-cell-btn.active {
          background: var(--accent-primary);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        /* Orange override for timer grid cells */
        .timer-cell-btn:hover {
          border-color: var(--accent-gold);
          color: var(--accent-gold);
        }
        .timer-cell-btn.active-timer {
          background: var(--accent-gold) !important;
          color: #000 !important;
          border-color: transparent !important;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35) !important;
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
