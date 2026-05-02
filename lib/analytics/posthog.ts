/**
 * PostHog analytics event helpers.
 * All events are instrumented without PII (Req 23.1, 23.2).
 */

import posthog from 'posthog-js'

let initialized = false

export function initPostHog() {
  if (initialized || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'
  if (!key) return

  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // We handle this manually
    capture_pageleave: true,
    persistence: 'localStorage',
    // Strip any PII from event properties
    sanitize_properties: (properties) => {
      const sanitized = { ...properties }
      // Remove any accidentally included PII fields
      delete sanitized.email
      delete sanitized.name
      delete sanitized.display_name
      delete sanitized.phone
      return sanitized
    },
  })

  initialized = true
}

// ─── Key events (Req 23.1) ────────────────────────────────────────

export function trackAccountCreated(method: 'email' | 'google' | 'apple') {
  posthog.capture('account_created', { method })
}

export function trackMemoryLogged(props: {
  cuisine_count: number
  tier_count: number
  has_photos: boolean
  has_rating: boolean
  overall_rating: number
}) {
  posthog.capture('memory_logged', props)
}

export function trackSuggestionGenerated(props: {
  filter_preset_used: boolean
  result_count: number
  personalization_level: 'discovery' | 'early' | 'mature'
}) {
  posthog.capture('suggestion_generated', props)
}

export function trackFilterPresetSaved(filter_count: number) {
  posthog.capture('filter_preset_saved', { filter_count })
}

export function trackWishAdded(priority: 'low' | 'medium' | 'high') {
  posthog.capture('wish_added', { priority })
}

export function trackReserveNowTapped(has_reservation_url: boolean) {
  posthog.capture('reserve_now_tapped', { has_reservation_url })
}

export function trackPageView(path: string) {
  posthog.capture('$pageview', { $current_url: path })
}
