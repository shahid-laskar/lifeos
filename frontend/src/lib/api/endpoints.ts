// API configuration
// Governed by 062_API_Architecture.md — the backend API contract is authoritative.
// Proxy configured in vite.config.ts: /api → http://127.0.0.1:8000

export const API_BASE = '/api/v1'

export const ENDPOINTS = {
  // Auth (ADR-004, ADR-009)
  REGISTER:        `${API_BASE}/auth/register`,
  LOGIN:           `${API_BASE}/auth/login`,
  REFRESH:         `${API_BASE}/auth/refresh`,
  REQUEST_RESET:   `${API_BASE}/auth/request-password-reset`,
  RESET_PASSWORD:  `${API_BASE}/auth/reset-password`,

  // Users (ADR-004)
  ME:              `${API_BASE}/users/me`,
  PROFILE:         `${API_BASE}/users/me/profile`,
  ONBOARDING:      `${API_BASE}/users/me/onboarding-status`,

  // Prayer (ADR-002, ADR-005)
  PRAYER_TIMES:    `${API_BASE}/prayer/times`,
  PRAYER_TIMES_ME: `${API_BASE}/prayer/times/me`,

  // Habits / Prayer Consistency (ADR-006)
  HABITS_LOG:      `${API_BASE}/habits/prayers/log`,
  HABITS_HISTORY:  `${API_BASE}/habits/prayers/status`,
  HABITS_METRICS:  `${API_BASE}/habits/prayers/consistency`,

  // Qur'an (ADR-007, ADR-010)
  QURAN_SURAHS:    `${API_BASE}/quran/surahs`,
  QURAN_BOOKMARKS: `${API_BASE}/quran/bookmarks`,
  QURAN_PROGRESS:  `${API_BASE}/quran/reading-progress`,
  QURAN_WEEKLY:    `${API_BASE}/quran/reading-progress/summary/weekly`,

  // Dhikr (ADR-008)
  DHIKR_ITEMS:     `${API_BASE}/dhikr/items`,
  DHIKR_LOG:       `${API_BASE}/dhikr/sessions`,
  DHIKR_SUMMARY:   `${API_BASE}/dhikr/summary`,
} as const
