"""Unit tests for AI prompt metadata parsing and refusal heuristics."""
from app.domain.ai.entities import ConfidenceLevel
from app.domain.ai.prompts import parse_assistant_response, should_refuse


def test_parse_extracts_confidence_and_sources():
    raw = (
        "The five pillars are well attested in the Qur'an and Sunnah.\n\n"
        "<!--mlos\n"
        "confidence: high\n"
        "sources: Qur'an 2:177 | Sahih Bukhari\n"
        "-->"
    )
    parsed = parse_assistant_response(raw)
    assert parsed.content == (
        "The five pillars are well attested in the Qur'an and Sunnah."
    )
    assert parsed.confidence == ConfidenceLevel.HIGH
    assert parsed.source_refs == ["Qur'an 2:177", "Sahih Bukhari"]


def test_parse_missing_footer_defaults_to_unknown():
    parsed = parse_assistant_response("Just a plain reply with no metadata.")
    assert parsed.content == "Just a plain reply with no metadata."
    assert parsed.confidence == ConfidenceLevel.UNKNOWN
    assert parsed.source_refs == []


def test_parse_empty_sources():
    raw = (
        "I am not sure about this detail.\n\n"
        "<!--mlos\n"
        "confidence: low\n"
        "sources:\n"
        "-->"
    )
    parsed = parse_assistant_response(raw)
    assert parsed.confidence == ConfidenceLevel.LOW
    assert parsed.source_refs == []


def test_refusal_detects_fatwa_request():
    assert should_refuse("Give me a fatwa on fasting")
    assert should_refuse("Is it haram to skip Maghrib?")
    assert not should_refuse("What are the five pillars of Islam?")
