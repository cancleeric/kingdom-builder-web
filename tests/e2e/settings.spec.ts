import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
  });
});

test('settings: opens from main menu and persists audio controls', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Settings' }).click();

  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Audio')).toBeVisible();

  const muteButton = dialog.getByRole('button', { name: /Mute sound/i });
  await expect(muteButton).toHaveAttribute('aria-pressed', 'false');
  await muteButton.click();
  await expect(muteButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.evaluate(() => localStorage.getItem('kingdom-builder-muted'))).resolves.toBe('true');

  const volumeSlider = dialog.getByRole('slider', { name: 'Volume' });
  await volumeSlider.fill('35');
  await expect(page.evaluate(() => localStorage.getItem('kingdom-builder-volume'))).resolves.toBe('0.35');
  await expect(dialog.getByText('35%')).toBeVisible();

  await dialog.getByRole('button', { name: 'Close settings' }).click();
  await expect(dialog).toBeHidden();
});

test('settings: language selector updates the main menu language', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Language' }).selectOption('zh-TW');

  await expect(page.getByRole('heading', { name: '王國建造者' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: '設定' })).toBeVisible();
});
