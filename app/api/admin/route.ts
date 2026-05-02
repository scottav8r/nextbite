import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin
 * Returns aggregate metrics for admin monitoring.
 * Requires service role — only accessible with SUPABASE_SERVICE_ROLE_KEY header.
 */
export async function GET(request: NextRequest) {
  // Verify admin access via a secret header
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use service role client for cross-user aggregates
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [usersResult, memoriesResult, suggestionsResult] = await Promise.all([
    // Active users: users who have logged at least one memory in the last 30 days
    supabase
      .from('memories')
      .select('user_id', { count: 'exact', head: false })
      .gte('created_at', thirtyDaysAgo),

    // Memories logged in last 30 days
    supabase
      .from('memories')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo),

    // Suggestion generations in last 30 days
    supabase
      .from('suggestion_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo),
  ])

  const activeUserIds = new Set(
    (usersResult.data ?? []).map((r: { user_id: string }) => r.user_id)
  )

  return NextResponse.json({
    active_users_last_30d: activeUserIds.size,
    memories_logged_last_30d: memoriesResult.count ?? 0,
    suggestions_generated_last_30d: suggestionsResult.count ?? 0,
    generated_at: new Date().toISOString(),
  })
}
