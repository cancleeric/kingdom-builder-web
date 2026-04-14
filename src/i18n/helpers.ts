import type { TFunction } from 'i18next'
import { Terrain, Location } from '../core/terrain'
import { ObjectiveCard } from '../core/scoring'
import { GamePhase, BotDifficulty } from '../types'

export function tTerrain(t: TFunction, terrain: Terrain): string {
  return t(`terrain.${terrain}`, { defaultValue: terrain })
}

export function tLocation(t: TFunction, location: Location): string {
  return t(`location.${location}`, { defaultValue: location })
}

export function tObjective(t: TFunction, objective: ObjectiveCard): string {
  return t(`objective.${objective}`, { defaultValue: objective })
}

export function tPhase(t: TFunction, phase: GamePhase): string {
  return t(`phase.${phase}`, { defaultValue: phase })
}

export function tDifficulty(t: TFunction, difficulty: BotDifficulty): string {
  return t(`difficulty.${difficulty}`, { defaultValue: difficulty })
}
