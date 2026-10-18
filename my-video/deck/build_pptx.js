// Builds the click-through deck from the clips listed in out/deck/manifest.json:
// one slide per click, a full-bleed video whose cover is its own first frame, a transparent
// overlay so mouse clicks advance the slide instead of pausing the video, and speaker notes.
// A slide with `still` instead shows that image, so it reads the same in thumbnails and in
// viewers that do not play video.
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

const [manifestPath, outPath] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";
pres.title = "معرفی اپلیکیشن قرآن نور و قابلیت‌های آن";
pres.author = "فوژان صفای روح و مریم نظریه";
pres.subject = "درس تفسیر موضوعی قرآن";
pres.rtlMode = true;

for (const s of manifest.slides) {
  if (s.section) pres.addSection({ title: s.section });
  const slide = pres.addSlide({ sectionTitle: s.sectionTitle });
  slide.background = { color: "040B22" };
  if (s.still) {
    slide.addImage({ path: path.resolve(s.still), x: 0, y: 0, w: 13.333, h: 7.5, objectName: "still" });
    slide.addNotes(s.notes);
    continue;
  }
  const cover = fs.readFileSync(s.poster).toString("base64");
  slide.addMedia({
    type: "video",
    path: path.resolve(s.clip),
    cover: `data:image/jpeg;base64,${cover}`,
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    objectName: "clip",
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: "000000", transparency: 100 },
    line: { type: "none" },
    objectName: "click-catcher",
  });
  slide.addNotes(s.notes);
}

pres.writeFile({ fileName: outPath }).then((f) => console.log("wrote", f));
