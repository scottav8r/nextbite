'use client'

import { useUIStore } from '@/stores/uiStore'

export function ToastProvider() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`
            pointer-events-auto flex items-center justify-between gap-3
            rounded-xl px-4 py-3 shadow-lg text-sm font-medium
            ${toast.type === 'success' ? 'bg-charcoal-900 text-cream-50 dark:bg-cream-100 dark:text-charcoal-900' : ''}
            ${toast.type === 'error' ? 'bg-burgundy-600 text-cream-50' : ''}
            ${toast.type === 'info' ? 'bg-charcoal-800 text-cream-100' : ''}
          `}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
