import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, QURAN, fa } from "./theme";
import {
  AppIcon,
  Divider,
  Glass,
  Icon,
  IconBadge,
  IconName,
  Phone,
  Pill,
  Reveal,
  Scene,
  useSpring,
} from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const RotatingRing: React.FC<{ size: number }> = ({ size }) => {
  const frame = useCurrentFrame();
  return (
    <svg
      width={size}
      height={size}
      style={{ position: "absolute", transform: `rotate(${frame * 0.4}deg)` }}
      viewBox="0 0 100 100"
    >
      <circle cx="50" cy="50" r="48" fill="none" stroke={C.gold} strokeWidth="0.6" strokeDasharray="2 3" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(226,189,107,0.35)" strokeWidth="0.4" />
    </svg>
  );
};

export const IntroScene: React.FC = () => {
  const iconP = useSpring(22, 14);
  const info = [
    ["درس", "تفسیر موضوعی قرآن"],
    ["مدرس", "استاد محب پور حقیقی"],
    ["تهیه‌کنندگان", "فوژان صفای روح و مریم نظریه"],
    ["تاریخ", `${fa(27)} مهر ${fa(1405)}`],
  ];
  return (
    <Scene style={{ alignItems: "center", justifyContent: "center", gap: 26, display: "flex", flexDirection: "column" }}>
      <Reveal delay={4} y={-20}>
        <div style={{ fontFamily: QURAN, fontSize: 52, color: C.goldSoft }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      </Reveal>
      <div
        style={{
          position: "relative",
          width: 260,
          height: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${iconP})`,
          opacity: iconP,
        }}
      >
        <RotatingRing size={260} />
        <div style={{ boxShadow: "0 0 80px rgba(47,107,255,0.6)", borderRadius: 48 }}>
          <AppIcon size={196} />
        </div>
      </div>
      <Reveal delay={42}>
        <div style={{ fontSize: 88, fontWeight: 900, textAlign: "center", lineHeight: 1.2 }}>
          معرفی اپلیکیشن <span style={{ color: C.gold }}>«قرآن نور»</span>
        </div>
      </Reveal>
      <Reveal delay={56}>
        <div style={{ fontSize: 44, fontWeight: 500, color: C.muted, marginTop: -10 }}>
          و قابلیت‌های آن
        </div>
      </Reveal>
      <Divider delay={70} width={520} />
      <div style={{ display: "flex", gap: 22, marginTop: 6 }}>
        {info.map(([k, v], i) => (
          <Reveal key={k} delay={86 + i * 10} y={40}>
            <Glass style={{ padding: "20px 34px", textAlign: "center", minWidth: 250 }}>
              <div style={{ fontSize: 22, color: C.gold, fontWeight: 700 }}>{k}</div>
              <div style={{ fontSize: 30, fontWeight: 700, marginTop: 6 }}>{v}</div>
            </Glass>
          </Reveal>
        ))}
      </div>
    </Scene>
  );
};

export const DeveloperScene: React.FC = () => {
  const products = ["جامع التفاسیر", "جامع الاحادیث", "کتابخانه‌ی دیجیتال نور"];
  return (
    <Scene style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 30 }}>
      <Reveal delay={0}>
        <Pill>سازنده‌ی نرم‌افزار</Pill>
      </Reveal>
      <Reveal delay={10}>
        <div style={{ fontSize: 76, fontWeight: 900, textAlign: "center", lineHeight: 1.35 }}>
          مرکز تحقیقات کامپیوتری علوم اسلامی
          <br />
          <span style={{ color: C.gold }}>(نور)</span>
        </div>
      </Reveal>
      <Reveal delay={24}>
        <div style={{ fontSize: 36, color: C.muted, textAlign: "center", maxWidth: 1300, lineHeight: 1.7 }}>
          مرکزی در قم که سال‌هاست نرم‌افزارهای تخصصی علوم اسلامی تولید می‌کند
        </div>
      </Reveal>
      <Divider delay={34} />
      <Reveal delay={40}>
        <div style={{ fontSize: 28, color: C.muted, textAlign: "center" }}>از دیگر محصولات این مرکز:</div>
      </Reveal>
      <div style={{ display: "flex", gap: 22 }}>
        {products.map((p, i) => (
          <Reveal key={p} delay={50 + i * 10} scale>
            <Glass style={{ padding: "18px 36px", fontSize: 32, fontWeight: 700 }}>{p}</Glass>
          </Reveal>
        ))}
      </div>
    </Scene>
  );
};

export type Feature = {
  icon: IconName;
  title: string;
  short: string;
  subtitle: string;
  bullets: string[];
  screenTitle: string;
  screen: React.ReactNode;
  stat?: { value: string; label: string };
};

export const OverviewScene: React.FC<{ features: Feature[] }> = ({ features }) => {
  return (
    <Scene style={{ alignItems: "center", justifyContent: "center", display: "flex", flexDirection: "column", gap: 50 }}>
      <Reveal delay={0}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 72, fontWeight: 900 }}>
            قابلیت‌ها <span style={{ color: C.gold }}>در یک نگاه</span>
          </div>
          <div style={{ fontSize: 32, color: C.muted, marginTop: 10 }}>
            یک برنامه برای تلاوت، فهم و پژوهش در قرآن کریم
          </div>
        </div>
      </Reveal>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 26, width: 1600 }}>
        {features.map((f, i) => (
          <Reveal key={f.title} delay={18 + i * 8} scale>
            <Glass
              style={{
                width: 360,
                height: 200,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              <IconBadge name={f.icon} size={74} />
              <div style={{ fontSize: 30, fontWeight: 800 }}>{f.short}</div>
            </Glass>
          </Reveal>
        ))}
      </div>
    </Scene>
  );
};

export const FeatureScene: React.FC<{ feature: Feature; index: number }> = ({ feature, index }) => {
  const frame = useCurrentFrame();
  const statP = useSpring(70, 12);
  return (
    <Scene style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "0 150px", gap: 80 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26 }}>
        <Reveal delay={0} x={60} y={0}>
          <Pill>قابلیت {fa(String(index + 1).padStart(2, "0"))}</Pill>
        </Reveal>
        <Reveal delay={8} x={60} y={0}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <IconBadge name={feature.icon} size={110} />
            <div style={{ fontSize: 82, fontWeight: 900, lineHeight: 1.2 }}>{feature.title}</div>
          </div>
        </Reveal>
        <Reveal delay={16} x={60} y={0}>
          <div style={{ fontSize: 36, color: C.muted, lineHeight: 1.6 }}>{feature.subtitle}</div>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 10 }}>
          {feature.bullets.map((b, i) => (
            <Reveal key={b} delay={30 + i * 14} x={50} y={0}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: "rgba(226,189,107,0.15)",
                    border: `1.5px solid rgba(226,189,107,0.5)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="check" size={26} color={C.gold} stroke={3} />
                </div>
                <div style={{ fontSize: 36, fontWeight: 500, lineHeight: 1.5 }}>{b}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <div style={{ position: "relative", width: 560, display: "flex", justifyContent: "center" }}>
        <Phone title={feature.screenTitle} delay={6}>
          {feature.screen}
        </Phone>
        {feature.stat ? (
          <div
            style={{
              position: "absolute",
              bottom: 150,
              right: -70,
              transform: `scale(${statP}) translateY(${Math.sin(frame / 25) * 6}px)`,
              opacity: statP,
            }}
          >
            <Glass
              style={{
                padding: "18px 30px",
                background: "rgba(10,25,80,0.85)",
                border: `1.5px solid ${C.gold}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, fontWeight: 900, color: C.gold, lineHeight: 1.1 }}>
                {feature.stat.value}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{feature.stat.label}</div>
            </Glass>
          </div>
        ) : null}
      </div>
    </Scene>
  );
};

export const ThematicScene: React.FC = () => {
  const frame = useCurrentFrame();
  const steps: { icon: IconName; title: string; desc: string }[] = [
    { icon: "search", title: "جستجوی موضوع", desc: "یافتن آیاتی که واژه‌ی «صبر» در آن‌ها آمده است" },
    { icon: "bookmark", title: "گردآوری آیات", desc: "نشانه‌گذاری و یادداشت‌نویسی روی آیات منتخب" },
    { icon: "layers", title: "مطالعه‌ی تفاسیر", desc: "مقایسه‌ی دیدگاه مفسران شیعه و سنی" },
    { icon: "library", title: "بررسی روایات", desc: "مراجعه به احادیث تفسیری و منابع کتابخانه‌ی نور" },
  ];
  const line = interpolate(frame, [40, 150], [0, 1], clamp);
  return (
    <Scene style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44 }}>
      <Reveal delay={0}>
        <Pill>ویژه‌ی درس تفسیر موضوعی</Pill>
      </Reveal>
      <Reveal delay={8}>
        <div style={{ fontSize: 70, fontWeight: 900, textAlign: "center" }}>
          کاربرد <span style={{ color: C.gold }}>«قرآن نور»</span> در تفسیر موضوعی
        </div>
      </Reveal>
      <Reveal delay={18}>
        <div style={{ fontSize: 34, color: C.muted }}>
          نمونه: بررسی موضوع <span style={{ color: C.goldSoft, fontWeight: 800 }}>«صبر»</span> در قرآن کریم
        </div>
      </Reveal>
      <div style={{ position: "relative", display: "flex", gap: 40, marginTop: 20 }}>
        <div
          style={{
            position: "absolute",
            top: 46,
            right: 170,
            width: `calc((100% - 340px) * ${line})`,
            height: 3,
            background: `linear-gradient(to left, ${C.gold}, ${C.blue})`,
          }}
        />
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={40 + i * 28} y={50}>
            <div style={{ width: 340, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  background: C.bg1,
                  border: `3px solid ${C.gold}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  fontWeight: 900,
                  color: C.gold,
                  position: "relative",
                }}
              >
                {fa(i + 1)}
              </div>
              <Glass style={{ padding: "28px 24px", textAlign: "center", width: "100%", minHeight: 250 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                  <IconBadge name={s.icon} size={72} />
                </div>
                <div style={{ fontSize: 34, fontWeight: 800 }}>{s.title}</div>
                <div style={{ fontSize: 25, color: C.muted, marginTop: 10, lineHeight: 1.6 }}>{s.desc}</div>
              </Glass>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={170}>
        <Glass style={{ padding: "18px 40px", border: `1.5px solid ${C.gold}`, fontSize: 32, fontWeight: 700 }}>
          نتیجه: دستیابی سریع و دقیق به دیدگاه جامع قرآن درباره‌ی یک موضوع
        </Glass>
      </Reveal>
    </Scene>
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], clamp);
  return (
    <Scene
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        opacity: fadeOut,
      }}
    >
      <Reveal delay={0} scale>
        <div style={{ boxShadow: "0 0 70px rgba(47,107,255,0.55)", borderRadius: 40 }}>
          <AppIcon size={160} />
        </div>
      </Reveal>
      <Reveal delay={12}>
        <div style={{ fontSize: 96, fontWeight: 900 }}>
          با سپاس از <span style={{ color: C.gold }}>توجه شما</span>
        </div>
      </Reveal>
      <Divider delay={24} width={520} />
      <Reveal delay={32}>
        <div style={{ fontSize: 38, textAlign: "center", lineHeight: 1.9 }}>
          <span style={{ color: C.gold }}>تهیه‌کنندگان: </span>فوژان صفای روح و مریم نظریه
          <br />
          <span style={{ color: C.gold }}>مدرس: </span>استاد محب پور حقیقی
          <br />
          <span style={{ color: C.muted }}>
            درس تفسیر موضوعی قرآن | {fa(27)} مهر {fa(1405)}
          </span>
        </div>
      </Reveal>
      <Reveal delay={50}>
        <div style={{ fontSize: 22, color: C.muted, marginTop: 20 }}>
          منبع اطلاعات: سایت رسمی نرم‌افزارهای نور (noorsoft.org)
        </div>
      </Reveal>
    </Scene>
  );
};
