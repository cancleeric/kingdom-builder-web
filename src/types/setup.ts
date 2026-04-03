export interface PlayerConfig {
  id: number;
  name: string;
  color: string;
}

export type PlayerCount = 2 | 3 | 4;

export interface SetupConfig {
  playerCount: PlayerCount;
  players: PlayerConfig[];
}

export interface ColorOption {
  id: string;
  label: string;
  value: string;
}

export const OFFICIAL_COLORS: ColorOption[] = [
  { id: 'orange', label: '橙', value: '#F97316' },
  { id: 'blue',   label: '藍', value: '#3B82F6' },
  { id: 'white',  label: '白', value: '#E5E7EB' },
  { id: 'black',  label: '黑', value: '#374151' },
];

export const DEFAULT_PLAYER_NAMES = ['玩家1', '玩家2', '玩家3', '玩家4'];

export const SETUP_STORAGE_KEY = 'kingdom-builder-setup';
