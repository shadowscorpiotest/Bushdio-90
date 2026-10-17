import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, QURAN, fa } from "./theme";
import { Icon, IconName, MiniChip, Skeleton, useSpring } from "./ui";

// Phone screen illustrations, modelled on the app screenshots in Rahavard-e Noor no. 83

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 4px 16px rgba(22,32,63,0.08)",
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

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

const Radio: React.FC<{ on: boolean }> = ({ on }) => (
  <div
    style={{
      width: 22,
      height: 22,
      borderRadius: "50%",
      border: `2.5px solid ${on ? C.blue : "#b9c2dd"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {on ? <div style={{ width: 11, height: 11, borderRadius: "50%", background: C.blue }} /> : null}
  </div>
);

const Avatar: React.FC<{ icon?: IconName; size?: number }> = ({ icon = "headphones", size = 44 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 12,
      background: `linear-gradient(135deg, ${C.blue}, ${C.blueDeep})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <Icon name={icon} size={size * 0.5} color="white" />
  </div>
);

const FATIHA = [
  "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
  "الرَّحْمَٰنِ الرَّحِيمِ",
  "مَالِكِ يَوْمِ الدِّينِ",
  "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
  "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
  "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
];
const arabicDigits = (n: number) =>
  String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

const AYAH_2 = "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ";
const MAKARIM_2 = "ستایش مخصوص خداوندی است که پروردگار جهانیان است.";

export const HomeScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const tiles: [string, IconName][] = [
    ["تفسیر و ترجمه", "languages"],
    ["اعراب قرآن", "type"],
    ["فرهنگ موضوعی", "layers"],
    ["اعلام و اسماء", "library"],
    ["نشانک‌ها", "bookmark"],
    ["ختم قرآن", "book"],
  ];
  const active = Math.floor(interpolate(frame, [70, 210], [0, 6], clamp));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Pop
        delay={12}
        style={{ ...card, display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}
      >
        <Icon name="search" size={22} color={C.inkMuted} />
        <span style={{ fontSize: 16, color: C.inkMuted }}>جستجوی سوره، آیه، ترجمه و تفسیر</span>
      </Pop>
      <Pop delay={18} style={{ display: "flex", gap: 8 }}>
        {["حمد", "نساء", "مائده", "واقعه"].map((s) => (
          <MiniChip key={s}>{s}</MiniChip>
        ))}
      </Pop>
      <Pop
        delay={24}
        style={{
          ...card,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          border: `2px solid ${C.gold}`,
          background: "#fffaf0",
        }}
      >
        <Avatar icon="book" size={46} />
        <span style={{ fontFamily: QURAN, fontSize: 34, fontWeight: 700 }}>قرآن کریم</span>
      </Pop>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {tiles.map(([label, icon], i) => (
          <Pop
            key={label}
            delay={32 + i * 6}
            style={{
              ...card,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 12px",
              border: `2px solid ${i === active ? C.blue : "transparent"}`,
            }}
          >
            <Avatar icon={icon} size={38} />
            <span style={{ fontSize: 17, fontWeight: 800 }}>{label}</span>
          </Pop>
        ))}
      </div>
      <Pop delay={70} style={{ ...card, border: "1.5px solid #e6dcc0", textAlign: "center" }}>
        <div style={{ fontFamily: QURAN, fontSize: 24 }}>
          الأعلی: قَدْ أَفْلَحَ مَنْ تَزَكَّىٰ
        </div>
        <div style={{ fontSize: 14, color: C.inkMuted, marginTop: 6, lineHeight: 1.6 }}>
          به یقین کسی که پاکی جست (و خود را تزکیه کرد)، رستگار شد
        </div>
      </Pop>
    </div>
  );
};

export const MushafScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const modes = ["املایی", "مصحف ۱۵ خطی", "تجویدی"];
  const mode = frame < 95 ? 0 : frame < 155 ? 1 : 2;
  const active = Math.floor(interpolate(frame, [45, 215], [0, 7], clamp));
  const legend: [string, string][] = [
    ["#d1342f", "مد واجب"],
    ["#e8892b", "مد جایز"],
    ["#2a9d6b", "اخفاء و غنه"],
    ["#2f6bff", "قلقله"],
    ["#8a4fd1", "ادغام"],
    ["#9aa3b8", "حروف ناخوانا"],
  ];
  const legendP = useSpring(160);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 12, position: "relative" }}>
      <Pop
        delay={12}
        style={{ display: "flex", background: "#e6ebfa", borderRadius: 999, padding: 4 }}
      >
        {modes.map((m, i) => (
          <div
            key={m}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "7px 0",
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 800,
              background: i === mode ? C.blue : "transparent",
              color: i === mode ? "white" : C.ink,
            }}
          >
            {m}
          </div>
        ))}
      </Pop>
      <Pop delay={20}>
        <div
          style={{
            border: `2px solid ${C.gold}`,
            borderRadius: 14,
            padding: "6px 0",
            textAlign: "center",
            fontFamily: QURAN,
            fontSize: 28,
            fontWeight: 700,
            background: "#fbf4e2",
          }}
        >
          سُورَةُ الفَاتِحَة
        </div>
      </Pop>
      <Pop
        delay={30}
        style={{
          ...card,
          flex: 1,
          background: "#fffdf7",
          border: mode === 1 ? `4px double ${C.gold}` : "4px solid transparent",
        }}
      >
        <div
          style={{
            fontFamily: QURAN,
            fontSize: mode === 1 ? 26 : 29,
            lineHeight: mode === 1 ? 1.95 : 2.15,
            textAlign: mode === 1 ? "justify" : "center",
            textAlignLast: "center",
            direction: "rtl",
          }}
        >
          {FATIHA.map((v, i) => (
            <span
              key={i}
              style={{
                background: i === active ? "rgba(226,189,107,0.38)" : "transparent",
                borderRadius: 8,
                padding: "0 3px",
              }}
            >
              {v} <span style={{ color: "#b08a2e" }}>﴿{arabicDigits(i + 1)}﴾</span>{" "}
            </span>
          ))}
        </div>
      </Pop>
      <div
        style={{
          ...card,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          opacity: legendP,
          transform: `translateY(${(1 - legendP) * 60}px)`,
          boxShadow: "0 -8px 30px rgba(22,32,63,0.18)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>قواعد تجویدی</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {legend.map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ReciterScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const reciters = [
    ["احمد دباغ", "ترتیل"],
    ["احمد دباغ", "تحدیر"],
    ["حذیفی علی عبدالرحمن", "ترتیل"],
    ["خلیل حصری", "تحقیق"],
    ["خلیل حصری", "ترتیل"],
    ["سعد الغامدی", "ترتیل"],
  ];
  const selected = frame < 105 ? 0 : 3;
  const suras: [string, number][] = [
    ["الفاتحة", 7],
    ["البقرة", 286],
    ["آل عمران", 200],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Pop delay={10} style={{ fontSize: 18, fontWeight: 800 }}>
        قاری منتخب
      </Pop>
      <Pop delay={16} style={{ ...card, padding: "6px 14px" }}>
        {reciters.map(([name, style], i) => (
          <div
            key={name + style}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "9px 0",
              borderBottom: i < reciters.length - 1 ? "1px solid #edf0f8" : "none",
            }}
          >
            <Radio on={i === selected} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{name}</div>
              <div style={{ fontSize: 14, color: C.inkMuted }}>{style}</div>
            </div>
            <Avatar size={40} />
          </div>
        ))}
      </Pop>
      <Pop delay={70} style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 17, fontWeight: 800 }}>مدیریت دانلودها</span>
          <div style={{ display: "flex", gap: 6 }}>
            <MiniChip active>دانلود همه</MiniChip>
            <MiniChip>حذف همه</MiniChip>
          </div>
        </div>
        {suras.map(([s, n], i) => {
          const pct = i === 0 ? interpolate(frame, [90, 170], [0, 100], clamp) : i === 1 ? interpolate(frame, [130, 215], [0, 100], clamp) : 0;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <span style={{ fontFamily: QURAN, fontSize: 21, width: 82 }}>{s}</span>
              <span style={{ fontSize: 13, color: C.inkMuted, width: 78 }}>{fa(n)} آیه</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#e3e8f7" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: C.gold }} />
              </div>
              <Icon name={pct >= 100 ? "check" : "download"} size={20} color={pct >= 100 ? "#2a9d6b" : C.blue} />
            </div>
          );
        })}
      </Pop>
    </div>
  );
};

export const PlaybackScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const modes = ["متن", "متن و ترجمه", "ترجمه", "ترجمه و متن"];
  const active = Math.floor(interpolate(frame, [50, 190], [0, 4], clamp)) % 4;
  const narrators = [
    ["اسماعیل قادرپناه", "ترجمه مکارم"],
    ["علی همت مومیوند", "ترجمه ملکی"],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Pop delay={12} style={{ ...card, background: "#fffdf7", textAlign: "center" }}>
        <div style={{ fontFamily: QURAN, fontSize: 30 }}>
          {AYAH_2} <span style={{ color: "#b08a2e" }}>﴿٢﴾</span>
        </div>
        <div style={{ fontSize: 16, color: C.inkMuted, marginTop: 6 }}>{MAKARIM_2}</div>
      </Pop>
      <Pop delay={24} style={card}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>حالت پخش</div>
        {modes.map((m, i) => (
          <div
            key={m}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "9px 10px",
              borderRadius: 12,
              background: i === active ? "#e8eeff" : "transparent",
            }}
          >
            <Radio on={i === active} />
            <span style={{ fontSize: 17, fontWeight: i === active ? 800 : 500 }}>{m}</span>
          </div>
        ))}
      </Pop>
      <Pop delay={44} style={card}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>ترجمه‌ی گویا</div>
        {narrators.map(([n, t], i) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
            <Radio on={i === 0} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{n}</div>
              <div style={{ fontSize: 14, color: C.inkMuted }}>{t}</div>
            </div>
            <Avatar icon="speaker" size={40} />
          </div>
        ))}
      </Pop>
    </div>
  );
};

export const MemorizeScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [30, 215], [0.1, 0.8], clamp);
  const speeds = ["۰٫۵", "۰٫۷۵", "عادی", "۱٫۲۵", "۱٫۵", "۱٫۷۵", "۲٫۰"];
  const speed = speeds[Math.floor(interpolate(frame, [60, 150], [2, 6.99], clamp))];
  const verseRep = [1, 2, 3, 5, 10, 20, 50, 100][Math.floor(interpolate(frame, [90, 190], [0, 7.99], clamp))];
  const toggle = useSpring(150);
  const rows: [string, string, IconName][] = [
    ["سرعت پخش", speed === "عادی" ? speed : `${speed}×`, "speaker"],
    ["تعداد تکرار آیه", `${fa(verseRep)} بار`, "repeat"],
    ["تعداد تکرار سوره", `${fa(3)} بار`, "repeat"],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Pop delay={14} style={{ ...card, textAlign: "center", padding: 20 }}>
        <div style={{ fontFamily: QURAN, fontSize: 28 }}>
          {AYAH_2} <span style={{ color: "#b08a2e" }}>﴿٢﴾</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, height: 64, marginTop: 10 }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const h = 12 + Math.abs(Math.sin(frame / 5 + i * 0.7)) * 44 * (0.5 + (i % 3) * 0.25);
            return (
              <div
                key={i}
                style={{
                  width: 6,
                  height: h,
                  borderRadius: 3,
                  background: i / 30 < 1 - progress ? "#c9d4f5" : C.blue,
                }}
              />
            );
          })}
        </div>
        <div style={{ height: 6, borderRadius: 3, background: "#e3e8f7", marginTop: 10 }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", borderRadius: 3, background: C.blue }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 34, marginTop: 14 }}>
          <Icon name="next" size={28} color={C.ink} fill={C.ink} />
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: C.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="pause" size={26} color="white" fill="white" />
          </div>
          <Icon name="prev" size={28} color={C.ink} fill={C.ink} />
        </div>
      </Pop>
      {rows.map(([k, v, icon], i) => (
        <Pop
          key={k}
          delay={40 + i * 12}
          style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: 14 }}
        >
          <Icon name={icon} size={22} color={C.blue} />
          <span style={{ flex: 1, fontSize: 17, fontWeight: 700 }}>{k}</span>
          <MiniChip active>{v}</MiniChip>
        </Pop>
      ))}
      <Pop delay={80} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
        <Icon name="book" size={22} color={C.blue} />
        <span style={{ flex: 1, fontSize: 17, fontWeight: 700 }}>حرکت خودکار متن</span>
        <div
          style={{
            width: 50,
            height: 28,
            borderRadius: 14,
            background: toggle > 0.5 ? C.blue : "#cfd6ea",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 3,
              right: 3 + toggle * 22,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "white",
            }}
          />
        </div>
      </Pop>
    </div>
  );
};

export const TranslateScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const list = [
    ["ترجمه مکارم", "فارسی"],
    ["ترجمه استادولی", "فارسی"],
    ["ترجمه انصاریان", "فارسی"],
    ["ترجمه فولادوند", "فارسی"],
    ["انگلیسی - قرائی", "انگلیسی"],
    ["ترکی - گلپینارلی", "ترکی استانبولی"],
  ];
  const selected = frame < 120 ? 0 : 4;
  const english = selected === 4;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Pop delay={12} style={{ ...card, background: "#fffdf7", textAlign: "center" }}>
        <div style={{ fontFamily: QURAN, fontSize: 30 }}>
          {AYAH_2} <span style={{ color: "#b08a2e" }}>﴿٢﴾</span>
        </div>
        <div
          style={{
            fontSize: 17,
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid #eee4c8",
            color: C.ink,
            direction: english ? "ltr" : "rtl",
          }}
        >
          {english ? "All praise belongs to Allah, Lord of all the worlds." : MAKARIM_2}
        </div>
      </Pop>
      <Pop delay={24} style={{ fontSize: 17, fontWeight: 800 }}>
        نمایش ترجمه در متن
      </Pop>
      <Pop delay={30} style={{ ...card, padding: "4px 14px" }}>
        {list.map(([name, lang], i) => (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 0",
              borderBottom: i < list.length - 1 ? "1px solid #edf0f8" : "none",
            }}
          >
            <Radio on={i === selected} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{name}</div>
              <div style={{ fontSize: 14, color: C.inkMuted }}>{lang}</div>
            </div>
          </div>
        ))}
      </Pop>
    </div>
  );
};

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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Pop
        delay={15}
        style={{
          ...card,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          color: C.inkMuted,
          fontSize: 18,
        }}
      >
        <Icon name="search" size={22} color={C.inkMuted} />
        جستجو در تفاسیر…
      </Pop>
      <Pop delay={25} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {filters.map((f, i) => (
          <MiniChip key={f} active={i === active}>
            {f}
          </MiniChip>
        ))}
      </Pop>
      {list.map(([name, author, madhab], i) => (
        <Pop
          key={name}
          delay={45 + i * 14}
          style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "#e8eeff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="layers" size={28} color={C.blue} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{name}</div>
            <div style={{ fontSize: 15, color: C.inkMuted }}>{author}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: madhab === "شیعه" ? C.blue : "#2a9d6b" }}>
              {madhab}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#8a6a1f",
                background: "#fbf0d4",
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
  );
};

export const WordsScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const words = [
    ["الْحَمْدُ", "ستایش"],
    ["لِلَّهِ", "برای خدا"],
    ["رَبِّ", "پروردگار"],
    ["الْعَالَمِينَ", "جهانیان"],
  ];
  const active = Math.floor(interpolate(frame, [50, 200], [0, 4], clamp)) % 4;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Pop
        delay={15}
        style={{ ...card, background: "#fffdf7", fontFamily: QURAN, fontSize: 30, textAlign: "center" }}
      >
        {AYAH_2}
      </Pop>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {words.map(([ar, mean], i) => {
          const on = i === active;
          return (
            <Pop
              key={ar}
              delay={28 + i * 10}
              style={{
                ...card,
                textAlign: "center",
                padding: "18px 10px",
                border: `2.5px solid ${on ? C.blue : "transparent"}`,
                transform: on ? "scale(1.04)" : undefined,
              }}
            >
              <div style={{ fontFamily: QURAN, fontSize: 34 }}>{ar}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.blue, marginTop: 4 }}>{mean}</div>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "center",
                  opacity: on ? 0.6 + Math.abs(Math.sin(frame / 5)) * 0.4 : 0.3,
                }}
              >
                <Icon name="speaker" size={22} color={on ? C.blue : C.inkMuted} />
              </div>
            </Pop>
          );
        })}
      </div>
      <Pop
        delay={90}
        style={{
          ...card,
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: `2px solid ${C.gold}`,
          background: "#fffaf0",
        }}
      >
        <Avatar icon="library" size={44} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>قاموس نور</div>
          <div style={{ fontSize: 14, color: C.inkMuted }}>
            توضیحات تکمیلی واژه‌ی «{words[active][1]}»
          </div>
        </div>
      </Pop>
    </div>
  );
};

export const SuraInfoScreen: React.FC = () => {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Pop delay={10} style={{ fontSize: 19, fontWeight: 800 }}>
        سوره‌نامه: حمد
      </Pop>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {facts.map(([k, v], i) => (
          <Pop key={k} delay={18 + i * 7} style={{ ...card, padding: "12px 14px" }}>
            <div style={{ fontSize: 13, color: C.inkMuted }}>{k}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.blue }}>{v}</div>
          </Pop>
        ))}
      </div>
      <Pop delay={50} style={card}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>نام‌ها</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {names.map((n) => (
            <MiniChip key={n}>{n}</MiniChip>
          ))}
        </div>
      </Pop>
      <Pop delay={75} style={card}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>محتوا</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 10px" }}>
          {content.map((c, i) => (
            <Pop key={c} delay={85 + i * 6} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.gold, flexShrink: 0 }} />
              {c}
            </Pop>
          ))}
        </div>
      </Pop>
    </div>
  );
};

export const HadithScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const related = ["انعام ۴۵", "یونس ۱۰", "صافات ۱۸۲", "زمر ۷۵"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <Pop delay={12} style={{ fontSize: 19, fontWeight: 800 }}>
        روایات تفسیری — سوره‌ی حمد، آیه‌ی {fa(2)}
      </Pop>
      {[0, 1].map((i) => (
        <Pop key={i} delay={22 + i * 12} style={{ ...card, display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="book" size={20} color={C.gold} />
            <span style={{ fontSize: 16, fontWeight: 800 }}>روایت {fa(i + 1)}</span>
          </div>
          <Skeleton width="100%" />
          <Skeleton width="90%" />
          <Skeleton width={i === 1 ? "55%" : "72%"} />
        </Pop>
      ))}
      <Pop
        delay={60}
        style={{
          ...card,
          border: `2px solid ${C.blue}`,
          background: "linear-gradient(135deg, #f1f5ff, #ffffff)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icon name="sparkles" size={22} color={C.blue} />
          <span style={{ fontSize: 16, fontWeight: 800 }}>آیات مرتبط (هوش مصنوعی)</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {related.map((r, i) => (
            <Pop key={r} delay={80 + i * 10}>
              <MiniChip active={i === 0}>{r}</MiniChip>
            </Pop>
          ))}
        </div>
      </Pop>
      <Pop delay={120} style={{ marginTop: "auto" }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${C.gold}, #c99a3a)`,
            color: "#2a1f05",
            borderRadius: 16,
            padding: "15px 0",
            textAlign: "center",
            fontSize: 17,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: `0 0 0 ${Math.max(0, Math.sin(frame / 8)) * 8}px rgba(226,189,107,0.25)`,
          }}
        >
          <Icon name="library" size={22} color="#2a1f05" />
          مطالعه در کتابخانه‌ی دیجیتال نور
        </div>
      </Pop>
    </div>
  );
};

export const SearchScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const query = "صبر";
  const typed = Math.floor(interpolate(frame, [20, 50], [0, query.length], clamp));
  const caret = Math.floor(frame / 12) % 2 === 0;
  const results = [
    ["بقره، آیه‌ی ۱۵۳", "اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ"],
    ["آل‌عمران، آیه‌ی ۲۰۰", "اصْبِرُوا وَصَابِرُوا وَرَابِطُوا"],
    ["زمر، آیه‌ی ۱۰", "إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُمْ"],
  ];
  const starred = (i: number) => frame > 110 + i * 15;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          ...card,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          border: `2px solid ${C.blue}`,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        <Icon name="search" size={24} color={C.blue} />
        <span>{query.slice(0, typed)}</span>
        <span style={{ opacity: caret ? 1 : 0, color: C.blue, marginRight: -6 }}>|</span>
      </div>
      <Pop delay={56} style={{ fontSize: 15, color: C.inkMuted, fontWeight: 700 }}>
        نتایج در سوره، آیه، ترجمه و تفسیر
      </Pop>
      {results.map(([ref, ayah], i) => (
        <Pop key={ref} delay={60 + i * 12} style={{ ...card, position: "relative" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.blue }}>{ref}</div>
          <div style={{ fontFamily: QURAN, fontSize: 24, marginTop: 4 }}>{ayah}</div>
          <div style={{ position: "absolute", top: 14, left: 14 }}>
            <Icon name="star" size={24} color={C.gold} fill={starred(i) ? C.gold : "none"} />
          </div>
        </Pop>
      ))}
      <Pop
        delay={160}
        style={{
          ...card,
          background: "#fff8e3",
          border: `1.5px dashed ${C.gold}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icon name="star" size={20} color="#b08a2e" fill="#b08a2e" />
          <span style={{ fontSize: 15, fontWeight: 800, color: "#8a6a1f" }}>علاقه‌مندی‌ها</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <MiniChip active>صبر ({fa(3)})</MiniChip>
          <MiniChip>نماز</MiniChip>
          <MiniChip>توکل</MiniChip>
        </div>
      </Pop>
    </div>
  );
};
