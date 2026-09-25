"""
SignLanguageRecognizer Abstraction
Provides a clean, modular interface decoupling model inference, preprocessing,
and stabilization from external networking and user interfaces.
"""

import time
from typing import Dict, Any, List, Optional, Tuple

import numpy as np

from .model_loader import get_model_manager, ModelManager
from .stabilizer import PredictionStabilizer
from ..preprocessing.landmark_utils import load_label_map, create_empty_landmark_frame
from ..config.settings import settings


class SignLanguageRecognizer:
    """Unified engine encapsulating Model, Preprocessing, and Stabilization."""

    def __init__(self):
        self.model_manager: ModelManager = get_model_manager()
        self.s2p_map, self.p2s_map = load_label_map(settings.model.label_map_path)
        self.stabilizer = PredictionStabilizer(
            p2s_map=self.p2s_map,
            confidence_threshold=settings.inference.confidence_threshold,
            consecutive_required=settings.inference.consecutive_frames_required,
            cooldown_seconds=settings.inference.cooldown_seconds,
            service_mode=settings.inference.service_mode,
            suppression_weight=settings.inference.non_service_suppression_weight,
            top_k=settings.inference.top_k,
        )

        self.sequence_buffer: List[np.ndarray] = []
        self.seq_len: int = settings.inference.sequence_length
        self.stride: int = settings.inference.stride

        # Diagnostic telemetry
        self.total_inferences: int = 0
        self.last_inference_time_ms: float = 0.0
        self.last_pipeline_time_ms: float = 0.0
        self.rolling_fps: float = 30.0
        self._last_frame_time: float = time.time()

    def load_model(self) -> bool:
        """Loads or reloads the model instance."""
        return self.model_manager.load_model()

    def add_frame(self, frame_landmarks: np.ndarray) -> Optional[Tuple[Optional[Dict[str, Any]], Dict[str, Any]]]:
        """
        Adds a single (543, 3) landmark frame to the sliding temporal window.
        When sequence_buffer reaches seq_len (30 frames), executes inference and stabilization.
        Returns (accepted_event, telemetry) or None if still accumulating.
        """
        now = time.time()
        dt = max(now - self._last_frame_time, 0.001)
        self._last_frame_time = now
        instant_fps = 1.0 / dt
        self.rolling_fps = 0.9 * self.rolling_fps + 0.1 * instant_fps

        if frame_landmarks.shape != (543, 3):
            # Guard against invalid shape
            frame_landmarks = create_empty_landmark_frame()

        self.sequence_buffer.append(frame_landmarks)

        # Trigger prediction once sequence buffer reaches window length
        if len(self.sequence_buffer) >= self.seq_len:
            pipeline_start = time.time()

            # 1. Slice current temporal window
            window_slice = np.array(self.sequence_buffer[-self.seq_len:], dtype=np.float32)

            # 2. Predict with 1D-CNN + Transformer
            inf_start = time.time()
            raw_probs = self.predict(window_slice)
            self.last_inference_time_ms = round((time.time() - inf_start) * 1000, 2)

            # 3. Stabilize prediction
            accepted_event, telemetry = self.stabilize(raw_probs)

            # 4. Slide buffer by stride
            keep_len = max(self.seq_len - self.stride, 1)
            self.sequence_buffer = self.sequence_buffer[-keep_len:]

            self.total_inferences += 1
            self.last_pipeline_time_ms = round((time.time() - pipeline_start) * 1000, 2)

            # Append performance telemetry
            telemetry["inference_time_ms"] = self.last_inference_time_ms
            telemetry["pipeline_time_ms"] = self.last_pipeline_time_ms
            telemetry["fps"] = round(self.rolling_fps, 1)
            telemetry["total_inferences"] = self.total_inferences

            return accepted_event, telemetry

        return None

    def predict(self, sequence: np.ndarray) -> np.ndarray:
        """Passes (Sequence_Length, 543, 3) through preprocessing and model."""
        return self.model_manager.predict(sequence)

    def stabilize(self, raw_probs: np.ndarray) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
        """Passes raw probabilities through the temporal state machine."""
        return self.stabilizer.process_prediction(raw_probs)

    def set_service_mode(self, enabled: bool):
        """Toggles between Service-Desk (20 signs) and Full ASL (250 signs)."""
        self.stabilizer.service_mode = enabled

    def set_confidence_threshold(self, threshold: float):
        """Updates minimum confidence threshold."""
        self.stabilizer.confidence_threshold = max(0.1, min(1.0, threshold))

    def get_diagnostics(self) -> Dict[str, Any]:
        """Provides full real-time diagnostics for the secondary UI panel."""
        model_info = self.model_manager.get_info()
        return {
            "model_status": model_info.get("status"),
            "model_architecture": model_info.get("architecture"),
            "model_parameters": model_info.get("parameters"),
            "load_time_sec": model_info.get("load_time_sec"),
            "active_vocabulary_count": len(self.stabilizer.active_classes),
            "service_mode": self.stabilizer.service_mode,
            "confidence_threshold": self.stabilizer.confidence_threshold,
            "cooldown_seconds": self.stabilizer.cooldown_seconds,
            "inference_time_ms": self.last_inference_time_ms,
            "pipeline_time_ms": self.last_pipeline_time_ms,
            "effective_fps": round(self.rolling_fps, 1),
            "total_inferences": self.total_inferences,
            "buffer_fill": len(self.sequence_buffer),
            "window_size": self.seq_len,
        }

    def reset_buffer(self):
        """Clears sequence buffer and stabilizer state."""
        self.sequence_buffer.clear()
        self.stabilizer.reset()
