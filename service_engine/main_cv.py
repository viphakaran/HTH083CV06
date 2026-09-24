"""
LowKeySigns - Standalone Real-Time Gesture Recognition & Speech HUD
Features:
- Live MediaPipe Holistic landmark tracking (Face, Pose, Hands)
- 1D-CNN + Transformer ISLR model evaluation
- Service-Desk Mode filter (20 high-value public service tokens) vs Full ASL (250 tokens)
- Real-time offline speech synthesis via Windows SAPI / TTSSpeaker
- Real-time lighting / luminance calibration monitor (Hackathon Tier 1 criteria)
"""

import time
import os
import cv2
import numpy as np
import mediapipe as mp

from src.backbone import TFLiteModel, get_model
from src.landmarks_extraction import mediapipe_detection, draw, extract_coordinates, load_json_file
from src.config import SEQ_LEN, THRESH_HOLD
from service_vocab import is_service_word, get_display_name, SERVICE_COUNTER_VOCAB
from tts_speaker import TTSSpeaker

# Color palette: Navy SaaS aesthetic (#1F3864) with cyan accent (#00D2FF)
NAVY_BG = (100, 56, 31)        # BGR for #1F3864
CYAN_ACCENT = (255, 210, 0)     # BGR for #00D2FF
GREEN_SUCCESS = (80, 205, 50)   # BGR for high confidence
WHITE = (255, 255, 255)
LIGHT_GRAY = (220, 220, 220)
DARK_BAR = (30, 30, 30)

def main():
    print("=" * 60)
    print("  LowKeySigns: Real-Time ASL Service Counter Engine")
    print("=" * 60)

    # 1. Load Vocabulary Maps
    json_path = os.path.join(os.path.dirname(__file__), "src", "sign_to_prediction_index_map.json")
    s2p_raw = load_json_file(json_path)
    s2p_map = {k.lower(): v for k, v in s2p_raw.items()}
    p2s_map = {v: k for k, v in s2p_raw.items()}

    # 2. Load Model Weights
    model_weight_path = os.path.join(os.path.dirname(__file__), "models", "islr-fp16-192-8-seed_all42-foldall-last.h5")
    if not os.path.exists(model_weight_path):
        # Fallback to fold0-best if all-last is missing
        model_weight_path = os.path.join(os.path.dirname(__file__), "models", "islr-fp16-192-8-seed42-fold0-best.h5")
    
    print(f"[Model] Loading weights from: {model_weight_path}...")
    base_model = get_model()
    base_model.load_weights(model_weight_path)
    tflite_keras_model = TFLiteModel(islr_models=[base_model])
    print("[Model] 1D-CNN + Transformer weights loaded successfully!")

    # 3. Initialize Audio TTS Speaker
    tts = TTSSpeaker(rate=1, volume=100)
    tts.speak("LowKeySigns ready.")

    # 4. Open Webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[Error] Could not open webcam device index 0.")
        return

    # Configuration flags
    service_mode = True  # True: filter to 20 service desk words, False: full 250 words
    tts_enabled = True

    sequence_data = []
    recognized_history = []
    current_prediction = ""
    current_conf = 0.0
    current_category = ""
    fps_time = time.time()
    fps = 30.0

    mp_holistic = mp.solutions.holistic

    print("\n[Controls]:")
    print("  'q' - Quit application")
    print("  'm' - Toggle Mode (Service-Desk 20 Words vs Full 250 Words)")
    print("  's' - Toggle Speech Audio (TTS on/off)")
    print("  'c' - Clear recognized sentence history")
    print("-" * 60)

    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5, refine_face_landmarks=False) as holistic:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            loop_start = time.time()

            # Measure Lighting / Average frame luminance for robustness verification
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            avg_luminance = np.mean(gray)
            lighting_desc = "Optimal" if 80 <= avg_luminance <= 180 else ("Low-Light" if avg_luminance < 80 else "Overexposed")

            # 1. MediaPipe detection & landmarks drawing (Hand gestures only, face mapping removed)
            image, results = mediapipe_detection(frame, holistic)
            draw(image, results)

            # 2. Extract (543, 3) coordinate array
            try:
                landmarks = extract_coordinates(results)
            except Exception:
                landmarks = np.full((468 + 21 + 33 + 21, 3), np.nan)
            
            sequence_data.append(landmarks)

            # 3. Sliding window prediction every SEQ_LEN (30 frames)
            if len(sequence_data) >= SEQ_LEN:
                pred_input = np.array(sequence_data[-SEQ_LEN:], dtype=np.float32)
                pred_output = tflite_keras_model(pred_input)["outputs"].numpy()

                # Zero out or down-weight non-service words if service_mode is enabled
                filtered_probs = pred_output.copy()
                if service_mode:
                    for idx, raw_sign in p2s_map.items():
                        if not is_service_word(raw_sign):
                            filtered_probs[idx] *= 0.05  # strong suppression of non-service tokens

                max_idx = int(np.argmax(filtered_probs))
                conf = float(filtered_probs[max_idx])
                raw_sign = p2s_map.get(max_idx, "")

                if conf > THRESH_HOLD and raw_sign:
                    disp_name = get_display_name(raw_sign)
                    current_prediction = disp_name
                    current_conf = conf

                    # Determine category
                    clean_sign = raw_sign.lower().replace(" ", "")
                    if clean_sign in SERVICE_COUNTER_VOCAB:
                        current_category = SERVICE_COUNTER_VOCAB[clean_sign]["category"]
                    else:
                        current_category = "General ASL"

                    # Add to history and speak aloud if not recently repeated
                    if len(recognized_history) == 0 or recognized_history[-1] != disp_name:
                        recognized_history.append(disp_name)
                        if len(recognized_history) > 6:
                            recognized_history.pop(0)

                        if tts_enabled:
                            tts.speak(disp_name, cooldown=2.0)
                else:
                    current_prediction = ""
                    current_conf = 0.0
                    current_category = ""

                # Shift sequence buffer
                sequence_data = sequence_data[-15:]

            # 4. Render HUD overlay
            image = cv2.flip(image, 1)  # mirror image for intuitive signing
            h, w = image.shape[:2]

            # Top Header Bar (Height: 50px)
            cv2.rectangle(image, (0, 0), (w, 50), NAVY_BG, -1)
            cv2.line(image, (0, 50), (w, 50), CYAN_ACCENT, 2)
            cv2.putText(image, "LowKeySigns | Service Counter Bridge", (15, 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, WHITE, 2, cv2.LINE_AA)

            mode_text = f"Mode: {'Service-Desk (20)' if service_mode else 'Full ASL (250)'} [M]"
            cv2.putText(image, mode_text, (w - 380, 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, CYAN_ACCENT, 1, cv2.LINE_AA)

            # Bottom Status Bar (Height: 110px)
            banner = np.full((110, w, 3), 20, dtype=np.uint8)
            cv2.line(banner, (0, 0), (w, 0), CYAN_ACCENT, 2)

            # Left side: Live prediction & confidence
            if current_prediction:
                conf_pct = int(current_conf * 100)
                cv2.putText(banner, f"Recognized: {current_prediction}", (20, 42),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, GREEN_SUCCESS, 2, cv2.LINE_AA)
                cv2.putText(banner, f"Confidence: {conf_pct}%  [{current_category}]", (20, 80),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, LIGHT_GRAY, 1, cv2.LINE_AA)
                
                # Confidence visual progress bar
                bar_x, bar_y, bar_w, bar_h = 320, 68, 120, 14
                cv2.rectangle(banner, (bar_x, bar_y), (bar_x + bar_w, bar_y + bar_h), DARK_BAR, -1)
                fill_w = int(bar_w * current_conf)
                cv2.rectangle(banner, (bar_x, bar_y), (bar_x + fill_w, bar_y + bar_h), GREEN_SUCCESS, -1)
            else:
                cv2.putText(banner, "Signing Detection: Active (Waiting for sign...)", (20, 42),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 1, cv2.LINE_AA)
                cv2.putText(banner, "Hold sign within camera frame for ~1s", (20, 75),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (130, 130, 130), 1, cv2.LINE_AA)

            # Right side: Running conversation tokens
            history_text = " -> ".join(recognized_history) if recognized_history else "No phrases yet"
            cv2.putText(banner, "Phrase Log:", (w - 420, 32),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, CYAN_ACCENT, 1, cv2.LINE_AA)
            cv2.putText(banner, history_text, (w - 420, 65),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, WHITE, 2, cv2.LINE_AA)

            # Telemetry: FPS and Lighting Condition (Tier 1 criteria)
            cv2.putText(banner, f"FPS: {fps:.1f} | Lighting: {lighting_desc} ({int(avg_luminance)})", (w - 420, 95),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, LIGHT_GRAY, 1, cv2.LINE_AA)

            # Combine camera frame with bottom HUD banner
            output_frame = np.vstack([image, banner])

            # Calculate FPS
            elapsed = time.time() - loop_start
            fps = 0.9 * fps + 0.1 * (1.0 / max(elapsed, 0.001))

            cv2.imshow("LowKeySigns - Live Service Counter Evaluation", output_frame)

            # Key controls
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('m'):
                service_mode = not service_mode
                print(f"[Toggle] Service Mode: {'ON (20 signs)' if service_mode else 'OFF (250 signs)'}")
            elif key == ord('s'):
                tts_enabled = not tts_enabled
                print(f"[Toggle] Audio Speech: {'ON' if tts_enabled else 'OFF'}")
            elif key == ord('c'):
                recognized_history.clear()
                print("[Action] Cleared conversation history.")

    cap.release()
    cv2.destroyAllWindows()
    tts.stop()
    print("[Shutdown] Clean exit completed.")

if __name__ == "__main__":
    main()
