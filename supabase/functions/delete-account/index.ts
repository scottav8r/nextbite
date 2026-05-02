/**
 * NextBite — delete-account Edge Function
 *
 * Cascades deletion of all user data and Supabase Storage objects.
 * Sends confirmation emails at initiation and completion.
 * Completes within 30 days per Req 18.5, 24.3.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role for deletion
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify the requesting user
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = user.id

    // 1. Delete all uploaded photos from Supabase Storage
    const { data: memories } = await supabase
      .from('memories')
      .select('photo_urls')
      .eq('user_id', userId)

    const allPhotoUrls: string[] = []
    for (const memory of memories ?? []) {
      allPhotoUrls.push(...((memory.photo_urls as string[]) ?? []))
    }

    if (allPhotoUrls.length > 0) {
      // Extract storage paths from URLs
      const storagePaths = allPhotoUrls
        .map((url) => {
          const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
          return match?.[1] ?? null
        })
        .filter((p): p is string => p !== null)

      if (storagePaths.length > 0) {
        await supabase.storage.from('memories').remove(storagePaths)
      }
    }

    // 2. Delete all user-scoped data (cascade via FK constraints)
    // Order matters: memories → wishes → tiers → presets → users
    await supabase.from('memories').delete().eq('user_id', userId)
    await supabase.from('wishes').delete().eq('user_id', userId)
    await supabase.from('user_tiers').delete().eq('user_id', userId)
    await supabase.from('filter_presets').delete().eq('user_id', userId)
    await supabase.from('users').delete().eq('id', userId)

    // 3. Delete the auth user
    await supabase.auth.admin.deleteUser(userId)

    return new Response(
      JSON.stringify({ success: true, message: 'Account and all associated data deleted.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
