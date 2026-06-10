import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
  });
});

// Skipped: "First time playing?" onboarding modal intercepts Draw Card pointer events
// even when tutorial is started via useTutorialStore.startTutorial().
// See https://github.com/cancleeric/kingdom-builder-web/issues/191
test.skip('tutorial: highlighted draw card action advances the tutorial', async ({ page }) => {
  const setupPage = new SetupPage(page);
  const gamePage = new GamePage(page);

  await setupPage.goto(42);
  await setupPage.setPlayerType(1, 'human');
  await setupPage.startGame();
  await expect(gamePage.header).toBeVisible();

  await page.evaluate(async () => {
    const tutorial = await import('/src/store/tutorialStore.ts');
    const stepIndex = tutorial.TUTORIAL_STEPS.findIndex((step) => step.id === 'terrain-card');
    tutorial.useTutorialStore.getState().startTutorial();
    tutorial.useTutorialStore.getState().goToStep(stepIndex);
  });

  const dialog = page.getByRole('dialog', { name: 'Tutorial' });
  await expect(dialog).toContainText('Terrain Cards');
  await expect(page.getByTestId('tutorial-spotlight')).toBeVisible();

  await page
    .getByRole('status', { name: /Player 1's turn/ })
    .getByRole('button', { name: 'Draw terrain card to start your turn' })
    .click();

  await expect(dialog).toContainText('Placement Rules');
  await expect(gamePage.liveRegion).toContainText('PlaceSettlements');
});
