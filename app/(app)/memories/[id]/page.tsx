'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useDeleteMemory } from '@/lib/query/hooks/useMemories'
import { priceLevelLabel } from '@/lib/types/domain'
import type { Memory } from '@/lib/types/domain'

export default function MemoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const deleteMemory = useDeleteMemory()

  const { data: memory, isLoading } = useQuery<Memory>({
    queryKey: ['memory', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('memories')
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as unknown as Memory
    },
    enabled: !!id,
  })

  async function handleDelete() {
    if (!confirm('Delete this memory? This cannot be undone.')) return
    deleteMemory.mutate(id, {
      onSuccess: () => router.push('/memories'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    )
  }

  if (!memory) {
    return (
      <div className="px-4 pt-8 text-center">
        <p className="text-charcoal-800/60 dark:text-cream-100/50">Memory not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-gold-500 hover:underline">
          Go back
        </button>
      </div>
    )
  }

  const restaurant = memory.restaurant as { name: string; city?: string; price_level?: number } | undefined
  const visitDate = new Date(memory.visit_date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const dishes = memory.dishes as { name: string; notes?: string }[]

  return (
    <div className="pb-8">
      {/* Hero photo */}
      {memory.photo_urls?.[0] && (
        <div className="relative h-52 bg-cream-200 dark:bg-charcoal-800">
          <img
            src={memory.photo_urls[0]}
            alt={`Photo from ${restaurant?.name}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/60 to-transparent" />
        </div>
      )}

      <div className="px-4 pt-5">
        {/* Back + actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="text-sm text-charcoal-800/60 dark:text-cream-100/50 hover:text-charcoal-900 dark:hover:text-cream-50 transition"
          >
            ← Back
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMemory.isPending}
            className="text-xs text-burgundy-600 hover:underline disabled:opacity-50"
          >
            {deleteMemory.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>

        {/* Restaurant + date */}
        <h1 className="font-serif text-2xl text-charcoal-900 dark:text-cream-50 leading-tight">
          {restaurant?.name ?? 'Unknown restaurant'}
        </h1>
        <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 mt-1">
          {visitDate}
          {restaurant?.city ? ` · ${restaurant.city}` : ''}
          {memory.visit_number > 1 && (
            <span className="ml-2 text-gold-500">Visit #{memory.visit_number}</span>
          )}
        </p>

        {/* Overall rating */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-3xl font-serif font-semibold text-charcoal-900 dark:text-cream-50">
              {memory.overall_rating}
            </span>
            <span className="text-charcoal-800/40 dark:text-cream-100/30 text-sm">/10</span>
          </div>
          {memory.tiers[0] && (
            <span className="rounded-full bg-cream-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-cream-100 text-xs font-medium px-3 py-1">
              {memory.tiers[0]}
            </span>
          )}
        </div>

        {/* Sub-ratings */}
        {(memory.food_rating || memory.service_rating || memory.ambiance_rating || memory.value_rating || memory.vibe_rating) && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {([
              ['Food', memory.food_rating],
              ['Service', memory.service_rating],
              ['Ambiance', memory.ambiance_rating],
              ['Value', memory.value_rating],
              ['Vibe', memory.vibe_rating],
            ] as [string, number | null][]).filter(([, v]) => v !== null).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-cream-50 dark:bg-charcoal-900 border border-cream-200 dark:border-charcoal-800 p-3 text-center">
                <p className="text-xs text-charcoal-800/50 dark:text-cream-100/40">{label}</p>
                <p className="text-lg font-semibold text-charcoal-900 dark:text-cream-50 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {(memory.cuisine_tags.length > 0 || memory.vibe_tags.length > 0 || memory.occasions.length > 0) && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {[...memory.cuisine_tags, ...memory.vibe_tags, ...memory.occasions].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-cream-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-cream-100 text-xs px-2.5 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Cost */}
        {memory.approximate_cost && (
          <p className="mt-4 text-sm text-charcoal-800/60 dark:text-cream-100/50">
            Approximate cost: <span className="font-medium text-charcoal-900 dark:text-cream-50">${memory.approximate_cost}</span>
          </p>
        )}

        {/* Narrative note */}
        {memory.narrative_note && (
          <div className="mt-5">
            <h2 className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-2">
              Notes
            </h2>
            <p className="font-serif text-sm text-charcoal-900 dark:text-cream-50 leading-relaxed whitespace-pre-wrap">
              {memory.narrative_note}
            </p>
          </div>
        )}

        {/* Mood */}
        {memory.mood && (
          <p className="mt-4 text-sm italic text-charcoal-800/60 dark:text-cream-100/50">
            &ldquo;{memory.mood}&rdquo;
          </p>
        )}

        {/* Dishes */}
        {dishes.length > 0 && (
          <div className="mt-5">
            <h2 className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-2">
              Dishes
            </h2>
            <ul className="space-y-1.5">
              {dishes.map((dish, i) => (
                <li key={i} className="text-sm text-charcoal-900 dark:text-cream-50">
                  <span className="font-medium">{dish.name}</span>
                  {dish.notes && (
                    <span className="text-charcoal-800/50 dark:text-cream-100/40"> — {dish.notes}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Photo gallery */}
        {memory.photo_urls.length > 1 && (
          <div className="mt-5">
            <h2 className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-2">
              Photos
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {memory.photo_urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Photo ${i + 1} from ${restaurant?.name}`}
                  className="w-full aspect-square object-cover rounded-xl"
                />
              ))}
            </div>
          </div>
        )}

        {/* Restaurant link */}
        <div className="mt-6 pt-4 border-t border-cream-200 dark:border-charcoal-800">
          <a
            href={`/restaurants/${memory.restaurant_id}`}
            className="text-sm text-gold-500 hover:underline"
          >
            View {restaurant?.name} →
          </a>
        </div>
      </div>
    </div>
  )
}
