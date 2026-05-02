'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOfflineStore } from '@/stores/offlineStore'
import { useUIStore } from '@/stores/uiStore'
import { enqueueItem } from '@/lib/offline/queue'
import type { Memory } from '@/lib/types/domain'

const PAGE_SIZE = 20

export function useMemories(filters?: {
  search?: string
  tiers?: string[]
  cuisines?: string[]
  occasions?: string[]
  price_levels?: number[]
  date_from?: string
  date_to?: string
}) {
  return useInfiniteQuery<Memory[]>({
    queryKey: ['memories', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const supabase = createClient()
      let query = supabase
        .from('memories')
        .select(`
          *,
          restaurant:restaurants(id, name, city, cuisine_tags, price_level, photos, google_rating)
        `)
        .order('visit_date', { ascending: false })
        .range(
          (pageParam as number) * PAGE_SIZE,
          (pageParam as number) * PAGE_SIZE + PAGE_SIZE - 1
        )

      if (filters?.tiers?.length) {
        query = query.overlaps('tiers', filters.tiers)
      }
      if (filters?.cuisines?.length) {
        query = query.overlaps('cuisine_tags', filters.cuisines)
      }
      if (filters?.occasions?.length) {
        query = query.overlaps('occasions', filters.occasions)
      }
      if (filters?.date_from) {
        query = query.gte('visit_date', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('visit_date', filters.date_to)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Memory[]
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    staleTime: 60 * 1000,
  })
}

export function useCreateMemory() {
  const queryClient = useQueryClient()
  const isOnline = useOfflineStore((s) => s.isOnline)
  const addToast = useUIStore((s) => s.addToast)

  return useMutation({
    mutationFn: async (payload: Omit<Memory, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'restaurant'>) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('memories')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data as Memory
    },

    onMutate: async (newMemory) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ['memories'] })
      const previous = queryClient.getQueryData(['memories'])

      // Optimistic update — prepend a temporary record
      const optimisticMemory: Memory = {
        ...newMemory,
        id: `optimistic-${crypto.randomUUID()}`,
        user_id: 'optimistic',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData(['memories', undefined], (old: { pages: Memory[][] } | undefined) => {
        if (!old) return { pages: [[optimisticMemory]], pageParams: [0] }
        return {
          ...old,
          pages: [[optimisticMemory, ...(old.pages[0] ?? [])], ...old.pages.slice(1)],
        }
      })

      return { previous, optimisticMemory }
    },

    onError: async (err, variables, context) => {
      // Rollback optimistic update
      if (context?.previous) {
        queryClient.setQueryData(['memories', undefined], context.previous)
      }

      // If offline, queue for later sync
      if (!isOnline) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await enqueueItem({
            type: 'create_memory',
            payload: { ...variables, user_id: user.id },
          })
          addToast({ type: 'info', message: 'Saved locally — will sync when online.' })
        }
      } else {
        addToast({ type: 'error', message: 'Failed to save memory. Please try again.' })
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] })
      queryClient.invalidateQueries({ queryKey: ['wishes', 'count'] })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] })
    },
  })
}

export function useDeleteMemory() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  return useMutation({
    mutationFn: async (memoryId: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('memories').delete().eq('id', memoryId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] })
      addToast({ type: 'success', message: 'Memory deleted.' })
    },
    onError: () => {
      addToast({ type: 'error', message: 'Failed to delete memory.' })
    },
  })
}
