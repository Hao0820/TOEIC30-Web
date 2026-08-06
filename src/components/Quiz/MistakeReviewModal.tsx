import React from 'react';
import type { Word } from '../../types';
import { speechService } from '../../services/SpeechService';
import { useApp } from '../../context/AppContext';
import { X, Volume2 } from 'lucide-react';

export const MistakeReviewModal: React.FC<{ mistakes: Word[]; onClose: () => void }> = ({ mistakes, onClose }) => {
  const { settings } = useApp();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">錯題檢視</h3>
            <p className="modal-subtitle">共 {mistakes.length} 題答錯單字</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="mistake-review-list">
          {mistakes.map((w, index) => (
            <div key={`${w.id}_${index}`} className="mistake-review-card">
              <div className="mistake-card-top">
                <div className="word-group">
                  <span className="mistake-index">#{index + 1}</span>
                  <span className="mistake-word">{w.word}</span>
                  {w.pos && <span className="pos-badge">{w.pos}</span>}
                  {w.phonetic && <span className="phonetic-tag">{w.phonetic}</span>}
                </div>

                <button
                  className="btn-icon-small"
                  onClick={() => speechService.speak(w.word, w.phonetic, settings.voiceAccent, settings.speechRate)}
                  title="朗讀發音"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              <p className="mistake-chinese">{w.chinese}</p>

              {w.example_en && (
                <div className="mistake-example">
                  <p className="example-en-text">{w.example_en}</p>
                  {w.example_zh && <p className="example-zh-text">{w.example_zh}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .mistake-review-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mistake-review-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mistake-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .word-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mistake-index {
          font-size: 12px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .mistake-word {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .phonetic-tag {
          font-size: 13px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .btn-icon-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .mistake-chinese {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .mistake-example {
          background: var(--bg-card);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .example-en-text {
          font-size: 13px;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .example-zh-text {
          font-size: 12px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};
