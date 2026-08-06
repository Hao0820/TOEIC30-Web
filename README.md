# TOEIC 30 Web (多益 30 天金色證書衝刺網頁版) 🎯

現代化、響應式且具備玻璃擬態（Glassmorphism）與多國語音真人口音朗讀的 TOEIC 核心高頻單字學習與實戰測驗 Web 應用程式。

---

## 🌟 核心特色

1. **完整 6,800+ 多益題庫與 30 天商務情境主題**
   - 30 天情境分類（雇用、商業、會議、經濟、行銷、契約等）
   - 4 大多益分數目標等級階梯（核心基礎、600分必備、800分進階、900分滿分衝刺）
   - 包含精確音標、詞性、繁體中文釋義、高頻商務全真例句與中文翻譯。

2. **多國口音真人口音朗讀 (Web Speech API / Apple Neural Engine)**
   - 支援 🇺🇸 美式、🇬🇧 英式、🇦🇺 澳式、🇨🇦 加拿大 等多國多益實戰口音與隨機口音切換。
   - 智慧發音修正（包含名詞 `résumé` 履歷表之標準重音識別）。
   - 支援 0.7x ~ 1.3x 語速無級調節。
   - 單字發音按鈕穩定防抖，帶來極致流暢的視覺與聽覺體驗。

3. **實戰全真模擬測驗系統 (Anti-Cheating & Smart Distractors)**
   - **4 大實戰題型**：英翻中、中翻英、聽力測驗、例句克漏字填空。
   - **智慧干擾項算法**：同單元、同詞性智能混淆，杜絕猜題作弊。
   - **15 秒倒數計時與鍵盤快捷鍵**（`1` ~ `4` 作答）。
   - **慶祝特效**：達到 80% 以上自動施放五彩紙屑（Confetti）動畫。
   - **🔥 錯題一鍵立即重測** 與 **總錯題本自動累積** 機制。

4. **個人化進度與深度記憶管理**
   - 自動記憶各單元單字學習進度（Day 幾停在第幾個單字，下次進來無縫接軌）。
   - 收藏單字庫（★）支援快速檢索與語音複習。
   - 連續學習天數（Streak）統計與測驗正確率分析。
   - OLED 深色模式 / 明亮淺色模式自適應切換。

---

## 🚀 快速啟動指南

### 安裝依賴
```bash
cd /Users/wesley/Documents/projects/TOEIC30-Web
npm install
```

### 啟動本地開發伺服器
```bash
npm run dev
```
啟動後在瀏覽器開啟 `http://localhost:5173` 即可立即開始學習。

### 建置生產環境
```bash
npm run build
```

---

## ⌨️ 鍵盤快捷鍵

| 快捷鍵 | 功能 |
| :--- | :--- |
| **Space** | 播放目前單字真人發音 |
| **← / →** | 切換上一個 / 下一個單字 |
| **F** | 收藏 / 取消收藏目前單字 |
| **1 ~ 4** | 測驗模式下快速選擇選項 A, B, C, D |

---

## 📁 專案架構

```text
TOEIC30-Web/
├── public/
│   ├── data/
│   │   ├── days/      # 30 天單元 JSON 資料 (Day 01 ~ 30)
│   │   └── levels/    # 4 大分數等級 JSON 資料 (basic, 600, 800, 900)
│   └── favicon.svg    # 高解析度向量 Logo
├── src/
│   ├── components/
│   │   ├── Flashcard/ # 單字卡片、單字清單彈窗
│   │   ├── Quiz/      # 測驗設定、全螢幕測驗、成績單、錯題解析
│   │   ├── Profile/   # 收藏庫、錯題本、個人設定
│   │   ├── Navbar.tsx # 頂部導航與單元切換器
│   │   └── TabBar.tsx # 底部懸浮導航欄
│   ├── context/       # AppContext 全域狀態管理
│   ├── services/      # DataLoader, SpeechService, StorageService, QuizEngine
│   ├── types/         # TypeScript 資料型別定義
│   ├── App.tsx        # 核心 App 入口
│   ├── index.css      # Glassmorphism 設計系統與主題樣式
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 📄 版權聲明
TOEIC® 是 Educational Testing Service (ETS) 的註冊商標。本 Web 專案為獨立學習輔助工具，與 ETS 無任何商業關聯。
