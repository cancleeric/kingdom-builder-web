# CEO 親測 Checklist — kingdom-builder-web

> 每輪 PR merge 前 CEO 必跑此清單。所有項目打勾 + 截圖存檔後才允許 merge。
> 本機驗證為準；不進 docker。

---

## 0. 本機驗證前置（每次必跑）

```bash
cd /Users/yinghaowang/HurricaneDigital/kingdom-builder-web

# 1. 完整 build（tsc -b + vite build，不是只跑 vite build）
npm run build
# 預期：Build 成功，無 TypeScript 編譯錯誤，dist/ 產出

# 2. Unit 測試全跑
npx vitest run
# 預期：所有 test 全綠（0 failed）

# 3. 啟動 preview + server（背景）
npm run preview &
PREVIEW_PID=$!
npm run server &
SERVER_PID=$!
sleep 3

# 4. （選擇性）跑 Playwright smoke
npx playwright test --project=chromium tests/e2e/game.spec.ts
# 完成後：kill $PREVIEW_PID $SERVER_PID
```

截圖命名：`ceo-verify-build-[YYYYMMDD].png`（終端機最後數行，含 build 成功 + test 通過數）

---

## 1. 單人遊戲核心路徑

### 1a. 新遊戲 + 落子 + Undo

**操作步驟**：
1. 開啟 `http://localhost:4173`（preview port）
2. 點擊主選單「單人遊戲」或「Local Game」
3. 選擇玩家數（2 人）、確認進入遊戲
4. 落子：用滑鼠點擊棋盤上任意 3 個合法格
5. 點擊「Undo」按鈕一次
6. 確認棋盤退回第 2 步後的狀態

**預期結果**：
- 棋盤正確顯示，無白屏、無黑屏
- 落子後棋盤格狀態正確更新
- Undo 後退一步，計分不溢出
- console 無 uncaught error

**截圖命名**：`ceo-verify-singleplayer-[YYYYMMDD].png`

- [ ] 通過

---

### 1b. Bot 對戰

**操作步驟**：
1. 選擇「vs Bot」模式
2. 設定玩家 1 為人類，玩家 2 為 Bot
3. 點擊開始遊戲
4. 落子一步，等待 Bot 回應（最多 5 秒）

**預期結果**：
- Bot 自動落子，回合正確切換至玩家 1
- 回合指示器（turn indicator）顯示正確玩家
- 不出現無限等待或 JS error

**截圖命名**：`ceo-verify-bot-[YYYYMMDD].png`

- [ ] 通過

---

## 2. Portal 入口

**操作步驟**：
1. 開啟 `http://localhost:4173/portal`（或從主畫面進入 Portal 頁）
2. 確認選單項目可點擊（單人遊戲、多人遊戲）
3. 點擊「單人遊戲」，確認跳頁後遊戲正常載入，不白屏

**預期結果**：
- Portal 頁正常渲染，無裸 HTML（Tailwind 樣式有效）
- 選單按鈕可見、可點
- 進入遊戲頁面後不白屏、棋盤出現

**截圖命名**：`ceo-verify-portal-[YYYYMMDD].png`

- [ ] 通過

---

## 3. 多人模式

**操作步驟**：
1. 在 Tab A：開啟 `http://localhost:4173`，進入多人大廳，點「建立房間」
2. 複製 Room ID（顯示在畫面上）
3. 開啟 Tab B：進入多人大廳，貼上 Room ID，點「加入房間」
4. 確認 Tab A 顯示 2 名玩家
5. 在 Tab A 點「開始遊戲」
6. 確認兩個 Tab 均顯示棋盤

**預期結果**：
- Room ID 正確傳遞
- 兩個 context 都看到棋盤
- 無 WebSocket connection error 於 console

**截圖命名**：`ceo-verify-multiplayer-[YYYYMMDD].png`（Tab A + Tab B 各一張）

- [ ] 通過

---

## 4. 設定頁 — 語言切換

**操作步驟**：
1. 進入「設定」（Settings）頁面
2. 切換語言（例如：繁體中文 ↔ English）
3. 回到主選單或遊戲頁面

**預期結果**：
- 文字語言正確切換，無 fallback key（不顯示 `i18n.key.name`）
- 頁面不需重新整理即可看到語言變化

**截圖命名**：`ceo-verify-settings-[YYYYMMDD].png`

- [ ] 通過

---

## 5. 行動裝置模擬（DevTools）

**操作步驟**：
1. Chrome DevTools → Toggle Device Toolbar（Ctrl+Shift+M）
2. 選擇「iPhone 14 Pro」或 375px x 812px
3. 開啟 `http://localhost:4173`
4. 進入遊戲，嘗試：
   - 雙指捏合縮放棋盤（trackpad: 捏合手勢）
   - 單指拖曳棋盤（按住並移動）

**預期結果**：
- 棋盤可縮放（pinch-zoom）
- 棋盤可拖曳（pan）
- 落子點擊不被 pan 吞掉（小位移 < 5px 應視為點擊）

**截圖命名**：`ceo-verify-mobile-[YYYYMMDD].png`

- [ ] 通過

---

## 6. 賣相檢查（必過才算 QA 完成）

| 項目 | 檢查方式 | 通過條件 |
|------|---------|---------|
| 非全白/全黑 | 目視棋盤與選單 | 至少 3 種顏色可辨識 |
| Tailwind 樣式有效 | DevTools 查元素 computed style | 非 0px padding/margin 不合理值 |
| grain/美術質感 | 目視棋盤格 | grain 效果存在但不過重（非靜電感） |
| 背景 motif | 目視整體畫面 | 有視覺特色，非純色空白 |
| 字型清晰 | 目視文字 | 不模糊、不截字 |

- [ ] 賣相全過

---

## 截圖命名總覽

```
ceo-verify-build-[YYYYMMDD].png
ceo-verify-singleplayer-[YYYYMMDD].png
ceo-verify-bot-[YYYYMMDD].png
ceo-verify-portal-[YYYYMMDD].png
ceo-verify-multiplayer-[YYYYMMDD].png   (Tab A)
ceo-verify-multiplayer-b-[YYYYMMDD].png (Tab B)
ceo-verify-settings-[YYYYMMDD].png
ceo-verify-mobile-[YYYYMMDD].png
```

存放路徑：`/tmp/kingdom-ceo-verify/[日期]/`

---

## Checklist 總覽

- [ ] 0. build + vitest 全綠
- [ ] 1a. 單人落子 + Undo
- [ ] 1b. Bot 對戰回合切換
- [ ] 2. Portal 不白屏
- [ ] 3. 多人建房/加房/開局
- [ ] 4. 語言切換
- [ ] 5. 行動裝置縮放/拖曳
- [ ] 6. 賣相通過

**全勾才算 QA 通過，可 merge。**
