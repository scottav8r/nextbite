'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/stores/uiStore'
import { PRESET_TIERS } from '@/lib/types/domain'

const MAX_CUSTOM_TIERS = 20

export interface UserTier {
  id: string
  user_id: string
  name: string
  is_preset: boolean
  created_at: string
}

export function useTiers() {
  return useQuery<UserTier[]>({
    queryKey: ['tiers'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_tiers')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as UserTier[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** Returns preset tiers merged with user's custom tiers, deduplicated. */
export function useAllTiers() {
  const { data: customTiers = [] } = useTiers()
  const customNames = new Set(customTiers.map((t) => t.name.toLowerCase()))

  const presets: UserTier[] = (PRESET_TIERS as unknown as string[])
    .filter((name) => !customNames.has(name.toLowerCase()))
    .map((name, i) => ({
      id: `preset-${i}`,
      user_id: '',
      name,
      is_preset: true,
      created_at: '',
    }))

  return [...presets, ...customTiers.filter((t) => !t.is_preset)]
}

export function useCreateTier() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  return useMutation({
    mutationFn: async (name: string) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check custom tier count (Req 5.4)
      const { count } = await supabase
        .from('user_tiers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_preset', false)

      if ((count ?? 0) >= MAX_CUSTOM_TIERS) {
        throw new Error(`You can only create up to ${MAX_CUSTOM_TIERS} custom tiers.`)
      }

      const { data, error } = await supabase
        .from('user_tiers')
        .insert({ user_id: user.id, name: name.trim(), is_preset: false })
        .select()
        .single()

      if (error) {
        // Unique constraint violation = duplicate name
        if (error.code === '23505') {
          throw new Error(`A tier named "${name}" already exists.`)
        }
        throw error
      }

      return data as UserTier
    },
    onSuccess: (tier) => {
      queryClient.invalidateQueries({ queryKey: ['tiers'] })
      addToast({ type: 'success', message: `Tier "${tier.name}" created.` })
    },
    onError: (err: Error) => {
      addToast({ type: 'error', message: err.message })
    },
  })
}

export function useDeleteTier() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  return useMutation({
    mutationFn: async ({ tierId, tierName }: { tierId: string; tierName: string }) => {
      const supabase = createClient()

      // Delete the tier
      const { error: deleteError } = await supabase
        .from('user_tiers')
        .delete()
        .eq('id', tierId)

      if (deleteError) throw deleteError

      // Strip the tier from all memories that used it (Req 5.3)
      // Fetch affected memories
      const { data: affected } = await supabase
        .from('memories')
        .select('id, tiers')
        .contains('tiers', [tierName])

      if (affected && affected.length > 0) {
        await Promise.all(
          affected.map((memory) =>
            supabase
              .from('memories')
              .update({ tiers: (memory.tiers as string[]).filter((t) => t !== tierName) })
              .eq('id', memory.id)
          )
        )
      }

      return { tierName, affectedCount: affected?.length ?? 0 }
    },
    onSuccess: ({ tierName, affectedCount }) => {
      queryClient.invalidateQueries({ queryKey: ['tiers'] })
      queryClient.invalidateQueries({ queryKey: ['memories'] })
      const suffix = affectedCount > 0 ? ` Removed from ${affectedCount} memor${affectedCount === 1 ? 'y' : 'ies'}.` : ''
      addToast({ type: 'success', message: `Tier "${tierName}" deleted.${suffix}` })
    },
    onError: () => {
      addToast({ type: 'error', message: 'Could not delete tier.' })
    },
  })
}
