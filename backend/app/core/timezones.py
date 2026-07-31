"""Shared timezone helpers for API handlers."""
from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

logger = logging.getLogger("mlos.timezones")

# Map deprecated / non-standard IANA timezone aliases to canonical names.
_TZ_ALIASES: dict[str, str] = {
    "Asia/Calcutta": "Asia/Kolkata",
    "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
    "Pacific/Samoa": "Pacific/Pago_Pago",
}


def is_valid_iana_timezone(tz_name: str | None) -> bool:
    if not tz_name or not tz_name.strip():
        return False
    candidate = _TZ_ALIASES.get(tz_name.strip(), tz_name.strip())
    try:
        ZoneInfo(candidate)
        return True
    except ZoneInfoNotFoundError:
        return False


def resolve_timezone(tz_name: str | None, *, fallback: str = "UTC") -> ZoneInfo:
    """Return a ZoneInfo for *tz_name*, resolving aliases and falling back safely.

    City names or other non-IANA values (historically saved from Nominatim
    display names) must never crash prayer/dhikr/habit endpoints.
    """
    if is_valid_iana_timezone(tz_name):
        assert tz_name is not None
        candidate = _TZ_ALIASES.get(tz_name.strip(), tz_name.strip())
        return ZoneInfo(candidate)
    return ZoneInfo(fallback)


def lookup_timezone_for_coordinates(
    latitude: float,
    longitude: float,
    *,
    timeout_seconds: float = 3.0,
) -> str | None:
    """Resolve IANA timezone from coordinates via Open-Meteo (free, no API key)."""
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}"
        "&current=temperature_2m&timezone=auto"
    )
    try:
        request = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))
        tz_name = payload.get("timezone")
        if isinstance(tz_name, str) and is_valid_iana_timezone(tz_name):
            return tz_name
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError) as exc:
        logger.warning("Timezone lookup failed for %s,%s: %s", latitude, longitude, exc)
    return None


def resolve_user_timezone(
    tz_name: str | None,
    *,
    latitude: float | None = None,
    longitude: float | None = None,
) -> ZoneInfo:
    """Prefer a valid stored IANA timezone; otherwise look up from coordinates."""
    if is_valid_iana_timezone(tz_name):
        return resolve_timezone(tz_name)
    if latitude is not None and longitude is not None:
        looked_up = lookup_timezone_for_coordinates(latitude, longitude)
        if looked_up:
            return ZoneInfo(looked_up)
    return ZoneInfo("UTC")
