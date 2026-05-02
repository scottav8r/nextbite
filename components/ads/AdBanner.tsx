'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Ad } from '@/lib/types/domain'

interface AdBannerProps {
  cuisines?: string[]
  occasions?: string[]
  city?: string | null
}

export function AdBanner({ cuisines = [], occasions = [], city }: AdBannerProps) {
  const { data: ad } = useQuery<Ad | null>({
    queryKey: ['ad', cuisines, occasions, city],
    queryFn: async () => {
      const supabase = createClient()
      const now = new Date().toISOString()

      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .limit(10)

      if (!data?.length) return null

      // Client-side targeting: find best matching ad
      const scored = data.map((ad) => {
        let score = 0
        if (ad.target_cuisines?.some((c: string) => cuisines.includes(c))) score += 3
        if (ad.target_occasions?.some((o: string) => occasions.includes(o))) score += 2
        if (ad.target_city && city && ad.target_city.toLowerCase() === city.toLowerCase()) score += 2
        if (!ad.target_cuisines && !ad.target_occasions && !ad.target_city) score += 1 // generic
        return { ad, score }
      })

      const best = scored.sort((a, b) => b.score - a.score)[0]
      return best?.score > 0 ? best.ad : null
    },
    staleTime: 5 * 60 * 1000,
  })

  if (!ad) return null

  return (
    <a
      href={ad.cta_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`Sponsored: ${ad.title}`}
      className="block rounded-2xl overflow-hidden border border-gold-400/20 bg-cream-50 dark:bg-charcoal-900"
    >
      {ad.image_url && (
        <img
          src={ad.image_url}
          alt=""
          aria-hidden="true"
          className="w-full h-28 object-cover"
        />
      )}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-charcoal-800/40 dark:text-cream-100/30 uppercase tracking-wider mb-0.5">
            Sponsored
          </p>
          <p className="text-sm font-medium text-charcoal-900 dark:text-cream-50 truncate">{ad.title}</p>
          <p className="text-xs text-charcoal-800/60 dark:text-cream-100/50 mt-0.5 line-clamp-2">{ad.body}</p>
        </div>
        <span className="shrink-0 text-xs text-gold-500 font-medium mt-4">→</span>
      </div>
    </a>
  )
}
