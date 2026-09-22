# 專案規格書：台灣天氣與生活綜合預報地圖 (Weather & Life Map)

## 1. 系統架構與部署 (Deployment)
- **前端技術棧**：React (Vite)
- **部署平台**：Vercel (免費、對 Vite 支援極佳、支援自動 CI/CD)
- **地圖套件**：Leaflet (搭配 `react-leaflet` 進行 React 元件化開發)
- **地圖圖磚**：內政部國土測繪中心 (NLSC) 臺灣通用電子地圖（100% 繁體中文、免 Key、套用 Soft & Clean 濾鏡）

## 2. 資料來源 (Data Sources)
- **第一階段實作 (核心天氣資料)**：[中央氣象署 (CWA) Open Data API](https://opendata.cwa.gov.tw/)
  - 提供即時天氣、鄉鎮級距天氣預報，最適合台灣本土使用。
- **未來擴充圖層 (Phase 2 預留介面)**：
  - **空氣品質 (AQI / PM2.5)**：環境部 API
  - **即時用電量與供電燈號**：台電開源資料
  - **水庫即時水情**：水利署 API

## 3. 資料庫設計 (Database)
- **短期方案 (Phase 1)**：無後端，使用者「我的最愛城市」或「圖層偏好」使用瀏覽器的 `localStorage` 儲存，最輕量且滿足初步需求。
- **長期方案 (Phase 2)**：推薦使用 **Supabase** (基於 PostgreSQL 的開源 Firebase 替代方案)，免費額度對個人專案非常足夠，適合未來擴展會員登入與儲存關聯式資料。

## 4. UI/UX 介面設計 (Design & Layout)
- **視覺風格**：**玻璃擬物化 (Glassmorphism) + 現代清新風**
  - 介面質感極佳，背景為滿版互動地圖，覆蓋在上面的選單與資訊卡片採用半透明「毛玻璃」效果，不遮擋地圖細節。
- **排版邏輯 (Map-First)**：
  - **主視圖 (Primary View)**：全螢幕互動地圖，地圖上以直觀的圖示 (Icons) 顯示各地當下天氣與氣溫。
  - **次視圖 (Secondary View)**：點擊地圖上的城市標記，或滑出側邊欄，顯示該區域的「列表式詳細資訊」(例如一週預報、降雨機率、體感溫度)。
  - **圖層切換器 (Layer Switcher)**：畫面上預留一個懸浮的圖層切換選單，目前先顯示「天氣圖層」，未來擴充時可直接勾選疊加「AQI」、「用電量」、「水庫」等資料。

## 5. 開發階段規劃 (Roadmap)
- **Phase 1 (基礎地圖與氣象渲染)**：React (Vite) + Leaflet + 玻璃擬物化 UI + 氣象署 API。
- **Phase 2 (雲端持久化)**：導入 Supabase 建立 `user_preferences` 表與免登入裝置同步碼 (Sync ID)。
- **Phase 3 (發布與文件)**：專案打包優化、Vercel 自動化 CI/CD 部署、完善 README。
- **Phase 4 (資料庫排程爬蟲與快取同步)**：
  - 建立 `weather_records` 與 `aqi_records` 資料表。
  - GitHub Actions 排程 (`cron: '0 * * * *'`) 每小時執行 Node.js 爬蟲同步快取。
  - 前端優先讀取資料庫快取，避免 API 限流與金鑰暴露。
- **Phase 5 (空氣品質 AQI 圖層與生活指標整合)**：
  - 啟用 `LayerSwitcher` 的 AQI 圖層切換。
  - 實作 6 級健康色碼動態標記與圖例 (Legend)。
  - `WeatherDrawer` 結合氣溫與空品提供更全方位的出行防護建議。

