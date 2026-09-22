import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY_DEVICE_ID = 'nchu_weather_device_id';
const STORAGE_KEY_FAVORITES = 'nchu_weather_favorites';
const STORAGE_KEY_BASEMAP = 'nchu_weather_basemap';

/**
 * 取得或建立本機的唯一裝置識別碼 (同步碼)
 */
export function getOrCreateDeviceId() {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!deviceId) {
      // 產生一個簡短好記的 8 碼同步 ID
      const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
      deviceId = `DEV-${randomStr}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch {
    return 'DEV-DEFAULT';
  }
}

/**
 * 手動設定/切換同步碼 (支援跨瀏覽器、跨裝置同步)
 */
export function setDeviceId(newDeviceId) {
  try {
    localStorage.setItem(STORAGE_KEY_DEVICE_ID, newDeviceId.trim());
  } catch (e) {
    console.error('儲存裝置 ID 失敗:', e);
  }
}

/**
 * 讀取本機 LocalStorage 快取偏好
 */
export function getLocalPreferences() {
  try {
    const savedFavorites = localStorage.getItem(STORAGE_KEY_FAVORITES);
    const savedBasemap = localStorage.getItem(STORAGE_KEY_BASEMAP);
    return {
      favorites: savedFavorites ? JSON.parse(savedFavorites) : ['臺中市', '臺北市'],
      basemap: savedBasemap || 'esri-gray'
    };
  } catch {
    return {
      favorites: ['臺中市', '臺北市'],
      basemap: 'esri-gray'
    };
  }
}

/**
 * 從 Supabase 取得使用者偏好 (若失敗則退回 LocalStorage)
 */
export async function fetchUserPreferences(deviceId) {
  const local = getLocalPreferences();

  if (!isSupabaseConfigured || !supabase) {
    return { data: local, isCloud: false };
  }

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('favorites, basemap')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase 查詢錯誤，退回本地設定:', error.message);
      return { data: local, isCloud: false };
    }

    if (data) {
      // 成功從雲端取得，更新本機快取
      localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(data.favorites));
      localStorage.setItem(STORAGE_KEY_BASEMAP, data.basemap);
      return { data: { favorites: data.favorites, basemap: data.basemap }, isCloud: true };
    } else {
      // 雲端尚無此裝置紀錄，將本機設定同步上傳至雲端初始化
      await saveUserPreferences(deviceId, local);
      return { data: local, isCloud: true };
    }
  } catch (err) {
    console.error('Supabase 連線失敗:', err);
    return { data: local, isCloud: false };
  }
}

/**
 * 儲存使用者偏好 (同時更新 LocalStorage 與 Supabase 雲端)
 */
export async function saveUserPreferences(deviceId, { favorites, basemap }) {
  // 1. 先寫入本地快取，保證 UI 零延遲反應
  try {
    if (favorites) localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
    if (basemap) localStorage.setItem(STORAGE_KEY_BASEMAP, basemap);
  } catch (e) {
    console.error('LocalStorage 快取寫入失敗:', e);
  }

  // 2. 同步至 Supabase 雲端
  if (!isSupabaseConfigured || !supabase) {
    return { success: true, cloud: false };
  }

  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          device_id: deviceId,
          favorites: favorites,
          basemap: basemap,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'device_id' }
      );

    if (error) {
      console.warn('Supabase 雲端儲存失敗:', error.message);
      return { success: false, cloud: false, error: error.message };
    }

    return { success: true, cloud: true };
  } catch (err) {
    console.error('雲端儲存異常:', err);
    return { success: false, cloud: false, error: err.message };
  }
}
