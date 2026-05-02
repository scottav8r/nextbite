'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Memory } from '@/lib/types/domain'

interface MemoryCardProps {
  memory: Memory
  variant?: 'default' | 'large'
}

const DEFAULT_FOOD = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80'

export function MemoryCard({ memory, variant = 'default' }: MemoryCardProps) {
  const restaurant = memory.restaurant as { name: string; city?: string; photos?: { url: string }[] } | undefined
  const thumbnail = memory.photo_urls?.[0] ?? restaurant?.photos?.[0]?.url ?? DEFAULT_FOOD
  const primaryTier = memory.tiers?.[0]

  const visitDate = new Date(memory.visit_date).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const ratingColor =
    memory.overall_rating >= 9 ? 'text-gold-400' :
    memory.overall_rating >= 7 ? 'text-gold-500' :
    'text-cream-200/70'

  if (variant === 'large') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          href={`/memories/${memory.id}`}
          className="block rounded-3xl overflow-hidden shadow-luxury-lg active:scale-[0.99] transition-transform"
          aria-label={`Memory at ${restaurant?.name ?? 'restaurant'} on ${visitDate}, rated ${memory.overall_rating} out of 10`}
        >
          {/* Full-bleed photo */}
          <div className="relative h-56">
            <img src={thumbnail} alt="" aria-hidden="true" className="w-full h-full object-cover" />
            <div className="absolute inset-0 photo-overlay" />

            {/* Rating badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
              <span className="text-gold-400 text-xs">★</span>
              <span className={`text-sm font-semibold ${ratingColor}`}>{memory.overall_rating}</span>
              <span className="text-white/40 text-xs">/10</span>
            </div>

            {/* Tier badge */}
            {primaryTier && (
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest bg-gold-400/90 text-charcoal-950 rounded-full px-2.5 py-1">
                  {primaryTier}
                </span>
              </div>
            )}

            {/* Name + date overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="font-serif text-xl text-white font-semibold leading-tight truncate">
                {restaurant?.name ?? 'Unknown restaurant'}
              </p>
              <p className="text-xs text-white/60 mt-1">{visitDate}{restaurant?.city ? ` · ${restaurant.city}` : ''}</p>
            </div>
          </div>

          {/* Narrative preview */}
          {memory.narrative_note && (
            <div className="bg-white dark:bg-charcoal-900 px-4 py-3">
              <p className="text-xs text-charcoal-800/60 dark:text-cream-100/50 line-clamp-2 leading-relaxed italic font-serif">
                &ldquo;{memory.narrative_note}&rdquo;
              </p>
            </div>
          )}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.15 }}>
      <Link
        href={`/memories/${memory.id}`}
        className="flex gap-3 rounded-2xl bg-white dark:bg-charcoal-900 border border-cream-200 dark:border-charcoal-800 overflow-hidden shadow-card hover:shadow-luxury active:scale-[0.99] transition-all"
        aria-label={`Memory at ${restaurant?.name ?? 'restaurant'} on ${visitDate}, rated ${memory.overall_rating} out of 10`}
      >
        {/* Thumbnail */}
        <div className="shrink-0 w-20 h-20 overflow-hidden">
          <img src={thumbnail} alt="" aria-hidden="true" className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 py-3 pr-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-serif font-medium text-sm text-charcoal-900 dark:text-cream-50 truncate">
                {restaurant?.name ?? 'Unknown restaurant'}
              </p>
              <p className="text-xs text-charcoal-800/50 dark:text-cream-100/40 mt-0.5">
                {visitDate}{restaurant?.city ? ` · ${restaurant.city}` : ''}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-0.5">
              <span className="text-gold-400 text-xs" aria-hidden="true">★</span>
              <span className={`text-sm font-semibold ${ratingColor}`}>{memory.overall_rating}</span>
              <span className="text-xs text-charcoal-800/30 dark:text-cream-100/30">/10</span>
            </div>
          </div>

          {primaryTier && (
            <span className="mt-1.5 inline-block rounded-full bg-gold-400/15 text-gold-600 dark:text-gold-400 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5">
              {primaryTier}
            </span>
          )}

          {memory.narrative_note && (
            <p className="mt-1.5 text-xs text-charcoal-800/55 dark:text-cream-100/45 line-clamp-1 leading-relaxed italic">
              {memory.narrative_note}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
