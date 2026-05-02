/**
 * Property 4: Restaurant Import Mapper Preserves All Required Fields
 * Property 15: Restaurant Deduplication by place_id Is Idempotent
 *
 * Validates: Requirements 3.4, 20.2, 20.3, 20.4
 * Tags:
 *   Feature: nextbite, Property 4: restaurant import mapper preserves required fields
 *   Feature: nextbite, Property 15: restaurant deduplication by place_id is idempotent
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ─── Mapper under test ────────────────────────────────────────────

interface GooglePlaceResult {
  place_id: string
  name: string
  formatted_address?: string
  geometry?: { location?: { lat: number; lng: number } }
  price_level?: number
  rating?: number
  types?: string[]
  photos?: { photo_reference: string }[]
  address_components?: { long_name: string; types: string[] }[]
}

function mapGooglePlaceToRestaurant(place: GooglePlaceResult) {
  return {
    place_id: place.place_id,
    name: place.name,
    address: place.formatted_address ?? '',
    city: extractCity(place.address_components),
    lat: place.geometry?.location?.lat ?? null,
    lng: place.geometry?.location?.lng ?? null,
    price_level: place.price_level ?? null,
    google_rating: place.rating ?? null,
    cuisine_tags: extractCuisineTags(place.types ?? []),
    photos: place.photos?.slice(0, 5).map((p) => ({
      url: `https://example.com/photo?ref=${p.photo_reference}`,
      source: 'google' as const,
    })) ?? [],
    last_synced_at: new Date().toISOString(),
  }
}

function extractCity(components?: { long_name: string; types: string[] }[]): string {
  if (!components) return ''
  const locality = components.find((c) => c.types.includes('locality'))
  return locality?.long_name ?? ''
}

function extractCuisineTags(types: string[]): string[] {
  const map: Record<string, string> = {
    italian_restaurant: 'Italian',
    japanese_restaurant: 'Japanese',
    mexican_restaurant: 'Mexican',
  }
  return types.map((t) => map[t]).filter((v): v is string => !!v)
}

// ─── Deduplication logic under test ──────────────────────────────

interface RestaurantRecord {
  place_id: string
  name: string
}

function upsertRestaurantIdempotent(
  db: Map<string, RestaurantRecord>,
  record: RestaurantRecord
): RestaurantRecord {
  const existing = db.get(record.place_id)
  if (existing) return existing
  db.set(record.place_id, record)
  return record
}

// ─── Arbitraries ──────────────────────────────────────────────────

const placeResultArb = fc.record({
  place_id: fc.string({ minLength: 10, maxLength: 30 }).filter((s) => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 80 }).filter((s) => s.trim().length > 0),
  formatted_address: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
  geometry: fc.option(
    fc.record({
      location: fc.record({
        lat: fc.float({ min: -90, max: 90 }),
        lng: fc.float({ min: -180, max: 180 }),
      }),
    }),
    { nil: undefined }
  ),
  price_level: fc.option(fc.integer({ min: 1, max: 4 }), { nil: undefined }),
  rating: fc.option(fc.float({ min: 1, max: 5 }), { nil: undefined }),
  types: fc.option(
    fc.array(fc.constantFrom('restaurant', 'italian_restaurant', 'japanese_restaurant', 'food'), {
      minLength: 0,
      maxLength: 5,
    }),
    { nil: undefined }
  ),
})

// ─── Tests ────────────────────────────────────────────────────────

describe('Property 4: Restaurant Import Mapper Preserves All Required Fields', () => {
  it('always produces non-null name, place_id, and last_synced_at', () => {
    fc.assert(
      fc.property(placeResultArb, (place) => {
        const result = mapGooglePlaceToRestaurant(place)

        expect(result.name).toBeTruthy()
        expect(result.place_id).toBeTruthy()
        expect(result.last_synced_at).toBeTruthy()
        expect(result.cuisine_tags).toBeInstanceOf(Array)
        expect(result.photos).toBeInstanceOf(Array)
        // address defaults to empty string, never null
        expect(typeof result.address).toBe('string')
      }),
      { numRuns: 100 }
    )
  })

  it('price_level is null or 1-4', () => {
    fc.assert(
      fc.property(placeResultArb, (place) => {
        const result = mapGooglePlaceToRestaurant(place)
        if (result.price_level !== null) {
          expect(result.price_level).toBeGreaterThanOrEqual(1)
          expect(result.price_level).toBeLessThanOrEqual(4)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('google_rating is null or between 1 and 5', () => {
    fc.assert(
      fc.property(placeResultArb, (place) => {
        const result = mapGooglePlaceToRestaurant(place)
        if (result.google_rating !== null) {
          expect(result.google_rating).toBeGreaterThanOrEqual(1)
          expect(result.google_rating).toBeLessThanOrEqual(5)
        }
      }),
      { numRuns: 100 }
    )
  })
})

describe('Property 15: Restaurant Deduplication by place_id Is Idempotent', () => {
  it('inserting the same place_id N times results in exactly one record', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 30 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.integer({ min: 1, max: 20 }),
        (placeId, name, n) => {
          const db = new Map<string, RestaurantRecord>()
          const record = { place_id: placeId, name }

          for (let i = 0; i < n; i++) {
            upsertRestaurantIdempotent(db, record)
          }

          expect(db.size).toBe(1)
          expect(db.get(placeId)?.place_id).toBe(placeId)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('always returns the first-inserted record on subsequent upserts', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 30 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (placeId, firstName, secondName) => {
          const db = new Map<string, RestaurantRecord>()
          const first = upsertRestaurantIdempotent(db, { place_id: placeId, name: firstName })
          const second = upsertRestaurantIdempotent(db, { place_id: placeId, name: secondName })

          // Second upsert returns the original record
          expect(second.name).toBe(first.name)
          expect(db.size).toBe(1)
        }
      ),
      { numRuns: 100 }
    )
  })
})
