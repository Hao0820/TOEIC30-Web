import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Sun, Moon, Search, User as UserIcon, LogIn } from 'lucide-react';

export const Navbar: React.FC<{ onOpenSearch: () => void }> = ({ onOpenSearch }) => {
  const { settings, updateSettings, user, openAuthModal, setActiveTab } = useApp();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Logo Brand */}
        <div className="logo-brand">
          <div className="logo-icon-box">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="logo-title">TOEIC 30</h1>
            <p className="logo-subtitle">金色證書單字衝刺</p>
          </div>
        </div>

        {/* Right actions */}
        <div className="nav-actions">
          <button className="btn-icon" onClick={onOpenSearch} title="搜尋單字庫 (⌘K)">
            <Search size={18} />
          </button>
          <button className="btn-icon" onClick={toggleTheme} title="切換深淺外觀">
            {settings.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <button
              className="btn-icon user-nav-btn"
              onClick={() => setActiveTab('profile')}
              title={`已登入: ${user.email}`}
            >
              <UserIcon size={18} color="var(--accent-primary)" />
            </button>
          ) : (
            <button
              className="btn-signin-nav"
              onClick={openAuthModal}
              title="登入同步雲端進度"
            >
              <LogIn size={14} />
              <span>登入</span>
            </button>
          )}
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
          padding: 14px 24px;
        }
        .navbar-content {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
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
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-signin-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          border: none;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }
        .btn-signin-nav:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }
        .user-nav-btn {
          border-color: rgba(37, 99, 235, 0.4);
          background: rgba(37, 99, 235, 0.08);
        }

        /* 📱 手機端自動隱藏頂部桌面 Bar，釋放最大螢幕垂直空間 */
        @media (max-width: 768px) {
          .navbar-container {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
