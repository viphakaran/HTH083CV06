"""
Phrase Builder & Multi-Lingual Service Translation
Maps recognized isolated ASL tokens to full canonical service sentences
in English, Tamil, and Hindi for public-service desk accessibility.
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional

from ..config.settings import CONFIG_DIR


class PhraseBuilder:
    """Expands isolated sign tokens into full communicative phrases."""

    def __init__(self, templates_file: Optional[Path] = None):
        path = templates_file or (CONFIG_DIR / "phrase_templates.json")
        self.templates: Dict[str, Any] = {}
        if path.exists():
            try:
                with path.open("r", encoding="utf-8") as f:
                    self.templates = json.load(f)
            except Exception as e:
                print(f"[PhraseBuilder Warning] Failed to read templates: {e}")

    def build_phrase(self, tokens: List[str]) -> Dict[str, Any]:
        """
        Maps a sequence of recognized ASL tokens to a canonical phrase
        with English, Tamil, and Hindi translations.
        """
        if not tokens:
            return {
                "matched": False,
                "approximate": False,
                "en": "",
                "ta": "",
                "hi": "",
                "tokens": [],
            }

        token_set = set(t.lower().strip().replace(" ", "") for t in tokens)

        # Check for best subset match in templates
        best_match = None
        best_overlap = 0

        for key, tmpl in self.templates.items():
            tmpl_set = set(t.lower().strip().replace(" ", "") for t in tmpl.get("tokens", []))
            if tmpl_set and tmpl_set.issubset(token_set):
                overlap = len(tmpl_set)
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_match = tmpl

        if best_match is not None:
            return {
                "matched": True,
                "approximate": False,
                "en": best_match["en"],
                "ta": best_match.get("ta", ""),
                "hi": best_match.get("hi", ""),
                "tokens": best_match.get("tokens", []),
            }

        # Fallback readable translation
        en_fallback = " ".join(tokens).capitalize() + "."
        return {
            "matched": False,
            "approximate": True,
            "en": en_fallback,
            "ta": "மொழிபெயர்ப்பு: " + " ".join(tokens),
            "hi": "अनुवाद: " + " ".join(tokens),
            "tokens": tokens,
        }
