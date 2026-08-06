import React from 'react';
import { useApp } from '../../context/AppContext';
import type { VoiceAccent } from '../../types';
import { speechService } from '../../services/SpeechService';
import { storageService } from '../../services/StorageService';
import { Flame, BookCheck, Award, Volume2, Sun, Moon, ShieldAlert } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const stats = storageService.getUserStats();
  const quizRecords = storageService.getQuizRecords();

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

  return (
    <div className="profile-page-container">
      {/* User Stats Card */}
      <div className="glass-panel stats-card fade-in">
        <div className="stats-header">
          <div className="avatar-circle">
            <Award size={28} color="white" />
          </div>
          <div>
            <h3 className="user-title">TOEIC 30 學習概況</h3>
            <p className="user-subtitle">每日堅持，邁向金色證書</p>
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

      {/* Voice Settings */}
      <div className="glass-panel section-card">
        <h4 className="card-section-title">
          <Volume2 size={18} color="var(--accent-primary)" />
          <span>語音朗讀設定 (Apple Neural TTS)</span>
        </h4>

        {/* Accent */}
        <div className="setting-row">
          <div>
            <label className="setting-label">發音口音</label>
            <p className="setting-sublabel">支援美式、英式、澳式等多國多益實戰口音</p>
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
            <p className="setting-sublabel">調節單字與例句發音快慢</p>
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
          <span>試聽當前語音效果</span>
        </button>
      </div>

      {/* Theme & Preferences */}
      <div className="glass-panel section-card">
        <h4 className="card-section-title">
          <Sun size={18} color="var(--accent-gold)" />
          <span>外觀與目標設定</span>
        </h4>

        <div className="setting-row">
          <div>
            <label className="setting-label">外觀主題</label>
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
            <p className="setting-sublabel">設定您每日希望完成的單字數量</p>
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

      {/* Disclaimer */}
      <div className="disclaimer-card">
        <ShieldAlert size={16} color="var(--text-muted)" />
        <p>
          TOEIC® is a registered trademark of Educational Testing Service (ETS). This web application is an independent study tool and is not endorsed or affiliated with ETS.
        </p>
      </div>

      <style>{`
        .profile-page-container {
          max-width: 680px;
          margin: 0 auto;
          padding: 24px 16px 120px;
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
          gap: 20px;
        }
        .card-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
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
          padding: 16px;
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};
