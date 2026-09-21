// 中央氣象署 (CWA) API 服務

const CWA_BASE_URL = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';
const DEFAULT_DATASET = 'F-C0032-001'; // 一般天氣預報-三十六小時天氣預報

/**
 * 根據天氣現象代碼或名稱回傳對應的圖示 Emoji
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
 * 取得 36 小時全台天氣預報
 */
export async function fetchTaiwanWeather() {
  const apiKey = import.meta.env.VITE_CWA_API_KEY;

  if (!apiKey) {
    console.warn('未偵測到 VITE_CWA_API_KEY，請在 .env 中配置 API Key。');
  }

  const url = `${CWA_BASE_URL}/${DEFAULT_DATASET}?Authorization=${apiKey || ''}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API 請求失敗: HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data.success || !data.records?.location) {
      throw new Error(data.message || '無法解析氣象署回傳格式');
    }

    return parseCwaWeatherRecords(data.records.location);
  } catch (error) {
    console.error('抓取氣象資料失敗:', error);
    throw error;
  }
}

/**
 * 解析氣象署回傳的 location 陣列為前端友善的資料結構
 */
function parseCwaWeatherRecords(locations) {
  return locations.map(loc => {
    const locationName = loc.locationName;
    const elements = {};

    loc.weatherElement.forEach(elem => {
      elements[elem.elementName] = elem.time;
    });

    // 取得當前時段 (第 0 個 time window)
    const currentWx = elements.Wx?.[0]?.parameter?.parameterName || '晴時多雲';
    const currentPoP = elements.PoP?.[0]?.parameter?.parameterName || '0';
    const currentMinT = elements.MinT?.[0]?.parameter?.parameterName || '--';
    const currentMaxT = elements.MaxT?.[0]?.parameter?.parameterName || '--';
    const currentCI = elements.CI?.[0]?.parameter?.parameterName || '舒適';

    // 整合 36 小時內的三個預報時段
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
      forecasts
    };
  });
}
