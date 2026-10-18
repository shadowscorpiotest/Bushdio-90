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
  OutroScene,
  OverviewScene,
  PlatformsScene,
  QuoteScene,
  WhyScene,
} from "./scenes";
import { AIScreen, Box, ReadingToolsScreen, RecSteps, SHOTS, StepShot } from "./screens";
import deck from "./deck.json";

// Sources: the user's screenshots and screen recordings of the current app (v5.8.3) and
// Rahavard-e Noor no. 83 ("New features of the Quran Noor mobile app").
// Spotlight boxes are in each screenshot's basis units (see SHOTS); one per bullet, null keeps the last.
// «سبز» in the colour list of «اعلام و اسماء» (recording pixels)
const SABZ: Box = { x: 16, y: 381, w: 448, h: 50 };
// Rows of the settings tabs and player controls in the recordings (recording pixels)
const wide = (y: number, h: number): Box => ({ x: 14, y, w: 452, h });
const PLAYER_SETTINGS: Box = { x: 424, y: 940, w: 52, h: 54 };
const PLAYER_RECITER: Box = { x: 10, y: 936, w: 78, h: 62 };
// Home screen: the settings gear (top right) and the «فرهنگ موضوعی» tile
const HOME_SETTINGS: Box = { x: 428, y: 56, w: 48, h: 48 };
const HOME_FARHANG: Box = { x: 244, y: 518, w: 212, h: 112 };
// Ranged-play dialog and the player settings sheet
const dlg = (y: number, h: number): Box => ({ x: 58, y, w: 364, h });

const home: Feature = {
  id: "home",
  pans: [-1, -1, -0.5, 0, -1],
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
    id: "search",
    pans: [-1, -1, -1, 0],
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
          { v: "v1", from: 52.6, to: 55.6 },
          { v: "v1", from: 55.6, to: 59.6 },
        ]}
      />
    ),
  },
  {
    id: "pagetools",
    pans: [-1, -1, -1, -1, -1, -1],
    icon: "more",
    title: "ابزارهای صفحه‌ی قرآن",
    short: "ابزارهای صفحه",
    subtitle: "دکمه‌های بالای صفحه‌ی نمایش آیات",
    bullets: [
      "دکمه‌ی سه‌نقطه: منوی گزینه‌های بیشتر",
      "«سوره‌نامه»: مفهوم سوره، نام‌های آن، علت نام‌گذاری و تعداد آیات",
      "«برو به»: فهرستی برای دسترسی سریع به بخش دلخواه قرآن",
      "«نحوه نمایش»: متنی، مصحف ۱۵ خطی یا تجویدی",
      "تنظیمات برنامه، و حرکت خودکار صفحه با سرعت دلخواه",
    ],
    screen: <ReadingToolsScreen />,
  },
  {
    id: "mushaf",
    pans: [-1, -1, -1, 0, 0, 0],
    icon: "book",
    title: "شیوه‌های نمایش مصحف",
    short: "نمایش مصحف",
    subtitle: "زبانه‌ی «متن» در تنظیمات برنامه",
    bullets: [
      "متنی، مصحف ۱۵ خطی یا تجویدی؛ رسم‌الخط عثمان‌طه یا نیریزی",
      "ترازبندی، و نمایش متن به‌تنهایی یا همراه ترجمه",
      "حرکت خودکار صفحه، اندازه‌ی قلم، ترجمه‌ها و تفاسیر منتخب",
      "شخصی‌سازی متن قرآن: قلم، اندازه و فاصله‌ی خطوط",
      "شخصی‌سازی ترجمه و تفسیر، و رنگ متن و پس‌زمینه",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v1", from: 64.6, to: 67.4, mark: { box: HOME_SETTINGS, from: 64.9, to: 66.35 } },
          { v: "v1", from: 67.4, to: 68.4, mark: { box: wide(186, 130), from: 67.45 } },
          { v: "v1", from: 68.4, to: 69.2, mark: { box: wide(336, 204), from: 68.45 } },
          { v: "v1", from: 69.2, to: 70, mark: { box: wide(560, 310), from: 69.25 } },
          { v: "v1", from: 70.4, to: 72.9, mark: { box: { x: 20, y: 512, w: 444, h: 396 }, from: 72.4 } },
          { v: "v1", from: 72.9, to: 77.6, mark: { box: { x: 22, y: 386, w: 438, h: 608 }, from: 76.9 } },
        ]}
      />
    ),
    stat: { value: fa(3), label: "شیوه‌ی نمایش" },
  },
  {
    id: "recite",
    pans: [-1, -1, -1, -1, 0],
    icon: "repeat",
    title: "تنظیمات قرائت و حفظ",
    short: "قرائت و حفظ",
    subtitle: "زبانه‌ی «قرائت»؛ امکانات ویژه برای حافظان",
    bullets: [
      "۴ حالت پخش: متن، متن و ترجمه، ترجمه، ترجمه و متن",
      `قاری منتخب و ترجمه‌ی گویای فارسی (${fa(2)} دوره‌ی کامل)`,
      `سرعت پخش ۰٫۵ تا ${fa(2)} برابر و تکرار آیه تا ${fa(100)} بار`,
      "پخش دعای آیات سجده‌دار",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v1", from: 78.9, to: 80 },
          { v: "v1", from: 82.4, to: 84.6, mark: { box: { x: 30, y: 262, w: 164, h: 288 }, from: 83.3 } },
          { v: "v1", from: 86.3, to: 86.9, mark: { box: wide(330, 172), from: 86.35 } },
          { v: "v1", from: 86.9, to: 87.5, mark: { box: wide(520, 208), from: 86.95 } },
          { v: "v1", from: 87.5, to: 88.1, mark: { box: wide(745, 62), from: 87.55 } },
        ]}
      />
    ),
    stat: { value: fa(4), label: "حالت پخش" },
  },
  {
    id: "general",
    pans: [-1, -1, -1],
    icon: "sliders",
    title: "تنظیمات عمومی",
    short: "تنظیمات عمومی",
    subtitle: "زبانه‌ی «عمومی» در تنظیمات برنامه",
    bullets: [
      "پوسته‌ی برنامه و پوسته‌ی شب، روشن‌ماندن صفحه",
      "یادآور «آیه‌ی روز»، زبان برنامه و به‌روزرسانی",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v1", from: 88.6, to: 89.6 },
          { v: "v1", from: 89.6, to: 90.3, mark: { box: wide(186, 278), from: 89.65 } },
          { v: "v1", from: 90.3, to: 91, mark: { box: wide(486, 278), from: 90.35 } },
        ]}
      />
    ),
  },
  {
    id: "surahs",
    pans: [-1, -1, 1, -1, -1, -1],
    icon: "list",
    title: "قرآن کریم و فهرست سوره‌ها",
    short: "فهرست سوره‌ها",
    subtitle: "ورود به «قرآن کریم» و دسترسی به همه‌ی سوره‌ها",
    bullets: [
      `فهرست ${fa(114)} سوره، با تعداد آیات و مکی یا مدنی بودن`,
      "افزودن سوره به «علاقه‌مندی‌ها»، در دسته‌ی دلخواه",
      `فهرست ${fa(30)} جزء`,
      "نمایش حزب‌ها با کلید «نمایش حزب‌ها»",
      "زبانه‌ی «علاقه‌مندی‌ها»: سوره، جزء و حزب‌های ذخیره‌شده",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v1", from: 104.3, to: 111.2 },
          { v: "v1", from: 111.2, to: 118.6 },
          { v: "v1", from: 119, to: 123.6 },
          { v: "v1", from: 123.7, to: 128.9 },
          { v: "v2", from: 0, to: 2.6, mark: { box: { x: 12, y: 182, w: 168, h: 48 }, from: 0.1 } },
          { v: "v2", from: 16.6, to: 21.2, mark: { box: { x: 6, y: 116, w: 150, h: 50 }, from: 16.6, to: 17.8 } },
        ]}
      />
    ),
    stat: { value: fa(114), label: "سوره" },
  },
  {
    id: "reciters",
    pans: [0, 0, 1, 0.5, 1, -1],
    icon: "headphones",
    title: "تلاوت و قاریان",
    short: "تلاوت و قاریان",
    subtitle: "تلاوت آیات با صدای قاریان برجسته",
    bullets: [
      `${fa(28)} دوره‌ی کامل قرائت؛ متن، آیه‌به‌آیه همراه تلاوت پیش می‌رود`,
      "تنظیمات پخش: پخش بازه‌ای، سرعت پخش و تکرار آیه",
      "پخش بازه‌ای: حالت پخش (آیه تا صفحه)، شروع، پایان و تکرار آیه",
      "«حالت پخش» و «مدیریت دانلودها»",
      "انتخاب قاری در قالب‌های ترتیل، تحقیق و تحدیر",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v2", from: 26.5, to: 30 },
          { v: "v2", from: 43.8, to: 54.6 },
          {
            v: "v2",
            from: 54.6,
            to: 56.3,
            mark: [
              { box: PLAYER_SETTINGS, from: 54.6, to: 55.45 },
              { box: wide(815, 56), from: 55.9, to: 57 },
              { box: wide(879, 56), from: 57.1, to: 58.2 },
              { box: wide(943, 56), from: 58.3 },
            ],
          },
          {
            v: "v2",
            from: 72.6,
            to: 74.2,
            mark: [
              { box: wide(818, 50), from: 73.15, to: 73.65 },
              { box: dlg(334, 92), from: 74.3, to: 75.7 },
              { box: dlg(434, 86), from: 75.8, to: 77 },
              { box: dlg(524, 86), from: 77.1, to: 78.3 },
              { box: dlg(614, 86), from: 78.4 },
            ],
          },
          {
            v: "v2",
            from: 62,
            to: 64.6,
            mark: [
              { box: PLAYER_RECITER, from: 62.05, to: 63.85 },
              { box: wide(608, 56), from: 64.2 },
            ],
          },
          { v: "v2", from: 64.6, to: 68.3, mark: { box: wide(682, 60), from: 64.6, to: 65.25 } },
        ]}
      />
    ),
    stat: { value: fa(28), label: "دوره‌ی قرائت" },
  },
  {
    id: "translate",
    pans: [1, 1, 0, 0],
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
          { v: "v2", from: 86.5, to: 91 },
          { v: "v2", from: 30, to: 33 },
        ]}
      />
    ),
    stat: { value: fa(152), label: "ترجمه" },
  },
  {
    id: "tafsir",
    pans: [1, 0, 0, 1, 1],
    icon: "layers",
    title: "تفسیر و حدیث",
    short: "تفسیر و حدیث",
    subtitle: "تفاسیر شیعه و اهل سنت در «پنل آیه»",
    bullets: [
      `${fa(416)} تفسیر عربی و فارسی؛ قابل دانلود برای استفاده‌ی آفلاین`,
      "مطالعه‌ی متن کامل تفسیر، مانند تفسیر نمونه",
      "روایات تفسیری از منابعی مانند تفسیر عیاشی، قمی و البرهان",
      "روایات شیعه و اهل سنت؛ مانند الدر المنثور سیوطی",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v2", from: 95, to: 98.8 },
          { v: "v2", from: 99.6, to: 104 },
          { v: "v3", from: 0, to: 5 },
          { v: "v3", from: 14.5, to: 19.5 },
          { v: "v3", from: 21.4, to: 36.2 },
        ]}
      />
    ),
    stat: { value: fa(416), label: "تفسیر" },
  },
  {
    id: "words",
    pans: [1, 1, 1, 1, 1],
    icon: "type",
    title: "واژگان، اعراب و آیات مرتبط",
    short: "واژگان و اعراب",
    subtitle: "تحلیل کلمات آیه و یافتن آیات هم‌موضوع",
    bullets: [
      "ترجمه‌ی کلمه‌به‌کلمه، با قرائت هر واژه",
      "توصیف واژگان از منابع لغت، مانند مجمع البحرین",
      "اعراب قرآن: ترکیب نحوی و تحلیل صرفی",
      "«آیات مرتبط»، با نوع ارتباط و میزان مشابهت",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v3", from: 39, to: 41.5 },
          { v: "v3", from: 41.5, to: 45 },
          { v: "v3", from: 47, to: 52 },
          { v: "v3", from: 70, to: 76 },
          { v: "v3", from: 80.5, to: 87.4 },
        ]}
      />
    ),
  },
  {
    id: "alam",
    pans: [-1, -1, -1, 0, 0],
    icon: "library",
    title: "اعلام و اسماء",
    short: "اعلام و اسماء",
    subtitle: "نام‌های قرآنی و آیات مربوط به آن‌ها",
    bullets: [
      "اشخاص، مکان‌ها، جانوران، رنگ‌ها و دیگر نام‌های قرآنی",
      "انتخاب یک عَلَم؛ برای نمونه «سبز» از دسته‌ی رنگ‌ها",
      "توضیح هر عَلَم، همراه با آیاتی که در آن آمده است",
      "آیات مرتبط و «اعلام مرتبط»، مانند «درخت ممنوعه»",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v4", from: 35.5, to: 39 },
          { v: "v4", from: 39, to: 43.5 },
          { v: "v4", from: 43.6, to: 47.5, mark: { box: SABZ, from: 45.8 } },
          { v: "v4", from: 50.3, to: 53, mark: { box: SABZ, to: 50.9 } },
          { v: "v4", from: 77, to: 84.5 },
        ]}
      />
    ),
  },
  {
    id: "farhang",
    pans: [-1, -1, 0, 0, 1],
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
          { v: "v5", from: 29.8, to: 34.5, mark: { box: HOME_FARHANG, from: 30.3, to: 32.25 } },
          { v: "v5", from: 34.5, to: 36.6 },
          { v: "v5", from: 36.6, to: 44 },
          { v: "v5", from: 48.5, to: 56 },
          { v: "v5", from: 58.5, to: 62 },
        ]}
      />
    ),
  },
  {
    id: "khatm",
    pans: [-1, -1, 0, -1, 0],
    icon: "calendar",
    title: "ختم قرآن و واژه‌نامه",
    short: "ختم و واژه‌نامه",
    subtitle: "برنامه‌ریزی برای ختم و شناخت واژه‌های قرآن",
    bullets: [
      "ختم قرآن شخصی و گروهی",
      "برنامه‌ی ختم: نوع، بازه، مقدار روزانه و یادآور",
      "«واژه‌نامه»: ریشه‌ها، مدخل‌ها و کلمات قرآنی",
      "جستجوی واژه و توصیف آن از منابع لغت، مانند «الرحمن»",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v5", from: 81, to: 83.5 },
          { v: "v5", from: 83.5, to: 86.3 },
          { v: "v5", from: 86.3, to: 90.9 },
          { v: "v6", from: 8.3, to: 11 },
          { v: "v6", from: 19.8, to: 27 },
        ]}
      />
    ),
  },
  {
    id: "multimedia",
    pans: [0, -1, 0],
    icon: "speaker",
    title: "چندرسانه",
    short: "چندرسانه",
    subtitle: "شنیدن و آموختن قرآن",
    bullets: [
      "تفسیر گویای استاد قرائتی",
      "تلاوت‌های مجلسی، آموزشی، ترتیل، تحقیق و تحدیر؛ ترجمه‌ی گویا و سخنرانی",
    ],
    screen: (
      <RecSteps
        segs={[
          { v: "v6", from: 43.8, to: 47 },
          { v: "v6", from: 47, to: 49.5 },
          { v: "v6", from: 55.5, to: 59.5 },
        ]}
      />
    ),
  },
  {
    id: "ai",
    pans: [0, -1, -1, 1],
    icon: "sparkles",
    title: "هوش مصنوعی و منابع",
    short: "هوش مصنوعی",
    subtitle: "پژوهش هوشمند در تفاسیر و منابع اسلامی",
    bullets: [
      "«گفتگوی هوشمند با تفاسیر»",
      "«با کتاب گفتگو کن»: پرسش از کتاب‌های کتابخانه‌ی دیجیتال نور",
      "دسترسی به برنامه‌های دیگر نور، مانند قاموس نور",
    ],
    screen: <AIScreen />,
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
