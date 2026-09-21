import React, { useState, useEffect, useCallback } from 'react';
import WeatherMap from './components/Map/WeatherMap';
import Header from './components/UI/Header';
import WeatherDrawer from './components/UI/WeatherDrawer';
import LayerSwitcher from './components/UI/LayerSwitcher';
import { fetchTaiwanWeather } from './services/cwaApi';
import { TAIWAN_LOCATIONS } from './constants/taiwanLocations';
import { AlertCircle } from 'lucide-react';

const STORAGE_KEY_FAVORITES = 'nchu_weather_favorites';
const STORAGE_KEY_BASEMAP = 'nchu_weather_basemap';

export default function App() {
  const [weatherData, setWeatherData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [basemap, setBasemap] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_BASEMAP) || 'esri-gray';
  });
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      return saved ? JSON.parse(saved) : ['臺中市', '臺北市'];
    } catch {
      return ['臺中市', '臺北市'];
    }
  });

  const handleBasemapChange = (newBasemap) => {
    setBasemap(newBasemap);
    try {
      localStorage.setItem(STORAGE_KEY_BASEMAP, newBasemap);
    } catch (e) {
      console.error(e);
    }
  };


  // 抓取氣象資料
  const loadWeather = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const records = await fetchTaiwanWeather();
      setWeatherData(records);
      const now = new Date();
      setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      
      // 如果已經有選取的縣市，同步更新該縣市最新天氣
      if (selectedLocation) {
        const updatedInfo = records.find(r => r.locationName.replace('台', '臺') === selectedLocation.name.replace('台', '臺'));
        if (updatedInfo) {
          setSelectedLocation(prev => ({ ...prev, weatherInfo: updatedInfo }));
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || '無法取得氣象資料，請檢查網路連線或 API Key。');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    loadWeather();
  }, []);

  // 儲存我的最愛至 localStorage
  const handleToggleFavorite = (cityName) => {
    setFavorites(prev => {
      let updated;
      if (prev.includes(cityName)) {
        updated = prev.filter(c => c !== cityName);
      } else {
        updated = [...prev, cityName];
      }
      try {
        localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
      } catch (e) {
        console.error('LocalStorage 儲存失敗:', e);
      }
      return updated;
    });
  };

  // 點擊頂部最愛標籤時，快速定位並開啟抽屜
  const handleSelectFavorite = (cityName) => {
    const loc = TAIWAN_LOCATIONS.find(l => l.name === cityName || l.alias.includes(cityName));
    if (loc) {
      const weatherInfo = weatherData.find(w => w.locationName.replace('台', '臺') === loc.name.replace('台', '臺'));
      setSelectedLocation({ ...loc, weatherInfo });
    }
  };

  return (
    <div className="app-container">
      {/* 滿版地圖 (主視圖) */}
      <WeatherMap
        weatherData={weatherData}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        basemap={basemap}
      />

      {/* 頂部毛玻璃導覽列 */}
      <Header
        lastUpdated={lastUpdated}
        onRefresh={loadWeather}
        isLoading={isLoading}
        favorites={favorites}
        onSelectFavorite={handleSelectFavorite}
      />

      {/* 右上角圖層與風格切換選單 */}
      <LayerSwitcher
        currentBasemap={basemap}
        onBasemapChange={handleBasemapChange}
      />

      {/* 錯誤警示卡片 */}
      {errorMessage && (
        <div className="glass-panel error-banner">
          <AlertCircle size={18} color="#ef4444" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 次視圖：詳細氣象資訊抽屜/卡片 */}
      <WeatherDrawer
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
        isFavorite={selectedLocation ? favorites.includes(selectedLocation.name) : false}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
