import React from 'react';
import { useApp } from '../../context/AppContext';
import type { VoiceAccent, StudyMode, WordTier } from '../../types';
import { speechService } from '../../services/SpeechService';
import { storageService } from '../../services/StorageService';
import { TIER_CONFIG } from '../../services/DataLoader';
import {
  Flame,
  BookCheck,
  Award,
  Volume2,
  Sun,
  Moon,
  ShieldAlert,
  BookOpen,
  Bookmark,
  Shuffle,
  CheckCircle2,
  CheckSquare,
  Square,
  Star,
  BookX,
  Target,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    studyMode,
    setStudyMode,
    enabledTiers,
    toggleTier,
    settings,
    updateSettings,
    favorites,
    setActiveTab,
  } = useApp();

  const stats = storageService.getUserStats();
  const quizRecords = storageService.getQuizRecords();
  const mistakeWords = storageService.getMistakeWords();

  const totalQuiz = quizRecords.length;
  const avgAccuracy = totalQuiz > 0
    ? Math.round(quizRecords.reduce((acc, r) => acc + r.scorePercentage, 0) / totalQuiz)
    : 0;

  const handleTestVoice = () => {
    speechService.speak(
      'Welcome to TOEIC 30. Let\'s master all essential business vocabulary together!',
      undefined,
      settings.voiceAccent,
      settings.speechRate
    );
  };

  const studyModes: { id: StudyMode; title: string; subtitle: string; icon: any }[] = [
    {
      id: 'byDay',
      title: '30天主題分類',
      subtitle: '依商務情境 30 天每日循序漸進精讀（雇用、會議、契約等）',
      icon: BookOpen,
    },
    {
      id: 'byLevel',
      title: '目標分數等級',
      subtitle: '依多益 4 大目標分數級距衝刺（基礎、600、800、900 分）',
      icon: Bookmark,
    },
    {
      id: 'random',
      title: '全真隨機題庫',
      subtitle: '全書 6,800+ 題庫隨機抽取背誦，突破記憶定勢',
      icon: Shuffle,
    },
  ];

  const tiersList: { id: WordTier; name: string; subtitle: string; color: string }[] = [
    { id: 'score_basic', name: '核心基礎', subtitle: '目標 500-600 分基礎必考單字', color: 'var(--tier-basic)' },
    { id: 'score_600', name: '600分必備', subtitle: '綠色證書核心實用商業單字', color: 'var(--tier-600)' },
    { id: 'score_800', name: '800分進階', subtitle: '藍色證書高頻進階商務單字', color: 'var(--tier-800)' },
    { id: 'score_900', name: '900分滿分', subtitle: '金色證書滿分衝刺高難度單字', color: 'var(--tier-900)' },
  ];

  return (
    <div className="profile-page-container">
      {/* 1. User Stats Card */}
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
            <span className="stat-number">{stats.totalLearned || 0} 字</span>
            <span className="stat-desc">累計背誦</span>
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
          <p className="section-help-text">此設定將同步影響「單字」與「測驗」頁面的題目內容與分類</p>
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

      {/* 3. 啟用單字難度階級 (可複選 Multi-Select) */}
      <div className="glass-panel section-card fade-in">
        <div className="section-title-group">
          <h4 className="card-section-title">
            <Bookmark size={18} color="var(--accent-secondary)" />
            <span>啟用單字難度階級 (可複選)</span>
          </h4>
          <p className="section-help-text">系統將自動為您篩選勾選階級的單字，至少需啟用一個階級</p>
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

      {/* 4. 重點複習專區 (收藏庫 & 錯題本) */}
      <div className="glass-panel section-card">
        <h4 className="card-section-title">
          <Star size={18} color="var(--accent-gold)" />
          <span>重點複習專區</span>
        </h4>

        <div className="quick-access-grid">
          <div className="quick-access-item" onClick={() => setActiveTab('favorites')}>
            <div className="qa-left">
              <Star size={18} fill="#F59E0B" color="#F59E0B" />
              <span className="qa-title">⭐ 收藏單字庫</span>
            </div>
            <span className="qa-badge">{favorites.length} 字</span>
          </div>

          <div className="quick-access-item" onClick={() => setActiveTab('mistakes')}>
            <div className="qa-left">
              <BookX size={18} color="var(--accent-error)" />
              <span className="qa-title">📚 總錯題專項本</span>
            </div>
            <span className="qa-badge error">{mistakeWords.length} 題</span>
          </div>
        </div>
      </div>

      {/* 5. 語音朗讀設定 (Apple Neural TTS) */}
      <div className="glass-panel section-card">
        <h4 className="card-section-title">
          <Volume2 size={18} color="var(--accent-primary)" />
          <span>發音口音與語速設定 (TTS)</span>
        </h4>

        {/* Accent */}
        <div className="setting-row">
          <div>
            <label className="setting-label">多益真人發音口音</label>
            <p className="setting-sublabel">支援美、英、澳、加等多國多益實戰口音</p>
          </div>
          <select
            className="select-input"
            value={settings.voiceAccent}
            onChange={e => updateSettings({ voiceAccent: e.target.value as VoiceAccent })}
          >
            <option value="us">🇺🇸 美式英語 (US)</option>
            <option value="uk">🇬🇧 英式英語 (UK)</option>
            <option value="au">🇦🇺 澳式英語 (AU)</option>
            <option value="ca">🇨🇦 加拿大英語 (CA)</option>
            <option value="random">🎲 隨機多國口音切換</option>
          </select>
        </div>

        {/* Speed */}
        <div className="setting-row">
          <div>
            <label className="setting-label">發音語速 ({settings.speechRate.toFixed(1)}x)</label>
            <p className="setting-sublabel">調節單字與商務例句朗讀節奏</p>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.1"
            className="slider-input"
            value={settings.speechRate}
            onChange={e => updateSettings({ speechRate: parseFloat(e.target.value) })}
          />
        </div>

        <button className="btn-secondary test-voice-btn" onClick={handleTestVoice}>
          <Volume2 size={16} />
          <span>試聽當前語音發音效果</span>
        </button>
      </div>

      {/* 6. 外觀與目標設定 */}
      <div className="glass-panel section-card">
        <h4 className="card-section-title">
          <Sun size={18} color="var(--accent-gold)" />
          <span>介面外觀與每日目標</span>
        </h4>

        <div className="setting-row">
          <div>
            <label className="setting-label">外觀主題風格</label>
            <p className="setting-sublabel">切換深色模式 (OLED Dark) 或淺色模式</p>
          </div>
          <div className="theme-toggle-group">
            <button
              className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
              onClick={() => updateSettings({ theme: 'dark' })}
            >
              <Moon size={14} />
              <span>深色</span>
            </button>
            <button
              className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
              onClick={() => updateSettings({ theme: 'light' })}
            >
              <Sun size={14} />
              <span>淺色</span>
            </button>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <label className="setting-label">每日目標單字量 ({settings.dailyGoal} 字)</label>
            <p className="setting-sublabel">設定您每日希望完成背誦的單字數</p>
          </div>
          <input
            type="range"
            min="10"
            max="80"
            step="5"
            className="slider-input"
            value={settings.dailyGoal}
            onChange={e => updateSettings({ dailyGoal: parseInt(e.target.value, 10) })}
          />
        </div>
      </div>

      {/* 7. 關於與法律免責聲明 */}
      <div className="disclaimer-card">
        <ShieldAlert size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p><b>TOEIC® 商標法律宣告</b></p>
          <p>
            TOEIC® is a registered trademark of Educational Testing Service (ETS). This web application is an independently developed study tool and is not endorsed, sponsored, or affiliated with ETS.
          </p>
          <p style={{ marginTop: 4 }}>資料庫版本：v1.0.0 (收錄 6,800+ 筆單字) · 版權所有 © Wesley Li</p>
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
        .quick-access-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .quick-access-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s;
        }
        .quick-access-item:hover {
          background: var(--bg-card);
          border-color: var(--border-glow);
        }
        .qa-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .qa-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .qa-badge {
          font-size: 12px;
          font-weight: 800;
          color: var(--text-muted);
          background: var(--bg-card);
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .qa-badge.error {
          color: var(--accent-error);
        }
        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .setting-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .setting-sublabel {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .select-input {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          outline: none;
        }
        .slider-input {
          width: 140px;
          accent-color: var(--accent-primary);
        }
        .test-voice-btn {
          width: 100%;
          height: 42px;
          font-size: 13px;
        }
        .theme-toggle-group {
          display: flex;
          background: var(--bg-secondary);
          padding: 3px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          gap: 4px;
        }
        .theme-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .theme-btn.active {
          background: var(--bg-card);
          color: var(--accent-primary);
          box-shadow: var(--shadow-sm);
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
