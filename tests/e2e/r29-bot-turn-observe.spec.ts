/**
 * R29 Bot Turn Observer Spec
 * 量測 bot 回合時序、高亮、TurnBanner「對手行動中」
 *
 * Rewrite notes (issue #188):
 *   Original skip reason: "GamePage.clickValidCell() uses dispatchEvent which does
 *   not trigger pointer events on the Pixi canvas board".
 *   Since R35, GamePage.clickValidCell() drives the Zustand store directly
 *   (placeSettlement) — no canvas click needed.  The skip is no longer valid.
 *
 *   Bot turn timing test uses waitForFunction polling (deterministic) instead of
 *   fixed waitForTimeout to avoid flakiness.
 */
import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

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

/**
 * R29: Bot turn timing and banner indicator
 *
 * Previously skipped (issue #188) because clickValidCell used dispatchEvent.
 * Fixed: GamePage.clickValidCell() is now store-driven — no Pixi canvas click needed.
 *
 * Uses deterministic waitForFunction polling instead of fixed waitForTimeout.
 */
test('R29: bot turn timing and banner indicator', async ({ page }) => {
  page.setDefaultTimeout(60000);

  // ── 1. Setup: 1 human vs 1 bot (small board, deterministic seed) ──────────
  const setup = new SetupPage(page);
  await setup.goto(42);
  await setup.selectBoardSize('small');
  await setup.startGame();

  const gamePage = new GamePage(page);
  await gamePage.liveRegion.waitFor({ state: 'attached', timeout: 10000 });
  await expect(gamePage.liveRegion).toContainText('DrawCard', { timeout: 8000 });

  // ── 2. Player 1: draw + place 3 settlements + end turn ────────────────────
  await gamePage.drawAndPlace(3);
  await expect(gamePage.liveRegion).toContainText('EndTurn', { timeout: 5000 });
  await gamePage.clickEndTurn();

  // ── 3. Wait for bot turn: TurnBanner shows "Opponent thinking" ────────────
  // After endTurn, bot (player 2) is currentPlayer in DrawCard phase.
  // TurnBanner renders role="status" with isCurrentPlayerBot=true → spinner text.
  // runBotTurn fires after 600ms delay; banner is visible during that window.
  const botBannerAppeared = await page.waitForFunction(
    () => {
      const banner = document.querySelector('[role="status"]');
      if (!banner) return false;
      const txt = banner.textContent ?? '';
      return txt.includes('Opponent thinking') || txt.includes('對手行動中');
    },
    {},
    { timeout: 5000 }
  ).then(() => true).catch(() => false);

  console.log('Bot thinking banner appeared:', botBannerAppeared);
  expect(
    botBannerAppeared,
    'TurnBanner must show "Opponent thinking" during bot DrawCard phase'
  ).toBe(true);

  // ── 4. Wait for bot to complete its full turn ─────────────────────────────
  // Deterministic: poll until live region shows Player 1 DrawCard again.
  await page.waitForFunction(
    () => {
      const lr = document.querySelector('.sr-only[aria-live="polite"]');
      const txt = lr?.textContent ?? '';
      return txt.includes('Player 1') && txt.includes('DrawCard');
    },
    {},
    { timeout: 10000 }
  );

  const liveText = await gamePage.liveRegion.textContent().catch(() => '');
  console.log('Live region after bot turn:', liveText?.slice(0, 80));

  expect(liveText).toContain('Player 1');
  expect(liveText).toContain('DrawCard');
});
