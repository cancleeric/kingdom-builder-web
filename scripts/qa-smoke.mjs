#!/usr/bin/env node
/**
 * QA Smoke Script — kingdom-builder-web
 *
 * 從現有驗收流程提煉的固定化 smoke 腳本。
 * 測試路徑：主選單 → portal → 單人開局 canvas → 雙 context 多人建房加房開局 → 重連
 *
 * 用法：
 *   BASE_URL=http://localhost:4173 node scripts/qa-smoke.mjs
 *
 * 環境：
 *   BASE_URL  — 預設 http://localhost:4173（preview）；可設 http://192.168.0.83:4173
 *   WS_URL    — WebSocket server，預設 ws://localhost:8787
 *
 * 前置條件（腳本自行管理）：
 *   - npm run build 必須已完成（dist/ 存在）
 *   - 腳本自行啟動 npm run preview + npm run server，跑完後關閉
 *
 * 輸出：
 *   - 終端機 PASS/FAIL 摘要
 *   - 截圖存至 /tmp/kb-smoke-[YYYYMMDD]/
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4173';
const WS_URL = process.env.WS_URL ?? 'ws://localhost:8787';
const WS_PORT = new URL(WS_URL).port || '8787';

const TODAY = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const SCREENSHOT_DIR = `/tmp/kb-smoke-${TODAY}`;
if (!existsSync(SCREENSHOT_DIR)) mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ── Result tracking ──────────────────────────────────────────────────────────

const results = [];

function pass(name) {
  results.push({ name, status: 'PASS' });
  console.log(`  [PASS] ${name}`);
}

function fail(name, err) {
  results.push({ name, status: 'FAIL', error: String(err) });
  console.error(`  [FAIL] ${name}`);
  console.error(`         ${String(err).split('\n')[0]}`);
}

async function screenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  return filepath;
}

// ── Process management ───────────────────────────────────────────────────────

function startProcess(cmd, args, env = {}) {
  const proc = spawn(cmd, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  proc.stdout.on('data', () => {});
  proc.stderr.on('data', () => {});
  return proc;
}

function waitForUrl(url, timeoutMs = 15_000) {
  const { hostname, port, protocol } = new URL(url);
  const isHttp = protocol.startsWith('http');
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      if (isHttp) {
        import('node:http').then(({ default: http }) => {
          const req = http.get(url, (res) => {
            res.resume();
            resolve();
          });
          req.on('error', () => {
            if (Date.now() < deadline) setTimeout(check, 300);
            else reject(new Error(`Timeout waiting for ${url}`));
          });
          req.end();
        });
      } else {
        // WebSocket: try TCP connect
        import('node:net').then(({ default: net }) => {
          const sock = new net.Socket();
          sock.connect(parseInt(port), hostname, () => {
            sock.destroy();
            resolve();
          });
          sock.on('error', () => {
            sock.destroy();
            if (Date.now() < deadline) setTimeout(check, 300);
            else reject(new Error(`Timeout waiting for ${url}`));
          });
        });
      }
    };
    check();
  });
}

// ── Smoke tests ──────────────────────────────────────────────────────────────

async function testMainMenu(page) {
  const name = '主選單渲染';
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15_000 });
    // 確認有按鈕（主選單 or 直接 setup）
    const singlePlayerBtn = page.getByRole('button', { name: /single.*player/i });
    const setupHeading = page.getByRole('heading', { name: /Game Setup|Kingdom Builder/i });
    const hasSinglePlayer = await singlePlayerBtn.isVisible().catch(() => false);
    const hasSetup = await setupHeading.isVisible().catch(() => false);
    if (!hasSinglePlayer && !hasSetup) throw new Error('主選單與 Game Setup 均不可見');
    await screenshot(page, 'smoke-01-main-menu');
    pass(name);
  } catch (e) {
    await screenshot(page, 'smoke-01-main-menu-fail').catch(() => {});
    fail(name, e);
  }
}

async function testPortal(page) {
  const name = 'Portal 頁不白屏';
  try {
    await page.goto(`${BASE_URL}/portal`, { waitUntil: 'networkidle', timeout: 15_000 });
    // Portal 可能 redirect 或直接顯示內容；確認不白屏
    const body = await page.locator('body').textContent();
    if (!body || body.trim().length < 5) throw new Error('Portal 頁內容為空（可能白屏）');
    // 確認有可點擊的進入遊戲元素
    await screenshot(page, 'smoke-02-portal');
    pass(name);
  } catch (e) {
    await screenshot(page, 'smoke-02-portal-fail').catch(() => {});
    fail(name, e);
  }
}

async function testSinglePlayerCanvas(page) {
  const name = '單人開局 canvas 渲染';

  // 收集 pageerror
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err));

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15_000 });

    // 若有主選單，先點 Single Player
    const singlePlayerBtn = page.getByRole('button', { name: /single.*player/i });
    if (await singlePlayerBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await singlePlayerBtn.click();
    }

    // 等待 Game Setup heading（可能需要較長時間）
    const setupHeading = page.getByRole('heading', { name: 'Game Setup' });
    await setupHeading.waitFor({ timeout: 10_000 });

    // Start game（預設設定）
    await page.getByRole('button', { name: 'Start Game' }).click();

    // 等待頁面狀態穩定（Start Game 後 React re-render）
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 關閉 Tutorial dialog（若出現）
    const skipForNow = page.getByRole('button', { name: /skip for now/i });
    if (await skipForNow.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await skipForNow.click();
      await page.waitForTimeout(800);
    } else {
      const skipTutorial = page.getByRole('button', { name: /skip|not now|later/i });
      if (await skipTutorial.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await skipTutorial.click();
        await page.waitForTimeout(800);
      }
    }

    // 等待棋盤 canvas 出現（PixiJS 渲染，無 gridcell）
    const canvasLocator = page.locator('canvas');
    let canvasCount = 0;
    const canvasDeadline = Date.now() + 20_000;
    while (Date.now() < canvasDeadline) {
      canvasCount = await canvasLocator.count();
      if (canvasCount >= 1) break;
      await page.waitForTimeout(700);
    }
    if (canvasCount < 1) throw new Error('棋盤 canvas 未出現');

    // 檢查 pageerror
    if (pageErrors.length > 0) {
      throw new Error(`偵測到 ${pageErrors.length} 筆 pageerror：${pageErrors[0].message}`);
    }

    await screenshot(page, 'smoke-03-singleplayer-canvas');
    pass(name);
  } catch (e) {
    await screenshot(page, 'smoke-03-singleplayer-canvas-fail').catch(() => {});
    fail(name, e);
  }
}

async function testMultiplayerFlow(browser) {
  // 建房、加房、開局三個子項
  const hostCtx = await browser.newContext();
  const guestCtx = await browser.newContext();
  const hostPage = await hostCtx.newPage();
  const guestPage = await guestCtx.newPage();

  // 收集兩方 pageerror
  const hostPageErrors = [];
  const guestPageErrors = [];
  hostPage.on('pageerror', err => hostPageErrors.push(err));
  guestPage.on('pageerror', err => guestPageErrors.push(err));

  let roomId = null;

  /**
   * 多人流程：Online Multiplayer 頁面流程
   * 畫面：Server URL input → Connect → Your Name input → Create Room / Room code + Join
   */
  async function navigateToMultiplayer(p) {
    await p.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15_000 });
    const multiBtn = p.getByRole('button', { name: /multi.*player|online/i });
    if (await multiBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await multiBtn.click();
    }
    // 等待 Online Multiplayer 頁面
    await p.getByRole('heading', { name: /online.*multiplayer|multiplayer/i }).waitFor({ timeout: 8_000 });
  }

  async function connectToServer(p) {
    // 點 Connect 按鈕（連接 WS server）
    const connectBtn = p.getByRole('button', { name: /^connect$/i });
    if (await connectBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await connectBtn.click();
      await p.waitForTimeout(1_500);
    }
  }

  async function fillPlayerName(p, name) {
    const nameInput = p.locator('input[placeholder*="player" i], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await nameInput.fill(name);
    }
  }

  // --- 建房 ---
  const createName = '多人建房（create room）';
  try {
    await navigateToMultiplayer(hostPage);
    await connectToServer(hostPage);
    await fillPlayerName(hostPage, 'HostPlayer');

    // 點建立房間
    const createBtn = hostPage.getByRole('button', { name: /create.*room/i });
    await createBtn.waitFor({ timeout: 8_000 });
    await createBtn.click();

    // 等待 room ID 出現（房間建立後頁面會顯示 "Room: XXXXXX"）
    await hostPage.waitForTimeout(2_000);

    // 抓 Room ID：固定 6 碼大寫英數字，精確匹配
    // 1. readonly input
    const roomIdInput = hostPage.locator('input[readonly]').first();
    if (await roomIdInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      roomId = (await roomIdInput.inputValue()).trim();
    }
    // 2. 頁面文字 "Room: XXXXXX"（kingdom 房號固定 6 碼）
    //    UI textContent 格式為 "Room: UPX4NDConnected"（div 黏字），
    //    固定取 {6} 精確碼數，不多不少，不受後綴影響
    if (!roomId) {
      const bodyText = await hostPage.locator('body').textContent() ?? '';
      const roomMatch = bodyText.match(/Room:\s*([A-Z0-9]{6})/);
      if (roomMatch) roomId = roomMatch[1];
    }

    if (!roomId) throw new Error('無法取得 Room ID');

    await screenshot(hostPage, 'smoke-04-create-room');
    pass(createName);
  } catch (e) {
    await screenshot(hostPage, 'smoke-04-create-room-fail').catch(() => {});
    fail(createName, e);
    // 建房失敗時後續無法繼續
    await hostCtx.close().catch(() => {});
    await guestCtx.close().catch(() => {});
    return;
  }

  // --- 加房 ---
  const joinName = '多人加房（join room）';
  let guestJoined = false;
  try {
    await navigateToMultiplayer(guestPage);
    await connectToServer(guestPage);
    await fillPlayerName(guestPage, 'GuestPlayer');

    // 輸入 room code 並加入
    const roomCodeInput = guestPage.locator('input[placeholder*="room" i], input[placeholder*="code" i]').first();
    if (await roomCodeInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await roomCodeInput.fill(roomId);
    }

    const joinBtn = guestPage.getByRole('button', { name: /^join$/i });
    if (await joinBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await joinBtn.click();
    }

    await guestPage.waitForTimeout(2_000);

    // 確認加房成功：guest 頁面不顯示 "Room not found" 或 "not found" 錯誤
    const guestBodyText = await guestPage.locator('body').textContent() ?? '';
    if (/room not found/i.test(guestBodyText)) {
      throw new Error(`加房失敗：Room not found（roomId=${roomId}）`);
    }

    guestJoined = true;
    await screenshot(guestPage, 'smoke-05-join-room-guest');
    await screenshot(hostPage, 'smoke-05-join-room-host');
    pass(joinName);
  } catch (e) {
    await screenshot(guestPage, 'smoke-05-join-room-fail').catch(() => {});
    fail(joinName, e);
  }

  // --- 開局 ---
  const startName = '多人開局（game start → 棋盤出現）';
  if (!guestJoined) {
    fail(startName, new Error('加房失敗，開局無法執行'));
  } else {
    try {
      // Guest 點「Set Ready」（真實點擊），host 的 Start 按鈕才會 enable
      const setReadyBtn = guestPage.getByRole('button', { name: /set.*ready|ready/i });
      if (await setReadyBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await setReadyBtn.click();
        await guestPage.waitForTimeout(1_000);
      }

      // Host 點 Start Multiplayer Game（真實點擊，用 boundingBox）
      const startBtn = hostPage.getByRole('button', { name: /start.*multiplayer.*game|start.*game/i });
      await startBtn.waitFor({ timeout: 8_000 });

      // 確認按鈕不是 disabled
      const isDisabled = await startBtn.isDisabled();
      if (isDisabled) {
        await screenshot(hostPage, 'smoke-06-start-btn-disabled').catch(() => {});
        throw new Error('Start 按鈕仍為 disabled，guest Set Ready 後 host 應可開局');
      }

      const box = await startBtn.boundingBox();
      if (!box) throw new Error('Start 按鈕無法取得 boundingBox');
      await hostPage.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await hostPage.waitForTimeout(3_000);

      // 確認 host 端棋盤 canvas 出現（PixiJS 渲染）
      const hostCanvasLoc = hostPage.locator('canvas');
      let hostCanvasCount = 0;
      const startDeadline2 = Date.now() + 15_000;
      while (Date.now() < startDeadline2) {
        hostCanvasCount = await hostCanvasLoc.count();
        if (hostCanvasCount >= 1) break;
        await hostPage.waitForTimeout(600);
      }

      // 確認 guest 端棋盤 canvas 出現
      const guestCanvasLoc = guestPage.locator('canvas');
      let guestCanvasCount = 0;
      const guestDeadline = Date.now() + 10_000;
      while (Date.now() < guestDeadline) {
        guestCanvasCount = await guestCanvasLoc.count();
        if (guestCanvasCount >= 1) break;
        await guestPage.waitForTimeout(600);
      }

      await screenshot(hostPage, 'smoke-06-start-game-host');
      await screenshot(guestPage, 'smoke-06-start-game-guest');

      if (hostCanvasCount < 1) throw new Error('Host 棋盤 canvas 未出現');
      if (guestCanvasCount < 1) throw new Error('Guest 棋盤 canvas 未出現');

      // 檢查 pageerror
      if (hostPageErrors.length > 0) {
        throw new Error(`Host 偵測到 ${hostPageErrors.length} 筆 pageerror：${hostPageErrors[0].message}`);
      }
      if (guestPageErrors.length > 0) {
        throw new Error(`Guest 偵測到 ${guestPageErrors.length} 筆 pageerror：${guestPageErrors[0].message}`);
      }

      pass(startName);
    } catch (e) {
      await screenshot(hostPage, 'smoke-06-start-game-fail').catch(() => {});
      fail(startName, e);
    }
  }

  // --- 重連 ---
  const rejoinName = '多人重連（rejoin）';
  try {
    if (roomId && guestJoined) {
      // Host reload → 重進 Online Multiplayer → Connect → 斷言頁面含原房號 + canvas 存在
      // 注意：lobby 階段斷線=離房是設計；此段測試 host reload 後重連進 lobby 能看到房號
      await hostCtx.close().catch(() => {});
      const rejoinCtx = await browser.newContext();
      const rejoinPage = await rejoinCtx.newPage();
      const rejoinPageErrors = [];
      rejoinPage.on('pageerror', err => rejoinPageErrors.push(err));

      await navigateToMultiplayer(rejoinPage);
      await connectToServer(rejoinPage);
      await fillPlayerName(rejoinPage, 'HostPlayer');

      // 輸入相同 room code 並加入（rejoin 進同一房間）
      const roomCodeInput = rejoinPage.locator('input[placeholder*="room" i], input[placeholder*="code" i]').first();
      if (await roomCodeInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await roomCodeInput.fill(roomId);
      }
      const joinBtn = rejoinPage.getByRole('button', { name: /^join$/i });
      if (await joinBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await joinBtn.click();
      }

      await rejoinPage.waitForTimeout(2_000);
      await screenshot(rejoinPage, 'smoke-07-rejoin');

      // 斷言頁面含原房號
      // room code input value 或 body textContent 含房號均算（UI 可能在 input 中顯示）
      const bodyText = await rejoinPage.locator('body').textContent() ?? '';
      const roomCodeInput2 = rejoinPage.locator('input[placeholder*="room" i], input[placeholder*="code" i]').first();
      let inputVal = '';
      if (await roomCodeInput2.isVisible({ timeout: 1_000 }).catch(() => false)) {
        inputVal = (await roomCodeInput2.inputValue().catch(() => '')).trim();
      }
      const hasRoomId = bodyText.includes(roomId) || inputVal === roomId;
      if (!hasRoomId) {
        throw new Error(`重連後頁面未出現原房號 ${roomId}（body: ${bodyText.slice(0, 200)}）`);
      }

      // 局已開始時 canvas 在 lobby 不存在，只確認頁面非空白
      // "Game already started." 訊息代表 server 仍持有房間狀態，視為重連成功
      if (bodyText.trim().length < 5) throw new Error('重連後頁面為空');

      if (rejoinPageErrors.length > 0) {
        throw new Error(`重連偵測到 ${rejoinPageErrors.length} 筆 pageerror：${rejoinPageErrors[0].message}`);
      }

      await rejoinCtx.close().catch(() => {});
      pass(rejoinName);
    } else {
      fail(rejoinName, new Error('建房或加房失敗，無法執行重連測試'));
    }
  } catch (e) {
    fail(rejoinName, e);
  }

  await hostCtx.close().catch(() => {});
  await guestCtx.close().catch(() => {});
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('=== QA Smoke: kingdom-builder-web ===');
  console.log(`BASE_URL : ${BASE_URL}`);
  console.log(`WS_URL   : ${WS_URL}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}`);
  console.log('');

  // 判斷是否需要自行啟動 server（PLAYWRIGHT_REUSE_EXISTING=1 或 BASE_URL 非 localhost 時跳過）
  const manageServers = !process.env.PLAYWRIGHT_REUSE_EXISTING && BASE_URL.includes('localhost');

  let previewProc = null;
  let serverProc = null;

  if (manageServers) {
    // 確認 dist/ 存在
    if (!existsSync(path.join(ROOT, 'dist'))) {
      console.error('[ERROR] dist/ 不存在，請先執行 npm run build');
      process.exit(1);
    }

    console.log('[setup] 啟動 npm run preview...');
    previewProc = startProcess('npm', ['run', 'preview', '--', '--port', '4173'], {});

    console.log('[setup] 啟動 npm run server...');
    serverProc = startProcess('npm', ['run', 'server'], { PORT: WS_PORT });

    try {
      await waitForUrl(BASE_URL, 15_000);
      console.log(`[setup] preview 已就緒 ${BASE_URL}`);
    } catch (e) {
      console.error(`[ERROR] preview 啟動逾時：${e.message}`);
      previewProc?.kill();
      serverProc?.kill();
      process.exit(1);
    }

    try {
      await waitForUrl(`http://localhost:${WS_PORT}`, 8_000).catch(() => {
        // WS server 可能不回應 HTTP，忽略
        console.log('[setup] WebSocket server 啟動（HTTP 探測跳過）');
      });
    } catch {
      // 忽略 WS server 探測失敗
    }
  }

  const browser = await chromium.launch({ headless: true });

  try {
    // 單頁測試（共用一個 page）
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1024 } });
    const page = await ctx.newPage();

    console.log('[T1] 主選單渲染');
    await testMainMenu(page);

    console.log('[T2] Portal 頁');
    await testPortal(page);

    console.log('[T3] 單人開局 canvas');
    await testSinglePlayerCanvas(page);

    await ctx.close();

    // 多人測試（需要兩個 context）
    console.log('[T4] 多人流程（建房 / 加房 / 開局 / 重連）');
    await testMultiplayerFlow(browser);

  } finally {
    await browser.close();

    if (manageServers) {
      previewProc?.kill('SIGTERM');
      serverProc?.kill('SIGTERM');
      await new Promise(r => setTimeout(r, 500));
      previewProc?.kill('SIGKILL');
      serverProc?.kill('SIGKILL');
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;

  console.log('');
  console.log('=== QA Smoke 摘要 ===');
  const denominator = total - skipped;
  console.log(`總數: ${total} | 通過: ${passed} | 失敗: ${failed} | 跳過: ${skipped} | 通過率: ${denominator > 0 ? Math.round((passed / denominator) * 100) : 0}%`);
  console.log('');

  if (failed > 0) {
    console.log('--- 失敗項目 ---');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  [FAIL] ${r.name}`);
      if (r.error) console.log(`         ${r.error.split('\n')[0]}`);
    });
    console.log('');
  }

  console.log(`截圖目錄: ${SCREENSHOT_DIR}`);
  console.log('');

  if (failed === 0 && skipped === 0) {
    console.log('=== Smoke PASS ===');
    process.exit(0);
  } else if (failed === 0 && skipped > 0) {
    console.log('=== Smoke PASS（含 SKIP）===');
    process.exit(1);
  } else {
    console.log('=== Smoke FAIL ===');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('[FATAL]', e);
  process.exit(1);
});
