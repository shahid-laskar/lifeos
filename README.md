# Muslim Life OS

An Islamic Life Operating System — not another prayer app, not another habit
tracker. See `governance/CONSTITUTION.md` for the non-negotiable principles
every contributor (human or AI) must follow.

## Build order (deliberate, per ADR-001/002 in `docs/decision-log.md`)

1. **Backend API (FastAPI)** ← we are here
2. React web app
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

**82 tests passing** across all five slices (unit + API integration).



## Next slice (proposed — needs an ADR before starting)

Per 014_Feature_Prioritisation_Framework.md "Foundation" tier, candidates are:

- **Forgot password / account recovery** — flagged as a near-term follow-up
  in ADR-004 once email delivery infrastructure exists. Blocks all future
  client implementations.
- **Qur'an reading history / weekly summary** — aggregate per-surah progress
  into a weekly reading summary (e.g. "read 3 surahs this week") using the
  now-complete reading-progress data. Requires no new architecture.

Still deliberately deferred: AI Coach, Family, Community — see ADR-002 for
the dependency reasoning (Memory 041, Safety 048, permissions 026 needed first).


## Before you build anything

Read `governance/CONSTITUTION.md`. Every PR must fill out
`.github/PULL_REQUEST_TEMPLATE.md`. Every non-trivial decision gets an entry
in `docs/decision-log.md`.
