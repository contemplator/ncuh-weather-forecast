import React, { useState, useEffect, useCallback } from 'react';
import WeatherMap from './components/Map/WeatherMap';
import Header from './components/UI/Header';
import WeatherDrawer from './components/UI/WeatherDrawer';
import LayerSwitcher from './components/UI/LayerSwitcher';
import SyncModal from './components/UI/SyncModal';
import { fetchTaiwanWeather } from './services/cwaApi';
import { 
  getOrCreateDeviceId, 
  setDeviceId, 
  fetchUserPreferences, 
  saveUserPreferences, 
  getLocalPreferences 
} from './services/preferencesService';
import { TAIWAN_LOCATIONS } from './constants/taiwanLocations';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [weatherData, setWeatherData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);

  // 雲端同步與偏好狀態
  const [deviceId, setDeviceIdState] = useState(getOrCreateDeviceId());
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const initialPref = getLocalPreferences();
  const [basemap, setBasemap] = useState(initialPref.basemap);
  const [favorites, setFavorites] = useState(initialPref.favorites);

  // 初始化時向 Supabase 獲取雲端偏好
  useEffect(() => {
    async function loadCloudPreferences() {
      const { data, isCloud } = await fetchUserPreferences(deviceId);
      setIsCloudConnected(isCloud);
      if (data) {
        if (data.basemap) setBasemap(data.basemap);
        if (data.favorites) setFavorites(data.favorites);
      }
    }
    loadCloudPreferences();
  }, [deviceId]);

  // 切換底圖並同步儲存
  const handleBasemapChange = (newBasemap) => {
    setBasemap(newBasemap);
    saveUserPreferences(deviceId, { favorites, basemap: newBasemap });
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

  // 儲存我的最愛並雙向同步 (LocalStorage + Supabase)
  const handleToggleFavorite = (cityName) => {
    setFavorites(prev => {
      let updated;
      if (prev.includes(cityName)) {
        updated = prev.filter(c => c !== cityName);
      } else {
        updated = [...prev, cityName];
      }
      saveUserPreferences(deviceId, { favorites: updated, basemap });
      return updated;
    });
  };

  // 切換裝置識別碼 (跨瀏覽器同步)
  const handleSwitchDevice = async (newDeviceId) => {
    setDeviceId(newDeviceId);
    setDeviceIdState(newDeviceId);
    const { data, isCloud } = await fetchUserPreferences(newDeviceId);
    setIsCloudConnected(isCloud);
    if (data) {
      if (data.basemap) setBasemap(data.basemap);
      if (data.favorites) setFavorites(data.favorites);
    }
  };

  // 點擊頂部最愛標籤時快速定位
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
        isCloudConnected={isCloudConnected}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* 右上角圖層與風格切換選單 */}
      <LayerSwitcher
        currentBasemap={basemap}
        onBasemapChange={handleBasemapChange}
      />

      {/* 雲端同步與裝置管理彈窗 */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        deviceId={deviceId}
        onSwitchDevice={handleSwitchDevice}
        isCloudConnected={isCloudConnected}
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
