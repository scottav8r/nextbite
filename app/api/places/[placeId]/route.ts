import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { placeId } = await params

  // Check Supabase cache first (7-day TTL per Req 21.2)
  const { data: cachedRaw } = await supabase
    .from('restaurants')
    .select('*')
    .eq('place_id', placeId)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = cachedRaw as any

  if (cached) {
    const lastSynced = new Date(cached.last_synced_at).getTime()
    const isStale = Date.now() - lastSynced > SEVEN_DAYS_MS

    if (!isStale) {
      return NextResponse.json({ restaurant: cached, source: 'cache' })
    }
    // Stale — fall through to refresh
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    if (cached) return NextResponse.json({ restaurant: cached, source: 'stale_cache' })
    return NextResponse.json({ error: 'Places API unavailable' }, { status: 503 })
  }

  try {
    const fields = [
      'place_id', 'name', 'formatted_address', 'geometry',
      'international_phone_number', 'website', 'price_level',
      'rating', 'types', 'photos', 'opening_hours', 'address_components',
    ].join(',')

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`,
      { next: { revalidate: 0 } }
    )

    if (!res.ok) throw new Error(`Places API error: ${res.status}`)

    const data = await res.json()
    const place = data.result

    if (!place) throw new Error('No result from Places API')

    const restaurantData = {
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address ?? '',
      city: extractCity(place.address_components),
      lat: place.geometry?.location?.lat ?? null,
      lng: place.geometry?.location?.lng ?? null,
      phone: place.international_phone_number ?? null,
      website_url: place.website ?? null,
      price_level: place.price_level ?? null,
      google_rating: place.rating ?? null,
      cuisine_tags: extractCuisineTags(place.types ?? []),
      photos: place.photos?.slice(0, 5).map((p: { photo_reference: string }) => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`,
        source: 'google',
      })) ?? [],
      opening_hours: place.opening_hours?.weekday_text
        ? { weekday_text: place.opening_hours.weekday_text }
        : null,
      last_synced_at: new Date().toISOString(),
    }

    // Upsert into Supabase (deduplication by place_id per Req 20.2-20.4)
    const { data: upserted, error } = await supabase
      .from('restaurants')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(restaurantData as any, { onConflict: 'place_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ restaurant: upserted, source: 'google' })
  } catch {
    // Fall back to Yelp or cached data
    if (cached) return NextResponse.json({ restaurant: cached, source: 'stale_cache' })
    return NextResponse.json({ error: 'Restaurant details unavailable' }, { status: 503 })
  }
}

function extractCity(components?: { long_name: string; types: string[] }[]): string {
  if (!components) return ''
  const locality = components.find((c) => c.types.includes('locality'))
  const admin = components.find((c) => c.types.includes('administrative_area_level_1'))
  return locality?.long_name ?? admin?.long_name ?? ''
}

function extractCuisineTags(types: string[]): string[] {
  const cuisineMap: Record<string, string> = {
    bakery: 'Bakery', bar: 'Bar', cafe: 'Café',
    italian_restaurant: 'Italian', japanese_restaurant: 'Japanese',
    mexican_restaurant: 'Mexican', chinese_restaurant: 'Chinese',
    indian_restaurant: 'Indian', thai_restaurant: 'Thai',
    french_restaurant: 'French', american_restaurant: 'American',
    mediterranean_restaurant: 'Mediterranean', korean_restaurant: 'Korean',
    vietnamese_restaurant: 'Vietnamese', greek_restaurant: 'Greek',
    spanish_restaurant: 'Spanish', middle_eastern_restaurant: 'Middle Eastern',
  }
  return types.map((t) => cuisineMap[t]).filter((v): v is string => !!v)
}
