export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export const PRAYER_NAMES: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export const PRAYER_LABELS: Record<PrayerName, { latin: string; arabic: string }> = {
  fajr: { latin: "Fajr", arabic: "الفجر" },
  dhuhr: { latin: "Dhuhr", arabic: "الظهر" },
  asr: { latin: "Asr", arabic: "العصر" },
  maghrib: { latin: "Maghrib", arabic: "المغرب" },
  isha: { latin: "Isha", arabic: "العشاء" },
};

export type PrayerStatus = "completed" | "missed" | "excused";

export type PrayerTimes = Record<PrayerName, string> & { sunrise: string };

export type PrayerTimeResponse = {
  date: string;
  latitude: number;
  longitude: number;
  method: CalculationMethod;
  asr_method: AsrMethod;
  times: PrayerTimes;
  high_latitude_adjustment_applied?: boolean;
};

export type CalculationMethod = "MWL" | "ISNA" | "EGYPTIAN" | "UMM_AL_QURA" | "KARACHI" | "TEHRAN";

export const CALCULATION_METHODS: { value: CalculationMethod; label: string }[] = [
  { value: "MWL", label: "Muslim World League" },
  { value: "ISNA", label: "ISNA (North America)" },
  { value: "EGYPTIAN", label: "Egyptian General Authority" },
  { value: "UMM_AL_QURA", label: "Umm al-Qura (Makkah)" },
  { value: "KARACHI", label: "University of Karachi" },
  { value: "TEHRAN", label: "Institute of Geophysics, Tehran" },
];

export type AsrMethod = "STANDARD" | "HANAFI";

export type OnboardingGoal =
  | "pray_consistently"
  | "read_quran_daily"
  | "memorise_quran"
  | "learn_arabic"
  | "improve_productivity"
  | "build_healthier_habits"
  | "strengthen_family_organisation"
  | "manage_community_activities";

export const ONBOARDING_GOALS: {
  value: OnboardingGoal;
  label: string;
  note: string;
}[] = [
  { value: "pray_consistently", label: "Pray consistently", note: "Keep the five daily prayers" },
  { value: "read_quran_daily", label: "Read Qur'an daily", note: "A gentle portion each day" },
  { value: "memorise_quran", label: "Memorise Qur'an", note: "Build hifz slowly and steadily" },
  { value: "learn_arabic", label: "Learn Arabic", note: "Understand the words you recite" },
  {
    value: "improve_productivity",
    label: "Improve productivity",
    note: "Order your days with intention",
  },
  {
    value: "build_healthier_habits",
    label: "Build healthier habits",
    note: "Care for the body you were given",
  },
  {
    value: "strengthen_family_organisation",
    label: "Strengthen family life",
    note: "Share the journey at home",
  },
  {
    value: "manage_community_activities",
    label: "Manage community activities",
    note: "Organise with your jamaah",
  },
];

export type UserProfile = {
  id?: string;
  email?: string;
  name?: string;
  country?: string | null;
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  prayer_calculation_method?: CalculationMethod | null;
  asr_method?: AsrMethod | null;
  goals?: OnboardingGoal[] | null;
  preferred_language?: string | null;
};

/**
 * Matches OnboardingStatusResponse from openapi.json exactly.
 * Fields: account_created, location_set, prayer_preferences_set, goals_set,
 * first_meaningful_outcome_available.
 * DRIFT NOTE: prior version had invented fields `prayer_method_set` and
 * `profile_complete` — both removed.
 */
export type OnboardingStatus = {
  account_created: boolean;
  location_set: boolean;
  prayer_preferences_set: boolean;
  goals_set: boolean;
  first_meaningful_outcome_available: boolean;
};

export type AuthTokensResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};

export type DhikrCategory = "morning" | "evening" | "post_prayer" | "general";

export const DHIKR_CATEGORIES: { value: DhikrCategory; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "evening", label: "Evening" },
  { value: "post_prayer", label: "Post-Prayer" },
  { value: "general", label: "General" },
];

/**
 * Matches DhikrDailySummaryResponse from openapi.json.
 * All totals have default: 0 in the spec, so they are always present.
 * DRIFT NOTE: prior version marked totals as optional — corrected.
 */
export type DhikrDailySummaryResponse = {
  date: string;
  total_morning: number;
  total_evening: number;
  total_post_prayer: number;
  total_general: number;
};

export type QuranWeeklySummaryResponse = {
  surahs_read_last_7_days: number;
  active_days_last_7_days: number;
};

export type ConsistencyMetrics = {
  days_completed_last_30: number;
  total_prayers_logged_last_30: number;
};

export type PrayerLogEntry = {
  prayer: PrayerName;
  status: PrayerStatus;
  date?: string;
};

export type PrayerJournalEntry = {
  id: string;
  prayer_name: PrayerName;
  date: string;
  khushoo_rating: number;
  notes: string;
  distractions: string;
};

export type PrayerInsights = {
  weekly_quality: number;
  monthly_quality: number;
  insights: string[];
};

/* --------------------------------- quran --------------------------------- */

/** Matches SurahResponse from openapi.json. */
export type SurahResponse = {
  number: number;
  arabic_name: string;
  transliterated_name: string;
  meaning: string;
  ayah_count: number;
  /** Either "Meccan" or "Medinan" */
  revelation_type: string;
};

/** Matches AyahResponse from openapi.json. */
export type AyahResponse = {
  number_in_surah: number;
  text: string;
};

/** Matches SurahAyahsResponse from openapi.json. */
export type SurahAyahsResponse = {
  surah_number: number;
  ayahs: AyahResponse[];
};

/** Matches BookmarkRequest from openapi.json. */
export type BookmarkRequest = {
  surah_number: number;
  ayah_number: number;
  note?: string | null;
};

/** Matches BookmarkResponse from openapi.json. */
export type BookmarkResponse = {
  id: string;
  surah_number: number;
  ayah_number: number;
  note: string | null;
  created_at: string;
};

/** Matches ReadingProgressRequest from openapi.json. */
export type ReadingProgressRequest = {
  surah_number: number;
  last_ayah_number: number;
};

/** Matches ReadingProgressResponse from openapi.json. */
export type ReadingProgressResponse = {
  surah_number: number;
  last_ayah_number: number;
  updated_at: string;
};

export type TafsirResponse = {
  surah_number: number;
  ayah_number: number;
  source: string;
  text: string;
};

export type MemorisationProgress = {
  surah_number: number;
  ayahs_memorised: number[];
  completion_percentage: number;
};

export type HifdhReviewItem = {
  surah_number: number;
  ayah_number: number;
  last_reviewed: string;
};

/* --------------------------------- dhikr --------------------------------- */

/** Matches DhikrItemResponse from openapi.json. */
export type DhikrItemResponse = {
  id: string;
  category: string;
  arabic_text: string;
  transliteration: string;
  meaning: string;
  recommended_count: number;
  source: string;
};

/** Matches DhikrLogRequest from openapi.json. */
export type DhikrLogRequest = {
  dhikr_item_id: string;
  count: number;
};

/** Matches DhikrLogResponse from openapi.json. */
export type DhikrLogResponse = {
  id: string;
  dhikr_item_id: string;
  category: string;
  count: number;
  date: string;
  logged_at: string;
};

/* ---------------------------------- ai ---------------------------------- */

export type AIMessage = {
  role: "user" | "assistant";
  content: string;
  safety_outcome: "safe" | "refused" | "flagged";
  confidence: "high" | "medium" | "low" | "unknown";
  source_refs: string[];
  created_at: string;
};

export type AIConversation = {
  id: string;
  title: string | null;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
};

export type CreateConversationResponse = {
  id: string;
  created_at: string;
};

export type MessageRequest = {
  content: string;
  include_memory: boolean;
};

export type ConversationResponse = {
  id: string;
  title: string | null;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
};

export type MemoryEntryResponse = {
  id: string;
  content: string;
  created_at: string;
};

/* -------------------------------- family -------------------------------- */

export type FamilyMember = {
  user_id: string;
  role: "owner" | "adult" | "dependent";
  email?: string;
  joined_at?: string;
};

export type FamilyInvitation = {
  id: string;
  family_id: string;
  invited_email: string;
  role: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
};

export type Family = {
  id: string;
  name: string;
  owner_id: string;
  members: FamilyMember[];
  created_at: string;
  updated_at: string;
};

/* --------------------------------- duas ---------------------------------- */

export type DuaItemResponse = {
  id: string;
  category: string;
  arabic_text: string;
  transliteration: string;
  translation: string;
  reference: string;
  when_to_recite: string | null;
};

/* -------------------------------- hadith --------------------------------- */

export type HadithCollectionResponse = {
  slug: string;
  name_english: string;
  name_arabic: string;
  author_english: string;
  author_arabic: string;
  hadith_count: number;
  chapter_count: number;
};

export type HadithChapterResponse = {
  collection_slug: string;
  chapter_id: number;
  name_english: string;
  name_arabic: string;
  hadith_count: number;
};

export type HadithItemResponse = {
  id: string;
  collection_slug: string;
  collection_name: string;
  chapter_id: number;
  chapter_name_english: string;
  chapter_name_arabic: string;
  hadith_number: number;
  arabic_text: string;
  narrator: string;
  translation: string;
  grade: string;
};

export type HadithSearchResponse = {
  query: string;
  total: number;
  results: HadithItemResponse[];
};

export type HadithBookmarkResponse = {
  id: string;
  hadith_id: string;
  note: string | null;
  created_at: string;
  hadith: HadithItemResponse | null;
};
