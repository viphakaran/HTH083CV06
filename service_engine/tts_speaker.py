"""
Offline Text-to-Speech Engine for LowKeySigns
Uses native Windows SAPI with background thread queue so it never blocks video inference.
"""

import threading
import queue
import time

class TTSSpeaker:
    def __init__(self, rate: int = 1, volume: int = 100):
        self.queue = queue.Queue()
        self.rate = rate
        self.volume = volume
        self._last_spoken = ""
        self._last_spoken_time = 0
        self._stop_event = threading.Event()
        
        # Start background worker thread
        self.thread = threading.Thread(target=self._worker, daemon=True)
        self.thread.start()

    def _worker(self):
        """Worker loop that handles speech requests."""
        # Initialize COM in this worker thread
        speaker = None
        try:
            import pythoncom
            pythoncom.CoInitialize()
            import win32com.client
            speaker = win32com.client.Dispatch("SAPI.SpVoice")
            speaker.Rate = self.rate
            speaker.Volume = self.volume
        except Exception as e:
            print(f"[TTS Warning] SAPI initialization failed ({e}), falling back to console audio.")

        while not self._stop_event.is_set():
            try:
                text = self.queue.get(timeout=0.2)
                if text is None:
                    break
                if speaker:
                    try:
                        speaker.Speak(text)
                    except Exception as err:
                        print(f"[TTS Error] {err}")
                else:
                    print(f"[TTS Audio]: \"{text}\"")
                self.queue.task_done()
            except queue.Empty:
                continue

    def speak(self, text: str, cooldown: float = 2.0):
        """
        Queues text to be spoken aloud.
        Prevents rapid repeated utterances with a debounce cooldown.
        """
        now = time.time()
        if text == self._last_spoken and (now - self._last_spoken_time) < cooldown:
            return  # skip repeat within cooldown period
            
        self._last_spoken = text
        self._last_spoken_time = now
        self.queue.put(text)

    def stop(self):
        self._stop_event.set()
        self.queue.put(None)
        if self.thread.is_alive():
            self.thread.join(timeout=1.0)

if __name__ == "__main__":
    tts = TTSSpeaker()
    print("Testing TTS...")
    tts.speak("LowKeySigns speech synthesis is online.")
    time.sleep(2.5)
    tts.stop()
