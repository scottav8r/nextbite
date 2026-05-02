'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface YearStats {
  year: number
  totalMemories: number
  uniqueRestaurants: number
  totalWishes: number
  memoriesPerMonth: { month: number; count: number }[]
  cuisineBreakdown: { name: string; count: number }[]
  tierBreakdown: { name: string; count: number }[]
  occasionBreakdown: { name: string; count: number }[]
  topVisited: { restaurant_id: string; name: string; count: number }[]
  topRated: { restaurant_id: string; name: string; rating: number }[]
  highlightReel: {
    topRatedRestaurant: string | null
    mostVisitedCuisine: string | null
    mostMemorableOccasion: string | null
  } | null
}

export function useStats(year: number) {
  return useQuery<YearStats>({
    queryKey: ['stats', year],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`

      const [memoriesResult, wishesResult] = await Promise.all([
        supabase
          .from('memories')
          .select(`
            id, visit_date, overall_rating, cuisine_tags, tiers, occasions, restaurant_id,
            restaurant:restaurants(id, name)
          `)
          .eq('user_id', user.id)
          .gte('visit_date', startDate)
          .lte('visit_date', endDate),
        supabase
          .from('wishes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])

      const memories = memoriesResult.data ?? []
      const wishCount = wishesResult.count ?? 0

      // Memories per month
      const monthCounts = new Array(12).fill(0)
      for (const m of memories) {
        const month = new Date(m.visit_date).getMonth()
        monthCounts[month]++
      }
      const memoriesPerMonth = monthCounts.map((count, i) => ({ month: i + 1, count }))

      // Cuisine breakdown
      const cuisineFreq = new Map<string, number>()
      for (const m of memories) {
        for (const tag of (m.cuisine_tags as string[]) ?? []) {
          cuisineFreq.set(tag, (cuisineFreq.get(tag) ?? 0) + 1)
        }
      }
      const cuisineBreakdown = [...cuisineFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }))

      // Tier breakdown
      const tierFreq = new Map<string, number>()
      for (const m of memories) {
        for (const tier of (m.tiers as string[]) ?? []) {
          tierFreq.set(tier, (tierFreq.get(tier) ?? 0) + 1)
        }
      }
      const tierBreakdown = [...tierFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }))

      // Occasion breakdown
      const occasionFreq = new Map<string, number>()
      for (const m of memories) {
        for (const occ of (m.occasions as string[]) ?? []) {
          occasionFreq.set(occ, (occasionFreq.get(occ) ?? 0) + 1)
        }
      }
      const occasionBreakdown = [...occasionFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }))

      // Top visited restaurants
      const visitCounts = new Map<string, { name: string; count: number }>()
      for (const m of memories) {
        const r = m.restaurant as { id: string; name: string } | undefined
        if (!r) continue
        const existing = visitCounts.get(m.restaurant_id)
        visitCounts.set(m.restaurant_id, {
          name: r.name,
          count: (existing?.count ?? 0) + 1,
        })
      }
      const topVisited = [...visitCounts.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([restaurant_id, { name, count }]) => ({ restaurant_id, name, count }))

      // Top rated restaurants (avg overall_rating)
      const ratingMap = new Map<string, { name: string; ratings: number[] }>()
      for (const m of memories) {
        const r = m.restaurant as { id: string; name: string } | undefined
        if (!r) continue
        const existing = ratingMap.get(m.restaurant_id)
        if (existing) {
          existing.ratings.push(m.overall_rating)
        } else {
          ratingMap.set(m.restaurant_id, { name: r.name, ratings: [m.overall_rating] })
        }
      }
      const topRated = [...ratingMap.entries()]
        .map(([restaurant_id, { name, ratings }]) => ({
          restaurant_id,
          name,
          rating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5)

      // Highlight reel (for years with >= 20 memories)
      const highlightReel = memories.length >= 20 ? {
        topRatedRestaurant: topRated[0]?.name ?? null,
        mostVisitedCuisine: cuisineBreakdown[0]?.name ?? null,
        mostMemorableOccasion: occasionBreakdown[0]?.name ?? null,
      } : null

      return {
        year,
        totalMemories: memories.length,
        uniqueRestaurants: new Set(memories.map((m) => m.restaurant_id)).size,
        totalWishes: wishCount,
        memoriesPerMonth,
        cuisineBreakdown,
        tierBreakdown,
        occasionBreakdown,
        topVisited,
        topRated,
        highlightReel,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useAvailableYears() {
  return useQuery<number[]>({
    queryKey: ['stats', 'years'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('memories')
        .select('visit_date')
        .order('visit_date', { ascending: true })

      if (!data?.length) return [new Date().getFullYear()]

      const years = new Set(data.map((m) => new Date(m.visit_date).getFullYear()))
      const currentYear = new Date().getFullYear()
      years.add(currentYear)
      return [...years].sort((a, b) => b - a)
    },
    staleTime: 10 * 60 * 1000,
  })
}
