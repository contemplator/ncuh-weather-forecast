import React from 'react';
import { X, Star, Umbrella, Thermometer, Wind, Compass, Sparkles } from 'lucide-react';
import { getWeatherEmoji } from '../../services/cwaApi';

export default function WeatherDrawer({ 
  location, 
  onClose, 
  isFavorite, 
  onToggleFavorite 
}) {
  if (!location) return null;

  const weather = location.weatherInfo;
  const emoji = getWeatherEmoji(weather?.weather);

  // 根據降雨機率與氣溫給予生活情境建議
  const popNumber = parseInt(weather?.pop || '0', 10);
  const minTemp = parseInt(weather?.minT || '20', 10);

  const getLifeAdvice = () => {
    const tips = [];
    if (popNumber >= 30) {
      tips.push('🌧️ 出門記得攜帶雨具，慎防局部降雨');
    } else {
      tips.push('☀️ 降雨機率低，適合戶外活動或曬衣服');
    }

    if (minTemp <= 18) {
      tips.push('🧥 早晚溫差偏涼，建議洋蔥式穿搭');
    } else if (minTemp >= 28) {
      tips.push('🥤 天氣炎熱，外出請注意防曬並多補充水分');
    } else {
      tips.push('✨ 體感舒適宜人');
    }

    return tips;
  };

  return (
    <div className="drawer-overlay">
      <div className="glass-panel weather-drawer-card">
        {/* 卡片標題區 */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <h2 className="drawer-city-name">{location.name}</h2>
            <button
              onClick={() => onToggleFavorite(location.name)}
              className={`favorite-toggle-btn ${isFavorite ? 'active' : ''}`}
              title={isFavorite ? '從最愛移除' : '加入最愛'}
            >
              <Star size={18} fill={isFavorite ? '#f59e0b' : 'none'} color={isFavorite ? '#f59e0b' : '#64748b'} />
            </button>
          </div>
          <button onClick={onClose} className="drawer-close-btn" title="關閉">
            <X size={20} />
          </button>
        </div>

        {/* 當前核心氣候摘要 */}
        <div className="current-weather-hero">
          <div className="hero-emoji">{emoji}</div>
          <div className="hero-data">
            <div className="hero-temp">
              {weather?.minT || '--'}° <span className="temp-divider">~</span> {weather?.maxT || '--'}°C
            </div>
            <div className="hero-condition">
              <span className="condition-tag">{weather?.weather || '晴時多雲'}</span>
              <span className="comfort-tag">{weather?.comfort || '舒適'}</span>
            </div>
          </div>
        </div>

        {/* 重要生活氣象指標 */}
        <div className="weather-stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <Umbrella size={16} color="#3b82f6" />
              <span>降雨機率</span>
            </div>
            <div className="stat-value">{weather?.pop || '0'}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <Thermometer size={16} color="#f59e0b" />
              <span>氣溫範圍</span>
            </div>
            <div className="stat-value">{weather?.minT}~{weather?.maxT}°C</div>
          </div>
        </div>

        {/* 生活小提醒 (生活預報亮點) */}
        <div className="advice-section">
          <div className="advice-title">
            <Sparkles size={15} color="#8b5cf6" />
            <span>生活出行提醒</span>
          </div>
          <div className="advice-list">
            {getLifeAdvice().map((tip, idx) => (
              <p key={idx} className="advice-item">{tip}</p>
            ))}
          </div>
        </div>

        {/* 未來時段預報 (36小時) */}
        {weather?.forecasts && weather.forecasts.length > 0 && (
          <div className="forecast-section">
            <h3 className="forecast-title">未來 36 小時預報</h3>
            <div className="forecast-timeline">
              {weather.forecasts.map((fc, index) => {
                const startHour = new Date(fc.startTime).getHours();
                const endHour = new Date(fc.endTime).getHours();
                const timeLabel = index === 0 ? '今日稍後' : index === 1 ? '今晚至明晨' : '明日白天';

                return (
                  <div key={index} className="forecast-col">
                    <span className="fc-time">{timeLabel}</span>
                    <span className="fc-hours">{startHour}:00 - {endHour}:00</span>
                    <span className="fc-emoji">{getWeatherEmoji(fc.weather)}</span>
                    <span className="fc-temp">{fc.minT}° - {fc.maxT}°</span>
                    <span className="fc-pop">💧 {fc.pop}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
