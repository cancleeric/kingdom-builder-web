import type { TFunction } from 'i18next';
import type { GamePhase } from '../types';
import type { Terrain, Location } from '../core/terrain';
import type { ObjectiveCard } from '../core/scoring';

/**
 * Format a season id ("YYYY-MM") into a localised label using the current i18n language.
 * e.g. zh-TW → "2026年6月 賽季"  /  en → "June 2026 Season"
 */
export function formatSeasonLabel(t: TFunction, language: string, seasonId: string): string {
  const [year, month] = seasonId.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const period = date.toLocaleString(language, { month: 'long', year: 'numeric' });
  return t('season.label', { period });
}

export function tPhase(t: TFunction, phase: GamePhase): string {
  return t(`phase.${phase}`);
}

export function tTerrain(t: TFunction, terrain: Terrain): string {
  return t(`terrain.${terrain}`);
}

export function tLocation(t: TFunction, location: Location): string {
  return t(`location.${location}`);
}

export function tLocationDescription(t: TFunction, location: Location): string {
  return t(`locationDescription.${location}`);
}

export function tObjective(t: TFunction, objective: ObjectiveCard): string {
  return t(`objective.${objective}`);
}

export function tObjectiveDescription(t: TFunction, objective: ObjectiveCard): string {
  return t(`objectiveDescription.${objective}`);
}
