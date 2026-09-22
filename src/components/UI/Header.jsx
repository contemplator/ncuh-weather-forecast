import React from 'react';
import { CloudSun, RotateCw, Star } from 'lucide-react';

export default function Header({ 
  lastUpdated, 
  onRefresh, 
  isLoading, 
  favorites = [], 
  onSelectFavorite,
  isCloudConnected = false,
  onOpenSyncModal
}) {
  return (
    <header className="header-container">
      <div className="glass-panel brand-badge">
        <div className="logo-icon">
          <CloudSun size={24} color="#2563eb" />
        </div>
        <div>
          <h1 className="brand-title">Weather & Life Map</h1>
          <p className="brand-subtitle">台灣即時生活天氣預報</p>
        </div>
      </div>

      {/* 我的最愛快捷列表 */}
      {favorites.length > 0 && (
        <div className="favorites-bar">
          {favorites.map(cityName => (
            <button
              key={cityName}
              onClick={() => onSelectFavorite(cityName)}
              className="glass-pill favorite-pill"
            >
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              <span>{cityName}</span>
            </button>
          ))}
        </div>
      )}

      {/* 操作區 */}
      <div className="header-actions">
        {/* 雲端同步狀態按鈕 */}
        <button
          onClick={onOpenSyncModal}
          className="glass-btn sync-indicator-btn"
          title={isCloudConnected ? 'Supabase 雲端資料庫已連線 (點擊管理)' : '本地模式 (點擊管理)'}
        >
          <span className={`sync-dot ${isCloudConnected ? 'connected' : ''}`} />
          <span className="sync-text">{isCloudConnected ? '雲端同步' : '本地模式'}</span>
        </button>

        {lastUpdated && (
          <span 
            className="last-update-text" 
            data-tooltip="氣象與空品快取時間（後台每小時自動排程同步）"
          >
            資料時間 {lastUpdated}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="glass-btn refresh-btn"
          title="重新整理氣象資料"
        >
          <RotateCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>更新</span>
        </button>
      </div>
    </header>
  );
}
