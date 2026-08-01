# Muslim Life OS — Comprehensive Frontend Redesign Plan

## 1. Executive Summary

This plan is the result of a thorough audit of the **entire frontend codebase** (50+ files), the **design documentation corpus** (Volumes 00–10), and **competitive UX research** of 15+ best-in-class apps including Tarteel, Pillars, Muslim Pro, Daylio, Finch, Headspace, Things 3, and Apple Health.

### Current State
The app has a solid technical foundation — TanStack Router, React Query, shadcn/ui, Tailwind v4 — and covers Prayer Times, Qur'an Reading, Dhikr, Du'as, Hadith, AI Assistant, Family, and basic Settings. Phase 3 P1 added Prayer Journal, Hifdh Tracker, and Tafsir Explorer.

### Core Problem
**The app feels like a feature checklist, not a spiritual companion.** While functionally correct, it lacks the emotional resonance, visual delight, data insights, and polished UX flows that distinguish a "good Islamic app" from a beloved daily companion. Key issues:

1. **Dashboard is flat** — just stacked cards with no hierarchy, no time-awareness, no personalization
2. **Prayer logging is too mechanical** — tap-to-cycle is efficient but soulless; no reflection prompt, no sense of accomplishment
3. **Dhikr counter lacks immersion** — no haptic feel, no breathing rhythm, no session flow
4. **Qur'an reader has performance issues** — DOM-querying on every scroll tick, no virtualization
5. **Empty states are generic** — missed opportunity for warmth and guidance
6. **No data insights anywhere** — users log data but never see patterns or trends
7. **Accessibility gaps** — missing skeleton loaders, dynamic RTL, keyboard navigation
8. **No offline support** — critical for a daily spiritual app

---

## 2. Audit Findings (By Feature)

### 2A. Home Dashboard (`home.tsx`, `summary-cards.tsx`, `prayer-times-strip.tsx`, `prayer-status-row.tsx`)

| Issue | Severity | Details |
|-------|----------|---------|
| **No time-of-day awareness** | 🔴 High | Dashboard looks identical at Fajr (5 AM) and Isha (10 PM). Best-in-class apps (Muslim Pro, Athan) shift visuals based on prayer time — dawn gradients at Fajr, night sky at Isha. |
| **Prayer status has no loading skeleton** | 🟡 Medium | When `statuses` is undefined (loading), buttons render in "unlogged" dashed state, causing a visual pop-in when real data arrives. |
| **Du'a and Hadith widgets are static links** | 🟡 Medium | They just say "Explore Du'as" / "Browse Hadith" — missed opportunity for "Du'a of the Day" or "Daily Hadith" with actual content. |
| **Consistency card uses raw numbers** | 🟡 Medium | "12 / 30 days" is data but not insight. Should say something like "You've been consistent with Fajr — 6 of last 7 days." |
| **No greeting or bismillah** | 🟡 Medium | No personalized welcome (e.g., "Assalamu Alaikum, Shahid"). No Islamic date (Hijri) displayed. |
| **Cards stack vertically with no visual hierarchy** | 🟡 Medium | Every card looks the same. The prayer banner is distinct but everything below is uniform — no clear "most important thing right now." |
| **No fasting widget on dashboard** | 🟡 Medium | Fasting logging exists in the backend but has no dashboard presence. |

### 2B. Prayer Logging (`prayer-status-row.tsx`)

| Issue | Severity | Details |
|-------|----------|---------|
| **Tap-to-cycle is unintuitive** | 🔴 High | Users must know to tap multiple times to cycle through completed → missed → excused. No visual affordance explaining this. Research (Pillars app) shows tap-and-hold or swipe patterns are more intentional. |
| **No undo support** | 🟡 Medium | Accidentally marking a prayer as "missed" requires cycling through again. Per design docs: "Prefer undo over confirmation dialog." |
| **No prayer-time-aware suggestion** | 🟡 Medium | After a prayer time passes, the app should gently prompt "How was your Dhuhr?" rather than waiting for the user to remember to log. |
| **Optimistic update is excellent** | ✅ Good | The mutation uses `onMutate` to cancel queries, inject optimistic state, and rollback on error. Well-implemented. |

### 2C. Prayer Journal (`prayer-journal.tsx`)

| Issue | Severity | Details |
|-------|----------|---------|
| **Journal entry form is basic** | 🟡 Medium | Plain `<select>` for prayer, a number input for khushoo, and a textarea. No visual warmth. Compare to Reflectly's mood-selection sliders or Daylio's icon-based input. |
| **No journal history view** | 🔴 High | The plan calls for "journal history view" but there's no list of past entries — only a form and insights. |
| **Insights are rudimentary** | 🟡 Medium | Just "average khushoo rating" and "top distractions." Should show trends over time (chart), correlations, and gentle encouragement. |
| **Khushoo rating is a number input** | 🟡 Medium | Should be a visual slider or star/heart/moon rating with gentle labels (e.g., 1="Struggled" → 5="Deep presence"). |
| **No connection from prayer row** | 🟡 Medium | After logging a prayer as "completed," there should be an optional inline prompt: "How was your khushoo?" linking to the journal. |

### 2D. Qur'an Module (`quran.tsx`, `ayah-reader.tsx`, `surah-list.tsx`, `bookmarks-tab.tsx`, `hifdh-tab.tsx`)

| Issue | Severity | Details |
|-------|----------|---------|
| **Scroll-based progress tracking uses DOM queries** | 🔴 High | `querySelectorAll("article[id^='ayah-']")` runs on every scroll tick. Should use `IntersectionObserver` for performant, non-blocking scroll tracking. |
| **No translation alongside Arabic** | 🔴 High | Ayah reader only shows Arabic text. Most users need side-by-side or interleaved translation (like Quran.com). |
| **No audio recitation** | 🟡 Medium | Feature Catalogue lists audio. Not implemented yet. Users expect at least basic audio playback. |
| **Hifdh tab hardcodes `.slice(0, 10)`** | 🟡 Medium | Only shows first 10 surahs in progress grid. Should show all or use pagination/infinite scroll. |
| **No Bismillah header for surahs** | 🟡 Medium | Missing the traditional بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ header before Surah content (except Al-Fatiha and At-Tawbah). |
| **Tafsir UX is basic** | 🟡 Medium | Inline tafsir toggle works but the panel is visually flat. Should feel like opening a scholarly annotation. |
| **No reading mode / distraction-free** | 🟡 Medium | No ability to hide chrome and focus on reading. Tarteel and Quran.com offer clean reading modes. |
| **No verse context menu** | 🟡 Medium | No long-press/right-click on a verse to copy, share, or jump to related content. Tarteel's Navigator modal allows searching by surah number, name, or recent reads — we lack a similar jump-to-verse dialog. |
| **Surah search is good** | ✅ Good | Client-side instant filtering with transliterated names works well. |

### 2E. Dhikr Module (`dhikr.tsx`, `dhikr-card.tsx`, `dhikr-summary-bar.tsx`)

| Issue | Severity | Details |
|-------|----------|---------|
| **Counter lacks haptic/sensory feedback** | 🟡 Medium | Tapping should feel weighty. Best-in-class: Streaks uses long-press with haptic; tasbih apps use subtle vibration on each count. CSS `active:scale-95` is a start but insufficient. |
| **No session flow** | 🟡 Medium | User sees a list of dhikr items and taps individually. No guided "Morning Adhkar" session that walks through items one by one with progress. |
| **Summary bar clips on small screens** | 🟡 Medium | `fixed bottom-16` positioning may overlap with BottomTabs on some devices. |
| **No breathing/meditation rhythm** | 🟡 Medium | Dhikr is meditative. A pulsing circle or breathing animation (à la Headspace) would help users focus. |
| **Gold-pulse animation is subtle** | ✅ Good | Correctly avoids gamification while still providing completion feedback. |

### 2F. Du'as Module (`duas.tsx`, `dua-card.tsx`)

| Issue | Severity | Details |
|-------|----------|---------|
| **No favourites on UI** | 🟡 Medium | Backend has `POST /api/v1/duas/favourites` but the frontend doesn't implement favourite toggling. |
| **No category filtering** | 🟡 Medium | Du'as should be filterable by category (morning, evening, travel, food, sleep, etc.). |
| **No "Du'a of the Day" on home** | 🟡 Medium | Missed engagement opportunity. Display a rotating du'a on the dashboard. |

### 2G. Hadith Module (`hadith.tsx`, `hadith-card.tsx`)

| Issue | Severity | Details |
|-------|----------|---------|
| **Complex but well-structured** | ✅ Good | Has collection browser, chapter navigation, search, bookmarks. |
| **No "Hadith of the Day" on home** | 🟡 Medium | Same missed opportunity as Du'as. |
| **Search could show highlighted matches** | 🟢 Low | Search returns results but doesn't highlight the matched text within the hadith. |

### 2H. AI Assistant (`assistant.tsx`, conversation components)

| Issue | Severity | Details |
|-------|----------|---------|
| **Uses `ConversationResponse` type not exported** | 🟡 Medium | Fixed in recent commit but indicates fragile type exports. |
| **No AI is actually connected** | 🔴 High | Backend uses in-memory stub. Without a real LLM, the assistant is non-functional. |
| **Sidebar toggle pattern** | ✅ Good | Conversation list sidebar toggle works well on mobile. |

### 2I. Settings (`settings.tsx`, `settings-section.tsx`)

| Issue | Severity | Details |
|-------|----------|---------|
| **Settings are comprehensive** | ✅ Good | Location search, prayer method, Asr method, theme, data export link. |
| **Toast action type was broken** | ✅ Fixed | The `action` prop was missing from `ToastProps` — now resolved. |
| **No prayer notification settings** | 🟡 Medium | No way to configure reminders for prayer times. |

### 2J. Cross-Cutting Issues

| Issue | Severity | Details |
|-------|----------|---------|
| **No skeleton loaders** | 🔴 High | Design docs mandate "Never show blank screens." Currently using `StarSpinner` (a tiny rotating SVG) as the only loading indicator. Should use content-shaped skeleton placeholders. |
| **No offline support** | 🔴 High | Per `031_Offline_First_Experience.md`: Core features (prayer times, du'as, Qur'an, dhikr) MUST work offline. No service worker, no IndexedDB caching. |
| **Error component uses `window.location.href`** | 🟡 Medium | The root `ErrorComponent` uses `<a href="/">` for "Go home" instead of client-side navigation. |
| **Missing Hijri calendar** | 🟡 Medium | No Islamic date displayed anywhere. Listed as P1 in implementation plan. |
| **No global search** | 🟡 Medium | Listed as P1. Users should search across Qur'an, hadith, du'as, tasks, notes. |
| **Missing `prefers-reduced-motion` support** | 🟡 Medium | Animations (countdown timer, gold-pulse, etc.) don't check for reduced motion preference. |
| **RTL not dynamic** | 🟡 Medium | Root sets `dir="ltr"` statically. Arabic text blocks set `dir="rtl"` correctly per element, but if the app supports Arabic UI, the root direction must be dynamic. |
| **Forms lack Zod validation** | 🟡 Medium | Login, register, onboarding use manual state. `react-hook-form` + `zod` are in `package.json` but unused. |
| **No Qibla Compass** | 🟡 Medium | A fundamental Islamic tool. Can be computed entirely on-device using DeviceOrientation API + user coords. Should include calibration instruction and text fallback for screen readers (e.g., "Qibla: N 35° E"). |
| **No responsive/tablet layout** | 🟡 Medium | All views are single-column `max-w-2xl`. On tablet/desktop, should use multi-column layouts (e.g., prayer list + summary side-by-side). Bottom tabs should become a sidebar on wider screens. |
| **No i18n infrastructure** | 🟡 Medium | All UI strings are hardcoded English. Need `react-i18next` with translation keys for Arabic + English at minimum, so adding languages later doesn't require rewriting components. |
| **No auto day/night theme** | 🟢 Low | Theme is manual (light/dark/system). Pillars auto-adjusts UI based on prayer times — could optionally switch to dark mode between Isha and Fajr. |
| **No testing strategy** | 🟡 Medium | No unit tests, integration tests, or E2E tests for frontend. Need Jest + React Testing Library for components, Playwright for critical flows, and axe-core for accessibility CI checks. |

---

## 3. UX/UI Redesign Recommendations

### 3A. Dashboard Transformation — "Time-Aware Spiritual Companion"

**Inspiration:** Athan Pro (time-of-day visuals), Apple Health (modular cards), Headspace (calm, breathing UI)

**Current:** Flat stack of uniform cards.

**Proposed Layout:**
```
┌────────────────────────────────────┐
│  Assalamu Alaikum, Shahid          │
│  1 Muharram 1448 · Friday          │
│  ─────────────────────────────     │
│  ┌──────────────────────────────┐  │
│  │  🕌 NEXT: DHUHR in 1:42:05  │  │  ← Hero banner with
│  │  ﷲ    All times below        │  │     time-of-day gradient
│  │  Fajr  Dhuhr  Asr  Mgh  Isha│  │     (dawn → day → dusk → night)
│  └──────────────────────────────┘  │
│                                    │
│  ┌─────── Today's Prayers ───────┐ │
│  │  ● ● ● ○ ○                   │ │  ← Prayer circles with
│  │  F  D  A  M  I               │ │     gentle reflection prompt
│  │  "How was your Asr?" [link]  │ │     after each prayer passes
│  └──────────────────────────────┘  │
│                                    │
│  ┌─ Du'a ──┐  ┌─ Dhikr ────────┐  │
│  │ Morning │  │ 33/33 ⬤        │  │  ← 2-column compact cards
│  │ du'a... │  │ Subhanallah    │  │     with actual content
│  └─────────┘  └────────────────┘  │
│                                    │
│  ┌─ Qur'an This Week ──────────┐  │
│  │ ████░░░ 3 surahs · 5 days   │  │  ← Progress bar visualization
│  └──────────────────────────────┘  │
│                                    │
│  ┌─ Hadith of the Day ─────────┐  │
│  │ "Actions are by intentions"  │  │  ← Actual hadith content
│  │ — Sahih Bukhari             │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Dashboard shows Islamic greeting with user's first name
- [ ] Hijri date displayed alongside Gregorian
- [ ] Prayer banner uses time-of-day gradient backgrounds (4 themes: Fajr/dawn, daytime, Maghrib/sunset, Isha/night)
- [ ] After each prayer time passes, a gentle "reflection prompt" appears inline
- [ ] Du'a widget shows actual "Du'a of the Day" content (Arabic + translation)
- [ ] Hadith widget shows actual "Hadith of the Day" content
- [ ] All cards have skeleton loaders during data fetch
- [ ] Dashboard renders in < 200ms (no layout shift)

### 3B. Prayer Logging Reimagined — "Intentional, Not Mechanical"

**Inspiration:** Pillars (intentional prayer tracking), Streaks (long-press completion)

**Current:** Tap to cycle through 3 states.

**Proposed:**
- Replace tap-to-cycle with a **bottom sheet** that opens on tap, showing clear options: ✅ Prayed · ⊘ Missed · ⊖ Excused
- After marking "Prayed," show an optional **inline khushoo prompt** (1-5 rating with visual icons: 🌑🌘🌗🌖🌕) that collapses after 5 seconds
- Add an **undo toast** (10s per design spec) for accidental status changes
- Show **subtle completion animation** — the circle fills with a gentle color wash, not a bounce

**Acceptance Criteria:**
- [ ] Tapping a prayer circle opens a selection bottom sheet (not cycle)
- [ ] Bottom sheet shows 3 clear options with labels and icons
- [ ] After "Prayed," an optional khushoo micro-rating appears inline (dismissible)
- [ ] Undo toast appears for 10 seconds after any status change
- [ ] Undo toast has an "Undo" button that reverts the change
- [ ] All prayer states have smooth CSS transitions (200ms ease-out)
- [ ] `prefers-reduced-motion` disables animations
- [ ] Keyboard accessible: Enter/Space to open sheet, arrow keys to select

### 3C. Prayer Journal Elevation — "Reflective, Not Bureaucratic"

**Inspiration:** Daylio (icon-based mood input), Reflectly (slider-based journaling)

**Proposed:**
- Replace number input for khushoo with a **visual 5-point scale** using crescent moon phases (🌑🌘🌗🌖🌕) or gentle labels: "Struggled" → "Present" → "Deep Focus"
- Add a **journal history timeline** showing past entries with khushoo trend sparkline
- Add a **weekly prayer quality chart** (bar chart or line chart using Recharts, which is already in dependencies)
- Replace plain textarea with **prompt-guided input** (optional prompts like "What distracted you?" or "What helped you focus?")

**Acceptance Criteria:**
- [ ] Khushoo input is a visual scale (icons or labeled steps), not a number
- [ ] Journal history shows a scrollable list of past entries with date, prayer, rating
- [ ] Weekly insights include a Recharts bar chart of average khushoo by prayer
- [ ] "Top distractions" insight shows categorized items with counts
- [ ] Prompts are optional and collapsible
- [ ] Empty state for first-time users shows warmth: "Your first reflection awaits"

### 3D. Qur'an Reader Polish — "A Digital Mushaf Experience"

**Inspiration:** Tarteel (clean mushaf), Quran.com (translation + audio)

**Proposed:**
- Replace scroll-based DOM querying with **`IntersectionObserver`** for reading progress
- Add **interleaved English translation** below each ayah (togglable)
- Add **Bismillah header** before each surah (except At-Tawbah)
- Add **distraction-free reading mode** (hide header, bottom tabs, increase font)
- Virtualize the ayah list using **`react-window`** or similar for long surahs (Al-Baqarah has 286 ayahs)
- Add **font size slider** in reader header
- Add **verse context menu** — long-press or tap-and-hold on any ayah to show: Copy, Share, Bookmark, View Tafsir, Jump to Verse dialog (inspired by Tarteel's Navigator modal)

**Acceptance Criteria:**
- [ ] Reading progress tracked via IntersectionObserver (no `querySelectorAll` on scroll)
- [ ] Translation toggle shows/hides English text below each ayah
- [ ] Bismillah renders above ayah 1 for surahs 1 and 3-114 (not surah 9)
- [ ] Reading mode button hides all chrome and centers text
- [ ] Font size adjustable from 24px to 48px via slider
- [ ] Long surahs (50+ ayahs) use virtualized rendering
- [ ] No scroll jank on any surah (measured with Performance API)
- [ ] Long-press on ayah shows context menu with Copy, Share, Bookmark, Tafsir options
- [ ] "Jump to verse" dialog accessible from reader header

### 3E. Dhikr Counter Immersion — "Meditative, Not Mechanical"

**Inspiration:** Headspace (breathing UI), tasbih counter apps, Streaks (intentional completion)

**Proposed:**
- Add a **guided session mode**: "Start Morning Adhkar" walks through items one by one, full screen, with large counter
- Add **gentle pulsing animation** on the counter circle that syncs with a slow breathing rhythm
- Add **haptic feedback** via `navigator.vibrate(10)` on each count (with preference toggle)
- Add a **session completion summary** after finishing all items in a category

**Acceptance Criteria:**
- [ ] "Start Session" button available for each category (morning, evening, general)
- [ ] Session mode shows one dhikr at a time, full screen, with large counter
- [ ] Swipe or button to advance to next dhikr in session
- [ ] Counter circle pulses slowly (3-second cycle) during counting
- [ ] Haptic feedback fires on each tap (if device supports it and preference enabled)
- [ ] Session summary shows total time, total counts, items completed
- [ ] `prefers-reduced-motion` disables pulsing animation

### 3F. Skeleton Loaders Everywhere — "Never a Blank Screen"

**Current:** `StarSpinner` (a tiny rotating star) is the only loading indicator.

**Proposed:** Content-shaped skeleton placeholders for every data-dependent section.

**Acceptance Criteria:**
- [ ] Prayer times strip: skeleton matching the banner shape (gradient placeholder + 5 time slots)
- [ ] Prayer status row: 5 skeleton circles in a grid
- [ ] Dashboard cards: skeleton matching card height with text line placeholders
- [ ] Surah list: 10 skeleton rows with number, text, and badge placeholders
- [ ] Ayah reader: 3 skeleton ayah cards with Arabic-height text block
- [ ] Dhikr cards: skeleton matching card layout
- [ ] Hadith list: skeleton rows with metadata
- [ ] All skeletons use CSS `animate-pulse` on `bg-muted`

---

## 4. New Functionality to Add

### 4A. "Du'a of the Day" & "Hadith of the Day" Widgets
- Backend: Add `GET /api/v1/duas/daily` and `GET /api/v1/hadith/daily` endpoints that rotate daily
- Frontend: Replace static link cards on dashboard with actual content cards
- **Effort:** Small

### 4B. Hijri Calendar Display
- Use a JavaScript Hijri conversion library (e.g., `hijri-converter` or manual algorithm)
- Display on dashboard header and settings
- **Effort:** Small

### 4C. Fasting Widget on Dashboard
- Connect existing `GET /api/v1/habits/fasting/status` to a dashboard card
- Show today's fasting status with quick-log button
- **Effort:** Small

### 4D. Global Search
- Client-side search across Qur'an (surah names), hadith (text), du'as (translation), and future content
- Spotlight-style modal triggered from a search icon in the header
- **Effort:** Medium

### 4E. Prayer Notifications (Frontend Config)
- Settings UI for enabling/disabling prayer time reminders per prayer
- Store preferences in user profile
- **Effort:** Medium (frontend only; push notifications need backend/service worker)

### 4F. Data Export Implementation
- Settings already has a "Data Export" link but it goes nowhere
- Implement `GET /api/v1/users/export` that returns JSON/CSV
- Add download trigger in settings
- **Effort:** Small

### 4G. Qibla Compass
- Compute on-device using DeviceOrientation API + user lat/lng (no backend needed)
- Clean UI: compass with Kaaba icon at center, N/E/S/W labels, smooth CSS transform rotation
- Include calibration instruction on first use ("Move phone in figure-8 pattern")
- Text fallback for accessibility: display "Qibla: N 35° E" for screen readers
- **Effort:** Medium

### 4H. Sunnah Prayer Reminders
- Optional toggle in Settings: enable reminders for Sunnah prayers (Rawatib, Duha, Tahajjud)
- Non-intrusive — show as a subtle card on the home screen after the relevant Fard prayer, not as push notifications
- Progressive disclosure: hidden under "Extras" or "Advanced" in Settings
- **Effort:** Small

### 4I. Onboarding Improvement
- Add a swipeable carousel explaining Home, Prayer, Qur'an features on first launch
- Keep to ≤3 steps (research shows more steps reduce completion)
- Make permissions (location, notifications) opt-in with clear spiritual framing ("Enable location so we can calculate your prayer times accurately")
- Allow re-accessing onboarding via Settings > Help
- **Effort:** Medium

### 4J. i18n Infrastructure
- Set up `react-i18next` with English translation keys for all hardcoded UI strings
- Prepare Arabic translation file (can be populated later)
- Dynamic `dir` attribute on `<html>` based on selected language
- **Effort:** Medium (foundational, but doesn't require translating everything immediately)

---

## 5. Technical/Frontend Improvements

### 5A. Performance

| Improvement | Priority | Details |
|-------------|----------|---------|
| **IntersectionObserver for Qur'an** | P1 | Replace `querySelectorAll` scroll tracking |
| **Virtualized ayah list** | P1 | Use `react-window` for surahs with 50+ ayahs |
| **Skeleton loaders** | P1 | Eliminate all loading spinners in favor of content-shaped skeletons |
| **Image/SVG optimization** | P2 | Ensure GeometricPattern SVG is efficient and not causing repaint |

### 5B. State Management

| Improvement | Priority | Details |
|-------------|----------|---------|
| **Form validation with Zod** | P1 | Replace manual state in login, register, onboarding, journal with `react-hook-form` + `zod` |
| **Optimistic updates everywhere** | P2 | Prayer status row has excellent optimistic updates; replicate for dhikr, bookmarks, journal |
| **Query key constants** | P2 | Extract all query keys into a `queryKeys.ts` file for consistency |

### 5C. Accessibility

| Improvement | Priority | Details |
|-------------|----------|---------|
| **Keyboard navigation audit** | P1 | Ensure all interactive elements are reachable via Tab, operable via Enter/Space |
| **Screen reader labels** | P1 | Audit all `aria-label` values for descriptive text (e.g., "Save today's journal" not "Save") |
| **`prefers-reduced-motion`** | P1 | Wrap all CSS animations and JS timers in motion preference checks |
| **Color contrast audit** | P1 | Verify all text meets WCAG 2.2 AA (4.5:1 normal, 3:1 large) |
| **Focus visible styles** | P2 | Ensure `:focus-visible` ring is visible on all interactive elements |

### 5D. Code Quality

| Improvement | Priority | Details |
|-------------|----------|--------|
| **Extract shared hooks** | P2 | `useDebounce`, `useCoords` into `/hooks/` directory |
| **Component splitting** | P2 | `onboarding.tsx` is 358 lines — split into step sub-components |
| **Error boundary** | P1 | Add React error boundary wrapping each major section to prevent full-page crashes |
| **Consistent empty states** | P1 | Use `EmptyState` component (already exists in `brand/states.tsx`) universally |

### 5E. Responsive / Adaptive Layouts

| Improvement | Priority | Details |
|-------------|----------|--------|
| **Tablet multi-column** | P3 | On screens ≥768px, show 2-column grid on dashboard (prayer + summary side-by-side) |
| **Desktop sidebar nav** | P3 | On screens ≥1024px, replace bottom tabs with left sidebar navigation |
| **Touch target audit** | P2 | Verify all interactive elements ≥ 48×48dp with ≥ 8dp spacing (per design docs). Current dhikr counter is 80px ✅ but some icon buttons are 36px ❌ |
| **Thumb-zone optimization** | P3 | Place primary actions in bottom 40% of mobile viewport for one-handed use |

### 5F. Testing Strategy

| Layer | Tool | Scope | Priority |
|-------|------|-------|----------|
| **Unit** | Jest + React Testing Library | Utility functions (`prayer.ts`, `hijri.ts`), pure components | P2 |
| **Integration** | React Testing Library | Forms (login, register, journal), mutation flows (prayer logging, dhikr) | P3 |
| **E2E** | Playwright | Critical flows: login → dashboard → log prayer → journal, Qur'an reading | P3 |
| **Accessibility** | axe-core in CI | Run on every PR — fail build if new a11y violations introduced | P2 |
| **Visual regression** | Playwright screenshots | Capture key screens in light/dark mode, compare across PRs | P4 |
| **Performance** | Lighthouse CI | Track LCP, TTI, CLS on dashboard and Qur'an reader | P3 |

---

## 6. Prioritized Implementation Roadmap

### P1 — Critical (Week 1-2) — "Make it feel alive"

| # | Task | Scope | Effort |
|---|------|-------|--------|
| 1.1 | **Dashboard greeting + Hijri date** | `home.tsx`, new `hijri.ts` util | Small |
| 1.2 | **Time-of-day gradient on prayer banner** | `prayer-times-strip.tsx`, `styles.css` | Small |
| 1.3 | **Skeleton loaders for all widgets** | New `skeleton-*.tsx` components | Medium |
| 1.4 | **Prayer logging bottom sheet** | `prayer-status-row.tsx`, new `prayer-sheet.tsx` | Medium |
| 1.5 | **Undo toast for prayer logging** | `prayer-status-row.tsx`, `use-toast.ts` | Small |
| 1.6 | **Qur'an reader IntersectionObserver** | `ayah-reader.tsx` | Small |
| 1.7 | **Qur'an translation toggle** | `ayah-reader.tsx`, API types | Medium |
| 1.8 | **Visual khushoo scale in journal** | `prayer-journal.tsx` | Small |
| 1.9 | **Journal history list** | `prayer-journal.tsx`, new API call | Medium |
| 1.10 | **`prefers-reduced-motion` support** | `styles.css`, all animation components | Small |

### P2 — High Value (Week 3-4) — "Make it insightful"

| # | Task | Scope | Effort |
|---|------|-------|--------|
| 2.1 | **Du'a of the Day widget** | `summary-cards.tsx`, new API endpoint | Medium |
| 2.2 | **Hadith of the Day widget** | `summary-cards.tsx`, new API endpoint | Medium |
| 2.3 | **Weekly prayer quality chart** | `prayer-journal.tsx`, Recharts | Medium |
| 2.4 | **Dhikr guided session mode** | New `dhikr-session.tsx` route/component | Large |
| 2.5 | **Dhikr haptic feedback** | `dhikr-card.tsx` | Small |
| 2.6 | **Qur'an Bismillah header** | `ayah-reader.tsx` | Small |
| 2.7 | **Qur'an reading mode** | `ayah-reader.tsx`, new toggle state | Medium |
| 2.8 | **Fasting widget on dashboard** | `home.tsx`, `summary-cards.tsx` | Small |
| 2.9 | **Du'a favourites UI** | `duas.tsx`, `dua-card.tsx` | Medium |
| 2.10 | **Form validation with Zod** | login, register, onboarding, journal | Medium |

### P3 — Polish (Week 5-6) — "Make it delightful"

| # | Task | Scope | Effort |
|---|------|-------|--------|
| 3.1 | **Dhikr breathing animation** | `dhikr-card.tsx`, `styles.css` | Small |
| 3.2 | **Qur'an font size slider** | `ayah-reader.tsx` | Small |
| 3.3 | **Qur'an virtualized list** | `ayah-reader.tsx`, `react-window` | Medium |
| 3.4 | **Global search modal** | New `search.tsx` component | Large |
| 3.5 | **Accessibility audit + fixes** | All components | Medium |
| 3.6 | **Data export implementation** | Settings, new API endpoint | Small |
| 3.7 | **Keyboard navigation** | All interactive components | Medium |
| 3.8 | **Error boundary wrappers** | Route-level boundaries | Small |
| 3.9 | **Inline reflection prompt after prayer** | `prayer-status-row.tsx` | Medium |
| 3.10 | **Consistency card with prayer-specific insights** | `summary-cards.tsx` | Medium |

### P4 — Future (Week 7+) — "Make it essential"

| # | Task | Scope | Effort |
|---|------|-------|--------|
| 4.1 | **Offline-first with service worker** | Vite PWA plugin, IndexedDB | Large |
| 4.2 | **Prayer notification settings UI** | Settings, service worker | Medium |
| 4.3 | **Qur'an audio recitation** | Audio player component, audio CDN | Large |
| 4.4 | **Du'a category filtering** | `duas.tsx`, category tabs | Medium |
| 4.5 | **Hadith search highlighting** | `hadith-card.tsx` | Small |
| 4.6 | **Hifdh progress — remove .slice(0, 10)** | `hifdh-tab.tsx` | Small |
| 4.7 | **Qibla Compass** | New `qibla.tsx` route, DeviceOrientation API | Medium |
| 4.8 | **i18n infrastructure (react-i18next)** | All components, new `locales/` dir | Medium |
| 4.9 | **Responsive tablet/desktop layouts** | Layout components, CSS breakpoints | Medium |
| 4.10 | **Frontend testing (Jest + Playwright)** | Test setup, critical flow tests | Medium |
| 4.11 | **Auto day/night theme (prayer-aware)** | `theme.ts`, prayer times integration | Small |
| 4.12 | **Onboarding carousel improvement** | `onboarding.tsx`, swipeable cards | Small |
| 4.13 | **Sunnah prayer reminders** | Settings UI, home card | Small |

---

## 7. Wireframe/Layout Recommendations

### 7A. Prayer Bottom Sheet Layout
```
┌────────────────────────────────────┐
│           How was Dhuhr?           │
│                                    │
│  ┌────────┐ ┌────────┐ ┌────────┐ │
│  │   ✅   │ │   ⊘    │ │   ⊖   │ │
│  │ Prayed │ │ Missed │ │Excused │ │
│  └────────┘ └────────┘ └────────┘ │
│                                    │
│  ┌──── Optional Khushoo ────────┐  │
│  │  🌑  🌘  🌗  🌖  🌕        │  │
│  │  How present were you?       │  │
│  └──────────────────────────────┘  │
│                                    │
│         [ Skip ] [ Save ]          │
└────────────────────────────────────┘
```

### 7B. Guided Dhikr Session Layout
```
┌────────────────────────────────────┐
│  Morning Adhkar   3 of 12          │
│  ────────────────────────────      │
│                                    │
│        ┌────────────────┐          │
│        │  سُبْحَانَ اللّٰه │          │
│        │                │          │
│        │  ┌──────────┐  │          │
│        │  │          │  │          │
│        │  │   17     │  │  ← Large │
│        │  │  /33     │  │    counter│
│        │  │          │  │    circle │
│        │  └──────────┘  │          │
│        │                │          │
│        │  Subhanallah   │          │
│        └────────────────┘          │
│                                    │
│  "Glory be to Allah"               │
│  Sahih Muslim                      │
│                                    │
│         [ ← Prev ] [ Next → ]     │
└────────────────────────────────────┘
```

### 7C. Dashboard Time-of-Day Gradients

| Time | Gradient | Description |
|------|----------|-------------|
| Fajr (pre-dawn) | `from-slate-900 via-indigo-900 to-amber-800` | Deep navy fading to warm amber horizon |
| Morning (post-Fajr) | `from-amber-100 via-sky-200 to-blue-300` | Warm sunrise into clear sky |
| Afternoon (Dhuhr–Asr) | `from-sky-400 via-blue-500 to-blue-600` | Bright daytime blue |
| Maghrib (sunset) | `from-orange-400 via-rose-500 to-purple-700` | Warm sunset into dusk |
| Isha (night) | `from-indigo-950 via-slate-900 to-slate-950` | Deep night sky with subtle stars |

---

## 8. Implementation Notes for Coding Agents

### For each task, the implementing agent should:

1. **Read the relevant source files** listed in the "Scope" column
2. **Follow the design system** from `styles.css`:
   - 8-point spacing grid
   - `Inter` for UI, `Amiri` for Arabic
   - Primary: oklch teal, Gold: accent
   - All Arabic text: `dir="rtl"`, `.arabic` class, ≥28px font size
3. **Follow the Constitution** — no gamification of worship, prefer undo over confirmation, respect privacy
4. **Test with both light and dark themes** — dark mode is critical for Fajr/Isha usage
5. **Run these validation commands after each task:**
   ```bash
   cd /opt/lifeos/mlos/frontend
   npx tsc --noEmit          # Type check
   npm run lint               # ESLint
   npm run build              # Production build
   ```
6. **Commit after each major feature** with a descriptive commit message

### Key files to reference:
- Design tokens: [`styles.css`](file:///opt/lifeos/mlos/frontend/src/styles.css)
- API types: [`types.ts`](file:///opt/lifeos/mlos/frontend/src/lib/api/types.ts)
- API client: [`endpoints.ts`](file:///opt/lifeos/mlos/frontend/src/lib/api/endpoints.ts)
- Shared components: [`brand/pattern.tsx`](file:///opt/lifeos/mlos/frontend/src/components/brand/pattern.tsx), [`brand/states.tsx`](file:///opt/lifeos/mlos/frontend/src/components/brand/states.tsx)
- Implementation plan: [`implementation_plan_phase3.md`](file:///opt/lifeos/mlos/docs/implementation_plan_phase3.md)
