import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TIER_CONFIG } from '../../services/DataLoader';
import type { WordTier } from '../../types';
import { Shuffle } from 'lucide-react';

export const DynamicPickerHeader: React.FC = () => {
  const { studyMode, currentDay, setCurrentDay, currentTier, setCurrentTier, enabledTiers } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll active day button into view
  useEffect(() => {
    if (studyMode === 'byDay' && scrollRef.current) {
      const activeBtn = scrollRef.current.querySelector('.day-chip.active') as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentDay, studyMode]);

  return (
    <div className="dynamic-picker-wrapper">
      {studyMode === 'byDay' && (
        <div className="day-scroll-container" ref={scrollRef}>
          {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
            const isSelected = currentDay === day;
            return (
              <button
                key={day}
                className={`day-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setCurrentDay(day)}
              >
                Day {String(day).padStart(2, '0')}
              </button>
            );
          })}
        </div>
      )}

      {studyMode === 'byLevel' && (
        <div className="level-pills-row">
          {(['score_basic', 'score_600', 'score_800', 'score_900'] as WordTier[]).map((tier) => {
            const isEnabled = enabledTiers.includes(tier);
            const isSelected = currentTier === tier;
            const meta = TIER_CONFIG[tier];

            return (
              <button
                key={tier}
                disabled={!isEnabled}
                className={`level-pill ${isSelected ? 'active' : ''} ${!isEnabled ? 'disabled' : ''}`}
                onClick={() => isEnabled && setCurrentTier(tier)}
                style={{
                  borderColor: isSelected ? meta.color : isEnabled ? 'var(--border-color)' : 'transparent',
                  color: isSelected ? meta.color : isEnabled ? 'var(--text-secondary)' : 'var(--text-muted)',
                }}
              >
                <span className="dot" style={{ background: meta.color }} />
                <span>{meta.badge}</span>
              </button>
            );
          })}
        </div>
      )}

      {studyMode === 'random' && (
        <div className="random-mode-banner">
          <Shuffle size={16} color="var(--accent-primary)" />
          <span className="random-banner-text">全真隨機 6,800+ 題庫模式（已套用設定階級篩選）</span>
        </div>
      )}

      <style>{`
        .dynamic-picker-wrapper {
          width: 100%;
          padding: 8px 0;
        }
        .day-scroll-container {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .day-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .day-chip {
          flex-shrink: 0;
          padding: 7px 14px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
          font-family: var(--font-mono);
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .day-chip:hover {
          color: var(--text-primary);
          border-color: var(--accent-primary);
        }
        .day-chip.active {
          background: var(--accent-primary);
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
        }
        .level-pills-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 4px 16px;
        }
        .level-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 9999px;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .level-pill .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .level-pill.active {
          background: var(--bg-card);
          box-shadow: var(--shadow-sm);
        }
        .level-pill.disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .random-mode-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          margin: 0 16px;
          border: 1px dashed var(--border-color);
        }
        .random-banner-text {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};
