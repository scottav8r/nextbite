'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSuggestions } from '@/lib/query/hooks/useSuggestions'
import { useSuggestionsStore } from '@/stores/suggestionsStore'
import { SuggestionCard } from '@/components/suggestions/SuggestionCard'
import { SponsoredCard } from '@/components/suggestions/SponsoredCard'
import { FilterPanel } from '@/components/suggestions/FilterPanel'
import { surpriseMe } from '@/lib/scoring/score'
import type { ScoredSuggestion } from '@/lib/types/domain'

export default function DiscoverPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [surpriseSuggestion, setSurpriseSuggestion] = useState<ScoredSuggestion | null>(null)
  const { activeFilters, activePresetId } = useSuggestionsStore()

  const { data: suggestions = [], isLoading, error, refetch } = useSuggestions()

  const activeFilterCount =
    activeFilters.tiers.length +
    activeFilters.cuisines.length +
    activeFilters.price_levels.length +
    activeFilters.occasions.length

  function handleSurpriseMe() {
    const pick = surpriseMe(suggestions)
    setSurpriseSuggestion(pick)
  }

  return (
    <div className="pb-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="px-5 pt-7 pb-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-[10px] font-semibold text-gold-500 uppercase tracking-widest mb-1">Discover</p>
          <h1 className="font-serif text-3xl text-charcoal-900 dark:text-cream-50 leading-tight">
            Your next great meal
          </h1>
        </motion.div>
      </div>

      {/* ── Action bar ───────────────────────────────────────────── */}
      <div className="px-5 flex gap-3 mb-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-3.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-luxury"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-cream-50/30 border-t-cream-50 rounded-full animate-spin" aria-hidden="true" />
              <span>Finding…</span>
            </>
          ) : (
            <>
              <span>✦</span>
              <span>Where Should I Bite Next?</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(true)}
          aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
          className="relative rounded-2xl border border-cream-200 dark:border-charcoal-700 px-4 py-3.5 text-sm font-medium text-charcoal-900 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-800 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          {activeFilterCount > 0 && (
            <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold-400 text-charcoal-950 text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* ── Active preset ────────────────────────────────────────── */}
      {activePresetId && (
        <div className="px-5 mb-4">
          <span className="text-xs text-charcoal-800/50 dark:text-cream-100/40">
            Preset: <span className="font-medium text-charcoal-900 dark:text-cream-50">{activePresetId}</span>
          </span>
        </div>
      )}

      {/* ── Surprise Me ──────────────────────────────────────────── */}
      {suggestions.length > 0 && !isLoading && (
        <div className="px-5 mb-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSurpriseMe}
            className="w-full rounded-2xl border border-gold-400/40 text-gold-500 dark:text-gold-400 py-3 text-sm font-medium hover:bg-gold-400/8 transition flex items-center justify-center gap-2"
          >
            <span>🎲</span>
            <span>Surprise Me</span>
          </motion.button>
        </div>
      )}

      {/* ── Surprise result ──────────────────────────────────────── */}
      <AnimatePresence>
        {surpriseSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 mb-5"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-gold-500 uppercase tracking-widest">Your surprise pick</p>
              <button onClick={() => setSurpriseSuggestion(null)} className="text-xs text-charcoal-800/40 hover:text-charcoal-900 dark:hover:text-cream-50 transition">
                Dismiss
              </button>
            </div>
            <SuggestionCard suggestion={surpriseSuggestion} index={0} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ──────────────────────────────────────────────── */}
      <div className="px-5">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : suggestions.length === 0 ? (
          <ZeroResultsState onBroadenFilters={() => setShowFilters(true)} onSurpriseMe={handleSurpriseMe} />
        ) : (
          <ul className="space-y-5" aria-label="Restaurant suggestions">
            {suggestions.map((suggestion, i) =>
              suggestion.is_sponsored ? (
                <li key={`${suggestion.restaurant.id}-${i}`}>
                  <SponsoredCard suggestion={suggestion} index={i} />
                </li>
              ) : (
                <li key={`${suggestion.restaurant.id}-${i}`}>
                  <SuggestionCard suggestion={suggestion} index={i} />
                </li>
              )
            )}
          </ul>
        )}
      </div>

      {showFilters && <FilterPanel onClose={() => setShowFilters(false)} />}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-2 border-gold-400/30 border-t-gold-400 rounded-full"
        aria-label="Finding suggestions"
      />
      <p className="font-serif text-base text-charcoal-800/50 dark:text-cream-100/40 italic">
        Finding your next bite…
      </p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-4" aria-hidden="true">🍽</div>
      <p className="font-serif text-lg text-charcoal-900 dark:text-cream-50 mb-2">Couldn&apos;t load suggestions</p>
      <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 mb-5">Something went wrong. Please try again.</p>
      <button
        onClick={onRetry}
        className="rounded-2xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 px-6 py-2.5 text-sm font-medium hover:opacity-90 transition"
      >
        Try again
      </button>
    </div>
  )
}

function ZeroResultsState({ onBroadenFilters, onSurpriseMe }: { onBroadenFilters: () => void; onSurpriseMe: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="text-5xl mb-4" aria-hidden="true">🍽</div>
      <h2 className="font-serif text-xl text-charcoal-900 dark:text-cream-50 mb-2">No matches found</h2>
      <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 max-w-xs mx-auto mb-7">
        Your filters didn&apos;t return any results. Try broadening them or let us surprise you.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onBroadenFilters}
          className="rounded-2xl border border-cream-200 dark:border-charcoal-700 px-5 py-2.5 text-sm font-medium text-charcoal-900 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-800 transition"
        >
          Adjust filters
        </button>
        <button
          onClick={onSurpriseMe}
          className="rounded-2xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
        >
          Surprise Me
        </button>
      </div>
    </motion.div>
  )
}
