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

---

## ADR-007: Qur'an Domain — read-only text, bookmarks, reading progress

Date: 2026-07-29
Status: Accepted

Decision: Implement a Qur'an domain (`app/domain/quran/`) with three capabilities:
1. **Read-only text access** — surah listing and ayah browsing backed by a bundled
   JSON data file (`app/domain/quran/data/quran.json`) shipped with the application.
   No external Qur'an API is called at runtime (Article 9: Privacy Is Sacred —
   every request to a third-party API leaks IP address and reading behaviour).
2. **Bookmarks** — authenticated users can add/remove per-ayah bookmarks.
   Stored in a `quran_bookmarks` table. No social sharing, no public lists
   (Article 6: Humility over Gamification — no public piety scores).
3. **Reading progress** — authenticated users can record their last-read position
   per surah. Stored in a `quran_reading_progress` table. Deliberately a simple
   "last read" record, not a streak counter (ADR-003, Article 2).

The Qur'an text dataset (Arabic + transliteration metadata) is stored as a
bundled JSON file produced from the `quran-json` open-source project (MIT
licence). The file is loaded once at startup into memory; it is never written to
and never queried from a database — pure domain-level data (Article 8: domain
logic in software, not models).

Reason: The Qur'an domain is a zero-AI, zero-new-architecture, high-frequency
feature nominated in the README as the next Foundation-tier slice after Habit
Tracking. Users now have accounts and profiles to attach bookmarks and reading
progress to (the dependency established by ADR-004). A bundled data approach is
preferable to an external API call because:
- It works offline (031_Offline_First_Experience.md requirement).
- It does not leak which ayahs a user reads to any third party (Article 9).
- Qur'anic text is immutable; there is no need for live data.

Alternatives considered:
- External Qur'an API (e.g. alquran.cloud): rejected — runtime network call leaks
  user behaviour, breaks offline-first, adds external dependency and rate-limit
  risk.
- Database-backed text storage: rejected — the text is static; loading it into a
  relational table adds migration complexity with no benefit; in-memory lookup is
  faster and simpler.

Trade-offs: The bundled JSON adds ~3 MB to the repository / container image. This
is accepted as a one-time fixed cost; it never grows.

Constitutional articles engaged: Art. 9 (Privacy Is Sacred), Art. 8 (AI has
boundaries — this feature uses none), Art. 2 (Consistency over Intensity — reading
progress, not streak), ADR-003 (no engagement fields in schema).

Expected review date: Before implementing Tafsir, Memorisation, or any AI-assisted
Qur'an feature — those will require the RAG/Knowledge-Graph architecture (042, 043).

---

## ADR-008: Dhikr Companion — curated adhkar catalogue, session logging

Date: 2026-07-29
Status: Accepted

Decision: Implement a Dhikr Companion domain (`app/domain/dhikr/`) with:
1. **Curated adhkar catalogue** — a bundled JSON file (`dhikr_items.json`)
   containing well-known adhkar drawn from Hisnul Muslim (Fortress of the
   Muslim) and established Sunnah sources. Items carry: Arabic text,
   transliteration, meaning, recommended count, and category
   (morning | evening | post_prayer | general). The catalogue is immutable,
   loaded once at startup — no external API, no database table for it
   (same pattern as ADR-007, Article 9: Privacy Is Sacred).
2. **Session logging** — authenticated users can log dhikr sessions: which
   item they completed and how many times. A single `dhikr_logs` table stores
   these. No streak counter, no "total ever" KPI (ADR-003, Article 2:
   Consistency over Intensity). The only aggregate exposed is "completed today
   per category" — a calm, non-punishing daily summary.
3. **Daily summary endpoint** — returns, for a given date, how many dhikr
   sessions were logged per category. Deliberately not "N-day streak" — a
   user who misses a day is not punished by resetting a number.

Reason: Dhikr is a high-frequency, high-value Islamic practice (mentioned 100+
times in the Qur'an). It requires no AI, no new infrastructure, and no
cross-domain dependencies — the ideal Foundation-tier next slice. A companion
app that lets users tap through adhkar and log them fulfils Article 1 (Benefit
over Engagement): it helps users remember Allah without gamifying the act.

Alternatives considered:
- Streak-based gamification: rejected by ADR-003 and Article 2.
- External adhkar API: rejected (Article 9 — leaks which adhkar a user reads).
- Database-backed catalogue: rejected (catalogue is immutable; in-memory is
  simpler and faster — same reasoning as ADR-007).
- Allowing user-created custom dhikr: deferred — adds moderation complexity
  (Islamic correctness review) without established user demand.

Trade-offs: The bundled catalogue is curated and limited (~30 items). Users
cannot add their own dhikr in this slice. Custom dhikr is a natural follow-up
once a scholar-review process for user-contributed content exists (Art. 5:
Evidence over Opinion — Islamic guidance cites sources).

Constitutional articles engaged: Art. 1 (Benefit over Engagement), Art. 2
(Consistency over Intensity), Art. 5 (Evidence over Opinion — sourced adhkar),
Art. 6 (Humility over Gamification), Art. 8 (AI has boundaries — none used),
Art. 9 (Privacy Is Sacred — no external API), ADR-003.

Expected review date: Before adding custom dhikr or social dhikr circles —
those require a scholar-review workflow and community permissions (026).

---

## ADR-009: Forgot Password / Account Recovery Flow

Date: 2026-07-29
Status: Accepted

Decision: Implement a password recovery flow with the following architecture:
1. **Stateful Reset Tokens**: When a user requests a password reset, generate a
   cryptographically secure random token (e.g., using `secrets.token_urlsafe`).
   Hash the token (using bcrypt, same as passwords) and store it in a new
   `password_reset_tokens` table with an expiration time (e.g., 1 hour) and
   the `user_id`. Do *not* use stateless JWTs for password resets, as revoking
   them requires either a denylist or adding a `password_changed_at` field to
   the user record. Storing hashed tokens is simpler and explicitly revokable
   by deleting the record after use.
2. **Abstract Email Service**: Introduce an `EmailService` Protocol in the
   domain layer. This keeps the domain completely decoupled from email delivery
   mechanisms (e.g., SendGrid, AWS SES).
3. **Console Email Implementation**: For this Foundation tier slice, implement a
   `ConsoleEmailService` in the infrastructure layer that simply logs the reset
   link to stdout. This unblocks frontend/client development and testing
   without requiring actual email infrastructure yet.
4. **Security Measures**:
   - The `/request-password-reset` endpoint must *always* return the same generic
     success message, regardless of whether the email exists. This prevents
     email enumeration attacks.
   - Tokens must be single-use (deleted upon successful reset).
   - Tokens expire after 1 hour.
   - New passwords must meet the same complexity requirements as registration.

Reason: This unblocks the last major Foundation-tier requirement for clients.
Stateful, hashed tokens offer explicit revocation and are industry-standard for
password resets. Decoupling email delivery allows us to build the flow now
and swap in a real provider later (e.g., when deploying to production).

Alternatives considered:
- Stateless JWTs: Rejected because revoking them is complex (requires tracking
  when the password last changed or maintaining a denylist).
- Storing plain-text tokens: Rejected. If the DB is compromised, attackers
  could use active reset tokens.

Trade-offs: Stateful tokens require a new database table and occasional cleanup
of expired tokens.

Constitutional articles engaged: Art. 9 (Privacy Is Sacred — email enumeration
prevention).

Expected review date: When integrating a real email provider (e.g., SendGrid)
for production deployment.

---

## ADR-010: Qur'an Reading History / Weekly Summary

Date: 2026-07-29
Status: Accepted

Decision: Implement a weekly summary endpoint in the Qur'an domain (`app/domain/quran/`) 
that aggregates a user's reading progress over the past 7 days.
- The summary will compute how many distinct surahs the user made progress on within the window.
- The system will *not* track session duration, total ayahs read per day, or reading speed, as doing so requires invasive client-side event tracking.
- The system will calculate consistency over the trailing 7 days without creating an all-or-nothing streak counter (e.g., "Read on 3 of the last 7 days").

Reason: This builds upon the existing `quran_reading_progress` records (introduced in ADR-007). Providing a weekly summary encourages consistency and fulfills the "Qur'an reading history / weekly summary" slice in the Foundation tier. Designing it to aggregate simple progress updates over a rolling 7-day window honors Article 2 (Consistency over Intensity) without requiring complex telemetry.

Alternatives considered:
- Fine-grained session tracking (e.g., exact time spent reading): Rejected. Article 9 (Privacy Is Sacred) and the Master Prompt dictate minimizing data collection. Tracking time spent requires "heartbeat" pings from the client, which is excessive and invasive.
- Streak counters (e.g., "7-day reading streak"): Rejected. Directly violates ADR-003 and Article 2 by introducing fragile gamification.

Trade-offs: The summary relies on the user actively updating their reading progress (or the client doing it periodically when pages are turned). It does not know *how much* was read between updates, only that progress was logged. This is an accepted and deliberate trade-off for privacy and simplicity.

Constitutional articles engaged: Art. 2 (Consistency over Intensity), Art. 6 (Humility over Gamification), Art. 9 (Privacy Is Sacred — no telemetry), ADR-003.

Expected review date: If/when a "yearly reading goal" (Khatam tracking) is prioritized.

---

## ADR-011: Frontend Web Application Implementation (React, Vite, Tailwind v4)

Date: 2026-07-29
Status: Accepted

Decision: Implement the initial frontend web client using React, Vite, and Tailwind CSS v4. The application acts as a Single Page Application (SPA) communicating with the FastAPI backend via a proxied API connection in development. The design system is implemented using CSS variables (tokens) integrated with Tailwind.

Reason: React provides the necessary component-driven architecture specified in 078_Component_Architecture.md. Vite offers a rapid, modern build toolchain. Tailwind CSS v4, configured strictly with design tokens, allows for rapid UI development while enforcing the design system rules established in 082_Design_System_Implementation.md. This stack fulfills the requirements for a modular, maintainable, and responsive frontend architecture (Volume 04).

Alternatives considered:
- Next.js (SSR/SSG): Deferred. While excellent for SEO, a pure SPA is sufficient for the authenticated, highly interactive "OS" nature of this product at this stage. It reduces deployment complexity for the initial Foundation tier.
- Vue/Svelte: Rejected to align with the likely wider talent pool for React in the mobile space (React Native) if code-sharing or team scaling becomes necessary later.

Trade-offs: A pure SPA means the initial payload might be larger than server-rendered HTML, and SEO is limited for public pages. Since the application is primarily an authenticated user dashboard, this is an acceptable trade-off for the richer interactive experience and simpler initial deployment model.

Constitutional articles engaged: Art. 19 (Engineering Principles - simplicity, modularity), Art. 11 (Calm by Default - enabled via tokenized design system).

Expected review date: When planning the mobile application phase (to assess if React Native is viable for code sharing) or if public-facing SEO requirements change.

---

## ADR-012: Phase 1 Foundation Delivery and Quality Gates

Date: 2026-07-29
Status: Accepted

Decision: Complete the documented Phase 1 foundations across the architecture
volumes through vertical, deployable increments. Each increment must include
implementation, automated tests, security checks, operational documentation,
and a reproducible delivery artefact.

The delivery baseline uses:

- FastAPI as the backend authority under versioned `/api/v1` contracts.
- React, Vite, and Tailwind v4 for the web client.
- Docker-based local and staging environments.
- CI gates for backend tests, frontend tests, linting, type checking, builds,
  and container builds.
- Privacy-safe operational diagnostics only; no worship-performance or
  engagement telemetry.

The next product capability after web hardening is a governed AI foundation,
followed by family capability foundations. PWA/offline support, data
governance, security, observability, mobile foundations, and operations are
cross-cutting delivery requirements rather than deferred polish.

Qur'an text must be delivered from a verified, application-controlled source.
The frontend must not identify a user's reading behaviour to a third-party
content API.

Reason: The project has completed the backend and web Foundation slices, but
the architecture volumes require repeatable delivery, offline resilience,
testing, privacy protection, and operational readiness before expanding into
AI, family, mobile, or enterprise capabilities.

Alternatives considered:

- Feature-first expansion without quality gates: rejected because it would
  increase contract drift and operational risk.
- Third-party Quran text requests from the browser: rejected under Article 9
  and ADR-007 because reading behaviour can be disclosed externally.
- A single large release: rejected in favour of incremental rollback-safe
  vertical releases.

Constitutional articles engaged: Article 2 (benefit over engagement), Article
9 (privacy is sacred), Article 11 (calm by default), Article 19 (engineering
principles), ADR-001, ADR-007, and ADR-011.
