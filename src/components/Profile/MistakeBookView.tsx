import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/SpeechService';
import { storageService } from '../../services/StorageService';
import { spacedRepetitionService } from '../../services/SpacedRepetitionService';
import { TIER_CONFIG } from '../../services/DataLoader';
import { BookX, RotateCcw, Trash2, Volume2, Search, CheckCircle, Brain, Sparkles, Calendar } from 'lucide-react';

export const MistakeBookView: React.FC = () => {
  const { allWordsPool, settings, startRetest } = useApp();
  const [mistakes, setMistakes] = useState(() => storageService.getMistakeWords());
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due'>('all');

  const dueSrsWords = spacedRepetitionService.getDueWords(allWordsPool);
  const srsStats = spacedRepetitionService.getSRSStats(allWordsPool.length);

  const displayList = filterMode === 'due' ? dueSrsWords : mistakes;

  const filtered = displayList.filter(
    (w) =>
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

  const handleStartSRSQuiz = () => {
    if (dueSrsWords.length === 0) {
      alert('太棒了！今日無待複習單字！');
      return;
    }
    startRetest(dueSrsWords);
  };

  return (
    <div className="mistakes-page-container">
      {/* Header */}
      <div className="page-header">
        <div className="title-row">
          <BookX size={24} color="var(--accent-error)" />
          <h2 className="page-title">錯題與艾賓浩斯記憶中心</h2>
        </div>
        <p className="page-subtitle">
          根據科學遺忘曲線排程複習，將短期記憶轉化為大腦永久記憶
        </p>
      </div>

      {/* 🧠 Ebbinghaus SRS Memory Health Dashboard Card */}
      <div className="glass-panel srs-dashboard-card">
        <div className="srs-card-header">
          <div className="srs-title-box">
            <Brain size={20} color="var(--accent-primary)" />
            <h3 className="srs-title">艾賓浩斯記憶階段分佈</h3>
          </div>
          <span className="srs-due-badge">
            <Calendar size={14} />
            今日到期：<b>{dueSrsWords.length}</b> 字
          </span>
        </div>

        <div className="srs-stages-grid">
          {[
            { lv: 'Lv.1', day: '1天後', count: srsStats.stage0, color: '#EF4444' },
            { lv: 'Lv.2', day: '2天後', count: srsStats.stage1, color: '#F97316' },
            { lv: 'Lv.3', day: '4天後', count: srsStats.stage2, color: '#F59E0B' },
            { lv: 'Lv.4', day: '7天後', count: srsStats.stage3, color: '#3B82F6' },
            { lv: 'Lv.5', day: '15天後', count: srsStats.stage4, color: '#8B5CF6' },
            { lv: 'Lv.6', day: '30天牢固', count: srsStats.stage5, color: '#10B981' },
          ].map((st) => (
            <div key={st.lv} className="stage-stat-box">
              <span className="stage-stat-lv" style={{ color: st.color }}>
                {st.lv}
              </span>
              <span className="stage-stat-count">{st.count}</span>
              <span className="stage-stat-day">{st.day}</span>
            </div>
          ))}
        </div>

        {dueSrsWords.length > 0 && (
          <div className="srs-action-banner">
            <button className="btn-srs-quiz" onClick={handleStartSRSQuiz}>
              <Sparkles size={16} />
              <span>啟動今日到期複習 ({dueSrsWords.length} 字)</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Mistake Action Card */}
      {mistakes.length > 0 && (
        <div className="glass-panel mistake-hero-card">
          <div>
            <h3 className="hero-card-title">🔥 專項突擊錯題庫</h3>
            <p className="hero-card-desc">針對過去所有測驗中答錯的單字發起專項突擊</p>
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

      {/* View Switcher Tabs */}
      <div className="filter-pill-tabs">
        <button
          className={`filter-pill-btn ${filterMode === 'all' ? 'active' : ''}`}
          onClick={() => setFilterMode('all')}
        >
          全部測驗錯題 ({mistakes.length})
        </button>
        <button
          className={`filter-pill-btn ${filterMode === 'due' ? 'active' : ''}`}
          onClick={() => setFilterMode('due')}
        >
          🧠 今日到期單字 ({dueSrsWords.length})
        </button>
      </div>

      {/* Search */}
      {displayList.length > 0 && (
        <div className="search-bar">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="搜尋單字或中文..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {/* List */}
      {displayList.length === 0 ? (
        <div className="glass-panel empty-box">
          <CheckCircle size={36} color="var(--accent-success)" style={{ margin: '0 auto 12px' }} />
          <p>
            {filterMode === 'due'
              ? '太棒了！今日沒有任何艾賓浩斯到期單字，記憶保持完美！'
              : '太棒了！目前錯題本空空如也，代表所有單字都已掌握或尚未進行測驗。'}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel empty-box">查無相符單字</div>
      ) : (
        <div className="mistakes-list">
          {filtered.map((w) => {
            const tierMeta = TIER_CONFIG[w.tier] || TIER_CONFIG.score_basic;
            const srs = spacedRepetitionService.getRecord(w.id);

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
                    {srs && (
                      <span className="srs-badge-small">
                        <Brain size={11} />
                        Lv.{srs.stage + 1}
                      </span>
                    )}
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-icon-small"
                      onClick={() =>
                        speechService.speak(
                          w.word,
                          w.phonetic,
                          settings.voiceAccent,
                          settings.speechRate
                        )
                      }
                      title="發音"
                    >
                      <Volume2 size={16} />
                    </button>
                    {filterMode === 'all' && (
                      <button
                        className="btn-icon-small"
                        onClick={() => handleRemove(w.id)}
                        title="已搞懂（移出錯題本）"
                      >
                        <CheckCircle size={16} color="var(--accent-success)" />
                      </button>
                    )}
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
          gap: 18px;
        }
        @media (max-width: 768px) {
          .mistakes-page-container {
            padding: max(12px, env(safe-area-inset-top)) 12px 100px;
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
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .page-subtitle {
          font-size: 13px;
          color: var(--text-muted);
        }
        .srs-dashboard-card {
          padding: 20px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(124, 58, 237, 0.05));
          border: 1px solid rgba(37, 99, 235, 0.25);
        }
        .srs-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .srs-title-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .srs-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .srs-due-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 9999px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #EF4444;
          font-weight: 600;
        }
        .srs-due-badge b {
          font-weight: 800;
        }
        .srs-stages-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }
        @media (max-width: 600px) {
          .srs-stages-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .stage-stat-box {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 6px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stage-stat-lv {
          font-size: 12px;
          font-weight: 800;
        }
        .stage-stat-count {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .stage-stat-day {
          font-size: 10px;
          color: var(--text-muted);
        }
        .srs-action-banner {
          display: flex;
          justify-content: flex-end;
          padding-top: 4px;
        }
        .btn-srs-quiz {
          width: 100%;
          padding: 10px 16px;
          border-radius: 9999px;
          border: none;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: white;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn-srs-quiz:hover {
          transform: translateY(-2px);
        }
        .mistake-hero-card {
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .hero-card-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .hero-card-desc {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .hero-btns {
          display: flex;
          gap: 10px;
        }
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--accent-primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background: var(--accent-secondary);
        }
        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-secondary);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          padding: 8px 14px;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          color: var(--accent-error);
          border-color: var(--accent-error);
        }
        .filter-pill-tabs {
          display: flex;
          gap: 8px;
        }
        .filter-pill-btn {
          flex: 1;
          padding: 8px 14px;
          border-radius: 9999px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-pill-btn.active {
          background: rgba(37, 99, 235, 0.15);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 14px;
        }
        .search-bar input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          width: 100%;
          outline: none;
        }
        .empty-box {
          text-align: center;
          padding: 50px 20px;
          color: var(--text-muted);
          border-radius: var(--radius-lg);
          font-size: 14px;
        }
        .mistakes-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .mistake-card {
          padding: 16px 20px;
          border-radius: var(--radius-lg);
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
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .pos-badge {
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-secondary);
          background: rgba(124, 58, 237, 0.1);
          padding: 1px 6px;
          border-radius: 4px;
          font-style: italic;
        }
        .phonetic-text {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-muted);
        }
        .tier-badge {
          font-size: 11px;
          font-weight: 800;
        }
        .srs-badge-small {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 9999px;
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.25);
          color: var(--accent-primary);
        }
        .card-actions {
          display: flex;
          gap: 6px;
        }
        .btn-icon-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon-small:hover {
          color: var(--accent-primary);
          border-color: var(--accent-primary);
        }
        .chinese-def {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .example-snippet {
          padding: 8px 12px;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          font-size: 13px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .example-en-text {
          color: var(--text-primary);
        }
        .example-zh-text {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
