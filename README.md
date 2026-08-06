# TOEIC30 Web 🎯

> 30 天 TOEIC 高頻單字學習平台 — 智能單字卡 × 多口音發音 × 全題型測驗

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)

---

## 功能特色

### 📚 單字卡學習
- **6,800+ TOEIC 高頻單字**，按分數段分級（600 / 800 / 900+）
- **30 天學習計劃**，每天固定單字量，系統化攻克 TOEIC
- 單字資訊完整：英文、中文釋義、詞性、音標（IPA）、商務例句
- **收藏 ★** 與 **已背 ✓** 雙標籤，已背單字在測驗中降低出題機率

### 🔊 多口音發音系統
- 支援 **美音（US）/ 英音（UK）/ 澳音（AU）** 三種口音
- **All 模式**：一鍵連續播放三種口音（美 → 英 → 澳）
- 複選模式：自由勾選想聆聽的口音組合
- 例句發音同步套用已選口音與語速設定
- 語速三段調整：0.8× / 1.0× / 1.2×

### 📝 全題型智能測驗
- 四大題型：**英翻中 / 中翻英 / 聽力測驗 / 例句克漏字**
- 測驗範圍可選：當前單元 / 全書題庫 / 錯題本專項
- **作答時限**：無限制 / 10 秒 / 15 秒 / 20 秒（可調整）
- 鍵盤快捷鍵（1~4）加速作答
- 詳細成績報告與錯題記錄，支援一鍵錯題重測

### 🌙 介面設計
- 深色 / 淺色 / 跟隨系統三種主題
- 手機偵測自適應排版（隱藏側邊設定欄）
- 流暢動畫與微互動效果

---

## 技術架構

```
src/
├── components/
│   ├── Flashcard/      # 單字卡與 DynamicPickerHeader
│   ├── Quiz/           # 測驗主頁、全螢幕作答、結果頁
│   ├── Profile/        # 設定頁面
│   └── Layout/         # 頁籤導航、側邊欄
├── context/
│   └── AppContext.tsx   # 全域狀態管理
├── services/
│   ├── SpeechService.ts  # 多口音 TTS 引擎
│   ├── QuizEngine.ts     # 題目生成邏輯
│   ├── DataLoader.ts     # 單字資料載入
│   └── StorageService.ts # localStorage 持久化
└── types/              # TypeScript 型別定義
```

**技術選型**
- React 18 + TypeScript 5
- Vite 8（極速 HMR 開發體驗）
- Web Speech API（原生 TTS，無需後端）
- localStorage（設定 / 進度 / 收藏 / 錯題）

---

## 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 型別檢查 + 生產打包
npm run build
```

開發伺服器預設於 `http://localhost:5173`

---

## iOS 版本

本專案有對應的 Swift / SwiftUI iOS 原生 App：  
👉 [TOEIC30 iOS](https://github.com/Hao0820/TOEIC30)

---

## License

MIT © 2026 Wesley Li
