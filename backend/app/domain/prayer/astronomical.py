"""
Solar position astronomy used to derive prayer times.

These are standard, publicly documented astronomical formulas (Julian day,
solar declination, equation of time, hour angle) - the same category of
calculation found in any general astronomy reference. No proprietary or
copyrighted source is reproduced; only mathematical formulas are implemented.

Per 039_AI_Principles.md Principle 2 ("Deterministic Before Generative") and
Article 8 of the Constitution: this is precisely the kind of calculation that
belongs in deterministic software, never in an AI model.
"""
import math
from dataclasses import dataclass


def julian_day(year: int, month: int, day: int) -> float:
    """Standard Julian Day Number calculation (Gregorian calendar)."""
    if month <= 2:
        year -= 1
        month += 12
    a = year // 100
    b = 2 - a + a // 4
    jd = (
        math.floor(365.25 * (year + 4716))
        + math.floor(30.6001 * (month + 1))
        + day
        + b
        - 1524.5
    )
    return jd


@dataclass(frozen=True)
class SolarPosition:
    declination_deg: float
    equation_of_time_minutes: float


def solar_position(jd: float) -> SolarPosition:
    """Compute solar declination and equation of time for a given Julian Day,
    using standard low-precision solar coordinate formulas (sufficient
    accuracy - sub-arcminute - for civil prayer-time calculation)."""
    d = jd - 2451545.0  # days since J2000.0

    g = math.radians((357.529 + 0.98560028 * d) % 360)  # mean anomaly
    q = (280.459 + 0.98564736 * d) % 360  # mean longitude
    l = math.radians(
        (q + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g)) % 360
    )  # apparent ecliptic longitude

    e = math.radians(23.439 - 0.00000036 * d)  # obliquity of the ecliptic

    declination = math.asin(math.sin(e) * math.sin(l))

    # Equation of time (minutes)
    y = math.tan(e / 2) ** 2
    q_rad = math.radians(q)
    eq_time = (
        y * math.sin(2 * q_rad)
        - 2 * 0.0167 * math.sin(g)
        + 4 * 0.0167 * y * math.sin(g) * math.cos(2 * q_rad)
        - 0.5 * y * y * math.sin(4 * q_rad)
        - 1.25 * 0.0167 * 0.0167 * math.sin(2 * g)
    )
    eq_time_minutes = math.degrees(eq_time) * 4  # radians*4 -> minutes

    return SolarPosition(
        declination_deg=math.degrees(declination),
        equation_of_time_minutes=eq_time_minutes,
    )


def hour_angle(latitude_deg: float, declination_deg: float, angle_deg: float) -> float | None:
    """Hour angle (degrees) at which the sun is `angle_deg` below the horizon,
    for a given latitude and solar declination. Returns None if the sun never
    reaches that angle at this latitude/date (high-latitude edge case - see
    035_Internationalisation_and_Localisation.md 'High-latitude adjustments',
    handled by the caller with a fallback policy)."""
    lat = math.radians(latitude_deg)
    decl = math.radians(declination_deg)
    ang = math.radians(angle_deg)

    cos_h = (-math.sin(ang) - math.sin(lat) * math.sin(decl)) / (
        math.cos(lat) * math.cos(decl)
    )
    if cos_h < -1 or cos_h > 1:
        return None
    return math.degrees(math.acos(cos_h))


def asr_hour_angle(latitude_deg: float, declination_deg: float, shadow_factor: int) -> float | None:
    """Hour angle for Asr given the shadow-length factor (1 = standard,
    2 = Hanafi). See calculation_methods.AsrMethod.

    The sun's altitude at Asr is a = arccot(shadow_factor + tan(|lat - decl|)),
    a *positive* altitude above the horizon (unlike Fajr/Isha/Maghrib, which
    use a depression angle below the horizon). A larger shadow_factor (2 for
    the Hanafi view) yields a *smaller* altitude, meaning the sun is lower
    in the sky and Asr therefore falls later in the afternoon.
    """
    lat = math.radians(latitude_deg)
    decl = math.radians(declination_deg)

    altitude = math.atan(1 / (shadow_factor + math.tan(abs(lat - decl))))
    cos_h = (math.sin(altitude) - math.sin(lat) * math.sin(decl)) / (
        math.cos(lat) * math.cos(decl)
    )
    if cos_h < -1 or cos_h > 1:
        return None
    return math.degrees(math.acos(cos_h))
