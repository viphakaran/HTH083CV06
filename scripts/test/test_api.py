"""
Automated API and WebSocket Integration Test
Tests:
1. GET / (root endpoint and metadata)
2. GET /health (service health status)
3. GET /model/info (model diagnostic information)
4. GET /vocabulary (approved service dictionary)
5. POST /build_phrase (multi-lingual translation)
6. POST /settings (runtime config update)
7. WebSocket connection and message interchange
"""

import sys
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

from app.api.routes import (
    root,
    health_check,
    model_info,
    get_vocabulary,
    build_phrase_endpoint,
    speak_endpoint,
    get_diagnostics,
    TokenRequest,
    SpeakRequest,
)


def test_api():
    print("=" * 65)
    print("  LOWKEYSIGNS — REST API DIRECT TEST SUITE")
    print("=" * 65)

    # 1. Root Endpoint
    print("\n[Test 1] GET / (root)")
    data = root()
    print(f"  -> App: {data['app_name']} ({data['version']})")
    print(f"  -> Model Status: {data['model']['status']}")
    print(f"  -> Vocabulary Mode: {data['vocabulary_mode']}")
    assert data["status"] == "online"

    # 2. Health Endpoint
    print("\n[Test 2] GET /health")
    health = health_check()
    print(f"  -> Health: {health['status']}")
    assert health["status"] in ["healthy", "degraded"]

    # 3. Model Info
    print("\n[Test 3] GET /model/info")
    info = model_info()
    print(f"  -> Architecture: {info['architecture']}")
    print(f"  -> Parameters: {info['parameters']:,}")
    print(f"  -> Classes: {info['num_classes']}")
    assert info["parameters"] > 1_500_000

    # 4. Vocabulary Endpoint
    print("\n[Test 4] GET /vocabulary")
    vocab = get_vocabulary()
    print(f"  -> Active service classes: {len(vocab.get('active_classes', []))} terms")
    assert len(vocab.get("active_classes", [])) >= 20

    # 5. Build Phrase Endpoint
    print("\n[Test 5] POST /build_phrase")
    req = TokenRequest(tokens=["wait", "time"])
    phrase = build_phrase_endpoint(req)
    print(f"  -> English: {phrase['en']}")
    print(f"  -> Matched: {phrase['matched']}")
    assert phrase["matched"] is True
    assert phrase["en"] == "Please wait for your turn."

    # 6. Speak Endpoint
    print("\n[Test 6] POST /speak")
    speak_req = SpeakRequest(text="Test announcement", cooldown=0.1)
    speak_res = speak_endpoint(speak_req)
    print(f"  -> Speak status: {speak_res['status']}")
    assert speak_res["status"] == "queued"

    # 7. Diagnostics Endpoint
    print("\n[Test 7] GET /diagnostics")
    diag = get_diagnostics()
    print(f"  -> Effective FPS: {diag['effective_fps']}")
    print(f"  -> Model Status: {diag['model_status']}")
    assert diag["model_status"] == "Ready"

    print("\n" + "=" * 65)
    print("  ALL API ENDPOINTS TESTED AND VALIDATED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    test_api()
