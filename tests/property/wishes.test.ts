/**
 * Property 8: Wishes List Sort Order Preserves Priority Ordering
 *
 * For any list of wishes with mixed priorities, sorting by the default priority
 * order SHALL always produce a list where all High-priority wishes precede all
 * Medium-priority wishes, which precede all Low-priority wishes.
 *
 * Validates: Requirements 6.2
 * Tag: Feature: nextbite, Property 8: wishes list sort order preserves priority ordering
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ─── Sort function under test ─────────────────────────────────────

type Priority = 'low' | 'medium' | 'high'

interface WishRecord {
  id: string
  priority: Priority
  created_at: string
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

function sortWishesByPriority(wishes: WishRecord[]): WishRecord[] {
  return [...wishes].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

// ─── Arbitraries ──────────────────────────────────────────────────

const priorityArb = fc.constantFrom<Priority>('low', 'medium', 'high')

const wishArb = fc.record({
  id: fc.uuid(),
  priority: priorityArb,
  created_at: fc.date({ min: new Date('2023-01-01'), max: new Date() })
    .map((d) => d.toISOString()),
})

// ─── Tests ────────────────────────────────────────────────────────

describe('Property 8: Wishes List Sort Order Preserves Priority Ordering', () => {
  it('all High wishes precede all Medium wishes in sorted output', () => {
    fc.assert(
      fc.property(
        fc.array(wishArb, { minLength: 0, maxLength: 30 }),
        (wishes) => {
          const sorted = sortWishesByPriority(wishes)

          let seenMedium = false
          let seenLow = false

          for (const wish of sorted) {
            if (wish.priority === 'medium') seenMedium = true
            if (wish.priority === 'low') seenLow = true

            if (wish.priority === 'high') {
              expect(seenMedium, 'High priority wish appeared after a Medium priority wish').toBe(false)
              expect(seenLow, 'High priority wish appeared after a Low priority wish').toBe(false)
            }
            if (wish.priority === 'medium') {
              expect(seenLow, 'Medium priority wish appeared after a Low priority wish').toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('all Medium wishes precede all Low wishes in sorted output', () => {
    fc.assert(
      fc.property(
        fc.array(wishArb, { minLength: 0, maxLength: 30 }),
        (wishes) => {
          const sorted = sortWishesByPriority(wishes)
          let seenLow = false

          for (const wish of sorted) {
            if (wish.priority === 'low') seenLow = true
            if (wish.priority === 'medium') {
              expect(seenLow, 'Medium priority wish appeared after a Low priority wish').toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('sort is stable — relative order within same priority is preserved', () => {
    fc.assert(
      fc.property(
        fc.array(wishArb, { minLength: 2, maxLength: 20 }),
        (wishes) => {
          const sorted = sortWishesByPriority(wishes)

          for (const priority of ['high', 'medium', 'low'] as Priority[]) {
            const originalOrder = wishes.filter((w) => w.priority === priority).map((w) => w.id)
            const sortedOrder = sorted.filter((w) => w.priority === priority).map((w) => w.id)
            expect(sortedOrder).toEqual(originalOrder)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('sort output contains exactly the same wishes as input', () => {
    fc.assert(
      fc.property(
        fc.array(wishArb, { minLength: 0, maxLength: 20 }),
        (wishes) => {
          const sorted = sortWishesByPriority(wishes)
          expect(sorted).toHaveLength(wishes.length)
          expect(sorted.map((w) => w.id).sort()).toEqual(wishes.map((w) => w.id).sort())
        }
      ),
      { numRuns: 100 }
    )
  })
})
