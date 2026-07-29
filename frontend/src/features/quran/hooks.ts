/**
 * Quran feature hooks.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { Surah, Ayah, QuranBookmark, ReadingProgress, WeeklySummary } from '@/lib/api/types'
import { requestWithOfflineQueue } from '@/lib/offline/queue'

export const QURAN_KEYS = {
  surahs: ['quran-surahs'] as const,
  ayahs: (surah: number) => ['quran-ayahs', surah] as const,
  progress: ['quran-progress'] as const,
  bookmarks: ['quran-bookmarks'] as const,
  weekly: ['quran-weekly'] as const,
}

export function useSurahs() {
  return useQuery<Surah[]>({
    queryKey: QURAN_KEYS.surahs,
    queryFn: () => client.get(ENDPOINTS.QURAN_SURAHS).then((r) => r.data),
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useAyahs(surahNumber: number | null) {
  return useQuery<Ayah[]>({
    queryKey: QURAN_KEYS.ayahs(surahNumber ?? 0),
    enabled: surahNumber !== null,
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const r = await client.get<{ ayahs: Ayah[] }>(ENDPOINTS.QURAN_AYAHS(surahNumber!))
      return r.data.ayahs
    },
  })
}

export function useReadingProgress() {
  return useQuery<Record<number, ReadingProgress>>({
    queryKey: QURAN_KEYS.progress,
    queryFn: () =>
      client.get<ReadingProgress[]>(ENDPOINTS.QURAN_PROGRESS).then((r) => {
        const map: Record<number, ReadingProgress> = {}
        for (const p of r.data) map[p.surah_number] = p
        return map
      }),
  })
}

export function useBookmarks() {
  return useQuery<QuranBookmark[]>({
    queryKey: QURAN_KEYS.bookmarks,
    queryFn: () => client.get(ENDPOINTS.QURAN_BOOKMARKS).then((r) => r.data),
  })
}

export function useWeeklySummary() {
  return useQuery<WeeklySummary>({
    queryKey: QURAN_KEYS.weekly,
    queryFn: () => client.get(ENDPOINTS.QURAN_WEEKLY).then((r) => r.data),
  })
}

export function useUpdateReadingProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { surah_number: number; last_ayah_number: number }) =>
      requestWithOfflineQueue({ method: 'put', url: ENDPOINTS.QURAN_PROGRESS, data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QURAN_KEYS.progress })
      qc.invalidateQueries({ queryKey: QURAN_KEYS.weekly })
    },
  })
}

export function useAddBookmark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { surah_number: number; ayah_number: number; note?: string }) =>
      requestWithOfflineQueue({ method: 'post', url: ENDPOINTS.QURAN_BOOKMARKS, data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QURAN_KEYS.bookmarks }),
  })
}

export function useRemoveBookmark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bookmarkId: string) =>
      client.delete(`${ENDPOINTS.QURAN_BOOKMARKS}/${bookmarkId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QURAN_KEYS.bookmarks }),
  })
}
