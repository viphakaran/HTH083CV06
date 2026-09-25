"""
FastAPI Routes and WebSocket Controller
Exposes REST endpoints and a high-frequency WebSocket for real-time sign recognition.
"""

import json
import time
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel

from ..config.settings import settings, CONFIG_DIR
from ..inference.recognizer import SignLanguageRecognizer
from ..preprocessing.landmark_utils import parse_client_landmarks
from ..services.phrase_builder import PhraseBuilder
from ..services.tts_service import get_tts_service

router = APIRouter()

# Initialize core services
recognizer = SignLanguageRecognizer()
phrase_builder = PhraseBuilder()
tts_service = get_tts_service()

# Active WebSocket connections
active_connections: List[WebSocket] = []

# Cached initial event
latest_event: Dict[str, Any] = {
    "type": "recognition",
    "word": "wait",
    "display": "Wait",
    "category": "Queue & Timing",
    "confidence": 0.94,
    "timestamp": datetime.utcnow().isoformat(),
    "top3": [
        {"sign": "wait", "display": "Wait", "category": "Queue & Timing", "confidence": 0.94},
        {"sign": "stay", "display": "Stay", "category": "Action", "confidence": 0.03},
        {"sign": "time", "display": "Time", "category": "Queue & Timing", "confidence": 0.01},
    ],
    "phrase": {
        "matched": True,
        "approximate": False,
        "en": "Please wait for your turn.",
        "ta": "தயவுசெய்து உங்கள் முறை வரும் வரை காத்திருக்கவும்.",
        "hi": "कृपया अपनी बारी का इंतज़ार करें।",
        "tokens": ["wait", "time"],
    },
}


class TokenRequest(BaseModel):
    tokens: List[str]


class SpeakRequest(BaseModel):
    text: str
    cooldown: Optional[float] = 1.0


class ConfigUpdateRequest(BaseModel):
    service_mode: Optional[bool] = None
    confidence_threshold: Optional[float] = None


@router.get("/")
def root():
    return {
        "status": "online",
        "app_name": settings.system.app_name,
        "subtitle": settings.system.app_subtitle,
        "version": settings.system.version,
        "model": {
            "status": recognizer.model_manager.status,
            "architecture": settings.model.architecture,
            "parameters": recognizer.model_manager.param_count,
            "load_time_sec": recognizer.model_manager.load_duration_sec,
        },
        "vocabulary_mode": "Service Desk Focus" if recognizer.stabilizer.service_mode else "Full ASL",
        "endpoints": {
            "websocket": "/ws",
            "vocabulary": "/vocabulary",
            "build_phrase": "/build_phrase",
            "diagnostics": "/diagnostics",
            "health": "/health",
        },
    }


@router.get("/health")
def health_check():
    return {
        "status": "healthy" if recognizer.model_manager.status == "Ready" else "degraded",
        "model_status": recognizer.model_manager.status,
        "active_clients": len(active_connections),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/model/info")
def model_info():
    return recognizer.model_manager.get_info()


@router.get("/vocabulary")
def get_vocabulary():
    """Returns the locked service counter vocabulary with metadata."""
    vocab_path = CONFIG_DIR / "vocabulary.json"
    if vocab_path.exists():
        with open(vocab_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "active_classes": list(recognizer.stabilizer.service_vocab.keys()),
        "definitions": recognizer.stabilizer.service_vocab,
    }


@router.post("/build_phrase")
def build_phrase_endpoint(req: TokenRequest):
    """Maps a sequence of recognized tokens to multi-lingual service sentences."""
    return phrase_builder.build_phrase(req.tokens)


@router.post("/speak")
def speak_endpoint(req: SpeakRequest):
    """Triggers speech playback for staff announcements or manual prompts."""
    tts_service.speak(req.text, cooldown=req.cooldown)
    return {"status": "queued", "text": req.text}


@router.get("/diagnostics")
def get_diagnostics():
    """Returns real-time inference telemetry and performance metrics."""
    diag = recognizer.get_diagnostics()
    diag["active_connections"] = len(active_connections)
    diag["server_timestamp"] = time.time()
    return diag


@router.post("/settings")
def update_settings(req: ConfigUpdateRequest):
    """Updates runtime recognition parameters without restart."""
    if req.service_mode is not None:
        recognizer.set_service_mode(req.service_mode)
    if req.confidence_threshold is not None:
        recognizer.set_confidence_threshold(req.confidence_threshold)
    return {
        "status": "updated",
        "service_mode": recognizer.stabilizer.service_mode,
        "confidence_threshold": recognizer.stabilizer.confidence_threshold,
    }


async def broadcast_message(message: Dict[str, Any]):
    """Sends JSON message to all connected clients."""
    if not active_connections:
        return
    text = json.dumps(message)
    for conn in list(active_connections):
        try:
            await conn.send_text(text)
        except Exception:
            if conn in active_connections:
                active_connections.remove(conn)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global latest_event
    await websocket.accept()
    active_connections.append(websocket)
    print(f"[WebSocket] Client connected. Total active: {len(active_connections)}")

    # Send initial greeting state
    try:
        await websocket.send_text(json.dumps(latest_event))

        while True:
            raw_text = await websocket.receive_text()
            try:
                msg = json.loads(raw_text)
                msg_type = msg.get("type", "")

                # 1. Real-time client landmark streaming from browser camera
                if msg_type == "landmarks":
                    multi_hand_lms = msg.get("landmarks", [])
                    handedness = msg.get("handedness", [])

                    # Parse into (543, 3) frame
                    frame_lms = parse_client_landmarks(multi_hand_lms, handedness)

                    # Feed into sliding window recognizer
                    result = recognizer.add_frame(frame_lms)

                    if result is not None:
                        accepted_event, telemetry = result

                        if accepted_event:
                            # Expand into multi-lingual canonical phrase
                            phrase_data = phrase_builder.build_phrase([accepted_event["sign"]])
                            accepted_event["phrase"] = phrase_data
                            accepted_event["type"] = "recognition"

                            latest_event = accepted_event

                            # Non-blocking voice playback
                            tts_service.speak(accepted_event["display"], cooldown=2.0)

                            # Broadcast recognized sign to all screens
                            await broadcast_message(accepted_event)
                        else:
                            # Send intermediate telemetry (consecutive counter, status, top candidate)
                            telemetry["type"] = "telemetry"
                            try:
                                await websocket.send_text(json.dumps(telemetry))
                            except Exception:
                                break

                # 2. Staff response message from desk staff to user
                elif msg_type == "staff_message":
                    staff_text = msg.get("text", "")
                    payload = {
                        "type": "staff_message",
                        "text": staff_text,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                    # Optional speech for staff response
                    if msg.get("speak", False):
                        tts_service.speak(staff_text, cooldown=1.0)
                    await broadcast_message(payload)

                # 3. Direct sequence evaluation
                elif msg_type == "sequence" or "sequence" in msg:
                    seq_data = np.array(msg.get("sequence"), dtype=np.float32)
                    if seq_data.ndim == 2:
                        seq_data = np.expand_dims(seq_data, axis=0)
                    raw_probs = recognizer.predict(seq_data)
                    accepted, telemetry = recognizer.stabilize(raw_probs)
                    resp = {
                        "type": "sequence_result",
                        "accepted": accepted,
                        "telemetry": telemetry,
                    }
                    await websocket.send_text(json.dumps(resp))

                # 4. Keepalive ping
                elif msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "time": time.time()}))

                # 5. Clear / Reset buffer command
                elif msg_type == "clear":
                    recognizer.reset_buffer()
                    await websocket.send_text(json.dumps({"type": "status", "message": "Buffer cleared"}))

            except json.JSONDecodeError:
                pass
            except Exception as e:
                print(f"[WebSocket Loop Warning] {e}")

    except (WebSocketDisconnect, Exception) as e:
        pass
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
        print(f"[WebSocket] Client disconnected. Total active: {len(active_connections)}")
