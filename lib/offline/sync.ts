/**
 * Offline queue drain and retry logic.
 * Called by OfflineProvider when connectivity is restored.
 *
 * Retry strategy: exponential backoff — 1s, 2s, 4s (max 3 retries).
 * On permanent failure: move item to failed queue and notify user.
 */

import { createClient } from '@/lib/supabase/client'
import {
  getQueue,
  dequeueItem,
  updateRetryCount,
  moveToFailed,
} from './queue'
import type { OfflineQueueItem } from '@/stores/offlineStore'

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function processItem(item: OfflineQueueItem): Promise<void> {
  const supabase = createClient()

  switch (item.type) {
    case 'create_memory': {
      const payload = item.payload as Record<string, unknown>
      const { error } = await supabase.from('memories').insert(payload)
      if (error) throw error
      break
    }
    case 'update_memory': {
      const { id, ...data } = item.payload as Record<string, unknown>
      const { error } = await supabase
        .from('memories')
        .update(data)
        .eq('id', id as string)
      if (error) throw error
      break
    }
    case 'add_wish': {
      const payload = item.payload as Record<string, unknown>
      const { error } = await supabase.from('wishes').upsert(payload)
      if (error) throw error
      break
    }
    case 'remove_wish': {
      const { id } = item.payload as { id: string }
      const { error } = await supabase.from('wishes').delete().eq('id', id)
      if (error) throw error
      break
    }
    default:
      throw new Error(`Unknown queue item type: ${(item as OfflineQueueItem).type}`)
  }
}

export interface SyncResult {
  synced: number
  failed: string[]
}

/**
 * Drain the offline queue, processing each item with exponential backoff.
 * Returns a summary of synced and permanently failed items.
 */
export async function drainQueue(
  onProgress?: (item: OfflineQueueItem, success: boolean) => void
): Promise<SyncResult> {
  const queue = await getQueue()
  const result: SyncResult = { synced: 0, failed: [] }

  for (const item of queue) {
    let success = false

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await delay(BASE_DELAY_MS * Math.pow(2, attempt - 1))
      }

      try {
        await processItem(item)
        await dequeueItem(item.id)
        result.synced++
        success = true
        break
      } catch (err) {
        const isLastAttempt = attempt === MAX_RETRIES
        if (isLastAttempt) {
          await moveToFailed(item.id)
          result.failed.push(item.id)
        } else {
          await updateRetryCount(item.id)
        }
      }
    }

    onProgress?.(item, success)
  }

  return result
}
