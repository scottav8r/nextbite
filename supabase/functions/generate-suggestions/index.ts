/**
 * NextBite — generate-suggestions Edge Function
 *
 * Two-stage pipeline:
 *   Stage 1: Candidate generation (Postgres query)
 *   Stage 2: Scoring + ranking (Deno)
 *
 * Target: ≤ 2.5s p95 end-to-end
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Import scoring utilities (shared with client)
// In production these would be bundled; here we inline the logic for Deno compatibility

type PersonalizationLevel = 'discovery' | 'early' | 'mature'

interface FilterState {
  tiers: string[]
  cuisines: string[]
  price_levels: number[]
  occasions: string[]
  radius_miles: number
  city: string | null
  include_recent: boolean
}

interface TasteProfile {
  top_cuisines: string[]
  top_tiers: string[]
  top_occasions: string[]
  avg_price_level: number
  avg_overall_rating: number
  memory_count: number
}

interface ScoringWeights {
  tasteMatch: number
  filterMatch: number
  wishBonus: number
  ratingBonus: number
  distanceScore: number
}

function getPersonalizationLevel(count: number): PersonalizationLevel {
  if (count < 3) return 'discovery'
  if (count <= 9) return 'early'
  return 'mature'
}

function getWeights(level: PersonalizationLevel): ScoringWeights {
  switch (level) {
    case 'discovery': return { tasteMatch: 0.20, filterMatch: 0.40, wishBonus: 0.15, ratingBonus: 0.10, distanceScore: 0.05 }
    case 'early':     return { tasteMatch: 0.25, filterMatch: 0.35, wishBonus: 0.15, ratingBonus: 0.10, distanceScore: 0.05 }
    case 'mature':    return { tasteMatch: 0.35, filterMatch: 0.25, wishBonus: 0.15, ratingBonus: 0.10, distanceScore: 0.05 }
  }
}

function tagOverlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const bSet = new Set(b.map((t) => t.toLowerCase()))
  return Math.min(1, a.filter((t) => bSet.has(t.toLowerCase())).length / b.length)
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function scoreRestaurant(
  restaurant: Record<string, unknown>,
  profile: TasteProfile,
  filters: FilterState,
  wishes: { restaurant_id: string; priority: string }[],
  memories: { restaurant_id: string; overall_rating: number; visit_date: string }[],
  userLat: number | null,
  userLng: number | null,
  level: PersonalizationLevel
) {
  const weights = getWeights(level)
  const cuisineTags = (restaurant.cuisine_tags as string[]) ?? []
  const priceLevel = restaurant.price_level as number | null

  // TasteMatch
  const cuisineScore = tagOverlap(cuisineTags, profile.top_cuisines)
  const priceScore = priceLevel && profile.avg_price_level
    ? Math.max(0, 1 - Math.abs(priceLevel - profile.avg_price_level) / 3)
    : 0.5
  const tasteMatch = level === 'discovery'
    ? cuisineScore * 100
    : Math.min(100, (cuisineScore * 0.65 + priceScore * 0.35) * 100)

  // FilterMatch
  let filterCriteria = 0, filterMatched = 0
  if (filters.cuisines.length) {
    filterCriteria++
    const cSet = new Set(filters.cuisines.map((c) => c.toLowerCase()))
    if (cuisineTags.some((t) => cSet.has(t.toLowerCase()))) filterMatched++
  }
  if (filters.price_levels.length) {
    filterCriteria++
    if (priceLevel && filters.price_levels.includes(priceLevel)) filterMatched++
  }
  const filterMatch = filterCriteria === 0 ? 100 : (filterMatched / filterCriteria) * 100

  // WishBonus
  const wish = wishes.find((w) => w.restaurant_id === restaurant.id)
  const wishBonus = wish ? (wish.priority === 'high' ? 100 : wish.priority === 'medium' ? 70 : 40) : 0

  // RatingBonus
  const restaurantMemories = memories.filter((m) => m.restaurant_id === restaurant.id)
  const ratingBonus = restaurantMemories.length
    ? (restaurantMemories.reduce((s, m) => s + m.overall_rating, 0) / restaurantMemories.length / 10) * 100
    : 0

  // DistanceScore
  const lat = restaurant.lat as number | null
  const lng = restaurant.lng as number | null
  const distanceScore = userLat && userLng && lat && lng
    ? Math.max(0, (1 - haversine(userLat, userLng, lat, lng) / Math.max(filters.radius_miles, 1)) * 100)
    : 50

  // RecencyPenalty
  let recencyPenalty = 0
  if (!filters.include_recent && restaurantMemories.length) {
    const mostRecent = Math.max(...restaurantMemories.map((m) => new Date(m.visit_date).getTime()))
    const daysSince = (Date.now() - mostRecent) / 86400000
    if (daysSince <= 14) recencyPenalty = 20
    else if (daysSince <= 30) recencyPenalty = 10
  }

  const raw =
    weights.tasteMatch * tasteMatch +
    weights.filterMatch * filterMatch +
    weights.wishBonus * wishBonus +
    weights.ratingBonus * ratingBonus +
    weights.distanceScore * distanceScore -
    recencyPenalty

  return {
    match_score: Math.max(0, Math.min(100, raw)),
    score_breakdown: { taste_match: tasteMatch, filter_match: filterMatch, wish_bonus: wishBonus, rating_bonus: ratingBonus, distance_score: distanceScore, recency_penalty: recencyPenalty },
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { user_id, filters, location, context } = body as {
      user_id: string
      filters: FilterState
      location: { lat: number; lng: number } | { city: string }
      context: { time_of_day: string; day_of_week: string }
    }

    // ── Stage 1: Candidate generation ──────────────────────────────

    // Fetch user taste profile
    const { data: userData } = await supabase
      .from('users')
      .select('taste_profile')
      .eq('id', user_id)
      .single()

    const profile = (userData?.taste_profile ?? {
      top_cuisines: [], top_tiers: [], top_occasions: [],
      avg_price_level: 0, avg_overall_rating: 0, memory_count: 0,
    }) as TasteProfile

    const level = getPersonalizationLevel(profile.memory_count)

    // Fetch user's wishes
    const { data: wishes = [] } = await supabase
      .from('wishes')
      .select('restaurant_id, priority')
      .eq('user_id', user_id)

    // Fetch recent memories (last 60 days for recency penalty)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]
    const { data: memories = [] } = await supabase
      .from('memories')
      .select('restaurant_id, overall_rating, visit_date')
      .eq('user_id', user_id)
      .gte('visit_date', sixtyDaysAgo)

    // Build candidate query
    let candidateQuery = supabase
      .from('restaurants')
      .select('id, place_id, name, address, city, lat, lng, price_level, google_rating, cuisine_tags, vibe_tags, photos, reservation_url')
      .limit(200)

    // Location filter
    const userLat = 'lat' in location ? location.lat : null
    const userLng = 'lng' in location ? location.lng : null
    const city = 'city' in location ? location.city : null

    if (city) {
      candidateQuery = candidateQuery.ilike('city', `%${city}%`)
    }

    // Cuisine filter
    if (filters.cuisines.length) {
      candidateQuery = candidateQuery.overlaps('cuisine_tags', filters.cuisines)
    }

    // Price filter
    if (filters.price_levels.length) {
      candidateQuery = candidateQuery.in('price_level', filters.price_levels)
    }

    const { data: candidates = [] } = await candidateQuery

    // Also include wish restaurants regardless of location
    const wishRestaurantIds = (wishes as { restaurant_id: string }[]).map((w) => w.restaurant_id)
    if (wishRestaurantIds.length) {
      const { data: wishRestaurants = [] } = await supabase
        .from('restaurants')
        .select('id, place_id, name, address, city, lat, lng, price_level, google_rating, cuisine_tags, vibe_tags, photos, reservation_url')
        .in('id', wishRestaurantIds)

      // Merge and deduplicate by id
      const seen = new Set(candidates.map((c: Record<string, unknown>) => c.id))
      for (const r of wishRestaurants) {
        if (!seen.has((r as Record<string, unknown>).id)) {
          candidates.push(r)
          seen.add((r as Record<string, unknown>).id)
        }
      }
    }

    // ── Stage 2: Scoring ───────────────────────────────────────────

    const scored = candidates.map((restaurant: Record<string, unknown>) => {
      const { match_score, score_breakdown } = scoreRestaurant(
        restaurant, profile, filters,
        wishes as { restaurant_id: string; priority: string }[],
        memories as { restaurant_id: string; overall_rating: number; visit_date: string }[],
        userLat, userLng, level
      )

      const wish = (wishes as { restaurant_id: string; priority: string }[]).find((w) => w.restaurant_id === restaurant.id)
      const restaurantMemories = (memories as { restaurant_id: string; visit_date: string }[]).filter((m) => m.restaurant_id === restaurant.id)
      const daysSinceLastVisit = restaurantMemories.length
        ? Math.floor((Date.now() - Math.max(...restaurantMemories.map((m) => new Date(m.visit_date).getTime()))) / 86400000)
        : null

      return {
        restaurant,
        match_score,
        score_breakdown,
        explanation: '',
        is_wish: !!wish,
        wish_priority: wish?.priority ?? null,
        is_sponsored: false,
        days_since_last_visit: daysSinceLastVisit,
      }
    })

    // Sort by score descending
    scored.sort((a, b) => b.match_score - a.match_score)

    // Diversity guardrails: max 2 per cuisine in top 5
    const diversified: typeof scored = []
    const cuisineCounts = new Map<string, number>()
    for (const s of scored) {
      const cuisine = (s.restaurant.cuisine_tags as string[])[0]?.toLowerCase() ?? ''
      const count = cuisineCounts.get(cuisine) ?? 0
      if (diversified.length < 5 && cuisine && count >= 2) continue
      diversified.push(s)
      if (cuisine) cuisineCounts.set(cuisine, count + 1)
    }
    // Append remaining after top 5
    for (const s of scored) {
      if (!diversified.includes(s)) diversified.push(s)
    }

    const latencyMs = Date.now() - startTime

    // Log to suggestion_logs (no PII — hashed user_id)
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(user_id))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const userIdHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    await supabase.from('suggestion_logs').insert({
      user_id_hash: userIdHash,
      filters,
      result_count: diversified.length,
      latency_ms: latencyMs,
      top_score: diversified[0]?.match_score ?? null,
    })

    return new Response(
      JSON.stringify({
        suggestions: diversified.slice(0, 20),
        latency_ms: latencyMs,
        personalization_level: level,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
