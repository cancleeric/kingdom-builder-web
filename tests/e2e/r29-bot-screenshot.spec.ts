/**
 * R29 Screenshot spec — captures bot placement highlight and TurnBanner spinner
 * Uses gameStore.setState to set up a controlled bot turn scenario
 */
import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

// BASE was hardcoded for manual dev; Playwright webServer config uses port 5173
const _BASE = 'http://localhost:5174';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    localStorage.setItem('tutorialCompleted', 'true');
  });
});

test('R29: screenshot TurnBanner bot indicator', async ({ page }) => {
  page.setDefaultTimeout(30000);

  const setup = new SetupPage(page);
  await setup.goto();
  await setup.selectBoardSize('small');
  await setup.startGame();

  const gamePage = new GamePage(page);
  await gamePage.liveRegion.waitFor({ state: 'attached', timeout: 10000 });

  // Set bot turn active via setState so we can screenshot
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    const { GamePhase } = await import('/src/types/index.ts');
    // Switch to player 2 (bot) in DrawCard phase
    useGameStore.setState({
      currentPlayerIndex: 1,
      phase: GamePhase.DrawCard,
    });
  });

  await page.waitForTimeout(300);

  // Screenshot: TurnBanner should show "Opponent thinking…" + spinner
  await page.screenshot({
    path: 'test-results/r29-banner-bot-indicator.png',
    clip: { x: 0, y: 0, width: 1280, height: 80 },
  });

  // Verify banner has bot indicator text
  const bannerText = await page.locator('[role="status"]').textContent();
  console.log('Banner text with bot turn:', bannerText?.slice(0, 100));
  expect(bannerText).toContain('Opponent thinking');

  // Full screenshot for reference
  await page.screenshot({ path: 'test-results/r29-banner-bot-full.png' });
});

test('R29: screenshot bot placement ring highlight', async ({ page }) => {
  page.setDefaultTimeout(30000);

  const setup = new SetupPage(page);
  await setup.goto();
  await setup.selectBoardSize('small');
  await setup.startGame();

  const gamePage = new GamePage(page);
  await gamePage.liveRegion.waitFor({ state: 'attached', timeout: 10000 });

  // Draw card and place first settlement as Player 1 to verify ring
  await gamePage.clickDrawCard();
  await page.waitForTimeout(200);

  // Screenshot immediately after placing a settlement (ring should be visible)
  await page.evaluate(() => {
    // Trigger click on first valid cell
    const cell = Array.from(document.querySelectorAll<SVGElement>('[role="gridcell"]'))
      .find(el =>
        el.getAttribute('aria-label')?.includes('valid placement') &&
        el.getAttribute('aria-disabled') !== 'true'
      );
    cell?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

  // Immediately screenshot — ring lasts 250ms
  await page.waitForTimeout(50);
  await page.screenshot({ path: 'test-results/r29-placement-ring.png' });

  // Now advance to bot turn and capture during placement
  // Place remaining 2 settlements
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      const cell = Array.from(document.querySelectorAll<SVGElement>('[role="gridcell"]'))
        .find(el =>
          el.getAttribute('aria-label')?.includes('valid placement') &&
          el.getAttribute('aria-disabled') !== 'true'
        );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(200);
  }

  // Force end turn via store
  await page.evaluate(async () => {
    const { useGameStore } = await import('/src/store/gameStore.ts');
    useGameStore.getState().endTurn();
  });

  // Wait for bot to place first settlement (~800ms trigger)
  await page.waitForTimeout(850);

  // Screenshot during bot placement — ring should be visible
  await page.screenshot({ path: 'test-results/r29-bot-placing.png' });

  // Wait another 400ms for second
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/r29-bot-placing-2.png' });

  // Wait for bot to finish
  await page.waitForTimeout(2000);

  const liveText = await gamePage.liveRegion.textContent().catch(() => '');
  console.log('After bot turn:', liveText?.slice(0, 60));
  expect(liveText).toMatch(/Player 1|Human/);
});
