## What does this change?

<!-- One or two sentences. -->

## Which documented feature / research does this trace to?

<!-- Link to the Feature Catalogue entry, PRD, or research finding.
No feature should exist without evidence (013_Feature_Catalogue.md). -->

## ADR and Evidence Gate (required)

- [ ] This change requires an ADR and one is added/updated in `docs/decision-log.md`.
- [ ] This change does not require an ADR (implementation-only, no architecture impact).
- [ ] `docs/phase1_evidence_board.md` was updated if this affects any ADR-012 increment gate.
- [ ] PR includes links to implementation artifact(s), automated test artifact(s), and operational/governance artifact(s).

**ADR references (if applicable):**
<!-- e.g. ADR-012, ADR-013 -->

**Evidence links:**
<!-- e.g. test run output, CI job URL, dashboard/runbook/doc links -->

## Constitutional Check (governance/CONSTITUTION.md)

Answer each. "Uncertain" is fine if you also state the mitigation.

- [ ] 1. Helps users become better Muslims without replacing sincere effort?
- [ ] 2. Respects diversity of legitimate scholarly opinion (no single view presented as universal)?
- [ ] 3. Protects privacy (minimum data collected, local-first where possible)?
- [ ] 4. Reduces rather than adds unnecessary complexity?
- [ ] 5. Strengthens families/communities rather than isolating users?
- [ ] 6. Does NOT create unhealthy comparison (no leaderboards/public piety scores)?
- [ ] 7. If AI is involved: stays within capability boundary (explain/summarise/organise/coach) — never rules/judges?
- [ ] 8. Would remain useful/valuable in ten years?
- [ ] 9. Does NOT nudge toward addictive/dependent usage patterns?
- [ ] 10. We'd still be proud of this at a million users?

## Success metrics touched

- [ ] This PR does **not** introduce DAU / session-time / notification-opens as a tracked "success" metric.
- [ ] If it adds any analytics field, it is diagnostic (support/debugging) not growth-optimising, and is noted in `docs/decision-log.md`.

## Testing

<!-- Unit / integration / manual. -->

## Architecture and Security Review

- [ ] Architecture review completed (or explicitly not needed with reason).
- [ ] Security review completed for auth/privacy/data/AI changes (or explicitly not needed with reason).

## Rollback plan

<!-- How do we revert this safely? -->
