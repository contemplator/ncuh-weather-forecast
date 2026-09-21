import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TAIWAN_LOCATIONS, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM } from '../../constants/taiwanLocations';
import { getWeatherEmoji } from '../../services/cwaApi';

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
  selectedLocation, 
  onSelectLocation,
  basemap = 'esri-gray'
}) {
  // 將氣象資料與座標對齊
  const locationWeatherMap = React.useMemo(() => {
    const map = new Map();
    weatherData.forEach(item => {
      // 統一縣市名稱對齊（處理 臺/台 等異體字）
      const normalizedName = item.locationName.replace('台', '臺');
      map.set(normalizedName, item);
    });
    return map;
  }, [weatherData]);

  // 自訂 Leaflet DivIcon
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
      iconSize: [132, 34],
      iconAnchor: [66, 17],
    });
  };

  return (
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
        const isSelected = selectedLocation?.name === loc.name;

        return (
          <Marker
            key={loc.name}
            position={[loc.lat, loc.lng]}
            icon={createWeatherIcon(loc, weatherInfo, isSelected)}
            eventHandlers={{
              click: () => {
                onSelectLocation({ ...loc, weatherInfo });
              },
            }}
          />
        );
      })}
    </MapContainer>
  );
}
