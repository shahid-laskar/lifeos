"""Unit tests for timezone resolution helpers."""
from zoneinfo import ZoneInfo

from app.core.timezones import (
    is_valid_iana_timezone,
    resolve_timezone,
    resolve_user_timezone,
)


def test_city_name_is_not_valid_iana():
    assert not is_valid_iana_timezone("Thiruvanthapuram")
    assert is_valid_iana_timezone("Asia/Kolkata")


def test_resolve_timezone_falls_back_for_city_name():
    assert resolve_timezone("Thiruvanthapuram") == ZoneInfo("UTC")


def test_resolve_user_timezone_looks_up_coordinates():
    tz = resolve_user_timezone(
        "Thiruvanthapuram",
        latitude=8.5241,
        longitude=76.9366,
    )
    assert str(tz) == "Asia/Kolkata"
