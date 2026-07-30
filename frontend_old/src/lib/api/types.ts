/**
 * Typed API contracts for all backend endpoints.
 *
 * These types mirror the Pydantic response models in app/domain/{domain}/models.py.
 * Keeping them here centralises the contract so frontend code never
 * duplicates inline interface definitions. If the backend contract changes,
 * update here and TypeScript will surface the downstream impact.
 */

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  refresh_token: string
}

// ── User / Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  preferred_language: string
  country: string | null
  timezone: string | null
  latitude: number | null
  longitude: number | null
  prayer_calculation_method: string | null
  asr_method: string | null
  goals: string[]
  created_at: string
}

export interface OnboardingStatus {
  account_created: boolean
  location_set: boolean
  prayer_preferences_set: boolean
  goals_set: boolean
  first_meaningful_outcome_available: boolean
}

// ── Prayer ────────────────────────────────────────────────────────────────────

export interface PrayerTimes {
  fajr: string
  sunrise: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  date: string
  method: string
  high_latitude_adjustment_applied: boolean
}

export interface PrayerLogEntry {
  prayer_name: string
  date: string
  status: 'completed' | 'missed' | 'excused'
}

export interface PrayerConsistency {
  days_checked: number
  completed_days: number
  consistency_percent: number
}

// ── Quran ─────────────────────────────────────────────────────────────────────

export interface Surah {
  number: number
  arabic_name: string
  transliterated_name: string
  meaning: string
  ayah_count: number
  revelation_type: 'meccan' | 'medinan'
}

export interface Ayah {
  number_in_surah: number
  text: string
}

export interface SurahAyahsResponse {
  surah_number: number
  ayahs: Ayah[]
}

export interface QuranBookmark {
  id: string
  surah_number: number
  ayah_number: number
  note: string | null
  created_at: string
}

export interface ReadingProgress {
  surah_number: number
  last_ayah_number: number
  updated_at: string
}

export interface WeeklySummary {
  surahs_read: number
  active_days: number
  week_start: string
  week_end: string
}

// ── Habits ────────────────────────────────────────────────────────────────────

export interface HabitLogEntry {
  prayer_name: string
  date: string
  status: 'completed' | 'missed' | 'excused'
  created_at: string
}

export interface ConsistencyMetrics {
  days_checked: number
  completed_days: number
  consistency_percent: number
}

// ── Dhikr ────────────────────────────────────────────────────────────────────

export interface DhikrItem {
  id: string
  arabic: string
  transliteration: string
  translation: string
  category: string
  recommended_count: number
  source: string
}

export interface DhikrSession {
  dhikr_item_id: string
  count: number
  date: string
}

export interface DhikrSummary {
  date: string
  total_morning: number
  total_evening: number
  total_post_prayer: number
  total_general: number
}

// ── AI ────────────────────────────────────────────────────────────────────────

export interface ConversationSummary {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  safety_outcome: 'safe' | 'refused' | 'flagged'
  source_refs: string[]
  created_at: string
}

export interface Conversation extends ConversationSummary {
  messages: ConversationMessage[]
}

export interface MemoryEntry {
  id: string
  content: string
  created_at: string
}

// ── Family ────────────────────────────────────────────────────────────────────

export interface FamilyMember {
  user_id: string
  role: 'owner' | 'adult' | 'dependent'
  joined_at: string
}

export interface Family {
  id: string
  name: string
  owner_id: string
  members: FamilyMember[]
  created_at: string
  updated_at: string
}

export interface FamilyInvitation {
  id: string
  family_id: string
  invited_email: string
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  created_at: string
  expires_at: string | null
}

// ── Governance ────────────────────────────────────────────────────────────────

export interface RetentionPolicy {
  domain: string
  classification: string
  retention_days: number | null
  deletion_on_account_close: boolean
  export_supported: boolean
  notes: string
}
