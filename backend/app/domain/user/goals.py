"""
Onboarding goals - matches 024_Onboarding_Framework.md "Step 6 - User Goals".

Stored as a simple list on the user profile. Deliberately not a free-text
field: constrained choices keep this queryable/analysable without collecting
open-ended personal text (Article 9 - minimum necessary collection).
"""
from enum import Enum


class OnboardingGoal(str, Enum):
    PRAY_CONSISTENTLY = "pray_consistently"
    READ_QURAN_DAILY = "read_quran_daily"
    MEMORISE_QURAN = "memorise_quran"
    LEARN_ARABIC = "learn_arabic"
    IMPROVE_PRODUCTIVITY = "improve_productivity"
    BUILD_HEALTHIER_HABITS = "build_healthier_habits"
    STRENGTHEN_FAMILY_ORGANISATION = "strengthen_family_organisation"
    MANAGE_COMMUNITY_ACTIVITIES = "manage_community_activities"
