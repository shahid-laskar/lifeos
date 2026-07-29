"""
Prayer time domain service.

Per 063_Domain_Driven_Design.md, this is a stateless Domain Service: it holds
no data of its own, takes explicit inputs, and returns a value object
(PrayerTimeResponse). It has no dependency on the web framework, database, or
any other layer - it can be unit tested in complete isolation.
"""
from datetime import date as date_type, datetime, timedelta

from app.domain.prayer.astronomical import asr_hour_angle, hour_angle, julian_day, solar_position
from app.domain.prayer.calculation_methods import (
    ASR_SHADOW_FACTOR,
    METHOD_PARAMETERS,
    AsrMethod,
    CalculationMethod,
)
from app.domain.prayer.models import PrayerTimeRequest, PrayerTimeResponse, PrayerTimes

MINUTES_PER_DEGREE_HOUR_ANGLE = 4.0
NIGHT_FRACTION_FALLBACK = 1 / 7  # simple high-latitude fallback (Seventh-of-Night rule)


def _format_time(hours_from_midnight_utc: float, tz_offset: float) -> str:
    local_hours = (hours_from_midnight_utc + tz_offset) % 24
    total_minutes = round(local_hours * 60)
    hh, mm = divmod(total_minutes % (24 * 60), 60)
    return f"{hh:02d}:{mm:02d}"


def calculate_prayer_times(request: PrayerTimeRequest) -> PrayerTimeResponse:
    jd = julian_day(request.date.year, request.date.month, request.date.day)
    # Use solar position at local solar noon (approx) for the whole day's calc.
    sun = solar_position(jd)

    # Solar noon (Dhuhr) in UTC hours, corrected for equation of time and
    # longitude (each 15 degrees of longitude = 1 hour).
    solar_noon_utc = 12.0 - (request.longitude / 15.0) - (sun.equation_of_time_minutes / 60.0)

    high_lat_fallback_used = False

    def angle_time(angle_deg: float, before_noon: bool) -> float | None:
        ha = hour_angle(request.latitude, sun.declination_deg, angle_deg)
        if ha is None:
            return None
        offset_hours = ha / 15.0
        return solar_noon_utc - offset_hours if before_noon else solar_noon_utc + offset_hours

    params = METHOD_PARAMETERS[request.method]

    # Sunrise/Maghrib use a much shallower angle (0.833 deg, solar disk radius
    # + refraction) than Fajr/Isha, so they remain computable at far more
    # extreme latitudes. We anchor the high-latitude fallback to these actual
    # sunrise/sunset times (via night duration) rather than to solar noon,
    # which otherwise breaks prayer-time ordering near the solstices at high
    # latitudes - see 035_Internationalisation_and_Localisation.md
    # "High-latitude adjustments". This is a simplified "fraction of night"
    # rule; more sophisticated methods (Angle-Based, Middle-of-Night) are
    # future work, tracked for when the app targets high-latitude regions.
    sunrise_utc = angle_time(0.833, before_noon=True)
    maghrib_utc = angle_time(0.833, before_noon=False)
    dhuhr_utc = solar_noon_utc + (2.0 / 60.0)  # small safety margin, common convention

    if sunrise_utc is None or maghrib_utc is None:
        # True midnight-sun / polar-night case: even sunrise/sunset cannot be
        # computed. Out of scope for this slice - raise rather than guess.
        raise ValueError(
            "Unable to compute sunrise/sunset at this latitude/date "
            "(polar day or polar night). High-latitude polar method not yet implemented."
        )

    night_duration_hours = (24.0 - maghrib_utc) + sunrise_utc

    fajr_utc = angle_time(params.fajr_angle, before_noon=True)
    if fajr_utc is None:
        high_lat_fallback_used = True
        fajr_utc = sunrise_utc - NIGHT_FRACTION_FALLBACK * night_duration_hours

    if params.isha_angle is not None:
        isha_utc = angle_time(params.isha_angle, before_noon=False)
        if isha_utc is None:
            high_lat_fallback_used = True
            isha_utc = maghrib_utc + NIGHT_FRACTION_FALLBACK * night_duration_hours
    else:
        isha_utc = maghrib_utc + (params.isha_interval_minutes or 0) / 60.0

    shadow_factor = ASR_SHADOW_FACTOR[request.asr_method]
    asr_ha = asr_hour_angle(request.latitude, sun.declination_deg, shadow_factor)
    if asr_ha is None:
        high_lat_fallback_used = True
        # Fallback: midpoint between Dhuhr and Maghrib, which preserves
        # Dhuhr < Asr < Maghrib ordering even when the shadow-based angle
        # is unreachable at this latitude.
        asr_utc = dhuhr_utc + (maghrib_utc - dhuhr_utc) * 0.5
    else:
        asr_utc = solar_noon_utc + (asr_ha / 15.0)

    times = PrayerTimes(
        fajr=_format_time(fajr_utc, request.timezone_offset_hours),
        sunrise=_format_time(sunrise_utc, request.timezone_offset_hours),
        dhuhr=_format_time(dhuhr_utc, request.timezone_offset_hours),
        asr=_format_time(asr_utc, request.timezone_offset_hours),
        maghrib=_format_time(maghrib_utc, request.timezone_offset_hours),
        isha=_format_time(isha_utc, request.timezone_offset_hours),
    )

    return PrayerTimeResponse(
        date=request.date,
        latitude=request.latitude,
        longitude=request.longitude,
        method=request.method,
        asr_method=request.asr_method,
        times=times,
        high_latitude_adjustment_applied=high_lat_fallback_used,
    )
