/**
 * Scoring Engine Property-Based Tests
 *
 * Property 9:  Match_Score Is Always in [0, 100]
 * Property 10: Scoring Monotonicity — Wish Bonus and Recency Penalty
 * Property 11: Surprise Me Returns a Top-20% Suggestion
 * Property 13: Sponsored Card Ratio Never Exceeds 1-in-5
 * Property 14: Diversity Guardrail Limits Same-Cuisine/Tier in Top 5
 * Property 17: Personalization Level Is Correctly Assigned by Memory Count
 *
 * Validates: Requirements 7.3, 7.4, 7.5, 7.11, 14.8, 19.2, 19.3, 19.6
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  scoreCandidate,
  computeWishBonus,
  computeRecencyPenalty,
  applyDiversityGuardrails,
  insertSponsoredCards,
  surpriseMe,
  type ScoringRestaurant,
  type ScoringWish,
  type ScoringMemory,
} from '@/lib/scoring/score'
import { getPersonalizationLevel } from '@/lib/scoring/weights'
import type { FilterState, TasteProfile } from '@/lib/types/domain'

// ─── Arbitraries ──────────────────────────────────────────────────

const cuisineArb = fc.constantFrom('Italian', 'Japanese', 'Mexican', 'Chinese', 'Indian', 'Thai', 'French', 'American')

const restaurantArb: fc.Arbitrary<ScoringRestaurant> = fc.record({
  id: fc.uuid(),
  place_id: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: null }),
  cuisine_tags: fc.array(cuisineArb, { minLength: 0, maxLength: 3 }),
  vibe_tags: fc.array(fc.string({ minLength: 2, maxLength: 15 }), { minLength: 0, maxLength: 3 }),
  price_level: fc.option(fc.integer({ min: 1, max: 4 }), { nil: null }),
  lat: fc.option(fc.float({ min: 25, max: 48 }), { nil: null }),
  lng: fc.option(fc.float({ min: -122, max: -70 }), { nil: null }),
})

const tasteProfileArb: fc.Arbitrary<TasteProfile> = fc.record({
  top_cuisines: fc.array(cuisineArb, { minLength: 0, maxLength: 5 }),
  top_tiers: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
  top_occasions: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
  avg_price_level: fc.float({ min: 1, max: 4 }),
  avg_overall_rating: fc.float({ min: 1, max: 10 }),
  memory_count: fc.integer({ min: 0, max: 100 }),
  personalization_level: fc.constantFrom('discovery' as const, 'early' as const, 'mature' as const),
})

const filterStateArb: fc.Arbitrary<FilterState> = fc.record({
  tiers: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 0, maxLength: 3 }),
  cuisines: fc.array(cuisineArb, { minLength: 0, maxLength: 3 }),
  price_levels: fc.array(fc.integer({ min: 1, max: 4 }) as fc.Arbitrary<1 | 2 | 3 | 4>, { minLength: 0, maxLength: 4 }),
  occasions: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 0, maxLength: 3 }),
  radius_miles: fc.integer({ min: 1, max: 50 }),
  city: fc.option(fc.string({ minLength: 2, maxLength: 30 }), { nil: null }),
  include_recent: fc.boolean(),
})

const locationArb = fc.option(
  fc.record({ lat: fc.float({ min: 25, max: 48 }), lng: fc.float({ min: -122, max: -70 }) }),
  { nil: null }
)

// ─── Property 9: Match_Score Is Always in [0, 100] ────────────────

describe('Property 9: Match_Score Is Always in [0, 100]', () => {
  it('scoreCandidate always returns match_score in [0, 100]', () => {
    fc.assert(
      fc.property(
        restaurantArb,
        tasteProfileArb,
        filterStateArb,
        fc.array(fc.record({ restaurant_id: fc.uuid(), priority: fc.constantFrom('low' as const, 'medium' as const, 'high' as const) }), { maxLength: 5 }),
        fc.array(fc.record({ restaurant_id: fc.uuid(), overall_rating: fc.integer({ min: 1, max: 10 }), food_rating: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }), vibe_rating: fc.option(fc.integer({ min: 1, max: 10 }), { nil: null }), visit_date: fc.constant(new Date().toISOString().split('T')[0]) }), { maxLength: 5 }),
        locationArb,
        fc.constantFrom('discovery' as const, 'early' as const, 'mature' as const),
        (restaurant, profile, filters, wishes, memories, location, level) => {
          const result = scoreCandidate(restaurant, profile, filters, wishes, memories, location, level)
          expect(result.match_score).toBeGreaterThanOrEqual(0)
          expect(result.match_score).toBeLessThanOrEqual(100)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 10: Scoring Monotonicity ───────────────────────────

describe('Property 10: Scoring Monotonicity — Wish Bonus and Recency Penalty', () => {
  it('wish bonus is strictly higher when restaurant is on Wishes list', () => {
    fc.assert(
      fc.property(restaurantArb, (restaurant) => {
        const withWish: ScoringWish[] = [{ restaurant_id: restaurant.id, priority: 'medium' }]
        const withoutWish: ScoringWish[] = []

        const bonusWithWish = computeWishBonus(restaurant, withWish)
        const bonusWithout = computeWishBonus(restaurant, withoutWish)

        expect(bonusWithWish).toBeGreaterThan(bonusWithout)
      }),
      { numRuns: 100 }
    )
  })

  it('recency penalty is higher for visits within 14 days vs no recent visit', () => {
    fc.assert(
      fc.property(restaurantArb, (restaurant) => {
        const recentDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
        const recentMemory: ScoringMemory[] = [{
          restaurant_id: restaurant.id,
          overall_rating: 8,
          food_rating: null,
          vibe_rating: null,
          visit_date: recentDate,
        }]
        const noMemory: ScoringMemory[] = []

        const penaltyRecent = computeRecencyPenalty(restaurant, recentMemory, false)
        const penaltyNone = computeRecencyPenalty(restaurant, noMemory, false)

        expect(penaltyRecent).toBeGreaterThan(penaltyNone)
      }),
      { numRuns: 100 }
    )
  })

  it('include_recent flag removes recency penalty', () => {
    fc.assert(
      fc.property(restaurantArb, (restaurant) => {
        const recentDate = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]
        const memory: ScoringMemory[] = [{
          restaurant_id: restaurant.id,
          overall_rating: 8,
          food_rating: null,
          vibe_rating: null,
          visit_date: recentDate,
        }]

        const penaltyWithFlag = computeRecencyPenalty(restaurant, memory, true)
        expect(penaltyWithFlag).toBe(0)
      }),
      { numRuns: 100 }
    )
  })
})

// ─── Property 11: Surprise Me Returns a Top-20% Suggestion ───────

describe('Property 11: Surprise Me Returns a Top-20% Suggestion', () => {
  it('surpriseMe result has score >= 80th percentile of the list', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ restaurant: restaurantArb, match_score: fc.float({ min: 0, max: 100 }) }),
          { minLength: 1, maxLength: 30 }
        ),
        (suggestions) => {
          const result = surpriseMe(suggestions)
          expect(result).not.toBeNull()

          const sorted = [...suggestions].sort((a, b) => b.match_score - a.match_score)
          const topCount = Math.max(1, Math.ceil(sorted.length * 0.2))
          const threshold = sorted[topCount - 1].match_score

          expect(result!.match_score).toBeGreaterThanOrEqual(threshold - 0.001) // float tolerance
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 13: Sponsored Card Ratio Never Exceeds 1-in-5 ──────

describe('Property 13: Sponsored Card Ratio Never Exceeds 1-in-5', () => {
  it('sponsored cards never exceed floor(organic_count / 5)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 10 }),
        (organicCount, sponsoredCount) => {
          const organic = Array.from({ length: organicCount }, (_, i) => ({
            id: `organic-${i}`,
            match_score: 80 - i,
            is_sponsored: false,
          }))
          const sponsored = Array.from({ length: sponsoredCount }, (_, i) => ({
            id: `sponsored-${i}`,
            match_score: 50,
            is_sponsored: true,
          }))

          const result = insertSponsoredCards(organic, sponsored)
          const sponsoredInResult = result.filter((r) => r.is_sponsored).length
          const maxAllowed = Math.floor(organicCount / 5)

          expect(sponsoredInResult).toBeLessThanOrEqual(maxAllowed)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('no two consecutive sponsored cards appear', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 50 }),
        fc.integer({ min: 1, max: 10 }),
        (organicCount, sponsoredCount) => {
          const organic = Array.from({ length: organicCount }, (_, i) => ({
            id: `o-${i}`, match_score: 80 - i, is_sponsored: false,
          }))
          const sponsored = Array.from({ length: sponsoredCount }, (_, i) => ({
            id: `s-${i}`, match_score: 50, is_sponsored: true,
          }))

          const result = insertSponsoredCards(organic, sponsored)

          for (let i = 0; i < result.length - 1; i++) {
            if (result[i].is_sponsored) {
              expect(result[i + 1].is_sponsored).toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 14: Diversity Guardrail ────────────────────────────

describe('Property 14: Diversity Guardrail Limits Same-Cuisine in Top 5', () => {
  it('top 5 results contain no more than 2 suggestions with the same primary cuisine', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            restaurant: restaurantArb,
            match_score: fc.float({ min: 0, max: 100 }),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        (suggestions) => {
          const sorted = [...suggestions].sort((a, b) => b.match_score - a.match_score)
          const diversified = applyDiversityGuardrails(sorted)
          const top5 = diversified.slice(0, 5)

          const cuisineCounts = new Map<string, number>()
          for (const s of top5) {
            const cuisine = s.restaurant.cuisine_tags[0]?.toLowerCase() ?? ''
            if (cuisine) {
              cuisineCounts.set(cuisine, (cuisineCounts.get(cuisine) ?? 0) + 1)
            }
          }

          for (const [cuisine, count] of cuisineCounts) {
            expect(count, `Cuisine "${cuisine}" appears ${count} times in top 5`).toBeLessThanOrEqual(2)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 17: Personalization Level Assignment ────────────────

describe('Property 17: Personalization Level Is Correctly Assigned by Memory Count', () => {
  it('returns discovery for count < 3', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 }), (count) => {
        expect(getPersonalizationLevel(count)).toBe('discovery')
      }),
      { numRuns: 100 }
    )
  })

  it('returns early for 3 <= count <= 9', () => {
    fc.assert(
      fc.property(fc.integer({ min: 3, max: 9 }), (count) => {
        expect(getPersonalizationLevel(count)).toBe('early')
      }),
      { numRuns: 100 }
    )
  })

  it('returns mature for count >= 10', () => {
    fc.assert(
      fc.property(fc.integer({ min: 10, max: 1000 }), (count) => {
        expect(getPersonalizationLevel(count)).toBe('mature')
      }),
      { numRuns: 100 }
    )
  })

  it('boundary values are correct', () => {
    expect(getPersonalizationLevel(0)).toBe('discovery')
    expect(getPersonalizationLevel(2)).toBe('discovery')
    expect(getPersonalizationLevel(3)).toBe('early')
    expect(getPersonalizationLevel(9)).toBe('early')
    expect(getPersonalizationLevel(10)).toBe('mature')
    expect(getPersonalizationLevel(100)).toBe('mature')
  })
})
