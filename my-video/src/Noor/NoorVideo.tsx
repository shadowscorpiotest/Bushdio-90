import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import "./theme";
import { fa } from "./theme";
import { Background } from "./ui";
import {
  DeveloperScene,
  Feature,
  FeatureScene,
  IntroScene,
  OutroScene,
  OverviewScene,
  PlatformsScene,
  QuoteScene,
  ThematicScene,
} from "./scenes";
import {
  SHOTS,
  SearchScreen,
  ShotScreen,
  SuraNamehScreen,
  TafsirScreen,
  WordsScreen,
} from "./screens";

// Sources: the user's screenshots of the current app, Rahavard-e Noor no. 83
// ("New features of the Quran Noor mobile app") and noorsoft.org (translation count).
// Highlight boxes are in each screenshot's basis units (see SHOTS).
const row = (y: number, h = 112) => ({ x: 30, y, w: 865, h });

const home: Feature = {
  icon: "home",
  label: "نگاه اول",
  title: "صفحه‌ی اصلی",
  short: "صفحه‌ی اصلی",
  subtitle: "همه‌ی بخش‌های برنامه در یک نگاه",
  bullets: [
    "جستجوی متنی و صوتی سوره، آیه، ترجمه و تفسیر",
    "قرآن کریم، تفسیر و ترجمه، اعراب قرآن",
    "فرهنگ موضوعی، اعلام و اسماء، واژه‌نامه",
    "ختم قرآن، نشان‌ها و بخش چندرسانه",
  ],
  screen: (
    <ShotScreen
      shot={SHOTS.home}
      marks={[
        { at: 30, box: { x: 28, y: 245, w: 867, h: 98 } },
        { at: 70, box: { x: 54, y: 540, w: 814, h: 440 } },
        { at: 115, box: { x: 54, y: 1007, w: 814, h: 413 } },
        { at: 160, box: { x: 28, y: 388, w: 240, h: 62 } },
      ]}
    />
  ),
};

const features: Feature[] = [
  {
    icon: "book",
    title: "شیوه‌های نمایش مصحف",
    short: "نمایش مصحف",
    subtitle: "نمایش متن قرآن، متناسب با نیاز هر کاربر",
    bullets: [
      "نمایش متنی، مصحف ۱۵ خطی و مصحف تجویدی",
      "رسم‌الخط عثمان‌طه یا نیریزی",
      "نمایش متن به‌تنهایی یا همراه ترجمه",
      "تنظیم ترازبندی، قلم و اندازه‌ی متن",
    ],
    screen: (
      <ShotScreen
        shot={SHOTS.settingsText}
        marks={[
          { at: 30, box: row(354) },
          { at: 72, box: row(497) },
          { at: 114, box: row(784) },
          { at: 156, box: row(641) },
        ]}
      />
    ),
    stat: { value: fa(3), label: "شیوه‌ی نمایش" },
  },
  {
    icon: "headphones",
    title: "قاریان و قرائت‌ها",
    short: "قاریان",
    subtitle: "تلاوت آیات با صدای قاریان برجسته",
    bullets: [
      `${fa(28)} دوره‌ی کامل قرائت`,
      "در قالب‌های ترتیل، تحقیق و تحدیر",
      "دانلود یک‌جا یا تک‌تک سوره‌ها",
      "امکان حذف قرائت‌های دانلودشده",
    ],
    screen: (
      <ShotScreen
        shot={SHOTS.readingSheet}
        marks={[
          { at: 34, box: row(1310, 120) },
          { at: 100, box: row(1042) },
          { at: 150, box: row(1167) },
        ]}
      />
    ),
    stat: { value: fa(28), label: "دوره‌ی قرائت" },
  },
  {
    icon: "repeat",
    title: "تنظیمات قرائت و حفظ",
    short: "قرائت و حفظ",
    subtitle: "امکانات ویژه برای حافظان و تمرکز بر آیات",
    bullets: [
      "۴ حالت پخش: متن، ترجمه یا هر دو به‌ترتیب دلخواه",
      `ترجمه‌ی گویای فارسی (${fa(2)} دوره‌ی کامل)`,
      `سرعت پخش ${fa("0.5")} تا ${fa(2)} برابر و تکرار آیه تا ${fa(100)} بار`,
      "پخش دعای آیات سجده‌دار",
    ],
    screen: (
      <ShotScreen
        shot={SHOTS.settingsRecite}
        marks={[
          { at: 30, box: row(497) },
          { at: 70, box: row(835, 120) },
          { at: 110, box: row(1000, 256) },
          { at: 150, box: row(1287) },
          { at: 185, box: row(1425, 130) },
        ]}
      />
    ),
    stat: { value: fa(4), label: "حالت پخش" },
  },
  {
    icon: "languages",
    title: "ترجمه",
    short: "ترجمه‌ها",
    subtitle: "ترجمه‌ی دلخواه، ذیل هر آیه",
    bullets: [
      `${fa(122)} ترجمه به بیش از ${fa(30)} زبان زنده`,
      "نمایش ترجمه‌ی منتخب زیر هر آیه",
      "پخش تلاوت همراه با متن و ترجمه",
    ],
    screen: (
      <ShotScreen
        shot={SHOTS.readingNahl}
        marks={[
          { at: 34, box: { x: 18, y: 450, w: 555, h: 175 } },
          { at: 90, box: { x: 18, y: 770, w: 555, h: 115 } },
          { at: 145, box: { x: 0, y: 1075, w: 591, h: 165 } },
        ]}
      />
    ),
    stat: { value: fa(122), label: "ترجمه" },
  },
  {
    icon: "layers",
    title: "تفسیر",
    short: "تفاسیر",
    subtitle: "تفاسیر معتبر شیعه و اهل سنت",
    bullets: [
      `${fa(11)} تفسیر شیعه و سنی، بدون نیاز به اینترنت`,
      "فیلتر بر اساس مفسر، مذهب، زبان و نوع تفسیر",
      "انتخاب «تفاسیر منتخب» در تنظیمات",
    ],
    screen: <TafsirScreen />,
    stat: { value: fa(11), label: "تفسیر آفلاین" },
  },
  {
    icon: "type",
    title: "واژگان و واژه‌نامه",
    short: "واژه‌نامه",
    subtitle: "معنای تک‌تک کلمات آیات",
    bullets: [
      "ترجمه‌ی دقیق‌تر کلمه‌به‌کلمه",
      "بخش «واژه‌نامه» در صفحه‌ی اصلی",
      "اتصال به لغت‌نامه‌ی «قاموس نور»",
    ],
    screen: <WordsScreen />,
  },
  {
    icon: "info",
    title: "فهرست سوره‌ها و سوره‌نامه",
    short: "سوره‌نامه",
    subtitle: "شناسنامه‌ی کامل هر سوره",
    bullets: [
      "فهرست سوره‌ها، جزءها و علاقه‌مندی‌ها",
      "نماد سوره‌های مکی و مدنی",
      "مفهوم، نام‌ها، محل و ترتیب نزول هر سوره",
      "اهداف، محتوا، فضائل و ارتباط با سوره‌ی قبل",
    ],
    screen: <SuraNamehScreen />,
  },
  {
    icon: "sparkles",
    title: "هوش مصنوعی و منابع",
    short: "هوش مصنوعی",
    subtitle: "پژوهش هوشمند در تفاسیر و منابع اسلامی",
    bullets: [
      "«گفتگوی هوشمند با تفاسیر»",
      "کشف آیات و احادیث مرتبط با هوش مصنوعی",
      "«با کتاب گفتگو کن» و کتابخانه‌ی دیجیتال نور",
      "دسترسی به برنامه‌های دیگر نور، مانند قاموس نور",
    ],
    screen: (
      <ShotScreen
        shot={SHOTS.homeScroll}
        marks={[
          { at: 30, box: { x: 54, y: 512, w: 814, h: 183 } },
          { at: 105, box: { x: 54, y: 777, w: 814, h: 150 } },
          { at: 160, box: { x: 0, y: 1470, w: 923, h: 340 } },
        ]}
      />
    ),
  },
  {
    icon: "search",
    title: "جستجو و علاقه‌مندی‌ها",
    short: "جستجو",
    subtitle: "ابزارهای پژوهش و مطالعه‌ی شخصی",
    bullets: [
      "جستجوی متنی و صوتی (با میکروفون)",
      "جستجوی هوشمند در سوره، آیه، ترجمه و تفسیر",
      "دسته‌بندی آیات در «علاقه‌مندی‌ها» و نشان‌ها",
    ],
    screen: <SearchScreen />,
  },
];

const T = 20;
const scenes: { d: number; el: React.ReactNode }[] = [
  { d: 270, el: <IntroScene /> },
  { d: 190, el: <DeveloperScene /> },
  { d: 240, el: <FeatureScene feature={home} index={0} /> },
  { d: 250, el: <OverviewScene features={features} /> },
  ...features.map((f, i) => ({ d: 230, el: <FeatureScene feature={f} index={i} /> })),
  { d: 230, el: <PlatformsScene /> },
  { d: 330, el: <ThematicScene /> },
  { d: 210, el: <QuoteScene /> },
  { d: 240, el: <OutroScene /> },
];

export const NOOR_DURATION = scenes.reduce((s, x) => s + x.d, 0) - T * (scenes.length - 1);

export const NoorVideo: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <TransitionSeries>
      {scenes.flatMap((s, i) => [
        ...(i > 0
          ? [
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: T })}
              />,
            ]
          : []),
        <TransitionSeries.Sequence key={`s${i}`} durationInFrames={s.d}>
          {s.el}
        </TransitionSeries.Sequence>,
      ])}
    </TransitionSeries>
  </AbsoluteFill>
);
