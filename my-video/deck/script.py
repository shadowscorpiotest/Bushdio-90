"""Printable speaker script (PDF) built from notes.json, numbered like the deck's slides."""
import html
import json
import subprocess
from pathlib import Path

from build import fa
from steps import DECK, clips

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out/quran-noor-script.pdf"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
TITLES = {
    "intro": "عنوان", "agenda": "فهرست ارائه", "why": "چرا نرم‌افزار قرآنی؟", "developer": "سازنده",
    "platforms": "یک برنامه، سه بستر؛ دریافت برنامه", "home": "صفحه‌ی اصلی", "overview": "قابلیت‌ها در یک نگاه",
    "search": "۱. جستجو", "mushaf": "۲. شیوه‌های نمایش مصحف", "surahs": "۴. قرآن کریم و فهرست سوره‌ها",
    "reciters": "۵. تلاوت و قاریان", "recite": "۳. تنظیمات قرائت و حفظ", "translate": "۶. ترجمه",
    "tafsir": "۷. تفسیر و حدیث", "words": "۸. واژگان، اعراب و آیات مرتبط", "farhang": "۱۰. فرهنگ موضوعی",
    "example": "نمونه‌ی عملی: صبر", "findings": "یافته‌ها: صبر در قرآن", "alam": "۹. اعلام و اسماء",
    "khatm": "۱۱. ختم قرآن و واژه‌نامه", "multimedia": "۱۲. چندرسانه", "ai": "۱۳. هوش مصنوعی و منابع",
    "quote": "جمع‌بندی", "critique": "نقد و ارزیابی", "outro": "پرسش و پاسخ",
}


def main():
    notes = json.loads((Path(__file__).parent / "notes.json").read_text())
    fonts = ROOT / "public/fonts"
    slide_no = {}
    for n, (scene_id, step, _, _) in enumerate(clips(), start=1):
        slide_no.setdefault(scene_id, []).append(n)

    totals = {}
    for s in notes["scenes"].values():
        totals[s["speaker"]] = totals.get(s["speaker"], 0) + s["seconds"]
    summary = " | ".join(
        f"{notes['speakers'][k]}: حدود {fa(round(v / 60))} دقیقه" for k, v in totals.items() if v
    )

    parts = []
    for scene in DECK["scenes"]:
        sid = scene["id"]
        meta = notes["scenes"][sid]
        nums = slide_no[sid]
        rng = f"اسلاید {fa(nums[0])}" if len(nums) == 1 else f"اسلایدهای {fa(nums[0])} تا {fa(nums[-1])}"
        when = f"حدود {fa(meta['seconds'])} ثانیه" if meta["seconds"] else ""
        items = "".join(
            f'<li><span class="n">{fa(nums[i])}</span><p>{html.escape(t)}</p></li>'
            for i, t in enumerate(meta["notes"])
        )
        parts.append(
            f'<section class="sp-{meta["speaker"]}"><h2>{TITLES[sid]}</h2>'
            f'<div class="meta"><b>{notes["speakers"][meta["speaker"]]}</b> | {rng}'
            f'{" | " + when if when else ""}</div><ol>{items}</ol></section>'
        )

    page = f"""<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><style>
@font-face {{ font-family: V; src: url('{(fonts / 'vazirmatn-arabic-400-normal.woff2').as_uri()}'); font-weight: 400; }}
@font-face {{ font-family: V; src: url('{(fonts / 'vazirmatn-arabic-700-normal.woff2').as_uri()}'); font-weight: 700; }}
@font-face {{ font-family: V; src: url('{(fonts / 'vazirmatn-arabic-900-normal.woff2').as_uri()}'); font-weight: 900; }}
@page {{ size: A4; margin: 16mm 15mm; }}
body {{ font-family: V, sans-serif; color: #1b2133; font-size: 12.5pt; line-height: 1.9; }}
h1 {{ font-size: 21pt; font-weight: 900; margin: 0; color: #0a1f5c; }}
.sub {{ color: #5b6478; margin: 4px 0 6px; }}
.howto {{ background: #f3f5fb; border-radius: 10px; padding: 10px 14px; margin: 12px 0 18px; font-size: 11pt; }}
section {{ border-right: 4px solid #c9a24a; padding: 2px 14px 6px 0; margin: 0 0 16px; }}
section.sp-m {{ border-right-color: #2f6bff; }}
h2 {{ font-size: 14.5pt; font-weight: 900; margin: 0; color: #0a1f5c; }}
.meta {{ color: #5b6478; font-size: 10.5pt; margin-bottom: 4px; }}
ol {{ list-style: none; margin: 0; padding: 0; }}
li {{ display: flex; gap: 10px; align-items: baseline; break-inside: avoid; }}
h2, .meta {{ break-after: avoid; }}
li p {{ margin: 2px 0; }}
.n {{ flex: none; min-width: 26px; text-align: center; font-size: 9.5pt; font-weight: 700; color: #fff;
      background: #0a1f5c; border-radius: 6px; padding: 0 5px; }}
</style></head><body>
<h1>متن گفتار ارائه‌ی «قرآن نور»</h1>
<div class="sub">درس تفسیر موضوعی قرآن | استاد محب پور حقیقی | {fa(27)} مهر {fa(1405)}</div>
<div class="howto">هر شماره یک کلیک است و با شماره‌ی اسلاید در پاورپوینت یکی است. زمان گفتار حدود {fa(round(sum(totals.values()) / 60))} دقیقه
({summary})؛ با کلیک‌ها و مکث‌ها، کل ارائه کمتر از {fa(15)} دقیقه می‌شود. نوار طلایی کنار هر بخش یعنی فوژان صفای روح و نوار آبی یعنی مریم نظریه.</div>
{''.join(parts)}
</body></html>"""
    src = ROOT / "out/deck/script.html"
    src.write_text(page, encoding="utf8")
    subprocess.run(
        [CHROME, "--headless=new", "--no-sandbox", "--disable-gpu", f"--print-to-pdf={OUT}",
         "--no-pdf-header-footer", src.as_uri()],
        check=True, capture_output=True,
    )
    print("wrote", OUT)


if __name__ == "__main__":
    main()
