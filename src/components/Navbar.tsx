import React from 'react';
import { useApp } from '../context/AppContext';
import type { WordTier } from '../types';
import { DAY_TITLES, TIER_CONFIG } from '../services/DataLoader';
import { BookOpen, Award, Shuffle, Sun, Moon, Search, Sparkles } from 'lucide-react';

export const Navbar: React.FC<{ onOpenSearch: () => void }> = ({ onOpenSearch }) => {
  const {
    studyMode,
    setStudyMode,
    currentDay,
    setCurrentDay,
    currentTier,
    setCurrentTier,
    settings,
    updateSettings,
  } = useApp();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Logo */}
        <div className="logo-brand">
          <div className="logo-icon-box">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="logo-title">TOEIC 30</h1>
            <p className="logo-subtitle">金色證書單字衝刺</p>
          </div>
        </div>

        {/* Center: Mode Selector & Unit Switcher */}
        <div className="center-controls">
          <div className="mode-toggle-group">
            <button
              className={`mode-btn ${studyMode === 'byDay' ? 'active' : ''}`}
              onClick={() => setStudyMode('byDay')}
            >
              <BookOpen size={16} />
              <span>30天主題</span>
            </button>
            <button
              className={`mode-btn ${studyMode === 'byLevel' ? 'active' : ''}`}
              onClick={() => setStudyMode('byLevel')}
            >
              <Award size={16} />
              <span>分數等級</span>
            </button>
            <button
              className={`mode-btn ${studyMode === 'random' ? 'active' : ''}`}
              onClick={() => setStudyMode('random')}
            >
              <Shuffle size={16} />
              <span>全書隨機</span>
            </button>
          </div>

          {/* Unit Selector */}
          {studyMode === 'byDay' && (
            <select
              className="unit-select"
              value={currentDay}
              onChange={(e) => setCurrentDay(Number(e.target.value))}
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Day {String(d).padStart(2, '0')} · {DAY_TITLES[d] || ''}
                </option>
              ))}
            </select>
          )}

          {studyMode === 'byLevel' && (
            <div className="tier-select-pills">
              {(['score_basic', 'score_600', 'score_800', 'score_900'] as WordTier[]).map((t) => (
                <button
                  key={t}
                  className={`tier-pill-btn ${currentTier === t ? 'active' : ''}`}
                  onClick={() => setCurrentTier(t)}
                  style={{
                    borderColor: currentTier === t ? TIER_CONFIG[t].color : 'transparent',
                    color: currentTier === t ? TIER_CONFIG[t].color : 'var(--text-secondary)',
                  }}
                >
                  {TIER_CONFIG[t].badge}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="nav-actions">
          <button className="btn-icon" onClick={onOpenSearch} title="搜尋單字庫 (⌘K)">
            <Search size={18} />
          </button>
          <button className="btn-icon" onClick={toggleTheme} title="切換深淺外觀">
            {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      <style>{`
        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          padding: 12px 24px;
        }
        .navbar-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .logo-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        }
        .logo-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.1;
          color: var(--text-primary);
        }
        .logo-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
        }
        .center-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mode-toggle-group {
          display: flex;
          background: var(--bg-secondary);
          padding: 4px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          gap: 4px;
        }
        .mode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .mode-btn:hover {
          color: var(--text-primary);
        }
        .mode-btn.active {
          background: var(--bg-card);
          color: var(--accent-primary);
          box-shadow: var(--shadow-sm);
        }
        .unit-select {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
        }
        .tier-select-pills {
          display: flex;
          gap: 6px;
        }
        .tier-pill-btn {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          background: var(--bg-secondary);
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tier-pill-btn.active {
          background: var(--bg-card);
          box-shadow: var(--shadow-sm);
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        @media (max-width: 768px) {
          .navbar-content {
            flex-wrap: wrap;
          }
          .center-controls {
            order: 3;
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </header>
  );
};
