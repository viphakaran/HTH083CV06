# LowKeySigns — System Architecture Specification
**Problem ID**: HTH-CV-09 (Accessibility-First Sign Language Communication Bridge)  
**Hackathon**: HTH — Hack the Horizon  

---

## 1. High-Level System Architecture

LowKeySigns bridges communication between Deaf / Hard-of-Hearing (D/HH) citizens and hearing public service counter staff (e.g. hospitals, civic desks, transportation terminals, bank branches) using a local, real-time sign language recognition engine.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CITIZEN INTERFACE (Mode A)                            │
│                                                                                 │
│   Webcam Video Feed (30 FPS)                                                    │
│       │                                                                         │
│       ▼                                                                         │
│   Lightweight MediaPipe HandLandmarker (42 Keypoints: Bilateral Hands)          │
│   [468 Face Mesh Removed to Save Resources & Eliminate Facial Biometrics]       │
│       │ Compact Skeletal Packet                                                 │
│       ▼                                                                         │
│   WebSocket Uplink (ws://127.0.0.1:8000/ws)                                     │
└───────┼─────────────────────────────────────────────────────────────────────────┘
        │ JSON landmark packet {frame_id, multi_hand_landmarks: [...]}
        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FASTAPI LOCAL INFERENCE BACKEND                            │
│                                                                                 │
│   Circular Rolling Buffer (Window: 30 frames, Stride: 15 frames)                │
│       │ (30, 543, 3) Float32 Tensor                                             │
│       ▼                                                                         │
│   TensorFlow Vectorized Preprocess Layer                                        │
│       * Coordinate extraction (Selected 78 Lip + Hand landmarks)                │
│       * Spatial centering: Lip center (landmark index 17) anchor                │
│       * Inter-sample scale invariance: Standard deviation normalization         │
│       * Temporal dynamics: 1st difference ($dx$) + 2nd difference ($dx2$)       │
│       * 708 features per time step                                              │
│       │ (1, 384, 708) Float32 Model Input                                       │
│       ▼                                                                         │
│   1D-CNN + Transformer Hybrid ISLR Engine                                       │
│       * Conv1D stem (192 filters, kernel 11)                                    │
│       * 2x Conv1D Depthwise Blocks + ECA Attention                              │
│       * 2x Transformer Blocks (Multi-Head Self-Attention + Feed Forward)        │
│       * Global Average Pooling + Softmax Classifier Head                        │
│       │ 250 Softmax Probabilities                                               │
│       ▼                                                                         │
│   Temporal Stabilization State Machine                                          │
│       * Minimum Confidence Threshold Gate (p >= 0.50)                           │
│       * 2-Window Consecutive Agreement Gate                                     │
│       * Active Vocabulary Priority Weight (+0.05)                               │
│       * Debounce Cooldown Period (1.8s)                                         │
│       │ Accepted Sign Token (e.g. "sick", "police", "help")                     │
│       ▼                                                                         │
│   Multi-Lingual Phrase Engine                                                   │
│       * Grammar token smoothing & phrase templating                             │
│       * English / Tamil / Hindi text generation                                 │
│       * Local Windows SAPI TTS voice synthesizer (async)                        │
└───────┼─────────────────────────────────────────────────────────────────────────┘
        │ WebSocket Downlink {type: "prediction", token, phrase, confidence}
        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SERVICE DESK DISPLAY (Mode B)                            │
│                                                                                 │
│   * High-contrast, large-format sign output for staff                           │
│   * Multi-lingual transcript history (English, Tamil, Hindi)                    │
│   * Service Staff Response Input Box + Quick Preset Announcements               │
│   * Real-Time Diagnostics Panel (Latency, FPS, Hardware usage)                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Hardware and Software Separation

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend UI** | React 18, TypeScript, Vite, Tailwind-free Vanilla CSS | Responsive SaaS dashboard, WebGL/Canvas rendering, speech output |
| **Landmark Extraction** | MediaPipe HandLandmarker (Browser / Server fallback) | Ultra-lightweight hand skeletal extraction (42 points); 468 Face Mesh omitted |
| **Backend Server** | Python 3.10, FastAPI, Uvicorn, WebSockets | Asynchronous pipeline orchestrator, stream multiplexing |
| **Machine Learning** | TensorFlow 2.15, Keras | 1D-CNN + Transformer hybrid model evaluation |
| **Speech Engine** | Windows SAPI (pywin32) + Web Speech API | Offline text-to-speech for citizen gestures |

---

## 3. Communication Protocols

### 3.1 WebSocket Endpoint (`/ws`)
- **Protocol**: `ws://127.0.0.1:8000/ws`
- **Uplink Format**:
  ```json
  {
    "type": "frame_landmarks",
    "frame_id": 142,
    "timestamp": 1727211078.12,
    "multi_hand_landmarks": [
      [{"x": 0.482, "y": 0.312, "z": -0.045}, ... 21 points per hand]
    ],
    "handedness": [{"categoryName": "Right", "score": 0.98}]
  }
  ```
- **Downlink Format**:
  ```json
  {
    "type": "prediction",
    "token": "sick",
    "confidence": 0.942,
    "phrase_en": "I am feeling sick / unwell.",
    "phrase_ta": "எனக்கு உடல்நலக்குறைவாக உள்ளது.",
    "phrase_hi": "मेरी तबियत ठीक नहीं है।",
    "is_stable": true,
    "latency_ms": 34.2
  }
  ```

### 3.2 REST API Endpoints
- `GET /health`: Health and server status.
- `GET /model/info`: Model metadata, parameter count (1,836,569), weight size (7.53 MB).
- `GET /vocabulary`: Active service vocabulary list, categories, phrases.
- `POST /build_phrase`: Converts array of sign tokens into natural language.
- `POST /speak`: Dispatches offline Windows SAPI audio synthesis.
- `GET /diagnostics`: Live hardware metrics, inference latency, rolling FPS.
- `GET /settings`: Active confidence gates, buffer sizes, debounce parameters.
