// 轉發並保持相容性，所有呼叫 cwaApi 的地方皆可無縫享用資料庫快取與回退機制
export { 
  getWeatherEmoji, 
  fetchTaiwanWeather, 
  fetchTaiwanAqi, 
  fetchWeatherFromCwaDirect 
} from './dataService';
