import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';

// Standard 21 MediaPipe hand connections
export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],        // Index
  [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17],                               // Palm base
];

// Tip indices for fingertip targeting rings
export const FINGERTIPS = [4, 8, 12, 16, 20];

// Normalization key landmarks: Wrist (0) and Middle MCP (9)
export const WRIST_IDX = 0;
export const MIDDLE_MCP_IDX = 9;

export interface HandTrackingMetrics {
  detectedHandsCount: number;
  hands: {
    handedness: 'Left' | 'Right';
    score: number;
    wristPos: { x: number; y: number; z: number };
    middleMcpPos: { x: number; y: number; z: number };
    scaleDistance: number;
    isActiveSigning: boolean;
    velocity: number;
    bbox: { xMin: number; yMin: number; xMax: number; yMax: number };
  }[];
  activeSigning: boolean;
  fps: number;
  lastProcessedTime: number;
}

/**
 * Generates an anatomically calibrated 21-landmark hand performing signing gestures.
 * Used for live HUD demonstration, fallback testing, and visual calibration.
 */
export function generateSimulatedHand(timestampMs: number): NormalizedLandmark[] {
  const t = timestampMs / 1000;
  // Wrist anchor reference
  const wX = 0.5 + 0.04 * Math.sin(t * 1.5);
  const wY = 0.68 + 0.02 * Math.cos(t * 2.0);
  const wZ = 0;

  // Key MCPs
  const thumbBase = { x: wX - 0.05, y: wY - 0.05, z: 0.01 };
  const indexMcp = { x: wX - 0.03, y: wY - 0.14, z: 0 };
  const middleMcp = { x: wX, y: wY - 0.16, z: 0 };
  const ringMcp = { x: wX + 0.03, y: wY - 0.14, z: 0 };
  const pinkyMcp = { x: wX + 0.055, y: wY - 0.11, z: 0 };

  // Joint finger extension / flexing waves
  const flexThumb = 0.025 * Math.sin(t * 2.5);
  const flexIndex = 0.035 * Math.sin(t * 2.2 + 0.5);
  const flexMiddle = 0.035 * Math.sin(t * 2.0 + 1.0);
  const flexRing = 0.035 * Math.sin(t * 2.2 + 1.5);
  const flexPinky = 0.025 * Math.sin(t * 2.5 + 2.0);

  // Helper to ensure full NormalizedLandmark compliance
  const lm = (x: number, y: number, z = 0): NormalizedLandmark => ({
    x,
    y,
    z,
    visibility: 1.0,
  });

  return [
    lm(wX, wY, wZ), // 0: Wrist Anchor
    // Thumb 1-4
    lm(thumbBase.x, thumbBase.y, 0.01),
    lm(thumbBase.x - 0.025, thumbBase.y - 0.025, 0.02),
    lm(thumbBase.x - 0.05 + flexThumb * 0.4, thumbBase.y - 0.045, 0.02),
    lm(thumbBase.x - 0.07 + flexThumb, thumbBase.y - 0.065, 0.03),
    // Index 5-8
    lm(indexMcp.x, indexMcp.y, 0),
    lm(indexMcp.x - 0.01, indexMcp.y - 0.035, 0),
    lm(indexMcp.x - 0.015, indexMcp.y - 0.065 + flexIndex * 0.5, 0),
    lm(indexMcp.x - 0.02, indexMcp.y - 0.095 + flexIndex, 0),
    // Middle 9-12 (Middle MCP is key scale landmark)
    lm(middleMcp.x, middleMcp.y, 0),
    lm(middleMcp.x, middleMcp.y - 0.04, 0),
    lm(middleMcp.x, middleMcp.y - 0.075 + flexMiddle * 0.5, 0),
    lm(middleMcp.x, middleMcp.y - 0.11 + flexMiddle, 0),
    // Ring 13-16
    lm(ringMcp.x, ringMcp.y, 0),
    lm(ringMcp.x + 0.01, ringMcp.y - 0.035, 0),
    lm(ringMcp.x + 0.015, ringMcp.y - 0.065 + flexRing * 0.5, 0),
    lm(ringMcp.x + 0.02, ringMcp.y - 0.095 + flexRing, 0),
    // Pinky 17-20
    lm(pinkyMcp.x, pinkyMcp.y, 0),
    lm(pinkyMcp.x + 0.015, pinkyMcp.y - 0.025, 0),
    lm(pinkyMcp.x + 0.025, pinkyMcp.y - 0.05 + flexPinky * 0.5, 0),
    lm(pinkyMcp.x + 0.035, pinkyMcp.y - 0.075 + flexPinky, 0),
  ];
}

let landmarkerInstance: HandLandmarker | null = null;
let landmarkerPromise: Promise<HandLandmarker> | null = null;

export async function getHandLandmarker(): Promise<HandLandmarker> {
  if (landmarkerInstance) {
    return landmarkerInstance;
  }

  if (landmarkerPromise) {
    return landmarkerPromise;
  }

  landmarkerPromise = (async () => {
    // 1. Resolve WASM assets from CDN
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
    );

    // 2. Initialize HandLandmarker using local task model or fallback CDN
    try {
      landmarkerInstance = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch {
      // Fallback to CPU delegate if GPU initialization is unsupported in browser environment
      landmarkerInstance = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/hand_landmarker.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    return landmarkerInstance;
  })();

  return landmarkerPromise;
}

export interface RenderProjection {
  videoWidth: number;
  videoHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  offsetX: number;
  offsetY: number;
  renderedWidth: number;
  renderedHeight: number;
}

/**
 * Computes exact object-cover projection so landmarks map 1-to-1 with video display pixels.
 */
export function computeCoverProjection(
  videoWidth: number,
  videoHeight: number,
  canvasWidth: number,
  canvasHeight: number
): RenderProjection {
  if (!videoWidth || !videoHeight || !canvasWidth || !canvasHeight) {
    return {
      videoWidth: 1,
      videoHeight: 1,
      canvasWidth,
      canvasHeight,
      offsetX: 0,
      offsetY: 0,
      renderedWidth: canvasWidth,
      renderedHeight: canvasHeight,
    };
  }

  const videoAspect = videoWidth / videoHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  let renderedWidth = canvasWidth;
  let renderedHeight = canvasHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > canvasAspect) {
    // Video is wider than canvas: match height, crop sides
    renderedHeight = canvasHeight;
    renderedWidth = canvasHeight * videoAspect;
    offsetX = (canvasWidth - renderedWidth) / 2;
  } else {
    // Canvas is wider than video: match width, crop top/bottom
    renderedWidth = canvasWidth;
    renderedHeight = canvasWidth / videoAspect;
    offsetY = (canvasHeight - renderedHeight) / 2;
  }

  return {
    videoWidth,
    videoHeight,
    canvasWidth,
    canvasHeight,
    offsetX,
    offsetY,
    renderedWidth,
    renderedHeight,
  };
}

/**
 * Project normalized landmark (0-1) to pixel coordinate on canvas matching object-cover video.
 */
export function projectLandmark(
  lm: NormalizedLandmark,
  proj: RenderProjection
): { x: number; y: number } {
  return {
    x: proj.offsetX + lm.x * proj.renderedWidth,
    y: proj.offsetY + lm.y * proj.renderedHeight,
  };
}

/**
 * Draw MediaPipe 21 hand landmarks, skeleton, normalization vector, and tracking HUD directly on the canvas.
 */
export function drawLiveHandTracking(
  ctx: CanvasRenderingContext2D,
  multiHandLandmarks: NormalizedLandmark[][],
  handednessList: any[],
  proj: RenderProjection,
  isSigning: boolean
) {
  const { canvasWidth, canvasHeight } = proj;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  multiHandLandmarks.forEach((landmarks, handIdx) => {
    const isFirstHand = handIdx === 0;
    const handInfo = handednessList && handednessList[handIdx] && handednessList[handIdx][0];
    const handLabel = handInfo?.displayName || handInfo?.categoryName || (isFirstHand ? 'Right' : 'Left');
    const handScore = handInfo ? Math.round(handInfo.score * 100) : 95;

    const baseLineColor = isFirstHand ? '#10B981' : '#06B6D4'; // Emerald vs Cyan
    const jointFillColor = isFirstHand ? '#34D399' : '#38BDF8';

    // Projected landmark pixel points
    const points = landmarks.map((lm) => projectLandmark(lm, proj));

    // 1. Draw Palm Base Fill Polygon (Wrist 0 -> Index MCP 5 -> Middle MCP 9 -> Pinky MCP 17)
    if (points[0] && points[5] && points[9] && points[17]) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[5].x, points[5].y);
      ctx.lineTo(points[9].x, points[9].y);
      ctx.lineTo(points[17].x, points[17].y);
      ctx.closePath();
      ctx.fillStyle = isFirstHand ? 'rgba(16, 185, 129, 0.12)' : 'rgba(6, 182, 212, 0.12)';
      ctx.fill();
    }

    // 2. Draw Skeleton Bone Connections
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = baseLineColor;
    ctx.shadowBlur = 0;

    HAND_CONNECTIONS.forEach(([i, j]) => {
      const p1 = points[i];
      const p2 = points[j];
      if (!p1 || !p2) return;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // 3. Highlight Normalization Vector (Wrist 0 -> Middle MCP 9)
    const pWrist = points[WRIST_IDX];
    const pMiddleMcp = points[MIDDLE_MCP_IDX];
    if (pWrist && pMiddleMcp) {
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#F59E0B'; // Vibrant Amber Normalization Vector
      ctx.moveTo(pWrist.x, pWrist.y);
      ctx.lineTo(pMiddleMcp.x, pMiddleMcp.y);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }

    // 4. Calculate Hand Bounding Box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    points.forEach((pt) => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });

    const pad = 16;
    const boxX = Math.max(0, minX - pad);
    const boxY = Math.max(0, minY - pad);
    const boxW = Math.min(canvasWidth - boxX, (maxX - minX) + pad * 2);
    const boxH = Math.min(canvasHeight - boxY, (maxY - minY) + pad * 2);

    // Draw HUD Corner Brackets on Bounding Box
    const bracketLen = 14;
    ctx.lineWidth = 2;
    ctx.strokeStyle = isFirstHand ? '#10B981' : '#06B6D4';

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + bracketLen);
    ctx.lineTo(boxX, boxY);
    ctx.lineTo(boxX + bracketLen, boxY);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - bracketLen, boxY);
    ctx.lineTo(boxX + boxW, boxY);
    ctx.lineTo(boxX + boxW, boxY + bracketLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + boxH - bracketLen);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.lineTo(boxX + bracketLen, boxY + boxH);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - bracketLen, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH - bracketLen);
    ctx.stroke();

    // 5. Draw Hand Tracking HUD Badge above Hand
    const badgeText = `HAND #${handIdx + 1}: ${handLabel.toUpperCase()} (${handScore}%)`;
    ctx.font = 'bold 10px monospace';
    ctx.shadowBlur = 0;
    const textWidth = ctx.measureText(badgeText).width;
    const tagX = boxX;
    const tagY = Math.max(20, boxY - 8);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(tagX, tagY - 12, textWidth + 12, 16);
    ctx.strokeStyle = isFirstHand ? '#10B981' : '#06B6D4';
    ctx.lineWidth = 1;
    ctx.strokeRect(tagX, tagY - 12, textWidth + 12, 16);

    ctx.fillStyle = isFirstHand ? '#34D399' : '#38BDF8';
    ctx.fillText(badgeText, tagX + 6, tagY);

    if (isSigning) {
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('● SIGNING', tagX + textWidth + 18, tagY);
    }

    // 6. Draw Landmark Joints with High-Performance Concentric Rings (Zero CPU Blur Overhead)
    points.forEach((pt, idx) => {
      if (idx === WRIST_IDX) {
        // Wrist Anchor Point (Reference 0,0,0)
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();
      } else if (idx === MIDDLE_MCP_IDX) {
        // Middle MCP Scale Point
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5.0, 0, 2 * Math.PI);
        ctx.fillStyle = '#FBBF24';
        ctx.fill();
      } else if (FINGERTIPS.includes(idx)) {
        // Fingertip Targeting Nodes
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7.0, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Pulsed target ring
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 9.5, 0, 2 * Math.PI);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();
      } else {
        // Phalangeal joints
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = isFirstHand ? 'rgba(16, 185, 129, 0.25)' : 'rgba(6, 182, 212, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = jointFillColor;
        ctx.fill();
      }

      // Outer outline ring
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, idx === WRIST_IDX ? 8.5 : FINGERTIPS.includes(idx) ? 7.0 : 4.5, 0, 2 * Math.PI);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.stroke();
    });
  });
}
