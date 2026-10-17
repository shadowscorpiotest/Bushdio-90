"""Click-step boundaries of the NoorDeck composition, derived from src/Noor/deck.json.

Each scene's `lens` are its entry animation followed by one length per click step; the
crossfade into the next scene belongs to that scene's entry clip. Clip j spans frames
[bounds[j], bounds[j + 1]) and PowerPoint holds its last frame until the next click.
"""
import json
from pathlib import Path

DECK = json.loads((Path(__file__).resolve().parent.parent / "src/Noor/deck.json").read_text())


def clips():
    """Yield (scene_id, step_index, start_frame, end_frame); step 0 is the scene entry."""
    end = 0
    for scene in DECK["scenes"]:
        for i, length in enumerate(scene["lens"]):
            yield scene["id"], i, end, end + length
            end += length


if __name__ == "__main__":
    all_clips = list(clips())
    for c in all_clips:
        print(*c)
    print("clips", len(all_clips), "frames", all_clips[-1][3])
