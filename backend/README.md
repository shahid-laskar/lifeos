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

## What's implemented (Slice 1: Prayer Times)

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
- 10 tests: domain-logic unit tests + API integration tests, including two
  deliberately adversarial astronomical edge cases (London near solstice,
  Tromsø true midnight sun).

## Project layout (Domain-Driven, per 063_Domain_Driven_Design.md)

```
app/
├── main.py              # FastAPI app wiring - no business logic here
├── core/
│   └── config.py        # externalised settings (060 Principle 15)
├── api/v1/
│   └── prayer.py        # thin controller: validate -> delegate -> shape response
└── domain/prayer/
    ├── astronomical.py       # pure solar-position math, framework-independent
    ├── calculation_methods.py # method/angle parameters, scholarly-difference aware
    ├── models.py              # request/response schemas
    └── service.py              # domain service: pure function, fully unit-testable
```

This is a modular monolith (ADR-001), not microservices. New domains (e.g.
`app/domain/quran/`, `app/domain/habits/`) should follow the same pattern:
pure domain service + thin API router + explicit models.

## Before adding anything

1. Does it trace to a documented feature (013_Feature_Catalogue.md) or
   research finding?
2. Fill out `.github/PULL_REQUEST_TEMPLATE.md` — all 10 constitutional
   questions.
3. If it's a new domain, add an entry to `docs/decision-log.md` explaining
   why now and why this scope.
