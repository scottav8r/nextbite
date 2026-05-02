/**
 * Pure scoring functions for the NextBite Suggestion Engine.
 * All functions are side-effect free and shared between the client
 * and the Supabase Edge Function (Deno).
 *
 * Scoring formula (Req 19.2):
 *   Match_Score = (0.35 × TasteMatch)
 *               + (0.25 × FilterMatch)
 *               + (0.15 × WishBonus)
 *               + (0.10 × RatingBonus)
 *               + (0.05 × DistanceScore)
 *               − RecencyPenalty
 *
 * All component scores are in [0, 100] before weighting.
 * Final Match_Score is clamped to [0, 100].
 */

import { getWeights, getPersonalizationLevel, type PersonalizationLevel } from './weights'
import type { FilterState, TasteProfile } from '@/lib/types/domain'

// ─── Types ────────────────────────────────────────────────────────

export interface ScoringRestaurant {
  id: string
  place_id: string | null
  cuisine_tags: string[]
  vibe_tags: string[]
  price_level: number | null
  lat: number | null
  lng: number | null
}

export interface ScoringWish {
  restaurant_id: string
  priority: 'low' | 'medium' | 'high'
}

export interface ScoringMemory {
  restaurant_id: string
  overall_rating: number
  food_rating: number | null
  vibe_rating: number | null
  visit_date: string
}

export interface LatLng {
  lat: number
  lng: number
}

export interface ScoreBreakdown {
  taste_match: number
  filter_match: number
  wish_bonus: number
  rating_bonus: number
  distance_score: number
  recency_penalty: number
  match_score: number
}

// ─── Main scoring function ────────────────────────────────────────

export function scoreCandidate(
  restaurant: ScoringRestaurant,
  tasteProfile: TasteProfile,
  filters: FilterState,
  wishes: ScoringWish[],
  recentMemories: ScoringMemory[],
  userLocation: LatLng | null,
  personalizationLevel: PersonalizationLevel
): ScoreBreakdown {
  const weights = getWeights(personalizationLevel)

  const tasteMatch = computeTasteMatch(restaurant, tasteProfile, personalizationLevel)
  const filterMatch = computeFilterMatch(restaurant, filters)
  const wishBonus = computeWishBonus(restaurant, wishes)
  const ratingBonus = computeRatingBonus(restaurant, recentMemories)
  const distanceScore = computeDistanceScore(restaurant, userLocation, filters.radius_miles)
  const recencyPenalty = computeRecencyPenalty(restaurant, recentMemories, filters.include_recent)

  const raw =
    weights.tasteMatch * tasteMatch +
    weights.filterMatch * filterMatch +
    weights.wishBonus * wishBonus +
    weights.ratingBonus * ratingBonus +
    weights.distanceScore * distanceScore -
    recencyPenalty

  return {
    taste_match: tasteMatch,
    filter_match: filterMatch,
    wish_bonus: wishBonus,
    rating_bonus: ratingBonus,
    distance_score: distanceScore,
    recency_penalty: recencyPenalty,
    match_score: Math.max(0, Math.min(100, raw)),
  }
}

// ─── TasteMatch (0–100) ───────────────────────────────────────────

export function computeTasteMatch(
  restaurant: ScoringRestaurant,
  profile: TasteProfile,
  level: PersonalizationLevel
): number {
  if (level === 'discovery') {
    // Fall back to explicit profile preferences only
    return computeTagOverlap(restaurant.cuisine_tags, profile.top_cuisines) * 100
  }

  const cuisineScore = computeTagOverlap(restaurant.cuisine_tags, profile.top_cuisines)
  const vibeScore = computeTagOverlap(restaurant.vibe_tags, profile.top_tiers)
  const priceScore = computePriceAlignment(restaurant.price_level, profile.avg_price_level)
  const highRatedScore = computeHighRatedSimilarity(restaurant, profile)

  return Math.min(
    100,
    (cuisineScore * 0.40 + vibeScore * 0.25 + priceScore * 0.20 + highRatedScore * 0.15) * 100
  )
}

function computeTagOverlap(restaurantTags: string[], profileTags: string[]): number {
  if (!profileTags.length || !restaurantTags.length) return 0
  const profileSet = new Set(profileTags.map((t) => t.toLowerCase()))
  const matches = restaurantTags.filter((t) => profileSet.has(t.toLowerCase())).length
  return Math.min(1, matches / Math.max(1, profileTags.length))
}

function computePriceAlignment(
  restaurantPrice: number | null,
  avgProfilePrice: number
): number {
  if (!restaurantPrice || !avgProfilePrice) return 0.5
  const diff = Math.abs(restaurantPrice - avgProfilePrice)
  return Math.max(0, 1 - diff / 3)
}

function computeHighRatedSimilarity(
  restaurant: ScoringRestaurant,
  profile: TasteProfile
): number {
  // Proxy: cuisine overlap with top cuisines from high-rated memories
  return computeTagOverlap(restaurant.cuisine_tags, profile.top_cuisines)
}

// ─── FilterMatch (0–100) ──────────────────────────────────────────

export function computeFilterMatch(
  restaurant: ScoringRestaurant,
  filters: FilterState
): number {
  let totalCriteria = 0
  let matchedCriteria = 0

  if (filters.cuisines.length > 0) {
    totalCriteria++
    const cuisineSet = new Set(filters.cuisines.map((c) => c.toLowerCase()))
    if (restaurant.cuisine_tags.some((t) => cuisineSet.has(t.toLowerCase()))) {
      matchedCriteria++
    }
  }

  if (filters.price_levels.length > 0) {
    totalCriteria++
    if (restaurant.price_level && filters.price_levels.includes(restaurant.price_level as 1 | 2 | 3 | 4)) {
      matchedCriteria++
    }
  }

  if (totalCriteria === 0) return 100 // No active filters = perfect match
  return (matchedCriteria / totalCriteria) * 100
}

// ─── WishBonus (0–100) ────────────────────────────────────────────

export function computeWishBonus(
  restaurant: ScoringRestaurant,
  wishes: ScoringWish[]
): number {
  const wish = wishes.find((w) => w.restaurant_id === restaurant.id)
  if (!wish) return 0
  switch (wish.priority) {
    case 'high': return 100
    case 'medium': return 70
    case 'low': return 40
  }
}

// ─── RatingBonus (0–100) ──────────────────────────────────────────

export function computeRatingBonus(
  restaurant: ScoringRestaurant,
  memories: ScoringMemory[]
): number {
  const restaurantMemories = memories.filter((m) => m.restaurant_id === restaurant.id)
  if (!restaurantMemories.length) return 0

  const scores = restaurantMemories.map((m) => {
    const food = m.food_rating ?? m.overall_rating
    const vibe = m.vibe_rating ?? m.overall_rating
    return (food * 0.6 + vibe * 0.4) / 10
  })

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return avg * 100
}

// ─── DistanceScore (0–100) ────────────────────────────────────────

export function computeDistanceScore(
  restaurant: ScoringRestaurant,
  userLocation: LatLng | null,
  radiusMiles: number
): number {
  if (!userLocation || !restaurant.lat || !restaurant.lng) return 50 // neutral

  const distMiles = haversineDistanceMiles(
    userLocation.lat, userLocation.lng,
    restaurant.lat, restaurant.lng
  )

  const maxRadius = Math.max(radiusMiles, 1)
  return Math.max(0, (1 - distMiles / maxRadius) * 100)
}

function haversineDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8 // Earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// ─── RecencyPenalty (0–30) ────────────────────────────────────────

export function computeRecencyPenalty(
  restaurant: ScoringRestaurant,
  memories: ScoringMemory[],
  includeRecent: boolean
): number {
  if (includeRecent) return 0

  const restaurantMemories = memories.filter((m) => m.restaurant_id === restaurant.id)
  if (!restaurantMemories.length) return 0

  const mostRecent = restaurantMemories
    .map((m) => new Date(m.visit_date).getTime())
    .sort((a, b) => b - a)[0]

  const daysSince = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24)

  if (daysSince <= 14) return 20
  if (daysSince <= 30) return 10
  return 0
}

// ─── Diversity guardrails ─────────────────────────────────────────

export interface RankedSuggestion {
  restaurant: ScoringRestaurant
  match_score: number
  [key: string]: unknown
}

/**
 * Ensures no more than 2 suggestions from the same cuisine or tier
 * appear in the top 5 results (Req 19.6.3).
 */
export function applyDiversityGuardrails<T extends RankedSuggestion>(
  suggestions: T[]
): T[] {
  const result: T[] = []
  const cuisineCounts = new Map<string, number>()

  for (const suggestion of suggestions) {
    const primaryCuisine = suggestion.restaurant.cuisine_tags[0]?.toLowerCase() ?? ''

    const cuisineCount = cuisineCounts.get(primaryCuisine) ?? 0

    // In top 5: enforce max 2 per cuisine
    if (result.length < 5 && primaryCuisine && cuisineCount >= 2) {
      continue
    }

    result.push(suggestion)
    if (primaryCuisine) {
      cuisineCounts.set(primaryCuisine, cuisineCount + 1)
    }
  }

  return result
}

/**
 * Inserts sponsored cards at max 1 per 5 organic results (Req 14.8, 19.6.5).
 * No two consecutive sponsored cards.
 */
export function insertSponsoredCards<T extends { is_sponsored?: boolean }>(
  organic: T[],
  sponsored: T[]
): T[] {
  if (!sponsored.length) return organic

  const result: T[] = []
  let sponsoredIdx = 0
  let organicSinceLastSponsored = 0

  for (const item of organic) {
    result.push(item)
    organicSinceLastSponsored++

    if (organicSinceLastSponsored >= 5 && sponsoredIdx < sponsored.length) {
      result.push(sponsored[sponsoredIdx++])
      organicSinceLastSponsored = 0
    }
  }

  return result
}

/**
 * Surprise Me: returns a random suggestion from the top 20% by score (Req 7.11, 19.6.4).
 */
export function surpriseMe<T extends { match_score: number }>(suggestions: T[]): T | null {
  if (!suggestions.length) return null

  const sorted = [...suggestions].sort((a, b) => b.match_score - a.match_score)
  const topCount = Math.max(1, Math.ceil(sorted.length * 0.2))
  const topPool = sorted.slice(0, topCount)

  return topPool[Math.floor(Math.random() * topPool.length)]
}
