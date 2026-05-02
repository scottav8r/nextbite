'use client'

import { useState } from 'react'
import { useWishes, useRemoveWish, useAddWish } from '@/lib/query/hooks/useWishes'
import { WishCard } from '@/components/wishes/WishCard'
import { RestaurantSearch } from '@/components/restaurant/RestaurantSearch'
import { upsertRestaurant } from '@/lib/restaurants/upsert'
import type { RestaurantSearchResult } from '@/lib/types/domain'

type SortOption = 'priority' | 'date_added' | 'target_date'

const SORT_LABELS: Record<SortOption, string> = {
  priority: 'Priority',
  date_added: 'Date added',
  target_date: 'Target date',
}

export default function WishesPage() {
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  const [showSearch, setShowSearch] = useState(false)
  const { data: wishes = [], isLoading } = useWishes(sortBy)
  const removeWish = useRemoveWish()
  const addWish = useAddWish()

  async function handleRestaurantSelect(result: RestaurantSearchResult) {
    const restaurant = await upsertRestaurant(result)
    if (!restaurant) return
    await addWish.mutateAsync({ restaurant_id: restaurant.id, priority: 'medium' })
    setShowSearch(false)
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-serif text-2xl text-charcoal-900 dark:text-cream-50">Wishes</h1>
          <p className="text-xs text-charcoal-800/50 dark:text-cream-100/40 mt-0.5">
            {wishes.length} {wishes.length === 1 ? 'place' : 'places'} to try
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add wish button */}
          <button
            onClick={() => setShowSearch((s) => !s)}
            aria-label="Add a wish"
            className="rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 px-3 py-2 text-xs font-medium hover:opacity-90 transition"
          >
            + Add
          </button>

          {/* Sort selector */}
          <div className="relative">
            <label htmlFor="sort-wishes" className="sr-only">Sort wishes by</label>
            <select
              id="sort-wishes"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-cream-50 text-xs font-medium px-3 py-2 pr-7 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                <option key={key} value={key}>{SORT_LABELS[key]}</option>
              ))}
            </select>
            <span aria-hidden="true" className="absolute right-2 top-1/2 -translate-y-1/2 text-charcoal-800/40 text-xs pointer-events-none">▾</span>
          </div>
        </div>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className="mb-5 rounded-2xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 p-4">
          <p className="text-sm font-medium text-charcoal-900 dark:text-cream-50 mb-3">
            Search for a restaurant to add
          </p>
          <RestaurantSearch
            onSelect={handleRestaurantSelect}
            placeholder="Search restaurants…"
          />
          <button
            onClick={() => setShowSearch(false)}
            className="mt-3 text-xs text-charcoal-800/40 hover:text-charcoal-900 dark:hover:text-cream-50 transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" aria-label="Loading wishes" />
        </div>
      ) : wishes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4" aria-hidden="true">♡</div>
          <h2 className="font-serif text-xl text-charcoal-900 dark:text-cream-50 mb-2">
            No wishes yet
          </h2>
          <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 max-w-xs mx-auto mb-6">
            Add restaurants you want to try and they&apos;ll appear here.
          </p>
          <button
            onClick={() => setShowSearch(true)}
            className="rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 px-5 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            + Add your first wish
          </button>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Wishes list">
          {wishes.map((wish) => (
            <li key={wish.id}>
              <WishCard
                wish={wish}
                onRemove={(id) => removeWish.mutate(id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
