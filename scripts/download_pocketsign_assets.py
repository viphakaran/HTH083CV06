"""
Download official PocketSign MP4 mini-videos and high-resolution thumbnails for the 20 ASL vocabulary terms.
Saves to all frontend targets:
- HTH083CV06/frontend/public/assets/signs/
- HTH083CV06_01/frontend/public/assets/signs/
- lowkeysigns-frontend/public/assets/signs/
"""

import os
import shutil
import urllib.request
from pathlib import Path

MAPPING = {
    'help': 'help',
    'wait': 'wait',
    'money': 'money',
    'form': 'form',
    'pain': 'pain',
    'doctor': 'doctor',
    'yes': 'yes',
    'no': 'no',
    'thank_you': 'thankyou',
    'sign': 'sign',
    'more': 'more',
    'problem': 'problem',
    'emergency': 'emergency',
    'where': 'where',
    'name': 'name',
    'appointment': 'appointment',
    'sick': 'sick',
    'please': 'please',
    'here': 'here',
    'now': 'now',
}

DEST_DIRS = [
    Path(r"C:\A_Hackathon_HackTheHorizon\HTH083CV06\frontend\public\assets\signs"),
    Path(r"C:\A_Hackathon_HackTheHorizon\HTH083CV06_01\frontend\public\assets\signs"),
    Path(r"C:\A_Hackathon_HackTheHorizon\lowkeysigns-frontend\public\assets\signs"),
]

# Ensure directories exist
for base in DEST_DIRS:
    base.mkdir(parents=True, exist_ok=True)
    (base / "videos").mkdir(parents=True, exist_ok=True)

temp_dir = Path("temp_pocketsign")
temp_dir.mkdir(exist_ok=True)
(temp_dir / "videos").mkdir(exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

print(f"Beginning download of 20 official PocketSign ASL video loops and thumbnails...")

for word, slug in MAPPING.items():
    v_url = f"https://mobireactorasl.s3-us-west-2.amazonaws.com/{slug}.mp4"
    t_url = f"https://mobireactoraslresize.s3-us-west-2.amazonaws.com/thumbnails/{slug}.png"

    local_v = temp_dir / "videos" / f"{word}.mp4"
    local_t = temp_dir / f"{word}.png"

    # Download MP4
    req_v = urllib.request.Request(v_url, headers=headers)
    with urllib.request.urlopen(req_v) as resp, open(local_v, "wb") as f:
        f.write(resp.read())

    # Download Thumbnail PNG
    req_t = urllib.request.Request(t_url, headers=headers)
    with urllib.request.urlopen(req_t) as resp, open(local_t, "wb") as f:
        f.write(resp.read())

    v_size = os.path.getsize(local_v)
    t_size = os.path.getsize(local_t)
    print(f"Downloaded {word:12s} -> video: {v_size/1024:.1f} KB, thumb: {t_size/1024:.1f} KB")

    # Copy to all frontend asset locations
    for base in DEST_DIRS:
        shutil.copy2(local_v, base / "videos" / f"{word}.mp4")
        shutil.copy2(local_t, base / f"{word}.png")

print("\nAll 20 official ASL videos and thumbnails successfully distributed to all frontends!")
