import type { Page } from '@playwright/test'

/**
 * Helper for starting a game via URL parameters.
 * The app shows a SetupScreen on load where players choose Human or Bot.
 * Use goto() with a seed to get a deterministic game after clicking Start.
 */
export class SetupPage {
  constructor(private page: Page) {}

  async goto(seed?: number) {
    const url = seed !== undefined ? `/?seed=${seed}` : '/'
    await this.page.goto(url)
    // Start the game with default settings (click Start Game button)
    await this.page.click('[data-testid="start-game-btn"]')
    await this.page.waitForSelector('[data-testid="game-page"]')
  }
}
