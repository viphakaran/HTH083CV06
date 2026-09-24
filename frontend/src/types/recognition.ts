// Locked Data Shape - exact specification matching the backend WebSocket protocol
export interface RecognitionEvent {
  word: string;       // one of the 20 locked words, lowercase
  confidence: number; // float between 0.0 and 1.0
  timestamp: string;  // ISO 8601 format, e.g. "2026-09-24T10:15:32Z"
}

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface ConfidenceInfo {
  tier: ConfidenceTier;
  label: string;
  percentage: number;
}

export function getConfidenceInfo(confidence: number): ConfidenceInfo {
  const percentage = Math.round(confidence * 100);
  if (confidence >= 0.8) {
    return { tier: 'high', label: 'High confidence', percentage };
  }
  if (confidence >= 0.5) {
    return { tier: 'medium', label: 'Medium confidence', percentage };
  }
  return { tier: 'low', label: 'Low confidence', percentage };
}
