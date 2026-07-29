/**
 * Shared domain models — platform neutral.
 *
 * Business rules that are safe to compute on-device without a server round-trip.
 * These must mirror the backend domain logic exactly to avoid divergence.
 */

import type { PrayerName } from '../types/domain'

export const PRAYER_NAMES: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

export const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
}

/** Returns today's date in YYYY-MM-DD format using the local timezone. */
export function todayLocalDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Formats a prayer time ISO string to HH:MM (24-hour). */
export function formatPrayerTime(isoTime: string): string {
  return isoTime.slice(11, 16)
}
