import React, { useEffect, useState } from 'react';
import type { QuizRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, List, ArrowRight, X } from 'lucide-react';
import { MistakeReviewModal } from './MistakeReviewModal';

export const QuizResultView: React.FC<{ record: QuizRecord; onExit: () => void }> = ({ record, onExit }) => {
  const { startRetest } = useApp();
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (record.scorePercentage >= 80) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [record.scorePercentage]);

  const getGradeInfo = (percentage: number) => {
    if (percentage === 100) return { title: '滿分通過！太神了 🏆', grade: 'S+', color: '#10B981' };
    if (percentage >= 90) return { title: '卓越非凡！金色證書實力 ⭐', grade: 'A+', color: '#10B981' };
    if (percentage >= 80) return { title: '表現優異！進步神速 👏', grade: 'A', color: '#0284C7' };
    if (percentage >= 60) return { title: '及格通過！持續保持 💪', grade: 'B', color: '#F59E0B' };
    return { title: '再接再厲！建議專項重測 🎯', grade: 'C', color: '#EF4444' };
  };

  const gradeInfo = getGradeInfo(record.scorePercentage);

  return (
    <div
      className="quiz-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onExit();
      }}
    >
      <div className="result-modal-card glass-panel fade-in-scale">
        {/* Close Button in Modal */}
        <button
          className="modal-close-btn"
          onClick={onExit}
          title="關閉測驗結果"
        >
          <X size={20} />
        </button>

        {/* Top Trophy Icon */}
        <div className="result-icon-box" style={{ background: `linear-gradient(135deg, ${gradeInfo.color}, #7C3AED)` }}>
          <Trophy size={34} color="white" />
        </div>

        <h2 className="result-title">{gradeInfo.title}</h2>
        <p className="result-scope">{record.scopeTitle}</p>

        {/* Circular Percentage */}
        <div className="score-circle-box">
          <div className="score-circle" style={{ borderColor: gradeInfo.color }}>
            <span className="score-number">{record.scorePercentage}%</span>
            <span className="grade-badge" style={{ background: gradeInfo.color }}>{gradeInfo.grade}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-pill">
            <span className="stat-label">總題數</span>
            <span className="stat-val">{record.totalQuestions}</span>
          </div>
          <div className="stat-pill success">
            <span className="stat-label">答對題數</span>
            <span className="stat-val">{record.correctCount}</span>
          </div>
          <div className="stat-pill error">
            <span className="stat-label">答錯題數</span>
            <span className="stat-val">{record.wrongCount}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="result-actions">
          {record.mistakeWords && record.mistakeWords.length > 0 && (
            <>
              <button
                className="btn-primary retest-btn"
                onClick={() => startRetest(record.mistakeWords)}
              >
                <RotateCcw size={18} />
                <span>🔥 針對本次錯題立即重測 ({record.mistakeWords.length})</span>
              </button>

              <button
                className="btn-secondary view-mistakes-btn"
                onClick={() => setShowReview(true)}
              >
                <List size={18} />
                <span>檢視錯題解析</span>
              </button>
            </>
          )}

          <button className="btn-secondary finish-btn" onClick={onExit}>
            <span>返回測驗首頁</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {showReview && (
        <MistakeReviewModal
          mistakes={record.mistakeWords}
          onClose={() => setShowReview(false)}
        />
      )}

      <style>{`
        .quiz-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.25s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .result-modal-card {
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 36px 28px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 18px;
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          animation: modalScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalScaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-close-btn:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
          transform: scale(1.05);
        }
        .result-icon-box {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
          margin-top: 4px;
        }
        .result-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 2px;
        }
        .result-scope {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: -10px;
        }
        .score-circle-box {
          padding: 6px 0;
        }
        .score-circle {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          border: 7px solid var(--accent-primary);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          background: var(--bg-secondary);
        }
        .score-number {
          font-family: var(--font-display);
          font-size: 34px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .grade-badge {
          position: absolute;
          bottom: -10px;
          padding: 2px 10px;
          border-radius: 9999px;
          color: white;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          width: 100%;
        }
        .stat-pill {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stat-label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 700;
        }
        .stat-val {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .stat-pill.success .stat-val {
          color: var(--accent-success);
        }
        .stat-pill.error .stat-val {
          color: var(--accent-error);
        }
        .result-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-top: 6px;
        }
        .retest-btn {
          width: 100%;
          height: 48px;
        }
        .view-mistakes-btn, .finish-btn {
          width: 100%;
          height: 44px;
        }
      `}</style>
    </div>
  );
};
