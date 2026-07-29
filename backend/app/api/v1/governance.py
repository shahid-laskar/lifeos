"""
Data governance API.

GET /api/v1/governance/data-policy   — returns retention policies (public)
GET /api/v1/governance/my-data       — returns a summary of data we hold (auth)

These endpoints fulfil the transparency requirement of Article 9 (Privacy Is
Sacred): users can inspect what data is held and what the retention policy is,
without needing to contact support.
"""
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.data_governance import RETENTION_POLICIES, RetentionPolicy
from app.domain.user.entities import UserRecord

router = APIRouter(prefix="/governance", tags=["governance"])


def _policy_dict(p: RetentionPolicy) -> dict:
    return {
        "domain": p.domain,
        "classification": p.classification.value,
        "retention_days": p.retention_days,
        "deletion_on_account_close": p.deletion_on_account_close,
        "export_supported": p.export_supported,
        "notes": p.notes,
    }


@router.get("/data-policy")
def get_data_policy() -> dict:
    """Public endpoint: returns documented data retention policies."""
    return {
        "policies": [_policy_dict(p) for p in RETENTION_POLICIES],
        "notes": (
            "All personal and sensitive data is private by default. "
            "Engagement telemetry (session duration, worship scores, "
            "notification-open rates) is explicitly not collected. "
            "See governance/CONSTITUTION.md for full principles."
        ),
    }


@router.get("/my-data")
def get_my_data_summary(
    user: Annotated[UserRecord, Depends(get_current_user)],
) -> dict:
    """Authenticated: returns a summary of what data domains we hold for the user."""
    return {
        "user_id": user.id,
        "data_domains": [
            {
                "domain": p.domain,
                "classification": p.classification.value,
                "export_supported": p.export_supported,
                "deletion_on_account_close": p.deletion_on_account_close,
            }
            for p in RETENTION_POLICIES
            if p.deletion_on_account_close
        ],
        "note": (
            "To request a full data export or account deletion, "
            "contact support with your registered email address."
        ),
    }
