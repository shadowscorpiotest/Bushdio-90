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
import { AIScreen, Box, RecSteps, SHOTS, StepShot } from "./screens";
import deck from "./deck.json";

// Sources: the user's screenshots and screen recordings of the current app (v5.8.3) and
// Rahavard-e Noor no. 83 ("New features of the Quran Noor mobile app").
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
    title: "تلاوت و قاریان",
    short: "تلاوت و قاریان",
    subtitle: "تلاوت آیات با صدای قاریان برجسته",
    bullets: [
      `${fa(28)} دوره‌ی کامل قرائت، با دنبال‌کردن هم‌زمان متن`,
      "انتخاب قاری در قالب‌های ترتیل، تحقیق و تحدیر",
      "دانلود یا حذف قرائت‌ها در «مدیریت دانلودها»",
      "پخش بازه‌ای: آیه، سوره، جزء، حزب یا صفحه",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v2", from: 25, to: 30, rate: 1.25 },
          { v: "v2", from: 34.5, to: 37.2 },
          { v: "v2", from: 63.6, to: 69.4, rate: 1.5 },
          { v: "v2", from: 70.6, to: 72.2 },
          { v: "v2", from: 72.6, to: 75.5 },
        ]}
      />
    ),
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
      `سرعت پخش ۰٫۵ تا ${fa(2)} برابر و تکرار آیه تا ${fa(100)} بار`,
      "پخش دعای آیات سجده‌دار",
    ],
    screen: (
      <StepShot shot={SHOTS.settingsRecite} boxes={[row(497), row(835, 120), row(1000, 400), row(1425, 130)]} />
    ),
    stat: { value: fa(4), label: "حالت پخش" },
  },
  {
    id: "multimedia",
    icon: "speaker",
    title: "چندرسانه و ختم قرآن",
    short: "چندرسانه",
    subtitle: "شنیدن، آموختن و ختم قرآن",
    bullets: [
      "تفسیر گویای استاد قرائتی",
      "تلاوت‌های مجلسی، آموزشی، ترتیل، تحقیق و تحدیر؛ ترجمه‌ی گویا و سخنرانی",
      "ختم قرآن شخصی و گروهی، با برنامه‌ی زمان‌بندی",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v6", from: 43.8, to: 47 },
          { v: "v6", from: 47, to: 50.5 },
          { v: "v6", from: 55.5, to: 61, rate: 1.3 },
          { v: "v5", from: 82.5, to: 91, rate: 1.5 },
        ]}
      />
    ),
  },
  {
    id: "translate",
    icon: "languages",
    title: "ترجمه",
    short: "ترجمه",
    subtitle: "با لمس هر آیه، «پنل آیه» باز می‌شود",
    bullets: [
      "ترجمه‌های منتخب هر آیه، همراه با منبع",
      `${fa(152)} ترجمه؛ قابل دانلود و انتخاب`,
      "نمایش ترجمه‌ی منتخب زیر هر آیه",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v2", from: 77, to: 81 },
          { v: "v2", from: 81, to: 83 },
          { v: "v2", from: 86.5, to: 93.5, rate: 1.6 },
          { v: "v2", from: 29.5, to: 33.5 },
        ]}
      />
    ),
    stat: { value: fa(152), label: "ترجمه" },
  },
  {
    id: "tafsir",
    icon: "layers",
    title: "تفسیر و حدیث",
    short: "تفسیر و حدیث",
    subtitle: "تفاسیر شیعه و اهل سنت در «پنل آیه»",
    bullets: [
      `${fa(416)} تفسیر عربی و فارسی؛ قابل دانلود برای استفاده‌ی آفلاین`,
      "مطالعه‌ی متن کامل تفسیر، مانند تفسیر نمونه",
      "روایات تفسیری از منابعی مانند تفسیر عیاشی، قمی و البرهان",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v2", from: 95, to: 98.8, rate: 1.2 },
          { v: "v2", from: 99.6, to: 106.5, rate: 1.6 },
          { v: "v3", from: 0, to: 7, rate: 1.5 },
          { v: "v3", from: 14.5, to: 22, rate: 1.6 },
        ]}
      />
    ),
    stat: { value: fa(416), label: "تفسیر" },
  },
  {
    id: "words",
    icon: "type",
    title: "واژگان، اعراب و واژه‌نامه",
    short: "واژگان و اعراب",
    subtitle: "تحلیل تک‌تک کلمات آیه",
    bullets: [
      "ترجمه‌ی کلمه‌به‌کلمه، با قرائت هر واژه",
      "توصیف واژگان از منابع لغت، مانند مجمع البحرین",
      "اعراب قرآن: ترکیب نحوی و تحلیل صرفی",
      "«واژه‌نامه»: جستجوی ریشه، مدخل و کلمه‌ی قرآنی، مانند «الرحمن»",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v3", from: 39, to: 41.5 },
          { v: "v3", from: 41.5, to: 46.5, rate: 1.3 },
          { v: "v3", from: 47, to: 55, rate: 1.6 },
          { v: "v3", from: 69.5, to: 80.5, rate: 2 },
          { v: "v6", from: 18.5, to: 30, rate: 1.8 },
        ]}
      />
    ),
  },
  {
    id: "farhang",
    icon: "tag",
    title: "فرهنگ موضوعی",
    short: "فرهنگ موضوعی",
    subtitle: "قرآن، دسته‌بندی‌شده بر اساس موضوع",
    bullets: [
      "دسته‌های اصلی: مفاهیم، اشخاص، مکان‌ها، وقایع و …",
      "زیرموضوع‌ها به ترتیب الفبا، به فارسی و عربی",
      "فهرست همه‌ی آیات هر موضوع، یک‌جا",
      "رفتن به آیه و مطالعه‌ی ترجمه و تفسیر آن",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v5", from: 31.5, to: 34.5 },
          { v: "v5", from: 34.5, to: 36.6 },
          { v: "v5", from: 36.6, to: 48.5, rate: 1.8 },
          { v: "v5", from: 48.5, to: 58.5, rate: 1.8 },
          { v: "v5", from: 58.5, to: 62 },
        ]}
      />
    ),
  },
  {
    id: "alam",
    icon: "library",
    title: "اعلام و اسماء",
    short: "اعلام و اسماء",
    subtitle: "نام‌های قرآنی و آیات مربوط به آن‌ها",
    bullets: [
      "اشخاص، مکان‌ها، جانوران، رنگ‌ها و دیگر نام‌های قرآنی",
      "توضیح هر عَلَم؛ برای نمونه «سبز»",
      "آیات مرتبط و «اعلام مرتبط»، مانند «درخت ممنوعه»",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v4", from: 35.5, to: 39 },
          { v: "v4", from: 39, to: 45, rate: 1.4 },
          { v: "v4", from: 45.5, to: 53, rate: 1.6 },
          { v: "v4", from: 75.5, to: 85, rate: 1.8 },
        ]}
      />
    ),
  },
  {
    id: "ai",
    icon: "sparkles",
    title: "هوش مصنوعی و منابع",
    short: "هوش مصنوعی",
    subtitle: "پژوهش هوشمند در تفاسیر و منابع اسلامی",
    bullets: [
      "«گفتگوی هوشمند با تفاسیر»",
      "«آیات مرتبط» با نوع ارتباط و میزان مشابهت",
      "«با کتاب گفتگو کن»: پرسش از کتاب‌های کتابخانه‌ی دیجیتال نور",
      "دسترسی به برنامه‌های دیگر نور، مانند قاموس نور",
    ],
    screen: <AIScreen />,
  },
  {
    id: "search",
    icon: "search",
    title: "جستجو",
    short: "جستجو",
    subtitle: "جستجوی متنی و صوتی در همه‌ی قرآن",
    bullets: [
      "جستجو با نام سوره، شماره‌ی آیه، صفحه، جزء یا آیات نامدار",
      "نتایج در نام سوره‌ها و متن قرآن",
      "رفتن مستقیم به آیه‌ی دلخواه، مانند «بقره ۱۵»",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v1", from: 49.5, to: 50.5 },
          { v: "v1", from: 50.5, to: 52.6 },
          { v: "v1", from: 52.6, to: 55.6, rate: 1.1 },
          { v: "v1", from: 55.6, to: 59.6 },
        ]}
      />
    ),
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
  (s, i) => s.lens.reduce((a, b) => a + b, 0) + (i < deck.scenes.length - 1 ? deck.fade : 0),
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
          <StepCtx.Provider value={{ lens: s.lens }}>{sceneEls[s.id]}</StepCtx.Provider>
        </TransitionSeries.Sequence>,
      ])}
    </TransitionSeries>
  </AbsoluteFill>
);
