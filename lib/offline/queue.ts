/**
 * IndexedDB offline queue operations using idb-keyval.
 * Stores pending writes that failed due to network errors.
 */

import { get, set, del, keys, createStore } from 'idb-keyval'
import type { OfflineQueueItem } from '@/stores/offlineStore'

const queueStore = createStore('nextbite-offline', 'queue')
const failedStore = createStore('nextbite-offline', 'failed')

// ─── Queue operations ─────────────────────────────────────────────

export async function enqueueItem(
  item: Omit<OfflineQueueItem, 'id' | 'created_at' | 'retry_count'>
): Promise<OfflineQueueItem> {
  const queueItem: OfflineQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    created_at: Date.now(),
    retry_count: 0,
  }
  await set(queueItem.id, queueItem, queueStore)
  return queueItem
}

export async function getQueue(): Promise<OfflineQueueItem[]> {
  const allKeys = await keys(queueStore)
  const items = await Promise.all(
    allKeys.map((k) => get<OfflineQueueItem>(k, queueStore))
  )
  return items
    .filter((item): item is OfflineQueueItem => item !== undefined)
    .sort((a, b) => a.created_at - b.created_at)
}

export async function dequeueItem(id: string): Promise<void> {
  await del(id, queueStore)
}

export async function updateRetryCount(id: string): Promise<void> {
  const item = await get<OfflineQueueItem>(id, queueStore)
  if (!item) return
  await set(id, { ...item, retry_count: item.retry_count + 1 }, queueStore)
}

export async function moveToFailed(id: string): Promise<void> {
  const item = await get<OfflineQueueItem>(id, queueStore)
  if (!item) return
  await del(id, queueStore)
  await set(id, item, failedStore)
}

// ─── Failed queue operations ──────────────────────────────────────

export async function getFailedQueue(): Promise<OfflineQueueItem[]> {
  const allKeys = await keys(failedStore)
  const items = await Promise.all(
    allKeys.map((k) => get<OfflineQueueItem>(k, failedStore))
  )
  return items.filter((item): item is OfflineQueueItem => item !== undefined)
}

export async function clearFailedQueue(): Promise<void> {
  const allKeys = await keys(failedStore)
  await Promise.all(allKeys.map((k) => del(k, failedStore)))
}

export async function retryFromFailed(id: string): Promise<void> {
  const item = await get<OfflineQueueItem>(id, failedStore)
  if (!item) return
  await del(id, failedStore)
  await set(id, { ...item, retry_count: 0 }, queueStore)
}
