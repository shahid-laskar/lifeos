# Muslim Life OS — Backend API

FastAPI backend. Governed by `../governance/CONSTITUTION.md` — read that before
adding any feature, metric, or AI capability.

## Run locally

```bash
cd backend
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --reload
```

Then visit `http://127.0.0.1:8000/docs` for interactive API docs.

## Run tests

```bash
cd backend
PYTHONPATH=. pytest tests/ -v
```

## What's implemented

### Slice 1: Prayer Times
- `POST /api/v1/prayer/times` — deterministic prayer time calculation from
  latitude/longitude/date/method. Stateless: nothing is persisted (Article 9).
- 6 named calculation methods (MWL, ISNA, Egyptian, Umm al-Qura, Karachi,
  Tehran) plus Asr shadow-length convention (standard vs. Hanafi) — chosen
  explicitly by the caller, never silently defaulted to "the" correct one.
  See `008_Islamic_Knowledge_Framework.md` "Handling Scholarly Differences".
- High-latitude fallback (fraction-of-night rule) when the Fajr/Isha twilight
  angle is astronomically unreachable, with a flag
  (`high_latitude_adjustment_applied`) so clients can tell the user a
  fallback was used rather than silently showing a possibly-wrong time.
- Genuine polar-day/polar-night conditions return a clear, friendly error
  instead of fabricating a time (Article 8/9 honesty constraint).

### Slice 2: User / Onboarding
- `POST /api/v1/auth/register` — minimal signup: email, password,
  `terms_accepted=true`. Nothing else required (ADR-004, 024's
  progressive-disclosure principle).
- `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` — bcrypt password
  verification, short-lived (15 min) JWT access tokens + 30-day refresh
  tokens, each with a unique `jti`.
- `GET /api/v1/users/me` — current profile (requires Bearer token).
- `PATCH /api/v1/users/me/profile` — every field optional; sets
  country/timezone/prayer-calculation-preference/Asr-convention/onboarding
  goals progressively, one or more at a time, without resetting
  previously-set fields.
- `GET /api/v1/users/me/onboarding-status` — single source of truth for
  onboarding progress and "First Meaningful Outcome" availability (024), so
  every client (web/PWA/RN) renders identical progress without
  reimplementing this logic.
- Repository pattern: `app/domain/user/service.py` depends only on a
  `UserRepository` Protocol, not a concrete database — proven by
  `tests/domain/test_user_service.py`, which runs the full domain test suite
  against an in-memory fake with zero database involvement.
- No engagement-metric fields anywhere in the user model (ADR-003, enforced
  by a dedicated test in both slices).

32 tests, all passing: 6 prayer domain unit tests, 10 user domain unit tests
(in-memory, zero database), 4 prayer API integration tests, 12 user/auth API
integration tests — covering the full progressive-onboarding journey
end-to-end, verified live against a booted server.

## Project layout (Domain-Driven, per 063_Domain_Driven_Design.md)

```
app/
├── main.py              # FastAPI app wiring - no business logic here
├── core/
│   ├── config.py         # externalised settings (060 Principle 15)
│   ├── db.py              # SQLAlchemy session - shared platform infra
│   └── security.py         # password hashing + JWT - shared platform infra
├── api/
│   ├── deps.py            # DI wiring: DB session -> repository -> service; auth dependency
│   └── v1/
│       ├── prayer.py       # thin controller
│       ├── auth.py          # thin controller: register/login/refresh
│       └── users.py          # thin controller: profile + onboarding-status
├── domain/
│   ├── prayer/            # Slice 1 - pure functions, no persistence needed
│   │   ├── astronomical.py
│   │   ├── calculation_methods.py
│   │   ├── models.py
│   │   └── service.py
│   └── user/               # Slice 2 - persistence via Repository abstraction
│       ├── entities.py      # framework-agnostic UserRecord dataclass
│       ├── goals.py          # onboarding goals enum
│       ├── models.py          # Pydantic API schemas
│       ├── repository.py       # UserRepository Protocol - the DB-independence boundary
│       └── service.py           # business rules; depends only on the Protocol above
└── infrastructure/
    ├── orm_models.py       # SQLAlchemy UserORM - never imported by domain/
    └── user_repository_sqlalchemy.py  # implements UserRepository Protocol
```

This is a modular monolith (ADR-001), not microservices. New domains (e.g.
`app/domain/quran/`, `app/domain/habits/`) should follow the `user/` pattern
once they need persistence: framework-agnostic entity + Repository Protocol
+ pure domain service + infrastructure implementation. Domains that are
purely computational (like `prayer/`) don't need a Repository at all.

## Before adding anything

1. Does it trace to a documented feature (013_Feature_Catalogue.md) or
   research finding?
2. Fill out `.github/PULL_REQUEST_TEMPLATE.md` — all 10 constitutional
   questions.
3. If it's a new domain, add an entry to `docs/decision-log.md` explaining
   why now and why this scope.
