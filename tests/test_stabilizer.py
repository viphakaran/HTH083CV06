"""
Unit tests for temporal stabilization state machine
"""

import sys
from pathlib import Path
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

from app.inference.stabilizer import PredictionStabilizer
from app.preprocessing.landmark_utils import load_label_map
from app.config.settings import settings


def test_confidence_threshold_gating():
    s2p, p2s = load_label_map(settings.model.label_map_path)
    stabilizer = PredictionStabilizer(p2s_map=p2s, confidence_threshold=0.50, consecutive_required=2)

    # Uniform low probability (1/250 = 0.004)
    low_probs = np.full(250, 1.0 / 250, dtype=np.float32)
    accepted, tel = stabilizer.process_prediction(low_probs)
    assert accepted is None
    assert tel["status"] == "No confident sign detected"


def test_consecutive_agreement_requirement():
    s2p, p2s = load_label_map(settings.model.label_map_path)
    stabilizer = PredictionStabilizer(p2s_map=p2s, confidence_threshold=0.50, consecutive_required=2)

    high_probs = np.zeros(250, dtype=np.float32)
    high_probs[s2p["wait"]] = 0.95

    # First frame: should accumulate count
    acc1, tel1 = stabilizer.process_prediction(high_probs)
    assert acc1 is None
    assert tel1["consecutive_count"] == 1

    # Second consecutive frame: should trigger acceptance
    acc2, tel2 = stabilizer.process_prediction(high_probs)
    assert acc2 is not None
    assert acc2["sign"] == "wait"
    assert acc2["display"] == "Wait"


def test_cooldown_debounce():
    s2p, p2s = load_label_map(settings.model.label_map_path)
    stabilizer = PredictionStabilizer(p2s_map=p2s, confidence_threshold=0.50, consecutive_required=2, cooldown_seconds=1.5)

    high_probs = np.zeros(250, dtype=np.float32)
    high_probs[s2p["sick"]] = 0.90

    # Trigger accept
    stabilizer.process_prediction(high_probs)
    acc, _ = stabilizer.process_prediction(high_probs)
    assert acc is not None

    # Immediate next frame should be blocked by cooldown
    acc_cooldown, tel_cooldown = stabilizer.process_prediction(high_probs)
    assert acc_cooldown is None
    assert "Cooldown" in tel_cooldown["status"]


if __name__ == "__main__":
    test_confidence_threshold_gating()
    test_consecutive_agreement_requirement()
    test_cooldown_debounce()
    print("All stabilizer unit tests passed!")
