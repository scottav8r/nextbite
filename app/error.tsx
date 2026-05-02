'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { section: 'global' },
    })
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-4xl mb-4">✦</div>
        <h2 className="font-serif text-xl text-charcoal-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-charcoal-800/60 mb-6 max-w-xs">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-charcoal-900 text-cream-50 px-6 py-2.5 text-sm font-medium"
        >
          Try again
        </button>
      </body>
    </html>
  )
}
