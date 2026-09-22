import { supabase, isSupabaseConfigured } from './supabaseClient';

const CWA_BASE_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';
const DEFAULT_DATASET = 'F-C0032-001';

/**
 * 根據天氣現象文字回傳對應的圖示 Emoji
 */
export function getWeatherEmoji(weatherText = '') {
  if (weatherText.includes('雷') || weatherText.includes('暴雨')) return '⛈️';
  if (weatherText.includes('雨')) return '🌧️';
  if (weatherText.includes('陰')) return '☁️';
  if (weatherText.includes('多雲')) return '⛅';
  if (weatherText.includes('晴')) return '☀️';
  return '🌤️';
}

/**
 * 解析中央氣象署原始 location 陣列
 */
function parseCwaWeatherRecords(locations) {
  return locations.map(loc => {
    const locationName = loc.locationName;
    const elements = {};

    loc.weatherElement.forEach(elem => {
      elements[elem.elementName] = elem.time;
    });

    const currentWx = elements.Wx?.[0]?.parameter?.parameterName || '晴時多雲';
    const currentPoP = elements.PoP?.[0]?.parameter?.parameterName || '0';
    const currentMinT = elements.MinT?.[0]?.parameter?.parameterName || '--';
    const currentMaxT = elements.MaxT?.[0]?.parameter?.parameterName || '--';
    const currentCI = elements.CI?.[0]?.parameter?.parameterName || '舒適';

    const forecasts = (elements.Wx || []).map((t, idx) => ({
      startTime: t.startTime,
      endTime: t.endTime,
      weather: t.parameter?.parameterName,
      pop: elements.PoP?.[idx]?.parameter?.parameterName || '0',
      minT: elements.MinT?.[idx]?.parameter?.parameterName || '--',
      maxT: elements.MaxT?.[idx]?.parameter?.parameterName || '--',
      comfort: elements.CI?.[idx]?.parameter?.parameterName || ''
    }));

    return {
      locationName,
      weather: currentWx,
      pop: currentPoP,
      minT: currentMinT,
      maxT: currentMaxT,
      comfort: currentCI,
      forecasts,
      source: 'cwa_direct'
    };
  });
}

/**
 * 從中央氣象署 API 直取天氣預報 (備援回退機制)
 */
export async function fetchWeatherFromCwaDirect() {
  const apiKey = import.meta.env.VITE_CWA_API_KEY;
  if (!apiKey) {
    throw new Error('未偵測到 VITE_CWA_API_KEY，且資料庫暫無快取。');
  }

  const url = `${CWA_BASE_URL}/${DEFAULT_DATASET}?Authorization=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CWA API 請求失敗: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.records?.location) {
    throw new Error(data.message || '無法解析氣象署回傳格式');
  }

  return parseCwaWeatherRecords(data.records.location);
}

/**
 * 取得全台最新天氣預報
 * 策略：優先讀取 Supabase 雲端快取 (latest_weather 檢視表)，若失敗或無資料則自動回退至氣象署 API
 */
export async function fetchTaiwanWeather() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('latest_weather')
        .select('*');

      if (!error && data && data.length > 0) {
        return data.map(row => ({
          locationName: row.location_name,
          weather: row.weather,
          pop: row.pop,
          minT: row.min_t,
          maxT: row.max_t,
          comfort: row.comfort,
          forecasts: row.forecasts || [],
          recordedAt: row.recorded_at,
          source: 'database'
        }));
      }
    } catch (err) {
      console.warn('Supabase 天氣快取讀取異常，嘗試回退至 CWA 直取:', err);
    }
  }

  // 降級退回前端直連氣象署 API
  return await fetchWeatherFromCwaDirect();
}

/**
 * 取得全台最新空氣品質 (AQI)
 * 讀取 Supabase 雲端快取 (latest_aqi 檢視表)
 */
export async function fetchTaiwanAqi() {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('latest_aqi')
      .select('*');

    if (error) {
      console.warn('讀取最新 AQI 資料失敗:', error);
      return [];
    }

    return (data || []).map(row => ({
      locationName: row.location_name,
      siteName: row.site_name,
      aqi: Number(row.aqi),
      status: row.status,
      pm25: row.pm25,
      pollutant: row.pollutant,
      recordedAt: row.recorded_at,
      source: 'database'
    }));
  } catch (err) {
    console.warn('抓取空氣品質異常:', err);
    return [];
  }
}
