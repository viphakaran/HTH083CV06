"""
Landmark Processing and Extraction Utilities
Handles:
- MediaPipe Holistic detection (server webcam)
- Web client landmark stream parsing (browser webcam)
- Subtle skeletal drawing for HUD (focus on hands, face omitted for privacy)
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import cv2
import numpy as np

TOTAL_LANDMARKS = 543
FACE_START, FACE_END = 0, 468
LHAND_START, LHAND_END = 468, 489
POSE_START, POSE_END = 489, 522
RHAND_START, RHAND_END = 522, 543

# Reference lip anchor point coordinate (approximate center for normalization when face is masked)
DEFAULT_LIP_ANCHOR = [0.5, 0.45, 0.0]


def create_empty_landmark_frame() -> np.ndarray:
    """Returns an empty (543, 3) landmark frame filled with NaNs and default lip anchor."""
    frame_lms = np.full((TOTAL_LANDMARKS, 3), np.nan, dtype=np.float32)
    frame_lms[17] = DEFAULT_LIP_ANCHOR  # landmark 17 is lower lip anchor
    return frame_lms


def parse_client_landmarks(multi_hand_landmarks: List[Any], handedness: Optional[List[Any]] = None) -> np.ndarray:
    """
    Parses landmarks received over WebSocket from the browser's MediaPipe HandLandmarker.
    Maps 21 hand landmarks to either left (468:489) or right (522:543).
    """
    frame_lms = create_empty_landmark_frame()

    if not multi_hand_landmarks:
        return frame_lms

    for idx, hand in enumerate(multi_hand_landmarks):
        if not hand:
            continue

        # Extract hand side
        is_left = False
        if handedness and idx < len(handedness) and handedness[idx]:
            cat = handedness[idx][0] if isinstance(handedness[idx], list) else handedness[idx]
            label = cat.get("displayName") or cat.get("categoryName") or ("Left" if idx == 1 else "Right")
            is_left = label.lower() == "left"
        else:
            is_left = (idx == 1)

        coords = []
        for lm in hand:
            if isinstance(lm, dict):
                coords.append([float(lm.get("x", 0.0)), float(lm.get("y", 0.0)), float(lm.get("z", 0.0))])
            elif hasattr(lm, "x"):
                coords.append([float(lm.x), float(lm.y), float(lm.z)])

        if len(coords) == 21:
            if is_left:
                frame_lms[LHAND_START:LHAND_END] = coords
            else:
                frame_lms[RHAND_START:RHAND_END] = coords

    return frame_lms


def extract_holistic_landmarks(results: Any) -> np.ndarray:
    """
    Extracts (543, 3) array from MediaPipe Holistic results.
    Face landmarks are omitted/masked to preserve user privacy and focus exclusively on hands.
    """
    frame_lms = create_empty_landmark_frame()

    # Left Hand (21 points)
    if results.left_hand_landmarks:
        frame_lms[LHAND_START:LHAND_END] = [
            [lm.x, lm.y, lm.z] for lm in results.left_hand_landmarks.landmark
        ]

    # Pose (33 points)
    if results.pose_landmarks:
        frame_lms[POSE_START:POSE_END] = [
            [lm.x, lm.y, lm.z] for lm in results.pose_landmarks.landmark
        ]
        # Use nose landmark if available for better center anchor
        nose_lm = results.pose_landmarks.landmark[0]
        frame_lms[17] = [nose_lm.x, nose_lm.y, nose_lm.z]

    # Right Hand (21 points)
    if results.right_hand_landmarks:
        frame_lms[RHAND_START:RHAND_END] = [
            [lm.x, lm.y, lm.z] for lm in results.right_hand_landmarks.landmark
        ]

    return frame_lms


def load_label_map(json_path: Path) -> Tuple[Dict[str, int], Dict[int, str]]:
    """Loads sign to prediction index JSON and returns forward and reverse mappings."""
    if not json_path.exists():
        raise FileNotFoundError(f"Label map not found at {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        s2p_raw = json.load(f)

    s2p = {k.lower(): v for k, v in s2p_raw.items()}
    p2s = {v: k for k, v in s2p_raw.items()}
    return s2p, p2s
