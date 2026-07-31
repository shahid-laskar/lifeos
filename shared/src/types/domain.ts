/** Domain model types shared across platforms. */

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
export type PrayerStatus = 'completed' | 'missed' | 'excused'
export type MemberRole = 'owner' | 'adult' | 'dependent'
export type MessageRole = 'user' | 'assistant'
export type SafetyOutcome = 'safe' | 'refused' | 'flagged'
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown'
