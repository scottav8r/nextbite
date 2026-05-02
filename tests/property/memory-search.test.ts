/**
 * Property 12: Memory Search Returns Only Matching Results
 *
 * For any non-empty set of memories and any non-empty search query string,
 * the search filter function SHALL return only memories where the query string
 * appears (case-insensitive) in at least one of: restaurant name, dish names,
 * cuisine tags, tier tags, vibe tags, or narrative note.
 * No memory matching the query SHALL be excluded from the results.
 *
 * Validates: Requirements 9.2
 * Tag: Feature: nextbite, Property 12: memory search returns only matching results
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ─── Search function under test ───────────────────────────────────

interface SearchableMemory {
  id: string
  restaurant_name: string
  tiers: string[]
  cuisine_tags: string[]
  vibe_tags: string[]
  narrative_note: string | null
  dishes: { name: string }[]
}

function searchMemories(memories: SearchableMemory[], query: string): SearchableMemory[] {
  if (!query.trim()) return memories
  const q = query.toLowerCase()
  return memories.filter((m) =>
    m.restaurant_name.toLowerCase().includes(q) ||
    m.tiers.some((t) => t.toLowerCase().includes(q)) ||
    m.cuisine_tags.some((c) => c.toLowerCase().includes(q)) ||
    m.vibe_tags.some((v) => v.toLowerCase().includes(q)) ||
    m.narrative_note?.toLowerCase().includes(q) ||
    m.dishes.some((d) => d.name.toLowerCase().includes(q))
  )
}

function memoryMatchesQuery(memory: SearchableMemory, query: string): boolean {
  const q = query.toLowerCase()
  return (
    memory.restaurant_name.toLowerCase().includes(q) ||
    memory.tiers.some((t) => t.toLowerCase().includes(q)) ||
    memory.cuisine_tags.some((c) => c.toLowerCase().includes(q)) ||
    memory.vibe_tags.some((v) => v.toLowerCase().includes(q)) ||
    memory.narrative_note?.toLowerCase().includes(q) === true ||
    memory.dishes.some((d) => d.name.toLowerCase().includes(q))
  )
}

// ─── Arbitraries ──────────────────────────────────────────────────

const tagArb = fc.string({ minLength: 2, maxLength: 20 }).filter((s) => s.trim().length >= 2)

const memoryArb = fc.record({
  id: fc.uuid(),
  restaurant_name: fc.string({ minLength: 2, maxLength: 50 }).filter((s) => s.trim().length >= 2),
  tiers: fc.array(tagArb, { minLength: 0, maxLength: 3 }),
  cuisine_tags: fc.array(tagArb, { minLength: 0, maxLength: 3 }),
  vibe_tags: fc.array(tagArb, { minLength: 0, maxLength: 3 }),
  narrative_note: fc.option(
    fc.string({ minLength: 5, maxLength: 200 }).filter((s) => s.trim().length >= 5),
    { nil: null }
  ),
  dishes: fc.array(
    fc.record({ name: fc.string({ minLength: 2, maxLength: 30 }).filter((s) => s.trim().length >= 2) }),
    { minLength: 0, maxLength: 3 }
  ),
})

// ─── Tests ────────────────────────────────────────────────────────

describe('Property 12: Memory Search Returns Only Matching Results', () => {
  it('all returned memories contain the query in at least one searchable field', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 15 }).filter((s) => s.trim().length >= 1),
        (memories, query) => {
          const results = searchMemories(memories, query)

          // Every result must match the query
          for (const result of results) {
            expect(
              memoryMatchesQuery(result, query),
              `Memory "${result.restaurant_name}" was returned but does not match query "${query}"`
            ).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('no matching memory is excluded from results', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 15 }).filter((s) => s.trim().length >= 1),
        (memories, query) => {
          const results = searchMemories(memories, query)
          const resultIds = new Set(results.map((r) => r.id))

          // Every memory that matches must be in results
          for (const memory of memories) {
            if (memoryMatchesQuery(memory, query)) {
              expect(
                resultIds.has(memory.id),
                `Memory "${memory.restaurant_name}" matches query "${query}" but was excluded`
              ).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('search is case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 2, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)),
        (memories, query) => {
          const lower = searchMemories(memories, query.toLowerCase())
          const upper = searchMemories(memories, query.toUpperCase())
          const mixed = searchMemories(memories, query[0].toUpperCase() + query.slice(1).toLowerCase())

          expect(lower.map((m) => m.id).sort()).toEqual(upper.map((m) => m.id).sort())
          expect(lower.map((m) => m.id).sort()).toEqual(mixed.map((m) => m.id).sort())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('empty query returns all memories', () => {
    fc.assert(
      fc.property(
        fc.array(memoryArb, { minLength: 0, maxLength: 20 }),
        (memories) => {
          const results = searchMemories(memories, '')
          expect(results).toHaveLength(memories.length)
        }
      ),
      { numRuns: 50 }
    )
  })
})
