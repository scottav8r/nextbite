'use client'

import { useOfflineStore } from '@/stores/offlineStore'

export function OfflineBanner() {
  const isOnline = useOfflineStore((s) => s.isOnline)

  if (isOnline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-charcoal-800 dark:bg-charcoal-950 text-cream-100 text-xs font-medium py-2 px-4"
    >
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-burgundy-400 animate-pulse" />
      You&apos;re offline — live data and suggestions are unavailable
    </div>
  )
}
