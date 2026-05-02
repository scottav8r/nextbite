'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearAuth } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        clearAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, clearAuth])

  return <>{children}</>
}
