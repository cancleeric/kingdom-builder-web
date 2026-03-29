import { test, expect } from '@playwright/test'
import { SetupPage } from './pages/SetupPage'
import { GamePage } from './pages/GamePage'
import { BoardPage } from './pages/BoardPage'

test.describe('Setup Page', () => {
  test('shows setup page on load', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.goto()
    await expect(page.locator('[data-testid="setup-page"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Kingdom Builder')
  })

  test('can fill in player names and start game', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.startGame('Alice', 'Bob', 42)
    await expect(page.locator('[data-testid="game-page"]')).toBeVisible()
  })

  test('reads seed from URL params', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.goto(123)
    const seedInput = page.locator('[data-testid="seed-input"]')
    await expect(seedInput).toHaveValue('123')
  })
})

test.describe('Game Page', () => {
  test('shows current player and terrain after starting', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.startGame('Alice', 'Bob', 42)

    const game = new GamePage(page)
    const player = await game.getCurrentPlayer()
    expect(player).toContain('Alice')

    const terrain = await game.getCurrentTerrain()
    expect(terrain).toBeTruthy()
    expect(terrain!.length).toBeGreaterThan(0)
  })

  test('shows player settlements count', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.startGame('Alice', 'Bob', 42)

    const game = new GamePage(page)
    const settlements = await game.getPlayerSettlements(0)
    expect(settlements).toBe(40)
  })

  test('end turn button is disabled at start of turn', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.startGame('Alice', 'Bob', 42)

    const game = new GamePage(page)
    const enabled = await game.isEndTurnEnabled()
    expect(enabled).toBe(false)
  })

  test('undo button is disabled at start of turn', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.startGame('Alice', 'Bob', 42)

    const game = new GamePage(page)
    const enabled = await game.isUndoEnabled()
    expect(enabled).toBe(false)
  })
})

test.describe('Hex Board', () => {
  test('shows hex board with cells', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.startGame('Alice', 'Bob', 42)

    await expect(page.locator('[data-testid="hex-board"]')).toBeVisible()
    const hexCount = await page.locator('[data-testid^="hex-"][data-terrain]').count()
    expect(hexCount).toBe(100)
  })

  test('shows valid placement hexes', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.startGame('Alice', 'Bob', 42)

    const board = new BoardPage(page)
    const validHexes = await board.getValidHexes()
    expect(validHexes.length).toBeGreaterThan(0)
  })

  test('can place a settlement on valid hex', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.startGame('Alice', 'Bob', 42)

    const board = new BoardPage(page)
    const game = new GamePage(page)

    const initialSettlements = await game.getPlayerSettlements(0)
    await board.clickFirstValidHex()

    const newSettlements = await game.getPlayerSettlements(0)
    expect(newSettlements).toBe(initialSettlements - 1)

    const count = await game.getPlacementsCount()
    expect(count).toBe(1)
  })

  test('undo works after placing a settlement', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.startGame('Alice', 'Bob', 42)

    const board = new BoardPage(page)
    const game = new GamePage(page)

    const initialSettlements = await game.getPlayerSettlements(0)
    await board.clickFirstValidHex()

    const undoEnabled = await game.isUndoEnabled()
    expect(undoEnabled).toBe(true)

    await game.clickUndo()
    const afterUndoSettlements = await game.getPlayerSettlements(0)
    expect(afterUndoSettlements).toBe(initialSettlements)
  })

  test('can place 3 settlements and end turn', async ({ page }) => {
    const setup = new SetupPage(page)
    await setup.startGame('Alice', 'Bob', 42)

    const board = new BoardPage(page)
    const game = new GamePage(page)

    await board.placeNSettlements(3)

    const count = await game.getPlacementsCount()
    expect(count).toBe(3)

    const endTurnEnabled = await game.isEndTurnEnabled()
    expect(endTurnEnabled).toBe(true)

    await game.clickEndTurn()

    const player = await game.getCurrentPlayer()
    expect(player).toContain('Bob')
  })
})
