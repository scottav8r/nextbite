'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/stores/uiStore'
import type { Wish } from '@/lib/types/domain'

export function useWishes(sortBy: 'priority' | 'date_added' | 'target_date' = 'priority') {
  return useQuery<Wish[]>({
    queryKey: ['wishes', sortBy],
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('wishes')
        .select(`
          *,
          restaurant:restaurants(id, name, city, cuisine_tags, price_level, photos, google_rating)
        `)

      if (sortBy === 'date_added') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'target_date') {
        query = query.order('target_date', { ascending: true, nullsFirst: false })
      } else {
        // priority: High → Medium → Low, then by created_at
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query
      if (error) throw error

      const wishes = (data ?? []) as Wish[]

      // Client-side priority sort (High > Medium > Low)
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 }
        return wishes.sort((a, b) => order[a.priority] - order[b.priority])
      }

      return wishes
    },
    staleTime: 30 * 1000,
  })
}

export function useWishCount() {
  return useQuery<number>({
    queryKey: ['wishes', 'count'],
    queryFn: async () => {
      const supabase = createClient()
      const { count } = await supabase
        .from('wishes')
        .select('*', { count: 'exact', head: true })
      return count ?? 0
    },
    staleTime: 30 * 1000,
  })
}

export function useAddWish() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  return useMutation({
    mutationFn: async (wish: {
      restaurant_id: string
      priority?: 'low' | 'medium' | 'high'
      notes?: string | null
      target_occasion?: string | null
      target_date?: string | null
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('wishes')
        .upsert(
          { ...wish, user_id: user.id, priority: wish.priority ?? 'medium' },
          { onConflict: 'user_id,restaurant_id' }
        )
        .select()
        .single()

      if (error) throw error
      return data as Wish
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishes'] })
      addToast({ type: 'success', message: 'Added to your Wishes!' })
    },
    onError: () => {
      addToast({ type: 'error', message: 'Could not add to Wishes.' })
    },
  })
}

export function useUpdateWish() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Pick<Wish, 'priority' | 'notes' | 'target_occasion' | 'target_date'>>
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('wishes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Wish
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishes'] })
    },
    onError: () => {
      addToast({ type: 'error', message: 'Could not update Wish.' })
    },
  })
}

export function useRemoveWish() {
  const queryClient = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)

  return useMutation({
    mutationFn: async (wishId: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('wishes').delete().eq('id', wishId)
      if (error) throw error
    },
    onMutate: async (wishId) => {
      await queryClient.cancelQueries({ queryKey: ['wishes'] })
      const previous = queryClient.getQueryData(['wishes', 'priority'])

      // Optimistic removal
      queryClient.setQueryData(['wishes', 'priority'], (old: Wish[] | undefined) =>
        old?.filter((w) => w.id !== wishId) ?? []
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['wishes', 'priority'], context.previous)
      }
      addToast({ type: 'error', message: 'Could not remove Wish.' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishes'] })
      addToast({ type: 'success', message: 'Wish removed.' })
    },
  })
}
