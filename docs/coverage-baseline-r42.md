# Coverage Baseline — R42 (2026-06-10)

產出自 `npm run test:coverage`（@vitest/coverage-v8）

## 整體四維數字

| 維度 | 實際 % | Gate | 狀態 |
|------|--------|------|------|
| Statements | 50.12% (2048/4086) | 40% | PASS |
| Branches | 41.97% (1039/2475) | 30% | PASS |
| Functions | 44.10% (453/1027) | 40% | PASS |
| Lines | 50.51% (1850/3662) | 40% | PASS |

Tests: 660 passed / 37 test files

---

## 前 10 低覆蓋核心模組（依 Lines % 由低到高）

| 排名 | 模組路徑 | Statements % | Functions % | Branches % | Lines % | 備註 |
|------|---------|-------------|-------------|------------|---------|------|
| 1 | `src/store/multiplayerStore.ts` | 0% | 0% | 0% | 0% | 多人 store，完全無測試 |
| 2 | `src/multiplayer/wsClient.ts` | 0% | 0% | 100% | 0% | WS 客戶端，完全無測試 |
| 3 | `src/multiplayer/nodeCryptoStub.ts` | 0% | 0% | 100% | 0% | crypto stub |
| 4 | `src/mapEditor/devExpose.ts` | 0% | 0% | 0% | 0% | 開發用 expose，低優先 |
| 5 | `src/components/Board/PixiBoard.tsx` | 0% | 0% | 0% | 0% | PIXI 渲染層，UI-heavy |
| 6 | `src/core/rules.ts` | 64.7% | 60% | 80% | 62.5% | 核心規則邏輯，T2 補測重點 |
| 7 | `src/hooks/useModal.ts` | 58.82% | 63.63% | 40.74% | 55.55% | Modal hook |
| 8 | `src/store/replayStore.ts` | 61.53% | 92.3% | 15.78% | 60% | Replay 狀態 |
| 9 | `src/store/gameStore.ts` | 58.58% | 58.62% | 47.8% | 62.41% | 主遊戲 store，T2 補測重點 |
| 10 | `src/hooks/useBoardTransform.ts` | 62.06% | 64.7% | 36.36% | 59.75% | 棋盤 transform hook |

---

## 高覆蓋模組（參考）

| 模組路徑 | Lines % | 說明 |
|---------|---------|------|
| `src/core/board.ts` | 91.17% | 棋盤核心，測試充足 |
| `src/core/hex.ts` | 95.23% | 六角格計算 |
| `src/core/location.ts` | 96.29% | 地點邏輯 |
| `src/core/scoring.ts` | 95.2% | 計分邏輯 |
| `src/ai/botPlayer.ts` | 98.05% | AI 玩家 |
| `src/store/tutorialStore.ts` | 95.65% | 教學 store |
| `src/mapEditor/codec.ts` | 100% | 地圖編解碼 |

---

## T2 補測優先目標（依本基線）

1. `src/store/multiplayerStore.ts` — 0% → 補 joinRoom/leaveRoom/setGameState/hydrate 邊界（呼應 issue #183）
2. `src/multiplayer/wsClient.ts` — 0% → 補 WS 連線/斷線/重試/訊息收發（mock WebSocket）
3. `src/core/rules.ts` — 62.5% → 補第 79-114 行邏輯覆蓋（核心規則邊界）
4. `src/store/gameStore.ts` — 62.41% → 補 playerCount 邊界、botDifficulty 切換、undo 多步
5. `src/store/replayStore.ts` — 60% → 補 branches（15.78% 極低）

---

*注意：`src/components/icons/` 整體 3.84% 為純 SVG icon 元件，無行為邏輯，T2 不列入補測範圍。*
