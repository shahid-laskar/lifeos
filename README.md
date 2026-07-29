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

## Status: Slice 1 complete — Prayer Times

- Deterministic prayer-time calculation (no AI — Article 8: domain logic
  belongs in software, not models).
- 6 calculation methods + Asr convention, explicitly chosen (never a silent
  "correct" default) per 008_Islamic_Knowledge_Framework.md.
- 10 passing tests including real astronomical edge cases (high-latitude
  fallback, true polar day).
- Verified live: server boots, `/health`, `/api/v1/prayer/times`, and
  `/docs` (Swagger UI) all confirmed working end-to-end.

## Next slice (proposed — needs an ADR before starting)

Per 014_Feature_Prioritisation_Framework.md "Foundation" tier and
024_Onboarding_Framework.md, the natural next pieces are either:

- **Onboarding + user/account model** (needed before anything can be
  personalised or saved), or
- **Qur'an domain (read-only)** — another zero-AI, zero-dependency,
  high-frequency-use Foundation feature.

Both are deliberately chosen over AI Coach / Family / Community features,
which require Memory (041), Safety (048), and multi-user permission models
(026) to exist first — see ADR-002 for the full reasoning.

## Before you build anything

Read `governance/CONSTITUTION.md`. Every PR must fill out
`.github/PULL_REQUEST_TEMPLATE.md`. Every non-trivial decision gets an entry
in `docs/decision-log.md`.
