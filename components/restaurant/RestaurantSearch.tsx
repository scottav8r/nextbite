'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'
import type { RestaurantSearchResult } from '@/lib/types/domain'
import { priceLevelLabel } from '@/lib/types/domain'

interface RestaurantSearchProps {
  onSelect: (result: RestaurantSearchResult) => void
  placeholder?: string
  defaultValue?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function RestaurantSearch({
  onSelect,
  placeholder = 'Search for a restaurant…',
  defaultValue = '',
}: RestaurantSearchProps) {
  const [query, setQuery] = useState(defaultValue)
  const [results, setResults] = useState<RestaurantSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedName, setSelectedName] = useState(defaultValue)
  const addToast = useUIStore((s) => s.addToast)
  const listboxId = 'restaurant-search-listbox'
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/places?query=${encodeURIComponent(q)}`)
      if (!res.ok) {
        if (res.status === 429) {
          addToast({ type: 'info', message: 'Too many searches. Please wait a moment.' })
          return
        }
        throw new Error('Search failed')
      }
      const data = await res.json()
      setResults(data.results ?? [])
      setIsOpen(true)
    } catch {
      addToast({ type: 'error', message: 'Search unavailable. Try entering details manually.' })
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    if (debouncedQuery !== selectedName) {
      search(debouncedQuery)
    }
  }, [debouncedQuery, selectedName, search])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(result: RestaurantSearchResult) {
    setSelectedName(result.name)
    setQuery(result.name)
    setIsOpen(false)
    onSelect(result)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label="Search for a restaurant"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedName('')
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 py-3 pr-10 text-charcoal-900 dark:text-cream-50 placeholder-charcoal-800/40 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
        />
        {isLoading && (
          <div
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin"
          />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Restaurant search results"
          className="absolute z-50 mt-1 w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shadow-xl overflow-hidden max-h-72 overflow-y-auto"
        >
          {results.map((result) => (
            <li
              key={result.place_id}
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(result)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(result)}
              tabIndex={0}
              className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-cream-50 dark:hover:bg-charcoal-800 transition border-b border-cream-100 dark:border-charcoal-800 last:border-0"
            >
              {/* Photo thumbnail */}
              {result.photos[0] ? (
                <img
                  src={result.photos[0].url}
                  alt=""
                  aria-hidden="true"
                  className="w-10 h-10 rounded-lg object-cover shrink-0 bg-cream-200"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="w-10 h-10 rounded-lg bg-cream-200 dark:bg-charcoal-800 shrink-0 flex items-center justify-center text-charcoal-800/30 text-xs"
                >
                  🍽
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal-900 dark:text-cream-50 truncate">
                  {result.name}
                </p>
                <p className="text-xs text-charcoal-800/50 dark:text-cream-100/40 truncate mt-0.5">
                  {result.address}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {result.cuisine_tags[0] && (
                    <span className="text-[10px] text-charcoal-800/60 dark:text-cream-100/50">
                      {result.cuisine_tags[0]}
                    </span>
                  )}
                  {result.price_level && (
                    <span className="text-[10px] text-gold-500 dark:text-gold-400 font-medium">
                      {priceLevelLabel(result.price_level)}
                    </span>
                  )}
                  {result.rating && (
                    <span className="text-[10px] text-charcoal-800/60 dark:text-cream-100/50">
                      ★ {result.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && results.length === 0 && !isLoading && query.length >= 2 && (
        <div
          role="status"
          className="absolute z-50 mt-1 w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 shadow-xl px-4 py-3 text-sm text-charcoal-800/60 dark:text-cream-100/50"
        >
          No restaurants found. Try a different search or enter details manually.
        </div>
      )}
    </div>
  )
}
