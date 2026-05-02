'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useSuggestionsStore } from '@/stores/suggestionsStore'
import { useRouter } from 'next/navigation'
import { MemoryCard } from '@/components/memory/MemoryCard'
import { WishCard } from '@/components/wishes/WishCard'
import { AdBanner } from '@/components/ads/AdBanner'
import type { Memory, Wish, FilterPreset } from '@/lib/types/domain'

const DEFAULT_HERO = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85'

export default function HomePage() {
  const { profile } = useAuthStore()
  const { setFilters, setActivePreset } = useSuggestionsStore()
  const router = useRouter()

  const { data: heroMemory } = useQuery<Memory | null>({
    queryKey: ['home', 'hero'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('memories')
        .select('id, photo_urls, overall_rating, restaurant:restaurants(name)')
        .gte('overall_rating', 8)
        .not('photo_urls', 'eq', '{}')
        .order('visit_date', { ascending: false })
        .limit(1)
        .single()
      return (data as unknown as Memory) ?? null
    },
  })

  const { data: recentMemories = [] } = useQuery<Memory[]>({
    queryKey: ['home', 'recent-memories'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('memories')
        .select(`
          id, visit_date, overall_rating, tiers, photo_urls, narrative_note,
          restaurant:restaurants(id, name, city, cuisine_tags, price_level, photos)
        `)
        .order('visit_date', { ascending: false })
        .limit(3)
      return (data ?? []) as Memory[]
    },
  })

  const { data: nearbyWishes = [] } = useQuery<Wish[]>({
    queryKey: ['home', 'nearby-wishes'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('wishes')
        .select(`
          id, priority, notes, target_occasion, target_date,
          restaurant:restaurants(id, name, city, cuisine_tags, photos)
        `)
        .order('priority', { ascending: false })
        .limit(3)
      return (data ?? []) as Wish[]
    },
  })

  const { data: presets = [] } = useQuery<FilterPreset[]>({
    queryKey: ['filter-presets'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('filter_presets')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(4)
      return (data ?? []) as unknown as FilterPreset[]
    },
  })

  const heroPhoto = heroMemory?.photo_urls?.[0] ?? DEFAULT_HERO
  const heroRestaurant = heroMemory?.restaurant as { name: string } | undefined

  function applyPreset(preset: FilterPreset) {
    setFilters(preset.filters as Parameters<typeof setFilters>[0])
    setActivePreset(preset.id)
    router.push('/discover')
  }

  return (
    <div className="pb-6">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative h-[80vw] max-h-[420px] min-h-72 bg-charcoal-900">
        <img
          src={heroPhoto}
          alt={heroRestaurant ? `Photo from ${heroRestaurant.name}` : 'Culinary scene'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 photo-overlay" />

        {/* Greeting */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="text-[10px] text-white/50 font-semibold uppercase tracking-[0.2em] mb-2">
              {profile?.display_name ? `Welcome back, ${profile.display_name}` : 'Welcome back'}
            </p>
            <h1 className="font-serif text-4xl text-white font-semibold leading-tight">
              Where should you<br />bite next?
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-7">

        {/* ── Discover CTA ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-3xl bg-charcoal-900 dark:bg-charcoal-800 p-5 shadow-luxury"
        >
          <p className="text-[10px] text-gold-400 font-semibold uppercase tracking-widest mb-1">
            NextBite
          </p>
          <p className="font-serif text-lg text-cream-50 mb-4 leading-snug">
            Personalised dining, curated for your taste
          </p>

          {presets.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="rounded-full bg-white/10 text-cream-100/80 text-xs px-3 py-1.5 hover:bg-gold-400 hover:text-charcoal-950 transition font-medium"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}

          <Link
            href="/discover"
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gold-400 text-charcoal-950 py-3.5 text-sm font-semibold hover:bg-gold-300 active:scale-[0.98] transition shadow-gold"
          >
            <span>✦</span>
            <span>Where Should I Bite Next?</span>
          </Link>
        </motion.div>

        {/* ── Ad banner ────────────────────────────────────────── */}
        <AdBanner city={profile?.home_city} />

        {/* ── Recent memories ──────────────────────────────────── */}
        {recentMemories.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            aria-labelledby="recent-heading"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id="recent-heading" className="text-xs font-semibold text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-widest">
                Recent memories
              </h2>
              <Link href="/memories" className="text-xs text-gold-500 hover:text-gold-400 font-medium transition">
                See all →
              </Link>
            </div>
            <ul className="space-y-4">
              {recentMemories.map((memory) => (
                <li key={memory.id}>
                  <MemoryCard memory={memory} variant="large" />
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ── Wishes ───────────────────────────────────────────── */}
        {nearbyWishes.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            aria-labelledby="wishes-heading"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id="wishes-heading" className="text-xs font-semibold text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-widest">
                On your list
              </h2>
              <Link href="/wishes" className="text-xs text-gold-500 hover:text-gold-400 font-medium transition">
                See all →
              </Link>
            </div>
            <ul className="space-y-3">
              {nearbyWishes.map((wish) => (
                <li key={wish.id}>
                  <WishCard wish={wish} />
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* ── Empty state ───────────────────────────────────────── */}
        {recentMemories.length === 0 && nearbyWishes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-center py-10"
          >
            <div className="text-5xl mb-4" aria-hidden="true">🍽</div>
            <h2 className="font-serif text-xl text-charcoal-900 dark:text-cream-50 mb-2">
              Your dining story begins here
            </h2>
            <p className="text-sm text-charcoal-800/50 dark:text-cream-100/40 max-w-xs mx-auto mb-6">
              Log your first memory or add a restaurant to your wish list to get started.
            </p>
            <Link
              href="/memories/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
            >
              Log your first memory
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
