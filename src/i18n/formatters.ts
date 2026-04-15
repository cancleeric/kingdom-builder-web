import type { TFunction } from 'i18next';
import type { GamePhase } from '../types';
import type { Terrain, Location } from '../core/terrain';
import type { ObjectiveCard } from '../core/scoring';

export function tPhase(t: TFunction, phase: GamePhase): string {
  return t(`phase.${phase}`);
}

export function tTerrain(t: TFunction, terrain: Terrain): string {
  return t(`terrain.${terrain}`);
}

export function tLocation(t: TFunction, location: Location): string {
  return t(`location.${location}`);
}

export function tObjective(t: TFunction, objective: ObjectiveCard): string {
  return t(`objective.${objective}`);
}
