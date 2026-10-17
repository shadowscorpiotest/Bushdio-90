import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const C = {
  bg1: "#040b22",
  bg2: "#0a1f5c",
  blue: "#2f6bff",
  blueDeep: "#1a46c9",
  gold: "#e2bd6b",
  goldSoft: "#f3dca6",
  text: "#ffffff",
  muted: "#aebbe2",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.13)",
  ink: "#16203f",
  inkMuted: "#6b7699",
};

// Colours sampled from the app's own (dark) screenshots
export const A = {
  header: "#111e27",
  panel: "#2d2d2d",
  card: "#3d3d3d",
  line: "#4a4a4a",
  text: "#ececec",
  muted: "#a6a6a6",
  gold: "#dcba59",
  blue: "#7cc4f7",
  blueInk: "#0f1d27",
};

export const FONT ="Vazirmatn, VazirLatin, sans-serif";
export const QURAN = "Amiri, Vazirmatn, serif";

// Western digits -> Persian digits
export const fa = (s: string | number) =>
  String(s).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

const fonts = [
  ...[400, 500, 700, 800, 900].map((w) => ({
    family: "Vazirmatn",
    file: `fonts/vazirmatn-arabic-${w}-normal.woff2`,
    weight: String(w),
  })),
  ...[400, 500, 700, 800].map((w) => ({
    family: "VazirLatin",
    file: `fonts/vazirmatn-latin-${w}-normal.woff2`,
    weight: String(w),
  })),
  ...[400, 700].map((w) => ({
    family: "Amiri",
    file: `fonts/amiri-arabic-${w}-normal.woff2`,
    weight: String(w),
  })),
];

for (const f of fonts) {
  loadFont({ family: f.family, url: staticFile(f.file), weight: f.weight });
}
