"""Turns the rendered NoorDeck master into a click-through PowerPoint.

    npx remotion render NoorDeck out/deck-master.mp4 ...
    python3 deck/build.py [--reuse]

Cuts one clip per click step (see steps.py), builds the deck with build_pptx.js, then sets
every video to start automatically when its slide appears. --reuse keeps clips already in
out/deck, so a slide re-rendered on its own can be swapped in without recutting the rest.
"""
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

from steps import DECK, clips

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "out/deck-master.mp4"
WORK = ROOT / "out/deck"
OUT = ROOT / "out/quran-noor-presentation.pptx"
FPS = DECK["fps"]

SECTIONS = {
    "intro": "آغاز",
    "home": "قابلیت‌های برنامه",
    "example": "نمونه‌ی عملی: صبر",
    "alam": "ادامه‌ی قابلیت‌ها",
    "quote": "جمع‌بندی و ارزیابی",
}

# PowerPoint's own markup for a video set to "Start: Automatically"
TIMING = (
    '<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
    '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
    '<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/>'
    '<p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>'
    '<p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
    '<p:par><p:cTn id="5" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="afterEffect">'
    '<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
    '<p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="6" dur="{dur}" fill="hold"/>'
    '<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:cmd>'
    "</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>"
    "</p:childTnLst></p:cTn>"
    '<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
    '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>'
    "</p:seq>"
    '<p:video><p:cMediaNode vol="80000"><p:cTn id="7" fill="hold" display="0">'
    '<p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn>'
    '<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cMediaNode></p:video>'
    "</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>"
)


def fa(n):
    return "".join("۰۱۲۳۴۵۶۷۸۹"[int(c)] if c.isdigit() else c for c in str(n))


def run(*cmd):
    subprocess.run(cmd, check=True, capture_output=True)


def cut(i, start, end, reuse=False):
    clip = WORK / f"clip{i:02d}.mp4"
    poster = WORK / f"clip{i:02d}.jpg"
    if reuse and clip.exists() and poster.exists():
        return clip, poster
    # seek half a frame early: a rounded-up timestamp would skip the first frame and end the clip on
    # the next step's first frame
    ss = f"{(start - 0.5) / FPS:.4f}"
    run(
        "ffmpeg", "-y", "-ss", ss, "-i", str(MASTER), "-frames:v", str(end - start),
        "-c:v", "libx264", "-profile:v", "high", "-level", "4.1", "-pix_fmt", "yuv420p",
        "-crf", "20", "-preset", "slow", "-an", "-movflags", "+faststart", str(clip),
    )
    run("ffmpeg", "-y", "-ss", ss, "-i", str(MASTER), "-frames:v", "1", "-q:v", "2", str(poster))
    return clip, poster


def note_text(notes, scene_id, step):
    scene = notes["scenes"][scene_id]
    text = scene["notes"][step]
    if step > 0:
        return text
    speaker = notes["speakers"][scene["speaker"]]
    when = f"حدود {fa(scene['seconds'])} ثانیه" if scene["seconds"] else "پرسش و پاسخ"
    return f"[{speaker} | {when}]\n{text}"


def add_autoplay(src, dst, durations_ms):
    with zipfile.ZipFile(src) as zin, zipfile.ZipFile(dst, "w") as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            m = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", item.filename)
            if m:
                xml = data.decode("utf8")
                spid = re.search(r'<p:cNvPr id="(\d+)" name="clip"', xml).group(1)
                # pptxgenjs gives the overlay the video's shape id; ids must be unique per slide
                xml = re.sub(
                    r'<p:cNvPr id="\d+" name="click-catcher">',
                    f'<p:cNvPr id="{int(spid) + 1}" name="click-catcher">',
                    xml,
                )
                xml = xml.replace("<a:ln></a:ln>", "<a:ln><a:noFill/></a:ln>")
                xml = re.sub(r"<p:timing>.*?</p:timing>", "", xml, flags=re.S)
                timing = TIMING.format(spid=spid, dur=durations_ms[int(m.group(1)) - 1])
                xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + timing, 1)
                assert timing in xml, item.filename
                data = xml.encode("utf8")
            zout.writestr(item, data)


def main():
    WORK.mkdir(parents=True, exist_ok=True)
    notes = json.loads((Path(__file__).parent / "notes.json").read_text())
    slides, durations = [], []
    for i, (scene_id, step, start, end) in enumerate(clips()):
        clip, poster = cut(i, start, end, reuse="--reuse" in sys.argv)
        section = SECTIONS.get(scene_id) if step == 0 else None
        current = section or (slides[-1]["sectionTitle"] if slides else None)
        slides.append(
            {
                "clip": str(clip),
                "poster": str(poster),
                "notes": note_text(notes, scene_id, step),
                "section": section,
                "sectionTitle": current,
            }
        )
        durations.append(round((end - start) * 1000 / FPS))
    manifest = WORK / "manifest.json"
    manifest.write_text(json.dumps({"slides": slides}, ensure_ascii=False, indent=1))
    raw = WORK / "raw.pptx"
    subprocess.run(["node", str(Path(__file__).parent / "build_pptx.js"), str(manifest), str(raw)], check=True, cwd=ROOT)
    add_autoplay(raw, OUT, durations)
    print("slides", len(slides), "->", OUT)


if __name__ == "__main__":
    main()
