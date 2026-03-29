# Kingdom Builder Web

![CI](https://github.com/cancleeric/kingdom-builder-web/actions/workflows/ci.yml/badge.svg)

Kingdom Builder 桌遊 Web 版 — 六角格策略棋盤遊戲

## 專案簡介

本專案旨在開發 Kingdom Builder 桌遊的網頁版本，讓玩家可以在瀏覽器中體驗這款經典的策略棋盤遊戲。遊戲使用六角格棋盤，玩家透過放置房屋來擴展自己的王國，並根據不同的目標卡獲取分數。

## 遊戲規則（官方版）

### 遊戲目標

獲得最多金幣（gold）。金幣來自：3 張 Kingdom Builder 目標卡 + 城堡相鄰分數。

### 回合流程

1. 打出地形牌（手牌）
2. **強制動作**：在對應地形放 3 間房屋（遵守建造規則）
3. **選擇性動作**：使用地點板塊能力（可在強制動作前後使用）
4. 棄牌，從牌堆抽新牌

### 建造規則

- 可建地形：Grass（草地）、Canyon（峽谷）、Desert（沙漠）、Flower（花田）、Forest（森林）
- 不可建：Mountain（山脈）、Water（水域）
- **相鄰優先**：若玩家任一現有房屋相鄰於目標地形，新房屋「必須」建在現有房屋相鄰位置
- 若無任何相鄰位置，可建在地圖任意符合地形的空格

### 地點板塊（Location Tiles）共 8 種

| 板塊 | 效果 |
|------|------|
| Farm（農場）| 每回合可在任意草地放 1 間（遵守建造規則） |
| Harbor（港口）| 每回合可在任意水域旁放 1 間 |
| Oasis（綠洲）| 每回合可在任意沙漠放 1 間 |
| Tower（瞭望塔）| 每回合可在地圖任意邊緣格放 1 間 |
| Paddock（牧場）| 每回合可移動 1 間房屋 2 格 |
| Barn（倉庫）| 每回合可移動 1 間房屋到任意相同地形 |
| Oracle（神諭）| 每回合可在任意與現有房屋相鄰格放 1 間 |
| Tavern（酒館）| 每回合可在連續房屋列末端放 1 間 |

取得條件：將房屋建在地點格相鄰時，立即取得 1 個板塊（每個地點限拿 1 次）

### 結束條件

任一玩家用完所有 40 間房屋 → 完成本輪 → 結算

### 計分

- 3 張目標卡各自計分（10 種目標卡隨機取 3）
- 每個城堡相鄰至少 1 間自己的房屋 → 得 3 金

## 技術架構

| 層級 | 技術選型 | 說明 |
|------|----------|------|
| 前端框架 | React + TypeScript | 組件化開發，型別安全 |
| 渲染引擎 | HTML5 Canvas / SVG | 六角格棋盤繪製 |
| 狀態管理 | Zustand | 輕量級遊戲狀態管理 |
| 樣式 | Tailwind CSS | 快速 UI 開發 |
| 建置工具 | Vite | 快速開發與打包 |
| 測試 | Vitest + React Testing Library | 單元與組件測試 |
| 部署 | GitHub Pages / Vercel | 靜態網站部署 |

## 開發進度

| 階段 | 狀態 | 說明 | PR |
|------|------|------|----|
| Phase 1：核心基礎 (MVP) | ✅ 完成 | 六角格棋盤、地形系統、基本放置邏輯 | [#2](https://github.com/cancleeric/kingdom-builder-web/pull/2) |
| Phase 2：完整規則 | 🚧 開發中 | 地點板塊、目標卡、計分系統 | [#4](https://github.com/cancleeric/kingdom-builder-web/pull/4) |
| Phase 3：遊戲體驗 | 📋 計劃中 | 隨機棋盤、動畫、音效、UI 優化 | — |
| Phase 4：AI 對手 | 📋 計劃中 | 基礎 AI 與策略 AI | — |
| Phase 5：多人連線 | 📋 計劃中 | WebSocket 即時對戰（Optional） | — |

### Phase 1：核心基礎 (MVP) ✅
> 目標：能在瀏覽器上看到棋盤並放置房屋

- [x] 專案初始化 (Vite + React + TypeScript)
- [x] 六角格座標系統設計 (Axial / Cube Coordinates)
- [x] 棋盤渲染 — 繪製六角格地圖
- [x] 地形系統 — 不同地形的視覺呈現
- [x] 基本放置邏輯 — 點擊格子放置房屋
- [x] 地形卡抽取機制
- [x] 相鄰規則實作

### Phase 2：完整規則 🚧
> 目標：實作所有遊戲規則

- [ ] 地點板塊系統（Farm、Harbor、Oasis、Tower、Paddock、Barn、Oracle、Tavern）
- [ ] 地點板塊能力觸發邏輯
- [ ] 城堡得分機制
- [ ] 目標卡系統（10 種目標卡隨機取 3）
- [ ] 回合流程控制（抽卡 → 使用板塊 → 放置房屋 → 確認）
- [ ] 遊戲結束判定與計分

### Phase 3：遊戲體驗 📋
> 目標：讓遊戲好玩且好用

- [ ] 棋盤隨機生成（4 象限隨機組合）
- [ ] 動畫效果（放置、移動、得分）
- [ ] 音效系統
- [ ] 遊戲 UI（玩家面板、計分板、行動記錄）
- [ ] 回合提示與操作引導
- [ ] 悔棋 / 重新開始功能

### Phase 4：AI 對手 📋
> 目標：可以單人對戰電腦

- [ ] 基礎 AI — 隨機合法放置
- [ ] 進階 AI — 策略評估（目標卡導向）
- [ ] AI 難度選擇

### Phase 5：多人連線 📋 (Optional)
> 目標：可以與朋友線上對戰

- [ ] WebSocket 伺服器
- [ ] 房間系統（建立/加入）
- [ ] 即時同步遊戲狀態
- [ ] 聊天功能

## 專案結構

```
kingdom-builder-web/
├── public/
│   └── assets/          # 遊戲素材（圖片、音效）
├── src/
│   ├── components/      # React 組件
│   │   ├── Board/       # 棋盤相關組件
│   │   ├── UI/          # 介面組件
│   │   └── Game/        # 遊戲流程組件
│   ├── core/            # 遊戲核心邏輯
│   │   ├── hex.ts       # 六角格座標系統
│   │   ├── board.ts     # 棋盤邏輯
│   │   ├── terrain.ts   # 地形定義
│   │   ├── rules.ts     # 規則引擎
│   │   ├── scoring.ts   # 計分系統
│   │   └── location.ts  # 地點板塊邏輯
│   ├── store/           # 狀態管理
│   │   └── gameStore.ts
│   ├── ai/              # AI 對手
│   ├── types/           # TypeScript 型別定義
│   ├── utils/           # 工具函式
│   ├── App.tsx
│   └── main.tsx
├── tests/               # 測試檔案
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 執行測試
npm test

# 執行測試（含覆蓋率報告）
npm run test:coverage

# 打包部署
npm run build
```

CI 由 GitHub Actions 自動執行，每次 push 或 PR 皆會觸發測試流程。詳見 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)。

## 貢獻指南

歡迎任何形式的貢獻！以下是參與方式：

### 提交 PR

1. Fork 本倉庫並建立功能分支（`git checkout -b feat/your-feature`）
2. 確保程式碼通過所有測試（`npm test`）
3. 提交 PR 至 `main` 分支，描述清楚改動內容與動機
4. 等待 CI 通過（自動執行測試）後再請求 Review

### Review PR

- 請確認邏輯是否符合官方遊戲規則（見上方規則說明）
- 確認測試已覆蓋新增的邏輯
- 如有疑問請在 PR 留言討論

### 開發中的 PR

- [Phase 2 — 完整規則實作 (#4)](https://github.com/cancleeric/kingdom-builder-web/pull/4)：歡迎 review 地點板塊與計分邏輯

## 授權

MIT License
