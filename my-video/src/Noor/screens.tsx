import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, QURAN, fa } from "./theme";
import { Icon, MiniChip, Skeleton, useSpring } from "./ui";

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

export const MushafScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const active = Math.floor(interpolate(frame, [45, 195], [0, 7], clamp));
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 14 }}>
      <Pop delay={20}>
        <div
          style={{
            border: `2px solid ${C.gold}`,
            borderRadius: 14,
            padding: "8px 0",
            textAlign: "center",
            fontFamily: QURAN,
            fontSize: 30,
            fontWeight: 700,
            background: "#fbf4e2",
          }}
        >
          سُورَةُ الفَاتِحَة
        </div>
      </Pop>
      <Pop delay={30} style={{ ...card, flex: 1, background: "#fffdf7" }}>
        <div
          style={{
            fontFamily: QURAN,
            fontSize: 30,
            lineHeight: 2.15,
            textAlign: "center",
            direction: "rtl",
          }}
        >
          {FATIHA.map((v, i) => (
            <span
              key={i}
              style={{
                background: i === active ? "rgba(226,189,107,0.38)" : "transparent",
                borderRadius: 8,
                padding: "0 4px",
              }}
            >
              {v}{" "}
              <span style={{ color: "#b08a2e" }}>﴿{arabicDigits(i + 1)}﴾</span>{" "}
            </span>
          ))}
        </div>
      </Pop>
      <Pop delay={40}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 17,
            color: C.inkMuted,
            fontWeight: 700,
          }}
        >
          <span>صفحه {fa(1)}</span>
          <span>جزء {fa(1)}</span>
          <span>حزب {fa(1)}</span>
        </div>
      </Pop>
    </div>
  );
};

export const ReciteScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [30, 210], [0.12, 0.78], clamp);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <Pop delay={20} style={{ ...card, textAlign: "center", padding: 22 }}>
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: "50%",
            margin: "0 auto 12px",
            background: `linear-gradient(135deg, ${C.blue}, ${C.blueDeep})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 ${8 + Math.sin(frame / 6) * 4}px rgba(47,107,255,0.15)`,
          }}
        >
          <Icon name="headphones" size={54} color="white" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>سوره‌ی حمد — آیه‌ی {fa(2)}</div>
        <div style={{ fontSize: 16, color: C.inkMuted, marginTop: 4 }}>قاری منتخب شما</div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            height: 70,
            marginTop: 12,
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => {
            const h = 14 + Math.abs(Math.sin(frame / 5 + i * 0.7)) * 46 * (0.5 + (i % 3) * 0.25);
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
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: 3,
              background: C.blue,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 34,
            marginTop: 16,
          }}
        >
          <Icon name="next" size={30} color={C.ink} fill={C.ink} />
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: C.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="pause" size={28} color="white" fill="white" />
          </div>
          <Icon name="prev" size={30} color={C.ink} fill={C.ink} />
        </div>
      </Pop>
      {[
        ["سرعت پخش", `${fa("1.25")}×`],
        ["تکرار آیه", `${fa(3)} بار`],
        ["تکرار سوره", `${fa(1)} بار`],
      ].map(([k, v], i) => (
        <Pop
          key={k}
          delay={60 + i * 12}
          style={{ ...card, display: "flex", justifyContent: "space-between", padding: 14 }}
        >
          <span style={{ fontSize: 18, fontWeight: 700 }}>{k}</span>
          <MiniChip active>{v}</MiniChip>
        </Pop>
      ))}
      <Pop delay={100} style={{ ...card, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="download" size={24} color={C.blue} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>مدیریت دانلودها</div>
          <div style={{ height: 6, borderRadius: 3, background: "#e3e8f7" }}>
            <div
              style={{
                width: `${interpolate(frame, [100, 200], [10, 100], clamp)}%`,
                height: "100%",
                borderRadius: 3,
                background: C.gold,
              }}
            />
          </div>
        </div>
      </Pop>
    </div>
  );
};

export const TranslateScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const langs = ["فارسی", "English", "اردو", "Türkçe", "…"];
  const active = Math.floor(frame / 40) % 4;
  const items = [
    { lang: "فارسی", text: "ستایش مخصوص خداوندی است که پروردگار جهانیان است.", dir: "rtl" },
    { lang: "English", text: "All praise belongs to Allah, Lord of all the worlds.", dir: "ltr" },
    { lang: "Türkçe", text: "Hamd, âlemlerin Rabbi Allah'a mahsustur.", dir: "ltr" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Pop delay={15} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {langs.map((l, i) => (
          <MiniChip key={l} active={i === active}>
            {l}
          </MiniChip>
        ))}
      </Pop>
      <Pop
        delay={25}
        style={{
          ...card,
          background: "#fffdf7",
          fontFamily: QURAN,
          fontSize: 34,
          textAlign: "center",
          padding: "20px 12px",
        }}
      >
        الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ <span style={{ color: "#b08a2e" }}>﴿٢﴾</span>
      </Pop>
      {items.map((it, i) => (
        <Pop key={it.lang} delay={50 + i * 18} style={{ ...card, borderRight: `5px solid ${C.blue}` }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.blue, marginBottom: 6 }}>
            {it.lang}
          </div>
          <div
            style={{
              fontSize: 19,
              lineHeight: 1.7,
              direction: it.dir as "rtl" | "ltr",
              textAlign: it.dir === "rtl" ? "right" : "left",
            }}
          >
            {it.text}
          </div>
        </Pop>
      ))}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Pop delay={15} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["فارسی", "English", "Türkçe", "اردو"].map((l, i) => (
          <MiniChip key={l} active={i === 0}>
            {l}
          </MiniChip>
        ))}
      </Pop>
      <Pop
        delay={22}
        style={{ ...card, background: "#fffdf7", fontFamily: QURAN, fontSize: 30, textAlign: "center" }}
      >
        الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
      </Pop>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {words.map(([ar, mean], i) => {
          const on = i === active;
          return (
            <Pop
              key={ar}
              delay={35 + i * 10}
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
      <Pop delay={90} style={{ ...card, fontSize: 16, color: C.inkMuted, textAlign: "center" }}>
        برای شنیدن قرائت، روی هر کلمه بزنید
      </Pop>
    </div>
  );
};

export const HadithScreen: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <Pop delay={15} style={{ fontSize: 20, fontWeight: 800 }}>
        روایات تفسیری — سوره‌ی حمد، آیه‌ی {fa(2)}
      </Pop>
      {[0, 1, 2].map((i) => (
        <Pop key={i} delay={30 + i * 15} style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="book" size={20} color={C.gold} />
            <span style={{ fontSize: 16, fontWeight: 800 }}>روایت {fa(i + 1)}</span>
          </div>
          <Skeleton width="100%" />
          <Skeleton width="92%" />
          <Skeleton width={i === 1 ? "60%" : "75%"} />
          <div style={{ fontSize: 13, color: C.inkMuted }}>منبع: کتابخانه‌ی دیجیتال نور</div>
        </Pop>
      ))}
      <Pop delay={85} style={{ marginTop: "auto" }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${C.gold}, #c99a3a)`,
            color: "#2a1f05",
            borderRadius: 16,
            padding: "16px 0",
            textAlign: "center",
            fontSize: 18,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: `0 0 0 ${Math.max(0, Math.sin(frame / 8)) * 8}px rgba(226,189,107,0.25)`,
          }}
        >
          <Icon name="library" size={22} color="#2a1f05" />
          مشاهده در کتابخانه‌ی دیجیتال نور
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
  const bookmarkOn = frame > 120;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
      <Pop delay={58} style={{ fontSize: 16, color: C.inkMuted, fontWeight: 700 }}>
        نتایج جستجو در متن قرآن
      </Pop>
      {results.map(([ref, ayah], i) => (
        <Pop key={ref} delay={62 + i * 12} style={{ ...card, position: "relative" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.blue }}>{ref}</div>
          <div style={{ fontFamily: QURAN, fontSize: 25, marginTop: 4 }}>{ayah}</div>
          {i === 0 ? (
            <div style={{ position: "absolute", top: 14, left: 14 }}>
              <Icon
                name="bookmark"
                size={26}
                color={C.gold}
                fill={bookmarkOn ? C.gold : "none"}
              />
            </div>
          ) : null}
        </Pop>
      ))}
      <Pop
        delay={140}
        style={{
          ...card,
          background: "#fff8e3",
          border: `1.5px dashed ${C.gold}`,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <Icon name="note" size={22} color="#b08a2e" />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#8a6a1f" }}>یادداشت من</div>
          <div style={{ fontSize: 17, marginTop: 2 }}>ارتباط صبر و نماز در یاری‌جستن</div>
        </div>
      </Pop>
    </div>
  );
};
