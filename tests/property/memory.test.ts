/**
 * Property 5: Visit Count Increments Monotonically
 * Property 6: Offline Queue Preserves Memory Data
 *
 * Validates: Requirements 4.12, 4.14, 16.7
 * Tags:
 *   Feature: nextbite, Property 5: visit count increments monotonically
 *   Feature: nextbite, Property 6: offline queue preserves memory data
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ─── Visit count logic under test ────────────────────────────────

interface MemoryRecord {
  id: string
  user_id: string
  restaurant_id: string
  visit_number: number
  overall_rating: number
  visit_date: string
}

function computeVisitNumber(
  existingMemories: MemoryRecord[],
  userId: string,
  restaurantId: string
): number {
  const count = existingMemories.filter(
    (m) => m.user_id === userId && m.restaurant_id === restaurantId
  ).length
  return count + 1
}

function logMemory(
  db: MemoryRecord[],
  userId: string,
  restaurantId: string,
  rating: number
): MemoryRecord {
  const visitNumber = computeVisitNumber(db, userId, restaurantId)
  const memory: MemoryRecord = {
    id: crypto.randomUUID(),
    user_id: userId,
    restaurant_id: restaurantId,
    visit_number: visitNumber,
    overall_rating: rating,
    visit_date: new Date().toISOString().split('T')[0],
  }
  db.push(memory)
  return memory
}

// ─── Offline queue logic under test ──────────────────────────────

interface QueueItem {
  id: string
  type: 'create_memory'
  payload: unknown
  created_at: number
  retry_count: number
}

function enqueue(
  queue: QueueItem[],
  payload: unknown
): QueueItem {
  const item: QueueItem = {
    id: crypto.randomUUID(),
    type: 'create_memory',
    payload,
    created_at: Date.now(),
    retry_count: 0,
  }
  queue.push(item)
  return item
}

// ─── Arbitraries ──────────────────────────────────────────────────

const uuidArb = fc.uuid()

const memoryPayloadArb = fc.record({
  restaurant_id: uuidArb,
  visit_date: fc.date({ min: new Date('2020-01-01'), max: new Date() })
    .map((d) => d.toISOString().split('T')[0]),
  overall_rating: fc.integer({ min: 1, max: 10 }),
  tiers: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }),
  cuisine_tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
  narrative_note: fc.option(fc.string({ maxLength: 2000 }), { nil: null }),
})

// ─── Tests ────────────────────────────────────────────────────────

describe('Property 5: Visit Count Increments Monotonically', () => {
  it('after logging N memories for a restaurant, the last visit_number equals N', () => {
    fc.assert(
      fc.property(
        uuidArb,
        uuidArb,
        fc.integer({ min: 1, max: 20 }),
        (userId, restaurantId, n) => {
          const db: MemoryRecord[] = []

          for (let i = 0; i < n; i++) {
            logMemory(db, userId, restaurantId, 8)
          }

          const memoriesForRestaurant = db.filter(
            (m) => m.user_id === userId && m.restaurant_id === restaurantId
          )

          expect(memoriesForRestaurant).toHaveLength(n)
          expect(memoriesForRestaurant[n - 1].visit_number).toBe(n)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('visit numbers are strictly increasing for the same user+restaurant', () => {
    fc.assert(
      fc.property(
        uuidArb,
        uuidArb,
        fc.integer({ min: 2, max: 15 }),
        (userId, restaurantId, n) => {
          const db: MemoryRecord[] = []
          for (let i = 0; i < n; i++) {
            logMemory(db, userId, restaurantId, 7)
          }

          const memories = db
            .filter((m) => m.user_id === userId && m.restaurant_id === restaurantId)
            .sort((a, b) => a.visit_number - b.visit_number)

          for (let i = 1; i < memories.length; i++) {
            expect(memories[i].visit_number).toBe(memories[i - 1].visit_number + 1)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('memories for different restaurants have independent visit counts', () => {
    fc.assert(
      fc.property(
        uuidArb,
        uuidArb,
        uuidArb,
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (userId, restaurantA, restaurantB, nA, nB) => {
          fc.pre(restaurantA !== restaurantB)
          const db: MemoryRecord[] = []

          for (let i = 0; i < nA; i++) logMemory(db, userId, restaurantA, 8)
          for (let i = 0; i < nB; i++) logMemory(db, userId, restaurantB, 7)

          const lastA = db.filter((m) => m.restaurant_id === restaurantA).at(-1)
          const lastB = db.filter((m) => m.restaurant_id === restaurantB).at(-1)

          expect(lastA?.visit_number).toBe(nA)
          expect(lastB?.visit_number).toBe(nB)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 6: Offline Queue Preserves Memory Data', () => {
  it('queued payload is deeply equal to the original memory object', () => {
    fc.assert(
      fc.property(memoryPayloadArb, (payload) => {
        const queue: QueueItem[] = []
        const item = enqueue(queue, payload)

        expect(queue).toHaveLength(1)
        expect(item.payload).toEqual(payload)
        expect(item.type).toBe('create_memory')
        expect(item.retry_count).toBe(0)
        expect(typeof item.id).toBe('string')
        expect(item.id.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })

  it('no fields are missing or mutated after enqueue', () => {
    fc.assert(
      fc.property(memoryPayloadArb, (payload) => {
        const queue: QueueItem[] = []
        enqueue(queue, payload)

        const stored = queue[0].payload as typeof payload

        // All original keys must be present and equal
        for (const [key, value] of Object.entries(payload)) {
          expect(stored).toHaveProperty(key)
          expect((stored as Record<string, unknown>)[key]).toEqual(value)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('multiple enqueues preserve all items independently', () => {
    fc.assert(
      fc.property(
        fc.array(memoryPayloadArb, { minLength: 1, maxLength: 10 }),
        (payloads) => {
          const queue: QueueItem[] = []
          payloads.forEach((p) => enqueue(queue, p))

          expect(queue).toHaveLength(payloads.length)

          // Each item's payload matches the original
          payloads.forEach((payload, i) => {
            expect(queue[i].payload).toEqual(payload)
          })

          // All IDs are unique
          const ids = queue.map((item) => item.id)
          expect(new Set(ids).size).toBe(ids.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})
