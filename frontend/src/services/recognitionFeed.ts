import { useState, useEffect, useRef } from 'react';
import type { RecognitionEvent } from '../types/recognition';

/**
 * ANTI-HALLUCINATION RULE:
 * LOCKED VOCABULARY — exactly these 20 words, no more, no fewer.
 * This is the ONLY place in the entire application where the vocabulary
 * is defined or mock recognition events are produced.
 */
export const LOCKED_VOCABULARY: readonly string[] = [
  'help',
  'wait',
  'money',
  'form',
  'pain',
  'doctor',
  'yes',
  'no',
  'thank you',
  'sign',
  'more',
  'problem',
  'emergency',
  'where',
  'name',
  'appointment',
  'sick',
  'please',
  'here',
  'now',
] as const;

export interface RecognitionFeedState {
  events: RecognitionEvent[];
  latestEvent: RecognitionEvent | null;
  isActive: boolean;
  setIsActive: (active: boolean | ((prev: boolean) => boolean)) => void;
  clearLog: () => void;
}

/**
 * Mock recognition feed hook.
 * Generates recognition events matching the locked data shape:
 * {
 *   "word": string,
 *   "confidence": number, // float 0.6 - 0.98
 *   "timestamp": string   // ISO 8601
 * }
 * In production, this service can be swapped with a real WebSocket feed
 * without modifying any component logic.
 */
export function useRecognitionFeed(): RecognitionFeedState {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [events, setEvents] = useState<RecognitionEvent[]>(() => {
    // Initial welcome entry from locked vocabulary
    const initialWord = LOCKED_VOCABULARY[0]; // 'help'
    const initialConfidence = 0.94;
    const initialTimestamp = new Date().toISOString();
    return [
      {
        word: initialWord,
        confidence: initialConfidence,
        timestamp: initialTimestamp,
      },
    ];
  });

  const [latestEvent, setLatestEvent] = useState<RecognitionEvent | null>(() => events[0] ?? null);
  const currentIndexRef = useRef<number>(1);

  useEffect(() => {
    if (!isActive) return;

    // Timer interval between 2 and 3 seconds (2400ms)
    const intervalId = window.setInterval(() => {
      // Pick next word cycling through locked vocabulary
      const word = LOCKED_VOCABULARY[currentIndexRef.current % LOCKED_VOCABULARY.length];
      currentIndexRef.current += 1;

      // Random confidence between 0.60 and 0.98, rounded to 2 decimals
      const rawConfidence = 0.6 + Math.random() * (0.98 - 0.6);
      const confidence = Math.round(rawConfidence * 100) / 100;

      const newEvent: RecognitionEvent = {
        word,
        confidence,
        timestamp: new Date().toISOString(),
      };

      setEvents((prev) => [...prev, newEvent]);
      setLatestEvent(newEvent);
    }, 2500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isActive]);

  const clearLog = () => {
    setEvents([]);
    setLatestEvent(null);
  };

  return {
    events,
    latestEvent,
    isActive,
    setIsActive,
    clearLog,
  };
}
