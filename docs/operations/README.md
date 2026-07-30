# Operations (Phase 1)

Operational documentation for Muslim Life OS local and CI-backed delivery.

References:
- Volume 09: `187_Operational_Runbooks_and_Playbooks.md`
- Volume 09: `192_Platform_Health_and_Operational_Metrics.md`
- Volume 06: `120_CI_CD_Architecture.md`, `134_DevOps_Roadmap.md`
- Volume 08: `173_Security_Governance.md`
- Evidence board: `../phase1_evidence_board.md`

## Contents

| Artifact | Purpose |
|---|---|
| `slo_sli.md` | Phase 1 service level indicators and objectives |
| `rollback_drill.md` | Repeatable release rollback drill procedure |
| `runbooks/` | Task-oriented procedures |
| `playbooks/` | Scenario-oriented incident coordination |
| `../../scripts/ops/health_check.sh` | Automated liveness/readiness probe |
| `../../scripts/ops/rollback_drill.sh` | Local compose rollback drill |

## Ownership (Phase 1)

| Service | Owner | Backup |
|---|---|---|
| Backend API | Engineering | Platform |
| Frontend web | Engineering | Platform |
| CI / containers | Engineering | Platform |
| Security controls | Engineering + Security review | Architecture |
