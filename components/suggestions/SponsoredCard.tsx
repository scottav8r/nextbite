'use client'

import { motion } from 'framer-motion'
import type { ScoredSuggestion } from '@/lib/types/domain'

interface SponsoredCardProps {
  suggestion: ScoredSuggestion
  index: number
}

export function SponsoredCard({ suggestion, index }: SponsoredCardProps) {
  const { restaurant } = suggestion
  const photo = restaurant.photos?.[0]?.url

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="rounded-2xl bg-cream-50 dark:bg-charcoal-900 border border-gold-400/30 overflow-hidden">
        {/* Sponsored label */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[10px] font-semibold text-charcoal-800/40 dark:text-cream-100/30 uppercase tracking-wider">
            Sponsored
          </span>
        </div>

        <div className="flex gap-3 px-4 pb-4">
          {/* Thumbnail */}
          <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-cream-200 dark:bg-charcoal-800">
            {photo ? (
              <img src={photo} alt={restaurant.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl" aria-hidden="true">🍽</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-charcoal-900 dark:text-cream-50 truncate">
              {restaurant.name}
            </p>
            {restaurant.cuisine_tags[0] && (
              <p className="text-xs text-charcoal-800/50 dark:text-cream-100/40 mt-0.5">
                {restaurant.cuisine_tags[0]}
                {restaurant.city ? ` · ${restaurant.city}` : ''}
              </p>
            )}
            <a
              href={`/restaurants/${restaurant.id}`}
              className="mt-2 inline-block text-xs font-medium text-gold-500 hover:underline"
            >
              Learn more →
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
