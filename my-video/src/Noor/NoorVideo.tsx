import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import "./theme";
import { fa } from "./theme";
import { Background, StepCtx } from "./ui";
import {
  AgendaScene,
  CritiqueScene,
  DeveloperScene,
  ExampleScene,
  Feature,
  FeatureScene,
  FindingsScene,
  IntroScene,
  MethodScene,
  OutroScene,
  OverviewScene,
  PlatformsScene,
  QuoteScene,
  WhyScene,
} from "./scenes";
import {
  Box,
  SHOTS,
  SearchStepScreen,
  StepShot,
  SuraNamehScreen,
  TafsirScreen,
  WordsScreen,
} from "./screens";
import deck from "./deck.json";

// Sources: the user's screenshots of the current app, Rahavard-e Noor no. 83
// ("New features of the Quran Noor mobile app") and noorsoft.org (translation count).
// Spotlight boxes are in each screenshot's basis units (see SHOTS); one per bullet, null keeps the last.
const row = (y: number, h = 112): Box => ({ x: 30, y, w: 865, h });

const home: Feature = {
  id: "home",
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
    <StepShot
      shot={SHOTS.home}
      boxes={[
        { x: 28, y: 245, w: 867, h: 98 },
        { x: 54, y: 540, w: 814, h: 440 },
        { x: 54, y: 1007, w: 814, h: 413 },
        { x: 28, y: 388, w: 240, h: 62 },
      ]}
    />
  ),
};

const features: Feature[] = [
  {
    id: "mushaf",
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
    screen: <StepShot shot={SHOTS.settingsText} boxes={[row(354), row(497), row(784), row(641)]} />,
    stat: { value: fa(3), label: "شیوه‌ی نمایش" },
  },
  {
    id: "reciters",
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
    screen: <StepShot shot={SHOTS.readingSheet} boxes={[row(1310, 120), null, row(1042), null]} />,
    stat: { value: fa(28), label: "دوره‌ی قرائت" },
  },
  {
    id: "recite",
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
      <StepShot shot={SHOTS.settingsRecite} boxes={[row(497), row(835, 120), row(1000, 400), row(1425, 130)]} />
    ),
    stat: { value: fa(4), label: "حالت پخش" },
  },
  {
    id: "translate",
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
      <StepShot
        shot={SHOTS.readingNahl}
        boxes={[
          { x: 18, y: 545, w: 555, h: 80 },
          { x: 18, y: 665, w: 555, h: 225 },
          { x: 0, y: 1075, w: 591, h: 165 },
        ]}
      />
    ),
    stat: { value: fa(122), label: "ترجمه" },
  },
  {
    id: "tafsir",
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
    id: "words",
    icon: "type",
    title: "واژگان و واژه‌نامه",
    short: "واژه‌نامه",
    subtitle: "معنای تک‌تک کلمات آیات",
    bullets: ["ترجمه‌ی دقیق‌تر کلمه‌به‌کلمه", "بخش «واژه‌نامه» در صفحه‌ی اصلی", "اتصال به لغت‌نامه‌ی «قاموس نور»"],
    screen: <WordsScreen />,
  },
  {
    id: "suranameh",
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
    id: "ai",
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
      <StepShot
        shot={SHOTS.homeScroll}
        boxes={[
          { x: 54, y: 512, w: 814, h: 183 },
          null,
          { x: 54, y: 777, w: 814, h: 150 },
          { x: 0, y: 1470, w: 923, h: 340 },
        ]}
      />
    ),
  },
  {
    id: "search",
    icon: "search",
    title: "جستجو و علاقه‌مندی‌ها",
    short: "جستجو",
    subtitle: "ابزارهای پژوهش و مطالعه‌ی شخصی",
    bullets: [
      "جستجوی متنی و صوتی (با میکروفون)",
      "جستجوی هوشمند در سوره، آیه، ترجمه و تفسیر",
      "دسته‌بندی آیات در «علاقه‌مندی‌ها» و نشان‌ها",
    ],
    screen: <SearchStepScreen />,
  },
];

const sceneEls: Record<string, React.ReactNode> = {
  intro: <IntroScene />,
  agenda: <AgendaScene />,
  why: <WhyScene />,
  developer: <DeveloperScene />,
  home: <FeatureScene feature={home} index={0} />,
  overview: <OverviewScene features={features} />,
  ...Object.fromEntries(features.map((f, i) => [f.id, <FeatureScene key={f.id} feature={f} index={i} />])),
  platforms: <PlatformsScene />,
  method: <MethodScene />,
  example: <ExampleScene />,
  findings: <FindingsScene />,
  critique: <CritiqueScene />,
  quote: <QuoteScene />,
  outro: <OutroScene />,
};

// Every scene but the last carries the crossfade into the next one after its final step
const durations = deck.scenes.map(
  (s, i) => s.entry + s.steps * s.step + (i < deck.scenes.length - 1 ? deck.fade : 0),
);
export const DECK_DURATION = durations.reduce((a, b) => a + b, 0) - deck.fade * (deck.scenes.length - 1);

export const NoorDeck: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <TransitionSeries>
      {deck.scenes.flatMap((s, i) => [
        ...(i > 0
          ? [
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: deck.fade })}
              />,
            ]
          : []),
        <TransitionSeries.Sequence key={s.id} durationInFrames={durations[i]}>
          <StepCtx.Provider value={{ entry: s.entry, step: s.step }}>{sceneEls[s.id]}</StepCtx.Provider>
        </TransitionSeries.Sequence>,
      ])}
    </TransitionSeries>
  </AbsoluteFill>
);
