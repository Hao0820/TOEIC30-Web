import React from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, HelpCircle, Star, BookX, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TabItem {
  id: 'vocabulary' | 'quiz' | 'favorites' | 'mistakes' | 'profile';
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab, favorites } = useApp();

  const tabs: TabItem[] = [
    { id: 'vocabulary', label: '單字學習', icon: BookOpen },
    { id: 'quiz', label: '測驗系統', icon: HelpCircle },
    { id: 'favorites', label: '我的收藏', icon: Star, badge: favorites.length > 0 ? favorites.length : undefined },
    { id: 'mistakes', label: '錯題本', icon: BookX },
    { id: 'profile', label: '設定數據', icon: User },
  ];

  return (
    <nav className="tabbar-wrapper">
      <div className="tabbar-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`tab-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="icon-wrapper">
                <Icon size={20} />
                {tab.badge !== undefined && (
                  <span className="tab-badge">{tab.badge}</span>
                )}
              </div>
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .tabbar-wrapper {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 50;
          width: calc(100% - 32px);
          max-width: 520px;
        }
        .tabbar-container {
          background: var(--bg-card);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          border-radius: 9999px;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          justify-content: space-around;
        }
        .tab-item-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 14px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          border-radius: 9999px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tab-item-btn:hover {
          color: var(--text-primary);
        }
        .tab-item-btn.active {
          color: var(--accent-primary);
          background: var(--bg-secondary);
        }
        .icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tab-badge {
          position: absolute;
          top: -6px;
          right: -10px;
          background: var(--accent-gold);
          color: #713f12;
          font-size: 10px;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 9999px;
          line-height: 1.2;
        }
      `}</style>
    </nav>
  );
};
