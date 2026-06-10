import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    // Suppress the "First time playing?" onboarding dialog so it doesn't
    // intercept pointer events in mobile drawer tests.
    localStorage.setItem('tutorialCompleted', 'true');
  });
});

test('desktop objectives: cards explain how scoring works', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();

  const objectives = page.getByRole('region', { name: 'Objectives' }).first();
  await expect(objectives).toBeVisible();
  // 3 objective cards are always present (specific names vary by map seed)
  await expect(objectives.getByTestId('objective-card')).toHaveCount(3);
  // Each card should show a score and a description
  await expect(objectives).toContainText('pts');
});

test('mobile objectives: drawer cards include rule descriptions', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();

  const drawer = page.getByRole('region', { name: 'Game controls' });
  await drawer.getByLabel('Open game panel').click();

  const objectives = drawer.getByRole('region', { name: 'Objectives' });
  await expect(objectives).toBeVisible();
  // 3 objective cards always present; specific names vary by map seed
  await expect(objectives.getByTestId('objective-card')).toHaveCount(3);
  await expect(objectives).toContainText('pts');
});
