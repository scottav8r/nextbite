import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface OfflineQueueItem {
  id: string
  type: 'create_memory' | 'update_memory' | 'add_wish' | 'remove_wish'
  payload: unknown
  created_at: number
  retry_count: number
}

interface OfflineState {
  isOnline: boolean
  recentMemoriesCache: unknown[]   // last 20 memories for offline display
  queue: OfflineQueueItem[]
  failedQueue: OfflineQueueItem[]
  setIsOnline: (online: boolean) => void
  setRecentMemoriesCache: (memories: unknown[]) => void
  enqueue: (item: Omit<OfflineQueueItem, 'id' | 'created_at' | 'retry_count'>) => void
  dequeue: (id: string) => void
  incrementRetry: (id: string) => void
  moveToFailed: (id: string) => void
  clearFailed: () => void
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      recentMemoriesCache: [],
      queue: [],
      failedQueue: [],
      setIsOnline: (isOnline) => set({ isOnline }),
      setRecentMemoriesCache: (memories) =>
        set({ recentMemoriesCache: memories.slice(0, 20) }),
      enqueue: (item) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...item,
              id: crypto.randomUUID(),
              created_at: Date.now(),
              retry_count: 0,
            },
          ],
        })),
      dequeue: (id) =>
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== id),
        })),
      incrementRetry: (id) =>
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? { ...item, retry_count: item.retry_count + 1 }
              : item
          ),
        })),
      moveToFailed: (id) => {
        const item = get().queue.find((i) => i.id === id)
        if (!item) return
        set((state) => ({
          queue: state.queue.filter((i) => i.id !== id),
          failedQueue: [...state.failedQueue, item],
        }))
      },
      clearFailed: () => set({ failedQueue: [] }),
    }),
    {
      name: 'nextbite-offline',
      partialize: (state) => ({
        recentMemoriesCache: state.recentMemoriesCache,
        queue: state.queue,
        failedQueue: state.failedQueue,
      }),
    }
  )
)
