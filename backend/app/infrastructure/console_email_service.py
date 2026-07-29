import logging
import sys

from app.domain.user.email_service import EmailService

logger = logging.getLogger(__name__)

class ConsoleEmailService(EmailService):
    """
    Dummy email service that logs emails to stdout.
    Used for Foundation tier before real email infrastructure is added.
    """
    def send_password_reset_email(self, to_email: str, reset_token: str) -> None:
        msg = f"""
========================================================================
[EMAIL MOCK] To: {to_email}
Subject: Password Reset Request

We received a request to reset your password. Use the following token
to complete the reset:

{reset_token}

If you did not request this, please ignore this email.
========================================================================
"""
        # We use print here directly to ensure it appears in test outputs and server logs clearly,
        # but also log it just in case.
        print(msg, file=sys.stdout)
        logger.info(f"Password reset email mock sent to {to_email}")
