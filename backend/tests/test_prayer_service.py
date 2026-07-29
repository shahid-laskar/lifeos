"""
Tests for the prayer time domain service.

These check structural correctness (ordering of prayer times, response shape)
and sanity-check against well-known approximate published times for specific
cities/dates. Small (a few minute) deviation from any single published source
is expected and acceptable, since different published tables use slightly
different methods/elevation/rounding - this is precisely why
calculation_methods.py treats method choice as an explicit, non-default input
(see 008_Islamic_Knowledge_Framework.md).
"""
from datetime import date

from app.domain.prayer.calculation_methods import AsrMethod, CalculationMethod
from app.domain.prayer.models import PrayerTimeRequest
from app.domain.prayer.service import calculate_prayer_times


def _to_minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def test_prayer_times_are_in_correct_order():
    """Fajr < Sunrise < Dhuhr < Asr < Maghrib < Isha must always hold."""
    request = PrayerTimeRequest(
        latitude=51.5074,   # London
        longitude=-0.1278,
        date=date(2026, 6, 21),  # summer solstice - a hard case for UK latitudes
        timezone_offset_hours=1.0,  # BST
        method=CalculationMethod.MWL,
        asr_method=AsrMethod.STANDARD,
    )
    result = calculate_prayer_times(request)
    t = result.times

    order = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha]
    minutes = [_to_minutes(x) for x in order]
    assert minutes == sorted(minutes), f"Prayer times out of order: {order}"


def test_known_approximate_location_dhuhr_near_local_solar_noon():
    """Dhuhr should fall close to 12:00 local (solar) time, adjusted for
    equation of time and timezone - never wildly off (e.g. not near dawn)."""
    request = PrayerTimeRequest(
        latitude=21.4225,   # Makkah
        longitude=39.8262,
        date=date(2026, 3, 20),  # near equinox - equation of time is small
        timezone_offset_hours=3.0,  # Saudi Arabia is UTC+3, matches longitude closely
        method=CalculationMethod.UMM_AL_QURA,
        asr_method=AsrMethod.STANDARD,
    )
    result = calculate_prayer_times(request)
    dhuhr_minutes = _to_minutes(result.times.dhuhr)
    # Saudi Arabia uses a single UTC+3 zone, but Makkah's true solar longitude
    # corresponds to ~UTC+2.655, so real published Dhuhr times in Makkah are
    # consistently ~25-30 minutes after clock-noon (this matches Umm al-Qura
    # published timetables). Allow a wider, still-sane bound.
    assert 12 * 60 < dhuhr_minutes < 13 * 60


def test_asr_hanafi_is_later_than_standard():
    """Hanafi Asr (2x shadow) always occurs later in the day than the
    standard majority-view (1x shadow) calculation, for the same location
    and date. Neither is presented as 'the' default - see AsrMethod docstring."""
    base_kwargs = dict(
        latitude=33.6844,   # Islamabad
        longitude=73.0479,
        date=date(2026, 1, 15),
        timezone_offset_hours=5.0,
        method=CalculationMethod.KARACHI,
    )
    standard = calculate_prayer_times(
        PrayerTimeRequest(**base_kwargs, asr_method=AsrMethod.STANDARD)
    )
    hanafi = calculate_prayer_times(
        PrayerTimeRequest(**base_kwargs, asr_method=AsrMethod.HANAFI)
    )
    assert _to_minutes(hanafi.times.asr) > _to_minutes(standard.times.asr)


def test_high_latitude_flag_set_when_fallback_used():
    """At high but non-polar latitudes near the summer solstice, the sky never
    gets astronomically dark enough (18 deg below horizon) for Fajr/Isha to
    be computed directly, even though the sun still rises and sets normally.
    The service must signal that a fallback rule was used rather than
    silently returning an incorrect time, while still preserving correct
    ordering (Fajr < Sunrise ... Maghrib < Isha). See
    035_Internationalisation_and_Localisation.md 'High-latitude adjustments'."""
    request = PrayerTimeRequest(
        latitude=51.5074,   # London - high enough for the fallback to trigger
        longitude=-0.1278,  # near the summer solstice, but sun still rises/sets
        date=date(2026, 6, 21),
        timezone_offset_hours=1.0,  # BST
        method=CalculationMethod.MWL,
        asr_method=AsrMethod.STANDARD,
    )
    result = calculate_prayer_times(request)
    assert result.high_latitude_adjustment_applied is True

    t = result.times
    minutes = [_to_minutes(x) for x in (t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha)]
    assert minutes == sorted(minutes), f"Fallback broke ordering: {t}"


def test_true_polar_day_raises_rather_than_fabricates():
    """Above the Arctic Circle during genuine midnight sun (no sunset at all),
    the service must not silently invent a time - it should fail clearly.
    This is a deliberate honesty constraint (Article 8/9: never fabricate
    religious-adjacent facts), not a bug."""
    request = PrayerTimeRequest(
        latitude=69.6492,   # Tromsø, Norway - well inside Arctic Circle
        longitude=18.9553,
        date=date(2026, 6, 21),  # summer solstice - true midnight sun
        timezone_offset_hours=2.0,
        method=CalculationMethod.MWL,
        asr_method=AsrMethod.STANDARD,
    )
    try:
        calculate_prayer_times(request)
        raised = False
    except ValueError:
        raised = True
    assert raised, "Expected a ValueError for genuine polar-day conditions"


def test_response_never_includes_engagement_metrics():
    """Constitutional guardrail (ADR-003): the prayer time response object
    must never carry engagement/analytics fields."""
    request = PrayerTimeRequest(
        latitude=24.4667,
        longitude=39.6111,
        date=date(2026, 5, 1),
        timezone_offset_hours=3.0,
    )
    result = calculate_prayer_times(request)
    forbidden_fields = {"session_duration", "streak", "notifications_opened", "dau"}
    assert forbidden_fields.isdisjoint(result.model_dump().keys())
