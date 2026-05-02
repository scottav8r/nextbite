'use client'

import Link from 'next/link'
import type { Wish } from '@/lib/types/domain'

const PRIORITY_STYLES = {
  high: 'bg-burgundy-600 text-cream-50',
  medium: 'bg-gold-400 text-charcoal-950',
  low: 'bg-cream-200 dark:bg-charcoal-800 text-charcoal-800 dark:text-cream-100',
}

const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

interface WishCardProps {
  wish: Wish
  onRemove?: (id: string) => void
}

export function WishCard({ wish, onRemove }: WishCardProps) {
  const restaurant = wish.restaurant as { name: string; city?: string; cuisine_tags?: string[]; photos?: { url: string }[] } | undefined
  const photo = restaurant?.photos?.[0]?.url

  const targetDate = wish.target_date
    ? new Date(wish.target_date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : null

  return (
    <div className="flex gap-3 rounded-2xl bg-white dark:bg-charcoal-900 border border-cream-200 dark:border-charcoal-800 p-4">
      {/* Photo */}
      <Link href={`/wishes/${wish.id}`} className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-cream-200 dark:bg-charcoal-800">
        {photo ? (
          <img src={photo} alt="" aria-hidden="true" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl" aria-hidden="true">♡</div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/wishes/${wish.id}`} className="block">
          <p className="font-medium text-sm text-charcoal-900 dark:text-cream-50 truncate">
            {restaurant?.name ?? 'Unknown restaurant'}
          </p>
          {restaurant?.city && (
            <p className="text-xs text-charcoal-800/50 dark:text-cream-100/40 mt-0.5 truncate">
              {restaurant.city}
              {restaurant.cuisine_tags?.[0] ? ` · ${restaurant.cuisine_tags[0]}` : ''}
            </p>
          )}
        </Link>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Priority badge */}
          <span
            className={`rounded-full text-[10px] font-semibold px-2 py-0.5 ${PRIORITY_STYLES[wish.priority]}`}
            aria-label={`Priority: ${PRIORITY_LABELS[wish.priority]}`}
          >
            {PRIORITY_LABELS[wish.priority]}
          </span>

          {/* Target date */}
          {targetDate && (
            <span className="text-[10px] text-charcoal-800/50 dark:text-cream-100/40">
              🗓 {targetDate}
            </span>
          )}

          {/* Occasion */}
          {wish.target_occasion && (
            <span className="text-[10px] text-charcoal-800/50 dark:text-cream-100/40">
              {wish.target_occasion}
            </span>
          )}
        </div>

        {/* Notes preview */}
        {wish.notes && (
          <p className="mt-1.5 text-xs text-charcoal-800/60 dark:text-cream-100/50 line-clamp-1">
            {wish.notes}
          </p>
        )}
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={() => onRemove(wish.id)}
          aria-label={`Remove ${restaurant?.name ?? 'wish'} from Wishes`}
          className="shrink-0 self-start text-charcoal-800/30 hover:text-burgundy-600 transition p-1"
        >
          ✕
        </button>
      )}
    </div>
  )
}
