'use client'

import { useCallback } from 'react'

interface QueuedAction {
  endpoint: string
  method: string
  body: Record<string, any>
  timestamp: number
}

const QUEUE_KEY = 'timeflow-offline-queue'

export function useOfflineQueue() {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  function getQueue(): QueuedAction[] {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
    } catch {
      return []
    }
  }

  function saveQueue(queue: QueuedAction[]) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  }

  const enqueue = useCallback((action: Omit<QueuedAction, 'timestamp'>) => {
    const queue = getQueue()
    queue.push({ ...action, timestamp: Date.now() })
    saveQueue(queue)
  }, [])

  const flush = useCallback(async () => {
    const queue = getQueue()
    if (queue.length === 0) return

    const failed: QueuedAction[] = []
    for (const action of queue) {
      try {
        await fetch(action.endpoint, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.body),
        })
      } catch {
        failed.push(action)
      }
    }
    saveQueue(failed)
  }, [])

  // Auto-flush when coming back online
  const setupFlushOnReconnect = useCallback(() => {
    window.addEventListener('online', flush, { once: true })
  }, [flush])

  /**
   * Execute a fetch — if offline, queue it for later and return a fake success.
   */
  const fetchOrQueue = useCallback(async (
    endpoint: string,
    method: string,
    body: Record<string, any>
  ): Promise<{ ok: boolean; queued?: boolean }> => {
    if (isOnline) {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return { ok: res.ok }
    } else {
      enqueue({ endpoint, method, body })
      setupFlushOnReconnect()
      return { ok: true, queued: true }
    }
  }, [isOnline, enqueue, setupFlushOnReconnect])

  return { isOnline, fetchOrQueue, flush, queueLength: getQueue().length }
}
