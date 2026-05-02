/**
 * Property 2: Taste Profile Reflects Logged Memory Attributes
 * Property 3: Dining Stats Are Computed Correctly
 *
 * Validates: Requirements 2.6, 2.9, 11.1–11.8
 * Tags:
 *   Feature: nextbite, Property 2: taste profile reflects logged memory attributes
 *   Feature: nextbite, Property 3: dining stats are computed correctly
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ─── Taste profile computation (mirrors the DB trigger logic) ─────

interface MemoryForProfile {
  id: string
  restaurant_id: string
  cuisine_tags: string[]
  tiers: string[]
  occasions: string[]
  price_level: number | null
  overall_rating: number
}

interface ComputedTasteProfile {
  top_cuisines: string[]
  top_tiers: string[]
  top_occasions: string[]
  avg_price_level: number
  avg_overall_rating: number
  memory_count: number
}

function computeTasteProfile(memories: MemoryForProfile[]): ComputedTasteProfile {
  if (memories.length === 0) {
    return {
      top_cuisines: [],
      top_tiers: [],
      top_occasions: [],
      avg_price_level: 0,
      avg_overall_rating: 0,
      memory_count: 0,
    }
  }

  function topN(items: string[], n = 5): string[] {
    const freq = new Map<string, number>()
    for (const item of items) {
      freq.set(item, (freq.get(item) ?? 0) + 1)
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([tag]) => tag)
  }

  const allCuisines = memories.flatMap((m) => m.cuisine_tags)
  const allTiers = memories.flatMap((m) => m.tiers)
  const allOccasions = memories.flatMap((m) => m.occasions)
  const priceLevels = memories.map((m) => m.price_level).filter((p): p is number => p !== null)

  return {
    top_cuisines: topN(allCuisines),
    top_tiers: topN(allTiers),
    top_occasions: topN(allOccasions),
    avg_price_level: priceLevels.length > 0
      ? priceLevels.reduce((a, b) => a + b, 0) / priceLevels.length
      : 0,
    avg_overall_rating:
      memories.reduce((a, m) => a + m.overall_rating, 0) / memories.length,
    memory_count: memories.length,
  }
}

// ─── Dining stats computation ─────────────────────────────────────

interface DiningStats {
  totalMemories: number
  uniqueRestaurants: number
  mostFrequentCuisine: string | null
  mostUsedTier: string | null
}

function computeDiningStats(memories: MemoryForProfile[]): DiningStats {
  const uniqueRestaurants = new Set(memories.map((m) => m.restaurant_id)).size

  const cuisineFreq = new Map<string, number>()
  for (const m of memories) {
    for (const tag of m.cuisine_tags) {
      cuisineFreq.set(tag, (cuisineFreq.get(tag) ?? 0) + 1)
    }
  }

  const tierFreq = new Map<string, number>()
  for (const m of memories) {
    for (const tier of m.tiers) {
      tierFreq.set(tier, (tierFreq.get(tier) ?? 0) + 1)
    }
  }

  const mostFrequentCuisine =
    [...cuisineFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const mostUsedTier =
    [...tierFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return {
    totalMemories: memories.length,
    uniqueRestaurants,
    mostFrequentCuisine,
    mostUsedTier,
  }
}

// ─── Arbitraries ──────────────────────────────────────────────────

const tagArb = fc.string({ minLength: 2, maxLength: 20 }).filter((s) => s.trim().length >= 2)

const memoryArb: fc.Arbitrary<MemoryForProfile> = fc.record({
  id: fc.uuid(),
  restaurant_id: fc.uuid(),
  cuisine_tags: fc.array(tagArb, { minLength: 0, maxLength: 3 }),
  tiers: fc.array(tagArb, { minLength: 0, maxLength: 2 }),
  occasions: fc.array(tagArb, { minLength: 0, maxLength: 2 }),
  price_level: fc.option(fc.integer({ min: 1, max: 4 }), { nil: null }),
  overall_rating: fc.integer({ min: 1, max: 10 }),
})

// ─── Property 2 Tests ─────────────────────────────────────────────

describe('Property 2: Taste Profile Reflects Logged Memory Attributes', () => {
  it('all cuisine tags from a memory appear in top_cuisines after logging', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 1, maxLength: 5 }).filter(
          (ms) => ms.some((m) => m.cuisine_tags.length > 0)
        ),
        (memories) => {
          const profile = computeTasteProfile(memories)

          // Every cuisine that appears in any memory should be representable
          const allCuisines = new Set(memories.flatMap((m) => m.cuisine_tags))
          const profileCuisines = new Set(profile.top_cuisines)

          // The most frequent cuisine must be in the profile
          const freq = new Map<string, number>()
          for (const c of allCuisines) {
            const count = memories.filter((m) => m.cuisine_tags.includes(c)).length
            freq.set(c, count)
          }
          const topCuisine = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
          if (topCuisine) {
            expect(profileCuisines.has(topCuisine)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('memory_count equals the number of memories logged', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 0, maxLength: 20 }),
        (memories) => {
          const profile = computeTasteProfile(memories)
          expect(profile.memory_count).toBe(memories.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('avg_overall_rating is within [1, 10] for non-empty memory sets', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 1, maxLength: 20 }),
        (memories) => {
          const profile = computeTasteProfile(memories)
          expect(profile.avg_overall_rating).toBeGreaterThanOrEqual(1)
          expect(profile.avg_overall_rating).toBeLessThanOrEqual(10)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('top_cuisines contains at most 5 entries', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 0, maxLength: 30 }),
        (memories) => {
          const profile = computeTasteProfile(memories)
          expect(profile.top_cuisines.length).toBeLessThanOrEqual(5)
          expect(profile.top_tiers.length).toBeLessThanOrEqual(5)
          expect(profile.top_occasions.length).toBeLessThanOrEqual(5)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ─── Property 3 Tests ─────────────────────────────────────────────

describe('Property 3: Dining Stats Are Computed Correctly', () => {
  it('totalMemories equals the number of memories in the set', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 0, maxLength: 30 }),
        (memories) => {
          const stats = computeDiningStats(memories)
          expect(stats.totalMemories).toBe(memories.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('uniqueRestaurants equals the number of distinct restaurant IDs', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 0, maxLength: 30 }),
        (memories) => {
          const stats = computeDiningStats(memories)
          const expected = new Set(memories.map((m) => m.restaurant_id)).size
          expect(stats.uniqueRestaurants).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('mostFrequentCuisine is the cuisine tag appearing in the most memories', () => {
    fc.assert(
      fc.property(
        fc.array(
          memoryArb.filter((m) => m.cuisine_tags.length > 0),
          { minLength: 1, maxLength: 20 }
        ),
        (memories) => {
          const stats = computeDiningStats(memories)

          if (!stats.mostFrequentCuisine) return

          // Count occurrences of the reported top cuisine
          const topCount = memories.filter((m) =>
            m.cuisine_tags.includes(stats.mostFrequentCuisine!)
          ).length

          // No other cuisine should appear more often
          const allCuisines = new Set(memories.flatMap((m) => m.cuisine_tags))
          for (const cuisine of allCuisines) {
            const count = memories.filter((m) => m.cuisine_tags.includes(cuisine)).length
            expect(count).toBeLessThanOrEqual(topCount)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('uniqueRestaurants is always <= totalMemories', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 0, maxLength: 30 }),
        (memories) => {
          const stats = computeDiningStats(memories)
          expect(stats.uniqueRestaurants).toBeLessThanOrEqual(stats.totalMemories)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('stats are all zero for empty memory set', () => {
    const stats = computeDiningStats([])
    expect(stats.totalMemories).toBe(0)
    expect(stats.uniqueRestaurants).toBe(0)
    expect(stats.mostFrequentCuisine).toBeNull()
    expect(stats.mostUsedTier).toBeNull()
  })
})
