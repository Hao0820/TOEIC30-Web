import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/SpeechService';
import { TIER_CONFIG } from '../../services/DataLoader';
import { Star, Volume2, Search, Trash2 } from 'lucide-react';

export const FavoritesView: React.FC = () => {
  const { favorites, toggleFavorite, settings } = useApp();
  const [query, setQuery] = useState('');

  const filtered = favorites.filter(w =>
    w.word.toLowerCase().includes(query.toLowerCase()) ||
    w.chinese.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="favorites-page-container">
      {/* Header */}
      <div className="page-header">
        <div className="title-row">
          <Star size={24} fill="#F59E0B" color="#F59E0B" />
          <h2 className="page-title">我的收藏單字庫</h2>
        </div>
        <p className="page-subtitle">共收藏 {favorites.length} 個重點單字</p>
      </div>

      {/* Search */}
      {favorites.length > 0 && (
        <div className="search-bar">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="搜尋收藏單字或中文..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      )}

      {/* List */}
      {favorites.length === 0 ? (
        <div className="glass-panel empty-box">
          <p>目前尚未收藏任何單字。在單字卡片右上角點擊星號 ★ 即可收藏！</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel empty-box">查無相符收藏單字</div>
      ) : (
        <div className="favorites-list">
          {filtered.map(w => {
            const tierMeta = TIER_CONFIG[w.tier] || TIER_CONFIG.score_basic;
            return (
              <div key={w.id} className="glass-panel fav-card fade-in">
                <div className="fav-card-top">
                  <div className="word-meta">
                    <span className="word-title">{w.word}</span>
                    {w.pos && <span className="pos-badge">{w.pos}</span>}
                    {w.phonetic && <span className="phonetic-text">{w.phonetic}</span>}
                    <span className="tier-badge" style={{ color: tierMeta.color }}>
                      {tierMeta.badge}
                    </span>
                  </div>

                  <div className="fav-actions">
                    <button
                      className="btn-icon-small"
                      onClick={() => speechService.speak(w.word, w.phonetic, settings.voiceAccent, settings.speechRate)}
                      title="發音"
                    >
                      <Volume2 size={16} />
                    </button>
                    <button
                      className="btn-icon-small"
                      onClick={() => toggleFavorite(w)}
                      title="取消收藏"
                    >
                      <Trash2 size={16} color="var(--accent-error)" />
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
        .favorites-page-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 24px 16px 120px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .favorites-page-container {
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
        .favorites-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .fav-card {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fav-card-top {
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
        .fav-actions {
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
        .btn-icon-small:hover {
          background: var(--bg-card);
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
