from typing import Protocol


class EmailService(Protocol):
    """
    Protocol for sending emails.
    """
    def send_password_reset_email(self, to_email: str, reset_token: str) -> None:
        ...
