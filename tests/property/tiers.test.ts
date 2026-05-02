/**
 * Property 7: Custom Tier Duplicate Detection Is Case-Insensitive
 *
 * For any tier name already in the user's tier list, attempting to add any
 * case variation of that name (uppercase, lowercase, mixed case) SHALL be
 * rejected with a validation error, and the tier list SHALL remain unchanged.
 *
 * Validates: Requirements 5.5
 * Tag: Feature: nextbite, Property 7: custom tier duplicate detection is case-insensitive
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { PRESET_TIERS } from '@/lib/types/domain'

// ─── Validation logic under test ─────────────────────────────────

interface TierRecord {
  id: string
  name: string
  is_preset: boolean
}

function validateNewTierName(
  name: string,
  existingTiers: TierRecord[],
  maxCustom = 20
): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Tier name cannot be empty.'
  if (trimmed.length > 50) return 'Tier name must be 50 characters or less.'

  const lower = trimmed.toLowerCase()
  const allNames = [
    ...(PRESET_TIERS as unknown as string[]),
    ...existingTiers.map((t) => t.name),
  ]

  if (allNames.some((n) => n.toLowerCase() === lower)) {
    return `A tier named "${trimmed}" already exists.`
  }

  const customCount = existingTiers.filter((t) => !t.is_preset).length
  if (customCount >= maxCustom) {
    return `You've reached the limit of ${maxCustom} custom tiers.`
  }

  return null
}

function addTier(
  tiers: TierRecord[],
  name: string
): { tiers: TierRecord[]; error: string | null } {
  const error = validateNewTierName(name, tiers)
  if (error) return { tiers, error }

  const newTier: TierRecord = {
    id: crypto.randomUUID(),
    name: name.trim(),
    is_preset: false,
  }
  return { tiers: [...tiers, newTier], error: null }
}

// ─── Arbitraries ──────────────────────────────────────────────────

const tierNameArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((s) => s.trim().length >= 1 && s.trim().length <= 40)
  .filter((s) => !(PRESET_TIERS as unknown as string[]).some(
    (p) => p.toLowerCase() === s.trim().toLowerCase()
  ))

function randomCase(s: string): string {
  return s
    .split('')
    .map((c) => (Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()))
    .join('')
}

// ─── Tests ────────────────────────────────────────────────────────

describe('Property 7: Custom Tier Duplicate Detection Is Case-Insensitive', () => {
  it('rejects any case variation of an existing custom tier name', () => {
    fc.assert(
      fc.property(tierNameArb, (name) => {
        const initial: TierRecord[] = []
        const { tiers: after } = addTier(initial, name)

        // Try adding uppercase, lowercase, and mixed-case variants
        const variants = [
          name.toUpperCase(),
          name.toLowerCase(),
          name[0].toUpperCase() + name.slice(1).toLowerCase(),
        ]

        for (const variant of variants) {
          const error = validateNewTierName(variant, after)
          expect(error, `Expected duplicate error for variant "${variant}" of "${name}"`).not.toBeNull()
        }
      }),
      { numRuns: 100 }
    )
  })

  it('tier list remains unchanged when a duplicate is rejected', () => {
    fc.assert(
      fc.property(tierNameArb, (name) => {
        const initial: TierRecord[] = []
        const { tiers: after } = addTier(initial, name)
        const countBefore = after.length

        // Attempt to add duplicate
        const { tiers: unchanged } = addTier(after, name.toUpperCase())

        expect(unchanged).toHaveLength(countBefore)
        expect(unchanged.map((t) => t.name)).toEqual(after.map((t) => t.name))
      }),
      { numRuns: 100 }
    )
  })

  it('rejects any case variation of preset tier names', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...(PRESET_TIERS as unknown as string[])),
        (presetName) => {
          const tiers: TierRecord[] = []
          const variants = [
            presetName.toUpperCase(),
            presetName.toLowerCase(),
            presetName,
          ]

          for (const variant of variants) {
            const error = validateNewTierName(variant, tiers)
            expect(error, `Expected duplicate error for preset variant "${variant}"`).not.toBeNull()
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accepts a name that differs from existing tiers by more than case', () => {
    fc.assert(
      fc.property(
        tierNameArb,
        fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length >= 1),
        (name, suffix) => {
          const initial: TierRecord[] = []
          const { tiers: after } = addTier(initial, name)

          // A genuinely different name should be accepted
          const different = name + suffix
          if (different.trim().length <= 50) {
            const error = validateNewTierName(different, after)
            // Only check if it's not a preset collision
            const isPresetCollision = (PRESET_TIERS as unknown as string[]).some(
              (p) => p.toLowerCase() === different.trim().toLowerCase()
            )
            if (!isPresetCollision) {
              expect(error).toBeNull()
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('enforces maximum of 20 custom tiers', () => {
    fc.assert(
      fc.property(
        fc.array(tierNameArb, { minLength: 21, maxLength: 25 }).filter(
          (names) => new Set(names.map((n) => n.toLowerCase())).size === names.length
        ),
        (names) => {
          let tiers: TierRecord[] = []

          // Add first 20 — all should succeed
          for (let i = 0; i < 20; i++) {
            const result = addTier(tiers, names[i])
            expect(result.error).toBeNull()
            tiers = result.tiers
          }

          // 21st should fail
          const result = addTier(tiers, names[20])
          expect(result.error).not.toBeNull()
          expect(tiers).toHaveLength(20)
        }
      ),
      { numRuns: 20 }
    )
  })
})
