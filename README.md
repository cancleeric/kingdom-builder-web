# Kingdom Builder Web

[![Deploy](https://github.com/cancleeric/kingdom-builder-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/cancleeric/kingdom-builder-web/actions/workflows/deploy.yml)

Kingdom Builder 桌遊 Web 版 — 六角格策略棋盤遊戲

## 專案簡介

本專案旨在開發 Kingdom Builder 桌遊的網頁版本，讓玩家可以在瀏覽器中體驗這款經典的策略棋盤遊戲。遊戲使用六角格棋盤，玩家透過放置房屋來擴展自己的王國，並根據不同的目標卡獲取分數。

## 遊戲規則摘要

- **棋盤**: 由 4 個象限組成的六角格地圖，包含多種地形（草地、森林、沙漠、花田、峽谷等）
- **每回合**: 翻開一張地形卡，在該地形上放置 3 間房屋
- **相鄰規則**: 若已有房屋與該地形相鄰，新房屋必須放在相鄰位置
- **地點板塊**: 房屋碰到地點可獲得特殊能力板塊（如農場、港口等）
- **不可建造**: 山脈與水域不可放置房屋
- **城堡**: 相鄰城堡的房屋可得 3 分
- **目標卡**: 每場 3 張隨機目標卡決定得分方式

## 技術架構

| 層級 | 技術選型 | 說明 |
|------|----------|------|
| 前端框架 | React + TypeScript | 組件化開發，型別安全 |
| 渲染引擎 | HTML5 Canvas / SVG | 六角格棋盤繪製 |
| 狀態管理 | Zustand | 輕量級遊戲狀態管理 |
| 樣式 | CSS variables + handcrafted layout | 先快速做出可玩的原型介面 |
| 建置工具 | Vite | 快速開發與打包 |
| 測試 | Vitest + React Testing Library | 單元與組件測試 |
| 部署 | GitHub Pages | 透過 GitHub Actions 自動建置與部署 |

## 開發計劃 — 分階段進行

### Phase 1：核心基礎 (MVP)
> 目標：能在瀏覽器上看到棋盤並放置房屋

- [x] 專案初始化 (Vite + React + TypeScript)
- [x] 六角格座標系統設計 (Axial Coordinates)
- [x] 棋盤渲染 — SVG 六角格地圖
- [x] 地形系統 — 不同地形的視覺呈現
- [x] 基本放置邏輯 — 點擊格子放置房屋
- [x] 地形卡抽取機制
- [x] 相鄰規則實作

### Phase 2：完整規則
> 目標：實作所有遊戲規則

- [ ] 地點板塊系統（農場、港口、神殿等 8 種）
- [ ] 地點板塊能力觸發邏輯
- [x] 城堡得分機制
- [ ] 目標卡系統（漁夫、礦工、騎士等 10 種）
- [x] 回合流程控制（抽卡 → 放置房屋 → 自動換回合）
- [ ] 遊戲結束判定與計分

### Phase 3：遊戲體驗
> 目標：讓遊戲好玩且好用

- [ ] 棋盤隨機生成（4 象限隨機組合）
- [ ] 動畫效果（放置、移動、得分）
- [ ] 音效系統
- [ ] 遊戲 UI（玩家面板、計分板、行動記錄）
- [x] 回合提示與操作引導
- [ ] 悔棋 / 重新開始功能

### Phase 4：AI 對手
> 目標：可以單人對戰電腦

- [ ] 基礎 AI — 隨機合法放置
- [ ] 進階 AI — 策略評估（目標卡導向）
- [ ] AI 難度選擇

### Phase 5：多人連線 (Optional)
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

# 打包部署
npm run build
```

## GitHub 工作流程

- 功能開發：從 issue 建立分支，先 push 分支，再開 Draft PR
- PR 驗證：每次 push 與 pull request 都會執行 lint、test、build
- 正式部署：若 repo 方案支援 GitHub Pages，merge 到 main 後可由 GitHub Actions 自動部署
- Pages 路徑：production build 會自動使用 /kingdom-builder-web/ 作為 base path

### 目前雲端續作主線

- 核心目標：讓 GitHub 雲端 Copilot 能沿著既有 branch、Draft PR 與 GitHub Actions checks 持續開發。
- 目前活躍 issue：#53 隨機棋盤生成 v2
- 目前活躍 PR：#60 feat: random board generation v2 for issue #53
- 實作必須以 current main 為基準，不沿用已關閉的舊 PR 解法。

若目前 GitHub Pages 因 repository plan 無法啟用，可改用 Vercel 作為正式部署目標。

預計部署網址：

- https://cancleeric.github.io/kingdom-builder-web/

Vercel 備援：

- 匯入此 repository 至 Vercel
- Build Command: npm run build
- Output Directory: dist
- 使用 vercel.json 提供 SPA fallback

## 開發狀態

🚧 **Phase 1 已可互動遊玩**

目前已完成：

- SVG 六角格棋盤渲染
- 地形卡輪替
- 單人 3 間房屋放置流程
- 相鄰規則判定
- 城堡接觸得分
- 回合提示 Banner、合法格高亮、步驟指示器與換回合提示
- Vitest 規則測試

下一步建議：

- 完成 #53 的 QuadrantTemplate、旋轉、隨機抽取、20×20 拼板與單元測試
- 加入 location tiles 與特殊能力
- 引入多玩家與目標卡計分

## 授權

MIT License
