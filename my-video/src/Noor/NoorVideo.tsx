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
  ThematicScene,
} from "./scenes";
import {
  HadithScreen,
  MushafScreen,
  ReciteScreen,
  SearchScreen,
  TafsirScreen,
  TranslateScreen,
  WordsScreen,
} from "./screens";

const features: Feature[] = [
  {
    icon: "book",
    title: "مصحف شریف",
    short: "مصحف شریف",
    subtitle: "متن قرآن کریم با نمایشی زیبا و خوانا",
    bullets: [
      "نمایش صفحه‌به‌صفحه‌ی مصحف",
      "نمایش دوصفحه‌ای در حالت افقی تبلت",
      "دسترسی سریع به سوره، جزء و حزب",
      "نسخه‌ی ویژه‌ی اندروید تی‌وی",
    ],
    screenTitle: "مصحف",
    screen: <MushafScreen />,
  },
  {
    icon: "headphones",
    title: "تلاوت و قاریان",
    short: "تلاوت و قاریان",
    subtitle: "شنیدن تلاوت آیات با صدای قاریان مختلف",
    bullets: [
      "انتخاب از میان قاریان مختلف",
      "تنظیم سرعت پخش",
      "تکرار آیه و سوره به تعداد دلخواه",
      "دانلود صوت تلاوت‌ها و مدیریت دانلودها",
    ],
    screenTitle: "سوره‌نامه",
    screen: <ReciteScreen />,
  },
  {
    icon: "languages",
    title: "ترجمه",
    short: "ترجمه‌ها",
    subtitle: "فهم آیات به زبان‌های گوناگون",
    bullets: [
      `${fa(122)} ترجمه به بیش از ${fa(30)} زبان زنده`,
      "نمایش ترجمه در کنار متن آیات",
      "انتخاب و جابه‌جایی آسان بین ترجمه‌ها",
    ],
    screenTitle: "ترجمه",
    screen: <TranslateScreen />,
    stat: { value: fa(122), label: "ترجمه" },
  },
  {
    icon: "layers",
    title: "تفسیر",
    short: "تفاسیر",
    subtitle: "دسترسی به تفاسیر معتبر شیعه و اهل سنت",
    bullets: [
      "فیلتر تفاسیر بر اساس مفسر، مذهب، زبان و نوع",
      `${fa(11)} تفسیر شیعه و سنی بدون نیاز به اینترنت`,
      "مطالعه‌ی تفسیر هر آیه در کنار متن",
    ],
    screenTitle: "تفسیر",
    screen: <TafsirScreen />,
    stat: { value: fa(11), label: "تفسیر آفلاین" },
  },
  {
    icon: "type",
    title: "واژگان قرآن",
    short: "واژگان",
    subtitle: "آشنایی با معنای تک‌تک کلمات آیات",
    bullets: [
      "ترجمه‌ی کلمه‌به‌کلمه‌ی آیات",
      "قرائت جداگانه‌ی هر کلمه",
      "به فارسی، انگلیسی، ترکی استانبولی و اردو",
    ],
    screenTitle: "واژگان",
    screen: <WordsScreen />,
    stat: { value: fa(4), label: "زبان" },
  },
  {
    icon: "library",
    title: "حدیث و کتابخانه",
    short: "حدیث و کتابخانه",
    subtitle: "روایات تفسیری در کنار آیات",
    bullets: [
      "دسترسی به احادیث تفسیری هر آیه",
      "اتصال به کتابخانه‌ی دیجیتال نور",
      "مطالعه‌ی کامل منابع و کتاب‌ها",
    ],
    screenTitle: "حدیث",
    screen: <HadithScreen />,
  },
  {
    icon: "search",
    title: "جستجو و یادداشت",
    short: "جستجو و یادداشت",
    subtitle: "ابزارهای پژوهش و مطالعه‌ی شخصی",
    bullets: [
      "جستجوی دقیق در متن قرآن",
      "یادداشت‌نویسی روی آیات",
      "نشانه‌گذاری صفحه، جزء و حزب",
    ],
    screenTitle: "جستجو",
    screen: <SearchScreen />,
  },
];

const T = 20;
const scenes: { d: number; el: React.ReactNode }[] = [
  { d: 270, el: <IntroScene /> },
  { d: 190, el: <DeveloperScene /> },
  { d: 220, el: <OverviewScene features={features} /> },
  ...features.map((f, i) => ({ d: 225, el: <FeatureScene feature={f} index={i} /> })),
  { d: 330, el: <ThematicScene /> },
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
