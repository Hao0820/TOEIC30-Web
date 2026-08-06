import React from 'react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/StorageService';
import { TIER_CONFIG } from '../../services/DataLoader';
import type { StudyMode, WordTier } from '../../types';
import {
  Flame,
  BookCheck,
  Award,
  ShieldAlert,
  Sliders,
  Target,
  Bookmark,
  Calendar,
  Layers,
  Shuffle,
  CheckCircle2,
  CheckSquare,
  Square,
  RotateCw,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    studyMode,
    setStudyMode,
    enabledTiers,
    toggleTier,
    settings,
    updateSettings,
  } = useApp();

  const stats = storageService.getUserStats();
  const quizRecords = storageService.getQuizRecords();
  const masteredWords = storageService.getMasteredWords();

  const totalQuiz = quizRecords.length;
  const avgAccuracy = totalQuiz > 0
    ? Math.round(quizRecords.reduce((acc, r) => acc + r.scorePercentage, 0) / totalQuiz)
    : 0;

  const studyModes: { id: StudyMode; title: string; subtitle: string; icon: React.FC<{ size: number }> }[] = [
    {
      id: 'byDay',
      title: '30 天系統衝刺計劃',
      subtitle: '每日精選高頻主題單字 (Day 01 ~ 30)',
      icon: Calendar,
    },
    {
      id: 'byLevel',
      title: '依分數目標專項突破',
      subtitle: '直接攻克基礎、600分、800分或900分滿分單字',
      icon: Layers,
    },
    {
      id: 'random',
      title: '全真題庫隨機背誦',
      subtitle: '全題庫隨機抽取，模擬實戰廣泛單字記憶',
      icon: Shuffle,
    },
  ];

  const tiersList: { id: WordTier; name: string; subtitle: string }[] = [
    { id: 'score_basic', name: '基礎核心字彙', subtitle: '文法與核心必備單字' },
    { id: 'score_600', name: '600 分必備字彙', subtitle: '中級職場商務通訊' },
    { id: 'score_800', name: '800 分進階字彙', subtitle: '專業談判與商業分析' },
    { id: 'score_900', name: '900 分金色證書', subtitle: '高端商務與金融高頻字' },
  ];

  return (
    <div className="profile-page-container">
      {/* 1. 學習數據中心 */}
      <div className="glass-panel stats-card fade-in">
        <div className="stats-header">
          <div className="avatar-circle">
            <Award size={28} color="white" />
          </div>
          <div>
            <h3 className="user-title">TOEIC 30 學習數據中心</h3>
            <p className="user-subtitle">每日堅持，邁向金色證書 990 滿分</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <Flame size={20} color="var(--accent-gold)" />
            <span className="stat-number">{stats.streak || 1} 天</span>
            <span className="stat-desc">連續學習</span>
          </div>

          <div className="stat-box">
            <BookCheck size={20} color="var(--accent-primary)" />
            <span className="stat-number">{masteredWords.length || stats.totalLearned || 0} 字</span>
            <span className="stat-desc">累計背熟</span>
          </div>

          <div className="stat-box">
            <Award size={20} color="var(--accent-success)" />
            <span className="stat-number">{avgAccuracy}%</span>
            <span className="stat-desc">測驗均準率</span>
          </div>
        </div>
      </div>

      {/* 2. 學習背法模式 (單選 3 選 1) */}
      <div className="glass-panel section-card fade-in">
        <div className="section-title-group">
          <h4 className="card-section-title">
            <Target size={18} color="var(--accent-primary)" />
            <span>學習背法模式 (單選)</span>
          </h4>
          <p className="section-help-text">此設定將同步影響「單字」與「測驗」頁面的題目內容與切換方式</p>
        </div>

        <div className="study-modes-list">
          {studyModes.map((mode) => {
            const isSelected = studyMode === mode.id;
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className={`mode-select-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setStudyMode(mode.id)}
              >
                <div className="mode-card-left">
                  <div className={`mode-icon-box ${isSelected ? 'selected' : ''}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h5 className="mode-item-title">{mode.title}</h5>
                    <p className="mode-item-sub">{mode.subtitle}</p>
                  </div>
                </div>

                <div className="radio-circle">
                  {isSelected ? (
                    <CheckCircle2 size={22} color="var(--accent-primary)" />
                  ) : (
                    <div className="radio-uncheck" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 啟用單字難度階級 (僅在選擇「30 天系統衝刺計劃」時顯示) */}
      {studyMode === 'byDay' && (
        <div className="glass-panel section-card fade-in">
          <div className="section-title-group">
            <h4 className="card-section-title">
              <Bookmark size={18} color="var(--accent-secondary)" />
              <span>30 天計劃單字難度階級 (可複選)</span>
            </h4>
            <p className="section-help-text">系統將為您的 30 天每日進度自動篩選勾選階級的單字，至少需啟用一個階級</p>
          </div>

          <div className="tier-checkboxes-list">
            {tiersList.map((tier) => {
              const isChecked = enabledTiers.includes(tier.id);
              const meta = TIER_CONFIG[tier.id];
              return (
                <div
                  key={tier.id}
                  className={`tier-checkbox-row ${isChecked ? 'checked' : ''}`}
                  onClick={() => toggleTier(tier.id)}
                >
                  <div className="tier-row-left">
                    <span
                      className="tier-badge-pill"
                      style={{
                        background: `var(--tier-${tier.id.replace('score_', '')}-bg)`,
                        color: meta.color,
                        borderColor: meta.color,
                      }}
                    >
                      {meta.badge}
                    </span>
                    <div>
                      <span className="tier-row-name">{tier.name}</span>
                      <p className="tier-row-sub">{tier.subtitle}</p>
                    </div>
                  </div>

                  <div className="checkbox-icon-box">
                    {isChecked ? (
                      <CheckSquare size={22} color={meta.color} />
                    ) : (
                      <Square size={22} color="var(--text-muted)" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. 每日學習目標 */}
      <div className="glass-panel section-card fade-in">
        <div className="section-title-group">
          <h4 className="card-section-title">
            <Sliders size={18} color="var(--accent-gold)" />
            <span>每日目標單字量 ({settings.dailyGoal} 字)</span>
          </h4>
          <p className="section-help-text">設定您每日希望完成背誦的單字數量</p>
        </div>

        <div className="goal-slider-box">
          <input
            type="range"
            min="10"
            max="80"
            step="5"
            className="slider-input"
            value={settings.dailyGoal}
            onChange={e => updateSettings({ dailyGoal: parseInt(e.target.value, 10) })}
          />
          <div className="goal-labels">
            <span>10 字/天</span>
            <span>40 字/天</span>
            <span>80 字/天</span>
          </div>
        </div>
      </div>

      {/* 5. 版本更新與強制重整 (專為 iOS 加入主畫面 PWA 設計) */}
      <div className="glass-panel section-card fade-in">
        <div className="section-title-group">
          <h4 className="card-section-title">
            <RotateCw size={18} color="var(--accent-primary)" />
            <span>應用程式版本與更新</span>
          </h4>
          <p className="section-help-text">若加入 iPhone 主畫面後未即時顯示最新改版，可點擊下方按鈕強制清除快取</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="btn-secondary"
            style={{ width: '100%', height: '46px', justifyContent: 'center' }}
            onClick={() => {
              if ('caches' in window) {
                caches.keys().then((names) => {
                  names.forEach((name) => caches.delete(name));
                });
              }
              window.location.href = window.location.origin + window.location.pathname + '?t=' + Date.now();
            }}
          >
            <RotateCw size={16} />
            <span>🔄 強制清除快取並載入最新版本</span>
          </button>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            當前發布版本：v1.2.1 (2026.08.06 最新更新)
          </p>
        </div>
      </div>

      {/* 6. 關於與法律免責聲明 */}
      <div className="disclaimer-card">
        <ShieldAlert size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p><b>TOEIC® 商標法律宣告</b></p>
          <p>
            TOEIC® is a registered trademark of Educational Testing Service (ETS). This web application is an independently developed study tool and is not endorsed, sponsored, or affiliated with ETS.
          </p>
          <p style={{ marginTop: 4 }}>資料庫版本：v1.2.1 (收錄 6,800+ 筆單字) · 版權所有 © Wesley Li</p>
        </div>
      </div>

      <style>{`
        .profile-page-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 16px 16px 120px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .stats-card {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .stats-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .avatar-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
        }
        .user-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .user-subtitle {
          font-size: 13px;
          color: var(--text-muted);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .stat-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
        }
        .stat-number {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .stat-desc {
          font-size: 11px;
          color: var(--text-muted);
        }
        .section-card {
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .section-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .card-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .section-help-text {
          font-size: 12px;
          color: var(--text-muted);
        }
        .study-modes-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .mode-select-card {
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mode-select-card:hover {
          border-color: var(--accent-primary);
          background: var(--bg-card);
        }
        .mode-select-card.selected {
          border-color: var(--accent-primary);
          background: var(--bg-card);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }
        .mode-card-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .mode-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .mode-icon-box.selected {
          background: var(--accent-primary);
          color: white;
          border-color: transparent;
        }
        .mode-item-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .mode-item-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .radio-circle {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radio-uncheck {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
        }
        .tier-checkboxes-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tier-checkbox-row {
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tier-checkbox-row:hover {
          border-color: var(--accent-primary);
          background: var(--bg-card);
        }
        .tier-checkbox-row.checked {
          background: var(--bg-card);
          border-color: var(--border-glow);
        }
        .tier-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tier-badge-pill {
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
          flex-shrink: 0;
        }
        .tier-row-name {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .tier-row-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 1px;
        }
        .goal-slider-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .slider-input {
          width: 100%;
          accent-color: var(--accent-primary);
          cursor: pointer;
        }
        .goal-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
        }
        .disclaimer-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 16px 20px;
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.5;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
      `}</style>
    </div>
  );
};
