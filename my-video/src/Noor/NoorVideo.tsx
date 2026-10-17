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
  HadithScreen,
  HomeScreen,
  MemorizeScreen,
  MushafScreen,
  PlaybackScreen,
  ReciterScreen,
  SearchScreen,
  SuraInfoScreen,
  TafsirScreen,
  TranslateScreen,
  WordsScreen,
} from "./screens";

// Facts from Rahavard-e Noor no. 83 ("New features of the Quran Noor mobile app")
// and noorsoft.org (translation count)
const home: Feature = {
  icon: "home",
  label: "نگاه اول",
  title: "صفحه‌ی اصلی",
  short: "صفحه‌ی اصلی",
  subtitle: "همه‌ی بخش‌های برنامه در یک نگاه",
  bullets: [
    "جستجوی سوره، آیه، ترجمه و تفسیر",
    "قرآن کریم، تفسیر و ترجمه، اعراب قرآن",
    "فرهنگ موضوعی، اعلام و اسماء",
    "نشانک‌ها و ختم قرآن",
  ],
  screenTitle: "صفحه‌ی اصلی",
  screen: <HomeScreen />,
};

const features: Feature[] = [
  {
    icon: "book",
    title: "شیوه‌های نمایش مصحف",
    short: "نمایش مصحف",
    subtitle: "سه حالت نمایش، متناسب با نیاز هر کاربر",
    bullets: [
      "نمایش املایی با رسم‌الخط عثمان‌طه یا نیریزی",
      `مصحف ${fa(15)} خطی استاندارد، ویژه‌ی حافظان`,
      "مصحف تجویدی با رنگ‌بندی قواعد تجوید",
      "تنظیم اندازه‌ی قلم، فاصله‌ی خطوط و رنگ متن",
    ],
    screenTitle: "مصحف",
    screen: <MushafScreen />,
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
    screenTitle: "قاری منتخب",
    screen: <ReciterScreen />,
    stat: { value: fa(28), label: "دوره‌ی قرائت" },
  },
  {
    icon: "speaker",
    title: "حالت‌های پخش و ترجمه‌ی گویا",
    short: "ترجمه‌ی گویا",
    subtitle: "شنیدن ترجمه‌ی فارسی در کنار تلاوت",
    bullets: [
      "پخش متن، متن و ترجمه، ترجمه، یا ترجمه و متن",
      `${fa(2)} دوره‌ی کامل ترجمه‌ی گویای فارسی`,
      "نمایش تصویر گوینده در کنار قاری",
    ],
    screenTitle: "حالت پخش",
    screen: <PlaybackScreen />,
    stat: { value: fa(4), label: "حالت پخش" },
  },
  {
    icon: "repeat",
    title: "ابزارهای حفظ قرآن",
    short: "حفظ و تمرکز",
    subtitle: "امکانات ویژه برای حافظان و تمرکز بر آیات",
    bullets: [
      `سرعت پخش از ${fa("0.5")} تا ${fa(2)} برابر`,
      `تکرار هر آیه از ${fa(1)} تا ${fa(100)} بار`,
      `تکرار هر سوره از ${fa(1)} تا ${fa(100)} بار`,
      "حرکت خودکار متن هنگام تلاوت",
    ],
    screenTitle: "تنظیمات قرائت",
    screen: <MemorizeScreen />,
  },
  {
    icon: "languages",
    title: "ترجمه",
    short: "ترجمه‌ها",
    subtitle: "ترجمه‌ی دلخواه، ذیل هر آیه",
    bullets: [
      `${fa(122)} ترجمه به بیش از ${fa(30)} زبان زنده`,
      "نمایش ترجمه‌ی منتخب زیر هر آیه",
      "ترجمه‌های فارسی، انگلیسی، ترکی و …",
    ],
    screenTitle: "ترجمه",
    screen: <TranslateScreen />,
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
      "انتخاب تفاسیر منتخب در تنظیمات",
    ],
    screenTitle: "تفسیر",
    screen: <TafsirScreen />,
    stat: { value: fa(11), label: "تفسیر آفلاین" },
  },
  {
    icon: "type",
    title: "واژگان و قاموس",
    short: "واژگان",
    subtitle: "معنای تک‌تک کلمات آیات",
    bullets: [
      "ترجمه‌ی دقیق‌تر کلمه‌به‌کلمه",
      "قرائت جداگانه‌ی هر کلمه",
      "اتصال به لغت‌نامه‌ی «قاموس نور»",
    ],
    screenTitle: "واژگان",
    screen: <WordsScreen />,
  },
  {
    icon: "info",
    title: "سوره‌نامه",
    short: "سوره‌نامه",
    subtitle: "شناسنامه‌ی کامل هر سوره",
    bullets: [
      "مفهوم کلی، نام‌ها و علت نام‌گذاری",
      "تعداد آیات، محل و ترتیب نزول",
      "اهداف، محتوا، فضائل و ارتباط با سوره‌ی قبل",
    ],
    screenTitle: "سوره‌نامه",
    screen: <SuraInfoScreen />,
  },
  {
    icon: "sparkles",
    title: "حدیث و هوش مصنوعی",
    short: "حدیث و هوش مصنوعی",
    subtitle: "روایات تفسیری و آیات مرتبط",
    bullets: [
      "دسترسی به احادیث تفسیری آیات",
      "کشف آیات و احادیث مرتبط با هوش مصنوعی",
      "اتصال به کتابخانه‌ی دیجیتال نور (noorlib.ir)",
    ],
    screenTitle: "حدیث",
    screen: <HadithScreen />,
  },
  {
    icon: "search",
    title: "جستجو و علاقه‌مندی‌ها",
    short: "جستجو",
    subtitle: "ابزارهای پژوهش و مطالعه‌ی شخصی",
    bullets: [
      "جستجوی هوشمند و سریع در کل محتوا",
      "دسته‌بندی آیات در «علاقه‌مندی‌ها»",
      "نشانک‌ها و یادداشت‌نویسی روی آیات",
    ],
    screenTitle: "جستجو",
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
