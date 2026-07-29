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

### Slice 2: User / Onboarding — complete
- Minimal registration (email, password, explicit terms acceptance) with
  progressive profile completion — nothing else required at signup
  (ADR-004, 024_Onboarding_Framework.md).
- bcrypt password hashing + short-lived JWT access/refresh tokens.
- Repository pattern (`UserRepository` Protocol) keeps the domain layer
  fully unit-testable without a database — proven, not just claimed.
- `/users/me/onboarding-status` gives every future client a single source
  of truth for onboarding progress and First Meaningful Outcome readiness.
- Verified live end-to-end: register → check status → progressively fill
  profile → status correctly reflects First Meaningful Outcome availability.

**32 tests passing** across both slices (unit + API integration).

## Next slice (proposed — needs an ADR before starting)

Per 014_Feature_Prioritisation_Framework.md "Foundation" tier, candidates are:

- **Qur'an domain (read-only)** — zero-AI, zero new architecture, high-frequency
  use, and now has a real user/account to attach bookmarks/reading-progress to.
- **Connect Prayer Times to the User profile** — use the now-stored
  country/timezone/prayer-method preferences so `/prayer/times` can be called
  without repeating those parameters every request for a logged-in user.
- **Habit tracking (prayer consistency, per 025_Gamification_and_Motivation.md)**
  — "completed on N of last 30 days," never a fragile streak-only counter,
  per ADR-003.

Still deliberately deferred: AI Coach, Family, Community — see ADR-002 for
the dependency reasoning (Memory 041, Safety 048, permissions 026 needed first).

## Before you build anything

Read `governance/CONSTITUTION.md`. Every PR must fill out
`.github/PULL_REQUEST_TEMPLATE.md`. Every non-trivial decision gets an entry
in `docs/decision-log.md`.
