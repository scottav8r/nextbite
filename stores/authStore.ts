import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: {
    display_name: string | null
    home_city: string | null
    favorite_cuisines: string[]
    dietary_preferences: string[]
    common_occasions: string[]
    onboarding_completed: boolean
  } | null
  setUser: (user: User | null) => void
  setProfile: (profile: AuthState['profile']) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      clearAuth: () => set({ user: null, profile: null }),
    }),
    {
      name: 'nextbite-auth',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)
