import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 嘗試載入本機 .env 檔案 (本地執行 node scripts/sync-data.js 時使用)
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=');
      const val = valParts.join('=');
      if (key && val && !process.env[key.trim()]) {
        process.env[key.trim()] = val.trim();
      }
    }
  });
}

const CWA_API_KEY = process.env.CWA_API_KEY || process.env.VITE_CWA_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Error] 未找到 Supabase 連線資訊 (SUPABASE_URL / SUPABASE_KEY)，終止執行。');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 台灣 22 縣市座標對照表
const TAIWAN_LOCATIONS = [
  { name: '臺北市', lat: 25.0375, lng: 121.5637 },
  { name: '新北市', lat: 25.0116, lng: 121.4657 },
  { name: '基隆市', lat: 25.1276, lng: 121.7392 },
  { name: '桃園市', lat: 24.9936, lng: 121.3010 },
  { name: '新竹市', lat: 24.8138, lng: 120.9675 },
  { name: '新竹縣', lat: 24.8387, lng: 121.0177 },
  { name: '苗栗縣', lat: 24.5602, lng: 120.8214 },
  { name: '臺中市', lat: 24.1477, lng: 120.6736 },
  { name: '彰化縣', lat: 24.0518, lng: 120.5161 },
  { name: '南投縣', lat: 23.9610, lng: 120.9719 },
  { name: '雲林縣', lat: 23.7092, lng: 120.4313 },
  { name: '嘉義市', lat: 23.4800, lng: 120.4491 },
  { name: '嘉義縣', lat: 23.4518, lng: 120.2555 },
  { name: '臺南市', lat: 22.9997, lng: 120.2270 },
  { name: '高雄市', lat: 22.6273, lng: 120.3014 },
  { name: '屏東縣', lat: 22.6761, lng: 120.4862 },
  { name: '宜蘭縣', lat: 24.7021, lng: 121.7378 },
  { name: '花蓮縣', lat: 23.9872, lng: 121.6016 },
  { name: '臺東縣', lat: 22.7583, lng: 121.1444 },
  { name: '澎湖縣', lat: 23.5712, lng: 119.5793 },
  { name: '金門縣', lat: 24.4492, lng: 118.3766 },
  { name: '連江縣', lat: 26.1505, lng: 119.9499 }
];

function getAqiStatus(aqi) {
  if (aqi <= 50) return '良好';
  if (aqi <= 100) return '普通';
  if (aqi <= 150) return '對敏感族群不健康';
  if (aqi <= 200) return '對所有族群不健康';
  if (aqi <= 300) return '非常不健康';
  return '危害';
}

/**
 * 同步中央氣象署天氣資料
 */
async function syncWeather() {
  if (!CWA_API_KEY) {
    console.warn('[Weather] 未配置 CWA_API_KEY，跳過氣象同步。');
    return;
  }

  console.log('[Weather] 開始向中央氣象署抓取三十六小時預報...');
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${CWA_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CWA API 請求失敗 HTTP ${res.status}`);
  }

  const json = await res.json();
  const locations = json.records?.location || [];

  const now = new Date().toISOString();
  const records = locations.map(loc => {
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
      location_name: loc.locationName.replace('台', '臺'),
      weather: currentWx,
      pop: currentPoP,
      min_t: currentMinT,
      max_t: currentMaxT,
      comfort: currentCI,
      forecasts,
      recorded_at: now
    };
  });

  if (records.length > 0) {
    const { error } = await supabase.from('weather_records').insert(records);
    if (error) {
      throw new Error(`寫入 weather_records 失敗: ${error.message}`);
    }
    console.log(`[Weather] ✅ 成功寫入 ${records.length} 筆各縣市天氣資料至 Supabase！`);
  }
}

/**
 * 同步空氣品質 (AQI) 資料
 */
async function syncAqi() {
  console.log('[AQI] 開始抓取全台 22 縣市即時空氣品質指標 (AQI)...');

  // 一次批次查詢 22 縣市
  const lats = TAIWAN_LOCATIONS.map(l => l.lat).join(',');
  const lngs = TAIWAN_LOCATIONS.map(l => l.lng).join(',');
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lngs}&current=us_aqi,pm2_5,pm10`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`AQI API 請求失敗 HTTP ${res.status}`);
  }

  const dataList = await res.json();
  const list = Array.isArray(dataList) ? dataList : [dataList];

  const now = new Date().toISOString();
  const records = list.map((item, idx) => {
    const loc = TAIWAN_LOCATIONS[idx] || { name: `測站${idx + 1}` };
    const aqiVal = item.current?.us_aqi ? Math.round(item.current.us_aqi) : 50;
    const pm25Val = item.current?.pm2_5 !== undefined ? Number(item.current.pm2_5.toFixed(1)) : null;

    return {
      location_name: loc.name,
      site_name: `${loc.name}觀測點`,
      aqi: aqiVal,
      status: getAqiStatus(aqiVal),
      pm25: pm25Val,
      pollutant: 'PM2.5',
      recorded_at: now
    };
  });

  if (records.length > 0) {
    const { error } = await supabase.from('aqi_records').insert(records);
    if (error) {
      throw new Error(`寫入 aqi_records 失敗: ${error.message}`);
    }
    console.log(`[AQI] ✅ 成功寫入 ${records.length} 筆各縣市 AQI 空氣品質資料至 Supabase！`);
  }
}

async function main() {
  console.log('=== [Data Sync] 開始執行定時爬蟲與資料庫快取同步 ===');
  const startTime = Date.now();

  try {
    await syncWeather();
    await syncAqi();
    const cost = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`=== [Data Sync] 同步全數完成！耗時 ${cost} 秒 ===`);
    process.exit(0);
  } catch (err) {
    console.error('[Data Sync Error]', err.message);
    process.exit(1);
  }
}

main();
