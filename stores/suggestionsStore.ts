import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FilterState {
  tiers: string[]
  cuisines: string[]
  price_levels: (1 | 2 | 3 | 4)[]
  occasions: string[]
  radius_miles: number
  city: string | null
  include_recent: boolean
}

const DEFAULT_FILTERS: FilterState = {
  tiers: [],
  cuisines: [],
  price_levels: [],
  occasions: [],
  radius_miles: 10,
  city: null,
  include_recent: false,
}

interface SuggestionsState {
  activeFilters: FilterState
  activePresetId: string | null
  setFilters: (filters: Partial<FilterState>) => void
  setActivePreset: (presetId: string | null) => void
  resetFilters: () => void
}

export const useSuggestionsStore = create<SuggestionsState>()(
  persist(
    (set) => ({
      activeFilters: DEFAULT_FILTERS,
      activePresetId: null,
      setFilters: (filters) =>
        set((state) => ({
          activeFilters: { ...state.activeFilters, ...filters },
        })),
      setActivePreset: (presetId) => set({ activePresetId: presetId }),
      resetFilters: () =>
        set({ activeFilters: DEFAULT_FILTERS, activePresetId: null }),
    }),
    {
      name: 'nextbite-suggestions',
      partialize: (state) => ({
        activeFilters: state.activeFilters,
        activePresetId: state.activePresetId,
      }),
    }
  )
)
