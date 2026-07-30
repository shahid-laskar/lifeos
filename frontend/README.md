# Serene Spirit

Build a React + TypeScript frontend for **Muslim Life OS** — a spiritual productivity app for Muslims.

## API

All endpoints are documented in `openapi.json` at the repo root. Base URL comes from `import.meta.env.VITE_API_URL`. Auth is Bearer token (JWT). Store `access_token` and `refresh_token` in memory (not localStorage). On 401, use `POST /api/v1/auth/refresh` to get a new token silently.

## Design Language

- Palette: deep teal (#1B4D3E) primary, warm cream (#FAF6F0) background, soft gold (#C9A84C) accent, muted sage (#7A9E7E) secondary

- Typography: Amiri or Scheherazade for Arabic text, Inter for Latin UI text

- Motif: subtle Islamic geometric patterns (8-point star) as background texture on cards — SVG, not images

- Feel: calm, unhurried, non-gamified. No streaks. No badges. No pressure.

- RTL-ready layout (Arabic support)

## App Structure — 6 screens with bottom tab navigation:

### 1. 🏠 Home (Dashboard)

- Today's prayer times strip (Fajr / Dhuhr / Asr / Maghrib / Isha) with the next prayer highlighted and a countdown timer

- Prayer status row — 5 tap-to-log circles (completed ✓ / missed ✗ / excused ~) using `POST /api/v1/habits/prayers/log`

- Dhikr quick-counter widget — shows today's morning + evening totals from `GET /api/v1/dhikr/summary`

- Weekly Quran summary: "Read X surahs over Y days" from `GET /api/v1/quran/reading-progress/summary/weekly`

- Consistency card: "X / 30 days all 5 prayers" from `GET /api/v1/habits/prayers/consistency`

### 2. 📖 Quran

- Surah list from `GET /api/v1/quran/surahs` — show arabic_name, transliterated_name, meaning, ayah_count, revelation_type (Meccan/Medinan badge)

- Tap surah → ayah reader using `GET /api/v1/quran/surahs/{surah_number}/ayahs` — large Arabic text (Amiri font, RTL, 28px+), ayah number in a circle

- Bookmark button on each ayah → `POST /api/v1/quran/bookmarks`; bookmarked ayahs show a gold ribbon

- Reading progress auto-saved on scroll via `PUT /api/v1/quran/reading-progress`

- Bookmarks tab: list from `GET /api/v1/quran/bookmarks` with delete option

### 3. 📿 Dhikr

- Category tabs: Morning / Evening / Post-Prayer / General (maps to `DhikrCategory` enum)

- Cards fetched from `GET /api/v1/dhikr/items?category=...`

- Each card shows: arabic_text (large, RTL), transliteration (italic), meaning, source, recommended_count

- Tap-to-count button: large circular button with current count / recommended_count (e.g. "23 / 33")

- On reaching recommended_count, subtle gold pulse animation — no confetti, no fanfare

- "Log Session" button → `POST /api/v1/dhikr/sessions`

- Daily summary bar at bottom showing morning / evening / post_prayer / general totals

### 4. 🤖 AI Assistant

- Chat UI using `POST /api/v1/ai/conversations` to create, then `POST /api/v1/ai/conversations/{id}/messages`

- Show `safety_outcome` subtly — a small shield icon on refused/flagged messages

- Conversation list from `GET /api/v1/ai/conversations` — tap to resume

- Memory panel: list from `GET /api/v1/ai/memory` with delete per entry

- `include_memory` toggle in the composer

### 5. 👨‍👩‍👧 Families

- Family list from `GET /api/v1/families`

- Create family: name input → `POST /api/v1/families`

- Members list with role badge (owner / member) and joined date

- Invite by email → `POST /api/v1/families/{family_id}/invitations`

- Accept invitation flow → `POST /api/v1/families/invitations/{invitation_id}/accept`

- Remove member → `DELETE /api/v1/families/{family_id}/members/{member_id}`

### 6. ⚙️ Settings / Profile

- Profile form (PATCH `/api/v1/users/me/profile`): country (2-char), timezone, lat/lng, prayer_calculation_method (MWL / ISNA / EGYPTIAN / UMM_AL_QURA / KARACHI / TEHRAN), asr_method (STANDARD / HANAFI — show a helpful note explaining the difference), goals (multi-select from OnboardingGoal enum), preferred_language

- Onboarding progress checklist from `GET /api/v1/users/me/onboarding-status` — show as 4 checkmarks at top of settings

- Data transparency section: "What we hold" from `GET /api/v1/governance/my-data`, "Our data policy" from `GET /api/v1/governance/data-policy`

- Logout button (clears tokens)

## Auth Screens (outside tab nav)

- Register: email, password (min 8 chars), terms_accepted checkbox, preferred_language → `POST /api/v1/auth/register`

- Login: email + password → `POST /api/v1/auth/login`

- Forgot password flow: email → `POST /api/v1/auth/request-password-reset`, then token + new password → `POST /api/v1/auth/reset-password`

- Show generic success message on password reset request regardless of email existence (the API intentionally does this for privacy)

## Onboarding Flow

After registration, if `first_meaningful_outcome_available` is false, walk the user through:

1. Set location (lat/lng — use browser geolocation)

2. Choose prayer calculation method + asr method

3. Choose goals (multi-select)

Then redirect to Home where prayer times now appear personalised.

## Key Implementation Rules

- Prayer times for unauthenticated users: use `POST /api/v1/prayer/times` with browser geolocation + UTC offset

- Authenticated users: use `GET /api/v1/prayer/times/me`

- All Arabic text: `font-family: 'Amiri', serif; direction: rtl; text-align: right`

- No streak counters anywhere — the API doesn't expose them and the app philosophy rejects them

- Error states: calm, plain language ("Couldn't load prayer times — check your connection"), no red alerts

- Empty states: warm and inviting ("Your dhikr journey starts here")

- Loading states: simple Arabic-inspired spinner (rotating 8-point star SVG)

- All dates default to today in the user's timezone

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://oasis-of-serenity.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48653340-dd8c-4e52-b4af-9d31a02f6a7a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
