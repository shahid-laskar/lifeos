/**
 * Prayer feature hooks.
 * Centralises all prayer-related API calls and cache keys.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '@/lib/api/client'
import { ENDPOINTS } from '@/lib/api/endpoints'
import type { PrayerTimes, PrayerLogEntry, ConsistencyMetrics } from '@/lib/api/types'
import { requestWithOfflineQueue } from '@/lib/offline/queue'

export const PRAYER_KEYS = {
  times: ['prayer-times'] as const,
  timesMe: ['prayer-times-me'] as const,
  history: (date: string) => ['prayer-history', date] as const,
  consistency: ['prayer-consistency'] as const,
}

export function usePrayerTimesMe() {
  return useQuery<PrayerTimes>({
    queryKey: PRAYER_KEYS.timesMe,
    queryFn: () => client.get(ENDPOINTS.PRAYER_TIMES_ME).then((r) => r.data),
  })
}

export function usePrayerConsistency() {
  return useQuery<ConsistencyMetrics>({
    queryKey: PRAYER_KEYS.consistency,
    queryFn: () => client.get(ENDPOINTS.HABITS_METRICS).then((r) => r.data),
  })
}

export function useLogPrayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entry: Pick<PrayerLogEntry, 'prayer_name' | 'date' | 'status'>) =>
      requestWithOfflineQueue({ method: 'post', url: ENDPOINTS.HABITS_LOG, data: entry }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRAYER_KEYS.consistency })
    },
  })
}
