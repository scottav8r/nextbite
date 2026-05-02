'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { priceLevelLabel } from '@/lib/types/domain'
import type { ScoredSuggestion } from '@/lib/types/domain'

const DEFAULT_FOOD = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'

interface SuggestionCardProps {
  suggestion: ScoredSuggestion
  index: number
}

export function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  const { restaurant, match_score, explanation, is_wish, days_since_last_visit } = suggestion
  const photo = restaurant.photos?.[0]?.url ?? DEFAULT_FOOD

  const scoreLabel =
    match_score >= 85 ? 'Perfect match' :
    match_score >= 70 ? 'Great match' :
    match_score >= 55 ? 'Good match' : 'Suggested'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3 }}
    >
      <div className="rounded-3xl overflow-hidden bg-white dark:bg-charcoal-900 shadow-luxury hover:shadow-luxury-lg transition-shadow">
        {/* Hero photo */}
        <div className="relative h-52">
          <img src={photo} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 photo-overlay" />

          {/* Match score */}
          <div className="absolute top-4 right-4">
            <MatchScoreRing score={match_score} label={scoreLabel} />
          </div>

          {/* Wish badge */}
          {is_wish && (
            <div className="absolute top-4 left-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest bg-burgundy-600 text-cream-50 rounded-full px-2.5 py-1">
                On your list
              </span>
            </div>
          )}

          {/* Name + meta overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-serif text-xl text-white font-semibold leading-tight">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {restaurant.cuisine_tags[0] && (
                <span className="text-xs text-white/75">{restaurant.cuisine_tags[0]}</span>
              )}
              {restaurant.price_level && (
                <span className="text-xs text-gold-300 font-medium">{priceLevelLabel(restaurant.price_level)}</span>
              )}
              {restaurant.google_rating && (
                <span className="text-xs text-white/60">★ {restaurant.google_rating.toFixed(1)}</span>
              )}
              {restaurant.city && (
                <span className="text-xs text-white/50">{restaurant.city}</span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Explanation — warm, poetic */}
          {explanation && (
            <p className="text-sm text-charcoal-800/70 dark:text-cream-100/60 italic leading-relaxed font-serif mb-4 border-l-2 border-gold-400/40 pl-3">
              &ldquo;{explanation}&rdquo;
            </p>
          )}

          {days_since_last_visit !== null && days_since_last_visit <= 30 && (
            <p className="text-[11px] text-charcoal-800/40 dark:text-cream-100/35 mb-3">
              You visited {days_since_last_visit} day{days_since_last_visit !== 1 ? 's' : ''} ago
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              href={`/restaurants/${restaurant.id}`}
              className="flex-1 rounded-xl border border-cream-200 dark:border-charcoal-700 text-charcoal-900 dark:text-cream-50 py-2.5 text-xs font-medium text-center hover:bg-cream-50 dark:hover:bg-charcoal-800 transition"
            >
              View details
            </Link>
            <Link
              href={`/memories/new?restaurant_id=${restaurant.id}`}
              className="flex-1 rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-2.5 text-xs font-medium text-center hover:opacity-90 transition"
            >
              Log memory
            </Link>
            {restaurant.reservation_url && (
              <a
                href={restaurant.reservation_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Reserve at ${restaurant.name}`}
                className="px-3 rounded-xl bg-burgundy-600 text-cream-50 py-2.5 text-xs font-medium hover:bg-burgundy-800 transition"
              >
                Reserve
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Match score ring ─────────────────────────────────────────────

function MatchScoreRing({ score, label }: { score: number; label: string }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? '#c9a96e' : score >= 60 ? '#c0526a' : '#ffffff'

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 48 48" aria-label={`Match score: ${Math.round(score)} out of 100`}>
          <circle cx="24" cy="24" r={radius} fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          <motion.circle
            cx="24" cy="24" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            transform="rotate(-90 24 24)"
          />
        </svg>
        <span className="absolute text-[11px] font-bold text-white">{Math.round(score)}</span>
      </div>
      <span className="text-[9px] font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">{label}</span>
    </div>
  )
}
