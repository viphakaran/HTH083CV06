"""
Unit tests for multi-lingual phrase builder
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

from app.services.phrase_builder import PhraseBuilder


def test_phrase_matching():
    pb = PhraseBuilder()

    res = pb.build_phrase(["wait", "time"])
    assert res["matched"] is True
    assert res["en"] == "Please wait for your turn."
    assert "காத்திருக்கவும்" in res["ta"]
    assert "इंतज़ार" in res["hi"]


def test_phrase_single_token():
    pb = PhraseBuilder()

    res = pb.build_phrase(["owie"])
    assert res["matched"] is True
    assert "pain" in res["en"].lower() or "hurt" in res["en"].lower()


def test_phrase_fallback():
    pb = PhraseBuilder()

    res = pb.build_phrase(["person", "water"])
    assert res["approximate"] is True
    assert "Person water." == res["en"]


if __name__ == "__main__":
    test_phrase_matching()
    test_phrase_single_token()
    test_phrase_fallback()
    print("All phrase builder unit tests passed!")
