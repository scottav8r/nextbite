'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRestaurant } from '@/lib/query/hooks/useRestaurant'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/stores/uiStore'
import { priceLevelLabel } from '@/lib/types/domain'
import type { Memory } from '@/lib/types/domain'

type Tab = 'memories' | 'crowd' | 'professional'

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const addToast = useUIStore((s) => s.addToast)
  const [activeTab, setActiveTab] = useState<Tab>('memories')
  const [addingWish, setAddingWish] = useState(false)

  const { data: restaurant, isLoading, error } = useRestaurant(id)

  // My Memories for this restaurant
  const { data: myMemories = [] } = useQuery<Memory[]>({
    queryKey: ['memories', 'restaurant', id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('restaurant_id', id)
        .order('visit_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Memory[]
    },
    enabled: !!id,
  })

  async function handleAddToWishes() {
    setAddingWish(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    const { error } = await supabase.from('wishes').upsert({
      user_id: user.id,
      restaurant_id: id,
      priority: 'medium',
    }, { onConflict: 'user_id,restaurant_id' })

    setAddingWish(false)
    if (error) {
      addToast({ type: 'error', message: 'Could not add to Wishes.' })
    } else {
      addToast({ type: 'success', message: `${restaurant?.name} added to your Wishes!` })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="px-4 pt-8 text-center">
        <p className="text-charcoal-800/60 dark:text-cream-100/50">Restaurant not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-gold-500 hover:underline">
          Go back
        </button>
      </div>
    )
  }

  const heroPhoto = restaurant.photos?.[0]?.url

  return (
    <div className="pb-8">
      {/* Hero image */}
      <div className="relative h-56 bg-cream-200 dark:bg-charcoal-800">
        {heroPhoto ? (
          <img src={heroPhoto} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" aria-hidden="true">🍽</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"
        >
          ←
        </button>

        {/* Name overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="font-serif text-2xl text-white font-semibold leading-tight">
            {restaurant.name}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {restaurant.cuisine_tags[0] && (
              <span className="text-xs text-white/80">{restaurant.cuisine_tags[0]}</span>
            )}
            {restaurant.price_level && (
              <span className="text-xs text-gold-300 font-medium">
                {priceLevelLabel(restaurant.price_level)}
              </span>
            )}
            {restaurant.google_rating && (
              <span className="text-xs text-white/80">★ {restaurant.google_rating.toFixed(1)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-4 py-4 flex gap-3">
        <Link
          href={`/memories/new?restaurant_id=${id}`}
          className="flex-1 rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-2.5 text-sm font-medium text-center hover:opacity-90 active:scale-[0.98] transition"
        >
          Log Memory
        </Link>
        <button
          onClick={handleAddToWishes}
          disabled={addingWish}
          className="flex-1 rounded-xl border border-cream-200 dark:border-charcoal-800 text-charcoal-900 dark:text-cream-50 py-2.5 text-sm font-medium hover:bg-cream-100 dark:hover:bg-charcoal-800 active:scale-[0.98] transition disabled:opacity-50"
        >
          {addingWish ? 'Adding…' : '♡ Add to Wishes'}
        </button>
        {restaurant.reservation_url && (
          <a
            href={restaurant.reservation_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Reserve at ${restaurant.name}`}
            className="px-4 rounded-xl bg-burgundy-600 text-cream-50 py-2.5 text-sm font-medium hover:bg-burgundy-800 active:scale-[0.98] transition"
          >
            Reserve
          </a>
        )}
      </div>

      {/* Address & contact */}
      {restaurant.address && (
        <div className="px-4 pb-4 text-sm text-charcoal-800/70 dark:text-cream-100/50">
          <p>{restaurant.address}</p>
          {restaurant.phone && <p className="mt-0.5">{restaurant.phone}</p>}
          {restaurant.website_url && (
            <a
              href={restaurant.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-500 hover:underline mt-0.5 block"
            >
              Visit website
            </a>
          )}
        </div>
      )}

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Restaurant information tabs"
        className="flex border-b border-cream-200 dark:border-charcoal-800 px-4"
      >
        {([
          { id: 'memories', label: 'My Memories' },
          { id: 'crowd', label: 'Crowd Reviews' },
          { id: 'professional', label: 'Professional' },
        ] as { id: Tab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-medium border-b-2 transition ${
              activeTab === tab.id
                ? 'border-charcoal-900 dark:border-gold-400 text-charcoal-900 dark:text-gold-400'
                : 'border-transparent text-charcoal-800/50 dark:text-cream-100/40 hover:text-charcoal-900 dark:hover:text-cream-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="px-4 pt-4">
        {/* My Memories */}
        <div
          role="tabpanel"
          id="panel-memories"
          aria-labelledby="tab-memories"
          hidden={activeTab !== 'memories'}
        >
          {myMemories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-charcoal-800/50 dark:text-cream-100/40 text-sm">
                No memories logged here yet.
              </p>
              <Link
                href={`/memories/new?restaurant_id=${id}`}
                className="mt-3 inline-block text-sm text-gold-500 hover:underline"
              >
                Log your first memory
              </Link>
            </div>
          ) : (
            <ul className="space-y-3" aria-label="Your memories at this restaurant">
              {myMemories.map((memory) => (
                <li key={memory.id}>
                  <Link
                    href={`/memories/${memory.id}`}
                    className="block rounded-xl border border-cream-200 dark:border-charcoal-800 p-4 hover:bg-cream-50 dark:hover:bg-charcoal-800 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-charcoal-900 dark:text-cream-50">
                        {new Date(memory.visit_date).toLocaleDateString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                      <span className="text-sm font-semibold text-gold-500">
                        {memory.overall_rating}/10
                      </span>
                    </div>
                    {memory.tiers[0] && (
                      <span className="mt-1 inline-block text-xs bg-cream-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-cream-100 rounded-full px-2 py-0.5">
                        {memory.tiers[0]}
                      </span>
                    )}
                    {memory.narrative_note && (
                      <p className="mt-2 text-xs text-charcoal-800/60 dark:text-cream-100/50 line-clamp-2">
                        {memory.narrative_note}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Crowd Reviews */}
        <div
          role="tabpanel"
          id="panel-crowd"
          aria-labelledby="tab-crowd"
          hidden={activeTab !== 'crowd'}
        >
          <CrowdReviews restaurant={restaurant} />
        </div>

        {/* Professional Reviews */}
        <div
          role="tabpanel"
          id="panel-professional"
          aria-labelledby="tab-professional"
          hidden={activeTab !== 'professional'}
        >
          <ProfessionalReviews restaurant={restaurant} />
        </div>
      </div>
    </div>
  )
}

// ─── Crowd Reviews sub-component ─────────────────────────────────

function CrowdReviews({ restaurant }: { restaurant: { google_rating: number | null; yelp_rating: number | null; name: string } }) {
  const rating = restaurant.google_rating ?? restaurant.yelp_rating
  const source = restaurant.google_rating ? 'Google' : restaurant.yelp_rating ? 'Yelp' : null

  if (!rating) {
    return (
      <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 py-6 text-center">
        No crowd reviews available for this restaurant.
      </p>
    )
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl font-serif font-semibold text-charcoal-900 dark:text-cream-50">
          {rating.toFixed(1)}
        </span>
        <div>
          <div className="flex gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                aria-hidden="true"
                className={`text-lg ${star <= Math.round(rating) ? 'text-gold-400' : 'text-cream-200 dark:text-charcoal-800'}`}
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-xs text-charcoal-800/50 dark:text-cream-100/40 mt-0.5">
            {source} rating
          </p>
        </div>
      </div>
      <p className="text-xs text-charcoal-800/40 dark:text-cream-100/30">
        Full review data requires a live API connection.
      </p>
    </div>
  )
}

// ─── Professional Reviews sub-component ──────────────────────────

function ProfessionalReviews({ restaurant }: { restaurant: { name: string } }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40">
        No professional reviews are on file for {restaurant.name}.
      </p>
    </div>
  )
}
