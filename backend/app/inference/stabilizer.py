"""
Temporal Stabilization & Recognition State Machine
Implements:
- Rolling landmark sequence buffer
- Consecutive frame agreement gating
- Minimum confidence filtering
- Service-desk vocabulary priority suppression
- Debounce and cooldown timers
- False positive rejection ("No sign detected")
- Top-K candidate ranking
"""

import time
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import numpy as np

from ..config.settings import settings, CONFIG_DIR


class PredictionStabilizer:
    """
    Temporal stabilization state machine that transforms raw frame-level
    model outputs into reliable, debounced service events.
    """

    def __init__(
        self,
        p2s_map: Dict[int, str],
        confidence_threshold: float = settings.inference.confidence_threshold,
        consecutive_required: int = settings.inference.consecutive_frames_required,
        cooldown_seconds: float = settings.inference.cooldown_seconds,
        service_mode: bool = settings.inference.service_mode,
        suppression_weight: float = settings.inference.non_service_suppression_weight,
        top_k: int = settings.inference.top_k,
    ):
        self.p2s_map = p2s_map
        self.confidence_threshold = confidence_threshold
        self.consecutive_required = consecutive_required
        self.cooldown_seconds = cooldown_seconds
        self.service_mode = service_mode
        self.suppression_weight = suppression_weight
        self.top_k = top_k

        # Load vocabulary configuration
        self.service_vocab: Dict[str, Dict[str, Any]] = {}
        self.active_classes: List[str] = []
        self._load_vocabulary()

        # State machine variables
        self.last_candidate_sign: Optional[str] = None
        self.consecutive_count: int = 0
        self.last_accepted_sign: Optional[str] = None
        self.last_accepted_timestamp: float = 0.0

    def _load_vocabulary(self):
        """Loads vocabulary definitions from config/vocabulary.json."""
        vocab_path = CONFIG_DIR / "vocabulary.json"
        if vocab_path.exists():
            try:
                with open(vocab_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.service_vocab = data.get("definitions", {})
                    self.active_classes = [c.lower() for c in data.get("active_classes", [])]
            except Exception as e:
                print(f"[Stabilizer Warning] Could not load vocabulary.json: {e}")

    def is_service_sign(self, sign: str) -> bool:
        """Checks if a sign belongs to the locked service desk vocabulary."""
        clean = sign.lower().replace(" ", "")
        if self.active_classes:
            return clean in self.active_classes
        return clean in self.service_vocab

    def get_display_name(self, sign: str) -> str:
        """Returns the formatted display name for a sign."""
        clean = sign.lower().replace(" ", "")
        if clean in self.service_vocab:
            return self.service_vocab[clean].get("display", clean.capitalize())
        return sign.capitalize()

    def get_sign_category(self, sign: str) -> str:
        """Returns the civic/service category for the sign."""
        clean = sign.lower().replace(" ", "")
        if clean in self.service_vocab:
            return self.service_vocab[clean].get("category", "General ASL")
        return "General ASL"

    def filter_probabilities(self, raw_probs: np.ndarray) -> np.ndarray:
        """
        Suppresses non-service words when service_mode is enabled.
        Preserves true probabilities for active service desk vocabulary.
        """
        if not self.service_mode:
            return raw_probs

        filtered = raw_probs.copy()
        for idx, sign_name in self.p2s_map.items():
            if not self.is_service_sign(sign_name):
                filtered[idx] *= self.suppression_weight

        # Re-normalize sum
        s = np.sum(filtered)
        if s > 0:
            filtered /= s
        return filtered

    def process_prediction(self, raw_probs: np.ndarray) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
        """
        Processes raw model probabilities through the stabilization state machine.
        Returns (accepted_event_or_None, live_diagnostics).
        """
        now = time.time()
        filtered_probs = self.filter_probabilities(raw_probs)

        # Extract top-K candidates
        top_indices = np.argsort(filtered_probs)[-self.top_k:][::-1]
        top_candidates = [
            {
                "sign": self.p2s_map.get(int(idx), "unknown"),
                "display": self.get_display_name(self.p2s_map.get(int(idx), "unknown")),
                "category": self.get_sign_category(self.p2s_map.get(int(idx), "unknown")),
                "confidence": round(float(filtered_probs[idx]), 3),
            }
            for idx in top_indices
        ]

        best_idx = int(top_indices[0])
        best_conf = float(filtered_probs[best_idx])
        best_sign = self.p2s_map.get(best_idx, "").lower()

        # Telemetry info for UI
        telemetry = {
            "top_candidates": top_candidates,
            "raw_best_sign": best_sign,
            "raw_best_conf": round(best_conf, 3),
            "service_mode": self.service_mode,
            "threshold": self.confidence_threshold,
            "is_confident": best_conf >= self.confidence_threshold,
        }

        # Check confidence gate
        if best_conf < self.confidence_threshold or not best_sign:
            self.consecutive_count = 0
            self.last_candidate_sign = None
            telemetry["status"] = "No confident sign detected"
            return None, telemetry

        # Update consecutive counter
        if best_sign == self.last_candidate_sign:
            self.consecutive_count += 1
        else:
            self.last_candidate_sign = best_sign
            self.consecutive_count = 1

        telemetry["consecutive_count"] = self.consecutive_count

        # Check consecutive threshold
        if self.consecutive_count < self.consecutive_required:
            telemetry["status"] = f"Confirming sign ({self.consecutive_count}/{self.consecutive_required})"
            return None, telemetry

        # Check debounce cooldown
        time_since_accepted = now - self.last_accepted_timestamp
        if best_sign == self.last_accepted_sign and time_since_accepted < self.cooldown_seconds:
            telemetry["status"] = f"Cooldown ({round(self.cooldown_seconds - time_since_accepted, 1)}s remaining)"
            return None, telemetry

        # Accept sign!
        self.last_accepted_sign = best_sign
        self.last_accepted_timestamp = now
        telemetry["status"] = f"Accepted: {self.get_display_name(best_sign)}"

        accepted_event = {
            "sign": best_sign,
            "word": best_sign,
            "display": self.get_display_name(best_sign),
            "category": self.get_sign_category(best_sign),
            "confidence": round(best_conf, 3),
            "timestamp": now,
            "top3": top_candidates,
        }

        return accepted_event, telemetry

    def reset(self):
        """Clears buffers and state."""
        self.last_candidate_sign = None
        self.consecutive_count = 0
        self.last_accepted_sign = None
        self.last_accepted_timestamp = 0.0
