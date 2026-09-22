import React from 'react';
import { X, Star, Umbrella, Thermometer, Wind, Sparkles, Activity } from 'lucide-react';
import { getWeatherEmoji } from '../../services/cwaApi';
import { getAqiMeta } from '../../services/aqiService';

export default function WeatherDrawer({ 
  location, 
  onClose, 
  isFavorite, 
  onToggleFavorite 
}) {
  if (!location) return null;

  const weather = location.weatherInfo;
  const aqi = location.aqiInfo;
  const emoji = getWeatherEmoji(weather?.weather);

  const aqiMeta = getAqiMeta(aqi?.aqi);

  // 根據降雨機率、氣溫與空氣品質給予生活情境建議
  const popNumber = parseInt(weather?.pop || '0', 10);
  const minTemp = parseInt(weather?.minT || '20', 10);
  const aqiNumber = aqi?.aqi !== undefined && aqi?.aqi !== null ? Number(aqi.aqi) : null;

  const getLifeAdvice = () => {
    const tips = [];

    // 氣候防雨建議
    if (popNumber >= 30) {
      tips.push('🌧️ 出門記得攜帶雨具，慎防局部降雨');
    } else {
      tips.push('☀️ 降雨機率低，適合洗曬衣物或外出散心');
    }

    // 氣溫穿著建議
    if (minTemp <= 18) {
      tips.push('🧥 早晚溫差偏涼，建議洋蔥式穿搭避免著涼');
    } else if (minTemp >= 28) {
      tips.push('🥤 天氣炎熱，外出請注意防曬並適時補充水分');
    } else {
      tips.push('✨ 氣溫與體感適宜，整體十分舒適');
    }

    // 空氣品質健康防護建議
    if (aqiNumber !== null) {
      if (aqiNumber <= 50) {
        tips.push('🌿 空氣品質良好清新，非常推薦戶外慢跑或開窗通風');
      } else if (aqiNumber <= 100) {
        tips.push('🍃 空品普通，一般民眾可正常活動');
      } else if (aqiNumber <= 150) {
        tips.push('😷 空氣對敏感族群不友善，長者與過敏體質外出建議佩戴口罩');
      } else {
        tips.push('⚠️ 空品達不健康警戒，建議減少劇烈戶外運動，緊閉門窗開啟清淨機');
      }
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
              {aqi && (
                <span 
                  className="aqi-hero-tag"
                  style={{ backgroundColor: `${aqiMeta.color}22`, color: aqiMeta.color, borderColor: `${aqiMeta.color}66` }}
                >
                  AQI {aqi.aqi} · {aqiMeta.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 重要生活氣象與空品指標 (4宮格) */}
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
            <div className="stat-value">{weather?.minT || '--'}~{weather?.maxT || '--'}°C</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Wind size={16} color="#10b981" />
              <span>空氣品質 (AQI)</span>
            </div>
            <div className="stat-value" style={{ color: aqiMeta.color }}>
              {aqi?.aqi !== undefined ? aqi.aqi : '--'}
              <span className="stat-sub-badge" style={{ backgroundColor: aqiMeta.color, color: aqiMeta.textColor }}>
                {aqiMeta.status}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Activity size={16} color="#8b5cf6" />
              <span>細懸浮微粒 PM2.5</span>
            </div>
            <div className="stat-value">
              {aqi?.pm25 ? `${aqi.pm25}` : '--'}
              <span className="stat-unit">μg/m³</span>
            </div>
          </div>
        </div>

        {/* 生活小提醒 (生活預報亮點) */}
        <div className="advice-section">
          <div className="advice-title">
            <Sparkles size={15} color="#8b5cf6" />
            <span>生活與健康出行指南</span>
          </div>
          <div className="advice-list">
            {getLifeAdvice().map((tip, idx) => (
              <p key={idx} className="advice-item">{tip}</p>
            ))}
          </div>
        </div>

        {/* 未來時段預報 (36 小時) */}
        {weather?.forecasts && weather.forecasts.length > 0 && (
          <div className="forecast-section">
            <div className="forecast-title">36 小時天氣預報走勢</div>
            <div className="forecast-list">
              {weather.forecasts.map((fc, index) => {
                const fcEmoji = getWeatherEmoji(fc.weather);
                const timeLabel = index === 0 ? '當前時段' : (index === 1 ? '下個時段' : '後續時段');
                return (
                  <div key={index} className="forecast-item">
                    <span className="forecast-time">{timeLabel}</span>
                    <span className="forecast-emoji">{fcEmoji}</span>
                    <span className="forecast-temp">{fc.minT}~{fc.maxT}°</span>
                    <span className="forecast-pop">💧{fc.pop}%</span>
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
