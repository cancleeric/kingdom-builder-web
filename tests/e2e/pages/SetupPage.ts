import type { Page } from '@playwright/test'

export class SetupPage {
  constructor(private page: Page) {}

  async goto(seed?: number) {
    const url = seed !== undefined ? `/?seed=${seed}` : '/'
    await this.page.goto(url)
  }

  async setPlayerName(index: number, name: string) {
    await this.page.fill(`[data-testid="player-name-${index}"]`, name)
  }

  async setSeed(seed: number) {
    await this.page.fill('[data-testid="seed-input"]', String(seed))
  }

  async clickStart() {
    await this.page.click('[data-testid="start-game-btn"]')
  }

  async startGame(player1 = 'Alice', player2 = 'Bob', seed = 42) {
    await this.goto(seed)
    await this.setPlayerName(1, player1)
    await this.setPlayerName(2, player2)
    await this.setSeed(seed)
    await this.clickStart()
  }
}
