import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TAIWAN_LOCATIONS, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '../../constants/taiwanLocations';
import { getWeatherEmoji } from '../../services/cwaApi';
import { getAqiMeta, AQI_LEVELS } from '../../services/aqiService';
import { Wind, Info } from 'lucide-react';

// 地圖視角平移輔助元件
function MapController({ selectedLocation }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 9.5, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [selectedLocation, map]);

  return null;
}

export default function WeatherMap({ 
  weatherData = [], 
  aqiData = [],
  activeLayer = 'weather',
  selectedLocation, 
  onSelectLocation,
  basemap = 'esri-gray'
}) {
  // 將氣象資料與座標對齊
  const locationWeatherMap = useMemo(() => {
    const map = new Map();
    weatherData.forEach(item => {
      const normalizedName = item.locationName.replace('台', '臺');
      map.set(normalizedName, item);
    });
    return map;
  }, [weatherData]);

  // 將空氣品質資料與座標對齊
  const locationAqiMap = useMemo(() => {
    const map = new Map();
    aqiData.forEach(item => {
      const normalizedName = item.locationName.replace('台', '臺');
      map.set(normalizedName, item);
    });
    return map;
  }, [aqiData]);

  // 自訂即時天氣標記
  const createWeatherIcon = (loc, weatherInfo, isSelected) => {
    const emoji = getWeatherEmoji(weatherInfo?.weather);
    const tempText = weatherInfo ? `${weatherInfo.minT}~${weatherInfo.maxT}°` : '--°';

    return L.divIcon({
      className: 'custom-weather-icon-container',
      html: `
        <div class="weather-marker-badge ${isSelected ? 'selected' : ''}">
          <span style="font-size: 15px;">${emoji}</span>
          <span class="marker-city">${loc.name.replace('臺', '台')}</span>
          <span class="marker-temp">${tempText}</span>
        </div>
      `,
      iconSize: [136, 36],
      iconAnchor: [68, 18],
    });
  };

  // 自訂空氣品質 (AQI) 標記
  const createAqiIcon = (loc, aqiInfo, isSelected) => {
    const aqiVal = aqiInfo?.aqi;
    const meta = getAqiMeta(aqiVal);
    const displayVal = aqiVal !== undefined && aqiVal !== null ? aqiVal : '--';

    return L.divIcon({
      className: 'custom-weather-icon-container',
      html: `
        <div class="aqi-marker-badge ${isSelected ? 'selected' : ''}" style="border-left: 4px solid ${meta.color};">
          <span class="marker-city">${loc.name.replace('臺', '台')}</span>
          <span class="marker-aqi-num" style="color: ${meta.color}; font-weight: 800;">${displayVal}</span>
          <span class="marker-aqi-pill" style="background-color: ${meta.color}; color: ${meta.textColor};">
            ${meta.status}
          </span>
        </div>
      `,
      iconSize: [146, 36],
      iconAnchor: [73, 18],
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={MAP_DEFAULT_CENTER}
        zoom={MAP_DEFAULT_ZOOM}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      >
        {/* 根據選擇渲染不同底圖 */}
        {basemap === 'esri-gray' && (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
          </>
        )}

        {basemap === 'esri-topo' && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        {basemap === 'nlsc' && (
          <TileLayer
            attribution='&copy; <a href="https://maps.nlsc.gov.tw/" target="_blank" rel="noreferrer">內政部國土測繪中心 (NLSC)</a>'
            url="https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}"
            maxZoom={19}
            className="nlsc-soft-tiles"
          />
        )}

        {basemap === 'osm' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        <MapController selectedLocation={selectedLocation} />

        {TAIWAN_LOCATIONS.map(loc => {
          const normalizedName = loc.name.replace('台', '臺');
          const weatherInfo = locationWeatherMap.get(normalizedName);
          const aqiInfo = locationAqiMap.get(normalizedName);
          const isSelected = selectedLocation?.name === loc.name;

          const icon = activeLayer === 'aqi' 
            ? createAqiIcon(loc, aqiInfo, isSelected)
            : createWeatherIcon(loc, weatherInfo, isSelected);

          return (
            <Marker
              key={loc.name}
              position={[loc.lat, loc.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  onSelectLocation({ ...loc, weatherInfo, aqiInfo });
                },
              }}
            />
          );
        })}
      </MapContainer>

      {/* 空氣品質指標等級圖例 (僅在 AQI 圖層啟用時顯示) */}
      {activeLayer === 'aqi' && (
        <div className="glass-panel aqi-legend-panel">
          <div className="aqi-legend-header">
            <Wind size={15} color="#2563eb" />
            <span className="aqi-legend-title">AQI 空氣品質指標圖例</span>
          </div>
          <div className="aqi-legend-scale">
            {AQI_LEVELS.map(level => (
              <div key={level.range} className="aqi-legend-item">
                <div 
                  className="aqi-color-bar" 
                  style={{ backgroundColor: level.color }} 
                  title={`${level.status}: ${level.range}`}
                />
                <span className="aqi-legend-name">{level.status}</span>
                <span className="aqi-legend-range">{level.range}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
