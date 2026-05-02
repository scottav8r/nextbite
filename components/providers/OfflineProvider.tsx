'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useOfflineStore } from '@/stores/offlineStore'
import { useUIStore } from '@/stores/uiStore'
import { drainQueue } from '@/lib/offline/sync'

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { setIsOnline } = useOfflineStore()
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('SW registration failed:', err))
    }
  }, [])

  // Online/offline listeners + queue drain on reconnect
  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      setIsOnline(true)

      // Drain any queued offline writes
      const result = await drainQueue()

      if (result.synced > 0) {
        addToast({
          type: 'success',
          message: `${result.synced} item${result.synced > 1 ? 's' : ''} synced successfully.`,
        })
        // Invalidate affected queries so UI reflects server state
        queryClient.invalidateQueries({ queryKey: ['memories'] })
        queryClient.invalidateQueries({ queryKey: ['wishes'] })
      }

      if (result.failed.length > 0) {
        addToast({
          type: 'error',
          message: `${result.failed.length} item${result.failed.length > 1 ? 's' : ''} failed to sync. Check your connection and retry.`,
        })
      }
    }

    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOnline, addToast, queryClient])

  return <>{children}</>
}
