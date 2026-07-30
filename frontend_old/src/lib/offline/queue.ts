import type { AxiosRequestConfig } from 'axios'

import client from '@/lib/api/client'

const STORAGE_KEY = 'mlos-offline-operations'

export interface QueuedOperation {
  id: string
  method: string
  url: string
  data?: unknown
  params?: Record<string, string>
  createdAt: string
}

interface QueuedResponse<T> {
  queued: boolean
  data?: T
}

function readQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as QueuedOperation[] : []
  } catch {
    return []
  }
}

function writeQueue(operations: QueuedOperation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(operations))
}

function isRetryableNetworkError(error: unknown): boolean {
  const candidate = error as { response?: unknown; code?: string }
  return !candidate.response && (!navigator.onLine || candidate.code === 'ERR_NETWORK' || candidate.code === 'ECONNABORTED')
}

export function queuedOperationCount(): number {
  return readQueue().length
}

export async function requestWithOfflineQueue<T>(config: AxiosRequestConfig): Promise<QueuedResponse<T>> {
  try {
    const response = await client.request<T>(config)
    return { queued: false, data: response.data }
  } catch (error) {
    if (!isRetryableNetworkError(error)) throw error

    const operation: QueuedOperation = {
      id: crypto.randomUUID(),
      method: config.method ?? 'get',
      url: config.url ?? '/',
      data: config.data,
      params: config.params as Record<string, string> | undefined,
      createdAt: new Date().toISOString(),
    }
    writeQueue([...readQueue(), operation])
    window.dispatchEvent(new Event('mlos:sync-queued'))
    return { queued: true }
  }
}

export async function flushOfflineQueue(): Promise<number> {
  if (!navigator.onLine) return 0

  const operations = readQueue()
  if (operations.length === 0) return 0

  const remaining: QueuedOperation[] = []
  let flushed = 0

  for (const operation of operations) {
    try {
      await client.request({
        method: operation.method,
        url: operation.url,
        data: operation.data,
        params: operation.params,
      })
      flushed += 1
    } catch {
      remaining.push(operation)
    }
  }

  writeQueue(remaining)
  if (flushed > 0) window.dispatchEvent(new Event('mlos:sync-complete'))
  return flushed
}
