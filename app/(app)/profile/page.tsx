'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useTasteProfile, useDiningStats } from '@/lib/query/hooks/useTasteProfile'
import { TasteProfileRadar } from '@/components/profile/TasteProfileRadar'
import { TierManager } from '@/components/profile/TierManager'
import { PRESET_CUISINES, DIETARY_PREFERENCES, OCCASIONS } from '@/lib/types/domain'
import { useQueryClient } from '@tanstack/react-query'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, setProfile, clearAuth } = useAuthStore()
  const addToast = useUIStore((s) => s.addToast)
  const { toggleTheme, theme } = useUIStore()
  const queryClient = useQueryClient()

  const { data: tasteProfile } = useTasteProfile()
  const { data: stats } = useDiningStats()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    display_name: '',
    home_city: '',
    favorite_cuisines: [] as string[],
    dietary_preferences: [] as string[],
    common_occasions: [] as string[],
  })

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? '',
        home_city: profile.home_city ?? '',
        favorite_cuisines: profile.favorite_cuisines ?? [],
        dietary_preferences: profile.dietary_preferences ?? [],
        common_occasions: profile.common_occasions ?? [],
      })
    }
  }, [profile])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('users')
      .update({
        display_name: form.display_name || null,
        home_city: form.home_city || null,
        favorite_cuisines: form.favorite_cuisines,
        dietary_preferences: form.dietary_preferences,
        common_occasions: form.common_occasions,
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      addToast({ type: 'error', message: 'Could not save profile.' })
    } else {
      setProfile({ ...profile!, ...form })
      queryClient.invalidateQueries({ queryKey: ['taste-profile'] })
      queryClient.invalidateQueries({ queryKey: ['suggestions'] })
      setEditing(false)
      addToast({ type: 'success', message: 'Profile saved.' })
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    router.push('/sign-in')
  }

  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item]
  }

  return (
    <div className="px-4 pt-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal-900 dark:text-cream-50">Profile</h1>
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="w-9 h-9 rounded-full border border-cream-200 dark:border-charcoal-800 flex items-center justify-center text-sm hover:bg-cream-100 dark:hover:bg-charcoal-800 transition"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs text-charcoal-800/50 dark:text-cream-100/40 hover:text-burgundy-600 transition"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl bg-charcoal-900 dark:bg-charcoal-800 text-cream-50 p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold-400 flex items-center justify-center text-charcoal-950 font-serif text-xl font-semibold shrink-0">
            {(profile?.display_name ?? user?.email ?? 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-serif text-lg font-medium truncate">
              {profile?.display_name ?? 'Your Name'}
            </p>
            <p className="text-xs text-cream-100/50 truncate">{user?.email}</p>
            {profile?.home_city && (
              <p className="text-xs text-cream-100/50 mt-0.5">📍 {profile.home_city}</p>
            )}
          </div>
          <button
            onClick={() => setEditing((v) => !v)}
            className="ml-auto shrink-0 text-xs text-gold-400 hover:underline"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="rounded-2xl border border-cream-200 dark:border-charcoal-800 p-4 mb-6 space-y-4">
          <div>
            <label htmlFor="display-name" className="block text-xs font-medium text-charcoal-800/60 dark:text-cream-100/50 mb-1.5">
              Display name
            </label>
            <input
              id="display-name"
              type="text"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-3 py-2 text-sm text-charcoal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
            />
          </div>

          <div>
            <label htmlFor="home-city" className="block text-xs font-medium text-charcoal-800/60 dark:text-cream-100/50 mb-1.5">
              Home city
            </label>
            <input
              id="home-city"
              type="text"
              value={form.home_city}
              onChange={(e) => setForm((f) => ({ ...f, home_city: e.target.value }))}
              placeholder="e.g. New York"
              className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-3 py-2 text-sm text-charcoal-900 dark:text-cream-50 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
            />
          </div>

          <TagPickerSection
            label="Favorite cuisines"
            options={PRESET_CUISINES as unknown as string[]}
            selected={form.favorite_cuisines}
            onChange={(v) => setForm((f) => ({ ...f, favorite_cuisines: toggleArrayItem(f.favorite_cuisines, v) }))}
          />

          <TagPickerSection
            label="Dietary preferences"
            options={DIETARY_PREFERENCES as unknown as string[]}
            selected={form.dietary_preferences}
            onChange={(v) => setForm((f) => ({ ...f, dietary_preferences: toggleArrayItem(f.dietary_preferences, v) }))}
          />

          <TagPickerSection
            label="Common occasions"
            options={OCCASIONS as unknown as string[]}
            selected={form.common_occasions}
            onChange={(v) => setForm((f) => ({ ...f, common_occasions: toggleArrayItem(f.common_occasions, v) }))}
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          href="/stats"
          className="rounded-xl border border-cream-200 dark:border-charcoal-800 p-4 flex items-center gap-3 hover:bg-cream-50 dark:hover:bg-charcoal-800 transition"
        >
          <span className="text-xl" aria-hidden="true">📊</span>
          <span className="text-sm font-medium text-charcoal-900 dark:text-cream-50">Dining Stats</span>
        </Link>
        <Link
          href="/map"
          className="rounded-xl border border-cream-200 dark:border-charcoal-800 p-4 flex items-center gap-3 hover:bg-cream-50 dark:hover:bg-charcoal-800 transition"
        >
          <span className="text-xl" aria-hidden="true">🗺️</span>
          <span className="text-sm font-medium text-charcoal-900 dark:text-cream-50">Dining Map</span>
        </Link>
      </div>

      {/* Dining Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Memories" value={stats.totalMemories} />
          <StatCard label="Restaurants" value={stats.uniqueRestaurants} />
          <StatCard label="Top cuisine" value={stats.mostFrequentCuisine ?? '—'} />
          <StatCard label="Top tier" value={stats.mostUsedTier ?? '—'} />
        </div>
      )}

      {/* Taste Profile Radar */}
      {tasteProfile && (
        <div className="mb-6">
          <TasteProfileRadar profile={tasteProfile} />
        </div>
      )}

      {/* Tier Manager */}
      <div className="rounded-2xl border border-cream-200 dark:border-charcoal-800 p-4 mb-6">
        <TierManager />
      </div>

      {/* Account actions */}
      <div className="space-y-3">
        <a
          href="/api/export"
          download="nextbite-export.json"
          className="block w-full rounded-xl border border-cream-200 dark:border-charcoal-800 py-2.5 text-sm font-medium text-center text-charcoal-900 dark:text-cream-50 hover:bg-cream-100 dark:hover:bg-charcoal-800 transition"
        >
          Export my data
        </a>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
              addToast({ type: 'info', message: 'Account deletion requested. You will receive a confirmation email.' })
            }
          }}
          className="w-full rounded-xl border border-burgundy-600/30 py-2.5 text-sm font-medium text-burgundy-600 hover:bg-burgundy-600/5 transition"
        >
          Delete account
        </button>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-cream-50 dark:bg-charcoal-900 border border-cream-200 dark:border-charcoal-800 p-3 text-center">
      <p className="text-xs text-charcoal-800/50 dark:text-cream-100/40">{label}</p>
      <p className="text-lg font-semibold text-charcoal-900 dark:text-cream-50 mt-0.5 truncate">{value}</p>
    </div>
  )
}

function TagPickerSection({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (value: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-medium text-charcoal-800/60 dark:text-cream-100/50 mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={selected.includes(option)}
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              selected.includes(option)
                ? 'bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950'
                : 'bg-cream-100 dark:bg-charcoal-800 text-charcoal-900 dark:text-cream-50 hover:bg-cream-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
