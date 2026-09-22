import React, { useState } from 'react';
import { Layers, Check, Zap, Wind, Droplets, CloudSun, Compass } from 'lucide-react';

export default function LayerSwitcher({ 
  currentBasemap = 'esri-gray', 
  onBasemapChange,
  activeLayer = 'weather',
  onActiveLayerChange
}) {
  const [isOpen, setIsOpen] = useState(false);

  const basemapOptions = [
    { id: 'esri-gray', name: '極簡淡雅 (Esri Gray)', desc: '現代淺灰畫布，中文地名，極度乾淨' },
    { id: 'esri-topo', name: '自然地形 (Esri Topo)', desc: '立體地勢地貌，適合戶外氣候' },
    { id: 'nlsc', name: '臺灣電子地圖 (NLSC)', desc: '台灣官方詳盡街道圖' },
    { id: 'osm', name: '開源標準 (OSM)', desc: 'OpenStreetMap 經典配色' }
  ];

  const dataLayers = [
    { id: 'weather', name: '全台即時天氣', icon: CloudSun, available: true },
    { id: 'aqi', name: '空氣品質 (AQI)', icon: Wind, available: true, badge: '即時' },
    { id: 'power', name: '各區用電量負載', icon: Zap, available: false, tag: '規劃中' },
    { id: 'water', name: '水庫即時水情', icon: Droplets, available: false, tag: '規劃中' },
  ];

  const handleLayerClick = (layer) => {
    if (!layer.available) return;
    if (onActiveLayerChange) {
      onActiveLayerChange(layer.id);
    }
  };

  return (
    <div className={`layer-switcher-container ${isOpen ? 'open' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-btn layer-toggle-btn"
        title="圖層與地圖管理"
      >
        <Layers size={18} color="#2563eb" />
        <span>圖層與風格</span>
        {activeLayer === 'aqi' && (
          <span className="layer-status-indicator aqi">空品</span>
        )}
      </button>

      {isOpen && (
        <div className="glass-panel layer-popup-menu">
          {/* 資料圖層 */}
          <div className="layer-menu-header">
            <div className="layer-menu-title-row">
              <Layers size={15} color="#2563eb" />
              <h4>資料圖層 (Data Layers)</h4>
            </div>
            <span className="layer-subtext">點選切換地圖即時呈現指標</span>
          </div>

          <div className="layer-list">
            {dataLayers.map(layer => {
              const Icon = layer.icon;
              const isChecked = activeLayer === layer.id;

              return (
                <div
                  key={layer.id}
                  className={`layer-item ${!layer.available ? 'disabled' : ''} ${isChecked ? 'active-layer' : ''}`}
                  onClick={() => handleLayerClick(layer)}
                >
                  <div className="layer-item-left">
                    <Icon size={16} color={isChecked ? '#2563eb' : (layer.available ? '#475569' : '#94a3b8')} />
                    <span className="layer-name">{layer.name}</span>
                    {layer.badge && <span className="layer-live-badge">{layer.badge}</span>}
                  </div>

                  <div className="layer-item-right">
                    {layer.tag && <span className="phase-tag">{layer.tag}</span>}
                    {layer.available && (
                      <div className={`check-box radio-mode ${isChecked ? 'checked' : ''}`}>
                        {isChecked && <Check size={12} color="#ffffff" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底圖風格切換 */}
          <div className="layer-menu-header" style={{ marginTop: '18px' }}>
            <div className="layer-menu-title-row">
              <Compass size={15} color="#2563eb" />
              <h4>底圖風格 (Basemap)</h4>
            </div>
            <span className="layer-subtext">切換你最喜歡的地圖樣式</span>
          </div>

          <div className="basemap-list">
            {basemapOptions.map(option => (
              <div
                key={option.id}
                className={`basemap-option-card ${currentBasemap === option.id ? 'selected' : ''}`}
                onClick={() => onBasemapChange && onBasemapChange(option.id)}
              >
                <div className="basemap-radio">
                  <div className={`radio-dot ${currentBasemap === option.id ? 'active' : ''}`} />
                </div>
                <div className="basemap-info">
                  <div className="basemap-name">{option.name}</div>
                  <div className="basemap-desc">{option.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
