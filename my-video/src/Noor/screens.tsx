import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { A, QURAN, fa } from "./theme";
import { Icon, IconName, MiniChip, Skeleton, useAt, useSpring } from "./ui";

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
  const glow = 14 + Math.sin(frame / 6) * 8;
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

const GoldDisc: React.FC<{ icon: IconName; size?: number }> = ({ icon, size = 46 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: A.gold,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <Icon name={icon} size={size * 0.5} color={A.header} />
  </div>
);

const AYAH_2 = "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ";

export const TafsirScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const filters = ["مفسر", "مذهب", "زبان", "نوع تفسیر"];
  const active = Math.floor(frame / 35) % 4;
  const list = [
    ["المیزان", "علامه طباطبایی", "شیعه"],
    ["مجمع البیان", "شیخ طبرسی", "شیعه"],
    ["تفسیر نمونه", "آیت‌الله مکارم شیرازی", "شیعه"],
    ["الکشاف", "زمخشری", "سنی"],
    ["التبیان", "شیخ طوسی", "شیعه"],
  ];
  return (
    <AppScreen title="تفاسیر منتخب">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Pop
          delay={8}
          style={{ ...card, display: "flex", alignItems: "center", gap: 10, borderRadius: 999, padding: "12px 18px" }}
        >
          <span style={{ flex: 1, fontSize: 17, color: A.muted }}>جستجو در تفاسیر</span>
          <Icon name="search" size={22} color={A.gold} />
        </Pop>
        <Pop delay={12} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filters.map((f, i) => (
            <MiniChip key={f} active={i === active}>
              {f}
            </MiniChip>
          ))}
        </Pop>
        {list.map(([name, author, madhab], i) => (
          <Pop key={name} delay={14 + i * 4} style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}>
            <GoldDisc icon="layers" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{name}</div>
              <div style={{ fontSize: 15, color: A.muted }}>{author}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: madhab === "شیعه" ? A.blue : "#8fd19e" }}>
                {madhab}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: A.gold,
                  background: "rgba(220,186,89,0.15)",
                  padding: "2px 8px",
                  borderRadius: 8,
                }}
              >
                آفلاین
              </span>
            </div>
          </Pop>
        ))}
      </div>
    </AppScreen>
  );
};

export const WordsScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const at = useAt();
  const words = [
    ["الْحَمْدُ", "ستایش"],
    ["لِلَّهِ", "برای خدا"],
    ["رَبِّ", "پروردگار"],
    ["الْعَالَمِينَ", "جهانیان"],
  ];
  const active = Math.floor(frame / 30) % 4;
  return (
    <AppScreen title="واژه‌نامه">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Pop
          delay={8}
          style={{ ...card, fontFamily: QURAN, fontSize: 30, textAlign: "center", border: `1.5px solid ${A.gold}` }}
        >
          {AYAH_2}
        </Pop>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {words.map(([ar, mean], i) => {
            const on = i === active;
            return (
              <Pop
                key={ar}
                delay={12 + i * 5}
                style={{
                  ...card,
                  textAlign: "center",
                  padding: "18px 10px",
                  border: `2.5px solid ${on ? A.blue : "transparent"}`,
                }}
              >
                <div style={{ fontFamily: QURAN, fontSize: 34 }}>{ar}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: A.gold, marginTop: 4 }}>{mean}</div>
                <div style={{ marginTop: 8, display: "flex", justifyContent: "center", opacity: on ? 1 : 0.3 }}>
                  <Icon name="speaker" size={22} color={on ? A.blue : A.muted} />
                </div>
              </Pop>
            );
          })}
        </div>
        <Pop
          delay={at(3)}
          style={{ ...card, display: "flex", alignItems: "center", gap: 12, border: `1.5px solid ${A.gold}` }}
        >
          <GoldDisc icon="library" />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>قاموس نور</div>
            <div style={{ fontSize: 14, color: A.muted }}>توضیحات تکمیلی واژه‌ی «{words[active][1]}»</div>
          </div>
        </Pop>
      </div>
    </AppScreen>
  );
};

const SuraInfoScreen: React.FC<{ from: number }> = ({ from }) => {
  const facts: [string, string][] = [
    ["سوره", fa(1)],
    ["تعداد آیات", fa(7)],
    ["محل نزول", "مکی"],
    ["ترتیب نزول", fa(5)],
  ];
  const names = ["فاتحة الکتاب", "ام الکتاب", "ام القرآن", "سبع المثانی", "حمد", "صلاة", "شفاء", "اساس"];
  const content = [
    "مفهوم کلی سوره",
    "علت نام‌گذاری",
    "اهداف و آموزه‌ها",
    "محتوا و موضوعات",
    "فضائل و ثواب قرائت",
    "فضای نزول",
    "ترتیب در مصحف",
    "ارتباط با سوره‌ی قبلی",
  ];
  return (
    <AppScreen title="سوره‌نامه: حمد">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {facts.map(([k, v], i) => (
            <Pop key={k} delay={from + 4 + i * 3} style={{ ...card, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, color: A.muted }}>{k}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: A.gold }}>{v}</div>
            </Pop>
          ))}
        </div>
        <Pop delay={from + 10} style={card}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>نام‌ها</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {names.map((n) => (
              <div
                key={n}
                style={{ padding: "4px 12px", borderRadius: 999, background: A.panel, fontSize: 14, fontWeight: 700 }}
              >
                {n}
              </div>
            ))}
          </div>
        </Pop>
        <Pop delay={from + 14} style={card}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>محتوا</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 10px" }}>
            {content.map((c) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: A.gold, flexShrink: 0 }} />
                {c}
              </div>
            ))}
          </div>
        </Pop>
      </div>
    </AppScreen>
  );
};

// Real sura list for the first two steps, then the sura-info view opened from its ⓘ button
export const SuraNamehScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const at = useAt();
  const swap = interpolate(frame, [at(3), at(3) + 12], [0, 1], clamp);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - swap }}>
        <ShotScreen
          shot={SHOTS.suraList}
          marks={[
            { at: at(1), box: { x: 0, y: 215, w: 923, h: 100 } },
            { at: at(2), box: { x: 676, y: 545, w: 100, h: 1380 } },
          ]}
        />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: swap, transform: `translateX(${(1 - swap) * -60}px)` }}>
        <SuraInfoScreen from={at(3)} />
      </div>
    </>
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

export const SearchStepScreen: React.FC = () => {
  const at = useAt();
  return <SearchScreen typeAt={at(1)} resultsAt={at(2)} favAt={at(3)} />;
};
