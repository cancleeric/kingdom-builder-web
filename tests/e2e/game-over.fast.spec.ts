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

test('game over: score bars show castle and objective breakdowns', async ({ page }) => {
  await openSavedGameOver(page);

  const winnerBar = page.getByTestId('score-bar-1');
  await expect(winnerBar).toBeVisible();
  await expect(winnerBar).toHaveAccessibleName('Player 1 score breakdown, 27 total points');

  await expect(winnerBar.getByRole('listitem', { name: 'Player 1 Castle score: 6 points' })).toBeVisible();
  await expect(winnerBar.getByRole('listitem', { name: 'Player 1 Farmers score: 9 points' })).toBeVisible();
  await expect(winnerBar.getByRole('listitem', { name: 'Player 1 Hermits score: 4 points' })).toBeVisible();
  await expect(winnerBar.getByRole('listitem', { name: 'Player 1 Merchants score: 8 points' })).toBeVisible();

  const winnerWidth = await winnerBar.evaluate(element => element.getBoundingClientRect().width);
  const runnerUpWidth = await page
    .getByTestId('score-bar-2')
    .evaluate(element => element.getBoundingClientRect().width);
  expect(winnerWidth).toBeGreaterThan(runnerUpWidth);
});

test('game over: score breakdown layout fits a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openSavedGameOver(page);

  const modal = page.getByRole('heading', { name: /Game Over/i }).locator('xpath=ancestor::div[contains(@class, "bg-white")][1]');
  const modalBox = await modal.boundingBox();
  const viewport = page.viewportSize();
  expect(modalBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(modalBox!.x).toBeGreaterThanOrEqual(0);
  expect(modalBox!.x + modalBox!.width).toBeLessThanOrEqual(viewport!.width);

  await expect(page.getByTestId('score-bar-1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible();
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
