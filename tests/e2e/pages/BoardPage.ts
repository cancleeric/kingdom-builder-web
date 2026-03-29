import type { Page } from '@playwright/test'

/**
 * Page Object for the hex game board (HexGrid / HexCell SVG elements).
 */
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
    return this.page.locator(`[data-testid="hex-${q}-${r}"]`).getAttribute('data-terrain')
  }

  /** Click the first available valid hex. Returns its data-testid, or null if none. */
  async clickFirstValidHex(): Promise<string | null> {
    const hexes = await this.getValidHexes()
    if (hexes.length === 0) return null
    const testId = await hexes[0].getAttribute('data-testid')
    await hexes[0].click()
    return testId
  }

  /** Place up to n settlements on valid hexes, waiting briefly between clicks. */
  async placeNSettlements(n: number) {
    for (let i = 0; i < n; i++) {
      const hexes = await this.getValidHexes()
      if (hexes.length === 0) break
      await hexes[0].click()
      await this.page.waitForTimeout(150)
    }
  }

  async getValidHexCount() {
    return this.page.locator('[data-testid^="hex-"][data-valid="true"]').count()
  }
}
