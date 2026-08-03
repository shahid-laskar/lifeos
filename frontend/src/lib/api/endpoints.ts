export * from "./types";
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
  DuaItemResponse,
  Family,
  FamilyInvitation,
  HadithBookmarkResponse,
  HadithChapterResponse,
  HadithCollectionResponse,
  HadithItemResponse,
  HadithSearchResponse,
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
  TafsirResponse,
  UserProfile,
  MemorisationProgress,
  HifdhReviewItem,
  PrayerJournalEntry,
  PrayerInsights,
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
  const source = (record.times ?? record.prayer_times ?? record) as Record<string, unknown>;
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
    high_latitude_adjustment_applied: record.high_latitude_adjustment_applied === true,
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
  method?: string;
  asr_method?: string;
}) {
  const payload = await apiFetch<unknown>("/api/v1/prayer/times", {
    method: "POST",
    body: {
      latitude: input.latitude,
      longitude: input.longitude,
      timezone_offset_hours: input.utc_offset,
      date: input.date,
      method: input.method,
      asr_method: input.asr_method,
    },
    auth: false,
  });
  return normalizePrayerTimes(payload);
}

/* --------------------------------- habits -------------------------------- */

export function logPrayer(input: { prayer: PrayerName; status: PrayerStatus; date?: string }) {
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

export function getPrayerJournal() {
  return apiFetch<PrayerJournalEntry[]>("/api/v1/habits/prayers/journal");
}

export function logPrayerJournal(body: {
  prayer_name: string;
  date: string;
  khushoo_rating: number;
  notes: string;
  distractions: string;
}) {
  return apiFetch<PrayerJournalEntry>("/api/v1/habits/prayers/journal", { method: "POST", body });
}

export function getPrayerInsights() {
  return apiFetch<PrayerInsights>("/api/v1/habits/prayers/insights");
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
  return apiFetch<QuranWeeklySummaryResponse>("/api/v1/quran/reading-progress/summary/weekly");
}

export function getDua(duaId: string) {
  return apiFetch<DuaItemResponse>(`/api/v1/duas/${duaId}`, { auth: false });
}

export function getDuaBookmarks() {
  return apiFetch<DuaBookmarkItemResponse[]>("/api/v1/duas/favourites/bookmarks");
}

export function addDuaBookmark(duaId: string) {
  return apiFetch<{ id: string; dua_id: string }>("/api/v1/duas/favourites", {
    method: "POST",
    body: { dua_id: duaId },
  });
}

export function removeDuaBookmark(duaId: string) {
  return apiFetch<null>(`/api/v1/duas/favourites/${duaId}`, { method: "DELETE" });
}

export function getSurahs() {
  return apiFetch<SurahResponse[]>("/api/v1/quran/surahs", { auth: false });
}

export function getSurahAyahs(surahNumber: number) {
  return apiFetch<SurahAyahsResponse>(`/api/v1/quran/surahs/${surahNumber}/ayahs`, { auth: false });
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
  return apiFetch<null>(`/api/v1/quran/bookmarks/${surahNumber}/${ayahNumber}`, {
    method: "DELETE",
  });
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

export function getAyahTafsir(surahNumber: number, ayahNumber: number, source?: string) {
  return apiFetch<TafsirResponse>(
    `/api/v1/quran/surahs/${surahNumber}/ayahs/${ayahNumber}/tafsir`,
    { query: source ? { source } : undefined },
  );
}

export function getHifdhProgress() {
  return apiFetch<MemorisationProgress[]>("/api/v1/quran/memorisation/progress");
}

export function getHifdhTodayReview() {
  return apiFetch<HifdhReviewItem[]>("/api/v1/quran/memorisation/today-review");
}

export function markAyahMemorised(surahNumber: number, ayahNumber: number) {
  return apiFetch<null>("/api/v1/quran/memorisation/mark", {
    method: "POST",
    body: { surah_number: surahNumber, ayah_number: ayahNumber },
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

/* --------------------------------- duas ---------------------------------- */

export function getDuaCategories() {
  return apiFetch<string[]>("/api/v1/duas/categories");
}

export function getDuas(category?: string) {
  return apiFetch<DuaItemResponse[]>("/api/v1/duas", {
    query: category ? { category } : undefined,
  });
}

/* -------------------------------- hadith --------------------------------- */

export function getHadithCollections() {
  return apiFetch<HadithCollectionResponse[]>("/api/v1/hadith/collections");
}

export function getHadithChapters(slug: string) {
  return apiFetch<HadithChapterResponse[]>(`/api/v1/hadith/collections/${slug}/chapters`);
}

export function getHadithChapterItems(slug: string, chapterId: number) {
  return apiFetch<HadithItemResponse[]>(`/api/v1/hadith/collections/${slug}/chapters/${chapterId}`);
}

export function getHadith(hadithId: string) {
  return apiFetch<HadithItemResponse>(`/api/v1/hadith/${hadithId}`);
}

export function searchHadiths(input: { q: string; collection?: string; limit?: number }) {
  return apiFetch<HadithSearchResponse>("/api/v1/hadith/search", {
    query: {
      q: input.q,
      collection: input.collection,
      limit: input.limit,
    },
  });
}

export function listHadithBookmarks() {
  return apiFetch<HadithBookmarkResponse[]>("/api/v1/hadith/bookmarks");
}

export function addHadithBookmark(hadithId: string, note?: string) {
  return apiFetch<HadithBookmarkResponse>("/api/v1/hadith/bookmarks", {
    method: "POST",
    body: { hadith_id: hadithId, note },
  });
}

export function removeHadithBookmark(hadithId: string) {
  return apiFetch<void>(`/api/v1/hadith/bookmarks/${hadithId}`, {
    method: "DELETE",
  });
}

/* ------------------------------- learning -------------------------------- */

import type { LearningPathResponse, LearningEnrollmentResponse } from "./types";

export function listLearningPaths() {
  return apiFetch<LearningPathResponse[]>("/api/v1/learning/paths");
}

export function getLearningPath(pathId: string) {
  return apiFetch<LearningPathResponse>(`/api/v1/learning/paths/${pathId}`);
}

export function getLearningEnrollments() {
  return apiFetch<LearningEnrollmentResponse[]>("/api/v1/learning/enrollments");
}

export function enrollInPath(pathId: string) {
  return apiFetch<LearningEnrollmentResponse>("/api/v1/learning/enrollments", {
    method: "POST",
    body: JSON.stringify({ path_id: pathId }),
  });
}

// ── Health Domain (Phase 7) ───────────────────────────────────────────────────────────────

export function getSleepLogs() {
  return apiFetch<SleepLogResponse[]>("/api/v1/health/sleep");
}

export function createSleepLog(data: SleepLogCreate) {
  return apiFetch<SleepLogResponse>("/api/v1/health/sleep", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getExerciseLogs() {
  return apiFetch<ExerciseLogResponse[]>("/api/v1/health/exercise");
}

export function createExerciseLog(data: ExerciseLogCreate) {
  return apiFetch<ExerciseLogResponse>("/api/v1/health/exercise", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getEnergyLogs() {
  return apiFetch<EnergyLogResponse[]>("/api/v1/health/energy");
}

export function createEnergyLog(data: EnergyLogCreate) {
  return apiFetch<EnergyLogResponse>("/api/v1/health/energy", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Planner ─────────────────────────────────────────────────────────────

export function getPlannerDay(date: string) {
  return apiFetch<PlannerDayResponse>(`/api/v1/planner/days/${date}`);
}

export function addTimeBlock(date: string, data: TimeBlockCreate) {
  return apiFetch<TimeBlockResponse>(`/api/v1/planner/days/${date}/blocks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTimeBlock(blockId: string, data: TimeBlockUpdate) {
  return apiFetch<TimeBlockResponse>(`/api/v1/planner/blocks/${blockId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTimeBlock(blockId: string) {
  return apiFetch<void>(`/api/v1/planner/blocks/${blockId}`, {
    method: "DELETE",
  });
}

// ── Tasks ─────────────────────────────────────────────────────────────

export function getTasks(project?: string, dueBefore?: string) {
  const params = new URLSearchParams();
  if (project) params.append("project", project);
  if (dueBefore) params.append("due_before", dueBefore);
  const qs = params.toString();
  const url = `/api/v1/tasks${qs ? `?${qs}` : ''}`;
  return apiFetch<TaskResponse[]>(url);
}

export function createTask(data: TaskCreate) {
  return apiFetch<TaskResponse>(`/api/v1/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(taskId: string, data: TaskUpdate) {
  return apiFetch<TaskResponse>(`/api/v1/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTask(taskId: string) {
  return apiFetch<void>(`/api/v1/tasks/${taskId}`, {
    method: "DELETE",
  });
}

// ── Goals ─────────────────────────────────────────────────────────────

export function getGoals() {
  return apiFetch<GoalResponse[]>("/api/v1/goals");
}

export function createGoal(data: GoalCreate) {
  return apiFetch<GoalResponse>("/api/v1/goals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateGoal(goalId: string, data: GoalUpdate) {
  return apiFetch<GoalResponse>(`/api/v1/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteGoal(goalId: string) {
  return apiFetch<void>(`/api/v1/goals/${goalId}`, {
    method: "DELETE",
  });
}

export function addMilestone(goalId: string, data: GoalMilestoneCreate) {
  return apiFetch<GoalMilestoneResponse>(`/api/v1/goals/${goalId}/milestones`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMilestone(milestoneId: string, data: GoalMilestoneUpdate) {
  return apiFetch<GoalMilestoneResponse>(`/api/v1/goals/milestones/${milestoneId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteMilestone(milestoneId: string) {
  return apiFetch<void>(`/api/v1/goals/milestones/${milestoneId}`, {
    method: "DELETE",
  });
}

// ── Calendar ─────────────────────────────────────────────────────────────

export function getEvents(startTime?: string, endTime?: string) {
  const params = new URLSearchParams();
  if (startTime) params.append("start_time", startTime);
  if (endTime) params.append("end_time", endTime);
  const qs = params.toString();
  const url = `/api/v1/calendar/events${qs ? `?${qs}` : ''}`;
  return apiFetch<EventResponse[]>(url);
}

export function createEvent(data: EventCreate) {
  return apiFetch<EventResponse>("/api/v1/calendar/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEvent(eventId: string, data: EventUpdate) {
  return apiFetch<EventResponse>(`/api/v1/calendar/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteEvent(eventId: string) {
  return apiFetch<void>(`/api/v1/calendar/events/${eventId}`, {
    method: "DELETE",
  });
}

// ── Weekly Reviews ─────────────────────────────────────────────────────────────

export function getWeeklyReviews() {
  return apiFetch<WeeklyReviewResponse[]>("/api/v1/reviews/weekly");
}

export function getCurrentWeeklyReview() {
  return apiFetch<WeeklyReviewResponse | {}>("/api/v1/reviews/weekly/current");
}

export function saveWeeklyReview(data: WeeklyReviewCreate) {
  return apiFetch<WeeklyReviewResponse>("/api/v1/reviews/weekly", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Productivity ─────────────────────────────────────────────────────────────

export function getFocusSessions() {
  return apiFetch<FocusSessionResponse[]>("/api/v1/productivity/focus-sessions");
}

export function logFocusSession(data: FocusSessionCreate) {
  return apiFetch<FocusSessionResponse>("/api/v1/productivity/focus-sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Custom Habits (Phase 5A) ─────────────────────────────────────────────────────────────

export function getCustomHabits() {
  return apiFetch<GenericHabitResponse[]>("/api/v1/habits/custom");
}

export function createCustomHabit(data: GenericHabitCreate) {
  return apiFetch<GenericHabitResponse>("/api/v1/habits/custom", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCustomHabit(habitId: string, data: GenericHabitUpdate) {
  return apiFetch<GenericHabitResponse>(`/api/v1/habits/custom/${habitId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCustomHabit(habitId: string) {
  return apiFetch<void>(`/api/v1/habits/custom/${habitId}`, {
    method: "DELETE",
  });
}

export function toggleCustomHabitCompletion(habitId: string, date: string) {
  return apiFetch<GenericHabitResponse>(`/api/v1/habits/custom/${habitId}/toggle?date=${date}`, {
    method: "POST",
  });
}

// ── Reflection Journal (Phase 5B) ─────────────────────────────────────────────────────────────

export function getJournalEntries() {
  return apiFetch<JournalEntryResponse[]>("/api/v1/journal/entries");
}

export function createJournalEntry(data: JournalEntryCreate) {
  return apiFetch<JournalEntryResponse>("/api/v1/journal/entries", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateJournalEntry(entryId: string, data: JournalEntryUpdate) {
  return apiFetch<JournalEntryResponse>(`/api/v1/journal/entries/${entryId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteJournalEntry(entryId: string) {
  return apiFetch<void>(`/api/v1/journal/entries/${entryId}`, {
    method: "DELETE",
  });
}

// ── Reading Tracker (Phase 5C) ─────────────────────────────────────────────────────────────

export function getBooks() {
  return apiFetch<BookResponse[]>("/api/v1/reading/books");
}

export function createBook(data: BookCreate) {
  return apiFetch<BookResponse>("/api/v1/reading/books", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBook(bookId: string, data: BookUpdate) {
  return apiFetch<BookResponse>(`/api/v1/reading/books/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteBook(bookId: string) {
  return apiFetch<void>(`/api/v1/reading/books/${bookId}`, {
    method: "DELETE",
  });
}

// ── Skills Roadmaps (Phase 5D) ─────────────────────────────────────────────────────────────

export function getSkills() {
  return apiFetch<SkillResponse[]>("/api/v1/skills");
}

export function createSkill(data: SkillCreate) {
  return apiFetch<SkillResponse>("/api/v1/skills", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateSkill(skillId: string, data: SkillUpdate) {
  return apiFetch<SkillResponse>(`/api/v1/skills/${skillId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteSkill(skillId: string) {
  return apiFetch<void>(`/api/v1/skills/${skillId}`, {
    method: "DELETE",
  });
}

export function updateSkillMilestone(milestoneId: string, data: SkillMilestoneUpdate) {
  return apiFetch<SkillMilestoneResponse>(`/api/v1/skills/milestones/${milestoneId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Family Extended (Phase 6) ─────────────────────────────────────────────────────────────

export function getFamilyEvents(familyId: string) {
  return apiFetch<FamilyEventResponse[]>(`/api/v1/families/${familyId}/events`);
}

export function createFamilyEvent(familyId: string, data: FamilyEventCreate) {
  return apiFetch<FamilyEventResponse>(`/api/v1/families/${familyId}/events`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteFamilyEvent(familyId: string, eventId: string) {
  return apiFetch<void>(`/api/v1/families/${familyId}/events/${eventId}`, {
    method: "DELETE",
  });
}

export function getFamilyGoals(familyId: string) {
  return apiFetch<FamilyGoalResponse[]>(`/api/v1/families/${familyId}/goals`);
}

export function createFamilyGoal(familyId: string, data: FamilyGoalCreate) {
  return apiFetch<FamilyGoalResponse>(`/api/v1/families/${familyId}/goals`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getFamilyTasks(familyId: string) {
  return apiFetch<FamilyTaskResponse[]>(`/api/v1/families/${familyId}/tasks`);
}

export function createFamilyTask(familyId: string, data: FamilyTaskCreate) {
  return apiFetch<FamilyTaskResponse>(`/api/v1/families/${familyId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function toggleFamilyTask(familyId: string, taskId: string) {
  return apiFetch<FamilyTaskResponse>(`/api/v1/families/${familyId}/tasks/${taskId}/toggle`, {
    method: "POST",
  });
}

export function completeLearningModule(moduleId: string) {
  return apiFetch<LearningEnrollmentResponse>("/api/v1/learning/enrollments/complete-module", {
    method: "POST",
    body: { module_id: moduleId },
  });
}
