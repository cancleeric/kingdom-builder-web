import { test } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';

test('debug: wait 80s and check for game over', async ({ page }) => {
  const setupPage = new SetupPage(page);
  await setupPage.goto(42);
  await setupPage.setPlayerType(0, 'bot');
  await setupPage.startGame();
  
  // Wait for 80 seconds
  await page.waitForTimeout(80000);
  
  const gameState = await page.evaluate(() => {
    const liveRegion = document.querySelector('[aria-live="polite"]');
    const gameOverHeading = document.querySelector('h1, h2, h3, h4');
    return {
      liveRegion: liveRegion?.textContent ?? 'no live region',
      heading: gameOverHeading?.textContent ?? 'no heading',
      allHeadings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent)
    };
  });
  
  console.log('After 80s:', JSON.stringify(gameState, null, 2));
});
