'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MemorySchema, type MemoryInput } from '@/lib/validation/schemas'
import { RestaurantSearch } from '@/components/restaurant/RestaurantSearch'
import { upsertRestaurant } from '@/lib/restaurants/upsert'
import { useCreateMemory } from '@/lib/query/hooks/useMemories'
import { useUIStore } from '@/stores/uiStore'
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay'
import { PRESET_TIERS, PRESET_CUISINES, PRESET_VIBES, OCCASIONS } from '@/lib/types/domain'
import type { RestaurantSearchResult } from '@/lib/types/domain'

const STEPS = ['Restaurant', 'Ratings', 'Tags', 'Story'] as const
type Step = 0 | 1 | 2 | 3

const SESSION_KEY = 'nextbite-memory-draft'

export function MemoryForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledRestaurantId = searchParams.get('restaurant_id')
  const addToast = useUIStore((s) => s.addToast)
  const createMemory = useCreateMemory()

  const [step, setStep] = useState<Step>(0)
  const [selectedRestaurant, setSelectedRestaurant] = useState<{ id: string; name: string } | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [dishes, setDishes] = useState<{ name: string; notes: string; photo_url: string }[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MemoryInput>({
    resolver: zodResolver(MemorySchema),
    defaultValues: {
      restaurant_id: prefilledRestaurantId ?? '',
      visit_date: new Date().toISOString().split('T')[0],
      tiers: [],
      cuisine_tags: [],
      vibe_tags: [],
      occasions: [],
      dishes: [],
      photo_urls: [],
    },
  })

  // Restore draft from sessionStorage
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(SESSION_KEY)
      if (draft) {
        const parsed = JSON.parse(draft)
        Object.entries(parsed).forEach(([key, value]) => {
          setValue(key as keyof MemoryInput, value as never)
        })
        if (parsed.step !== undefined) setStep(parsed.step)
      }
    } catch {}
  }, [setValue])

  // Persist draft to sessionStorage on every change
  const formValues = watch()
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...formValues, step }))
    } catch {}
  }, [formValues, step])

  async function handleRestaurantSelect(result: RestaurantSearchResult) {
    const restaurant = await upsertRestaurant(result)
    if (restaurant) {
      setSelectedRestaurant(restaurant)
      setValue('restaurant_id', restaurant.id)
    }
  }

  async function onSubmit(data: MemoryInput) {
    const payload = { ...data, dishes }
    createMemory.mutate(payload as never, {
      onSuccess: () => {
        sessionStorage.removeItem(SESSION_KEY)
        if (data.overall_rating >= 8) {
          setShowCelebration(true)
        } else {
          addToast({ type: 'success', message: 'Memory saved!' })
          router.push('/memories')
        }
      },
    })
  }

  function nextStep() {
    if (step < 3) setStep((s) => (s + 1) as Step)
  }

  function prevStep() {
    if (step > 0) setStep((s) => (s - 1) as Step)
  }

  return (
    <>
      {showCelebration && (
        <CelebrationOverlay
          onDismiss={() => {
            setShowCelebration(false)
            router.push('/memories')
          }}
        />
      )}

      <div className="px-4 pb-8">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6" aria-label="Form progress">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                aria-current={i === step ? 'step' : undefined}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition ${
                  i < step
                    ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950'
                    : i === step
                    ? 'bg-gold-400 text-charcoal-950'
                    : 'bg-cream-200 dark:bg-charcoal-800 text-charcoal-800/50'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-charcoal-900 dark:text-cream-50 font-medium' : 'text-charcoal-800/40'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? 'bg-charcoal-900 dark:bg-gold-400' : 'bg-cream-200 dark:bg-charcoal-800'}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Step 0: Restaurant + Date */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="font-serif text-xl text-charcoal-900 dark:text-cream-50">Where did you dine?</h2>

              <div>
                <label className="block text-sm font-medium text-charcoal-900 dark:text-cream-100 mb-1.5">
                  Restaurant <span aria-hidden="true" className="text-burgundy-600">*</span>
                </label>
                {selectedRestaurant ? (
                  <div className="flex items-center justify-between rounded-xl border border-gold-400 bg-cream-50 dark:bg-charcoal-900 px-4 py-3">
                    <span className="text-sm font-medium text-charcoal-900 dark:text-cream-50">
                      {selectedRestaurant.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setSelectedRestaurant(null); setValue('restaurant_id', '') }}
                      className="text-xs text-charcoal-800/50 hover:text-burgundy-600 transition"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <RestaurantSearch onSelect={handleRestaurantSelect} />
                )}
                {errors.restaurant_id && (
                  <p role="alert" className="mt-1.5 text-xs text-burgundy-600">
                    Please select a restaurant
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="visit_date" className="block text-sm font-medium text-charcoal-900 dark:text-cream-100 mb-1.5">
                  Visit date <span aria-hidden="true" className="text-burgundy-600">*</span>
                </label>
                <input
                  id="visit_date"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...register('visit_date')}
                  className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 py-3 text-charcoal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
                />
              </div>
            </div>
          )}

          {/* Step 1: Ratings */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl text-charcoal-900 dark:text-cream-50">How was it?</h2>

              <Controller
                name="overall_rating"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-charcoal-900 dark:text-cream-100 mb-3">
                      Overall rating <span aria-hidden="true" className="text-burgundy-600">*</span>
                    </label>
                    <div className="flex gap-2 flex-wrap" role="group" aria-label="Overall rating 1 to 10">
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-pressed={field.value === n}
                          onClick={() => field.onChange(n)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition ${
                            field.value === n
                              ? 'bg-gold-400 text-charcoal-950'
                              : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50 hover:bg-cream-200'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    {errors.overall_rating && (
                      <p role="alert" className="mt-1.5 text-xs text-burgundy-600">Please rate your experience</p>
                    )}
                  </div>
                )}
              />

              {/* Sub-ratings */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-charcoal-900 dark:text-cream-100 flex items-center gap-2">
                  <span>Sub-ratings</span>
                  <span className="text-charcoal-800/40 text-xs">(optional)</span>
                  <span className="ml-auto text-charcoal-800/40 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="mt-4 space-y-4">
                  {(['food_rating', 'service_rating', 'ambiance_rating', 'value_rating', 'vibe_rating'] as const).map((field) => (
                    <Controller
                      key={field}
                      name={field}
                      control={control}
                      render={({ field: f }) => (
                        <div>
                          <label className="block text-xs font-medium text-charcoal-800/70 dark:text-cream-100/60 mb-2 capitalize">
                            {field.replace('_rating', '')}
                          </label>
                          <div className="flex gap-1.5 flex-wrap" role="group" aria-label={`${field.replace('_rating', '')} rating`}>
                            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                              <button
                                key={n}
                                type="button"
                                aria-pressed={f.value === n}
                                onClick={() => f.onChange(f.value === n ? null : n)}
                                className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                                  f.value === n
                                    ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950'
                                    : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50 hover:bg-cream-200'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    />
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Step 2: Tags + Context */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl text-charcoal-900 dark:text-cream-50">Tell us more</h2>

              <TagSelector
                label="Tiers"
                options={PRESET_TIERS as unknown as string[]}
                name="tiers"
                control={control}
              />
              <TagSelector
                label="Cuisine"
                options={PRESET_CUISINES as unknown as string[]}
                name="cuisine_tags"
                control={control}
              />
              <TagSelector
                label="Vibe"
                options={PRESET_VIBES as unknown as string[]}
                name="vibe_tags"
                control={control}
              />
              <TagSelector
                label="Occasion"
                options={OCCASIONS as unknown as string[]}
                name="occasions"
                control={control}
              />

              <div>
                <label htmlFor="approximate_cost" className="block text-sm font-medium text-charcoal-900 dark:text-cream-100 mb-1.5">
                  Approximate cost (USD)
                </label>
                <input
                  id="approximate_cost"
                  type="number"
                  min={0}
                  placeholder="e.g. 85"
                  {...register('approximate_cost', { valueAsNumber: true })}
                  className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 py-3 text-charcoal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
                />
              </div>
            </div>
          )}

          {/* Step 3: Story */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-serif text-xl text-charcoal-900 dark:text-cream-50">Your story</h2>

              <div>
                <label htmlFor="narrative_note" className="block text-sm font-medium text-charcoal-900 dark:text-cream-100 mb-1.5">
                  Narrative note
                </label>
                <Controller
                  name="narrative_note"
                  control={control}
                  render={({ field }) => (
                    <>
                      <textarea
                        id="narrative_note"
                        rows={5}
                        maxLength={2000}
                        placeholder="Describe the experience — the atmosphere, standout dishes, how it made you feel…"
                        {...field}
                        value={field.value ?? ''}
                        className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 py-3 text-charcoal-900 dark:text-cream-50 placeholder-charcoal-800/40 focus:outline-none focus:ring-2 focus:ring-gold-400 transition resize-none font-serif"
                      />
                      <p className="mt-1 text-xs text-charcoal-800/40 text-right">
                        {(field.value ?? '').length}/2000
                      </p>
                    </>
                  )}
                />
              </div>

              <div>
                <label htmlFor="mood" className="block text-sm font-medium text-charcoal-900 dark:text-cream-100 mb-1.5">
                  Mood / reflection
                </label>
                <input
                  id="mood"
                  type="text"
                  placeholder="How did you feel? e.g. Celebratory, nostalgic, perfectly content…"
                  {...register('mood')}
                  className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 py-3 text-charcoal-900 dark:text-cream-50 placeholder-charcoal-800/40 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
                />
              </div>

              {/* Dishes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-charcoal-900 dark:text-cream-100">Dishes</label>
                  <button
                    type="button"
                    onClick={() => setDishes([...dishes, { name: '', notes: '', photo_url: '' }])}
                    className="text-xs text-gold-500 hover:underline"
                  >
                    + Add dish
                  </button>
                </div>
                {dishes.map((dish, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Dish name"
                      value={dish.name}
                      onChange={(e) => {
                        const updated = [...dishes]
                        updated[i] = { ...updated[i], name: e.target.value }
                        setDishes(updated)
                      }}
                      className="flex-1 rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-3 py-2 text-sm text-charcoal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setDishes(dishes.filter((_, j) => j !== i))}
                      aria-label="Remove dish"
                      className="text-charcoal-800/40 hover:text-burgundy-600 transition px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 rounded-xl border border-cream-200 dark:border-charcoal-800 text-charcoal-900 dark:text-cream-50 py-3 text-sm font-medium hover:bg-cream-100 dark:hover:bg-charcoal-800 transition"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={step === 0 && !selectedRestaurant && !prefilledRestaurantId}
                className="flex-1 rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-3 text-sm font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={createMemory.isPending}
                className="flex-1 rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-3 text-sm font-medium hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
              >
                {createMemory.isPending ? 'Saving…' : 'Save Memory'}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  )
}

// ─── Tag selector sub-component ──────────────────────────────────

function TagSelector({
  label,
  options,
  name,
  control,
}: {
  label: string
  options: string[]
  name: 'tiers' | 'cuisine_tags' | 'vibe_tags' | 'occasions'
  control: ReturnType<typeof useForm<MemoryInput>>['control']
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <label className="block text-sm font-medium text-charcoal-900 dark:text-cream-100 mb-2">
            {label}
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label={`Select ${label}`}>
            {options.map((option) => {
              const selected = (field.value as string[]).includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    const current = field.value as string[]
                    field.onChange(
                      selected ? current.filter((v) => v !== option) : [...current, option]
                    )
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    selected
                      ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950'
                      : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50 hover:bg-cream-200 dark:hover:bg-charcoal-700'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
      )}
    />
  )
}
