/**
 * R29 Bot Turn Observer Spec
 * 量測 bot 回合時序、高亮、TurnBanner「對手行動中」
 */
import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

// Use playwright config baseURL (5173) instead of hardcoded 5174.
// The webServer config spins up on 5173; this file previously hardcoded a
// different port that causes ERR_CONNECTION_REFUSED in headless Playwright.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    // Skip tutorial/onboarding prompt so it doesn't block game actions
    localStorage.setItem('tutorialCompleted', 'true');
  });
});

test('R29: verify animations.css has bot ring and spinner classes', async ({ page }) => {
  await page.goto('/');

  const hasGhostAnimation = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'animate-settlement-ring-ghost';
    document.body.appendChild(el);
    const animName = getComputedStyle(el).animationName;
    document.body.removeChild(el);
    return animName !== 'none' && animName !== '';
  });

  const hasSpinAnimation = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'animate-spin-slow';
    document.body.appendChild(el);
    const animName = getComputedStyle(el).animationName;
    document.body.removeChild(el);
    return animName !== 'none' && animName !== '';
  });

  console.log('animate-settlement-ring-ghost loaded:', hasGhostAnimation);
  console.log('animate-spin-slow loaded:', hasSpinAnimation);

  expect(hasGhostAnimation).toBeTruthy();
  expect(hasSpinAnimation).toBeTruthy();
});

// Skipped: GamePage.clickValidCell() uses dispatchEvent which does not trigger
// pointer events on the Pixi canvas board; placements silently fail so bot
// never activates and the "Opponent thinking" banner never appears.
// See https://github.com/cancleeric/kingdom-builder-web/issues/188
test.skip('R29: bot turn timing and banner indicator', async ({ page }) => {
  page.setDefaultTimeout(60000);

  // ── 1. Setup: 1 human vs 1 bot (small board) ───────────────────────────
  const setup = new SetupPage(page);
  await setup.goto();
  await setup.selectBoardSize('small');
  await setup.startGame();

  const gamePage = new GamePage(page);

  // ── 2. Player 1 turn: draw + place 3 settlements ─────────────────────
  await gamePage.liveRegion.waitFor({ state: 'attached', timeout: 10000 });

  // Set up MutationObserver before player ends turn
  // NOTE: TurnBanner uses key={currentPlayer.id} so it force-remounts on turn change.
  // We must observe the PARENT container (document.body level) to catch new banner nodes.
  await page.evaluate(() => {
    const log: Array<{ time: number; event: string }> = [];
    const start = Date.now();
    const record = (msg: string) => {
      const entry = { time: Date.now() - start, event: msg };
      log.push(entry);
      console.log(`[R29] +${entry.time}ms ${entry.event}`);
    };

    // Observe document.body subtree for banner additions/text changes
    // (banner force-remounts on player change, so we can't watch the element itself)
    const bodyObs = new MutationObserver(() => {
      const banner = document.querySelector('[role="status"]');
      if (banner) {
        const txt = banner.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80) ?? '';
        record(`banner: "${txt}"`);
      }
    });
    bodyObs.observe(document.body, { childList: true, subtree: true });

    // Initial banner state
    const initBanner = document.querySelector('[role="status"]');
    record(`observer-init: "${initBanner?.textContent?.trim().slice(0, 60) ?? 'NO BANNER'}"`);

    // SVG ring animations
    const svg = document.querySelector('svg');
    if (svg) {
      const so = new MutationObserver(mutations => {
        for (const m of mutations) {
          for (const n of m.addedNodes) {
            const el = n as Element;
            if (el.classList?.contains?.('animate-settlement-ring')) record('ring-primary added');
            if (el.classList?.contains?.('animate-settlement-ring-ghost')) record('ring-ghost added');
          }
          if (m.type === 'attributes' && m.attributeName === 'class') {
            const el = m.target as Element;
            if (el.classList?.contains('animate-settlement-ring')) record('ring-primary class-change');
            if (el.classList?.contains('animate-settlement-ring-ghost')) record('ring-ghost class-change');
          }
        }
      });
      so.observe(svg, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only debug property on window
    (window as any).__r29log = log;
  });

  // Draw card + place 3 settlements
  await gamePage.clickDrawCard();
  await page.waitForTimeout(300);

  for (let i = 0; i < 3; i++) {
    await gamePage.clickValidCell();
    await page.waitForTimeout(150);
  }

  // Screenshot: player 1 finished placements
  await page.screenshot({ path: 'test-results/r29-p1-placed.png' });

  // Mark time before ending turn
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only debug property on window
    (window as any).__r29turnEndAt = Date.now();
    console.log('[R29] Player 1 ending turn...');
  });

  // End turn: try button click via aria-label first, then JS dispatch
  await page.evaluate(async () => {
    // Try aria-label
    const byAria = document.querySelector<HTMLElement>(
      '[aria-label="End your turn and pass to the next player"]'
    );
    if (byAria) { byAria.click(); return; }
    // Try by text
    const byText = Array.from(document.querySelectorAll<HTMLElement>('button')).find(
      b => b.textContent?.includes('End Turn')
    );
    if (byText) { byText.click(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only fallback via window globals
    const store = (window as any).__zustand_store ?? (window as any).useGameStore;
    if (store) store.getState().endTurn();
  });

  // Wait a bit to let bot turn start
  await page.waitForTimeout(500);

  // Check if bot turn has started (banner should show Player 2)
  const bannerAfterEnd = await page.locator('[role="status"]').textContent().catch(() => '');
  console.log('Banner after endTurn attempt:', bannerAfterEnd?.slice(0, 80));

  // If banner still shows EndTurn for Player 1, force via store
  if (bannerAfterEnd?.includes('Player 1') && bannerAfterEnd?.includes('EndTurn')) {
    console.log('Forcing endTurn via store import...');
    await page.evaluate(async () => {
      const { useGameStore } = await import('/src/store/gameStore.ts');
      useGameStore.getState().endTurn();
    });
  }

  // ── 3. Wait for bot to complete (~2.4s) ─────────────────────────────────
  console.log('Waiting for bot turn...');
  await page.waitForTimeout(3500);

  // Screenshot: after bot turn completes
  await page.screenshot({ path: 'test-results/r29-after-bot.png' });

  // ── 4. Collect and analyze log ──────────────────────────────────────────
  const events = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test-only debug property on window
    return (window as any).__r29log as Array<{ time: number; event: string }>;
  });

  console.log('\n=== R29 Observer Log ===');
  for (const e of events) {
    console.log(`  +${String(e.time).padStart(5)}ms  ${e.event}`);
  }

  const ringPrimary = events.filter(e => e.event.includes('ring-primary'));
  const ringGhost   = events.filter(e => e.event.includes('ring-ghost'));
  const bannerEvts  = events.filter(e => e.event.startsWith('banner:'));
  const botBanner   = bannerEvts.find(e =>
    e.event.includes('Opponent thinking') || e.event.includes('對手行動中')
  );

  console.log('\n=== Summary ===');
  console.log('ring-primary events:', ringPrimary.length);
  console.log('ring-ghost events:', ringGhost.length);
  console.log('banner changes:', bannerEvts.length);
  console.log('Bot thinking banner seen:', !!botBanner);
  if (botBanner) console.log('  └─', botBanner.event);

  // Ring interval check
  if (ringPrimary.length >= 2) {
    for (let i = 1; i < ringPrimary.length; i++) {
      const interval = ringPrimary[i].time - ringPrimary[i - 1].time;
      console.log(`Ring interval ${i}→${i + 1}: ${interval}ms (expected ~400ms)`);
      expect(interval).toBeGreaterThan(300);
      expect(interval).toBeLessThan(600);
    }
  }

  // Bot turn total duration
  if (ringPrimary.length > 0 && bannerEvts.length > 1) {
    const first = ringPrimary[0].time;
    const last  = bannerEvts[bannerEvts.length - 1].time;
    const total = last - first;
    console.log(`Bot turn duration: ${total}ms (expected 800–2500ms)`);
    if (ringPrimary.length >= 3) {
      expect(total).toBeGreaterThan(600);
      expect(total).toBeLessThan(3000);
    }
  }

  // Verify bot thinking banner appeared
  expect(botBanner).toBeDefined();

  // ── 5. Verify bot turn ended & play resumed ──────────────────────────────
  const liveText = await gamePage.liveRegion.textContent().catch(() => '');
  console.log('\nLive region after bot turn:', liveText?.slice(0, 80));

  // Phase should be back to Player 1's DrawCard phase
  const phase = liveText ?? '';
  const isPlayer1Turn = phase.includes('Player 1') || phase.includes('Human');
  console.log('Back to player 1 turn:', isPlayer1Turn);
  expect(isPlayer1Turn).toBeTruthy();
});
