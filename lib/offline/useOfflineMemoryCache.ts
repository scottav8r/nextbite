'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOfflineStore } from '@/stores/offlineStore'

/**
 * Keeps the 20 most recent memories cached in offlineStore (localStorage)
 * so they can be displayed when the user is offline.
 * Call this hook once inside the protected app layout.
 */
export function useOfflineMemoryCache() {
  const setRecentMemoriesCache = useOfflineStore((s) => s.setRecentMemoriesCache)

  const { data } = useQuery({
    queryKey: ['memories', 'offline-cache'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('memories')
        .select(`
          id, visit_date, overall_rating, tiers, photo_urls, mood,
          restaurant:restaurants(id, name, city, cuisine_tags, price_level)
        `)
        .order('visit_date', { ascending: false })
        .limit(20)

      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (data) {
      setRecentMemoriesCache(data)
    }
  }, [data, setRecentMemoriesCache])
}
