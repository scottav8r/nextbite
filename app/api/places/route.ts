import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple in-memory rate limiter: 100 req/min per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 100
const WINDOW_MS = 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

function normalizePlacesResult(place: GooglePlaceResult) {
  return {
    place_id: place.place_id,
    name: place.name,
    address: place.formatted_address ?? place.vicinity ?? '',
    city: extractCity(place.address_components),
    lat: place.geometry?.location?.lat ?? 0,
    lng: place.geometry?.location?.lng ?? 0,
    price_level: place.price_level ?? null,
    rating: place.rating ?? null,
    cuisine_tags: extractCuisineTags(place.types ?? []),
    photos: place.photos?.slice(0, 3).map((p: GooglePhoto) => ({
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`,
      source: 'google' as const,
    })) ?? [],
    source: 'google' as const,
  }
}

function extractCity(components?: AddressComponent[]): string {
  if (!components) return ''
  const locality = components.find((c) => c.types.includes('locality'))
  const admin = components.find((c) => c.types.includes('administrative_area_level_1'))
  return locality?.long_name ?? admin?.long_name ?? ''
}

function extractCuisineTags(types: string[]): string[] {
  const cuisineMap: Record<string, string> = {
    restaurant: '',
    food: '',
    meal_takeaway: '',
    meal_delivery: '',
    bakery: 'Bakery',
    bar: 'Bar',
    cafe: 'Café',
    night_club: 'Nightclub',
    italian_restaurant: 'Italian',
    japanese_restaurant: 'Japanese',
    mexican_restaurant: 'Mexican',
    chinese_restaurant: 'Chinese',
    indian_restaurant: 'Indian',
    thai_restaurant: 'Thai',
    french_restaurant: 'French',
    american_restaurant: 'American',
    mediterranean_restaurant: 'Mediterranean',
    korean_restaurant: 'Korean',
    vietnamese_restaurant: 'Vietnamese',
    greek_restaurant: 'Greek',
    spanish_restaurant: 'Spanish',
    middle_eastern_restaurant: 'Middle Eastern',
  }
  return types
    .map((t) => cuisineMap[t])
    .filter((v): v is string => !!v)
}

// ─── GET /api/places?query=&location= ────────────────────────────

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const location = searchParams.get('location') // "lat,lng" or city name

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    // Fall back to Yelp
    return fallbackToYelp(query, location)
  }

  try {
    const params = new URLSearchParams({
      query: `${query} restaurant`,
      key: apiKey,
      type: 'restaurant',
      ...(location ? { location, radius: '10000' } : {}),
    })

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
      { next: { revalidate: 0 } }
    )

    if (!res.ok) throw new Error(`Places API error: ${res.status}`)

    const data = await res.json()

    if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'REQUEST_DENIED') {
      return fallbackToYelp(query, location)
    }

    const results = (data.results ?? []).slice(0, 10).map(normalizePlacesResult)
    return NextResponse.json({ results, source: 'google' })
  } catch {
    return fallbackToYelp(query, location)
  }
}

async function fallbackToYelp(query: string, location: string | null) {
  const apiKey = process.env.YELP_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Search unavailable. Please enter restaurant details manually.', results: [] },
      { status: 503 }
    )
  }

  try {
    const params = new URLSearchParams({
      term: query,
      location: location ?? 'New York',
      categories: 'restaurants',
      limit: '10',
    })

    const res = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 0 },
    })

    if (!res.ok) throw new Error(`Yelp API error: ${res.status}`)

    const data = await res.json()
    const results = (data.businesses ?? []).map((b: YelpBusiness) => ({
      place_id: `yelp_${b.id}`,
      name: b.name,
      address: b.location?.display_address?.join(', ') ?? '',
      city: b.location?.city ?? '',
      lat: b.coordinates?.latitude ?? 0,
      lng: b.coordinates?.longitude ?? 0,
      price_level: b.price ? b.price.length : null,
      rating: b.rating ?? null,
      cuisine_tags: b.categories?.map((c: { title: string }) => c.title) ?? [],
      photos: b.image_url ? [{ url: b.image_url, source: 'yelp' as const }] : [],
      source: 'yelp' as const,
    }))

    return NextResponse.json({ results, source: 'yelp' })
  } catch {
    return NextResponse.json(
      { error: 'Search unavailable. Please enter restaurant details manually.', results: [] },
      { status: 503 }
    )
  }
}

// ─── Type helpers ─────────────────────────────────────────────────

interface GooglePlaceResult {
  place_id: string
  name: string
  formatted_address?: string
  vicinity?: string
  geometry?: { location?: { lat: number; lng: number } }
  price_level?: number
  rating?: number
  types?: string[]
  photos?: GooglePhoto[]
  address_components?: AddressComponent[]
}

interface GooglePhoto {
  photo_reference: string
}

interface AddressComponent {
  long_name: string
  types: string[]
}

interface YelpBusiness {
  id: string
  name: string
  location?: { display_address?: string[]; city?: string }
  coordinates?: { latitude: number; longitude: number }
  price?: string
  rating?: number
  categories?: { title: string }[]
  image_url?: string
}
