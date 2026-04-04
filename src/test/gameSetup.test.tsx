/**
 * Unit tests for GameSetup component and setup utilities.
 *
 * Covers:
 *  - Renders player count buttons (2/3/4)
 *  - Start button disabled when a name is empty
 *  - Start button enabled when all names are filled
 *  - Color conflict: already-selected color is disabled for other players
 *  - Player count change adds/removes player rows
 *  - onStart called with correct PlayerConfig[]
 *  - localStorage helpers: save/load round-trip
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { GameSetup } from '../components/Setup/GameSetup'
import {
  defaultPlayerConfigs,
  loadSavedConfigs,
  saveConfigs,
  PLAYER_COLORS,
  SETUP_STORAGE_KEY,
} from '../types/setup'

// ─── helpers ─────────────────────────────────────────────────────────────────

function renderSetup(onStart = vi.fn()) {
  return { onStart, ...render(<GameSetup onStart={onStart} />) }
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('GameSetup component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders player count buttons 2, 3, 4', () => {
    renderSetup()
    expect(screen.getByRole('button', { name: /2 人/ })).toBeDefined()
    expect(screen.getByRole('button', { name: /3 人/ })).toBeDefined()
    expect(screen.getByRole('button', { name: /4 人/ })).toBeDefined()
  })

  it('defaults to 2 players with pre-filled names', () => {
    renderSetup()
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
  })

  it('start button is enabled when all names are non-empty', () => {
    renderSetup()
    const startBtn = screen.getByRole('button', { name: '開始遊戲' })
    expect((startBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('start button is disabled when a name is cleared', () => {
    renderSetup()
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '' } })
    const startBtn = screen.getByRole('button', { name: '開始遊戲' })
    expect((startBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('clicking start calls onStart with correct configs', () => {
    const onStart = vi.fn()
    renderSetup(onStart)
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'Alice' } })
    fireEvent.change(inputs[1], { target: { value: 'Bob' } })
    fireEvent.click(screen.getByRole('button', { name: '開始遊戲' }))
    expect(onStart).toHaveBeenCalledOnce()
    const [configs] = onStart.mock.calls[0]
    expect(configs).toHaveLength(2)
    expect(configs[0].name).toBe('Alice')
    expect(configs[1].name).toBe('Bob')
  })

  it('switching to 3 players adds a third player row', () => {
    renderSetup()
    fireEvent.click(screen.getByRole('button', { name: /3 人/ }))
    expect(screen.getAllByRole('textbox')).toHaveLength(3)
  })

  it('switching back to 2 players removes the third row', () => {
    renderSetup()
    fireEvent.click(screen.getByRole('button', { name: /3 人/ }))
    fireEvent.click(screen.getByRole('button', { name: /2 人/ }))
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
  })

  it('color already used by player 1 is disabled for player 2', () => {
    renderSetup()
    // Player 1 has PLAYER_COLORS[0] by default; find corresponding color button for player 2
    const colorName = '橙色' // #F97316, first color
    const colorButtons = screen.getAllByLabelText(colorName)
    // There should be 2 buttons (one per player) for the same color label
    // The one for player 2 (index 1) should be disabled
    const disabledBtn = colorButtons.find(
      btn => (btn as HTMLButtonElement).disabled
    )
    expect(disabledBtn).toBeDefined()
  })

  it('name input is capped at 12 characters', () => {
    renderSetup()
    const input = screen.getAllByRole('textbox')[0]
    expect((input as HTMLInputElement).maxLength).toBe(12)
  })
})

// ─── localStorage utilities ───────────────────────────────────────────────────

describe('setup localStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaultPlayerConfigs returns correct count', () => {
    expect(defaultPlayerConfigs(2)).toHaveLength(2)
    expect(defaultPlayerConfigs(3)).toHaveLength(3)
    expect(defaultPlayerConfigs(4)).toHaveLength(4)
  })

  it('defaultPlayerConfigs ids start at 1', () => {
    const cfgs = defaultPlayerConfigs(3)
    expect(cfgs.map(c => c.id)).toEqual([1, 2, 3])
  })

  it('defaultPlayerConfigs uses distinct colors', () => {
    const cfgs = defaultPlayerConfigs(4)
    const colors = cfgs.map(c => c.color)
    expect(new Set(colors).size).toBe(4)
    expect(colors).toEqual([...PLAYER_COLORS])
  })

  it('loadSavedConfigs returns null when localStorage is empty', () => {
    expect(loadSavedConfigs()).toBeNull()
  })

  it('saveConfigs + loadSavedConfigs round-trip', () => {
    const original = defaultPlayerConfigs(3)
    saveConfigs(original)
    const loaded = loadSavedConfigs()
    expect(loaded).toEqual(original)
  })

  it('loadSavedConfigs returns null for invalid data', () => {
    localStorage.setItem(SETUP_STORAGE_KEY, 'not-json')
    expect(loadSavedConfigs()).toBeNull()
  })

  it('loadSavedConfigs returns null for empty array', () => {
    localStorage.setItem(SETUP_STORAGE_KEY, '[]')
    expect(loadSavedConfigs()).toBeNull()
  })
})
