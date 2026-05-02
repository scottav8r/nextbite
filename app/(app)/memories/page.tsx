'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMemories } from '@/lib/query/hooks/useMemories'
import { MemoryCard } from '@/components/memory/MemoryCard'
import { useOfflineStore } from '@/stores/offlineStore'
import type { Memory } from '@/lib/types/domain'
import { PRESET_TIERS, PRESET_CUISINES, OCCASIONS } from '@/lib/types/domain'

export default function MemoriesPage() {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<{
    tiers: string[]
    cuisines: string[]
    occasions: string[]
  }>({ tiers: [], cuisines: [], occasions: [] })

  const isOnline = useOfflineStore((s) => s.isOnline)
  const cachedMemories = useOfflineStore((s) => s.recentMemoriesCache) as Memory[]

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMemories({
    tiers: filters.tiers.length ? filters.tiers : undefined,
    cuisines: filters.cuisines.length ? filters.cuisines : undefined,
    occasions: filters.occasions.length ? filters.occasions : undefined,
  })

  const allMemories: Memory[] = data?.pages.flat() ?? []

  const filtered = search.trim()
    ? allMemories.filter((m) => {
        const q = search.toLowerCase()
        const restaurant = m.restaurant as { name?: string } | undefined
        return (
          restaurant?.name?.toLowerCase().includes(q) ||
          m.tiers.some((t) => t.toLowerCase().includes(q)) ||
          m.cuisine_tags.some((c) => c.toLowerCase().includes(q)) ||
          m.narrative_note?.toLowerCase().includes(q)
        )
      })
    : allMemories

  const displayMemories = !isOnline && allMemories.length === 0 ? cachedMemories : filtered
  const activeFilterCount = filters.tiers.length + filters.cuisines.length + filters.occasions.length

  return (
    <div className="pb-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="px-5 pt-7 pb-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="text-[10px] font-semibold text-gold-500 uppercase tracking-widest mb-1">Your journey</p>
          <div className="flex items-end justify-between">
            <h1 className="font-serif text-3xl text-charcoal-900 dark:text-cream-50">Memories</h1>
            <span className="text-xs text-charcoal-800/40 dark:text-cream-100/30 mb-1">
              {displayMemories.length} {displayMemories.length === 1 ? 'memory' : 'memories'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="px-5 mb-3">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-800/30 dark:text-cream-100/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            aria-label="Search memories"
            placeholder="Search by restaurant, dish, or note…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-cream-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 pl-10 pr-4 py-3 text-sm text-charcoal-900 dark:text-cream-50 placeholder-charcoal-800/35 focus:outline-none focus:ring-2 focus:ring-gold-400 transition shadow-card"
          />
        </div>
      </div>

      {/* ── Filter toggle ─────────────────────────────────────────── */}
      <div className="px-5 mb-4">
        <button
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className="flex items-center gap-2 text-xs font-medium text-charcoal-800/55 dark:text-cream-100/45 hover:text-charcoal-900 dark:hover:text-cream-50 transition"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-gold-400 text-charcoal-950 text-[10px] font-bold px-1.5 py-0.5">{activeFilterCount}</span>
          )}
          <span aria-hidden="true" className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}>▾</span>
        </button>
      </div>

      {/* ── Filter panel ─────────────────────────────────────────── */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-5 mb-5"
        >
          <div className="rounded-2xl border border-cream-200 dark:border-charcoal-700 p-4 bg-cream-50 dark:bg-charcoal-900 space-y-4">
            <FilterGroup label="Tier" options={PRESET_TIERS as unknown as string[]} selected={filters.tiers} onChange={(tiers) => setFilters((f) => ({ ...f, tiers }))} />
            <FilterGroup label="Cuisine" options={PRESET_CUISINES as unknown as string[]} selected={filters.cuisines} onChange={(cuisines) => setFilters((f) => ({ ...f, cuisines }))} />
            <FilterGroup label="Occasion" options={OCCASIONS as unknown as string[]} selected={filters.occasions} onChange={(occasions) => setFilters((f) => ({ ...f, occasions }))} />
            {activeFilterCount > 0 && (
              <button onClick={() => setFilters({ tiers: [], cuisines: [], occasions: [] })} className="text-xs text-burgundy-600 hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Offline notice ───────────────────────────────────────── */}
      {!isOnline && allMemories.length === 0 && cachedMemories.length > 0 && (
        <p className="px-5 text-xs text-charcoal-800/50 dark:text-cream-100/40 mb-4 text-center">
          Showing cached memories — connect to see all
        </p>
      )}

      {/* ── Timeline ─────────────────────────────────────────────── */}
      <div className="px-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full" aria-label="Loading memories" />
            <p className="font-serif text-sm text-charcoal-800/40 dark:text-cream-100/35 italic">Loading your memories…</p>
          </div>
        ) : displayMemories.length === 0 ? (
          <EmptyState hasSearch={!!search.trim()} hasFilters={activeFilterCount > 0} />
        ) : (
          <>
            <ul className="space-y-3" aria-label="Memories timeline">
              {displayMemories.map((memory, i) => (
                <motion.li
                  key={memory.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <MemoryCard memory={memory} />
                </motion.li>
              ))}
            </ul>

            {hasNextPage && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-2xl border border-cream-200 dark:border-charcoal-700 px-6 py-2.5 text-sm font-medium text-charcoal-900 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-800 transition disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FilterGroup({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((v) => v !== option) : [...selected, option])
  }
  return (
    <div>
      <p className="text-xs font-semibold text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Filter by ${label}`}>
        {options.map((option) => (
          <button key={option} type="button" aria-pressed={selected.includes(option)} onClick={() => toggle(option)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${selected.includes(option) ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950' : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50 hover:bg-cream-200'}`}>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ hasSearch, hasFilters }: { hasSearch: boolean; hasFilters: boolean }) {
  if (hasSearch || hasFilters) {
    return (
      <div className="text-center py-12">
        <p className="text-charcoal-800/50 dark:text-cream-100/40 text-sm">No memories match your {hasSearch ? 'search' : 'filters'}.</p>
      </div>
    )
  }
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
      <div className="text-5xl mb-4" aria-hidden="true">🍽</div>
      <h2 className="font-serif text-xl text-charcoal-900 dark:text-cream-50 mb-2">No memories yet</h2>
      <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 max-w-xs mx-auto">
        Start logging your dining experiences and they&apos;ll appear here.
      </p>
    </motion.div>
  )
}
