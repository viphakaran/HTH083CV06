"""
LowKeySigns - Environment Verification Script
Verifies Python version, dependencies, model weights, and config files.
"""

import sys
import os
from pathlib import Path

# Fix Windows console encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def check_environment():
    root = Path(__file__).resolve().parent.parent.parent
    print(f"=== LowKeySigns Environment Verification ===")
    print(f"Working Directory: {root}")
    print(f"Python Executable: {sys.executable}")
    print(f"Python Version:    {sys.version.split()[0]}")

    errors = []
    warnings = []

    # 1. Check Model Weights
    weights_path = root / "backend" / "models" / "islr-fp16-192-8-seed42-fold0-best.h5"
    if weights_path.exists():
        size_mb = weights_path.stat().st_size / (1024 * 1024)
        print(f"  [OK] Model weights found: {weights_path.name} ({size_mb:.2f} MB)")
    else:
        errors.append(f"Model weights not found at {weights_path}")

    # 2. Check Label Map
    label_map_path = root / "backend" / "models" / "sign_to_prediction_index_map.json"
    if label_map_path.exists():
        print(f"  [OK] Label map found: {label_map_path.name}")
    else:
        errors.append(f"Label map not found at {label_map_path}")

    # 3. Check Config files
    vocab_path = root / "config" / "vocabulary.json"
    if vocab_path.exists():
        print(f"  [OK] Vocabulary config found: {vocab_path.name}")
    else:
        errors.append(f"Vocabulary config not found at {vocab_path}")

    settings_path = root / "config" / "settings.json"
    if settings_path.exists():
        print(f"  [OK] Settings config found: {settings_path.name}")
    else:
        errors.append(f"Settings config not found at {settings_path}")

    # 4. Check critical Python packages
    critical_packages = [
        "tensorflow",
        "numpy",
        "fastapi",
        "uvicorn",
        "websockets",
        "mediapipe",
        "cv2",
    ]

    for pkg in critical_packages:
        try:
            mod = __import__(pkg)
            version = getattr(mod, "__version__", "installed")
            print(f"  [OK] Package '{pkg}': v{version}")
        except ImportError:
            errors.append(f"Required Python package '{pkg}' is missing!")

    # 5. Check TTS
    try:
        import win32com.client
        print("  [OK] Windows SAPI (pywin32): Available")
    except ImportError:
        warnings.append("win32com.client not found. TTS will use speech-synthesis fallback.")

    # 6. Check Frontend dist or node_modules
    frontend_dir = root / "frontend"
    node_modules = frontend_dir / "node_modules"
    if node_modules.exists():
        print(f"  [OK] Frontend node_modules present")
    else:
        warnings.append("Frontend node_modules not found. Run 'npm install' in frontend/")

    print("\n--- Summary ---")
    if errors:
        print(f"FAILED with {len(errors)} error(s):")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("ALL CRITICAL SYSTEM CHECKS PASSED!")
        if warnings:
            print(f"Notices ({len(warnings)}):")
            for w in warnings:
                print(f"  * {w}")
        return True

if __name__ == "__main__":
    success = check_environment()
    sys.exit(0 if success else 1)
