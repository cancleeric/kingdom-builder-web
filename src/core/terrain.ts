/**
 * Terrain types available on the board
 */
export const Terrain = {
  Grass: 'Grass',
  Forest: 'Forest',
  Desert: 'Desert',
  Flower: 'Flower',
  Canyon: 'Canyon',
  Water: 'Water',
  Mountain: 'Mountain',
} as const;
export type Terrain = (typeof Terrain)[keyof typeof Terrain];

/**
 * Location types (special tiles placed on the board)
 */
export const Location = {
  Castle: 'Castle',
  Farm: 'Farm',
  Oasis: 'Oasis',
  Tower: 'Tower',
  Harbor: 'Harbor',
  Paddock: 'Paddock',
  Barn: 'Barn',
  Oracle: 'Oracle',
} as const;
export type Location = (typeof Location)[keyof typeof Location];

/**
 * A terrain card drawn during the game
 */
export interface TerrainCard {
  terrain: Terrain;
}

/**
 * Check if a terrain type allows settlement placement
 */
export function isBuildable(terrain: Terrain): boolean {
  return terrain !== Terrain.Mountain && terrain !== Terrain.Water;
}

/**
 * Get the CSS color for a terrain type
 */
export function getTerrainColor(terrain: Terrain): string {
  switch (terrain) {
    case Terrain.Grass:
      return '#90EE90';
    case Terrain.Forest:
      return '#228B22';
    case Terrain.Desert:
      return '#F4A460';
    case Terrain.Flower:
      return '#FFB6C1';
    case Terrain.Canyon:
      return '#D2691E';
    case Terrain.Water:
      return '#4682B4';
    case Terrain.Mountain:
      return '#808080';
  }
}

/**
 * Get the display name for a terrain type
 */
export function getTerrainName(terrain: Terrain): string {
  return terrain;
}

/**
 * Create a standard terrain deck (5 cards of each buildable terrain)
 */
export function createTerrainDeck(): TerrainCard[] {
  const buildableTerrains = [
    Terrain.Grass,
    Terrain.Forest,
    Terrain.Desert,
    Terrain.Flower,
    Terrain.Canyon,
  ];

  return buildableTerrains.flatMap(terrain =>
    Array.from({ length: 5 }, () => ({ terrain }))
  );
}

/**
 * Fisher-Yates shuffle
 */
export function shuffleDeck<T>(deck: T[]): T[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draw a card from the deck
 */
export function drawCard(deck: TerrainCard[]): {
  card: TerrainCard | null;
  remainingDeck: TerrainCard[];
} {
  if (deck.length === 0) {
    return { card: null, remainingDeck: [] };
  }
  const [card, ...remainingDeck] = deck;
  return { card, remainingDeck };
}
