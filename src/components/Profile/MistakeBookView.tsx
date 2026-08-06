import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/SpeechService';
import { storageService } from '../../services/StorageService';
import { TIER_CONFIG } from '../../services/DataLoader';
import { BookX, RotateCcw, Trash2, Volume2, Search, CheckCircle } from 'lucide-react';

export const MistakeBookView: React.FC = () => {
  const { settings, startRetest } = useApp();
  const [mistakes, setMistakes] = useState(() => storageService.getMistakeWords());
  const [query, setQuery] = useState('');

  const filtered = mistakes.filter(w =>
    w.word.toLowerCase().includes(query.toLowerCase()) ||
    w.chinese.toLowerCase().includes(query.toLowerCase())
  );

  const handleRemove = (wordId: string) => {
    storageService.removeMistake(wordId);
    setMistakes(storageService.getMistakeWords());
  };

  const handleClearAll = () => {
    if (window.confirm('確定要清空所有錯題紀錄嗎？')) {
      storageService.clearMistakes();
      setMistakes([]);
    }
  };

  return (
    <div className="mistakes-page-container">
      {/* Header */}
      <div className="page-header">
        <div className="title-row">
          <BookX size={24} color="var(--accent-error)" />
          <h2 className="page-title">總錯題專項複習本</h2>
        </div>
        <p className="page-subtitle">累計需強化的錯題共 {mistakes.length} 字</p>
      </div>

      {/* Top Action Card */}
      {mistakes.length > 0 && (
        <div className="glass-panel mistake-hero-card">
          <div>
            <h3 className="hero-card-title">🔥 專項突擊錯題</h3>
            <p className="hero-card-desc">針對過去所有測驗中答錯的單字發起專項測驗</p>
          </div>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => startRetest(mistakes)}>
              <RotateCcw size={16} />
              <span>全錯題重測 ({mistakes.length})</span>
            </button>
            <button className="btn-secondary" onClick={handleClearAll}>
              <Trash2 size={16} />
              <span>清空錯題本</span>
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {mistakes.length > 0 && (
        <div className="search-bar">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="搜尋錯題單字或中文..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      )}

      {/* List */}
      {mistakes.length === 0 ? (
        <div className="glass-panel empty-box">
          <CheckCircle size={36} color="var(--accent-success)" style={{ margin: '0 auto 12px' }} />
          <p>太棒了！目前錯題本空空如也，代表所有單字都已掌握或尚未進行測驗。</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel empty-box">查無相符錯題單字</div>
      ) : (
        <div className="mistakes-list">
          {filtered.map(w => {
            const tierMeta = TIER_CONFIG[w.tier] || TIER_CONFIG.score_basic;
            return (
              <div key={w.id} className="glass-panel mistake-card fade-in">
                <div className="mistake-card-top">
                  <div className="word-meta">
                    <span className="word-title">{w.word}</span>
                    {w.pos && <span className="pos-badge">{w.pos}</span>}
                    {w.phonetic && <span className="phonetic-text">{w.phonetic}</span>}
                    <span className="tier-badge" style={{ color: tierMeta.color }}>
                      {tierMeta.badge}
                    </span>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-icon-small"
                      onClick={() => speechService.speak(w.word, w.phonetic, settings.voiceAccent, settings.speechRate)}
                      title="發音"
                    >
                      <Volume2 size={16} />
                    </button>
                    <button
                      className="btn-icon-small"
                      onClick={() => handleRemove(w.id)}
                      title="已搞懂（移出錯題本）"
                    >
                      <CheckCircle size={16} color="var(--accent-success)" />
                    </button>
                  </div>
                </div>

                <p className="chinese-def">{w.chinese}</p>

                {w.example_en && (
                  <div className="example-snippet">
                    <p className="example-en-text">{w.example_en}</p>
                    {w.example_zh && <p className="example-zh-text">{w.example_zh}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .mistakes-page-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 24px 16px 120px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .mistakes-page-container {
            padding: max(8px, env(safe-area-inset-top)) 12px 100px;
            gap: 14px;
          }
        }
        .page-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .page-subtitle {
          font-size: 13px;
          color: var(--text-muted);
        }
        .mistake-hero-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-color: rgba(239, 68, 68, 0.3);
        }
        .hero-card-title {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .hero-card-desc {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .hero-btns {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px 18px;
        }
        .search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
        }
        .mistakes-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mistake-card {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .mistake-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .word-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .word-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .tier-badge {
          font-size: 10px;
          font-weight: 800;
        }
        .card-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-icon-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .chinese-def {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .example-snippet {
          background: var(--bg-secondary);
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .example-en-text {
          font-size: 13px;
          color: var(--text-primary);
        }
        .example-zh-text {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .empty-box {
          padding: 48px 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};
