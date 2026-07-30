/**
 * Typed offline operation builders.
 *
 * These helpers produce correctly-typed QueuedOperation configs for the
 * domains that support offline mutation (prayer logs, Dhikr sessions,
 * Quran progress, bookmarks, profile edits).
 *
 * Per ADR-012 Increment 3: all queued operations must be idempotent and
 * retry-safe. The backend endpoints all support idempotent semantics
 * (PUT upserts, POST with unique constraints).
 */
import { ENDPOINTS } from '@/lib/api/endpoints'
import { requestWithOfflineQueue } from './queue'

export const offlineOps = {
  logPrayer: (prayer_name: string, date: string, status: 'completed' | 'missed' | 'excused') =>
    requestWithOfflineQueue({
      method: 'post',
      url: ENDPOINTS.HABITS_LOG,
      data: { prayer_name, date, status },
    }),

  updateQuranProgress: (surah_number: number, last_ayah_number: number) =>
    requestWithOfflineQueue({
      method: 'put',
      url: ENDPOINTS.QURAN_PROGRESS,
      data: { surah_number, last_ayah_number },
    }),

  addBookmark: (surah_number: number, ayah_number: number, note?: string) =>
    requestWithOfflineQueue({
      method: 'post',
      url: ENDPOINTS.QURAN_BOOKMARKS,
      data: { surah_number, ayah_number, ...(note ? { note } : {}) },
    }),

  logDhikr: (dhikr_item_id: string, count: number, date: string) =>
    requestWithOfflineQueue({
      method: 'post',
      url: ENDPOINTS.DHIKR_LOG,
      data: { dhikr_item_id, count, date },
    }),
}
