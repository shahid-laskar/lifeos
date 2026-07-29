# Muslim Life OS

An Islamic Life Operating System — not another prayer app, not another habit
tracker. See `governance/CONSTITUTION.md` for the non-negotiable principles
every contributor (human or AI) must follow.

## Build order (deliberate, per ADR-001/002 in `docs/decision-log.md`)

1. **Backend API (FastAPI)** ← complete
2. **React web app** ← complete (Foundation tier)
3. PWA layer
4. React Native — Android
5. React Native — iOS

Backend-first because the API contract is authoritative (062_API_Architecture.md);
building clients against an unstable contract creates rework later.

## Repository layout

```
muslim-life-os/
├── governance/
│   └── CONSTITUTION.md          # condensed, enforceable Article set
├── docs/
│   └── decision-log.md          # every ADR - append-only, never delete
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md # constitutional checklist, enforced per-PR
└── backend/
    ├── README.md                 # how to run, current scope
    ├── requirements.txt
    ├── app/                       # FastAPI application (see backend/README.md)
    └── tests/
```

## Status

### Slice 1: Prayer Times — complete
- Deterministic prayer-time calculation (no AI — Article 8: domain logic
  belongs in software, not models).
- 6 calculation methods + Asr convention, explicitly chosen (never a silent
  "correct" default) per 008_Islamic_Knowledge_Framework.md.
- Verified live: server boots, `/health`, `/api/v1/prayer/times`, and
  `/docs` (Swagger UI) all confirmed working end-to-end.

### Slice 3: Habit Tracking (Prayer Consistency) — complete
- Log each of the 5 daily prayers as `completed`, `missed`, or `excused`.
- Idempotent log endpoint: re-logging the same prayer on the same date updates
  the status rather than creating a duplicate.
- Consistency metric: "completed on N of last 30 days" — never a fragile
  streak counter (ADR-003, Article 2).
- Verified end-to-end: log → status → consistency metrics.

### Slice 4: Qur'an Domain (read-only) — complete
- Full surah catalogue: all 114 surahs with Arabic name, transliterated name,
  meaning, ayah count, and revelation type — loaded from a bundled JSON file
  at startup (no external API — Article 9: Privacy Is Sacred).
- Public `GET /quran/surahs` and `GET /quran/surahs/{n}` require no auth.
- Authenticated bookmarks: add/remove/list per-ayah bookmarks with optional
  personal note. Add is idempotent; bookmarks are user-scoped (no public
  piety lists — Article 6: Humility over Gamification).
- Authenticated reading progress: `PUT /quran/reading-progress` records the
  user's last-read ayah per surah. Simple last-read tracker, not a streak
  counter (ADR-003, Article 2: Consistency over Intensity).
- Ayah validation: adding a bookmark or progress record to ayah 8 of
  Al-Fatihah (which has 7) is rejected with 422.
- Documented in ADR-007.

### Slice 5: Dhikr Companion — complete
- Curated adhkar catalogue (~28 items) drawn from Hisnul Muslim (Fortress of the Muslim)
  and established Sunnah sources. Loaded from bundled JSON (no external API).
- Authenticated session logging: log dhikr item id and recited count.
- Daily summary endpoint: aggregate dhikr counts per category for a given date.
- No streak gamification (ADR-003, Article 2).
- Documented in ADR-008.

### Slice 6: Forgot Password / Account Recovery — complete
- Stateful, hashed reset tokens with explicit revocation.
- Abstract `EmailService` protocol for future email provider integration, with a `ConsoleEmailService` mock for development.
- Single-use, expiring tokens (1 hour).
- Strict email enumeration prevention (generic success messages on request).
- Documented in ADR-009.

### Slice 7: Qur'an Reading History / Weekly Summary — complete
- Added a weekly summary endpoint (`GET /quran/reading-progress/summary/weekly`).
- Aggregates the last 7 days of reading progress into "surahs read" and "active days".
- Follows Article 2 (Consistency over Intensity) by deliberately avoiding fragile streak counters and session-duration telemetry.
- Documented in ADR-010.

### Slice 8: Frontend Web Application — complete
- Initialized React + Vite + TypeScript application (ADR-011).
- Configured Tailwind CSS v4 using a strict CSS-variable design token system for "Calm by Default" aesthetics (Article 11).
- Integrated with the backend API via a secure Axios client handling JWT tokens in-memory and automatic refresh token rotation.
- Created robust, accessible feature pages for Dashboard, Prayer Times, Qur'an, Dhikr, Habits, and Profile.
- Implemented Onboarding flow following progressive disclosure principles (ADR-004).

**109 backend tests passing** across all backend slices (unit + API integration).


## Phase 1 completion programme (ADR-012)

ADR-012 defines the Phase 1 foundation delivery and quality gates. The delivery
proceeds as vertical, deployable increments. Each increment must include
implementation, automated tests, security checks, operational documentation, and
a reproducible delivery artefact.

See `docs/decision-log.md` (ADR-012) and the implementation plan at
`../implementation_plan_phase01.md` for the full programme.

### Phase 1 delivery sequence

| # | Increment | Status |
|---|-----------|--------|
| 1 | Delivery baseline (CI, Docker, standards) | ✅ Complete |
| 2 | Web foundation hardening (modules, typed contracts, a11y, i18n, offline UI) | ✅ Complete |
| 3 | PWA and offline foundation (enhanced SW, typed operation queue, update banner) | ✅ Complete |
| 4 | AI foundation (provider-neutral gateway, versioned prompts, safety, privacy) | ✅ Complete |
| 5 | Family capability foundations (roles, invitations, private-by-default) | ✅ Complete |
| 6 | Data, analytics, and governance foundations (retention policy, data API) | ✅ Complete |
| 7 | DevOps, security, and operations foundations (CORS, headers, rate limiting, audit) | ✅ Complete |
| 8 | Mobile foundation (shared platform-neutral packages: types, auth, offline, i18n) | ✅ Complete |

Still deliberately deferred: AI Coach, Family, Community — see ADR-002 for
the dependency reasoning (Memory 041, Safety 048, permissions 026 needed first).


## Before you build anything

Read `governance/CONSTITUTION.md`. Every PR must fill out
`.github/PULL_REQUEST_TEMPLATE.md`. Every non-trivial decision gets an entry
in `docs/decision-log.md`.
