'use client'

import { useState } from 'react'
import { useTiers, useCreateTier, useDeleteTier } from '@/lib/query/hooks/useTiers'
import { PRESET_TIERS } from '@/lib/types/domain'

const MAX_CUSTOM_TIERS = 20

export function TierManager() {
  const { data: customTiers = [], isLoading } = useTiers()
  const createTier = useCreateTier()
  const deleteTier = useDeleteTier()

  const [newTierName, setNewTierName] = useState('')
  const [validationError, setValidationError] = useState('')

  const customOnly = customTiers.filter((t) => !t.is_preset)
  const customCount = customOnly.length

  function validateName(name: string): string {
    const trimmed = name.trim()
    if (!trimmed) return 'Tier name cannot be empty.'
    if (trimmed.length > 50) return 'Tier name must be 50 characters or less.'

    // Case-insensitive duplicate check against presets + existing custom tiers (Req 5.5)
    const lower = trimmed.toLowerCase()
    const allNames = [
      ...(PRESET_TIERS as unknown as string[]),
      ...customTiers.map((t) => t.name),
    ]
    if (allNames.some((n) => n.toLowerCase() === lower)) {
      return `A tier named "${trimmed}" already exists.`
    }

    if (customCount >= MAX_CUSTOM_TIERS) {
      return `You've reached the limit of ${MAX_CUSTOM_TIERS} custom tiers.`
    }

    return ''
  }

  function handleCreate() {
    const error = validateName(newTierName)
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError('')
    createTier.mutate(newTierName.trim(), {
      onSuccess: () => setNewTierName(''),
    })
  }

  function handleDelete(tierId: string, tierName: string) {
    if (!confirm(`Delete tier "${tierName}"? It will be removed from all memories.`)) return
    deleteTier.mutate({ tierId, tierName })
  }

  return (
    <section aria-labelledby="tiers-heading">
      <h2 id="tiers-heading" className="text-xs font-medium text-charcoal-800/50 dark:text-cream-100/40 uppercase tracking-wider mb-3">
        Tiers
      </h2>

      {/* Preset tiers */}
      <div className="mb-4">
        <p className="text-xs text-charcoal-800/40 dark:text-cream-100/30 mb-2">Preset</p>
        <div className="flex flex-wrap gap-1.5">
          {(PRESET_TIERS as unknown as string[]).map((name) => (
            <span
              key={name}
              className="rounded-full bg-cream-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-cream-100 text-xs px-3 py-1"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Custom tiers */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-charcoal-800/40 dark:text-cream-100/30">
            Custom ({customCount}/{MAX_CUSTOM_TIERS})
          </p>
        </div>

        {isLoading ? (
          <div className="h-8 flex items-center">
            <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" aria-label="Loading tiers" />
          </div>
        ) : customOnly.length === 0 ? (
          <p className="text-xs text-charcoal-800/40 dark:text-cream-100/30 italic">No custom tiers yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5" aria-label="Custom tiers">
            {customOnly.map((tier) => (
              <li key={tier.id} className="flex items-center gap-1 rounded-full bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 text-xs pl-3 pr-1.5 py-1">
                <span>{tier.name}</span>
                <button
                  onClick={() => handleDelete(tier.id, tier.name)}
                  aria-label={`Delete tier ${tier.name}`}
                  disabled={deleteTier.isPending}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/20 transition disabled:opacity-50"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create new tier */}
      {customCount < MAX_CUSTOM_TIERS && (
        <div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="new-tier-name" className="sr-only">New tier name</label>
              <input
                id="new-tier-name"
                type="text"
                value={newTierName}
                onChange={(e) => {
                  setNewTierName(e.target.value)
                  if (validationError) setValidationError('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="New tier name…"
                maxLength={50}
                aria-describedby={validationError ? 'tier-error' : undefined}
                aria-invalid={!!validationError}
                className="w-full rounded-xl border border-cream-200 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-3 py-2 text-sm text-charcoal-900 dark:text-cream-50 placeholder-charcoal-800/40 focus:outline-none focus:ring-2 focus:ring-gold-400 transition"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!newTierName.trim() || createTier.isPending}
              className="rounded-xl bg-charcoal-900 dark:bg-gold-400 text-cream-50 dark:text-charcoal-950 px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
            >
              {createTier.isPending ? '…' : 'Add'}
            </button>
          </div>
          {validationError && (
            <p id="tier-error" role="alert" className="mt-1.5 text-xs text-burgundy-600">
              {validationError}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
