'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Restaurant } from '@/lib/types/domain'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function useRestaurant(id: string) {
  return useQuery<Restaurant>({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Trigger background refresh if stale (Req 20.5, 21.2)
      const lastSynced = new Date(data.last_synced_at).getTime()
      const isStale = data.place_id && Date.now() - lastSynced > SEVEN_DAYS_MS

      if (isStale) {
        // Fire-and-forget refresh via Edge Function
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (supabaseUrl) {
          fetch(`${supabaseUrl}/functions/v1/refresh-restaurant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ restaurant_id: id }),
          }).catch(() => {})
        }
      }

      return data as Restaurant
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    enabled: !!id,
  })
}
