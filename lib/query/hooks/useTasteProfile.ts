'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getPersonalizationLevel } from '@/lib/scoring/weights'
import type { TasteProfile } from '@/lib/types/domain'

export function useTasteProfile() {
  return useQuery<TasteProfile>({
    queryKey: ['taste-profile'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('users')
        .select('taste_profile')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const raw = (data?.taste_profile ?? {}) as Record<string, unknown>
      const memoryCount = (raw.memory_count as number) ?? 0

      return {
        top_cuisines: (raw.top_cuisines as string[]) ?? [],
        top_tiers: (raw.top_tiers as string[]) ?? [],
        top_occasions: (raw.top_occasions as string[]) ?? [],
        avg_price_level: (raw.avg_price_level as number) ?? 0,
        avg_overall_rating: (raw.avg_overall_rating as number) ?? 0,
        memory_count: memoryCount,
        personalization_level: getPersonalizationLevel(memoryCount),
      } satisfies TasteProfile
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useDiningStats() {
  return useQuery({
    queryKey: ['dining-stats'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const [memoriesResult, wishesResult] = await Promise.all([
        supabase
          .from('memories')
          .select('id, restaurant_id, cuisine_tags, tiers, overall_rating')
          .eq('user_id', user.id),
        supabase
          .from('wishes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])

      const memories = memoriesResult.data ?? []
      const wishCount = wishesResult.count ?? 0

      const uniqueRestaurants = new Set(memories.map((m) => m.restaurant_id)).size

      // Most frequent cuisine
      const cuisineFreq = new Map<string, number>()
      for (const m of memories) {
        for (const tag of (m.cuisine_tags as string[]) ?? []) {
          cuisineFreq.set(tag, (cuisineFreq.get(tag) ?? 0) + 1)
        }
      }
      const mostFrequentCuisine = [...cuisineFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

      // Most used tier
      const tierFreq = new Map<string, number>()
      for (const m of memories) {
        for (const tier of (m.tiers as string[]) ?? []) {
          tierFreq.set(tier, (tierFreq.get(tier) ?? 0) + 1)
        }
      }
      const mostUsedTier = [...tierFreq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

      return {
        totalMemories: memories.length,
        uniqueRestaurants,
        mostFrequentCuisine,
        mostUsedTier,
        wishCount,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
