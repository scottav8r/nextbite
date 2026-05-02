import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Rate limit: 5 req/hour per user
const exportRateLimit = new Map<string, { count: number; resetAt: number }>()
const EXPORT_LIMIT = 5
const EXPORT_WINDOW_MS = 60 * 60 * 1000

function checkExportRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = exportRateLimit.get(userId)

  if (!entry || now > entry.resetAt) {
    exportRateLimit.set(userId, { count: 1, resetAt: now + EXPORT_WINDOW_MS })
    return true
  }

  if (entry.count >= EXPORT_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkExportRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Export rate limit exceeded. Please wait before requesting another export.' },
      { status: 429, headers: { 'Retry-After': '3600' } }
    )
  }

  try {
    // Fetch all user data in parallel
    const [
      profileResult,
      memoriesResult,
      wishesResult,
      tiersResult,
      presetsResult,
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('memories').select('*, restaurant:restaurants(*)').eq('user_id', user.id),
      supabase.from('wishes').select('*, restaurant:restaurants(*)').eq('user_id', user.id),
      supabase.from('user_tiers').select('*').eq('user_id', user.id),
      supabase.from('filter_presets').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      profile: profileResult.data,
      memories: memoriesResult.data ?? [],
      wishes: wishesResult.data ?? [],
      custom_tiers: tiersResult.data ?? [],
      filter_presets: presetsResult.data ?? [],
    }

    const json = JSON.stringify(exportData, null, 2)

    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nextbite-export-${new Date().toISOString().split('T')[0]}.json"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export failed. Please try again.' }, { status: 500 })
  }
}

// Also support GET for direct download links
export async function GET(request: NextRequest) {
  return POST(request)
}
