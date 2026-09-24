# LowKeySigns — Real-Time ASL Service Counter Engine

This folder contains the **real-time AI inference engine** and **multi-lingual service counter bridge** for LowKeySigns.

---

## Architecture Overview

```
Webcam Feed ──> MediaPipe Holistic (Face, Pose, Hands: 543 Landmarks)
             ──> Coordinate Normalization & Feature Extraction (Lips & Center Anchors)
             ──> 1D-CNN + Transformer ISLR Deep Learning Model (Pre-trained on 94k sequences)
             ──> LowKeySigns Service-Desk Filter (20 Target Service Tokens)
             ──> Multi-modal Output:
                 ├── Audio: Native Windows SAPI / pyttsx3 Speech Synthesis
                 ├── OpenCV HUD: Live Landmark Skeleton, Confidence Bar, FPS & Lighting Telemetry
                 └── WebSockets: ws://127.0.0.1:8001/ws (Direct real-time feed to React Dashboard)
```

---

## Directory Structure

```text
service_engine/
├── .venv/                      # Isolated Python 3.10 virtual environment
├── models/
│   ├── islr-fp16-192-8-seed_all42-foldall-last.h5  # Full 1D-CNN + Transformer weights
│   └── islr-fp16-192-8-seed42-fold0-best.h5        # Fold 0 best weights
├── src/
│   ├── backbone.py             # Transformer & Conv1D blocks
│   ├── config.py               # Landmark indices & topology
│   ├── landmarks_extraction.py # MediaPipe holistic coordinate extraction
│   ├── utils.py                # Coordinate normalization layer
│   └── sign_to_prediction_index_map.json  # 250 ASL vocabulary map
├── phrase_templates.json       # Canonical phrases in English, Tamil, and Hindi
├── phrase_builder.py           # Multi-lingual phrase translation engine
├── service_vocab.py            # 20 Service-Desk vocabulary definitions & filters
├── tts_speaker.py              # Threaded non-blocking Windows TTS speech synthesizer
├── main_cv.py                  # Standalone OpenCV desktop HUD with audio
├── server.py                   # FastAPI + WebSocket server streaming to React frontend
├── run_demo_cv.bat             # 1-click launcher for Standalone OpenCV HUD
└── run_server.bat              # 1-click launcher for React WebSocket Bridge
```

---

## How to Run for the Hackathon Demo

### Mode 1: Standalone OpenCV Window with Audio Speech
Runs the computer vision pipeline with live landmark tracking, modern HUD, and spoken audio:
```bash
run_demo_cv.bat
# Or via terminal:
.venv\Scripts\python.exe main_cv.py
```
* **Keys:**
  * `m`: Toggle between **Service Desk Mode (20 words)** and **Full ASL (250 words)**.
  * `s`: Toggle audio speech synthesis ON/OFF.
  * `c`: Clear conversation history.
  * `q`: Quit.

### Mode 2: Live React Frontend Integration
Connects the live computer vision pipeline directly into the **LowKeySigns React Dashboard**:
1. Start the Python bridge server:
   ```bash
   run_server.bat
   # Or via terminal:
   .venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8001
   ```
2. In `lowkeysigns-frontend`, start the Vite dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173/dashboard`. The top indicator will automatically change to **"Live Model Evaluation"** with a green pulse, and all signed words and phrase translations (English, Tamil, Hindi) will appear live on the screen!
