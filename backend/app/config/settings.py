"""
LowKeySigns Settings and Configuration Manager
Robust path resolution and configuration loading for Windows and all platforms.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

# Root directory of the repository (HTH083CV06_01)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"
MODELS_DIR = PROJECT_ROOT / "backend" / "models"

class SystemSettings(BaseModel):
    app_name: str = "LowKeySigns"
    app_subtitle: str = "Accessibility Communication Bridge"
    version: str = "1.0.0"
    environment: str = "development"

class ServerSettings(BaseModel):
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: List[str] = ["*"]

class ModelSettings(BaseModel):
    architecture: str = "1D-CNN + Transformer"
    params: int = 1836569
    weights_path: Path = Field(default_factory=lambda: MODELS_DIR / "islr-fp16-192-8-seed42-fold0-best.h5")
    label_map_path: Path = Field(default_factory=lambda: MODELS_DIR / "sign_to_prediction_index_map.json")
    input_channels: int = 708
    max_len: int = 384
    num_classes: int = 250
    dim: int = 192

class InferenceSettings(BaseModel):
    sequence_length: int = 30
    stride: int = 15
    confidence_threshold: float = 0.50
    consecutive_frames_required: int = 2
    cooldown_seconds: float = 1.8
    service_mode: bool = True
    non_service_suppression_weight: float = 0.05
    top_k: int = 3

class TTSSettings(BaseModel):
    enabled: bool = True
    engine: str = "sapi"
    rate: int = 1
    volume: int = 100
    cooldown_seconds: float = 2.0

class CameraSettings(BaseModel):
    device_index: int = 0
    width: int = 640
    height: int = 480
    fps: int = 30
    enable_server_camera: bool = False

class Settings(BaseModel):
    project_root: Path = PROJECT_ROOT
    system: SystemSettings = Field(default_factory=SystemSettings)
    server: ServerSettings = Field(default_factory=ServerSettings)
    model: ModelSettings = Field(default_factory=ModelSettings)
    inference: InferenceSettings = Field(default_factory=InferenceSettings)
    tts: TTSSettings = Field(default_factory=TTSSettings)
    camera: CameraSettings = Field(default_factory=CameraSettings)

def load_settings() -> Settings:
    """Loads configuration with hierarchy: settings.json -> Environment Variables -> Defaults"""
    settings_file = CONFIG_DIR / "settings.json"
    raw_cfg: Dict[str, Any] = {}

    if settings_file.exists():
        try:
            with open(settings_file, "r", encoding="utf-8") as f:
                raw_cfg = json.load(f)
        except Exception as e:
            print(f"[Config Warning] Failed to parse settings.json ({e}), using default settings.")

    # Apply environment variable overrides
    if "PORT" in os.environ:
        raw_cfg.setdefault("server", {})["port"] = int(os.environ["PORT"])
    if "HOST" in os.environ:
        raw_cfg.setdefault("server", {})["host"] = os.environ["HOST"]
    if "ENABLE_SERVER_CAMERA" in os.environ:
        raw_cfg.setdefault("camera", {})["enable_server_camera"] = os.environ["ENABLE_SERVER_CAMERA"] == "1"
    if "SERVICE_MODE" in os.environ:
        raw_cfg.setdefault("inference", {})["service_mode"] = os.environ["SERVICE_MODE"] == "1"
    if "CONFIDENCE_THRESHOLD" in os.environ:
        raw_cfg.setdefault("inference", {})["confidence_threshold"] = float(os.environ["CONFIDENCE_THRESHOLD"])
    if "COOLDOWN_SECONDS" in os.environ:
        raw_cfg.setdefault("inference", {})["cooldown_seconds"] = float(os.environ["COOLDOWN_SECONDS"])
    if "ENABLE_TTS" in os.environ:
        raw_cfg.setdefault("tts", {})["enabled"] = os.environ["ENABLE_TTS"] == "1"

    # Resolve paths
    weights_path = MODELS_DIR / "islr-fp16-192-8-seed42-fold0-best.h5"
    if not weights_path.exists():
        # Fallback to LowKeySigns models if running in external context
        fallback_path = Path("C:/A_Hackathon_HackTheHorizon/LowKeySigns/sign-language/models/islr-fp16-192-8-seed42-fold0-best.h5")
        if fallback_path.exists():
            weights_path = fallback_path

    label_map_path = MODELS_DIR / "sign_to_prediction_index_map.json"
    if not label_map_path.exists():
        fallback_map = Path("C:/A_Hackathon_HackTheHorizon/LowKeySigns/sign-language/src/sign_to_prediction_index_map.json")
        if fallback_map.exists():
            label_map_path = fallback_map

    model_cfg = raw_cfg.get("model", {})
    model_cfg["weights_path"] = weights_path
    model_cfg["label_map_path"] = label_map_path
    raw_cfg["model"] = model_cfg

    return Settings(
        project_root=PROJECT_ROOT,
        system=SystemSettings(**raw_cfg.get("system", {})),
        server=ServerSettings(**raw_cfg.get("server", {})),
        model=ModelSettings(**model_cfg),
        inference=InferenceSettings(**raw_cfg.get("inference", {})),
        tts=TTSSettings(**raw_cfg.get("tts", {})),
        camera=CameraSettings(**raw_cfg.get("camera", {}))
    )

# Singleton global instance
settings = load_settings()
