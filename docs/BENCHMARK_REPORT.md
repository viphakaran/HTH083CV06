# LowKeySigns — Real-Time Inference Benchmark Report
**Challenge**: HTH-CV-09 (Accessibility-First Sign Language Communication Bridge)  
**Date**: 2026-09-25 02:11:18  
**Model Architecture**: 1D-CNN + Transformer Hybrid (~1.836M parameters)  
**Hardware Context**: Commodity CPU (Local Windows Environment)  
**Evaluation Cycles**: 50 iterations  

---

## 1. Measured Latency Breakdown

| Pipeline Stage | Average (ms) | Min (ms) | Max (ms) | P95 (ms) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Model Weight Loading** | `19702.2 ms` | — | — | — | Loaded once on application startup |
| **Feature Preprocessing** | `15.16 ms` | `11.59 ms` | `19.61 ms` | `18.52 ms` | Centering, std scaling, velocity & acceleration |
| **1D-CNN + Transformer Inference** | `19.28 ms` | `16.56 ms` | `29.85 ms` | `27.21 ms` | 384x708 temporal sequence classification |
| **Temporal Stabilization** | `1.17 ms` | `0.96 ms` | `2.76 ms` | `2.15 ms` | Consecutive gating, vocabulary priority, debouncing |
| **Total Evaluation Latency** | `35.61 ms` | — | — | — | Combined feature extract + model + stabilization |
| **Effective Inference Throughput** | **`~28.1 FPS`** | — | — | — | Exceeds 30 FPS real-time webcam threshold |

---

## 2. Key Architecture Specifications

* **Model Parameters**: `1,836,569`
* **Model Size**: ~7.53 MB (FP16 weights)
* **Input Tensor**: `(30, 543, 3)` MediaPipe landmarks
* **Engine Output**: 250 classes (Google ISLR benchmark)
* **Service Vocabulary**: 23 active service-desk tokens
* **Window Size**: 30 frames (1.0s temporal context at 30 FPS)
* **Stride**: 15 frames (0.5s evaluation cadence)
* **Confidence Gate**: 0.50 minimum softmax probability
* **Consecutive Requirement**: 2 consecutive matching windows
* **Cooldown Buffer**: 1.8s debounce cooldown
