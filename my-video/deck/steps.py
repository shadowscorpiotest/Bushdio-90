"""Click-step boundaries of the NoorDeck composition, derived from src/Noor/deck.json.

Each scene is an entry animation followed by `steps` click steps of `step` frames; the
crossfade into the next scene belongs to that scene's entry clip. Clip j spans frames
[bounds[j], bounds[j + 1]) and PowerPoint holds its last frame until the next click.
"""
import json
from pathlib import Path

DECK = json.loads((Path(__file__).resolve().parent.parent / "src/Noor/deck.json").read_text())


def clips():
    """Yield (scene_id, step_index, start_frame, end_frame); step 0 is the scene entry."""
    start = 0
    clip_start = 0
    for scene in DECK["scenes"]:
        for i in range(scene["steps"] + 1):
            end = start + scene["entry"] + i * scene["step"]
            yield scene["id"], i, clip_start, end
            clip_start = end
        start = clip_start


if __name__ == "__main__":
    all_clips = list(clips())
    for c in all_clips:
        print(*c)
    print("clips", len(all_clips), "frames", all_clips[-1][3])
