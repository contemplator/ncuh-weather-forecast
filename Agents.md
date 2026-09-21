# AI Agent Rules for Weather & Life Map

這份文件定義了 AI Agent 在協助開發「Weather & Life Map」專案時，應遵守的行為準則與專案上下文。

## 🎯 專案核心目標
- 這是一個基於 **React (Vite)** 與 **Leaflet** 的前端互動地圖專案。
- **資料來源**：中央氣象署 (CWA) Open Data API。
- **視覺風格**：必須嚴格遵守「玻璃擬物化 (Glassmorphism)」與「現代清新風」，保持 UI 簡潔，背景為滿版地圖。

## 📝 開發與行為規範
1. **開發進度依循**：所有開發步驟必須參照專案根目錄下的 [`task.md`](./task.md) 進行，幫助使用者追蹤進度。
2. **架構與規格遵循**：任何架構變更或技術選型，必須符合 [`SPEC.md`](./SPEC.md) 中的定義。
3. **階段性開發 (Phasing)**：
   - **Phase 1** 絕對不涉及後端資料庫，僅允許使用 `localStorage` 存放狀態。資料一律由前端直接向 API 拉取。
   - 避免過度工程化 (Over-engineering)，請以滿足 `task.md` 上的當下目標為優先。
4. **程式碼撰寫風格**：
   - 統一使用 Functional Components 與 React Hooks。
   - 地圖相關實作請優先使用 `react-leaflet` 的元件化寫法。
   - UI 樣式優先實作毛玻璃效果 (`backdrop-filter: blur`)。
5. **部署相容性**：
   - 目標部署環境為 Vercel。
   - 確保環境變數的使用方式符合 Vite 規範 (`import.meta.env.VITE_XXX`)。
