import React from 'react';
import { CloudSun, RotateCw, Star } from 'lucide-react';

export default function Header({ 
  lastUpdated, 
  onRefresh, 
  isLoading, 
  favorites = [], 
  onSelectFavorite 
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
        {lastUpdated && (
          <span className="last-update-text">
            更新於 {lastUpdated}
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
