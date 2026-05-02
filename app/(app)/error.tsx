'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { section: 'app' },
      extra: { digest: error.digest },
    })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-4xl mb-4" aria-hidden="true">✦</div>
      <h2 className="font-serif text-xl text-charcoal-900 dark:text-cream-50 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-charcoal-800/60 dark:text-cream-100/50 mb-6 max-w-xs">
        We encountered an unexpected issue. Your data is safe.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 px-6 py-2.5 text-sm font-medium hover:opacity-90 transition"
      >
        Try again
      </button>
    </div>
  )
}
