import type { Page } from '@playwright/test'

/**
 * Page Object for the main game page (App.tsx sidebar + board).
 * The game auto-starts in DrawCard phase when loaded.
 */
export class GamePage {
  constructor(private page: Page) {}

  /** Navigate to app with optional seed for deterministic randomness */
  async goto(seed?: number) {
    const url = seed !== undefined ? `/?seed=${seed}` : '/'
    await this.page.goto(url)
    // Wait for players to be initialised
    await this.page.waitForSelector('[data-testid="game-page"]')
  }

  // ── Current player ──────────────────────────────────

  async getCurrentPlayerName() {
    return this.page.locator('[data-testid="current-player-name"]').textContent()
  }

  async getCurrentPlayerRemaining() {
    const text = await this.page.locator('[data-testid="current-player-remaining"]').textContent()
    const match = text?.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  }

  // ── Phase & terrain ─────────────────────────────────

  async getPhase() {
    return this.page.locator('[data-testid="game-phase"]').textContent()
  }

  async getCurrentTerrain() {
    return this.page.locator('[data-testid="current-terrain"]').textContent()
  }

  async getRemainingPlacements() {
    const text = await this.page.locator('[data-testid="remaining-placements"]').textContent()
    return parseInt(text || '0', 10)
  }

  // ── Actions ─────────────────────────────────────────

  async clickDrawCard() {
    await this.page.click('[data-testid="draw-card-btn"]')
  }

  async clickEndTurn() {
    await this.page.click('[data-testid="end-turn-btn"]')
  }

  async isDrawCardVisible() {
    return this.page.locator('[data-testid="draw-card-btn"]').isVisible()
  }

  async isEndTurnVisible() {
    return this.page.locator('[data-testid="end-turn-btn"]').isVisible()
  }

  // ── Player panels ───────────────────────────────────

  /** playerId is 1-based (Player 1, Player 2, …) */
  async getPlayerRemaining(playerId: number) {
    const text = await this.page
      .locator(`[data-testid="remaining-settlements-${playerId}"]`)
      .textContent()
    return parseInt(text || '0', 10)
  }

  async getPlayerLocationTiles(playerId: number) {
    const el = this.page.locator(`[data-testid="location-tiles-${playerId}"]`)
    if (await el.count() === 0) return ''
    return el.textContent()
  }

  // ── Game over ────────────────────────────────────────

  async waitForGameOver() {
    await this.page.waitForSelector('[data-testid="gameover-modal"]', { timeout: 30000 })
  }

  async isGameOverVisible() {
    return this.page.locator('[data-testid="gameover-modal"]').isVisible()
  }

  async getScoreTotal(playerId: number) {
    const el = this.page.locator(`[data-testid="score-total-${playerId}"]`)
    if (await el.count() === 0) return null
    const text = await el.textContent()
    return parseInt(text || '0', 10)
  }

  async clickNewGame() {
    await this.page.click('[data-testid="new-game-btn"]')
  }
}
