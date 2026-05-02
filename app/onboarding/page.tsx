'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { PRESET_CUISINES, PRESET_TIERS } from '@/lib/types/domain'
import Link from 'next/link'

type Step = 0 | 1 | 2

export default function OnboardingPage() {
  const router = useRouter()
  const { user, setProfile } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)

  const [step, setStep] = useState<Step>(0)
  const [saving, setSaving] = useState(false)
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [selectedTiers, setSelectedTiers] = useState<string[]>([])

  async function completeOnboarding() {
    if (!user) return
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('users')
      .update({
        favorite_cuisines: selectedCuisines,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      addToast({ type: 'error', message: 'Could not save preferences.' })
      return
    }

    setProfile({
      display_name: null,
      home_city: null,
      favorite_cuisines: selectedCuisines,
      dietary_preferences: [],
      common_occasions: [],
      onboarding_completed: true,
    })

    router.push('/')
  }

  function skip() {
    if (step < 2) {
      setStep((s) => (s + 1) as Step)
    } else {
      completeOnboarding()
    }
  }

  const STEPS = [
    {
      title: 'Log your first memory',
      subtitle: 'Start by capturing a recent dining experience.',
      cta: 'Log a memory',
      ctaHref: '/memories/new',
    },
    {
      title: 'What do you love to eat?',
      subtitle: 'Select your favorite cuisines to personalise your suggestions.',
    },
    {
      title: 'Your first suggestions are ready',
      subtitle: 'Head to Discover to see restaurants tailored to your taste.',
      cta: 'See suggestions',
      ctaHref: '/discover',
    },
  ]

  const current = STEPS[step]

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-charcoal-950 flex flex-col px-4 pt-12 pb-8">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-10" aria-label="Onboarding progress">
        {STEPS.map((_, i) => (
          <div
            key={i}
            aria-current={i === step ? 'step' : undefined}
            className={`w-2 h-2 rounded-full transition-all ${
              i === step
                ? 'bg-gold-400 w-6'
                : i < step
                ? 'bg-charcoal-900 dark:bg-cream-100'
                : 'bg-cream-200 dark:bg-charcoal-800'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <h1 className="font-serif text-3xl text-charcoal-900 dark:text-cream-50 mb-3 leading-tight">
          {current.title}
        </h1>
        <p className="text-sm text-charcoal-800/60 dark:text-cream-100/50 mb-8">
          {current.subtitle}
        </p>

        {/* Step 1: Cuisine picker */}
        {step === 1 && (
          <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Select favorite cuisines">
            {(PRESET_CUISINES as unknown as string[]).map((cuisine) => (
              <button
                key={cuisine}
                type="button"
                aria-pressed={selectedCuisines.includes(cuisine)}
                onClick={() =>
                  setSelectedCuisines((prev) =>
                    prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
                  )
                }
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCuisines.includes(cuisine)
                    ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950'
                    : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50 hover:bg-cream-200'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {current.ctaHref ? (
          <Link
            href={current.ctaHref}
            onClick={() => step < 2 && setStep((s) => (s + 1) as Step)}
            className="block w-full rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-3 text-sm font-medium text-center hover:opacity-90 transition"
          >
            {current.cta}
          </Link>
        ) : (
          <button
            onClick={() => {
              if (step === 1) {
                setStep(2)
              }
            }}
            disabled={saving}
            className="w-full rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        )}

        <button
          onClick={step === 2 ? completeOnboarding : skip}
          disabled={saving}
          className="w-full py-2.5 text-sm text-charcoal-800/50 dark:text-cream-100/40 hover:text-charcoal-900 dark:hover:text-cream-50 transition"
        >
          {step === 2 ? 'Go to home' : 'Skip for now'}
        </button>
      </div>
    </div>
  )
}
