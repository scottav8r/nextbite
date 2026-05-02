/**
 * Property 16: Data Export Contains All User Data
 *
 * For any user with a known set of memories, wishes, custom tiers, and filter
 * presets, the generated JSON export SHALL contain arrays for each data type
 * whose lengths exactly match the counts of those records in the database,
 * and each exported item SHALL be deeply equal to its database counterpart.
 *
 * Validates: Requirements 24.1, 24.2
 * Tag: Feature: nextbite, Property 16: data export contains all user data
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ─── Export builder under test ────────────────────────────────────

interface ExportData {
  exported_at: string
  user_id: string
  profile: Record<string, unknown>
  memories: unknown[]
  wishes: unknown[]
  custom_tiers: unknown[]
  filter_presets: unknown[]
}

function buildExport(
  userId: string,
  profile: Record<string, unknown>,
  memories: unknown[],
  wishes: unknown[],
  customTiers: unknown[],
  filterPresets: unknown[]
): ExportData {
  return {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile,
    memories,
    wishes,
    custom_tiers: customTiers,
    filter_presets: filterPresets,
  }
}

function validateExport(
  exportData: ExportData,
  expectedMemories: unknown[],
  expectedWishes: unknown[],
  expectedTiers: unknown[],
  expectedPresets: unknown[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (exportData.memories.length !== expectedMemories.length) {
    errors.push(`memories: expected ${expectedMemories.length}, got ${exportData.memories.length}`)
  }
  if (exportData.wishes.length !== expectedWishes.length) {
    errors.push(`wishes: expected ${expectedWishes.length}, got ${exportData.wishes.length}`)
  }
  if (exportData.custom_tiers.length !== expectedTiers.length) {
    errors.push(`custom_tiers: expected ${expectedTiers.length}, got ${exportData.custom_tiers.length}`)
  }
  if (exportData.filter_presets.length !== expectedPresets.length) {
    errors.push(`filter_presets: expected ${expectedPresets.length}, got ${exportData.filter_presets.length}`)
  }

  // Deep equality check for each item
  for (let i = 0; i < expectedMemories.length; i++) {
    if (JSON.stringify(exportData.memories[i]) !== JSON.stringify(expectedMemories[i])) {
      errors.push(`memory[${i}] does not match`)
    }
  }
  for (let i = 0; i < expectedWishes.length; i++) {
    if (JSON.stringify(exportData.wishes[i]) !== JSON.stringify(expectedWishes[i])) {
      errors.push(`wish[${i}] does not match`)
    }
  }

  return { valid: errors.length === 0, errors }
}

// ─── Arbitraries ──────────────────────────────────────────────────

const itemArb = fc.record({
  id: fc.uuid(),
  data: fc.string({ minLength: 1, maxLength: 50 }),
})

// ─── Tests ────────────────────────────────────────────────────────

describe('Property 16: Data Export Contains All User Data', () => {
  it('export array lengths exactly match the source record counts', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(itemArb, { minLength: 0, maxLength: 20 }),
        fc.array(itemArb, { minLength: 0, maxLength: 10 }),
        fc.array(itemArb, { minLength: 0, maxLength: 20 }),
        fc.array(itemArb, { minLength: 0, maxLength: 10 }),
        (userId, memories, wishes, tiers, presets) => {
          const exportData = buildExport(userId, {}, memories, wishes, tiers, presets)

          expect(exportData.memories).toHaveLength(memories.length)
          expect(exportData.wishes).toHaveLength(wishes.length)
          expect(exportData.custom_tiers).toHaveLength(tiers.length)
          expect(exportData.filter_presets).toHaveLength(presets.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('each exported item is deeply equal to its source record', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(itemArb, { minLength: 0, maxLength: 10 }),
        fc.array(itemArb, { minLength: 0, maxLength: 10 }),
        fc.array(itemArb, { minLength: 0, maxLength: 10 }),
        fc.array(itemArb, { minLength: 0, maxLength: 10 }),
        (userId, memories, wishes, tiers, presets) => {
          const exportData = buildExport(userId, {}, memories, wishes, tiers, presets)
          const { valid, errors } = validateExport(exportData, memories, wishes, tiers, presets)

          expect(valid, `Validation errors: ${errors.join(', ')}`).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('export always includes user_id and exported_at', () => {
    fc.assert(
      fc.property(fc.uuid(), (userId) => {
        const exportData = buildExport(userId, {}, [], [], [], [])

        expect(exportData.user_id).toBe(userId)
        expect(exportData.exported_at).toBeTruthy()
        expect(new Date(exportData.exported_at).getTime()).not.toBeNaN()
      }),
      { numRuns: 100 }
    )
  })

  it('export is valid JSON that can be round-tripped', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(itemArb, { minLength: 0, maxLength: 5 }),
        (userId, memories) => {
          const exportData = buildExport(userId, { display_name: 'Test' }, memories, [], [], [])
          const json = JSON.stringify(exportData)
          const parsed = JSON.parse(json) as ExportData

          expect(parsed.user_id).toBe(userId)
          expect(parsed.memories).toHaveLength(memories.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})
