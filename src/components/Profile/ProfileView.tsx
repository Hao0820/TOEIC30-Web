import React from 'react';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/StorageService';
import { updateService } from '../../services/UpdateService';
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
  Cloud,
  LogOut,
  LogIn,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const {
    user,
    userProfile,
    openAuthModal,
    signOut,
    isCloudSyncing,
    syncCloudData,
    lastSyncTime,
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
      {/* 0. 雲端會員帳號卡片 */}
      <div className="glass-panel cloud-account-card fade-in">
        {user ? (
          <div className="account-logged-in">
            <div className="account-user-info">
              <div className="user-avatar">
                <UserIcon size={22} color="white" />
              </div>
              <div className="user-details">
                <div className="user-name-row">
                  <span className="user-display-name">
                    {userProfile?.display_name || user.email?.split('@')[0]}
                  </span>
                  <span className="cloud-badge active">
                    <Cloud size={12} />
                    <span>雲端已連線</span>
                  </span>
                </div>
                <span className="user-email">{user.email}</span>
                {lastSyncTime && (
                  <span className="sync-time">
                    最後同步：{lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            <div className="account-actions">
              <button
                className="btn-sync"
                onClick={syncCloudData}
                disabled={isCloudSyncing}
                title="立即同步雲端資料"
              >
                <RefreshCw size={14} className={isCloudSyncing ? 'spinning' : ''} />
                <span>{isCloudSyncing ? '同步中...' : '立即同步'}</span>
              </button>

              <button
                className="btn-signout"
                onClick={signOut}
                title="登出帳號"
              >
                <LogOut size={14} />
                <span>登出</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="account-guest-banner">
            <div className="guest-left">
              <div className="cloud-icon-box">
                <Cloud size={24} color="var(--accent-primary)" />
              </div>
              <div>
                <h4 className="guest-title">雲端多裝置同步</h4>
                <p className="guest-subtitle">登入以跨手機、平板或電腦同步背單字、收藏與測驗進度</p>
              </div>
            </div>

            <button className="btn-signin-cta" onClick={openAuthModal}>
              <LogIn size={16} />
              <span>登入 / 註冊</span>
            </button>
          </div>
        )}
      </div>

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
            <span className="stat-number">{masteredWords.length} 字</span>
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

      {/* 3. 分數階級篩選 (複選) */}
      <div className="glass-panel section-card fade-in">
        <div className="section-title-group">
          <h4 className="card-section-title">
            <Bookmark size={18} color="var(--accent-secondary)" />
            <span>難度階級篩選 (多選)</span>
          </h4>
          <p className="section-help-text">
            勾選欲背誦的單字階級（至少需保留一項）。在 30 天衝刺模式中，系統將僅出現有勾選的單字。
          </p>
        </div>

        <div className="tiers-checkbox-list">
          {tiersList.map((t) => {
            const isChecked = enabledTiers.includes(t.id);
            const cfg = TIER_CONFIG[t.id];
            return (
              <div
                key={t.id}
                className={`tier-check-card ${isChecked ? 'checked' : ''}`}
                onClick={() => toggleTier(t.id)}
              >
                <div className="tier-card-left">
                  <span
                    className="tier-pill-badge"
                    style={{
                      backgroundColor: isChecked ? `${cfg.color}25` : 'var(--bg-secondary)',
                      color: isChecked ? cfg.color : 'var(--text-muted)',
                      borderColor: isChecked ? cfg.color : 'var(--border-color)',
                    }}
                  >
                    {cfg.badge}
                  </span>
                  <div className="tier-info">
                    <span className="tier-name-label">{t.name}</span>
                    <span className="tier-sub-desc">{t.subtitle}</span>
                  </div>
                </div>

                <div className="checkbox-icon">
                  {isChecked ? (
                    <CheckSquare size={22} color="var(--accent-primary)" />
                  ) : (
                    <Square size={22} color="var(--text-muted)" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 語音與系統偏好 */}
      <div className="glass-panel section-card fade-in">
        <div className="section-title-group">
          <h4 className="card-section-title">
            <Sliders size={18} color="var(--accent-gold)" />
            <span>語音與外觀設定</span>
          </h4>
        </div>

        <div className="setting-item-row">
          <div>
            <label className="setting-label">發音語速</label>
            <p className="setting-desc">調整單字與例句的英聽朗讀速度</p>
          </div>
          <div className="speed-pills">
            {[0.8, 1.0, 1.2].map((rate) => (
              <button
                key={rate}
                className={`pill-btn ${settings.speechRate === rate ? 'active' : ''}`}
                onClick={() => updateSettings({ speechRate: rate })}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        <div className="setting-item-row">
          <div>
            <label className="setting-label">每日目標單字數</label>
            <p className="setting-desc">設定每天預計複習與背熟的目標數量</p>
          </div>
          <div className="speed-pills">
            {[10, 20, 30, 50].map((goal) => (
              <button
                key={goal}
                className={`pill-btn ${settings.dailyGoal === goal ? 'active' : ''}`}
                onClick={() => updateSettings({ dailyGoal: goal })}
              >
                {goal} 字
              </button>
            ))}
          </div>
        </div>

        <div className="setting-item-row">
          <div>
            <label className="setting-label">外觀主題</label>
            <p className="setting-desc">切換深色（暗黑夜間）或淺色（明亮極簡）視覺風格</p>
          </div>
          <div className="speed-pills">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                className={`pill-btn ${settings.theme === t ? 'active' : ''}`}
                onClick={() => updateSettings({ theme: t })}
              >
                {t === 'dark' ? '深色夜間' : '淺色極簡'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. 系統快取維護與版本資訊 */}
      <div className="glass-panel section-card fade-in">
        <div className="section-title-group">
          <h4 className="card-section-title">
            <RotateCw size={18} color="var(--accent-primary)" />
            <span>版本與快取管理</span>
          </h4>
          <p className="section-help-text">若加入 iPhone 主畫面後未即時顯示最新改版，可點擊下方按鈕強制清除快取</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="btn-secondary"
            style={{ width: '100%', height: '46px', justifyContent: 'center' }}
            onClick={() => updateService.forceHardRefresh()}
          >
            <RotateCw size={16} />
            <span>🔄 強制清除快取並載入最新版本</span>
          </button>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            當前發布版本：v1.3.0 (支援 Supabase 雲端多用戶同步)
          </p>
        </div>
      </div>

      {/* 6. 關於與法律免責聲明 */}
      <div className="disclaimer-card">
        <ShieldAlert size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p><b>TOEIC® 商標法律宣告</b></p>
          <p>
            TOEIC® 是美國教育測驗服務社（ETS）在美國和其他國家的註冊商標。本 Web 應用程式純屬個人學習與研究輔助用途，非經
            ETS 授權、認可或贊助。
          </p>
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
        @media (max-width: 768px) {
          .profile-page-container {
            padding: max(8px, env(safe-area-inset-top)) 12px 100px;
            gap: 14px;
          }
        }

        /* 雲端會員卡片 */
        .cloud-account-card {
          padding: 18px 22px;
        }
        .account-logged-in {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }
        .account-user-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
          flex-shrink: 0;
        }
        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .user-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .user-display-name {
          font-weight: 800;
          font-size: 16px;
          color: var(--text-primary);
        }
        .cloud-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: var(--accent-success);
        }
        .user-email {
          font-size: 12px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .sync-time {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .account-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-sync {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-sync:hover:not(:disabled) {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        .btn-signout {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: var(--radius-md);
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--accent-error);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-signout:hover {
          background: rgba(239, 68, 68, 0.16);
        }
        .spinning {
          animation: spin 1s linear infinite;
        }

        /* 訪客登入推廣 Banner */
        .account-guest-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .guest-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .cloud-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.12);
          border: 1px solid rgba(37, 99, 235, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .guest-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .guest-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .btn-signin-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-signin-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
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
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-help-text {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .study-modes-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .mode-select-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }
        .mode-select-card:hover {
          border-color: var(--border-glow);
          background: var(--bg-card-hover);
        }
        .mode-select-card.selected {
          border-color: var(--accent-primary);
          background: rgba(37, 99, 235, 0.06);
        }
        .mode-card-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .mode-icon-box {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .mode-icon-box.selected {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }
        .mode-item-title {
          font-size: 15px;
          font-weight: 700;
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
        .tiers-checkbox-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tier-check-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tier-check-card:hover {
          border-color: var(--border-glow);
          background: var(--bg-card-hover);
        }
        .tier-check-card.checked {
          border-color: var(--accent-primary);
          background: rgba(37, 99, 235, 0.06);
        }
        .tier-card-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .tier-pill-badge {
          font-size: 12px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
          border: 1px solid transparent;
        }
        .tier-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .tier-name-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .tier-sub-desc {
          font-size: 12px;
          color: var(--text-muted);
        }
        .setting-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
        }
        .setting-item-row:last-child {
          border-bottom: none;
        }
        .setting-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .setting-desc {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .speed-pills {
          display: flex;
          gap: 6px;
        }
        .pill-btn {
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pill-btn.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }
        .disclaimer-card {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          border-radius: var(--radius-md);
          background: rgba(148, 163, 184, 0.08);
          border: 1px solid var(--border-color);
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};
