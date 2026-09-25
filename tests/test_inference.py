"""
Unit tests for model inference pipeline
"""

import sys
from pathlib import Path
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

from app.inference.model_loader import get_model_manager
from app.preprocessing.landmark_utils import load_label_map
from app.config.settings import settings


def test_model_initialization():
    mgr = get_model_manager()
    assert mgr.status == "Ready"
    assert mgr.param_count == 1_836_569
    assert mgr.weights_path.exists()


def test_forward_pass_shape():
    mgr = get_model_manager()
    dummy_input = np.zeros((30, 543, 3), dtype=np.float32)
    dummy_input[:, 17] = [0.5, 0.45, 0.0]
    output = mgr.predict(dummy_input)
    assert output.shape == (250,)
    assert np.isclose(np.sum(output), 1.0, atol=1e-3)


def test_label_map_contents():
    s2p, p2s = load_label_map(settings.model.label_map_path)
    assert len(s2p) == 250
    assert len(p2s) == 250
    assert "wait" in s2p
    assert "time" in s2p
    assert "sick" in s2p
    assert "owie" in s2p
    assert "water" in s2p
    assert "pen" in s2p


if __name__ == "__main__":
    test_model_initialization()
    test_forward_pass_shape()
    test_label_map_contents()
    print("All inference unit tests passed!")
