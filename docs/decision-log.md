# Decision Log

Every major architectural or product decision — especially anything that touches
or could appear to deviate from `governance/CONSTITUTION.md` — gets an entry here.
Never delete entries; append and supersede.

Format per 002_Research_Handbook.md / 003_Documentation_Standards.md:

```
## ADR-XXX: <Title>
Date:
Status: Proposed | Accepted | Superseded by ADR-YYY
Decision:
Reason:
Alternatives considered:
Trade-offs:
Constitutional articles engaged:
Expected review date:
```

---

## ADR-001: Backend-first, FastAPI, domain-driven monolith (not microservices)

Date: 2026-07-28
Status: Accepted

Decision: Start implementation with a single FastAPI backend service organised by
domain modules (per 063_Domain_Driven_Design.md), before any web/PWA/RN client.
Do not decompose into microservices at project start.

Reason: 064_Microservices_Strategy.md explicitly states "avoid premature
decomposition" — services should be created only when a distinct business
capability, independent scaling need, or dedicated team ownership emerges. At
project start none of these apply. A modular monolith preserves the domain
boundaries (bounded contexts) so extraction later is possible without a rewrite.

Alternatives considered:
- Microservices from day one — rejected (064 anti-pattern: "distributed monolith",
  premature decomposition).
- Frontend-first (mobile app calling a mock API) — rejected because 062
  (API Architecture) treats the API contract as authoritative; building UI
  against an unstable/mocked contract creates rework.

Trade-offs: Slower to demonstrate a polished UI early; accepted because
Article 10 (Respect for Time) favours not re-building foundations later.

Constitutional articles engaged: Art. 19 (Engineering Principles — modularity,
simplicity, testability).

Expected review date: When a second bounded context (e.g. AI Coach) needs
independent scaling or a dedicated team — re-evaluate service extraction.

---

## ADR-002: First vertical slice = Prayer Times / Prayer Planner

Date: 2026-07-28
Status: Accepted

Decision: The first implemented feature is Prayer Times calculation + Prayer
Planner, not AI Coach, not Family features, not Community features.

Reason: Per 014_Feature_Prioritisation_Framework.md, Prayer Planner sits in the
"Foundation" opportunity category (highest priority, essential infrastructure).
It has no dependency on AI Agent Framework, Family Experience, or Community
Experience — all of which require significantly more architecture (memory,
multi-user permissions, moderation) before they can be built responsibly. Prayer
time calculation is also a canonical example in 038/039 of "deterministic before
generative": correct here without any AI involvement, per Article 8.

Alternatives considered:
- AI Daily Coach first — rejected: requires AI Safety Framework (048), Memory
  Architecture (041), and RAG (042) to be operational first; too much
  undifferentiated risk for a first slice.
- Family Dashboard first — rejected: requires household/permission model (026)
  before a single-user core exists.

Trade-offs: Less "exciting" demo than an AI feature; accepted because it proves
the full stack (API → domain logic → data → client) on the simplest possible
correct feature first.

Constitutional articles engaged: Art. 4 (Technology is a Means), Art. 8
(AI has boundaries — this feature deliberately uses none).

Expected review date: Once Prayer Planner ships and Onboarding (024) is scoped.

---

## ADR-003: No engagement analytics fields in schema at launch

Date: 2026-07-28
Status: Accepted

Decision: The initial data model will not include fields for session duration,
streak-as-primary-metric, or notification-open tracking. Consistency will be
modelled as "completed on N of last 30 days" per 025_Gamification_and_Motivation.md,
never a fragile all-or-nothing streak counter.

Reason: Article 2 and the Master Prompt's "Product Success" section explicitly
reject these as success metrics; encoding them into the schema at all invites
them to be surfaced as KPIs later by default.

Alternatives considered: Track everything, filter in the dashboard layer later —
rejected: schema-level omission is a stronger and cheaper guarantee than
application-level policy.

Trade-offs: If genuine product-analytics need arises later (e.g. understanding
drop-off for support purposes), it must be deliberately re-added with a new ADR,
not silently reintroduced.

Constitutional articles engaged: Art. 2, Art. 9, Art. 11 (Calm by Default).

Expected review date: Before Volume 07 (Data & Analytics) work begins, if ever.
