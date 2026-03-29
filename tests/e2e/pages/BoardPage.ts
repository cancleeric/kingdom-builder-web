import type { Page } from '@playwright/test'

export class BoardPage {
  constructor(private page: Page) {}

  async getValidHexes() {
    return this.page.locator('[data-testid^="hex-"][data-valid="true"]').all()
  }

  async clickHex(q: number, r: number) {
    await this.page.click(`[data-testid="hex-${q}-${r}"]`)
  }

  async getHexOwner(q: number, r: number): Promise<string | null> {
    const el = this.page.locator(`[data-testid="hex-${q}-${r}"]`)
    const owner = await el.getAttribute('data-owner')
    return owner || null
  }

  async getHexTerrain(q: number, r: number): Promise<string | null> {
    const el = this.page.locator(`[data-testid="hex-${q}-${r}"]`)
    return el.getAttribute('data-terrain')
  }

  async clickFirstValidHex() {
    const validHexes = await this.getValidHexes()
    if (validHexes.length === 0) return null
    const first = validHexes[0]
    const testId = await first.getAttribute('data-testid')
    await first.click()
    return testId
  }

  async placeNSettlements(n: number) {
    for (let i = 0; i < n; i++) {
      const validHexes = await this.getValidHexes()
      if (validHexes.length === 0) break
      const hex = validHexes[0]
      const testId = await hex.getAttribute('data-testid')
      await hex.click()
      if (testId) {
        await this.page.waitForFunction(
          (id: string) => {
            const el = document.querySelector(`[data-testid="${id}"]`)
            return el?.getAttribute('data-owner') !== ''
          },
          testId,
        )
      }
    }
  }
}
