import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TIER_CONFIG } from '../../services/DataLoader';
import { Search, X, Star } from 'lucide-react';

export const WordListModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { words, currentIndex, setCurrentIndex, isFavorite, toggleFavorite } = useApp();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return words;
    const q = query.toLowerCase().trim();
    return words.filter(w => 
      w.word.toLowerCase().includes(q) || 
      w.chinese.toLowerCase().includes(q) || 
      w.pos.toLowerCase().includes(q)
    );
  }, [words, query]);

  if (!isOpen) return null;

  const handleSelectWord = (targetWordId: string) => {
    const idx = words.findIndex(w => w.id === targetWordId);
    if (idx >= 0) {
      setCurrentIndex(idx);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">單字快速搜尋與跳轉</h3>
            <p className="modal-subtitle">共 {filtered.length} 個單字</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search bar */}
        <div className="modal-search-box">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="modal-search-input"
            placeholder="搜尋單字、中文意思或詞性..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Words List */}
        <div className="modal-words-list">
          {filtered.length === 0 ? (
            <div className="empty-search">查無相符單字</div>
          ) : (
            filtered.map((word) => {
              const originalIndex = words.findIndex(w => w.id === word.id);
              const isCurrent = originalIndex === currentIndex;
              const isFav = isFavorite(word.id);
              const tierMeta = TIER_CONFIG[word.tier] || TIER_CONFIG.score_basic;

              return (
                <div
                  key={word.id}
                  className={`word-list-row ${isCurrent ? 'current' : ''}`}
                  onClick={() => handleSelectWord(word.id)}
                >
                  <div className="row-left">
                    <span className="row-index">#{originalIndex + 1}</span>
                    <span className="row-word">{word.word}</span>
                    {word.pos && <span className="row-pos">{word.pos}</span>}
                    <span className="row-tier-badge" style={{ color: tierMeta.color }}>
                      {tierMeta.badge}
                    </span>
                  </div>

                  <div className="row-right">
                    <span className="row-chinese">{word.chinese}</span>
                    <button
                      className="star-inline-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(word);
                      }}
                    >
                      <Star
                        size={16}
                        fill={isFav ? '#F59E0B' : 'transparent'}
                        color={isFav ? '#F59E0B' : 'var(--text-muted)'}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card {
          width: 100%;
          max-width: 640px;
          max-height: 80vh;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
        }
        .modal-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .modal-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }
        .modal-search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          margin: 16px 20px 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .modal-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
        }
        .clear-btn {
          background: var(--border-color);
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
        }
        .modal-words-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .word-list-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background 0.15s;
        }
        .word-list-row:hover {
          background: var(--bg-secondary);
        }
        .word-list-row.current {
          background: var(--bg-secondary);
          border-left: 3px solid var(--accent-primary);
        }
        .row-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .row-index {
          font-size: 12px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          width: 32px;
        }
        .row-word {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .row-pos {
          font-size: 11px;
          font-style: italic;
          color: var(--accent-primary);
          background: var(--bg-primary);
          padding: 1px 5px;
          border-radius: 4px;
        }
        .row-tier-badge {
          font-size: 10px;
          font-weight: 800;
        }
        .row-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .row-chinese {
          font-size: 13px;
          color: var(--text-secondary);
          max-width: 200px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .star-inline-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
        }
        .empty-search {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
