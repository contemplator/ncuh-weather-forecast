# Weather & Life Map (台灣天氣與生活綜合預報地圖)

這是一個以「地圖為核心 (Map-First)」的天氣與生活資訊預報系統，專為台灣打造。有別於傳統條列式的天氣預報，本專案將各項天氣與生活指標直覺地疊加在互動地圖上，並採用**玻璃擬物化 (Glassmorphism)** 的現代 UI 風格。

## 🌟 專案特色 (Features)
- **滿版互動地圖**：以台灣地圖為基礎，一眼看懂全台各縣市即時天氣。
- **高質感 UI**：採用 Glassmorphism 毛玻璃設計，資訊卡片懸浮於地圖之上，清晰且不遮擋畫面。
- **即時官方資料**：介接「中央氣象署 (CWA) Open Data API」，取得最準確的在地天氣數據。
- **高擴充性圖層設計**：預留圖層選單 (Layer Switcher) 介面，未來可擴充環境部 AQI、台電即時用電、水庫水情等生活圖層。

## 🛠️ 技術棧 (Tech Stack)
- **前端框架 (Framework)**: React (Vite)
- **地圖套件 (Map Library)**: Leaflet + `react-leaflet`
- **樣式 (Styling)**: CSS (Glassmorphism Design)
- **資料請求 (API Requests)**: Native `fetch`
- **部署平台 (Deployment)**: Vercel

## 📂 文件導覽
- [`SPEC.md`](./SPEC.md): 專案完整規格與架構設計書。
- [`task.md`](./task.md): 開發階段與任務追蹤清單。
- [`Agents.md`](./Agents.md): 專供 AI 開發助手參考的行為準則與上下文。

## 🚀 本地開發 (Getting Started)
*(待專案以 Vite 初始化後補上安裝與啟動指令)*
