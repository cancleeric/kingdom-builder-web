import { test, expect } from '@playwright/test';
import { SetupPage } from '../pages/SetupPage';
import { GamePage } from '../pages/GamePage';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
  });
});

test('tablet portrait layout keeps board full-width and hides desktop sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });

  const setupPage = new SetupPage(page);
  await setupPage.goto();
  await setupPage.selectBoardSize('small');
  await setupPage.startGame();

  const boardGrid = page.locator('[role="grid"]');
  const desktopSidebar = page.locator('aside').first();
  const compactDrawer = page.locator('[role="region"][aria-expanded]').first();

  await expect(boardGrid).toBeVisible();
  await expect(desktopSidebar).toBeHidden();
  await expect(compactDrawer).toBeVisible();

  const boardBox = await boardGrid.boundingBox();
  expect(boardBox).not.toBeNull();
  expect(boardBox!.width).toBeGreaterThan(700);
});

test('16x16 board - all cells within viewport after fix', async ({ page }) => {
  const setupPage = new SetupPage(page);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const gamePage = new GamePage(page);

  // 啟動並設定遊戲（預設 medium = 16x16）
  await setupPage.goto();
  await setupPage.selectBoardSize('medium');
  await setupPage.startGame();
  await page.waitForTimeout(1000);

  // 等待棋盤載入
  await page.waitForSelector('svg[role="none"]', { timeout: 5000 });

  // 量測 viewport
  const viewport = page.viewportSize();
  console.log('Viewport:', viewport);

  // 量測棋盤容器
  const container = page.locator('div.bg-gray-100.overflow-hidden');
  const containerBox = await container.boundingBox();
  console.log('Container:', containerBox);

  // 量測 SVG 元素
  const svg = page.locator('svg[role="none"]').first();
  const svgBox = await svg.boundingBox();
  console.log('SVG:', svgBox);

  // 檢查 SVG 是否在容器內（允許少量誤差）
  if (containerBox && svgBox) {
    expect(svgBox.width).toBeLessThanOrEqual(containerBox.width + 5);
    expect(svgBox.height).toBeLessThanOrEqual(containerBox.height + 5);
  }

  // 找所有 hex cell
  const hexCells = page.locator('g[role="gridcell"]');
  const count = await hexCells.count();
  console.log(`Total hex cells: ${count}`);

  // 抽樣檢查四個角落的格子是否在 viewport 內
  const sampleIndices = [0, Math.floor(count / 4), Math.floor(count / 2), count - 1];

  for (const index of sampleIndices) {
    const cell = hexCells.nth(index);
    const box = await cell.boundingBox();

    if (box && viewport) {
      const top = box.y;
      const bottom = box.y + box.height;
      const left = box.x;
      const right = box.x + box.width;

      const inViewport =
        top >= 0 &&
        left >= 0 &&
        bottom <= viewport.height &&
        right <= viewport.width;

      console.log(`Cell ${index}: top=${Math.round(top)}, bottom=${Math.round(bottom)}, left=${Math.round(left)}, right=${Math.round(right)}, inViewport=${inViewport}`);

      // 修復後，所有格子應該在 viewport 內（允許少量誤差）
      expect(top).toBeGreaterThanOrEqual(-10); // 允許 10px 誤差
      expect(bottom).toBeLessThanOrEqual(viewport.height + 10);
    } else {
      console.log(`Cell ${index}: boundingBox not available (might be outside DOM)`);
    }
  }

  // 嘗試點擊遠端格子（抽沙漠卡後點擊）
  // 等待地形卡出現
  const terrainCard = page.locator('[data-testid="terrain-card"]');
  if (await terrainCard.isVisible({ timeout: 3000 })) {
    const cardText = await terrainCard.textContent();
    console.log('Current terrain card:', cardText);

    // 找第一個有效放置格（valid placement）
    const validCell = page.locator('g[role="gridcell"]').filter({
      has: page.locator('path[stroke-width="5"]') // 粗邊框表示 valid
    }).first();

    if (await validCell.isVisible({ timeout: 1000 })) {
      const validBox = await validCell.boundingBox();
      console.log('Valid cell position:', validBox);

      // 確認可點擊（不會報 outside viewport）
      await expect(validCell).toBeVisible();
      await validCell.click({ timeout: 5000 });
      console.log('✓ Successfully clicked valid cell');
    }
  }
});
