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
  isLiveConnected: boolean;
  setIsActive: (active: boolean | ((prev: boolean) => boolean)) => void;
  clearLog: () => void;
}

/**
 * Unified Recognition Feed Hook.
 * Supports:
 * 1. Automatic Live WebSocket connection to Python ML backend (`ws://localhost:8000/ws`)
 * 2. Automatic, graceful fallback to calibrated simulated demo stream if backend is offline
 */
export function useRecognitionFeed(): RecognitionFeedState {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [events, setEvents] = useState<RecognitionEvent[]>(() => {
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
  const wsRef = useRef<WebSocket | null>(null);

  // Attempt live WebSocket connection with graceful fallback
  useEffect(() => {
    let reconnectTimeout: number | undefined;

    const connectWebSocket = () => {
      try {
        const socket = new WebSocket('ws://localhost:8000/ws');
        wsRef.current = socket;

        socket.onopen = () => {
          setIsLiveConnected(true);
          console.log('[LowKeySigns] Connected to live ML backend WebSocket.');
        };

        socket.onmessage = (event) => {
          if (!isActive) return;
          try {
            const data = JSON.parse(event.data);
            if (data && data.word) {
              const newEvent: RecognitionEvent = {
                word: data.word.toLowerCase(),
                confidence: typeof data.confidence === 'number' ? data.confidence : 0.88,
                timestamp: data.timestamp || new Date().toISOString(),
              };
              setEvents((prev) => [...prev, newEvent]);
              setLatestEvent(newEvent);
            }
          } catch (e) {
            console.error('[LowKeySigns] Error parsing WebSocket packet:', e);
          }
        };

        socket.onerror = () => {
          setIsLiveConnected(false);
        };

        socket.onclose = () => {
          setIsLiveConnected(false);
          // Try to reconnect every 6 seconds
          reconnectTimeout = window.setTimeout(connectWebSocket, 6000);
        };
      } catch (err) {
        setIsLiveConnected(false);
        reconnectTimeout = window.setTimeout(connectWebSocket, 6000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isActive]);

  // Fallback simulated feed timer only runs if NOT connected to live backend
  useEffect(() => {
    if (!isActive || isLiveConnected) return;

    const intervalId = window.setInterval(() => {
      const word = LOCKED_VOCABULARY[currentIndexRef.current % LOCKED_VOCABULARY.length];
      currentIndexRef.current += 1;

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
  }, [isActive, isLiveConnected]);

  const clearLog = () => {
    setEvents([]);
    setLatestEvent(null);
  };

  return {
    events,
    latestEvent,
    isActive,
    isLiveConnected,
    setIsActive,
    clearLog,
  };
}
