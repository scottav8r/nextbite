import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const term = searchParams.get('term')
  const location = searchParams.get('location') ?? 'New York'

  if (!term) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.YELP_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Yelp API unavailable', results: [] },
      { status: 503 }
    )
  }

  try {
    const params = new URLSearchParams({
      term,
      location,
      categories: 'restaurants',
      limit: '10',
    })

    const res = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 0 },
    })

    if (!res.ok) throw new Error(`Yelp error: ${res.status}`)

    const data = await res.json()
    const results = (data.businesses ?? []).map((b: {
      id: string
      name: string
      location?: { display_address?: string[]; city?: string }
      coordinates?: { latitude: number; longitude: number }
      price?: string
      rating?: number
      categories?: { title: string }[]
      image_url?: string
    }) => ({
      place_id: `yelp_${b.id}`,
      name: b.name,
      address: b.location?.display_address?.join(', ') ?? '',
      city: b.location?.city ?? '',
      lat: b.coordinates?.latitude ?? 0,
      lng: b.coordinates?.longitude ?? 0,
      price_level: b.price ? b.price.length : null,
      rating: b.rating ?? null,
      cuisine_tags: b.categories?.map((c) => c.title) ?? [],
      photos: b.image_url ? [{ url: b.image_url, source: 'yelp' }] : [],
      source: 'yelp',
    }))

    return NextResponse.json({ results, source: 'yelp' })
  } catch {
    return NextResponse.json(
      { error: 'Search unavailable', results: [] },
      { status: 503 }
    )
  }
}
