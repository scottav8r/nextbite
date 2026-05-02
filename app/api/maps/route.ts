import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const zoom = searchParams.get('zoom') ?? '13'
  const width = searchParams.get('width') ?? '600'
  const height = searchParams.get('height') ?? '400'

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Maps API unavailable' }, { status: 503 })
  }

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom,
    size: `${width}x${height}`,
    scale: '2',
    maptype: 'roadmap',
    style: 'feature:poi|visibility:off',
    key: apiKey,
  })

  const url = `https://maps.googleapis.com/maps/api/staticmap?${params}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text()
      console.error('Static Maps API error:', res.status, text)
      throw new Error(`Maps API error: ${res.status}`)
    }

    // Check if Google returned an error image or JSON error
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('image')) {
      const text = await res.text()
      console.error('Static Maps API returned non-image:', contentType, text)
      throw new Error('Maps API returned non-image response')
    }

    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('Map fetch failed:', err)
    return NextResponse.json({ error: 'Map unavailable' }, { status: 503 })
  }
}
