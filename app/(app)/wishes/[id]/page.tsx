'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUpdateWish, useRemoveWish } from '@/lib/query/hooks/useWishes'
import { useUIStore } from '@/stores/uiStore'
import { OCCASIONS } from '@/lib/types/domain'
import type { Wish } from '@/lib/types/domain'

export default function WishDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const addToast = useUIStore((s) => s.addToast)
  const updateWish = useUpdateWish()
  const removeWish = useRemoveWish()
  const [editing, setEditing] = useState(false)

  const { data: wish, isLoading } = useQuery<Wish>({
    queryKey: ['wish', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('wishes')
        .select(`*, restaurant:restaurants(*)`)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Wish
    },
    enabled: !!id,
  })

  const [form, setForm] = useState<{
    priority: 'low' | 'medium' | 'high'
    notes: string
    target_occasion: string
    target_date: string
  }>({ priority: 'medium', notes: '', target_occasion: '', target_date: '' })

  function startEdit() {
    if (!wish) return
    setForm({
      priority: wish.priority,
      notes: wish.notes ?? '',
      target_occasion: wish.target_occasion ?? '',
      target_date: wish.target_date ?? '',
    })
    setEditing(true)
  }

  function handleSave() {
    updateWish.mutate(
      {
        id,
        updates: {
          priority: form.priority,
          notes: form.notes || null,
          target_occasion: form.target_occasion || null,
          target_date: form.target_date || null,
        },
      },
      {
        onSuccess: () => {
          setEditing(false)
          addToast({ type: 'success', message: 'Wish updated.' })
        },
      }
    )
  }

  function handleRemove() {
    if (!confirm('Remove this wish?')) return
    removeWish.mutate(id, {
      onSuccess: () => router.push('/wishes'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    )
  }

  if (!wish) {
    return (
      <div className="px-4 pt-8 text-center">
        <p className="text-charcoal-800/60 dark:text-cream-100/50">Wish not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-gold-500 hover:underline">Go back</button>
      </div>
    )
  }

  const restaurant = wish.restaurant as { id: string; name: string; city?: string; cuisine_tags?: string[]; photos?: { url: string }[]; google_rating?: number } | undefined
  const photo = restaurant?.photos?.[0]?.url

  return (
    <div className="pb-8">
      {/* Hero */}
      <div className="relative h-48 bg-cream-200 dark:bg-charcoal-800">
        {photo ? (
          <img src={photo} alt={restaurant?.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl" aria-hidden="true">♡</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/60 to-transparent" />
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
        >
          ←
        </button>
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="font-serif text-2xl text-charcoal-900 dark:text-cream-50">{restaurant?.name}</h1>
            {restaurant?.city && (
              <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 mt-0.5">
                {restaurant.city}
                {restaurant.cuisine_tags?.[0] ? ` · ${restaurant.cuisine_tags[0]}` : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={startEdit}
              className="text-xs font-medium text-gold-500 hover:underline"
            >
              Edit
            </button>
            <button
              onClick={handleRemove}
              className="text-xs font-medium text-burgundy-600 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>

        {editing ? (
          /* Edit form */
          <div className="space-y-4 rounded-2xl border border-cream-200 dark:border-charcoal-800 p-4 bg-cream-50 dark:bg-charcoal-900">
            <div>
              <label className="block text-xs font-medium text-charcoal-800/60 dark:text-cream-100/50 mb-2">Priority</label>
              <div className="flex gap-2" role="group" aria-label="Priority">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={form.priority === p}
                    onClick={() => setForm((f) => ({ ...f, priority: p }))}
                    className={`flex-1 rounded-xl py-2 text-xs font-medium capitalize transition ${
                      form.priority === p
                        ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950'
                        : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="wish-notes" className="block text-xs font-medium text-charcoal-800/60 dark:text-cream-100/50 mb-1.5">Notes</label>
              <textarea
                id="wish-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Why do you want to try this place?"
                className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-3 py-2 text-sm text-charcoal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-gold-400 transition resize-none"
              />
            </div>

            <div>
              <label htmlFor="wish-occasion" className="block text-xs font-medium text-charcoal-800/60 dark:text-cream-100/50 mb-1.5">Target occasion</label>
              <select
                id="wish-occasion"
                value={form.target_occasion}
                onChange={(e) => setForm((f) => ({ ...f, target_occasion: e.target.value }))}
                className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-3 py-2 text-sm text-charcoal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
              >
                <option value="">No occasion</option>
                {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="wish-date" className="block text-xs font-medium text-charcoal-800/60 dark:text-cream-100/50 mb-1.5">Target date</label>
              <input
                id="wish-date"
                type="date"
                value={form.target_date}
                onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-3 py-2 text-sm text-charcoal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 rounded-xl border border-cream-200 dark:border-charcoal-800 py-2.5 text-sm font-medium text-charcoal-900 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateWish.isPending}
                className="flex-1 rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {updateWish.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          /* Read view */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`rounded-full text-xs font-semibold px-3 py-1 capitalize ${
                wish.priority === 'high' ? 'bg-burgundy-600 text-cream-50' :
                wish.priority === 'medium' ? 'bg-gold-400 text-charcoal-950' :
                'bg-cream-200 dark:bg-charcoal-800 text-charcoal-800 dark:text-cream-100'
              }`}>
                {wish.priority} priority
              </span>
              {wish.target_occasion && (
                <span className="text-sm text-charcoal-800/60 dark:text-cream-100/50">{wish.target_occasion}</span>
              )}
            </div>

            {wish.target_date && (
              <p className="text-sm text-charcoal-800/60 dark:text-cream-100/50">
                🗓 Target: {new Date(wish.target_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}

            {wish.notes && (
              <p className="text-sm text-charcoal-900 dark:text-cream-50 leading-relaxed">{wish.notes}</p>
            )}

            {restaurant && (
              <a
                href={`/restaurants/${restaurant.id}`}
                className="block mt-4 text-sm text-gold-500 hover:underline"
              >
                View {restaurant.name} →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
