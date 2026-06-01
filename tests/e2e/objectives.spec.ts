import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
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
  await expect(objectives.getByTestId('objective-card')).toHaveCount(3);
  await expect(objectives).toContainText('Citizens');
  await expect(objectives).toContainText('Each settlement adjacent to a castle scores 3 points.');
  await expect(objectives).toContainText('Hermits');
  await expect(objectives).toContainText('Each isolated settlement with no adjacent friendly settlement scores 3 points.');
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
  await expect(objectives.getByTestId('objective-card')).toHaveCount(3);
  await expect(objectives).toContainText('Shepherds');
  await expect(objectives).toContainText('Each connected settlement group scores 3 points.');
});
