import React, { useState, useEffect, useCallback } from 'react';
import WeatherMap from './components/Map/WeatherMap';
import Header from './components/UI/Header';
import WeatherDrawer from './components/UI/WeatherDrawer';
import LayerSwitcher from './components/UI/LayerSwitcher';
import SyncModal from './components/UI/SyncModal';
import { fetchTaiwanWeather, fetchTaiwanAqi } from './services/cwaApi';
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
  const [aqiData, setAqiData] = useState([]);
  const [activeLayer, setActiveLayer] = useState('weather'); // 'weather' | 'aqi'
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

  // 同步抓取氣象與空氣品質資料
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [weatherRes, aqiRes] = await Promise.allSettled([
        fetchTaiwanWeather(),
        fetchTaiwanAqi()
      ]);

      let loadedWeather = [];
      let loadedAqi = [];

      if (weatherRes.status === 'fulfilled') {
        loadedWeather = weatherRes.value;
        setWeatherData(loadedWeather);
      } else {
        console.error('抓取氣象失敗:', weatherRes.reason);
        setErrorMessage('部分氣象資料載入異常，請確認網路連線。');
      }

      if (aqiRes.status === 'fulfilled') {
        loadedAqi = aqiRes.value;
        setAqiData(loadedAqi);
      } else {
        console.warn('抓取空氣品質異常:', aqiRes.reason);
      }

      // 優先讀取資料庫快取的最後同步時間 (recorded_at)，無則回退為當前客戶端時間
      const latestTimestamp = loadedWeather[0]?.recordedAt || loadedAqi[0]?.recordedAt;
      if (latestTimestamp) {
        const d = new Date(latestTimestamp);
        if (!isNaN(d.getTime())) {
          const hours = d.getHours().toString().padStart(2, '0');
          const minutes = d.getMinutes().toString().padStart(2, '0');
          setLastUpdated(`${hours}:${minutes}`);
        } else {
          const now = new Date();
          setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        }
      } else {
        const now = new Date();
        setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      }
      
      // 若當前有選中的城市，同步更新其天氣與空品快照
      if (selectedLocation) {
        const normName = selectedLocation.name.replace('台', '臺');
        const updatedWeather = loadedWeather.find(r => r.locationName.replace('台', '臺') === normName);
        const updatedAqi = loadedAqi.find(r => r.locationName.replace('台', '臺') === normName);
        setSelectedLocation(prev => ({ 
          ...prev, 
          weatherInfo: updatedWeather || prev.weatherInfo,
          aqiInfo: updatedAqi || prev.aqiInfo
        }));
      }
    } catch (err) {
      console.error('資料整合抓取失敗:', err);
      setErrorMessage(err.message || '無法取得氣象與空品資料。');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation]);

  useEffect(() => {
    loadAllData();
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
      const normName = loc.name.replace('台', '臺');
      const weatherInfo = weatherData.find(w => w.locationName.replace('台', '臺') === normName);
      const aqiInfo = aqiData.find(a => a.locationName.replace('台', '臺') === normName);
      setSelectedLocation({ ...loc, weatherInfo, aqiInfo });
    }
  };

  return (
    <div className="app-container">
      {/* 滿版地圖 (主視圖，支援即時天氣與 AQI 雙圖層) */}
      <WeatherMap
        weatherData={weatherData}
        aqiData={aqiData}
        activeLayer={activeLayer}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        basemap={basemap}
      />

      {/* 頂部毛玻璃導覽列 */}
      <Header
        lastUpdated={lastUpdated}
        onRefresh={loadAllData}
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
        activeLayer={activeLayer}
        onActiveLayerChange={setActiveLayer}
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

      {/* 次視圖：詳細氣象與空品綜合資訊抽屜 */}
      <WeatherDrawer
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
        isFavorite={selectedLocation ? favorites.includes(selectedLocation.name) : false}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}
