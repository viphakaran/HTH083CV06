# LowKeySigns — Machine Learning Pipeline Specification
**Problem ID**: HTH-CV-09 (Accessibility-First Sign Language Communication Bridge)  
**Hackathon**: HTH — Hack the Horizon  

---

## 1. Model Overview

The LowKeySigns recognition core is a sequence-based **1D-CNN + Transformer Hybrid Model** specifically developed for Isolated Sign Language Recognition (ISLR). Rather than processing high-bandwidth raw RGB pixel streams, the pipeline operates entirely on compact 3D skeletal landmark coordinates extracted via MediaPipe Holistic.

### Key Model Characteristics
* **Architecture**: 1D-CNN Stem + Causal Depthwise Separable Conv Blocks + ECA Channel Attention + Transformer Encoders + Global Average Pooling Classifier
* **Parameter Count**: **1,836,569** trainable weights
* **Storage Footprint**: **~7.53 MB** (FP16 weights in HDF5 format)
* **Target Output**: **250 Isolated Sign Language Classes** (Google ISLR benchmark)
* **Active Service Vocabulary**: **23 Service-Desk Tokens** prioritized for civic, medical, and emergency interactions
* **Measured Single-Pass Inference Time**: **19.28 ms** on commodity CPU (Local Windows environment)
* **Total End-to-End Pipeline Latency**: **35.61 ms** (~28.1 FPS)

---

## 2. Temporal Preprocessing (`Preprocess` Layer)

The recognition pipeline is architected for maximum resource efficiency and user privacy:
* **Client Extraction**: **Only bilateral hand landmarks (21 Left Hand + 21 Right Hand = 42 total keypoints)** extracted via MediaPipe HandLandmarker.
* **468 Face Mesh Omission**: The dense 468-point face mesh is **completely bypassed and eliminated** from client extraction, saving over 65% CPU/GPU overhead and preventing battery drain.
* **Anchor Normalization**: Facial landmark 17 (lower lip anchor) is set to a constant physiological reference or derived from pose, allowing the pipeline to maintain spatial scale without running heavy facial mesh inference.
* **Input Buffer**: $(T, 543, 3)$ where non-hand landmarks are masked with default physiological reference values.

```
Client Video Stream (30 FPS)
   │
   ▼
MediaPipe HandLandmarker (42 Hand Keypoints: 21 Left + 21 Right)
[468 Face Mesh completely removed for speed & privacy]
   │
   ▼
Landmark Parsing & Anchor Alignment
   │ Hands mapped to indices [468:489] and [522:543]; Landmark 17 anchor inserted
   │ 40 Lip landmarks + 21 Left Hand + 21 Right Hand (with 4 overlap indices)
   │ (30, 78, 3)
   ▼
Spatial Centering Anchor
   │ Anchor point: Landmark 17 (Center of Lower Lip)
   │ $X_{centered} = X - X_{lip}$
   ▼
Inter-Subject Scale Standardization
   │ $X_{norm} = \frac{X_{centered}}{\sigma(X_{centered}) + \epsilon}$
   ▼
Temporal Derivative Extraction
   │ 1st Difference: $dx = X_{norm}[t] - X_{norm}[t-1]$
   │ 2nd Difference: $dx2 = dx[t] - dx[t-1]$
   ▼
Concatenation & Flattening
   │ Concat $[X_{norm}, dx, dx2]$ across feature axis
   │ Dimension: $78 \times 3 \times 3 + \text{channel dynamics} = 708$ features
   ▼
Temporal Interpolation to Uniform Sequence
   │ Resized to shape: $(1, 384, 708)$ Float32
```

---

## 3. Neural Network Architecture Layers

1. **Stem Convolution**:
   - `Conv1D(filters=192, kernel_size=11, padding='same')`
   - Layer Normalization + SiLU (Swish) Activation
2. **Depthwise Separable Conv Blocks**:
   - Causal Depthwise Conv1D with expansion factor = 2
   - Squeeze-and-Excitation / Efficient Channel Attention (ECA)
   - Residual Skip Connections with Dropout (0.1)
3. **Transformer Encoder Blocks**:
   - Multi-Head Self-Attention (4 attention heads, key dimension 48)
   - Layer Normalization (Pre-LN formulation)
   - Position-Wise Feed Forward Network (Dense 384 $\to$ SiLU $\to$ Dense 192)
4. **Classification Head**:
   - Global Average Pooling 1D across time dimension (384)
   - Dropout (0.2)
   - Dense(250, activation='softmax')

---

## 4. Temporal Stabilization State Machine

Raw softmax probability outputs are susceptible to single-frame noise, transition poses, and lighting flickers. LowKeySigns implements a deterministic stabilization layer (`PredictionStabilizer`):

```
Raw Prediction (250 Softmax Probabilities)
   │
   ▼
Threshold Gating (Confidence >= 0.50)
   ├── No ──▶ Discard prediction; state = "Idle"
   └── Yes ─▶ Candidate token identified
                 │
                 ▼
          Vocabulary Priority Bias
                 │ Service-desk words receive +0.05 weighting
                 ▼
          Consecutive Agreement Check (Count >= 2)
                 ├── No ──▶ Buffer updated; state = "Accumulating"
                 └── Yes ─▶ Agreement reached
                               │
                               ▼
                        Cooldown Debounce Gate (dt >= 1.8s)
                               ├── In Cooldown ─▶ Suppress duplicate emission
                               └── Ready ──────▶ EMIT RECOGNIZED SIGN
```
