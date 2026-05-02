'use client'

import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'

/**
 * PWA install prompt.
 * - Captures the `beforeinstallprompt` event and stores it in uiStore.
 * - Shown after the user logs their first Memory (triggered externally via showInstallPrompt()).
 * - On iOS Safari (no beforeinstallprompt), shows manual instructions.
 * - Dismissed at most twice before being permanently hidden.
 */

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

export function InstallPromptCapture() {
  const { setInstallPromptEvent } = useUIStore()

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPromptEvent(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [setInstallPromptEvent])

  return null
}

interface InstallPromptBannerProps {
  visible: boolean
  onDismiss: () => void
}

export function InstallPromptBanner({ visible, onDismiss }: InstallPromptBannerProps) {
  const { installPromptEvent, setInstallPromptEvent, incrementInstallPromptDismiss } =
    useUIStore()
  const [ios] = useState(isIosSafari)
  const [standalone] = useState(isInStandaloneMode)

  if (!visible || standalone) return null

  async function handleInstall() {
    if (!installPromptEvent) return
    const promptEvent = installPromptEvent as BeforeInstallPromptEvent
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    if (outcome === 'accepted') {
      setInstallPromptEvent(null)
    }
    onDismiss()
  }

  function handleDismiss() {
    incrementInstallPromptDismiss()
    onDismiss()
  }

  return (
    <div
      role="dialog"
      aria-label="Install NextBite"
      aria-modal="false"
      className="fixed bottom-24 inset-x-4 z-50 rounded-2xl bg-charcoal-900 dark:bg-charcoal-800 text-cream-50 p-5 shadow-2xl"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-gold-400 flex items-center justify-center">
          <span className="font-serif text-charcoal-950 text-lg font-bold">N</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-serif text-base font-medium">Add NextBite to your home screen</p>
          <p className="mt-1 text-xs text-cream-100/60">
            {ios
              ? 'Tap the Share icon below, then "Add to Home Screen".'
              : 'Get the full app experience — fast, offline-ready, no browser chrome.'}
          </p>

          {!ios && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 rounded-xl bg-gold-400 text-charcoal-950 text-sm font-medium py-2 hover:bg-gold-300 active:scale-[0.98] transition"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 rounded-xl border border-cream-100/20 text-cream-100/70 text-sm hover:bg-cream-100/10 active:scale-[0.98] transition"
              >
                Not now
              </button>
            </div>
          )}

          {ios && (
            <button
              onClick={handleDismiss}
              className="mt-3 text-xs text-cream-100/50 hover:text-cream-100/80 transition"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Extend Window type for beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
