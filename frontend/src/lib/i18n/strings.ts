/**
 * Externalised UI strings.
 *
 * Per 093_Frontend_Internationalization.md: all user-visible text is
 * externalised here. Components import strings from this module rather than
 * hardcoding English text. This makes future translation straightforward
 * without touching component code.
 *
 * RTL languages: set `dir="rtl"` on the root element when locale is Arabic.
 * The design tokens already support RTL layout (index.css).
 */

export const strings = {
  // ── App shell ─────────────────────────────────────────────────────────────
  app: {
    name: 'Muslim Life OS',
    tagline: 'Your companion',
    signOut: 'Sign out',
    signedOut: 'Signed out. As-salāmu ʿalaykum.',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  nav: {
    dashboard: 'Dashboard',
    prayer: 'Prayer Times',
    quran: "Qur'an",
    dhikr: 'Dhikr',
    habits: 'Habits',
    profile: 'Profile',
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    email: 'Email address',
    password: 'Password',
    signIn: 'Sign in',
    register: 'Create account',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset password',
    backToSignIn: 'Back to sign in',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    termsRequired: 'You must accept the terms to continue.',
    termsLabel: 'I accept the terms of service',
    sessionExpired: 'Your session has expired. Please sign in again.',
  },

  // ── Offline / connectivity ─────────────────────────────────────────────────
  offline: {
    banner: 'You are offline. Cached content remains available; changes will sync when you reconnect.',
    savedLocally: 'Saved locally. Will sync when you reconnect.',
  },

  // ── Generic UI states ──────────────────────────────────────────────────────
  state: {
    loading: 'Loading…',
    error: 'Something went wrong',
    errorDetail: 'This screen could not be displayed. You can try again without losing your session.',
    retry: 'Try again',
    empty: 'Nothing here yet.',
    noData: 'No data available.',
  },

  // ── Prayer ────────────────────────────────────────────────────────────────
  prayer: {
    title: 'Prayer Times',
    subtitle: 'Today\'s times for your location.',
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    logPrayer: 'Log prayer',
    completed: 'Completed',
    missed: 'Missed',
    excused: 'Excused',
    consistency: 'Consistency',
    highLatitudeNote: 'High-latitude adjustment applied. Times are estimated.',
  },

  // ── Quran ──────────────────────────────────────────────────────────────────
  quran: {
    title: 'The Noble Qur\'an',
    subtitle: 'Read at your own pace.',
    back: 'Back',
    savePosition: 'Save your reading position',
    savePositionHint: 'Mark the last ayah you read. This is optional and does not interrupt reading.',
    lastAyahNumber: 'Last Ayah Number',
    saveButton: 'Save Position',
    progressSaved: 'Reading progress saved.',
    progressQueued: 'Progress saved locally. It will sync when you reconnect.',
    progressError: 'Could not save progress. Please check ayah number.',
    ayahsLoadError: 'The ayahs could not be loaded right now. Please check your connection and try again.',
    textCredit: 'Arabic text: Tanzil Project · Uthmani text, CC BY 3.0',
  },

  // ── Dhikr ────────────────────────────────────────────────────────────────
  dhikr: {
    title: 'Dhikr',
    subtitle: 'Remembrance of Allah.',
    logSession: 'Log session',
    logCount: 'Count',
    logButton: 'Log',
    logged: 'Dhikr logged.',
    logError: 'Could not log dhikr.',
  },

  // ── Habits ────────────────────────────────────────────────────────────────
  habits: {
    title: 'Prayer Consistency',
    subtitle: 'Track your prayer habit over time.',
    logTitle: 'Log a prayer',
    consistencyTitle: 'Consistency',
    of30Days: 'of the last 30 days',
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  profile: {
    title: 'Profile',
    save: 'Save changes',
    saved: 'Profile updated.',
    saveError: 'Could not update profile.',
    timezone: 'Timezone',
    country: 'Country',
    language: 'Preferred language',
    prayerMethod: 'Prayer calculation method',
    asrMethod: 'Asr calculation method',
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    greeting: 'As-salāmu ʿalaykum',
    title: 'Dashboard',
  },
} as const

export type StringKey = typeof strings
