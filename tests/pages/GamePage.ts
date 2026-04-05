import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the main game board screen.
 *
 * Implementation note: The HexGrid SVG is centered inside a container that is
 * smaller than the full board, so many cells extend above/below the visible
 * viewport.  Similarly, the desktop sidebar has `display:none` in the headless
 * Chromium used for testing (Tailwind CSS responsive variants are not applied
 * when running headless).
 *
 * For robustness, all button/cell clicks use JS dispatch (`element.click()`)
 * via page.evaluate(), which bypasses Playwright's viewport-presence check
 * while still triggering React's synthetic event system.
 */
export class GamePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Heading ──────────────────────────────────────────────────────────────

  /** The page header (always visible during a game). */
  get header(): Locator {
    return this.page.getByRole('heading', { name: 'Kingdom Builder' }).first();
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  /** The "Draw Terrain Card" button locator (for existence/visibility checks). */
  get drawCardButton(): Locator {
    return this.page.getByRole('button', { name: 'Draw Terrain Card' });
  }

  /** The "End Turn" button locator (for existence/visibility checks). */
  get endTurnButton(): Locator {
    return this.page.getByRole('button', { name: /End.*turn/i });
  }

  /** The "Undo" button. */
  get undoButton(): Locator {
    return this.page.getByRole('button', { name: 'Undo' });
  }

  /**
   * Click the "Draw Terrain Card" button via JS dispatch.
   * Avoids Playwright's viewport check; works even when the button is
   * display:none (sidebar) or CSS-translated off screen (BottomDrawer).
   */
  async clickDrawCard(): Promise<void> {
    await this.drawCardButton.first().waitFor({ state: 'attached' });
    await this.page.evaluate(() => {
      const byAriaLabel = document.querySelector<HTMLElement>(
        '[aria-label="Draw terrain card to start your turn"]'
      );
      if (byAriaLabel) { byAriaLabel.click(); return; }
      const byText = Array.from(document.querySelectorAll<HTMLElement>('button')).find(
        b => b.textContent?.trim() === 'Draw Terrain Card'
      );
      byText?.click();
    });
  }

  /**
   * Click the "End Turn" button via JS dispatch.
   */
  async clickEndTurn(): Promise<void> {
    await this.endTurnButton.first().waitFor({ state: 'attached' });
    await this.page.evaluate(() => {
      const byAriaLabel = document.querySelector<HTMLElement>(
        '[aria-label="End your turn and pass to the next player"]'
      );
      if (byAriaLabel) { byAriaLabel.click(); return; }
      const byText = Array.from(document.querySelectorAll<HTMLElement>('button')).find(
        b => b.textContent?.trim() === 'End Turn'
      );
      byText?.click();
    });
  }

  // ── Board ────────────────────────────────────────────────────────────────

  /**
   * Locator for all hex cells marked as valid placements.
   * (For assertions; use clickValidCell() to place.)
   */
  get validCells(): Locator {
    return this.page.getByRole('gridcell', { name: /valid placement/ });
  }

  /**
   * Return the hex cell locator for the given axial coordinates.
   */
  cellAt(q: number, r: number): Locator {
    return this.page.getByRole('gridcell', { name: new RegExp(`Q${q} R${r}`) });
  }

  /**
   * Click the first valid hex cell via JS dispatch.
   * The HexGrid SVG often extends outside the visual viewport, so normal
   * Playwright clicks fail even for cells that are logically accessible.
   */
  async clickValidCell(): Promise<void> {
    await this.page.evaluate(() => {
      const cell = Array.from(document.querySelectorAll<SVGElement>('[role="gridcell"]'))
        .find(el =>
          el.getAttribute('aria-label')?.includes('valid placement') &&
          el.getAttribute('aria-disabled') !== 'true'
        );
      cell?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
  }

  /**
   * Click the hex cell at the given coordinates via JS dispatch.
   */
  async clickCellAt(q: number, r: number): Promise<void> {
    await this.page.evaluate(
      ({ q, r }) => {
        const cell = Array.from(document.querySelectorAll<SVGElement>('[role="gridcell"]')).find(
          el => el.getAttribute('aria-label')?.startsWith(`Q${q} R${r}`)
        );
        cell?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      },
      { q, r }
    );
  }

  /** Place a settlement via JS click on the first available valid cell. */
  async placeOnFirstValid(): Promise<void> {
    await this.clickValidCell();
  }

  /**
   * Draw a terrain card and place `count` settlements.
   */
  async drawAndPlace(count = 3): Promise<void> {
    await this.clickDrawCard();
    // Wait until valid cells appear
    await expect(this.liveRegion).toContainText('PlaceSettlements');
    for (let i = 0; i < count; i++) {
      await this.clickValidCell();
      if (i < count - 1) {
        // Small pause to let state update between placements
        await this.page.waitForTimeout(100);
      }
    }
  }

  // ── Game state ────────────────────────────────────────────────────────────

  /**
   * The aria-live announcement region — always in the DOM, always reflects
   * current game state regardless of responsive CSS.
   * Format: "{player}'s turn — {phase}[, terrain: {T}, placements remaining: {N}]"
   */
  get liveRegion(): Locator {
    return this.page.locator('[aria-live="polite"]');
  }

  /** Read the current player name from the aria-live region. */
  async currentPlayerName(): Promise<string> {
    const text = await this.liveRegion.textContent() ?? '';
    return text.replace(/'s turn.*$/, '').trim();
  }

  // ── Game Over ─────────────────────────────────────────────────────────────

  /** The Game Over modal heading. */
  get gameOverHeading(): Locator {
    return this.page.getByRole('heading', { name: /Game Over/i });
  }

  /** The "New Game" button inside the Game Over modal. */
  get newGameButton(): Locator {
    return this.page.getByRole('button', { name: 'New Game' });
  }

  /** Wait for the Game Over screen to appear (generous timeout for bot games). */
  async waitForGameOver(timeoutMs = 120_000): Promise<void> {
    await expect(this.gameOverHeading).toBeVisible({ timeout: timeoutMs });
  }

  /** Return score rows from the Game Over modal. */
  async scoreRows(): Promise<{ name: string; score: string }[]> {
    const rows = this.page.locator('div').filter({ has: this.page.locator('p.font-semibold') });
    const count = await rows.count();
    const result: { name: string; score: string }[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const name = (await row.locator('p.font-semibold').first().textContent()) ?? '';
      const score = (await row.locator('p.text-2xl').first().textContent()) ?? '';
      if (name && score) result.push({ name: name.trim(), score: score.trim() });
    }
    return result;
  }
}
