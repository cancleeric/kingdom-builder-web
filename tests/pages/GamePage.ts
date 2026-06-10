import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object for the main game board screen.
 *
 * Implementation note: Since R35, the board renders on a PixiJS <canvas> — there
 * are no accessible DOM [role="gridcell"] nodes.  All board interaction helpers
 * use page.evaluate() to import the Zustand game store directly and drive
 * placeSettlement() / read validPlacements from state.  This is the same
 * technique already used by location-tile-activation.spec.ts.
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
    return this.page.getByRole('button', { name: /Undo/i }).first();
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
   *
   * Since R35 (PixiBoard), there are no DOM [role="gridcell"] nodes.
   * This locator always matches 0 elements on the PixiJS canvas.
   * Tests that formerly relied on this for count/visibility assertions
   * should instead use getValidPlacementCount() / waitForValidPlacements().
   */
  get validCells(): Locator {
    return this.page.getByRole('gridcell', { name: /valid placement/ });
  }

  /**
   * Return the number of valid placements from the game store.
   * Use this instead of validCells.count() for PixiBoard.
   */
  async getValidPlacementCount(): Promise<number> {
    return this.page.evaluate(async () => {
      const { useGameStore } = await import('/src/store/gameStore.ts');
      return useGameStore.getState().validPlacements.length;
    });
  }

  /**
   * Wait until validPlacements.length > 0 in the game store.
   */
  async waitForValidPlacements(timeoutMs = 8000): Promise<void> {
    await this.page.waitForFunction(
      async () => {
        const { useGameStore } = await import('/src/store/gameStore.ts');
        return useGameStore.getState().validPlacements.length > 0;
      },
      {},
      { timeout: timeoutMs }
    );
  }

  /**
   * Return the hex cell locator for the given axial coordinates.
   * NOTE: Returns an always-empty locator since PixiBoard migration (R35).
   * Kept for API compatibility; callers that need to assert on cell state
   * should use getCellState() instead.
   */
  cellAt(q: number, r: number): Locator {
    return this.page.getByRole('gridcell', { name: new RegExp(`Q${q} R${r}`) });
  }

  /**
   * Read cell info (terrain, settlement, isValid) from game store for the
   * given axial coordinates.  Works with PixiBoard (no DOM gridcells needed).
   */
  async getCellState(q: number, r: number): Promise<{
    terrain: string | null;
    settlement: number | undefined;
    isValid: boolean;
  }> {
    return this.page.evaluate(
      async ({ q, r }) => {
        const { useGameStore } = await import('/src/store/gameStore.ts');
        const state = useGameStore.getState();
        const cell = state.board.getCell({ q, r });
        const isValid = state.validPlacements.some(v => v.q === q && v.r === r);
        return {
          terrain: cell ? (cell.terrain as string) : null,
          settlement: cell?.settlement,
          isValid,
        };
      },
      { q, r }
    );
  }

  /**
   * Click the first valid hex cell via game store.
   *
   * Since R35 (PixiBoard), there are no DOM [role="gridcell"] elements to click.
   * We call the correct store action directly:
   *   - activeTile set → applyTilePlacement (Farm / Oasis / etc.)
   *   - no activeTile → placeSettlement (normal terrain placement)
   * This mirrors the PixiBoard pointertap handler which checks activeTile.
   */
  async clickValidCell(): Promise<void> {
    await this.page.evaluate(async () => {
      const { useGameStore } = await import('/src/store/gameStore.ts');
      const state = useGameStore.getState();
      const first = state.validPlacements[0];
      if (!first) return;
      if (state.activeTile) {
        state.applyTilePlacement(first);
      } else {
        state.placeSettlement(first);
      }
    });
  }

  /**
   * Click the hex cell at the given axial coordinates via game store.
   *
   * Mirrors the PixiBoard pointertap guard:
   *   - if coord is in validPlacements and activeTile is set → applyTilePlacement
   *   - if coord is in validPlacements and no activeTile → placeSettlement
   *   - if coord is NOT in validPlacements → no-op (count stays unchanged)
   */
  async clickCellAt(q: number, r: number): Promise<void> {
    await this.page.evaluate(
      async ({ q, r }) => {
        const { useGameStore } = await import('/src/store/gameStore.ts');
        const state = useGameStore.getState();
        const isValid = state.validPlacements.some(v => v.q === q && v.r === r);
        if (!isValid) return; // non-valid cell: no-op
        if (state.activeTile) {
          state.applyTilePlacement({ q, r });
        } else {
          state.placeSettlement({ q, r });
        }
      },
      { q, r }
    );
  }

  /** Place a settlement via the store on the first available valid cell. */
  async placeOnFirstValid(): Promise<void> {
    await this.clickValidCell();
  }

  /**
   * Draw a terrain card and place `count` settlements.
   */
  async drawAndPlace(count = 3): Promise<void> {
    await this.clickDrawCard();
    // Wait until valid cells appear in the store
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
    return this.page.locator('.sr-only[aria-live="polite"]');
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
    const rows = this.page.getByTestId('final-score-row');
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
