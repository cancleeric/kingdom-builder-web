/**
 * Terrain types in Kingdom Builder
 */
import { getRandom } from '../utils/seededRandom';

export enum Terrain {
  Grass = 'Grass',
  Forest = 'Forest',
  Desert = 'Desert',
  Flower = 'Flower',
  Canyon = 'Canyon',
  Water = 'Water',
  Mountain = 'Mountain',
}

/**
 * Special locations on the board
 */
export enum Location {
  Castle = 'Castle',
  Farm = 'Farm',
  Oasis = 'Oasis',
  Tower = 'Tower',
  Harbor = 'Harbor',
  Paddock = 'Paddock',
  Barn = 'Barn',
  Oracle = 'Oracle',
  Tavern = 'Tavern',
}

/**
 * Check if a terrain type can have settlements placed on it
 */
export function isBuildable(terrain: Terrain): boolean {
  return terrain !== Terrain.Mountain && terrain !== Terrain.Water;
}

/**
 * Get color for terrain type
 */
export function getTerrainColor(terrain: Terrain): string {
  switch (terrain) {
    case Terrain.Grass:
      return '#90EE90'; // Light green
    case Terrain.Forest:
      return '#228B22'; // Forest green
    case Terrain.Desert:
      return '#F4A460'; // Sandy brown
    case Terrain.Flower:
      return '#FFB6C1'; // Light pink
    case Terrain.Canyon:
      return '#D2691E'; // Chocolate brown
    case Terrain.Water:
      return '#4682B4'; // Steel blue
    case Terrain.Mountain:
      return '#808080'; // Gray
    default:
      return '#FFFFFF'; // White fallback
  }
}

/**
 * Get display name for terrain
 */
export function getTerrainName(terrain: Terrain): string {
  return terrain;
}

/**
 * Terrain card for drawing each turn
 */
export interface TerrainCard {
  terrain: Terrain;
}

/**
 * Create a standard deck of terrain cards (excluding non-buildable terrains)
 */
export function createTerrainDeck(): TerrainCard[] {
  const buildableTerrains = [
    Terrain.Grass,
    Terrain.Forest,
    Terrain.Desert,
    Terrain.Flower,
    Terrain.Canyon,
  ];

  // Create 5 cards of each buildable terrain type
  const deck: TerrainCard[] = [];
  buildableTerrains.forEach(terrain => {
    for (let i = 0; i < 5; i++) {
      deck.push({ terrain });
    }
  });

  return deck;
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm.
 * Uses the globally configured RNG so callers can pass ?seed= for
 * deterministic output during testing.
 */
export function shuffleDeck<T>(deck: T[]): T[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(getRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draw a card from the deck
 */
export function drawCard(deck: TerrainCard[]): { card: TerrainCard | null; remainingDeck: TerrainCard[] } {
  if (deck.length === 0) {
    return { card: null, remainingDeck: [] };
  }
  
  const [card, ...remainingDeck] = deck;
  return { card, remainingDeck };
}
