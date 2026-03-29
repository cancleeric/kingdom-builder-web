import { describe, it, expect } from 'vitest';
import { Terrain, createTerrainDeck, shuffleDeck, drawCard, isBuildable } from './terrain';

describe('Terrain', () => {
  describe('isBuildable', () => {
    it('should return true for buildable terrains', () => {
      expect(isBuildable(Terrain.Grass)).toBe(true);
      expect(isBuildable(Terrain.Forest)).toBe(true);
      expect(isBuildable(Terrain.Desert)).toBe(true);
      expect(isBuildable(Terrain.Flower)).toBe(true);
      expect(isBuildable(Terrain.Canyon)).toBe(true);
    });

    it('should return false for Mountain', () => {
      expect(isBuildable(Terrain.Mountain)).toBe(false);
    });

    it('should return false for Water', () => {
      expect(isBuildable(Terrain.Water)).toBe(false);
    });
  });

  describe('createTerrainDeck', () => {
    it('should create a deck of 25 cards total', () => {
      const deck = createTerrainDeck();
      expect(deck).toHaveLength(25);
    });

    it('should contain exactly 5 Grass cards', () => {
      const deck = createTerrainDeck();
      const grassCards = deck.filter(card => card.terrain === Terrain.Grass);
      expect(grassCards).toHaveLength(5);
    });

    it('should contain exactly 5 Forest cards', () => {
      const deck = createTerrainDeck();
      const forestCards = deck.filter(card => card.terrain === Terrain.Forest);
      expect(forestCards).toHaveLength(5);
    });

    it('should contain exactly 5 Desert cards', () => {
      const deck = createTerrainDeck();
      const desertCards = deck.filter(card => card.terrain === Terrain.Desert);
      expect(desertCards).toHaveLength(5);
    });

    it('should contain exactly 5 Flower cards', () => {
      const deck = createTerrainDeck();
      const flowerCards = deck.filter(card => card.terrain === Terrain.Flower);
      expect(flowerCards).toHaveLength(5);
    });

    it('should contain exactly 5 Canyon cards', () => {
      const deck = createTerrainDeck();
      const canyonCards = deck.filter(card => card.terrain === Terrain.Canyon);
      expect(canyonCards).toHaveLength(5);
    });

    it('should not contain Mountain or Water cards', () => {
      const deck = createTerrainDeck();
      const mountainCards = deck.filter(card => card.terrain === Terrain.Mountain);
      const waterCards = deck.filter(card => card.terrain === Terrain.Water);
      expect(mountainCards).toHaveLength(0);
      expect(waterCards).toHaveLength(0);
    });
  });

  describe('drawCard', () => {
    it('should reduce deck size by 1 after drawing', () => {
      const deck = createTerrainDeck();
      const initialSize = deck.length;
      const { remainingDeck } = drawCard(deck);
      expect(remainingDeck).toHaveLength(initialSize - 1);
    });

    it('should return a card on draw', () => {
      const deck = createTerrainDeck();
      const { card } = drawCard(deck);
      expect(card).not.toBeNull();
      expect(card?.terrain).toBeDefined();
    });

    it('should return null card when deck is empty', () => {
      const { card, remainingDeck } = drawCard([]);
      expect(card).toBeNull();
      expect(remainingDeck).toHaveLength(0);
    });

    it('should allow drawing all 25 cards until deck is empty', () => {
      let deck = createTerrainDeck();
      let drawnCount = 0;

      while (deck.length > 0) {
        const { card, remainingDeck } = drawCard(deck);
        expect(card).not.toBeNull();
        drawnCount++;
        deck = remainingDeck;
      }

      expect(drawnCount).toBe(25);
      expect(deck).toHaveLength(0);
    });

    it('should allow reshuffling and drawing again after deck is empty', () => {
      let deck = createTerrainDeck();

      // Draw all 25 cards
      while (deck.length > 0) {
        const { remainingDeck } = drawCard(deck);
        deck = remainingDeck;
      }

      // Reshuffle (create new deck)
      const newDeck = shuffleDeck(createTerrainDeck());
      expect(newDeck).toHaveLength(25);

      // Can draw from new deck
      const { card } = drawCard(newDeck);
      expect(card).not.toBeNull();
    });
  });

  describe('shuffleDeck', () => {
    it('should return a deck with the same number of cards', () => {
      const deck = createTerrainDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled).toHaveLength(deck.length);
    });

    it('should not modify the original deck', () => {
      const deck = createTerrainDeck();
      const originalFirst = deck[0].terrain;
      shuffleDeck(deck);
      expect(deck[0].terrain).toBe(originalFirst);
    });

    it('should preserve all card types after shuffling', () => {
      const deck = createTerrainDeck();
      const shuffled = shuffleDeck(deck);
      const terrainCounts = (d: typeof deck) =>
        d.reduce<Record<string, number>>((acc, card) => {
          acc[card.terrain] = (acc[card.terrain] || 0) + 1;
          return acc;
        }, {});

      expect(terrainCounts(shuffled)).toEqual(terrainCounts(deck));
    });
  });
});
