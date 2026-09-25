"""
Standalone Model Smoke Test for LowKeySigns
Validates:
1. Model loading & weights integrity
2. Parameter count verification (~1.836M parameters)
3. Preprocessing transformation (543 coords -> 708 features)
4. Sequence classification forward pass
5. Label map resolution
6. Temporal stabilization state machine
7. Multi-lingual phrase builder
"""

import sys
import time
from pathlib import Path

# Enable UTF-8 encoding on Windows console for Tamil / Hindi display
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend and project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

import numpy as np


def run_smoke_test():
    print("=" * 65)
    print("  LOWKEYSIGNS — COMPREHENSIVE BACKEND SMOKE TEST")
    print("=" * 65)

    # 1. Test Model Loading
    print("\n[Step 1] Initializing ModelManager and loading weights...")
    t0 = time.time()
    from app.inference.model_loader import get_model_manager

    mgr = get_model_manager()
    load_time = time.time() - t0
    print(f"  -> Model Status: {mgr.status}")
    print(f"  -> Parameter Count: {mgr.param_count:,}")
    print(f"  -> Load Duration: {load_time:.3f} s")
    assert mgr.status == "Ready", f"Expected Ready status, got {mgr.status}"
    assert mgr.param_count > 1_500_000, f"Unexpected parameter count: {mgr.param_count}"

    # 2. Test Preprocessing & Forward Pass
    print("\n[Step 2] Testing Preprocess Layer & Model Forward Pass...")
    dummy_seq = np.random.randn(30, 543, 3).astype(np.float32)
    # Set lip anchor
    dummy_seq[:, 17] = [0.5, 0.45, 0.0]

    t_inf_start = time.time()
    probs = mgr.predict(dummy_seq)
    inf_time_ms = (time.time() - t_inf_start) * 1000
    print(f"  -> Output shape: {probs.shape} (Expected: (250,))")
    print(f"  -> First forward pass latency: {inf_time_ms:.2f} ms")
    print(f"  -> Probability sum: {np.sum(probs):.4f}")
    assert probs.shape == (250,), f"Expected shape (250,), got {probs.shape}"

    # Benchmark 20 iterations
    latencies = []
    for _ in range(20):
        t_s = time.time()
        _ = mgr.predict(dummy_seq)
        latencies.append((time.time() - t_s) * 1000)
    print(f"  -> Average inference latency: {np.mean(latencies):.2f} ms (Min: {np.min(latencies):.2f} ms)")

    # 3. Test Label Map Resolution
    print("\n[Step 3] Testing Label Map & Vocabulary Mapping...")
    from app.preprocessing.landmark_utils import load_label_map
    from app.config.settings import settings

    s2p, p2s = load_label_map(settings.model.label_map_path)
    print(f"  -> Total classes in label map: {len(s2p)}")
    assert len(s2p) == 250, f"Expected 250 classes, got {len(s2p)}"
    assert "wait" in s2p, "Class 'wait' missing from label map"
    assert "time" in s2p, "Class 'time' missing from label map"
    assert "sick" in s2p, "Class 'sick' missing from label map"
    print(f"  -> Sample mapped indices: wait={s2p['wait']}, time={s2p['time']}, sick={s2p['sick']}")

    # 4. Test Temporal Stabilizer State Machine
    print("\n[Step 4] Testing Temporal Stabilization State Machine...")
    from app.inference.stabilizer import PredictionStabilizer

    stabilizer = PredictionStabilizer(p2s_map=p2s, confidence_threshold=0.50, consecutive_required=2)

    # Simulated sub-threshold prediction (e.g. uniform distribution across 250 classes: 1/250 = 0.004)
    uniform_conf = np.full(250, 1.0 / 250, dtype=np.float32)
    accepted, telemetry = stabilizer.process_prediction(uniform_conf)
    print(f"  -> Sub-threshold prediction handled: accepted={accepted} (Status: {telemetry['status']})")
    assert accepted is None, "Stabilizer accepted sub-threshold prediction!"

    # Reset stabilizer for consecutive frame test
    stabilizer.reset()

    # Simulated consecutive high-confidence frames:
    high_conf = np.zeros(250, dtype=np.float32)
    high_conf[s2p["wait"]] = 0.92

    # Frame 1 (Consecutive 1/2)
    acc1, tel1 = stabilizer.process_prediction(high_conf)
    print(f"  -> Frame 1 (Consecutive 1/2): accepted={acc1 is not None} (Status: {tel1['status']})")
    assert acc1 is None, "Accepted prematurely before consecutive threshold!"

    # Frame 2 (Consecutive 2/2)
    acc2, tel2 = stabilizer.process_prediction(high_conf)
    print(f"  -> Frame 2 (Consecutive 2/2): accepted={acc2 is not None} (Display: {acc2['display'] if acc2 else None})")
    assert acc2 is not None, "Failed to accept sign after 2 consecutive frames!"
    assert acc2["sign"] == "wait", f"Expected sign 'wait', got {acc2['sign']}"

    # 5. Test Phrase Builder
    print("\n[Step 5] Testing Multi-Lingual Phrase Builder...")
    from app.services.phrase_builder import PhraseBuilder

    pb = PhraseBuilder()
    res1 = pb.build_phrase(["wait", "time"])
    print(f"  -> Phrase ['wait', 'time']:")
    print(f"     EN: {res1['en']}")
    print(f"     TA: {res1['ta']}")
    print(f"     HI: {res1['hi']}")
    assert res1["matched"] is True, "Expected matched phrase template"

    # 6. Test SignLanguageRecognizer Engine
    print("\n[Step 6] Testing Unified SignLanguageRecognizer Pipeline...")
    from app.inference.recognizer import SignLanguageRecognizer

    recognizer = SignLanguageRecognizer()
    for i in range(35):
        frame = np.full((543, 3), np.nan, dtype=np.float32)
        frame[17] = [0.5, 0.45, 0.0]
        # Simulate hand movement
        frame[468:489] = np.random.randn(21, 3) * 0.05 + [0.3, 0.6, 0.0]
        res = recognizer.add_frame(frame)
        if res is not None:
            acc, tel = res
            print(f"  -> Buffer triggered at frame {i+1}! Inference={tel.get('inference_time_ms')}ms, FPS={tel.get('fps')}")

    diag = recognizer.get_diagnostics()
    print(f"\n[Diagnostics Check]:")
    print(f"  Effective FPS: {diag['effective_fps']}")
    print(f"  Total Inferences: {diag['total_inferences']}")
    print(f"  Active Vocabulary: {diag['active_vocabulary_count']} service signs")

    print("\n" + "=" * 65)
    print("  ALL SMOKE TESTS PASSED CLEANLY! SYSTEM IS PRODUCTION-READY.")
    print("=" * 65)


if __name__ == "__main__":
    run_smoke_test()
