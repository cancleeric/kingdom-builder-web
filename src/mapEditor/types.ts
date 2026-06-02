import { Terrain, Location } from '../core/terrain';

export interface CustomMapCell {
  q: number;
  r: number;
  terrain: Terrain;
  location?: Location;
}

export interface CustomMapPayload {
  v: 1;
  w: number;
  h: number;
  cells: CustomMapCell[];
}

export interface CustomMapRecord {
  id: string;
  name: string;
  createdAt: string;
  mapData: CustomMapPayload;
}
