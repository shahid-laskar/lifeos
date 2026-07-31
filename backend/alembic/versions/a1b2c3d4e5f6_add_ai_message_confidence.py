"""add_ai_message_confidence

Revision ID: a1b2c3d4e5f6
Revises: 5a331927dd77
Create Date: 2026-07-31 16:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "5a331927dd77"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ai_messages",
        sa.Column(
            "confidence",
            sa.String(length=16),
            nullable=False,
            server_default="unknown",
        ),
    )
    # Align legacy default label with domain SafetyOutcome values.
    op.execute(
        "UPDATE ai_messages SET safety_outcome = 'safe' "
        "WHERE safety_outcome = 'allowed'"
    )


def downgrade() -> None:
    op.drop_column("ai_messages", "confidence")
