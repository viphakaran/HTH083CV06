"""
Convert downloaded PocketSign MP4 loops into optimized animated GIFs.
Saves to all frontend targets:
- HTH083CV06/frontend/public/assets/signs/{word}.gif
- HTH083CV06_01/frontend/public/assets/signs/{word}.gif
- lowkeysigns-frontend/public/assets/signs/{word}.gif
"""

import os
import shutil
import cv2
from PIL import Image
from pathlib import Path

DEST_DIRS = [
    Path(r"C:\A_Hackathon_HackTheHorizon\HTH083CV06\frontend\public\assets\signs"),
    Path(r"C:\A_Hackathon_HackTheHorizon\HTH083CV06_01\frontend\public\assets\signs"),
    Path(r"C:\A_Hackathon_HackTheHorizon\lowkeysigns-frontend\public\assets\signs"),
]

video_dir = DEST_DIRS[0] / "videos"
words = [
    'help', 'wait', 'money', 'form', 'pain', 'doctor', 'yes', 'no',
    'thank_you', 'sign', 'more', 'problem', 'emergency', 'where',
    'name', 'appointment', 'sick', 'please', 'here', 'now'
]

print("Generating optimized animated GIFs from official PocketSign MP4s...")

for word in words:
    mp4_path = video_dir / f"{word}.mp4"
    if not mp4_path.exists():
        print(f"Skipping {word}: {mp4_path} not found")
        continue

    cap = cv2.VideoCapture(str(mp4_path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    frame_interval = max(1, int(fps / 12)) # Sample at ~12 fps for smooth, lightweight GIF
    duration = int(1000 / 12)

    frames = []
    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % frame_interval == 0:
            # Resize frame to clean 320x240 for web cards
            h, w = frame.shape[:2]
            target_w = 320
            target_h = int(h * (target_w / w))
            resized = cv2.resize(frame, (target_w, target_h), interpolation=cv2.INTER_AREA)
            rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb)
            frames.append(pil_img)
        frame_idx += 1
    cap.release()

    if frames:
        gif_path = DEST_DIRS[0] / f"{word}.gif"
        frames[0].save(
            str(gif_path),
            save_all=True,
            append_images=frames[1:],
            duration=duration,
            loop=0,
            optimize=True,
        )
        gif_size = os.path.getsize(gif_path)
        print(f"Generated {word:12s}.gif ({len(frames)} frames, {gif_size/1024:.1f} KB)")

        # Copy to other frontends
        for dest in DEST_DIRS[1:]:
            shutil.copy2(gif_path, dest / f"{word}.gif")

print("All animated GIFs successfully generated and synchronized!")
