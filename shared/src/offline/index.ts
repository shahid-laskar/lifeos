/**
 * Shared offline queue contract — platform neutral.
 *
 * Defines the interface that all platform-specific offline queue
 * implementations must satisfy. Web uses localStorage; React Native
 * uses AsyncStorage.
 *
 * Per ADR-012 Increment 3: all operations must be idempotent and retry-safe.
 */

export interface QueuedOperation {
  id: string
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  url: string
  data?: unknown
  createdAt: string
}

export interface OfflineQueue {
  enqueue(op: Omit<QueuedOperation, 'id' | 'createdAt'>): void
  dequeue(id: string): void
  getAll(): QueuedOperation[]
  clear(): void
}

/** Supported offline operation types (type-safe domain events). */
export type OfflineOperationType =
  | 'prayer.log'
  | 'quran.progress'
  | 'quran.bookmark.add'
  | 'quran.bookmark.remove'
  | 'dhikr.log'
  | 'profile.update'
