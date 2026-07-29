# Muslim Life OS — Product Constitution (Repo Copy)

**Source of truth:** `001_Product_Constitution.md`
**Status:** Supreme authority. No code, PR, schema, or feature may contradict this
without a documented Architecture Decision Record (ADR) in `docs/decision-log.md`.

This file is a condensed, *enforceable* version for engineering use. It is not a
replacement for the full document — it exists so every contributor (human or AI)
sees the constraints every day, in the repo, not buried in a doc archive.

---

## The 8 Non-Negotiable Product Principles

Every feature, schema field, endpoint, and UI screen must satisfy all 8:

1. **Benefit over Engagement** — never optimise for screen time or session count.
2. **Consistency over Intensity** — reward returning, not streak perfection.
3. **Mercy over Guilt** — reminders encourage, never shame.
4. **Privacy over Convenience** — collect the minimum; local-first by default.
5. **Evidence over Opinion** — religious/health/financial guidance cites sources.
6. **Humility over Gamification** — no worship leaderboards, no public piety scores.
7. **Families before Individuals** — features should strengthen households.
8. **Communities before Algorithms** — nudge toward real-world masjid/community action.

## AI Boundary (Article 8)

AI is a **mentor, not a Mufti**. AI may explain, summarise, organise, coach,
encourage, personalise, reflect. AI must **never**: invent religious rulings,
claim certainty without evidence, discourage consultation with scholars, or
present disputed opinions as settled fact.

Every AI-touching endpoint in this codebase must declare which capability it is
using (`explain | summarise | organise | coach | translate`) — never
`rule | judge | decide`.

## Explicitly Rejected Success Metrics (Article 2 / Master Prompt)

The following must **never** appear as a tracked "success" KPI, dashboard metric,
or growth target in this codebase:

- Daily Active Users (as a goal, not a diagnostic)
- Session duration
- Notifications opened
- Screen time

Tracked instead: prayer consistency, reflection completion, recovery-after-lapse,
family coordination usage, trust indicators.

## Immutable Design Questions (pre-merge checklist)

Before any feature merges, the author must be able to answer yes/uncertain-and-mitigated
to all of these (see `.github/PULL_REQUEST_TEMPLATE.md`):

1. Does this help users become better Muslims without replacing sincere effort?
2. Does this respect the diversity of legitimate scholarly opinions?
3. Does this protect privacy?
4. Does this reduce unnecessary complexity?
5. Does this strengthen families or communities?
6. Could this create unhealthy comparison?
7. Is the AI operating within its defined boundaries?
8. Does the feature remain useful if used for ten years?
9. Could this unintentionally encourage addiction or dependence?
10. Would we still be proud of this decision at a million users?

## Amendment Process

Changing this file requires an ADR documenting: proposed change, reason, expected
benefit, possible harms, affected systems, migration plan. See
`docs/decision-log.md`.
