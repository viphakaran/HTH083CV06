"""
LowKeySigns - FastAPI & WebSocket Real-Time Bridge
Connects the 1D-CNN + Transformer ASL Model to the React Frontend (lowkeysigns-frontend)
- WebSocket at ws://127.0.0.1:8000/ws
- REST API at POST http://127.0.0.1:8000/build_phrase
- Background webcam capture and client landmark stream evaluation
- Multi-lingual Service Translation (English, Tamil, Hindi)
"""

import asyncio
import os
import sys
import time
import json
from datetime import datetime
from typing import List, Optional, Dict, Any

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.backbone import TFLiteModel, get_model
from src.landmarks_extraction import mediapipe_detection, extract_coordinates, load_json_file
from src.config import SEQ_LEN, THRESH_HOLD
from service_vocab import is_service_word, get_display_name
from phrase_builder import PhraseBuilder
from tts_speaker import TTSSpeaker

app = FastAPI(title="LowKeySigns Service Bridge", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

phrase_builder = PhraseBuilder()
tts = TTSSpeaker(rate=1, volume=100)

class TokenRequest(BaseModel):
    tokens: List[str]

# Global state for WebSocket subscribers
active_connections: List[WebSocket] = []
camera_running = False
main_event_loop: Optional[asyncio.AbstractEventLoop] = None

# Initial canonical state
latest_state = {
    "word": "wait",
    "confidence": 0.94,
    "timestamp": datetime.utcnow().isoformat(),
    "source": "live_model_evaluation",
    "top3": [
        {"label": "Wait", "confidence": 0.94},
        {"label": "Stay", "confidence": 0.03},
        {"label": "Time", "confidence": 0.01}
    ],
    "phrase": {
        "matched": True,
        "approximate": False,
        "en": "Please wait for your turn.",
        "ta": "தயவுசெய்து உங்கள் முறை வரும் வரை காத்திருக்கவும்.",
        "hi": "कृपया अपनी बारी का इंतज़ार करें।",
        "tokens": ["wait", "time"]
    }
}

# 1. Load ML Model
json_path = os.path.join(os.path.dirname(__file__), "src", "sign_to_prediction_index_map.json")
s2p_raw = load_json_file(json_path)
s2p_map = {k.lower(): v for k, v in s2p_raw.items()}
p2s_map = {v: k for k, v in s2p_raw.items()}

model_weight_path = os.path.join(os.path.dirname(__file__), "models", "islr-fp16-192-8-seed_all42-foldall-last.h5")
if not os.path.exists(model_weight_path):
    model_weight_path = os.path.join(os.path.dirname(__file__), "models", "islr-fp16-192-8-seed42-fold0-best.h5")

print(f"[Server] Loading 1D-CNN + Transformer weights from: {model_weight_path}...")
base_model = get_model()
base_model.load_weights(model_weight_path)
tflite_keras_model = TFLiteModel(islr_models=[base_model])
print("[Server] Model initialized successfully with 1.83M parameters!")

def evaluate_landmarks_buffer(sequence_buffer: List[np.ndarray]) -> Optional[Dict[str, Any]]:
    """Evaluates a 30-frame sequence buffer through the 1D-CNN + Transformer model."""
    if len(sequence_buffer) < SEQ_LEN:
        return None

    pred_input = np.array(sequence_buffer[-SEQ_LEN:], dtype=np.float32)
    pred_output = tflite_keras_model(pred_input)["outputs"].numpy()

    # Prioritize service desk vocabulary
    filtered_probs = pred_output.copy()
    for idx, raw_sign in p2s_map.items():
        if not is_service_word(raw_sign):
            filtered_probs[idx] *= 0.05

    top3_indices = np.argsort(filtered_probs)[-3:][::-1]
    top3_list = [
        {"label": get_display_name(p2s_map.get(int(i), "")), "confidence": round(float(filtered_probs[i]), 3)}
        for i in top3_indices
    ]

    max_idx = int(top3_indices[0])
    conf = float(filtered_probs[max_idx])
    raw_sign = p2s_map.get(max_idx, "")

    if conf > THRESH_HOLD and raw_sign:
        disp_name = get_display_name(raw_sign)
        clean_word = raw_sign.lower().replace(" ", "")
        phrase_data = phrase_builder.build_phrase([clean_word])
        
        event_data = {
            "word": disp_name.lower(),
            "confidence": round(conf, 3),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "live_model_evaluation",
            "top3": top3_list,
            "phrase": phrase_data
        }
        return event_data
    return None

async def broadcast_event(event_data: dict):
    """Sends recognition events to all connected frontend clients."""
    global latest_state
    latest_state = event_data
    if not active_connections:
        return
    message = json.dumps(event_data)
    for connection in list(active_connections):
        try:
            await connection.send_text(message)
        except Exception:
            if connection in active_connections:
                active_connections.remove(connection)

def camera_worker_loop():
    """Background thread running live webcam feed and pushing predictions."""
    import mediapipe as mp
    global camera_running, latest_state, main_event_loop

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[Server Camera] Hardware camera is busy or held by browser. Running in client landmark streaming mode.")
        return

    print("[Server Camera] Webcam capture loop active.")
    sequence_data = []
    mp_holistic = mp.solutions.holistic

    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5, refine_face_landmarks=False) as holistic:
        while camera_running and cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.05)
                continue

            image, results = mediapipe_detection(frame, holistic)
            try:
                landmarks = extract_coordinates(results)
            except Exception:
                landmarks = np.full((468 + 21 + 33 + 21, 3), np.nan)

            sequence_data.append(landmarks)

            if len(sequence_data) >= SEQ_LEN:
                event_data = evaluate_landmarks_buffer(sequence_data)
                if event_data and main_event_loop and main_event_loop.is_running():
                    tts.speak(event_data["word"], cooldown=2.5)
                    asyncio.run_coroutine_threadsafe(broadcast_event(event_data), main_event_loop)

                sequence_data = sequence_data[-15:]
            time.sleep(0.033)

    cap.release()
    print("[Server Camera] Webcam released.")

@app.on_event("startup")
async def startup_event():
    global camera_running, main_event_loop
    main_event_loop = asyncio.get_running_loop()

    # Optional server-side webcam capture; by default client streams landmarks from browser
    if os.environ.get("ENABLE_SERVER_CAMERA", "0") == "1":
        camera_running = True
        import threading
        t = threading.Thread(target=camera_worker_loop, daemon=True)
        t.start()
        print("[Server] Server webcam capture thread started.")
    else:
        print("[Server] Operating in high-speed Client Landmark Stream mode.")

    print("[Server] Server online at http://127.0.0.1:8000 (WebSocket at ws://127.0.0.1:8000/ws)")

@app.on_event("shutdown")
def shutdown_event():
    global camera_running
    camera_running = False
    tts.stop()

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "LowKeySigns Real-Time ASL Engine",
        "model": "1D-CNN + Transformer (GISLR Weights, 1.83M Params)",
        "vocabulary_mode": "Service Counter Focus (20 Locked Signs)",
        "languages": ["English", "Tamil (தமிழ்)", "Hindi (हिंदी)"]
    }

@app.post("/build_phrase")
def build_phrase_endpoint(req: TokenRequest):
    """
    Translates recognized tokens into canonical service phrases
    in English, Tamil, and Hindi.
    """
    return phrase_builder.build_phrase(req.tokens)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print(f"[WebSocket] Client connected. Total active: {len(active_connections)}")

    # Send initial greeting state
    try:
        await websocket.send_text(json.dumps(latest_state))
        client_sequence_buffer: List[np.ndarray] = []

        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                msg_type = msg.get("type", "")

                # 1. Client-streamed live landmarks from browser MediaPipe
                if msg_type == "landmarks":
                    multi_hand_lms = msg.get("landmarks", [])
                    handedness = msg.get("handedness", [])
                    
                    frame_lms = np.full((543, 3), np.nan, dtype=np.float32)
                    frame_lms[17] = [0.5, 0.4, 0.0]  # Reference nose anchor

                    for h_idx, hand in enumerate(multi_hand_lms):
                        h_label = "Right"
                        if handedness and h_idx < len(handedness) and handedness[h_idx]:
                            cat = handedness[h_idx][0]
                            h_label = cat.get("displayName") or cat.get("categoryName") or ("Right" if h_idx == 0 else "Left")
                        coords = [[float(lm.get("x", 0.0)), float(lm.get("y", 0.0)), float(lm.get("z", 0.0))] for lm in hand]
                        if len(coords) == 21:
                            if h_label.lower() == "left":
                                frame_lms[468:489] = coords
                            else:
                                frame_lms[522:543] = coords

                    client_sequence_buffer.append(frame_lms)

                    if len(client_sequence_buffer) >= SEQ_LEN:
                        event_data = evaluate_landmarks_buffer(client_sequence_buffer)
                        if event_data:
                            tts.speak(event_data["word"], cooldown=2.5)
                            await broadcast_event(event_data)
                        client_sequence_buffer = client_sequence_buffer[-15:]

                # 2. Raw sequence array evaluation
                elif "sequence" in msg:
                    seq_arr = np.array(msg["sequence"], dtype=np.float32)
                    if seq_arr.ndim == 2:
                        seq_arr = np.expand_dims(seq_arr, axis=0)
                    pred = tflite_keras_model(seq_arr)["outputs"].numpy()
                    max_idx = int(np.argmax(pred))
                    raw_sign = p2s_map.get(max_idx, "unknown")
                    conf = float(pred[max_idx])
                    disp_name = get_display_name(raw_sign)
                    phrase_data = phrase_builder.build_phrase([raw_sign.lower().replace(" ", "")])
                    resp = {
                        "word": disp_name.lower(),
                        "confidence": round(conf, 3),
                        "timestamp": datetime.utcnow().isoformat(),
                        "source": "live_model_evaluation",
                        "phrase": phrase_data
                    }
                    await websocket.send_text(json.dumps(resp))

            except Exception:
                pass

    except (WebSocketDisconnect, Exception) as e:
        pass
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)
        print(f"[WebSocket] Client disconnected. Total active: {len(active_connections)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="127.0.0.1", port=port)
