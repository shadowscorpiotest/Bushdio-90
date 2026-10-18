"""Auto-playing MP4 of the deck, as a fallback to the click-through PowerPoint.

    python3 deck/video.py [--brief]

Each click step's clip (cut by build.py) is followed by a hold on its last frame, sized so the
step lasts about as long as its speaker note takes to read: the scene's time from notes.json,
shared between its steps by note length. --brief writes a version to watch without the talk:
short holds, a little longer on slides that are mostly text.
"""
import json
import subprocess
import sys
from pathlib import Path

from steps import DECK, clips

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "out/deck"
BRIEF = "--brief" in sys.argv
OUT = ROOT / ("out/quran-noor-presentation-video.mp4" if BRIEF else "out/quran-noor-presentation-auto.mp4")
FPS = DECK["fps"]
MIN_HOLD = 2.5
OUTRO_HOLD = 6 if BRIEF else 10
BRIEF_HOLD = 1.2
TEXT_HOLD = 2.5
TEXT_SCENES = {"intro", "agenda", "why", "developer", "overview", "findings", "quote", "critique"}


def main():
    notes = json.loads((Path(__file__).parent / "notes.json").read_text())["scenes"]
    parts = []
    for i, (scene_id, step, start, end) in enumerate(clips()):
        scene = notes[scene_id]
        texts = scene["notes"]
        if not scene["seconds"]:
            hold = OUTRO_HOLD
        elif BRIEF:
            hold = TEXT_HOLD if scene_id in TEXT_SCENES else BRIEF_HOLD
        else:
            target = scene["seconds"] * len(texts[step]) / sum(len(t) for t in texts)
            hold = max(MIN_HOLD, target - (end - start) / FPS)
        part = WORK / f"auto{i:02d}.mp4"
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(WORK / f"clip{i:02d}.mp4"),
             "-vf", f"tpad=stop_mode=clone:stop_duration={hold:.2f}", "-r", str(FPS),
             "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", "-pix_fmt", "yuv420p", str(part)],
            check=True, capture_output=True,
        )
        parts.append(part)
    listing = WORK / "auto.txt"
    listing.write_text("".join(f"file '{p}'\n" for p in parts))
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
         "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-shortest",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", str(OUT)],
        check=True, capture_output=True,
    )
    print("wrote", OUT)


if __name__ == "__main__":
    main()
