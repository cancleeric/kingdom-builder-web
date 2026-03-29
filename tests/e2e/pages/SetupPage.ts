import type { Page } from '@playwright/test'

/**
 * Helper for starting a game via URL parameters.
 * The app has no separate setup UI — it auto-starts on load.
 * Use goto() with a seed to get a deterministic game.
 */
export class SetupPage {
  constructor(private page: Page) {}

  async goto(seed?: number) {
    const url = seed !== undefined ? `/?seed=${seed}` : '/'
    await this.page.goto(url)
    await this.page.waitForSelector('[data-testid="game-page"]')
  }
}
