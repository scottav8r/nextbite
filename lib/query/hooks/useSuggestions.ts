'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useSuggestionsStore } from '@/stores/suggestionsStore'
import { buildIntelligentDefaults, getCurrentContext } from '@/lib/scoring/defaults'
import type { ScoredSuggestion, TasteProfile } from '@/lib/types/domain'

export function useSuggestions() {
  const { activeFilters } = useSuggestionsStore()

  return useQuery<ScoredSuggestion[]>({
    queryKey: ['suggestions', activeFilters],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get taste profile for intelligent defaults
      const { data: userData } = await supabase
        .from('users')
        .select('taste_profile')
        .eq('id', user.id)
        .single()

      const profile = (userData?.taste_profile ?? {
        top_cuisines: [], top_tiers: [], top_occasions: [],
        avg_price_level: 0, avg_overall_rating: 0, memory_count: 0,
      }) as TasteProfile

      // Apply intelligent defaults if no active filters
      const hasActiveFilters =
        activeFilters.tiers.length > 0 ||
        activeFilters.cuisines.length > 0 ||
        activeFilters.price_levels.length > 0 ||
        activeFilters.occasions.length > 0

      const effectiveFilters = hasActiveFilters
        ? activeFilters
        : { ...activeFilters, ...buildIntelligentDefaults(getCurrentContext(), profile) }

      // Get user location
      let location: { lat: number; lng: number } | { city: string } = { city: userData?.taste_profile?.home_city ?? 'New York' }

      try {
        if ('geolocation' in navigator) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
          })
          location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        }
      } catch {
        // Fall back to home city
      }

      const context = getCurrentContext()

      // Call the Edge Function
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-suggestions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            filters: effectiveFilters,
            location,
            context: {
              time_of_day: context.hour < 12 ? 'morning' : context.hour < 17 ? 'afternoon' : 'evening',
              day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][context.dayOfWeek],
            },
          }),
        }
      )

      if (!res.ok) throw new Error('Suggestion generation failed')

      const data = await res.json()
      return (data.suggestions ?? []) as ScoredSuggestion[]
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  })
}
