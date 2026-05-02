/**
 * Restaurant upsert logic.
 * Checks place_id uniqueness before insert (Req 20.2–20.4).
 * Returns the existing or newly created restaurant record.
 */

import { createClient } from '@/lib/supabase/client'
import type { RestaurantSearchResult } from '@/lib/types/domain'

export async function upsertRestaurant(
  result: RestaurantSearchResult
): Promise<{ id: string; name: string } | null> {
  const supabase = createClient()

  // For Yelp results (no real place_id), create a user-scoped record
  const isYelp = result.place_id.startsWith('yelp_')

  if (!isYelp) {
    // Check if restaurant already exists by place_id (Req 20.2)
    const { data: existing } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('place_id', result.place_id)
      .single()

    if (existing) return existing
  }

  // Insert new restaurant record
  const { data, error } = await supabase
    .from('restaurants')
    .insert({
      place_id: isYelp ? null : result.place_id,
      name: result.name,
      address: result.address,
      city: result.city,
      lat: result.lat,
      lng: result.lng,
      price_level: result.price_level,
      google_rating: result.source === 'google' ? result.rating : null,
      yelp_rating: result.source === 'yelp' ? result.rating : null,
      cuisine_tags: result.cuisine_tags,
      photos: result.photos,
      last_synced_at: new Date().toISOString(),
    })
    .select('id, name')
    .single()

  if (error) {
    // Handle race condition: another user inserted same place_id concurrently
    if (error.code === '23505' && !isYelp) {
      const { data: existing } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('place_id', result.place_id)
        .single()
      return existing ?? null
    }
    console.error('Failed to upsert restaurant:', JSON.stringify(error), 'payload:', JSON.stringify({
      place_id: isYelp ? null : result.place_id,
      name: result.name,
    }))
    return null
  }

  return data
}
