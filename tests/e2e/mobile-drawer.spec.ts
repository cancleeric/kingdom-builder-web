import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    // Suppress the "First time playing?" onboarding dialog so it doesn't
    // intercept pointer events when clicking "Open game panel".
    localStorage.setItem('tutorialCompleted', 'true');
  });
});

test('mobile drawer: shows objectives and live scores during a game', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();

  const drawer = page.getByRole('region', { name: 'Game controls' });
  await drawer.getByLabel('Open game panel').click();
  await expect(drawer).toHaveAttribute('aria-expanded', 'true');
  await expect(drawer.getByRole('region', { name: 'Objectives' })).toBeVisible();
  const liveScores = drawer.getByRole('region', { name: 'Live Scores' });
  await expect(liveScores).toBeVisible();
  await expect(liveScores.getByText('Player 1')).toBeVisible();
  await expect(liveScores.getByText('0 pts').first()).toBeVisible();
});
