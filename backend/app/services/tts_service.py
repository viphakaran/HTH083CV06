"""
Offline Text-to-Speech Engine
Uses native Windows SAPI with a background worker thread queue
so it never blocks the real-time video or ML inference pipeline.
"""

import threading
import queue
import time
from typing import Optional

from ..config.settings import settings


class TTSService:
    """Non-blocking speech synthesis service."""

    def __init__(self, rate: int = settings.tts.rate, volume: int = settings.tts.volume):
        self.rate = rate
        self.volume = volume
        self.enabled = settings.tts.enabled
        self.queue: queue.Queue = queue.Queue()
        self._last_spoken = ""
        self._last_spoken_time = 0.0
        self._stop_event = threading.Event()

        # Start background worker thread
        self.thread = threading.Thread(target=self._worker, daemon=True, name="TTS-Worker")
        self.thread.start()

    def _worker(self):
        """Worker loop that handles speech requests."""
        speaker = None
        try:
            import pythoncom
            pythoncom.CoInitialize()
            import win32com.client
            speaker = win32com.client.Dispatch("SAPI.SpVoice")
            speaker.Rate = self.rate
            speaker.Volume = self.volume
        except Exception as e:
            print(f"[TTS Notice] SAPI voice unavailable ({e}); logging to console.")

        while not self._stop_event.is_set():
            try:
                text = self.queue.get(timeout=0.2)
                if text is None:
                    break
                if speaker:
                    try:
                        speaker.Speak(text)
                    except Exception as err:
                        print(f"[TTS Error] Speech playback error: {err}")
                else:
                    print(f"[TTS Audio Output]: \"{text}\"")
                self.queue.task_done()
            except queue.Empty:
                continue

    def speak(self, text: str, cooldown: Optional[float] = None):
        """
        Queues text to be spoken aloud.
        Applies a cooldown debounce to prevent rapid repeated utterances.
        """
        if not self.enabled or not text:
            return

        cd = cooldown if cooldown is not None else settings.tts.cooldown_seconds
        now = time.time()
        if text.strip().lower() == self._last_spoken.strip().lower() and (now - self._last_spoken_time) < cd:
            return  # skip repetitive trigger within cooldown

        self._last_spoken = text
        self._last_spoken_time = now
        self.queue.put(text)

    def set_enabled(self, enabled: bool):
        """Enables or disables speech playback."""
        self.enabled = enabled

    def stop(self):
        """Signals worker thread to terminate."""
        self._stop_event.set()
        self.queue.put(None)
        if self.thread.is_alive():
            self.thread.join(timeout=1.0)


# Global singleton instance
_tts_instance: Optional[TTSService] = None


def get_tts_service() -> TTSService:
    global _tts_instance
    if _tts_instance is None:
        _tts_instance = TTSService()
    return _tts_instance
