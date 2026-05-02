'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useSuggestionsStore } from '@/stores/suggestionsStore'
import { useUIStore } from '@/stores/uiStore'
import { PRESET_CUISINES, OCCASIONS } from '@/lib/types/domain'
import { useAllTiers } from '@/lib/query/hooks/useTiers'
import type { FilterPreset } from '@/lib/types/domain'

interface FilterPanelProps {
  onClose: () => void
}

const SYSTEM_PRESETS: { name: string; filters: Record<string, unknown> }[] = [
  { name: 'Quick Lunch Near Me', filters: { occasions: ['Quick Lunch'], price_levels: [1, 2], radius_miles: 5 } },
  { name: 'Date Night', filters: { occasions: ['Date Night'], price_levels: [3, 4] } },
  { name: 'Hidden Gems', filters: { tiers: ['Hidden Gem'] } },
  { name: 'Best Value', filters: { tiers: ['Best Value'], price_levels: [1, 2] } },
]

export function FilterPanel({ onClose }: FilterPanelProps) {
  const { activeFilters, activePresetId, setFilters, setActivePreset, resetFilters } = useSuggestionsStore()
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()
  const allTiers = useAllTiers()
  const [savingPreset, setSavingPreset] = useState(false)
  const [presetName, setPresetName] = useState('')

  // User's saved presets
  const { data: savedPresets = [] } = useQuery<FilterPreset[]>({
    queryKey: ['filter-presets'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('filter_presets')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as FilterPreset[]
    },
  })

  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('filter_presets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filter-presets'] })
      addToast({ type: 'success', message: 'Preset deleted.' })
    },
  })

  async function handleSavePreset() {
    if (!presetName.trim()) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await (supabase as any).from('filter_presets').insert({
      user_id: user.id,
      name: presetName.trim(),
      filters: activeFilters,
      is_system_default: false,
    })

    if (error) {
      addToast({ type: 'error', message: 'Could not save preset.' })
    } else {
      queryClient.invalidateQueries({ queryKey: ['filter-presets'] })
      addToast({ type: 'success', message: `Preset "${presetName}" saved.` })
      setPresetName('')
      setSavingPreset(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyPreset(preset: { name: string; filters: any }, id?: string) {
    setFilters({
      tiers: [], cuisines: [], price_levels: [], occasions: [],
      radius_miles: 10, city: null, include_recent: false,
      ...preset.filters,
    })
    setActivePreset(id ?? preset.name)
  }

  function toggleMulti<T>(current: T[], value: T): T[] {
    return current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
  }

  return (
    <div
      role="dialog"
      aria-label="Filter suggestions"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col"
    >
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="bg-white dark:bg-charcoal-900 rounded-t-3xl max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-cream-200 dark:bg-charcoal-800" aria-hidden="true" />
        </div>

        <div className="px-4 pb-8">
          <div className="flex items-center justify-between py-3 mb-2">
            <h2 className="font-serif text-lg text-charcoal-900 dark:text-cream-50">Filters</h2>
            <button
              onClick={() => { resetFilters(); onClose() }}
              className="text-xs text-charcoal-800/50 hover:text-burgundy-600 transition"
            >
              Clear all
            </button>
          </div>

          {/* Preset chips */}
          <div className="mb-5">
            <p className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 mb-2">Presets</p>
            <div className="flex flex-wrap gap-2">
              {SYSTEM_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  aria-pressed={activePresetId === preset.name}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    activePresetId === preset.name
                      ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950'
                      : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50 hover:bg-cream-200'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
              {savedPresets.map((preset) => (
                <div key={preset.id} className="flex items-center gap-1">
                  <button
                    onClick={() => applyPreset({ name: preset.name, filters: preset.filters as Partial<typeof activeFilters> }, preset.id)}
                    aria-pressed={activePresetId === preset.id}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      activePresetId === preset.id
                        ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950'
                        : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50 hover:bg-cream-200'
                    }`}
                  >
                    {preset.name}
                  </button>
                  <button
                    onClick={() => deletePreset.mutate(preset.id)}
                    aria-label={`Delete preset ${preset.name}`}
                    className="text-charcoal-800/30 hover:text-burgundy-600 text-xs transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tiers */}
          <FilterSection label="Tiers">
            {allTiers.map((tier) => (
              <FilterChip
                key={tier.id}
                label={tier.name}
                selected={activeFilters.tiers.includes(tier.name)}
                onToggle={() => setFilters({ tiers: toggleMulti(activeFilters.tiers, tier.name) })}
              />
            ))}
          </FilterSection>

          {/* Cuisines */}
          <FilterSection label="Cuisine">
            {(PRESET_CUISINES as unknown as string[]).map((c) => (
              <FilterChip
                key={c}
                label={c}
                selected={activeFilters.cuisines.includes(c)}
                onToggle={() => setFilters({ cuisines: toggleMulti(activeFilters.cuisines, c) })}
              />
            ))}
          </FilterSection>

          {/* Price */}
          <FilterSection label="Price">
            {([1, 2, 3, 4] as const).map((level) => (
              <FilterChip
                key={level}
                label={'$'.repeat(level)}
                selected={activeFilters.price_levels.includes(level)}
                onToggle={() => setFilters({ price_levels: toggleMulti(activeFilters.price_levels, level) })}
              />
            ))}
          </FilterSection>

          {/* Occasions */}
          <FilterSection label="Occasion">
            {(OCCASIONS as unknown as string[]).map((o) => (
              <FilterChip
                key={o}
                label={o}
                selected={activeFilters.occasions.includes(o)}
                onToggle={() => setFilters({ occasions: toggleMulti(activeFilters.occasions, o) })}
              />
            ))}
          </FilterSection>

          {/* Location */}
          <div className="mb-5">
            <p className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 mb-2">Location</p>
            <div className="flex gap-2 mb-3">
              <FilterChip
                label="Near Me"
                selected={!activeFilters.city}
                onToggle={() => setFilters({ city: null })}
              />
              <FilterChip
                label="City"
                selected={!!activeFilters.city}
                onToggle={() => setFilters({ city: activeFilters.city ?? '' })}
              />
            </div>
            {activeFilters.city !== null && (
              <input
                type="text"
                value={activeFilters.city}
                onChange={(e) => setFilters({ city: e.target.value })}
                placeholder="Enter city…"
                className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-3 py-2 text-sm text-charcoal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-gold-400 transition mb-3"
              />
            )}
            <div>
              <label htmlFor="radius-slider" className="text-xs text-charcoal-800/50 dark:text-cream-100/40">
                Radius: {activeFilters.radius_miles} miles
              </label>
              <input
                id="radius-slider"
                type="range"
                min={1}
                max={50}
                value={activeFilters.radius_miles}
                onChange={(e) => setFilters({ radius_miles: Number(e.target.value) })}
                className="w-full mt-1 accent-gold-400"
              />
            </div>
          </div>

          {/* Include recent */}
          <label className="flex items-center gap-3 mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={activeFilters.include_recent}
              onChange={(e) => setFilters({ include_recent: e.target.checked })}
              className="w-4 h-4 rounded accent-gold-400"
            />
            <span className="text-sm text-charcoal-900 dark:text-cream-50">Include recently visited</span>
          </label>

          {/* Save preset */}
          {!savingPreset ? (
            <button
              onClick={() => setSavingPreset(true)}
              className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 py-2.5 text-sm font-medium text-charcoal-900 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-800 transition mb-3"
            >
              Save as preset
            </button>
          ) : (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name…"
                className="flex-1 rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-3 py-2 text-sm text-charcoal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
              />
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 px-4 py-2 text-sm font-medium disabled:opacity-40 transition"
              >
                Save
              </button>
              <button
                onClick={() => setSavingPreset(false)}
                className="rounded-xl border border-cream-200 dark:border-charcoal-800 px-3 py-2 text-sm text-charcoal-800/60 hover:bg-cream-100 transition"
              >
                ✕
              </button>
            </div>
          )}

          {/* Apply */}
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-3 text-sm font-medium hover:opacity-90 transition"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={`Filter by ${label}`}>
        {children}
      </div>
    </div>
  )
}

function FilterChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        selected
          ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950'
          : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50 hover:bg-cream-200'
      }`}
    >
      {label}
    </button>
  )
}
