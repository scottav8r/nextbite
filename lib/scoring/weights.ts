/**
 * Scoring weights by personalization level (Req 19.3).
 * Weights must sum to 1.0 for each level.
 */

export type PersonalizationLevel = 'discovery' | 'early' | 'mature'

export interface ScoringWeights {
  tasteMatch: number
  filterMatch: number
  wishBonus: number
  ratingBonus: number
  distanceScore: number
}

export function getPersonalizationLevel(memoryCount: number): PersonalizationLevel {
  if (memoryCount < 3) return 'discovery'
  if (memoryCount <= 9) return 'early'
  return 'mature'
}

export function getWeights(level: PersonalizationLevel): ScoringWeights {
  switch (level) {
    case 'discovery':
      return { tasteMatch: 0.20, filterMatch: 0.40, wishBonus: 0.15, ratingBonus: 0.10, distanceScore: 0.05 }
    case 'early':
      return { tasteMatch: 0.25, filterMatch: 0.35, wishBonus: 0.15, ratingBonus: 0.10, distanceScore: 0.05 }
    case 'mature':
      return { tasteMatch: 0.35, filterMatch: 0.25, wishBonus: 0.15, ratingBonus: 0.10, distanceScore: 0.05 }
  }
}
