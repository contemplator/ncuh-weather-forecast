// 空氣品質 (AQI) 相關常數與工具函式

export const AQI_LEVELS = [
  {
    range: '0 - 50',
    min: 0,
    max: 50,
    status: '良好',
    color: '#10b981', // 翡翠綠
    textColor: '#ffffff',
    borderColor: '#059669',
    advice: '空氣品質良好，適合戶外活動與開窗通風。'
  },
  {
    range: '51 - 100',
    min: 51,
    max: 100,
    status: '普通',
    color: '#eab308', // 暖黃
    textColor: '#1f2937',
    borderColor: '#ca8a04',
    advice: '空氣品質普通，極敏感族群注意微幅呼吸道不適。'
  },
  {
    range: '101 - 150',
    min: 101,
    max: 150,
    status: '對敏感族群不健康',
    color: '#f97316', // 活力橘
    textColor: '#ffffff',
    borderColor: '#ea580c',
    advice: '敏感族群（長者、孩童、心血管患者）建議減少劇烈戶外活動並配戴口罩。'
  },
  {
    range: '151 - 200',
    min: 151,
    max: 200,
    status: '對所有族群不健康',
    color: '#ef4444', // 鮮紅
    textColor: '#ffffff',
    borderColor: '#dc2626',
    advice: '所有族群應減少戶外活動，外出請佩戴防護口罩，建議緊閉門窗開啟清淨機。'
  },
  {
    range: '201 - 300',
    min: 201,
    max: 300,
    status: '非常不健康',
    color: '#8b5cf6', // 警戒紫
    textColor: '#ffffff',
    borderColor: '#7c3aed',
    advice: '空氣品質極度惡劣，應避免戶外活動，室內請保持空氣清淨機運轉。'
  },
  {
    range: '301+',
    min: 301,
    max: 999,
    status: '危害',
    color: '#831843', // 褐紅
    textColor: '#ffffff',
    borderColor: '#701a75',
    advice: '空氣品質已達危害等級，所有人留在室內並緊閉門窗，避免一切戶外暴露。'
  }
];

/**
 * 取得 AQI 的完整元資料 (色彩、等級、防護建議)
 */
export function getAqiMeta(aqiVal) {
  const aqi = typeof aqiVal === 'number' ? aqiVal : parseInt(aqiVal, 10);
  if (isNaN(aqi)) {
    return {
      status: '無資料',
      color: '#94a3b8',
      textColor: '#ffffff',
      borderColor: '#64748b',
      advice: '暫無空氣品質測站即時資訊。'
    };
  }

  for (const level of AQI_LEVELS) {
    if (aqi <= level.max) {
      return level;
    }
  }

  return AQI_LEVELS[AQI_LEVELS.length - 1];
}

/**
 * 取得 AQI 對應的主題色彩
 */
export function getAqiColor(aqiVal) {
  return getAqiMeta(aqiVal).color;
}
