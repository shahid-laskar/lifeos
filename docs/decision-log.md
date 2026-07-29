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

---

## ADR-004: User/Onboarding domain — minimal registration, deferred auth methods, SQLite for dev

Date: 2026-07-29
Status: Accepted

Decision: Implement the User domain (`app/domain/user/`) with:
- Registration requiring only: email, password, explicit `terms_accepted=true`.
  All other onboarding fields (country, timezone, prayer calculation
  preference, Asr convention, goals) are optional and set via a separate
  `PATCH /users/me/profile` call, never required at signup.
- Password auth via `bcrypt` (direct library, not `passlib`, to avoid known
  passlib/bcrypt-4.x version-detection warnings) + custom JWT access/refresh
  tokens (`PyJWT`, HS256, short-lived 15-min access / 30-day refresh).
- SQLite for development persistence (via SQLAlchemy), with a Repository
  abstraction (`UserRepository` Protocol) so the domain service is
  storage-independent and unit-testable without a database.
- Deliberately **not** implemented in this slice: passkeys, OAuth/OIDC
  providers, MFA, refresh-token rotation/revocation lists, session device
  tracking, password breach detection.

Reason: 024_Onboarding_Framework.md is explicit that onboarding should be
"progressive," collect the minimum, and "explain why each question is asked" -
country/timezone/prayer-method/goals are all marked optional in the source
document. Article 9 (Privacy Is Sacred) requires collecting only what is
necessary. 069_Authentication_and_Authorization.md describes passkeys, OAuth,
and MFA as the *target* state, but building all of them before a single user
model exists would violate 011 Principle 3 ("Simplicity Before Features") and
010's anti-pattern warning against adding complexity before it's justified by
real usage. SQLite is chosen over Postgres purely for zero-infrastructure
local development; 067_Database_Architecture.md marks relational storage as
correct for user data, but does not mandate a specific engine at this stage.

Alternatives considered:
- Require full profile (country, timezone, madhhab, occupation) at signup —
  rejected: directly contradicts 024's progressive-disclosure principle and
  083_Forms_and_Input_Architecture.md ("collect only necessary information").
- Passkeys-first (no password) — rejected for this slice: correct long-term
  direction (069 marks passkeys "preferred over passwords where supported")
  but adds WebAuthn ceremony complexity with no client yet to exercise it;
  password + short-lived JWT is the minimum viable, replaceable-later choice.
- passlib for hashing — rejected: current passlib releases emit spurious
  version-detection warnings against bcrypt >=4.1 in this environment; direct
  `bcrypt` library use is simpler and equally standard.

Trade-offs: No session revocation ("sign out this device") until a sessions
table is added. No account recovery flow yet (forgot-password) — flagged as
the near-term follow-up once email delivery infrastructure exists.

Constitutional articles engaged: Art. 9 (Privacy Is Sacred - minimum
collection), Art. 10 (Respect for Time - don't build unused auth methods),
Art. 19 (Engineering Principles - modularity, testability via Repository
pattern).

Expected review date: Before any client (web/PWA/RN) implements a login
screen - passkey/OAuth may become required earlier than expected if targeting
a demographic with low password-reuse tolerance (e.g. student personas -
015_Personas.md).

**Addendum (2026-07-29):** During implementation, testing caught a real bug -
two tokens issued within the same wall-clock second had identical `iat`/`exp`
claims and were therefore byte-identical (JWT has second-level precision).
Fixed by adding a `jti` (unique token ID) claim to every token. This also
gives the future revocation-list follow-up work a stable handle to key off.

---

## ADR-005: Connect Prayer Times to User Profile

Date: 2026-07-29
Status: Accepted

Decision: Connect the existing Prayer Times domain with the User domain so that a logged-in user can fetch their daily prayer times using the settings stored in their profile (latitude, longitude, timezone, calculation method) without passing these parameters on every request.

Reason: This is the most logical next step to integrate the two completed vertical slices (Prayer Times and User/Onboarding). It provides immediate value by simplifying client calls, reducing payload sizes, and ensuring consistency across user devices. It also fulfills the "Foundation" priority mentioned in the README.

Alternatives considered:
- Qur'an domain (read-only): Deferred because connecting the core profile settings is fundamental before adding entirely new domains.
- Habit tracking: Deferred because users need a seamless, personalized way to view prayer times before they can start tracking habits effectively.

Trade-offs: None. This integration is essential for any personalized experience.

Constitutional articles engaged: Art. 19 (Engineering Principles - modularity, connecting bounded contexts gracefully).

Expected review date: Once the habit tracking slice is being planned.

---

## ADR-006: Habit Tracking (Prayer Consistency) Domain

Date: 2026-07-29
Status: Accepted

Decision: Implement the Habit Tracking domain specifically focused on Prayer Consistency. 
The system will track which prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) are marked as completed for a given date by the user. 
In alignment with ADR-003 and 025_Gamification_and_Motivation.md, this domain will evaluate consistency based on a "completed on N of last 30 days" metric rather than relying on fragile all-or-nothing streaks. The schema will deliberately omit duration, streak-only counters, or engagement fields. 
The domain will expose endpoints to log a prayer as completed (or missed/excused), and to retrieve the user's prayer completion history and consistency metrics.

Reason: Tracking prayer consistency fulfills the "Habit tracking" Foundation tier slice mentioned in the project plan. By designing it to calculate "N of last 30 days" over simple streaks, we uphold the Product Constitution's principles of avoiding anxiety-inducing or manipulative gamification mechanisms.

Alternatives considered:
- Streak-based gamification: Explicitly rejected by ADR-003 and 025_Gamification_and_Motivation.md.

Trade-offs: Calculating "N of last 30 days" requires querying a time window of historical data rather than just incrementing a single integer `streak` column, adding slight computational overhead, but this is an accepted trade-off for user well-being.

Constitutional articles engaged: Art. 2, Art. 11 (Calm by Default).

Expected review date: Before adding habit tracking for other domains (e.g. Qur'an reading, fasting).
