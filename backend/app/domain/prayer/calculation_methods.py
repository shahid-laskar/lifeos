"""
Prayer time calculation methods.

Per 008_Islamic_Knowledge_Framework.md ("Handling Scholarly Differences") and
035_Internationalisation_and_Localisation.md ("Prayer Localisation"): prayer
calculation angles are a recognised area of legitimate scholarly/regional
difference. This module never silently picks one method as "correct" — the
caller (user or onboarding flow, per 024_Onboarding_Framework.md) must choose
a method explicitly, with a sensible *regional default suggestion* only.

Fajr/Isha angles below are publicly documented parameters used by the named
calculation authorities. Numeric parameters only - no religious text is
reproduced.
"""
from dataclasses import dataclass
from enum import Enum


@dataclass(frozen=True)
class MethodParameters:
    """Twilight angles (degrees below horizon) that define Fajr and Isha,
    plus optional fixed-minutes Isha interval used by some authorities."""

    name: str
    fajr_angle: float
    isha_angle: float | None  # None if isha uses a fixed interval instead
    isha_interval_minutes: int | None = None


class CalculationMethod(str, Enum):
    MWL = "MWL"                # Muslim World League
    ISNA = "ISNA"              # Islamic Society of North America
    EGYPTIAN = "EGYPTIAN"      # Egyptian General Authority of Survey
    UMM_AL_QURA = "UMM_AL_QURA"  # Umm al-Qura University, Makkah
    KARACHI = "KARACHI"        # University of Islamic Sciences, Karachi
    TEHRAN = "TEHRAN"          # Institute of Geophysics, University of Tehran


METHOD_PARAMETERS: dict[CalculationMethod, MethodParameters] = {
    CalculationMethod.MWL: MethodParameters("Muslim World League", 18.0, 17.0),
    CalculationMethod.ISNA: MethodParameters("Islamic Society of North America", 15.0, 15.0),
    CalculationMethod.EGYPTIAN: MethodParameters("Egyptian General Authority of Survey", 19.5, 17.5),
    CalculationMethod.UMM_AL_QURA: MethodParameters(
        "Umm al-Qura University, Makkah", 18.5, None, isha_interval_minutes=90
    ),
    CalculationMethod.KARACHI: MethodParameters("University of Islamic Sciences, Karachi", 18.0, 18.0),
    CalculationMethod.TEHRAN: MethodParameters("Institute of Geophysics, University of Tehran", 17.7, 14.0),
}


class AsrMethod(str, Enum):
    """Shadow-length convention for Asr - a recognised point of difference
    between the Shafi'i/Maliki/Hanbali majority view and the Hanafi view.
    Neither is presented as the default 'correct' one; the user chooses."""

    STANDARD = "STANDARD"  # shadow length = object length (majority view)
    HANAFI = "HANAFI"      # shadow length = 2x object length (Hanafi view)


ASR_SHADOW_FACTOR: dict[AsrMethod, int] = {
    AsrMethod.STANDARD: 1,
    AsrMethod.HANAFI: 2,
}
