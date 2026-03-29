import type { Page } from '@playwright/test'

export class GamePage {
  constructor(private page: Page) {}

  async getCurrentPlayer() {
    return this.page.locator('[data-testid="current-player"]').textContent()
  }

  async getCurrentTerrain() {
    return this.page.locator('[data-testid="current-terrain"]').textContent()
  }

  async getPlacementsCount() {
    const text = await this.page.locator('[data-testid="placements-count"]').textContent()
    return parseInt(text || '0', 10)
  }

  async getPlayerSettlements(playerId: number) {
    const text = await this.page.locator(`[data-testid="settlements-${playerId}"]`).textContent()
    return parseInt(text || '0', 10)
  }

  async getPlayerLocationTiles(playerId: number) {
    const el = this.page.locator(`[data-testid="location-tiles-${playerId}"]`)
    if (await el.count() === 0) return []
    const text = await el.textContent()
    return text?.replace('地點板塊:', '').trim().split(', ').filter(Boolean) || []
  }

  async clickUndo() {
    await this.page.click('[data-testid="undo-btn"]')
  }

  async clickEndTurn() {
    await this.page.click('[data-testid="end-turn-btn"]')
  }

  async isEndTurnEnabled() {
    const btn = this.page.locator('[data-testid="end-turn-btn"]')
    return !(await btn.isDisabled())
  }

  async isUndoEnabled() {
    const btn = this.page.locator('[data-testid="undo-btn"]')
    return !(await btn.isDisabled())
  }

  async waitForGameOver() {
    await this.page.waitForSelector('[data-testid="gameover-modal"]', { timeout: 10000 })
  }
}
