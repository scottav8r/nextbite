'use client'

import { useState } from 'react'
import { useStats, useAvailableYears } from '@/lib/query/hooks/useStats'
import { StatsCharts } from '@/components/stats/StatsCharts'
import { MilestoneCard } from '@/components/ui/MilestoneCard'

export default function StatsPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const { data: years = [currentYear] } = useAvailableYears()
  const { data: stats, isLoading } = useStats(selectedYear)

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-2xl text-charcoal-900 dark:text-cream-50">Dining Stats</h1>

        {/* Year selector */}
        <div className="relative">
          <label htmlFor="year-select" className="sr-only">Select year</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="appearance-none rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-cream-50 text-sm font-medium px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span aria-hidden="true" className="absolute right-2 top-1/2 -translate-y-1/2 text-charcoal-800/40 text-xs pointer-events-none">▾</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" aria-label="Loading stats" />
        </div>
      ) : !stats || stats.totalMemories === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4" aria-hidden="true">📊</div>
          <h2 className="font-serif text-xl text-charcoal-900 dark:text-cream-50 mb-2">
            No memories in {selectedYear}
          </h2>
          <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40">
            Log some dining experiences to see your stats.
          </p>
        </div>
      ) : (
        <>
          {/* Year in Dining highlight reel */}
          {stats.highlightReel && (
            <div className="mb-6 rounded-2xl bg-charcoal-900 dark:bg-charcoal-800 text-cream-50 p-5">
              <p className="text-xs font-medium text-gold-400 uppercase tracking-wider mb-3">
                {selectedYear} Year in Dining
              </p>
              <div className="space-y-2">
                {stats.highlightReel.topRatedRestaurant && (
                  <p className="text-sm">
                    <span className="text-cream-100/50">Top rated: </span>
                    <span className="font-medium">{stats.highlightReel.topRatedRestaurant}</span>
                  </p>
                )}
                {stats.highlightReel.mostVisitedCuisine && (
                  <p className="text-sm">
                    <span className="text-cream-100/50">Favourite cuisine: </span>
                    <span className="font-medium">{stats.highlightReel.mostVisitedCuisine}</span>
                  </p>
                )}
                {stats.highlightReel.mostMemorableOccasion && (
                  <p className="text-sm">
                    <span className="text-cream-100/50">Most common occasion: </span>
                    <span className="font-medium">{stats.highlightReel.mostMemorableOccasion}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Summary numbers */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatTile label="Memories" value={stats.totalMemories} />
            <StatTile label="Restaurants" value={stats.uniqueRestaurants} />
            <StatTile label="Wishes" value={stats.totalWishes} />
          </div>

          {/* Charts */}
          <StatsCharts stats={stats} />

          {/* Top visited */}
          {stats.topVisited.length > 0 && (
            <section className="mt-8" aria-labelledby="top-visited-heading">
              <h3 id="top-visited-heading" className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-3">
                Most visited
              </h3>
              <ol className="space-y-2">
                {stats.topVisited.map((r, i) => (
                  <li key={r.restaurant_id} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-charcoal-800/30 dark:text-cream-100/30 w-4 shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-charcoal-900 dark:text-cream-50 truncate">
                      {r.name}
                    </span>
                    <span className="text-xs text-charcoal-800/50 dark:text-cream-100/40 shrink-0">
                      {r.count}×
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Top rated */}
          {stats.topRated.length > 0 && (
            <section className="mt-6" aria-labelledby="top-rated-heading">
              <h3 id="top-rated-heading" className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-3">
                Highest rated
              </h3>
              <ol className="space-y-2">
                {stats.topRated.map((r, i) => (
                  <li key={r.restaurant_id} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-charcoal-800/30 dark:text-cream-100/30 w-4 shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-charcoal-900 dark:text-cream-50 truncate">
                      {r.name}
                    </span>
                    <span className="text-xs text-gold-500 font-medium shrink-0">
                      ★ {r.rating.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-cream-50 dark:bg-charcoal-900 border border-cream-200 dark:border-charcoal-800 p-3 text-center">
      <p className="text-xs text-charcoal-800/50 dark:text-cream-100/40">{label}</p>
      <p className="text-xl font-semibold text-charcoal-900 dark:text-cream-50 mt-0.5">{value}</p>
    </div>
  )
}
