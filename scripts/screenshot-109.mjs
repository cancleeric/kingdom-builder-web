/**
 * Screenshot script for Issue #109 Game Screen redesign validation.
 * Takes 5 screenshots as required by the acceptance checklist.
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:5200';
const OUT = '/tmp/screenshots';

async function setupGame(page) {
  // Navigate to main page
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Start a game: 2 human players, small board
  // Click "Start Game" button — fill in defaults
  await page.waitForSelector('button:has-text("Start Game"), button:has-text("開始遊戲")', { timeout: 10000 });
  await page.click('button:has-text("Start Game"), button:has-text("開始遊戲")');

  // Wait for game board to appear
  await page.waitForSelector('[aria-label*="Kingdom Builder"], [role="status"]', { timeout: 10000 });
  await page.waitForTimeout(500);
}

const browser = await chromium.launch({ headless: true });

// ── 1. Desktop 1440 — DrawCard phase ──────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await setupGame(page);
  // Should be in DrawCard phase at game start
  await page.screenshot({ path: `${OUT}/109-game-drawcard.png`, fullPage: false });
  console.log('✓ 109-game-drawcard.png');
  await ctx.close();
}

// ── 2. Desktop 1440 — Place phase ─────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await setupGame(page);

  // Click Draw Card button to enter PlaceSettlements phase
  const drawBtn = page.locator('button[aria-label*="Draw terrain"], button:has-text("Draw Terrain Card"), button:has-text("抽地形卡")').first();
  await drawBtn.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/109-game-place.png`, fullPage: false });
  console.log('✓ 109-game-place.png');
  await ctx.close();
}

// ── 3. Desktop 1440 — EndTurn phase ───────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await setupGame(page);

  // Draw card
  const drawBtn = page.locator('button[aria-label*="Draw terrain"], button:has-text("Draw Terrain Card"), button:has-text("抽地形卡")').first();
  await drawBtn.click();
  await page.waitForTimeout(400);

  // Click 3 highlighted cells to enter EndTurn phase
  const validCells = page.locator('[aria-label*="valid placement"]');
  const count = await validCells.count();
  const toClick = Math.min(3, count);
  for (let i = 0; i < toClick; i++) {
    await validCells.nth(i).click({ force: true });
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/109-game-endturn.png`, fullPage: false });
  console.log('✓ 109-game-endturn.png');
  await ctx.close();
}

// ── 4. Mobile 375 — Drawer closed ─────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await setupGame(page);
  await page.screenshot({ path: `${OUT}/109-mobile-drawer-closed.png`, fullPage: false });
  console.log('✓ 109-mobile-drawer-closed.png');
  await ctx.close();
}

// ── 5. Mobile 375 — Drawer open ───────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await setupGame(page);

  // First draw a card so there's content to show
  // Try to find and click draw card in mobile floating bar
  const drawBtn = page.locator('button[aria-label*="Draw terrain"], button:has-text("Draw"), button:has-text("抽牌")').first();
  if (await drawBtn.isVisible()) {
    await drawBtn.click();
    await page.waitForTimeout(400);
  }

  // Open the drawer via toggle button (chevron) — use force in case of overlay
  const drawerToggle = page.locator('button[aria-label*="Open game panel"], button[aria-label*="展開遊戲面板"]').first();
  if (await drawerToggle.count() > 0) {
    await drawerToggle.click({ force: true });
    await page.waitForTimeout(400);
  } else {
    // Fallback: click the BottomDrawer drag handle area
    await page.locator('[role="button"][aria-label*="Open"], [role="button"][aria-label*="展開"]').first().click({ force: true });
    await page.waitForTimeout(400);
  }

  await page.screenshot({ path: `${OUT}/109-mobile-drawer-open.png`, fullPage: false });
  console.log('✓ 109-mobile-drawer-open.png');
  await ctx.close();
}

await browser.close();
console.log('\nAll screenshots done.');
