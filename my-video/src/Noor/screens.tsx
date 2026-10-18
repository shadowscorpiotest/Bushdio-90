import React from "react";
import { Easing, Freeze, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { A, QURAN, fa } from "./theme";
import { Icon, MiniChip, Skeleton, StepCtx, useAt, useSpring } from "./ui";

const SCREEN_W = 412;
const NOTCH_H = 40;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Real screenshots supplied by the user. `basis` is the width the box coordinates below are
// measured in, `crop` the status-bar height (same units) trimmed from the top of the file.
type Shot = { src: string; basis: number; crop: number };
export const SHOTS = {
  home: { src: "screens/home.jpg", basis: 923, crop: 100 },
  homeScroll: { src: "screens/home-scroll.jpg", basis: 923, crop: 100 },
  language: { src: "screens/language.jpg", basis: 923, crop: 100 },
  suraList: { src: "screens/sura-list.jpg", basis: 923, crop: 100 },
  readingNahl: { src: "screens/reading-nahl.jpg", basis: 591, crop: 70 },
  settingsText: { src: "screens/settings-text.jpg", basis: 923, crop: 100 },
  settingsRecite: { src: "screens/settings-recite.jpg", basis: 923, crop: 100 },
  readingSheet: { src: "screens/reading-sheet.jpg", basis: 923, crop: 100 },
} satisfies Record<string, Shot>;

export type Box = { x: number; y: number; w: number; h: number };
export type Mark = { at: number; box: Box };

// Spotlight that moves between boxes, dimming the rest of the screen
const Spotlight: React.FC<{ shot: Shot; marks: Mark[] }> = ({ shot, marks }) => {
  const frame = useCurrentFrame();
  let idx = -1;
  marks.forEach((m, i) => {
    if (frame >= m.at) idx = i;
  });
  if (idx < 0) return null;
  const cur = marks[idx].box;
  const prev = marks[Math.max(0, idx - 1)].box;
  const t =
    idx === 0
      ? 1
      : interpolate(frame, [marks[idx].at, marks[idx].at + 14], [0, 1], {
          ...clamp,
          easing: Easing.inOut(Easing.cubic),
        });
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const k = SCREEN_W / shot.basis;
  const appear = interpolate(frame, [marks[0].at, marks[0].at + 10], [0, 1], clamp);
  const glow = 16;
  return (
    <div
      style={{
        position: "absolute",
        left: lerp(prev.x, cur.x) * k - 5,
        top: NOTCH_H + (lerp(prev.y, cur.y) - shot.crop) * k - 5,
        width: lerp(prev.w, cur.w) * k + 10,
        height: lerp(prev.h, cur.h) * k + 10,
        borderRadius: 16,
        border: `3px solid rgba(220,186,89,${appear})`,
        boxShadow: `0 0 0 2000px rgba(0,0,0,${0.42 * appear}), 0 0 ${glow}px rgba(220,186,89,${0.9 * appear})`,
      }}
    />
  );
};

export const ShotScreen: React.FC<{ shot: Shot; marks?: Mark[] }> = ({ shot, marks = [] }) => (
  <div style={{ position: "absolute", inset: 0, background: A.header }}>
    <Img
      src={staticFile(shot.src)}
      style={{ position: "absolute", top: NOTCH_H, left: 0, width: SCREEN_W }}
    />
    <Spotlight shot={shot} marks={marks} />
  </div>
);

// Illustrated screen in the app's own style, for views no screenshot covers
export const AppScreen: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: A.header,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ padding: "54px 22px 18px", display: "flex", alignItems: "center", gap: 12 }}>
      <Icon name="back" size={26} color={A.gold} />
      <span style={{ fontSize: 22, fontWeight: 800, color: A.gold }}>{title}</span>
    </div>
    <div
      style={{
        flex: 1,
        background: A.panel,
        borderRadius: "26px 26px 0 0",
        padding: 18,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  </div>
);

const card: React.CSSProperties = {
  background: A.card,
  borderRadius: 16,
  padding: 14,
};

const Pop: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay,
  children,
  style,
}) => {
  const p = useSpring(delay);
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 20}px)`, ...style }}>
      {children}
    </div>
  );
};

const SABR_RESULTS = [
  ["بقره، آیه‌ی ۱۵۳", "اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ"],
  ["آل‌عمران، آیه‌ی ۲۰۰", "اصْبِرُوا وَصَابِرُوا وَرَابِطُوا"],
  ["نحل، آیه‌ی ۱۲۷", "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ"],
];

// Voice search for «صبر»: mic, typing, results, then starring results into a favourites category
export const SearchScreen: React.FC<{ typeAt: number; resultsAt: number; favAt: number }> = ({
  typeAt,
  resultsAt,
  favAt,
}) => {
  const frame = useCurrentFrame();
  const query = "صبر";
  const typed = Math.floor(interpolate(frame, [typeAt + 14, typeAt + 26], [0, query.length], clamp));
  const listening = frame >= typeAt && frame < typeAt + 14;
  const starred = (i: number) => frame >= favAt + 4 + i * 5;
  return (
    <AppScreen title="جستجو">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            ...card,
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderRadius: 999,
            padding: "12px 18px",
            fontSize: 21,
            fontWeight: 700,
          }}
        >
          <span style={{ flex: 1, color: typed ? A.text : A.muted, fontSize: typed ? 21 : 16 }}>
            {typed ? query.slice(0, typed) : "جستجوی سوره، آیه، ترجمه و تفسیر"}
          </span>
          <Icon name="search" size={22} color={A.gold} />
          <div
            style={{
              borderRadius: "50%",
              padding: 4,
              boxShadow: listening ? "0 0 0 8px rgba(220,186,89,0.3)" : "none",
            }}
          >
            <Icon name="mic" size={22} color={A.gold} />
          </div>
        </div>
        <Pop delay={resultsAt} style={{ fontSize: 15, color: A.muted, fontWeight: 700 }}>
          نتایج در سوره، آیه، ترجمه و تفسیر
        </Pop>
        {SABR_RESULTS.map(([ref, ayah], i) => (
          <Pop key={ref} delay={resultsAt + 3 + i * 4} style={{ ...card, position: "relative" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: A.blue }}>{ref}</div>
            <div style={{ fontFamily: QURAN, fontSize: 24, marginTop: 4 }}>{ayah}</div>
            <div style={{ position: "absolute", top: 14, left: 14 }}>
              <Icon name="star" size={24} color={A.gold} fill={starred(i) ? A.gold : "none"} />
            </div>
          </Pop>
        ))}
        <Pop delay={favAt + 16} style={{ ...card, border: `1.5px dashed ${A.gold}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="star" size={20} color={A.gold} fill={A.gold} />
            <span style={{ fontSize: 15, fontWeight: 800, color: A.gold }}>علاقه‌مندی‌ها</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <MiniChip active>صبر ({fa(3)})</MiniChip>
            <MiniChip>نماز</MiniChip>
            <MiniChip>توکل</MiniChip>
          </div>
        </Pop>
      </div>
    </AppScreen>
  );
};

// Reading the tafsir of Baqarah 153 side by side; tafsir text is shown as placeholder lines
export const TafsirReadScreen: React.FC<{ from: number }> = ({ from }) => {
  const tabs = ["المیزان", "نمونه", "مجمع البیان"];
  return (
    <AppScreen title="تفسیر: بقره، آیه‌ی ۱۵۳">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Pop delay={from + 2} style={{ ...card, border: `1.5px solid ${A.gold}`, textAlign: "center" }}>
          <div style={{ fontFamily: QURAN, fontSize: 25, lineHeight: 1.9 }}>
            اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ
          </div>
          <div style={{ fontSize: 14, color: A.muted }}>از صبر و نماز یاری جویید؛ خداوند با صابران است</div>
        </Pop>
        <Pop delay={from + 6} style={{ display: "flex", gap: 8 }}>
          {tabs.map((t, i) => (
            <MiniChip key={t} active={i === 0}>
              {t}
            </MiniChip>
          ))}
        </Pop>
        {[0, 1].map((i) => (
          <Pop key={i} delay={from + 9 + i * 4} style={{ ...card, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="layers" size={18} color={A.gold} />
              <span style={{ fontSize: 15, fontWeight: 800 }}>{i === 0 ? "تفسیر المیزان" : "روایات تفسیری"}</span>
            </div>
            <Skeleton width="100%" />
            <Skeleton width="94%" />
            <Skeleton width="88%" />
            <Skeleton width={i === 0 ? "60%" : "45%"} />
          </Pop>
        ))}
        <Pop delay={from + 16} style={{ ...card, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="note" size={20} color={A.gold} />
          <span style={{ fontSize: 15 }}>یادداشت: صبر و نماز، دو تکیه‌گاه در سختی‌ها</span>
        </Pop>
      </div>
    </AppScreen>
  );
};

// «گفتگوی هوشمند با تفاسیر»; the answer is shown as placeholder lines, not real output
export const AIChatScreen: React.FC<{ from: number }> = ({ from }) => {
  const bubble: React.CSSProperties = { borderRadius: 18, padding: "12px 16px", maxWidth: "88%" };
  return (
    <AppScreen title="گفتگوی هوشمند با تفاسیر">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Pop delay={from + 2} style={{ display: "flex", justifyContent: "flex-start" }}>
          <div style={{ ...bubble, background: A.blue, color: A.blueInk, fontSize: 17, fontWeight: 700 }}>
            دیدگاه قرآن درباره‌ی صبر چیست و چه جایگاهی دارد؟
          </div>
        </Pop>
        <Pop delay={from + 10} style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ ...bubble, background: A.card, display: "flex", flexDirection: "column", gap: 9, width: "88%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="sparkles" size={18} color={A.gold} />
              <span style={{ fontSize: 14, fontWeight: 800, color: A.gold }}>پاسخ بر پایه‌ی تفاسیر</span>
            </div>
            <Skeleton width="100%" />
            <Skeleton width="96%" />
            <Skeleton width="90%" />
            <Skeleton width="98%" />
            <Skeleton width="70%" />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {["بقره ۱۵۳", "آل‌عمران ۲۰۰", "زمر ۱۰"].map((r) => (
                <MiniChip key={r}>{r}</MiniChip>
              ))}
            </div>
          </div>
        </Pop>
        <Pop
          delay={from + 18}
          style={{ ...card, display: "flex", alignItems: "center", gap: 10, border: `1.5px dashed ${A.gold}` }}
        >
          <Icon name="info" size={20} color={A.gold} />
          <span style={{ fontSize: 14, color: A.muted }}>پاسخ را با متن تفاسیر و منابع اصلی بسنجید</span>
        </Pop>
      </div>
    </AppScreen>
  );
};

// Screenshot whose spotlight follows the scene's click steps; null keeps the previous box
export const StepShot: React.FC<{ shot: Shot; boxes: (Box | null)[] }> = ({ shot, boxes }) => {
  const at = useAt();
  const marks: Mark[] = [];
  boxes.forEach((box, i) => {
    if (box) marks.push({ at: at(i + 1), box });
  });
  return <ShotScreen shot={shot} marks={marks} />;
};

// Screen recordings supplied by the user (480 × 1040, status bar 50px), re-encoded at 30fps
const REC = {
  v1: "rec/v1.mp4",
  v2: "rec/v2.mp4",
  v3: "rec/v3.mp4",
  v4: "rec/v4.mp4",
  v5: "rec/v5.mp4",
  v6: "rec/v6.mp4",
};
const REC_W = 480;
const REC_STATUS = 50;
// `mark` frames a tapped item (box in recording pixels, shown between `from` and `to` in source seconds)
export type Seg = {
  v: keyof typeof REC;
  from: number;
  to: number;
  rate?: number;
  mark?: { box: Box; from?: number; to?: number };
};

const RecMark: React.FC<{ mark: NonNullable<Seg["mark"]>; t: number }> = ({ mark, t }) => {
  const { box, from = 0, to } = mark;
  const fadeIn = interpolate(t, [from, from + 0.3], [0, 1], clamp);
  const fadeOut = to === undefined ? 1 : interpolate(t, [to - 0.2, to], [1, 0], clamp);
  const o = Math.min(fadeIn, fadeOut);
  if (o <= 0) return null;
  const k = SCREEN_W / REC_W;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x * k - 5,
        top: NOTCH_H + (box.y - REC_STATUS) * k - 5,
        width: box.w * k + 10,
        height: box.h * k + 10,
        borderRadius: 16,
        border: `3px solid rgba(220,186,89,${o})`,
        boxShadow: `0 0 0 2000px rgba(0,0,0,${0.42 * o}), 0 0 16px rgba(220,186,89,${0.9 * o})`,
      }}
    />
  );
};

// Plays one recording segment per click step (null keeps the previous segment) and holds its
// last frame until the next segment; a segment longer than its step is sped up to fit
export const RecSteps: React.FC<{ segs: (Seg | null)[] }> = ({ segs }) => {
  const frame = useCurrentFrame();
  const at = useAt();
  const { lens } = React.useContext(StepCtx);
  let idx = -1;
  segs.forEach((seg, i) => {
    if (seg && frame >= at(i)) idx = i;
  });
  if (idx < 0) return null;
  const seg = segs[idx] as Seg;
  let next = idx + 1;
  while (next < segs.length && !segs[next]) next++;
  const span = (next < segs.length ? at(next) : at(lens.length)) - at(idx);
  const srcFrames = (seg.to - seg.from) * 30;
  const rate = Math.max(seg.rate ?? 1, srcFrames / Math.max(1, span - 6));
  const local = Math.min(frame - at(idx), Math.floor(srcFrames / rate) - 1);
  const k = SCREEN_W / REC_W;
  return (
    <div style={{ position: "absolute", inset: 0, background: A.header }}>
      <Freeze frame={local}>
        <OffthreadVideo
          src={staticFile(REC[seg.v])}
          trimBefore={Math.round(seg.from * 30)}
          playbackRate={rate}
          muted
          style={{ position: "absolute", top: NOTCH_H - REC_STATUS * k, left: 0, width: SCREEN_W }}
        />
      </Freeze>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: NOTCH_H, background: A.header }} />
      {seg.mark ? <RecMark mark={seg.mark} t={seg.from + (local * rate) / 30} /> : null}
    </div>
  );
};

// Home-screen screenshot with spotlights; the noorlib.ir chat page is recorded
export const AIScreen: React.FC = () => {
  const at = useAt();
  const shot = (
    <ShotScreen
      shot={SHOTS.homeScroll}
      marks={[
        { at: at(1), box: { x: 54, y: 512, w: 814, h: 183 } },
        { at: at(3), box: { x: 0, y: 1470, w: 923, h: 340 } },
      ]}
    />
  );
  return (
    <StepSwitch
      screens={[
        { from: 0, el: shot },
        { from: at(2), el: <RecSteps segs={[null, null, { v: "v6", from: 101.8, to: 104.8 }]} /> },
        { from: at(3), el: shot },
      ]}
    />
  );
};

// Crossfades between whole phone screens at the given frames
export const StepSwitch: React.FC<{ screens: { from: number; el: React.ReactNode }[] }> = ({ screens }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {screens.map((s, i) => {
        const next = screens[i + 1];
        const fadeIn = i === 0 ? 1 : interpolate(frame, [s.from, s.from + 10], [0, 1], clamp);
        const fadeOut = next ? interpolate(frame, [next.from, next.from + 10], [1, 0], clamp) : 1;
        const o = Math.min(fadeIn, fadeOut);
        if (o <= 0) return null;
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: o }}>
            {s.el}
          </div>
        );
      })}
    </>
  );
};
