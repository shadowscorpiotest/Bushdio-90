"""Auto-playing MP4 of the deck, as a fallback to the click-through PowerPoint.

    python3 deck/video.py [--brief]

Each click step's clip (cut by build.py) is followed by a hold on its last frame, sized so the
step lasts about as long as its speaker note takes to read: the scene's time from notes.json,
shared between its steps by note length. --brief writes a version to watch without the talk,
with holds scaled down from those: longer where a step has more to explain or read, at least
long enough to take in each feature's title, and a beat more before moving to the next feature.
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
TEXT_SCENES = {"intro", "agenda", "why", "developer", "overview", "findings", "quote", "critique"}


def brief_hold(scene_id, step, steps, target, clip):
    """Hold for --brief, from the talk-paced target time of the step and its clip length (seconds)."""
    if scene_id in TEXT_SCENES:
        return min(6, max(3, 0.6 * target))
    hold = min(4, max(1.6, 0.45 * target - 0.3 * clip))
    if step == 0:
        hold = max(hold, 2.5)
    if step == steps - 1:
        hold += 0.5
    return hold


def main():
    notes = json.loads((Path(__file__).parent / "notes.json").read_text())["scenes"]
    parts = []
    for i, (scene_id, step, start, end) in enumerate(clips()):
        scene = notes[scene_id]
        texts = scene["notes"]
        if not scene["seconds"]:
            hold = OUTRO_HOLD
        else:
            target = scene["seconds"] * len(texts[step]) / sum(len(t) for t in texts)
            if BRIEF:
                hold = brief_hold(scene_id, step, len(texts), target, (end - start) / FPS)
            else:
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
