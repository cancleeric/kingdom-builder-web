import { test, expect } from '@playwright/test';
import { GamePage } from '../pages/GamePage';
import {
  defaultFinalScores,
  defaultObjectiveCards,
  openSavedGameOver,
} from '../pages/GameOverFixture';

test('game over: modal appears with final rankings and scores', async ({ page }) => {
  const gamePage = new GamePage(page);

  await openSavedGameOver(page);

  await expect(gamePage.gameOverHeading).toBeVisible();
  await expect(page.getByText('Final Rankings')).toBeVisible();

  const scoreRows = await gamePage.scoreRows();
  expect(scoreRows.length).toBeGreaterThanOrEqual(2);
  scoreRows.forEach(({ name, score }) => {
    expect(name).toBeTruthy();
    expect(score).toMatch(/^\d+$/);
  });
});

test('game over: leaderboard orders players by score descending', async ({ page }) => {
  const gamePage = new GamePage(page);

  await openSavedGameOver(page, {
    finalScores: [
      defaultFinalScores[1],
      defaultFinalScores[0],
    ],
  });

  const scoreRows = await gamePage.scoreRows();
  const scores = scoreRows.map(row => parseInt(row.score, 10));
  for (let i = 1; i < scores.length; i++) {
    expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
  }
});

test('game over: objective cards are displayed', async ({ page }) => {
  await openSavedGameOver(page);

  await expect(page.getByText('Objective Cards')).toBeVisible();
  const objectiveList = page.getByRole('list', { name: 'Objective Cards' });
  for (const card of defaultObjectiveCards) {
    await expect(objectiveList.getByRole('listitem').filter({ hasText: card })).toBeVisible();
  }
});

test('game over: new game button returns to setup screen', async ({ page }) => {
  const gamePage = new GamePage(page);

  await openSavedGameOver(page);
  await gamePage.newGameButton.click();

  await expect(page.getByRole('heading', { name: 'Game Setup' })).toBeVisible();
});

test('game over: new game can be activated with keyboard', async ({ page }) => {
  const gamePage = new GamePage(page);

  await openSavedGameOver(page);
  await gamePage.newGameButton.focus();
  await expect(gamePage.newGameButton).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Game Setup' })).toBeVisible();
});
