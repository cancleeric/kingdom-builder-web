import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialGameSnapshot, useGameStore } from './gameStore'

describe('gameStore turn guidance', () => {
    beforeEach(() => {
        useGameStore.setState(createInitialGameSnapshot())
    })

    it('exposes an actionable status on the initial turn', () => {
        const state = useGameStore.getState()

        expect(state.turn.phase).toBe('place-settlement')
        expect(state.status.title).toBe('玩家一 的回合')
        expect(state.status.detail).toContain('請在')
        expect(state.status.detail).toContain('還剩 3 個')
    })

    it('updates status after a legal settlement placement', () => {
        const firstMove = useGameStore.getState().availablePlacements[0]

        useGameStore.getState().placeOnBoard(firstMove.id)

        const state = useGameStore.getState()

        expect(state.turn.housesRemaining).toBe(2)
        expect(state.turn.phase).toBe('place-settlement')
        expect(state.status.detail).toContain('還剩 2 個')
        expect(state.status.detail).toContain('目前進度 1/3')
    })

    it('switches to turn transition status after the third placement', () => {
        for (let index = 0; index < 3; index += 1) {
            const move = useGameStore.getState().availablePlacements[0]
            useGameStore.getState().placeOnBoard(move.id)
        }

        const state = useGameStore.getState()

        expect(state.turn.number).toBe(2)
        expect(state.turn.phase).toBe('turn-transition')
        expect(state.turn.housesRemaining).toBe(3)
        expect(state.status.title).toBe('輪到 玩家一')
        expect(state.status.detail).toContain('新回合抽到')
    })
})