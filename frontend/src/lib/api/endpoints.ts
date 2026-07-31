import { apiFetch } from "./client";
import type {
  AIMessage,
  AuthTokensResponse,
  BookmarkRequest,
  BookmarkResponse,
  ConsistencyMetrics,
  ConversationResponse,
  CreateConversationResponse,
  DhikrCategory,
  DhikrDailySummaryResponse,
  DhikrItemResponse,
  DhikrLogRequest,
  DhikrLogResponse,
  Family,
  FamilyInvitation,
  MemoryEntryResponse,
  OnboardingStatus,
  PrayerLogEntry,
  PrayerName,
  PrayerStatus,
  PrayerTimeResponse,
  PrayerTimes,
  QuranWeeklySummaryResponse,
  ReadingProgressRequest,
  ReadingProgressResponse,
  SurahAyahsResponse,
  SurahResponse,
  UserProfile,
} from "./types";
import { PRAYER_NAMES } from "./types";

/* ---------------------------------- auth --------------------------------- */

export function register(input: {
  email: string;
  password: string;
  terms_accepted: boolean;
  preferred_language: string;
}) {
  return apiFetch<AuthTokensResponse>("/api/v1/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
}

export function login(input: { email: string; password: string }) {
  return apiFetch<AuthTokensResponse>("/api/v1/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });
}

export function requestPasswordReset(email: string) {
  return apiFetch<unknown>("/api/v1/auth/request-password-reset", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export function resetPassword(input: { token: string; new_password: string }) {
  return apiFetch<unknown>("/api/v1/auth/reset-password", {
    method: "POST",
    body: input,
    auth: false,
  });
}

/* ---------------------------------- user --------------------------------- */

export function getOnboardingStatus() {
  return apiFetch<OnboardingStatus>("/api/v1/users/me/onboarding-status");
}

export function getProfile() {
  return apiFetch<UserProfile>("/api/v1/users/me");
}

export function updateProfile(input: Partial<UserProfile>) {
  return apiFetch<UserProfile>("/api/v1/users/me/profile", {
    method: "PATCH",
    body: input,
  });
}

/* --------------------------------- prayer -------------------------------- */

function normalizePrayerTimes(payload: unknown): PrayerTimeResponse {
  const record = (payload ?? {}) as Record<string, unknown>;
  const source = (record.times ?? record.prayer_times ?? record) as Record<
    string,
    unknown
  >;
  const times = {} as PrayerTimes;
  for (const name of [...PRAYER_NAMES, "sunrise"] as const) {
    const value = source[name] ?? source[name.toUpperCase()];
    times[name] = typeof value === "string" ? value : "";
  }
  const number = (value: unknown) => (typeof value === "number" ? value : 0);
  return {
    date: typeof record.date === "string" ? record.date : "",
    latitude: number(record.latitude),
    longitude: number(record.longitude),
    method: record.method as PrayerTimeResponse["method"],
    asr_method: record.asr_method as PrayerTimeResponse["asr_method"],
    high_latitude_adjustment_applied:
      record.high_latitude_adjustment_applied === true,
    times,
  };
}

export async function getMyPrayerTimes(date?: string) {
  const payload = await apiFetch<unknown>("/api/v1/prayer/times/me", {
    query: { date },
  });
  return normalizePrayerTimes(payload);
}

export async function getPrayerTimesForLocation(input: {
  latitude: number;
  longitude: number;
  utc_offset: number;
  date?: string;
}) {
  const payload = await apiFetch<unknown>("/api/v1/prayer/times", {
    method: "POST",
    body: input,
    auth: false,
  });
  return normalizePrayerTimes(payload);
}

/* --------------------------------- habits -------------------------------- */

export function logPrayer(input: {
  prayer: PrayerName;
  status: PrayerStatus;
  date?: string;
}) {
  return apiFetch<PrayerLogEntry>("/api/v1/habits/prayers/log", {
    method: "POST",
    body: input,
  });
}

/**
 * Fetch today's prayer status from the correct endpoint.
 * DRIFT FIX: previous version called GET /api/v1/habits/prayers/log which
 * does not exist in openapi.json. Correct endpoint is /api/v1/habits/prayers/status.
 */
export async function getPrayerStatus(date: string) {
  const payload = await apiFetch<unknown>("/api/v1/habits/prayers/status", {
    query: { date },
  }).catch(() => null);

  const record = (payload ?? {}) as Record<string, unknown>;
  const map = {} as Partial<Record<PrayerName, PrayerStatus>>;
  for (const name of PRAYER_NAMES) {
    const val = record[name];
    if (typeof val === "string") map[name] = val as PrayerStatus;
  }
  return map;
}

export function getPrayerConsistency() {
  return apiFetch<ConsistencyMetrics>("/api/v1/habits/prayers/consistency");
}

export function getDhikrSummary(date?: string) {
  return apiFetch<DhikrDailySummaryResponse>("/api/v1/dhikr/summary", { query: { date } });
}

export function getDhikrItems(category?: DhikrCategory) {
  return apiFetch<DhikrItemResponse[]>("/api/v1/dhikr/items", {
    auth: false,
    query: category ? { category } : undefined,
  });
}

export function logDhikrSession(body: DhikrLogRequest) {
  return apiFetch<DhikrLogResponse>("/api/v1/dhikr/sessions", {
    method: "POST",
    body,
  });
}

/* --------------------------------- quran --------------------------------- */

export function getWeeklyQuranSummary() {
  return apiFetch<QuranWeeklySummaryResponse>(
    "/api/v1/quran/reading-progress/summary/weekly",
  );
}

export function getSurahs() {
  return apiFetch<SurahResponse[]>("/api/v1/quran/surahs", { auth: false });
}

export function getSurahAyahs(surahNumber: number) {
  return apiFetch<SurahAyahsResponse>(
    `/api/v1/quran/surahs/${surahNumber}/ayahs`,
    { auth: false },
  );
}

export function getBookmarks() {
  return apiFetch<BookmarkResponse[]>("/api/v1/quran/bookmarks");
}

export function addBookmark(body: BookmarkRequest) {
  return apiFetch<BookmarkResponse>("/api/v1/quran/bookmarks", {
    method: "POST",
    body,
  });
}

export function removeBookmark(surahNumber: number, ayahNumber: number) {
  return apiFetch<null>(
    `/api/v1/quran/bookmarks/${surahNumber}/${ayahNumber}`,
    { method: "DELETE" },
  );
}

export function getReadingProgress() {
  return apiFetch<ReadingProgressResponse[]>("/api/v1/quran/reading-progress");
}

export function updateReadingProgress(body: ReadingProgressRequest) {
  return apiFetch<ReadingProgressResponse>("/api/v1/quran/reading-progress", {
    method: "PUT",
    body,
  });
}

/* ---------------------------------- ai ---------------------------------- */

export function createConversation() {
  return apiFetch<CreateConversationResponse>("/api/v1/ai/conversations", {
    method: "POST",
  });
}

export function sendAiMessage(convId: string, content: string) {
  return apiFetch<AIMessage>(`/api/v1/ai/conversations/${convId}/messages`, {
    method: "POST",
    body: { content, include_memory: false },
  });
}

export function getConversation(convId: string) {
  return apiFetch<ConversationResponse>(`/api/v1/ai/conversations/${convId}`);
}

export function listConversations() {
  return apiFetch<ConversationResponse[]>("/api/v1/ai/conversations");
}

export function deleteConversation(convId: string) {
  return apiFetch<null>(`/api/v1/ai/conversations/${convId}`, { method: "DELETE" });
}

export function listMemory() {
  return apiFetch<MemoryEntryResponse[]>("/api/v1/ai/memory");
}

export function deleteMemoryEntry(entryId: string) {
  return apiFetch<null>(`/api/v1/ai/memory/${entryId}`, { method: "DELETE" });
}

/* -------------------------------- family -------------------------------- */

export function listMyFamilies() {
  return apiFetch<Family[]>("/api/v1/families");
}

export function createFamily(name: string) {
  return apiFetch<Family>("/api/v1/families", { method: "POST", body: { name } });
}

export function getFamily(familyId: string) {
  return apiFetch<Family>(`/api/v1/families/${familyId}`);
}

export function inviteMember(familyId: string, email: string, role: string) {
  return apiFetch<FamilyInvitation>(`/api/v1/families/${familyId}/invitations`, {
    method: "POST",
    body: { invited_email: email, role },
  });
}

export function listInvitations(familyId: string) {
  return apiFetch<FamilyInvitation[]>(`/api/v1/families/${familyId}/invitations`);
}

export function acceptInvitation(invitationId: string, email: string) {
  return apiFetch<unknown>(`/api/v1/families/invitations/${invitationId}/accept`, {
    method: "POST",
    body: { email },
  });
}

export function removeMember(familyId: string, memberId: string) {
  return apiFetch<null>(`/api/v1/families/${familyId}/members/${memberId}`, {
    method: "DELETE",
  });
}

export function deleteFamily(familyId: string) {
  return apiFetch<null>(`/api/v1/families/${familyId}`, { method: "DELETE" });
}

export function revokeInvitation(familyId: string, invitationId: string) {
  return apiFetch<null>(`/api/v1/families/${familyId}/invitations/${invitationId}`, {
    method: "DELETE",
  });
}

/* ------------------------------- fasting -------------------------------- */

export function logFasting(body: { date?: string; type: string }) {
  return apiFetch<{ id: string; date: string; type: string }>("/api/v1/habits/fasting/log", {
    method: "POST",
    body,
  });
}

export function getFastingStatus(date?: string) {
  return apiFetch<{ date: string; fasting: boolean; type: string | null }>(
    "/api/v1/habits/fasting/status",
    { query: { date } },
  );
}
