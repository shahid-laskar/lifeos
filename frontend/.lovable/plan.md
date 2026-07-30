## Muslim Life OS — phased build

Note: `openapi.json` isn't in the repo yet. Attach it before Phase 1 starts and I'll generate types/clients strictly from it; otherwise I'll type the endpoints from your brief and reconcile later.

### Foundation (part of Phase 1)
- **Design system** in `src/styles.css`: teal `#1B4D3E` primary, cream `#FAF6F0` background, gold `#C9A84C` accent, sage `#7A9E7E` secondary — all as oklch semantic tokens, light + dark. Amiri (Arabic) + Inter (Latin) loaded via `<link>` in `__root.tsx`, exposed as `--font-arabic` / `--font-sans`.
- **Shared primitives**: `GeometricPattern` (8-point star SVG tile used as card texture), `StarSpinner` loader, `ArabicText` wrapper (RTL, right-aligned, 28px+ default), calm `ErrorState` and warm `EmptyState`.
- **RTL readiness**: logical CSS properties throughout, `dir` driven by preferred language on `<html>`.
- **API layer**: typed fetch client reading `import.meta.env.VITE_API_URL`, in-memory token store (module-scope, never localStorage), single-flight 401 → `/auth/refresh` → retry interceptor, TanStack Query wrappers per resource.
- **Routing**: TanStack Router file routes. `_authenticated` layout with bottom tab bar (Home / Quran / Dhikr / AI / Families / Settings); auth + onboarding routes outside it. Each route gets its own `head()` metadata.

### Phase 1 — foundation, auth, onboarding, Home
- Register (email, password ≥8, terms checkbox, language), Login, Forgot-password request (always generic success copy), Reset password with token.
- Onboarding wizard when `first_meaningful_outcome_available` is false: geolocation → calculation + asr method → goals, then redirect Home.
- Home: prayer-times strip with next-prayer highlight + live countdown (`GET /prayer/times/me` authed, `POST /prayer/times` with geolocation + UTC offset otherwise); 5 tap-to-log status circles cycling completed/missed/excused via `POST /habits/prayers/log`; dhikr totals from `/dhikr/summary`; weekly Quran summary; 30-day consistency card. No streaks anywhere.

### Phase 2 — Quran + Dhikr
- Surah list (arabic_name, transliteration, meaning, ayah_count, Meccan/Medinan badge) → ayah reader with large Amiri RTL text and circled ayah numbers.
- Bookmark per ayah (gold ribbon), bookmarks tab with delete, scroll-debounced `PUT /quran/reading-progress`.
- Dhikr: category tabs, item cards (arabic/transliteration/meaning/source/recommended_count), large circular tap counter showing `n / recommended`, subtle gold pulse at target, Log Session, bottom totals bar.

### Phase 3 — AI, Families, Settings
- AI: conversation list + chat, shield icon on refused/flagged `safety_outcome`, memory panel with per-entry delete, `include_memory` toggle in composer.
- Families: list, create, members with role badge + joined date, invite by email, accept invitation, remove member.
- Settings: profile form (country, timezone, lat/lng, calculation method, asr method with an explanatory note on Standard vs Hanafi, goals multi-select, language), onboarding checklist as 4 checkmarks, data transparency section (`/governance/my-data`, `/governance/data-policy`), logout clearing tokens.

### Technical notes
- Tokens live in a module-scope store; refresh is single-flight so parallel 401s trigger one refresh. Nothing auth-related is persisted, so a full reload returns to login by design.
- All API reads go through TanStack Query with route loaders priming the cache; no `useEffect` fetching.
- Countdown and prayer-time math run client-side from API-provided times, using the user's timezone.
- No backend is added — this is frontend-only against your existing API.
