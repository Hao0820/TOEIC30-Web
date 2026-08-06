import React, { useState } from 'react';
import { supabaseService } from '../../services/SupabaseService';
import { X, Mail, Lock, User as UserIcon, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('密碼長度至少需要 6 個字元');
        }
        await supabaseService.signUp(email, password, displayName);
        setSuccessMessage('註冊成功！已自動為您登入並建立個人雲端資料庫。');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        await supabaseService.signIn(email, password);
        setSuccessMessage('登入成功！正在同步雲端進度...');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || '操作失敗，請檢查輸入資料';
      if (msg.includes('Invalid login credentials')) {
        msg = '帳號或密碼錯誤，請重新確認';
      } else if (msg.includes('User already registered')) {
        msg = '此 Email 已經註冊過，請直接切換至登入';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="auth-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Header Title */}
        <div className="auth-header">
          <div className="auth-icon-badge">
            <Sparkles size={24} color="var(--accent-primary)" />
          </div>
          <h2 className="auth-title">
            {mode === 'signin' ? '登入 TOEIC 30' : '註冊新帳號'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'signin'
              ? '登入以跨裝置無縫同步您的背單字與測驗進度'
              : '免費建立帳號，專屬雲端保存您的學習歷程與錯題本'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
          >
            <LogIn size={16} />
            <span>帳號登入</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
          >
            <UserPlus size={16} />
            <span>註冊帳號</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert success">
            <Sparkles size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="input-group">
              <label>暱稱 / 姓名</label>
              <div className="input-box">
                <UserIcon size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="例如：Alex / 考生小明"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>電子信箱 (Email)</label>
            <div className="input-box">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label>密碼 (Password)</label>
            <div className="input-box">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                required
                placeholder="至少 6 個字元"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <span className="btn-spinner"></span>
            ) : mode === 'signin' ? (
              '立即登入'
            ) : (
              '確認註冊並登入'
            )}
          </button>
        </form>

        {/* Guest fallback button */}
        <div className="auth-footer">
          <button type="button" className="btn-guest" onClick={onClose}>
            暫不登入，以訪客身分繼續使用
          </button>
        </div>
      </div>

      <style>{`
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
          animation: fadeIn 0.2s ease-out;
        }
        .auth-modal-card {
          width: 100%;
          max-width: 440px;
          padding: 32px 28px;
          border-radius: var(--radius-xl);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .auth-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 50%;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-close-btn:hover {
          color: var(--text-primary);
          background: var(--bg-card-hover);
        }
        .auth-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }
        .auth-icon-badge {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.12);
          border: 1px solid rgba(37, 99, 235, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
        }
        .auth-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .auth-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
          max-width: 320px;
        }
        .auth-tabs {
          display: flex;
          background: var(--bg-secondary);
          padding: 4px;
          border-radius: var(--radius-md);
          gap: 4px;
        }
        .auth-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-tab-btn.active {
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }
        .auth-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
        }
        .auth-alert.error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: var(--accent-error);
        }
        .auth-alert.success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: var(--accent-success);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-group label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .input-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          transition: all 0.2s;
        }
        .input-box:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        .input-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .input-box input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
        }
        .auth-submit-btn {
          margin-top: 6px;
          height: 48px;
          border-radius: var(--radius-md);
          border: none;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          transition: all 0.2s;
        }
        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
        }
        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .auth-footer {
          display: flex;
          justify-content: center;
          padding-top: 4px;
        }
        .btn-guest {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 4px;
          transition: color 0.2s;
        }
        .btn-guest:hover {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};
