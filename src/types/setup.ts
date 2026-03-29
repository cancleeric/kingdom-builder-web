export type PlayerColor = 'orange' | 'blue' | 'white' | 'black';

export interface PlayerConfig {
  id: number;
  name: string;
  color: PlayerColor;
}

export type PlayerCount = 2 | 3 | 4;
