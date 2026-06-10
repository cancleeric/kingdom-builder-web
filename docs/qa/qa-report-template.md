# QA 報告 — kingdom-builder-web [YYYY-MM-DD]

> 模板說明：每輪 PR merge 前，QA 或 CTO 填寫並附在 PR description 或以 comment 貼出。
> 請將 `[...]` 括號內容替換為真實數字。

---

## 環境

| 項目 | 值 |
|------|---|
| 報告日期 | [YYYY-MM-DD] |
| Commit | [git log --oneline -1 的 hash 與訊息] |
| Branch | [feat/r42-xxx] |
| Node 版本 | [node --version] |
| 測試機器 | [本機 Mac / CI GitHub Actions] |
| BASE_URL | [http://localhost:4173 或 http://192.168.0.83:4173] |

---

## 測試摘要

| 類型 | 總數 | 通過 | 失敗 | 跳過 | 通過率 |
|------|------|------|------|------|--------|
| Unit（vitest） | [X] | [X] | [X] | [X] | [X%] |
| E2E（Playwright chromium） | [X] | [X] | [X] | [X] | [X%] |
| Smoke（qa-smoke.mjs） | [X] | [X] | [X] | [X] | [X%] |

Coverage（若有 T1 基建）：

| 指標 | 數值 |
|------|------|
| Lines | [X%] |
| Functions | [X%] |
| Branches | [X%] |
| Statements | [X%] |

---

## 失敗項目

> 若無失敗，填「無」並刪除下表。

| 測試名稱 | 類型 | 錯誤訊息 | 嚴重程度 |
|----------|------|---------|---------|
| [test name] | [Unit/E2E/Smoke] | [error message] | [P0/P1/P2] |

---

## 重現步驟（針對失敗項）

> 每個失敗項目一節，無失敗則刪除本節。

### [失敗測試名稱]

**重現步驟**：
1. 啟動 `npm run preview`
2. 開啟 `http://localhost:4173`
3. [操作步驟...]

**預期結果**：[描述預期行為]

**實際結果**：[描述實際發生的問題]

**Console Error**：
```
[貼上 console error 內容]
```

**截圖**：[截圖路徑或圖片]

---

## 跳過項目說明

> 若有 skip，說明原因。

| 測試名稱 | 跳過原因 | 對應 Issue |
|----------|---------|-----------|
| [test name] | [原因：功能未完成/環境問題/待 T1 完成等] | [#issue 號] |

---

## 截圖清單

> 截圖存放路徑：`/tmp/kb-smoke-[YYYYMMDD]/` 或 `/tmp/kingdom-ceo-verify/[日期]/`

| 截圖檔名 | 說明 |
|---------|------|
| `smoke-01-main-menu.png` | 主選單渲染 |
| `smoke-02-portal.png` | Portal 頁 |
| `smoke-03-singleplayer-canvas.png` | 單人遊戲棋盤 |
| `smoke-04-create-room.png` | 多人建房 |
| `smoke-05-join-room-host.png` | 加房後 host 端 |
| `smoke-05-join-room-guest.png` | 加房後 guest 端 |
| `smoke-06-start-game-host.png` | 開局 host 棋盤 |
| `smoke-06-start-game-guest.png` | 開局 guest 棋盤 |
| `smoke-07-rejoin.png` | 重連後畫面 |

---

## 品質結論

- [ ] Unit 全綠（0 failed）
- [ ] E2E chromium 通過率 ≥ 基線
- [ ] Smoke 通過率 ≥ 70%（7 項中 ≥ 5 項 PASS）
- [ ] build（tsc -b + vite build）無錯誤
- [ ] Coverage gates 通過（lines ≥ 40%，branches ≥ 30%）

**結論**：[可 merge / 需修復後再測 / 阻擋 merge]

---

*QA: hDigital QA Lead | 版本: 1.0 | 2026-06-10*
