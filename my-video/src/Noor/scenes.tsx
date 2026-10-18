import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
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
  useAt,
  useSpring,
} from "./ui";
import {
  AIChatScreen,
  Box,
  SHOTS,
  SearchScreen,
  ShotScreen,
  RecSteps,
  StepShot,
  StepSwitch,
  TafsirReadScreen,
} from "./screens";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Header: React.FC<{ pill: string; title: React.ReactNode; subtitle?: React.ReactNode }> = ({
  pill,
  title,
  subtitle,
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
    <Reveal delay={0}>
      <Pill>{pill}</Pill>
    </Reveal>
    <Reveal delay={6}>
      <div style={{ fontSize: 68, fontWeight: 900, textAlign: "center" }}>{title}</div>
    </Reveal>
    {subtitle ? (
      <Reveal delay={12}>
        <div style={{ fontSize: 32, color: C.muted, textAlign: "center" }}>{subtitle}</div>
      </Reveal>
    ) : null}
  </div>
);

const CenterScene: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 44 }) => (
  <Scene
    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap }}
  >
    {children}
  </Scene>
);

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
    <CenterScene gap={26}>
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
        <div style={{ fontSize: 44, fontWeight: 500, color: C.muted, marginTop: -10 }}>و قابلیت‌های آن</div>
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
    </CenterScene>
  );
};

export const AgendaScene: React.FC = () => {
  const items: [IconName, string][] = [
    ["sparkles", "چرا نرم‌افزار قرآنی؟"],
    ["info", "سازنده و نگاه کلی به برنامه"],
    ["layers", "قابلیت‌های اصلی برنامه"],
    ["search", "کاربرد در تفسیر موضوعی: «صبر»"],
    ["check", "نقد و ارزیابی"],
    ["star", "جمع‌بندی و پرسش و پاسخ"],
  ];
  return (
    <CenterScene gap={50}>
      <Header pill="فهرست ارائه" title="آنچه خواهیم دید" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 30px" }}>
        {items.map(([icon, label], i) => (
          <Reveal key={label} delay={18 + i * 8} x={40} y={0}>
            <Glass style={{ width: 640, padding: "20px 28px", display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: C.gold, width: 40, textAlign: "center" }}>
                {fa(i + 1)}
              </div>
              <IconBadge name={icon} size={64} />
              <div style={{ fontSize: 34, fontWeight: 700 }}>{label}</div>
            </Glass>
          </Reveal>
        ))}
      </div>
    </CenterScene>
  );
};

export const WhyScene: React.FC = () => {
  const cards: [IconName, string, string][] = [
    ["search", "گردآوری آیات", "تفسیر موضوعی با گردآوری همه‌ی آیات مرتبط با یک موضوع در سراسر قرآن آغاز می‌شود"],
    ["layers", "مراجعه به تفاسیر و روایات", "فهم دقیق آیات به مطالعه و مقایسه‌ی تفاسیر و روایات تفسیری نیاز دارد"],
    ["sparkles", "سرعت و دقت", "نرم‌افزار جستجو و مقایسه را سریع و دقیق می‌کند و منابع را در دسترس همه قرار می‌دهد"],
  ];
  return (
    <CenterScene gap={56}>
      <Header pill="مقدمه" title="چرا نرم‌افزار قرآنی؟" subtitle="تفسیر موضوعی و نیاز به ابزارهای پژوهشی" />
      <div style={{ display: "flex", gap: 34 }}>
        {cards.map(([icon, title, desc], i) => (
          <Reveal key={title} delay={20 + i * 12} y={50}>
            <Glass
              style={{
                width: 480,
                minHeight: 380,
                padding: "40px 34px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 22,
                textAlign: "center",
              }}
            >
              <IconBadge name={icon} size={96} />
              <div style={{ fontSize: 38, fontWeight: 800 }}>{title}</div>
              <div style={{ fontSize: 28, color: C.muted, lineHeight: 1.7 }}>{desc}</div>
            </Glass>
          </Reveal>
        ))}
      </div>
    </CenterScene>
  );
};

export const DeveloperScene: React.FC = () => {
  const at = useAt();
  const products = ["جامع التفاسیر", "جامع الاحادیث", "کتابخانه‌ی دیجیتال نور", "قاموس نور"];
  return (
    <CenterScene gap={30}>
      <Reveal delay={0}>
        <Pill>سازنده‌ی نرم‌افزار</Pill>
      </Reveal>
      <Reveal delay={8}>
        <div style={{ fontSize: 76, fontWeight: 900, textAlign: "center", lineHeight: 1.35 }}>
          مرکز تحقیقات کامپیوتری علوم اسلامی
          <br />
          <span style={{ color: C.gold }}>(نور)</span>
        </div>
      </Reveal>
      <Reveal delay={16}>
        <div style={{ fontSize: 36, color: C.muted, textAlign: "center", maxWidth: 1300, lineHeight: 1.7 }}>
          مرکزی در قم که سال‌هاست نرم‌افزارهای تخصصی علوم اسلامی تولید می‌کند
        </div>
      </Reveal>
      <Divider delay={22} />
      <Reveal delay={at(1)}>
        <div style={{ fontSize: 28, color: C.muted, textAlign: "center" }}>از دیگر محصولات این مرکز:</div>
      </Reveal>
      <div style={{ display: "flex", gap: 22 }}>
        {products.map((p, i) => (
          <Reveal key={p} delay={at(1) + 4 + i * 5} scale>
            <Glass style={{ padding: "18px 36px", fontSize: 32, fontWeight: 700 }}>{p}</Glass>
          </Reveal>
        ))}
      </div>
    </CenterScene>
  );
};

export type Feature = {
  id: string;
  icon: IconName;
  title: string;
  short: string;
  subtitle: string;
  bullets: string[];
  screen: React.ReactNode;
  stat?: { value: string; label: string };
  label?: string;
  // phone pan per step (entry first), see PhoneLayout
  pans?: number[];
};

export const OverviewScene: React.FC<{ features: Feature[] }> = ({ features }) => (
  <CenterScene gap={50}>
    <Header
      pill="نگاه کلی"
      title={
        <>
          قابلیت‌ها <span style={{ color: C.gold }}>در یک نگاه</span>
        </>
      }
      subtitle="یک برنامه برای تلاوت، فهم و پژوهش در قرآن کریم"
    />
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 22, width: 1640 }}>
      {features.map((f, i) => (
        <Reveal key={f.id} delay={16 + i * 6} scale>
          <Glass
            style={{
              width: 254,
              height: 180,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <IconBadge name={f.icon} size={68} />
            <div style={{ fontSize: 26, fontWeight: 800 }}>{f.short}</div>
          </Glass>
        </Reveal>
      ))}
    </div>
  </CenterScene>
);

const Bullet: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => (
  <Reveal delay={delay} x={50} y={0}>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: "rgba(226,189,107,0.15)",
          border: "1.5px solid rgba(226,189,107,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="check" size={26} color={C.gold} stroke={3} />
      </div>
      <div style={{ fontSize: 34, fontWeight: 500, lineHeight: 1.5 }}>{children}</div>
    </div>
  </Reveal>
);

const StatChip: React.FC<{ value: string; label: string; delay: number }> = ({ value, label, delay }) => {
  const p = useSpring(delay, 14);
  return (
    <div style={{ opacity: p, transform: `scale(${0.8 + 0.2 * p})`, transformOrigin: "right center" }}>
      <Glass
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: 16,
          padding: "10px 28px",
          border: `1.5px solid ${C.gold}`,
        }}
      >
        <span style={{ fontSize: 60, fontWeight: 900, color: C.gold, lineHeight: 1.2 }}>{value}</span>
        <span style={{ fontSize: 30, fontWeight: 700 }}>{label}</span>
      </Glass>
    </div>
  );
};

// The phone is drawn taller than the slide so its screen reads well when projected; each step
// pans it so the part being explained is in view (-1 shows the top of the phone, 1 the bottom)
const PHONE_SCALE = 1.4;
const PHONE_SHIFT = (916 * PHONE_SCALE - 1040) / 2;

const usePan = (pans: number[]) => {
  const frame = useCurrentFrame();
  const at = useAt();
  let i = 0;
  pans.forEach((_, k) => {
    if (k > 0 && frame >= at(k)) i = k;
  });
  if (i === 0) return pans[0] ?? 0;
  const t = interpolate(frame, [at(i), at(i) + 18], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  return pans[i - 1] + (pans[i] - pans[i - 1]) * t;
};

// Text column on the right, phone on the left; the phone screen is passed in
const PhoneLayout: React.FC<{ children: React.ReactNode; screen: React.ReactNode; pans?: number[] }> = ({
  children,
  screen,
  pans = [0],
}) => {
  const pan = usePan(pans);
  return (
    <Scene style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "0 110px", gap: 60 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26 }}>{children}</div>
      <div style={{ width: 440 * PHONE_SCALE, display: "flex", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${-pan * PHONE_SHIFT}px) scale(${PHONE_SCALE})` }}>
          <Phone delay={4}>{screen}</Phone>
        </div>
      </div>
    </Scene>
  );
};

export const FeatureScene: React.FC<{ feature: Feature; index: number }> = ({ feature, index }) => {
  const at = useAt();
  return (
    <PhoneLayout screen={feature.screen} pans={feature.pans}>
      <Reveal delay={0} x={60} y={0}>
        <Pill>{feature.label ?? `قابلیت ${fa(String(index + 1).padStart(2, "0"))}`}</Pill>
      </Reveal>
      <Reveal delay={6} x={60} y={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <IconBadge name={feature.icon} size={110} />
          <div style={{ fontSize: feature.title.length > 16 ? 64 : 80, fontWeight: 900, lineHeight: 1.25 }}>
            {feature.title}
          </div>
        </div>
      </Reveal>
      <Reveal delay={12} x={60} y={0}>
        <div style={{ fontSize: 36, color: C.muted, lineHeight: 1.6 }}>{feature.subtitle}</div>
      </Reveal>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 10 }}>
        {feature.bullets.map((b, i) => (
          <Bullet key={b} delay={at(i + 1)}>
            {b}
          </Bullet>
        ))}
      </div>
      {feature.stat ? <StatChip {...feature.stat} delay={16} /> : null}
    </PhoneLayout>
  );
};

export const PlatformsScene: React.FC = () => {
  const at = useAt();
  const devices: { icon: IconName; name: string; en: string }[] = [
    { icon: "smartphone", name: "اندروید", en: "Android" },
    { icon: "tablet", name: "آی‌اواس", en: "iOS" },
    { icon: "tv", name: "تلویزیون هوشمند", en: "Smart TV" },
  ];
  const langs = ["فارسی", "العربية", "English", "Türkçe", "اردو"];
  const popup: Box = { x: 148, y: 612, w: 627, h: 740 };
  return (
    <PhoneLayout
      pans={[0, 0, 0, -1]}
      screen={
        <StepSwitch
          screens={[
            { from: 0, el: <StepShot shot={SHOTS.language} boxes={[null, popup]} /> },
            { from: at(3), el: <RecSteps segs={[null, null, null, { v: "v1", from: 12.5, to: 14.4 }]} /> },
          ]}
        />
      }
    >
      <Reveal delay={0} x={60} y={0}>
        <Pill>در دسترس همه</Pill>
      </Reveal>
      <Reveal delay={6} x={60} y={0}>
        <div style={{ fontSize: 72, fontWeight: 900 }}>
          یک برنامه، <span style={{ color: C.gold }}>سه بستر</span>
        </div>
      </Reveal>
      <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
        {devices.map((d, i) => (
          <Reveal key={d.en} delay={at(1) + i * 6} y={50}>
            <Glass
              style={{ width: 290, padding: "28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
            >
              <IconBadge name={d.icon} size={90} />
              <div style={{ fontSize: 32, fontWeight: 800 }}>{d.name}</div>
              <div style={{ fontSize: 22, color: C.muted, direction: "ltr" }}>{d.en}</div>
            </Glass>
          </Reveal>
        ))}
      </div>
      <Reveal delay={at(2)} x={60} y={0}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Icon name="globe" size={40} color={C.gold} />
          <span style={{ fontSize: 34, fontWeight: 700 }}>رابط کاربری به {fa(5)} زبان</span>
        </div>
      </Reveal>
      <div style={{ display: "flex", gap: 14 }}>
        {langs.map((l, i) => (
          <Reveal key={l} delay={at(2) + 4 + i * 3} scale y={0}>
            <Glass style={{ padding: "8px 24px", fontSize: 28, fontWeight: 700, borderRadius: 999 }}>{l}</Glass>
          </Reveal>
        ))}
      </div>
      <Reveal delay={at(3)} x={60} y={0}>
        <div style={{ fontSize: 30, color: C.muted }}>
          بیش از {fa(420)} هزار نصب و امتیاز ۴٫۸ در فروشگاه اپلیکیشن
        </div>
      </Reveal>
    </PhoneLayout>
  );
};

export const ExampleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const at = useAt();
  const steps: [string, string][] = [
    ["جستجوی هوشمند", "جستجوی متنی یا صوتی «صبر» در سوره، آیه، ترجمه و تفسیر"],
    ["گردآوری آیات", "افزودن آیات منتخب به دسته‌ی «صبر» در علاقه‌مندی‌ها"],
    ["مطالعه‌ی تفاسیر", "مقایسه‌ی تفسیر آیات در تفاسیر مختلف و روایات تفسیری"],
    ["گفتگوی هوشمند", "پرسش از هوش مصنوعی و سنجیدن پاسخ با منابع"],
  ];
  const current = steps.reduce((c, _, i) => (frame >= at(i + 1) ? i : c), -1);
  return (
    <PhoneLayout
      pans={[-1, -1, 0, -1, -1]}
      screen={
        <StepSwitch
          screens={[
            {
              from: 0,
              el: <ShotScreen shot={SHOTS.home} marks={[{ at: 24, box: { x: 28, y: 245, w: 867, h: 98 } }]} />,
            },
            {
              from: at(1),
              el: <SearchScreen typeAt={at(1) + 4} resultsAt={at(1) + 30} favAt={at(2)} />,
            },
            { from: at(3), el: <TafsirReadScreen from={at(3) + 4} /> },
            { from: at(4), el: <AIChatScreen from={at(4) + 4} /> },
          ]}
        />
      }
    >
      <Reveal delay={0} x={60} y={0}>
        <Pill>نمونه‌ی عملی</Pill>
      </Reveal>
      <Reveal delay={6} x={60} y={0}>
        <div style={{ fontSize: 72, fontWeight: 900 }}>
          بررسی موضوع <span style={{ color: C.gold }}>«صبر»</span>
        </div>
      </Reveal>
      <Reveal delay={12} x={60} y={0}>
        <div style={{ fontSize: 34, color: C.muted }}>با «قرآن نور»، قدم به قدم</div>
      </Reveal>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 10 }}>
        {steps.map(([title, desc], i) => {
          const on = i === current;
          return (
            <Reveal key={title} delay={at(i + 1)} x={50} y={0}>
              <Glass
                style={{
                  padding: "18px 26px",
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  border: `1.5px solid ${on ? C.gold : C.glassBorder}`,
                  opacity: on ? 1 : 0.6,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    border: `2.5px solid ${C.gold}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 30,
                    fontWeight: 900,
                    color: C.gold,
                    flexShrink: 0,
                  }}
                >
                  {fa(i + 1)}
                </div>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 800 }}>{title}</div>
                  <div style={{ fontSize: 26, color: C.muted, marginTop: 4 }}>{desc}</div>
                </div>
              </Glass>
            </Reveal>
          );
        })}
      </div>
    </PhoneLayout>
  );
};

export const FindingsScene: React.FC = () => {
  const at = useAt();
  const verses: [string, string, string][] = [
    ["بقره، ۱۵۳", "اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", "صبر و نماز، دو تکیه‌گاه مؤمن؛ خداوند با صابران است"],
    ["آل‌عمران، ۲۰۰", "اصْبِرُوا وَصَابِرُوا وَرَابِطُوا وَاتَّقُوا اللَّهَ لَعَلَّكُمْ تُفْلِحُونَ", "صبر فردی و پایداری جمعی، راه رستگاری"],
    ["نحل، ۱۲۷", "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ", "صبر، به توفیق و یاری خداست"],
    ["زمر، ۱۰", "إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُمْ بِغَيْرِ حِسَابٍ", "پاداش صابران، بی‌حساب است"],
  ];
  return (
    <CenterScene gap={44}>
      <Header
        pill="یافته‌ها"
        title={
          <>
            <span style={{ color: C.gold }}>صبر</span> در آیات قرآن
          </>
        }
        subtitle="نمونه‌ای از نتایج بررسی موضوعی"
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {verses.map(([ref, ayah, point], i) => (
          <Reveal key={ref} delay={at(i + 1)} y={40}>
            <Glass
              style={{
                width: 780,
                minHeight: 230,
                padding: "26px 34px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ alignSelf: "flex-start" }}>
                <Pill>{ref}</Pill>
              </div>
              <div style={{ fontFamily: QURAN, fontSize: 36, color: C.goldSoft, lineHeight: 1.7 }}>{ayah}</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{point}</div>
            </Glass>
          </Reveal>
        ))}
      </div>
    </CenterScene>
  );
};

export const CritiqueScene: React.FC = () => {
  const at = useAt();
  const columns: { title: string; icon: IconName; color: string; items: string[] }[] = [
    {
      title: "نقاط قوت",
      icon: "check",
      color: "#7fd8a4",
      items: [
        `محتوای جامع: ${fa(28)} دوره‌ی قرائت، ${fa(152)} ترجمه، ${fa(416)} تفسیر`,
        "ابزارهای پژوهشی: پنل آیه، فرهنگ موضوعی، هوش مصنوعی",
        `استقبال کاربران: بیش از ${fa(420)} هزار نصب و امتیاز ۴٫۸`,
        "تولید مرکز نور؛ سه بستر و پنج زبان",
      ],
    },
    {
      title: "نیازمند بهبود",
      icon: "info",
      color: "#f2b866",
      items: [
        "هوش مصنوعی و کتابخانه‌ی دیجیتال به اینترنت نیاز دارند",
        "فایل‌های صوتی قرائت، حافظه‌ی زیادی از گوشی می‌گیرند",
        "پاسخ‌های هوش مصنوعی باید با منابع اصلی سنجیده شوند",
        "گزارش برخی کاربران از اشکال پس از به‌روزرسانی‌ها",
      ],
    },
  ];
  return (
    <CenterScene gap={44}>
      <Header pill="نقد و ارزیابی" title="ارزیابی برنامه" />
      <div style={{ display: "flex", gap: 36 }}>
        {columns.map((col, c) => (
          <Reveal key={col.title} delay={at(c + 1)} y={40}>
            <Glass style={{ width: 790, padding: "30px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    background: col.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={col.icon} size={34} color={C.bg1} stroke={3} />
                </div>
                <div style={{ fontSize: 44, fontWeight: 900, color: col.color }}>{col.title}</div>
              </div>
              {col.items.map((item, i) => (
                <Reveal key={item} delay={at(c + 1) + 6 + i * 5} x={30} y={0}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: col.color,
                        marginTop: 18,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ fontSize: 30, lineHeight: 1.6 }}>{item}</div>
                  </div>
                </Reveal>
              ))}
            </Glass>
          </Reveal>
        ))}
      </div>
    </CenterScene>
  );
};

export const QuoteScene: React.FC = () => (
  <CenterScene gap={34}>
    <Reveal delay={0}>
      <Pill>جمع‌بندی</Pill>
    </Reveal>
    <Reveal delay={10}>
      <Glass
        style={{
          maxWidth: 1450,
          padding: "60px 90px",
          position: "relative",
          border: "1.5px solid rgba(226,189,107,0.5)",
        }}
      >
        <div style={{ position: "absolute", top: -50, right: 50, fontSize: 160, color: C.gold, lineHeight: 1 }}>«</div>
        <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.8, textAlign: "center" }}>
          ساختار این نرم‌افزار به گونه‌ای طراحی شده که هم{" "}
          <span style={{ color: C.goldSoft }}>کاربران عمومی</span> بتوانند به‌راحتی از آن استفاده کنند و هم
          امکان تحقیق را برای <span style={{ color: C.goldSoft }}>علاقه‌مندان و پژوهشگران</span> فراهم کرده باشد.
        </div>
      </Glass>
    </Reveal>
    <Reveal delay={26}>
      <div style={{ fontSize: 28, color: C.muted }}>فصلنامه‌ی ره‌آورد نور، شماره‌ی {fa(83)}</div>
    </Reveal>
  </CenterScene>
);

export const OutroScene: React.FC = () => (
  <Scene style={{ display: "flex", flexDirection: "row", alignItems: "center", padding: "0 130px", gap: 70 }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26 }}>
      <Reveal delay={0} x={60} y={0}>
        <Pill gold>پرسش و پاسخ</Pill>
      </Reveal>
      <Reveal delay={8} x={60} y={0}>
        <div style={{ fontSize: 84, fontWeight: 900 }}>
          با سپاس از <span style={{ color: C.gold }}>توجه شما</span>
        </div>
      </Reveal>
      <Reveal delay={18} x={60} y={0}>
        <div style={{ fontSize: 36, lineHeight: 1.9 }}>
          <span style={{ color: C.gold }}>تهیه‌کنندگان: </span>فوژان صفای روح و مریم نظریه
          <br />
          <span style={{ color: C.gold }}>مدرس: </span>استاد محب پور حقیقی
          <br />
          <span style={{ color: C.muted }}>
            درس تفسیر موضوعی قرآن | {fa(27)} مهر {fa(1405)}
          </span>
        </div>
      </Reveal>
      <Reveal delay={34} x={60} y={0}>
        <div style={{ fontSize: 22, color: C.muted, lineHeight: 1.7 }}>
          منابع: فصلنامه‌ی ره‌آورد نور، شماره‌ی {fa(83)}؛ سایت رسمی نرم‌افزارهای نور (noorsoft.org)؛
          <br />
          اسکرین‌شات‌ها از نسخه‌ی فعلی برنامه
        </div>
      </Reveal>
    </div>
    <Reveal delay={24} scale y={0}>
      <Glass style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <AppIcon size={52} />
          <div style={{ fontSize: 30, fontWeight: 800 }}>دریافت «قرآن نور»</div>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {[
            ["qr-myket.svg", "مایکت"],
            ["qr-bazaar.svg", "کافه‌بازار"],
          ].map(([src, store]) => (
            <div key={src} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ background: "white", borderRadius: 22, padding: 16 }}>
                <Img src={staticFile(src)} style={{ width: 270, height: 270, display: "block" }} />
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.goldSoft }}>{store}</div>
            </div>
          ))}
        </div>
      </Glass>
    </Reveal>
  </Scene>
);
