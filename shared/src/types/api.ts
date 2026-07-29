/** Shared API response types (mirrors frontend/src/lib/api/types.ts). */

export interface TokenResponse {
  access_token: string
  refresh_token: string
}

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

export interface Family {
  id: string
  name: string
  owner_id: string
  members: FamilyMember[]
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  user_id: string
  role: 'owner' | 'adult' | 'dependent'
  joined_at: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  safety_outcome: 'safe' | 'refused' | 'flagged'
  source_refs: string[]
  created_at: string
}
