/* ============================================================
   LifeHub — your Life OS
   All data lives in localStorage. No server, no build step.
   ============================================================ */
"use strict";

/* ================= tiny utils ================= */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---- sanitisers for values that land INSIDE an attribute, where esc() alone isn't the whole story ----
   Everything here is rendered via innerHTML from template literals, so a value that escapes its quoted
   context becomes an event handler. That matters more than usual in this app: the key that decrypts
   your cloud data lives on the device, so one injected handler is not a defaced page — it's the whole
   privacy promise. These are allow-lists, not filters: anything unrecognised is dropped. */

/* A cover/poster reference. Only a data: image or an https: URL, and only characters that cannot
   terminate a CSS url() or an HTML attribute. Reached by JSON import and by book/film autofill, which
   stores a remote URL verbatim — neither is trustworthy input. */
function safeUrl(v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  if (/["'()\\<>\s]/.test(s)) return "";                       // can't break out if it can't contain a breaker
  if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/=]+$/.test(s)) return s;
  if (/^https:\/\/[A-Za-z0-9._~:/?#[\]@!$&*+,;=%-]+$/.test(s)) return s;
  return "";
}
/* A colour or hue dropped into a custom property or a style declaration. Accepts #hex, a bare number
   (hue degrees), a CSS keyword, var(--x), and the hsl()/rgb() forms the app generates itself — but
   only with digits, %, commas and spaces inside, so the parens can't carry a url() or a second
   declaration. Anything else becomes the fallback. */
function cssVar(v, fallback = "") {
  const s = String(v ?? "").trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  if (/^-?\d+(\.\d+)?$/.test(s)) return s;
  if (/^(var\(--[a-z0-9-]+\)|[a-z]+)$/i.test(s)) return s;
  if (/^(hsla?|rgba?)\([\d.,%\s/]+\)$/i.test(s)) return s;
  return fallback;
}
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
/* de-duplicated: the same tag twice on one thing means nothing and just clutters the chip row */
const parseTags = (v) => [...new Set(String(v || "").split(",").map(x => x.trim()).filter(Boolean))].slice(0, 8);
/* ---- money ----
   This used to hardcode a "$", which meant an 18,000,000-toman gymnastics package rendered as
   $18,000,000 — the app confidently stating something false. Every amount now carries the currency
   it was actually paid in. Toman, not Rial: prices in Iran are quoted in toman. */
const CURRENCIES = {
  USD: { code: "USD", sym: "$",     name: "US dollar", pre: true,  dp: 2 },
  IRT: { code: "IRT", sym: "تومان", name: "Toman",     pre: false, dp: 0 },
};
const CUR_CODES = Object.keys(CURRENCIES);
const defaultCur = () => (typeof state !== "undefined" && state && state.profile && CURRENCIES[state.profile.currency]) ? state.profile.currency : "USD";
const curOf = (c) => CURRENCIES[c] || CURRENCIES[defaultCur()];
function money(n, cur) {
  const c = curOf(cur);
  const v = Math.abs(+n || 0).toLocaleString(undefined, { maximumFractionDigits: c.dp });
  const sign = (+n || 0) < 0 ? "−" : "";
  return c.pre ? `${sign}${c.sym}${v}` : `${sign}${v} ${c.sym}`;
}
/* Sum a list into one bucket per currency. Deliberately NOT one number: dollars and toman cannot be
   added without a rate, and the app doesn't have one unless you gave it one. */
function sumByCur(rows, getAmt, getCur) {
  const out = {};
  (rows || []).forEach(r => {
    const c = CURRENCIES[getCur(r)] ? getCur(r) : defaultCur();
    out[c] = (out[c] || 0) + (+getAmt(r) || 0);
  });
  return out;
}
const curCount = (sums) => Object.keys(sums).filter(c => sums[c]).length;
/* every currency present, side by side — never silently merged */
const moneyLine = (sums) => {
  const parts = Object.keys(sums).filter(c => sums[c]).map(c => money(sums[c], c));
  return parts.length ? parts.join("  ·  ") : money(0);
};
/* A combined figure exists ONLY if you set your own rate, and it always names the rate and the day
   you set it. The app never fetches a rate and never invents one — a stale number presented as fact
   is worse than two honest subtotals. */
function combinedTotal(sums) {
  const p = (typeof state !== "undefined" && state && state.profile) || {};
  const rate = +p.fxRate || 0;
  if (!rate || curCount(sums) < 2) return null;
  const to = defaultCur();
  let n = 0;
  Object.keys(sums).forEach(c => {
    if (!sums[c]) return;
    if (c === to) n += sums[c];
    else if (to === "IRT" && c === "USD") n += sums[c] * rate;
    else if (to === "USD" && c === "IRT") n += sums[c] / rate;
    else return;
  });
  return { amount: n, cur: to, rate, on: p.fxSetOn || "",
           note: `at your rate of ${(+rate).toLocaleString()} ${CURRENCIES.IRT.sym} per ${CURRENCIES.USD.sym}1${p.fxSetOn ? `, set ${niceDate(p.fxSetOn, { month: "short", day: "numeric", year: "numeric" })}` : ""}` };
}

const DAY_MS = 86400000;
const iso = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const todayIso = () => iso(new Date());
const addDays = (dateIso, n) => iso(new Date(dateIso + "T12:00:00").getTime() + n * DAY_MS);
const niceDate = (dateIso, opts) => new Date(dateIso + "T12:00:00")
  .toLocaleDateString(undefined, opts || { month: "short", day: "numeric" });
const WD_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function mondayOf(dateIso) {
  const d = new Date(dateIso + "T12:00:00");
  return addDays(dateIso, -((d.getDay() + 6) % 7));
}
const weekDates = () => { const m = mondayOf(todayIso()); return [...Array(7)].map((_, i) => addDays(m, i)); };
const weekKey = () => mondayOf(todayIso());
const monthKey = () => todayIso().slice(0, 7);

function daysUntil(dateIso) {
  const diff = Math.round((new Date(dateIso + "T12:00:00") - new Date(todayIso() + "T12:00:00")) / DAY_MS);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff < 0) return `${-diff}d overdue`;
  return `in ${diff}d`;
}

/* ================= icon set (inline SVG, stroke) ================= */
const I = (() => {
  const w = (p) =>
    `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  return {
    home:      w('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'),
    target:    w('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>'),
    heart:     w('<path d="M12 20.6S4.8 16.2 2.6 12A5.6 5.6 0 0 1 12 6.4 5.6 5.6 0 0 1 21.4 12c-2.2 4.2-9.4 8.6-9.4 8.6Z"/>'),
    dumbbell:  w('<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>'),
    apple:     w('<path d="M12 7.5c-3.6-1.8-7 .6-7 4.8 0 3.9 3 8 7 8s7-4.1 7-8c0-4.2-3.4-6.6-7-4.8Z"/><path d="M12 7.5c0-2.2 1.2-3.7 3.2-4.5"/>'),
    gradcap:   w('<path d="M2 9.5 12 5l10 4.5L12 14 2 9.5Z"/><path d="M6 11.7v4.1c0 1.4 2.7 2.7 6 2.7s6-1.3 6-2.7v-4.1"/><path d="M22 9.5v5"/>'),
    book:      w('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>'),
    film:      w('<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/>'),
    building:  w('<path d="M12 3 3 8.2h18L12 3Z"/><path d="M5.5 8.2V17M9.8 8.2V17M14.2 8.2V17M18.5 8.2V17M3.5 17h17M2 20.5h20"/>'),
    briefcase: w('<rect x="3" y="8" width="18" height="12" rx="2.2"/><path d="M9 8V6.2A2.2 2.2 0 0 1 11.2 4h1.6A2.2 2.2 0 0 1 15 6.2V8M3 13.2h18"/>'),
    rocket:    w('<path d="M14.3 4.8c2.7-1.7 5.4-1.5 5.4-1.5s.3 2.7-1.4 5.4c-1.9 3.1-5 6-7.6 7L7 12c1-2.6 4.2-5.4 7.3-7.2Z"/><circle cx="15.2" cy="8.8" r="1.7"/><path d="M7 12l-3 1.6 2 1.2 1.2 2L9 13.9M8.6 18.4c-.9 1.7-3.4 2.4-3.4 2.4s.6-2.6 2.2-3.6"/>'),
    users:     w('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.85M15.5 3.15a4 4 0 0 1 0 7.7"/>'),
    camera:    w('<path d="M21 19V8.5a2 2 0 0 0-2-2h-2.8L14.6 4H9.4L7.8 6.5H5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2Z"/><circle cx="12" cy="13" r="4"/>'),
    pen:       w('<path d="M12 20h9"/><path d="M16.7 3.3a2.1 2.1 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5L16.7 3.3Z"/>'),
    chart:     w('<path d="M18 20V10M12 20V4M6 20v-6"/>'),
    zap:       w('<path d="M13 2 3.5 13.5H11L10 22l9.5-11.5H13L13 2Z"/>'),
    user:      w('<path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21"/><circle cx="12" cy="7.5" r="4"/>'),
    flame:     w('<path d="M12 21.5c4.2 0 6.8-2.6 6.8-6.2 0-2.9-1.8-4.7-3.2-6.3C14.3 7.5 13 6 13 3.2c-3 1.5-4.4 3.9-4 6.4.2 1.4-.8 2-1.7 1.1-.5-.5-.8-1.1-1-1.9-1.4 1.5-1.6 3.5-1.6 6.5 0 3.6 2.7 6.2 7.3 6.2Z"/>'),
    drop:      w('<path d="M12 2.8s6.3 6.5 6.3 10.9a6.3 6.3 0 0 1-12.6 0C5.7 9.3 12 2.8 12 2.8Z"/>'),
    moon:      w('<path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a7 7 0 0 0 9.7 9.7Z"/>'),
    sun:       w('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/>'),
    check:     w('<path d="M20 6.5 9.5 17 4 11.5"/>'),
    plus:      w('<path d="M12 5v14M5 12h14"/>'),
    x:         w('<path d="M18 6 6 18M6 6l12 12"/>'),
    trash:     w('<path d="M3.5 6.5h17M8.5 6.5V4.8A1.8 1.8 0 0 1 10.3 3h3.4a1.8 1.8 0 0 1 1.8 1.8v1.7M18.8 6.5 18 19.2A1.9 1.9 0 0 1 16.1 21H7.9A1.9 1.9 0 0 1 6 19.2L5.2 6.5M10 11v6M14 11v6"/>'),
    edit:      w('<path d="M11 4.5H5A1.5 1.5 0 0 0 3.5 6v13A1.5 1.5 0 0 0 5 20.5h13a1.5 1.5 0 0 0 1.5-1.5v-6"/><path d="M17.8 2.7a2.05 2.05 0 0 1 2.9 2.9L12 14.3l-3.9 1 1-3.9 8.7-8.7Z"/>'),
    trophy:    w('<path d="M8 21h8M12 17.5V21M7 4h10v6.5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4.2A2.9 2.9 0 0 0 7 10.8M17 6h2.8A2.9 2.9 0 0 1 17 10.8"/>'),
    star:      w('<path d="m12 2.8 2.9 5.8 6.4 1-4.6 4.5 1.1 6.4L12 17.5l-5.8 3 1.1-6.4-4.6-4.5 6.4-1L12 2.8Z"/>'),
    calendar:  w('<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>'),
    medal:     w('<circle cx="12" cy="8.5" r="5.5"/><path d="m8.8 13.2-1.7 7.3 4.9-2.9 4.9 2.9-1.7-7.3"/>'),
    activity:  w('<path d="M22 12h-3.5l-3 8-7-16-3 8H2"/>'),
    grip:      w('<path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" stroke-width="2.6" stroke-linecap="round"/>'),
    clock:     w('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.4 2"/>'),
    sliders:   w('<path d="M4.5 21v-6.5M4.5 10V3M12 21V11.5M12 7.5V3M19.5 21v-4.5M19.5 12V3M2 14.5h5M9.5 7.5h5M17 16.5h5"/>'),
    menu:      w('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    chevL:     w('<path d="M15 5l-7 7 7 7"/>'),
    chevR:     w('<path d="M9 5l7 7-7 7"/>'),
    play:      w('<path d="M7 5v14l11-7-11-7Z"/>'),
    bell:      w('<path d="M18 8.6a6 6 0 1 0-12 0c0 6-2.5 7.4-2.5 7.4h17S18 14.6 18 8.6Z"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>'),
    link:      w('<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>'),
    tv:        w('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 21h8M12 3l4 3H8l4-3Z"/>'),
    calc:      w('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h4M8 15h.01M12 15h.01M8 19h.01M12 19h.01M16 15v4"/>'),
    cart:      w('<path d="M3 4h2l2.4 12.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6"/><circle cx="9.5" cy="20.5" r="1.3"/><circle cx="17.5" cy="20.5" r="1.3"/>'),
    spark:     w('<path d="M12 3.5 13.7 9 19 10.7 13.7 12.4 12 18l-1.7-5.6L5 10.7 10.3 9 12 3.5Z"/><path d="M18.6 15.6l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.4Z"/>'),
    download:  w('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>'),
    upload:    w('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 8 5-5 5 5M12 3v12"/>'),
    grid:      w('<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>'),
    search:    w('<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4-4"/>'),
    wallet:    w('<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9.5h18M16.5 13.5h.01"/><path d="M17 6V4.6a1.5 1.5 0 0 0-1.9-1.45L4.8 5.7A2.4 2.4 0 0 0 3 8"/>'),
  };
})();

/* ================= life areas registry ================= */
const AREAS = [
  { id: "habits",     name: "Habit Tracker",      icon: "target",    hue: "#6a5ae0" },
  { id: "health",     name: "Health",             icon: "heart",     hue: "#e5484d" },
  { id: "workout",    name: "Workout",            icon: "dumbbell",  hue: "#f76b15" },
  { id: "nutrition",  name: "Nutrition",          icon: "apple",     hue: "#30a46c" },
  { id: "learning",   name: "Learning",           icon: "gradcap",   hue: "#8e4ec6" },
  { id: "reading",    name: "Reading",            icon: "book",      hue: "#0091ff" },
  { id: "media",      name: "Movies & Series",    icon: "film",      hue: "#d6409f" },
  { id: "projects",   name: "Projects",           icon: "rocket",    hue: "#12a594" },
  { id: "finance",    name: "Finance",            icon: "wallet",    hue: "#2f9e6f" },
  { id: "social",     name: "Social",             icon: "users",     hue: "#e93d82" },
  { id: "memories",   name: "Memories",           icon: "camera",    hue: "#00a2c7" },
  { id: "journal",    name: "Journal",            icon: "pen",       hue: "#7c66dc" },
];
const areaOf = (id) => AREAS.find(a => a.id === id);

const NAV_GROUPS = [
  { label: "Overview", items: [
    { id: "dashboard", name: "Dashboard", icon: "home" },
    { id: "goals",     name: "Goals",     icon: "target" },
    { id: "progress",  name: "Progress",  icon: "chart" },
  ]},
  { label: "Daily", items: ["habits", "health", "workout", "nutrition", "journal"].map(areaOf) },
  { label: "Growth", items: ["learning", "reading", "projects"].map(areaOf) },
  { label: "Life", items: ["finance", "media", "social", "memories"].map(areaOf) },
  { label: "System", items: [
    { id: "integrations", name: "Integrations", icon: "zap" },
    { id: "profile",      name: "Profile",      icon: "user" },
  ]},
];

/* ================= state ================= */
const STORE_KEY = "lifehub-v1";
const CORRUPT_KEY = STORE_KEY + ".corrupt";   // where unreadable data is parked, never overwritten
const SCHEMA = 21;                             // bump when you append a step to MIGRATIONS
/* People are joined by NAME across Social, Reading, Movies and Memories. Names are what you actually
   type in each of those places, so a normalised name is the key — no id rewrite, nothing to break. */
const normName = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
let state = null;

/* Transient UI state — deliberately NOT persisted and NOT synced. Which day you're looking at and
   which tab is open are per-device, per-moment; keeping them in `state` meant switching a tab wrote
   to disk and uploaded the whole encrypted database. */
const ui = { cursor: {}, readingTab: "current", mediaTab: "watchlist", showMore: false };

/* set when startup couldn't read saved data — blocks cloud pushes so we never overwrite good data */
let loadIssue = null;

function defaultState() {
  return {
    profile: { name: "", avatar: "🌱", theme: "auto", onboarded: false, apiKey: "", tmdbKey: "", metrics: null,
               currency: "USD", fxRate: 0, fxSetOn: "" },
    xp: 0,
    xpLog: {},                 // {date: xp gained}
    claimed: {},               // {date: {missionId:true}}
    badges: {},                // {badgeId: dateEarned}
    visited: {},               // {viewId: true}
    /* NB `start` is a starting NUMBER (88 kg); `startedOn` is a date. Different questions. */
    goals: [],                 // {id,title,emoji,type,unit,direction,start,target,startedOn,deadline,
                               //  note,priority,status,tags,progress,habitIds,milestones}
    /* Habit groups. A group with a `start` and a `days` count is a CHALLENGE — the two are the same
       idea with and without a clock on it, so there is one list rather than two concepts. */
    groups: [],                // {id,name,emoji,color,start,days,order}
    quotes: [],                // the user's own lines, mixed into the daily rotation
    /* The connected ecosystem. `links` is the graph between any two objects; `history` is what has
       happened to each of them. Both keyed by "type:id" refs — see the OBJECTS registry. */
    links: [],                 // {id,from,to,rel,at}
    history: {},               // {"type:id": [{at,what}]}
    /* Your own schedule. `source` is "" for anything you typed; it exists from day one so a calendar
       import could be told apart later without another migration. */
    events: [],                // {id,title,date,time,mins,category,icon,note,source,created,updated}
    todos: [],                 // {id,text,done,date,time,order,repeat,seriesId,from,
                               //  priority,estMin,linkGoalId,projectId,focus,hard}
    tasksRolledOn: "",         // last date rollTasks() ran — synced so one device answering settles it
    /* the focus session. `focus` is at most one running (or finished-but-unlogged) session;
       `focusLog[date]` is the minutes it left behind. */
    focus: null,               // {id,taskId,title,mins,startedAt,pausedAt,pausedMs,goalId,projectId}
    focusLog: {},              // {date: [{id,taskId,title,mins,goalId,projectId,at}]}
    habits: [],                // {id,name,emoji,kind,goalId,milestones,log:{date:{done,note,workoutId}}}
    health: { goals: { steps: 10000, water: 2, sleep: 8 }, log: {} }, // log[date]={steps,water,sleep,mood}
    /* skills: the ATHLETE's skills (handstand, muscle-up, back wheel) — deliberately under
       `workout`, because `state.skills` is already Education courses and one name for two
       unrelated things is how a codebase starts lying to you.
       {id,name,emoji,category,level,target,status,why,pbUnit,media:[],notes:[],log:[],created,updated} */
    workout: { weeklyGoal: 5, plan: [], log: {}, sessions: [], classes: [], skills: [] },  // plan:{id,name,category,minutes,sets,reps,days,time,focus,exercises}; classes: packages
    nutrition: { goals: { kcal: 2200, protein: 150, carbs: 250, fats: 70, fiber: 30 }, meals: [], log: {}, photos: {}, supplements: [], supTaken: {}, shopping: [] },
    /* learning: Skills & Education + University + Work Preparation, merged (schema 21)
       courses {id,name,emoji,kind,category,institution,instructor,start,targetEnd,credits,grade,
                gradeMax,progress,link,notes}
       tasks   {id,title,kind:"university"|"career",tag,due,done} */
    learning: { monthlyHours: 10, weeklyHours: 20, courses: [], tasks: [] },
    study: { log: {} },        // log[date]={skills:mins, university:mins} — ONE ledger, split by source
    reflections: {},           // {date: text}
    reading: { yearlyGoal: 12, books: [], log: {} },
    media: [],                 // {id,title,type,status,rating}
    university: { weeklyHours: 20, tasks: [] },
    work: { items: [] },       // {id,title,done}
    /* projects {id,name,emoji,status,progress,note,purpose,priority,startedOn,deadline,
       nextMilestone,tags:[],milestones:[{id,text,done}],files:[mediaRef]} */
    projects: [],
    finance: { entries: [], importedClasses: [] }, // entries {id,date,type:income|expense,amount,category,note}
    /* people {id,name,emoji,relation,birthday,note,tags:[],touches:[dateIso]} — the same humans the
       rest of the app already names as "recommended by" and "who was there" */
    social: { items: [], log: {}, people: [] }, // items {id,title,emoji,target}; log[weekKey]={itemId:count}
    memories: [],              // {id,date,title,note,felt,emoji,hue,photos:[],tags:[],people:[],starred}
    journal: [],               // {id,date,text,mood,tags:[]}
    /* local reminders (stage 1 — no push server; see the reminders module for the honest scope) */
    reminders: { enabled: false, push: false, after: "18:00", quietFrom: "22:00",
      kinds: { habits: true, supplements: true, streak: true, deadlines: true, tasks: true } },
  };
}

function seedState(s) {
  const t = todayIso();
  const H = (o) => Object.assign({ id: uid(), emoji: "✅", type: "build", target: 0, unit: "", why: "", cadence: { mode: "daily" }, kind: "", color: "#6a5ae0", goalIds: [], milestones: [], log: {} }, o);
  s.habits = [
    H({ name: "Morning meditation", emoji: "🧘", color: "#7c66dc", why: "Start calm, stay calm." }),
    H({ name: "Workout", emoji: "💪", kind: "workout", color: "#f76b15", cadence: { mode: "days", days: [0, 2, 4] }, why: "Strong body, strong mind." }),
    H({ name: "Drink water", emoji: "💧", type: "quantity", target: 2, unit: "L", color: "#00a2c7", why: "Energy & focus." }),
    H({ name: "Read", emoji: "📖", type: "quantity", target: 20, unit: "pages", color: "#0091ff" }),
    H({ name: "No sugar", emoji: "🍬", type: "avoid", color: "#e5484d", why: "Steady energy, clear skin." }),
  ];
  // a starter outcome goal, linked to the process habits that build it
  const goalId = uid();
  s.goals = [{
    id: goalId, title: "Lose 8 kg body fat", emoji: "🎯", type: "outcome", unit: "kg", direction: "down",
    start: 78, target: 70, deadline: addDays(t, 120), note: "Slow and steady — habits over crash diets.",
    progress: [{ date: addDays(t, -21), value: 78 }, { date: addDays(t, -7), value: 76.6 }],
    habitIds: [s.habits[1].id, s.habits[2].id, s.habits[4].id],
    milestones: [
      { id: uid(), text: "Down to 76 kg", target: 76, done: false },
      { id: uid(), text: "Down to 74 kg", target: 74, done: false },
      { id: uid(), text: "Down to 72 kg", target: 72, done: false },
      { id: uid(), text: "Reach 70 kg", target: 70, done: false },
    ],
  }];
  [s.habits[1], s.habits[2], s.habits[4]].forEach(h => h.goalIds = [goalId]);
  // a gentle history so charts aren't empty on first run
  for (let i = 1; i <= 10; i++) {
    const d = addDays(t, -i);
    s.habits.forEach((h, hi) => { if ((i + hi) % 3 !== 0) h.log[d] = true; });
    s.xpLog[d] = 30 + ((i * 37) % 60);
    s.xp += s.xpLog[d];
    s.health.log[d] = { steps: 5200 + ((i * 997) % 5800), water: +(1 + (i % 4) * 0.35).toFixed(2), sleep: 6.5 + (i % 3) * 0.7, mood: ["🙂","😄","😌","🥱"][i % 4] };
  }
  s.workout.plan = [
    { id: uid(), name: "Calisthenics", emoji: "🤸", category: "Calisthenics", minutes: 40, sets: 4, reps: 12 },
    { id: uid(), name: "Leg day",      emoji: "🦵", category: "Strength", minutes: 45, sets: 4, reps: 10 },
    { id: uid(), name: "Upper body",   emoji: "🏋️", category: "Strength", minutes: 45, sets: 4, reps: 10 },
    { id: uid(), name: "Cardio",       emoji: "🏃", category: "Cardio", minutes: 30, sets: 0, reps: 0 },
    { id: uid(), name: "Yoga",         emoji: "🧘", category: "Yoga", minutes: 20, sets: 0, reps: 0 },
  ];
  s.workout.classes = [
    { id: uid(), name: "Yoga studio", total: 8, price: 120, start: addDays(t, -20), log: [addDays(t, -18), addDays(t, -14), addDays(t, -9), addDays(t, -4)], renewals: 0 },
  ];
  s.nutrition.meals = [
    { id: uid(), slot: "Breakfast", name: "Oatmeal, banana & nuts",       time: "08:00", kcal: 420, protein: 16, carbs: 62, fats: 13, fiber: 8 },
    { id: uid(), slot: "Lunch",     name: "Grilled chicken, rice, salad", time: "13:00", kcal: 650, protein: 48, carbs: 70, fats: 16, fiber: 9 },
    { id: uid(), slot: "Snacks",    name: "Greek yogurt & berries",       time: "16:30", kcal: 220, protein: 18, carbs: 24, fats: 6,  fiber: 4 },
    { id: uid(), slot: "Dinner",    name: "Salmon, quinoa & veggies",     time: "19:30", kcal: 580, protein: 40, carbs: 48, fats: 22, fiber: 7 },
  ];
  s.nutrition.supplements = [
    { id: uid(), name: "Vitamin D3", emoji: "☀️", dose: "1000 IU", every: "day" },
    { id: uid(), name: "Magnesium",  emoji: "🌙", dose: "300 mg",  every: "day" },
    { id: uid(), name: "Iron",       emoji: "🩸", dose: "18 mg",   every: "week" },
    { id: uid(), name: "Vitamin B12", emoji: "💊", dose: "1000 mcg", every: "month" },
  ];
  const C = (o) => Object.assign({ id: uid(), emoji: "📘", kind: "self", category: "", institution: "",
    instructor: "", start: "", targetEnd: "", credits: 0, grade: null, gradeMax: 20,
    progress: 0, link: "", notes: "" }, o);
  s.learning.courses = [
    C({ name: "Python for Beginners", emoji: "🐍", progress: 60, category: "Programming", institution: "Coursera" }),
    C({ name: "Linear Algebra", emoji: "📐", kind: "university", progress: 45, institution: "University",
       instructor: "Dr. Ahmadi", credits: 3, grade: 17.5, gradeMax: 20 }),
    C({ name: "UI/UX Design", emoji: "🎨", progress: 40, category: "Design" }),
  ];
  s.reading.books = [
    { id: uid(), title: "Atomic Habits", author: "James Clear", emoji: "⚛️", status: "current", pages: 320, page: 218, rating: 0, genre: "Self-help", blurb: "Tiny changes, remarkable results — the science of building good habits.", recommenders: [] },
    { id: uid(), title: "Deep Work", author: "Cal Newport", emoji: "🎯", status: "current", pages: 296, page: 40, rating: 0, genre: "Productivity", blurb: "Rules for focused success in a distracted world.", recommenders: ["Sara"] },
    { id: uid(), title: "The Psychology of Money", author: "M. Housel", emoji: "🪙", status: "done", pages: 256, page: 256, rating: 5, genre: "Finance", blurb: "Timeless lessons on wealth, greed, and happiness.", recommenders: ["Alex", "Jordan"] },
    { id: uid(), title: "How to Win Friends…", author: "D. Carnegie", emoji: "🤝", status: "wishlist", pages: 288, page: 0, rating: 0, genre: "Communication", blurb: "The classic on influence and human relationships.", recommenders: [] },
  ];
  s.media = [
    { id: uid(), title: "Interstellar",    type: "Movie",  status: "watchlist", rating: 0, emoji: "🚀", genre: "Sci-Fi", year: "2014", blurb: "A team travels through a wormhole in search of a new home for humanity.", director: "Christopher Nolan", cast: "M. McConaughey, A. Hathaway", recommenders: ["Sara"] },
    { id: uid(), title: "Breaking Bad",    type: "Series", status: "watching",  rating: 0, emoji: "🧪", genre: "Crime Drama", year: "2008", blurb: "A chemistry teacher turns to making meth to secure his family's future.", season: 3, epsDone: 28, epTotal: 62, recommenders: ["Alex"] },
    { id: uid(), title: "The Dark Knight", type: "Movie",  status: "done",      rating: 5, emoji: "🦇", genre: "Action", year: "2008", blurb: "Batman faces the Joker, a criminal mastermind bent on chaos.", director: "Christopher Nolan", cast: "C. Bale, H. Ledger", recommenders: [] },
    { id: uid(), title: "Stranger Things", type: "Series", status: "watching",  rating: 0, emoji: "🔦", genre: "Sci-Fi Horror", year: "2016", blurb: "Kids in a small town uncover supernatural mysteries and secret experiments.", season: 2, epsDone: 12, epTotal: 34, recommenders: ["Jordan", "Sam"] },
  ];
  const K = (o) => Object.assign({ id: uid(), kind: "university", tag: "", due: "", done: false }, o);
  s.learning.tasks = [
    K({ title: "Calculus assignment", tag: "Linear Algebra", due: addDays(t, 3) }),
    K({ title: "Physics lab report",  tag: "Physics 110",    due: addDays(t, 5) }),
    K({ title: "History essay",       tag: "History 101",    due: addDays(t, 8) }),
    K({ title: "Polish resume",        kind: "career", tag: "Resume",       done: true }),
    K({ title: "Update LinkedIn",      kind: "career", tag: "Networking",   done: true }),
    K({ title: "Write cover letter",   kind: "career", tag: "Applications", due: addDays(t, 7) }),
    K({ title: "Build portfolio site", kind: "career", tag: "Portfolio",    due: addDays(t, 21) }),
    K({ title: "Mock interview prep",  kind: "career", tag: "Interviews",   due: addDays(t, 14) }),
  ];
  s.projects = [
    { id: uid(), name: "LifeHub app", emoji: "🌿", status: "In progress", progress: 60, note: "",
      purpose: "One place for the whole of my life, instead of nine apps that don't talk to each other.",
      priority: "high", startedOn: addDays(t, -60), deadline: addDays(t, 45), tags: ["side project", "code"],
      nextMilestone: "Finish the Projects page",
      milestones: [{ id: uid(), text: "Habits + workouts", done: true },
                   { id: uid(), text: "Cross-device sync", done: true },
                   { id: uid(), text: "Goals and projects", done: false },
                   { id: uid(), text: "Ship it to myself", done: false }] },
    { id: uid(), name: "AI tools research", emoji: "🤖", status: "In progress", progress: 40, note: "",
      purpose: "", priority: "med", startedOn: "", deadline: "", tags: ["learning"], nextMilestone: "" },
    { id: uid(), name: "YouTube channel", emoji: "🎬", status: "Planning", progress: 20, note: "",
      purpose: "", priority: "low", startedOn: "", deadline: "", tags: [], nextMilestone: "" },
  ];
  s.finance.entries = [
    { id: uid(), date: addDays(t, -2),  type: "income",  amount: 2400, category: "Salary",        note: "Monthly pay" },
    { id: uid(), date: addDays(t, -1),  type: "expense", amount: 68,   category: "Food",          note: "Groceries" },
    { id: uid(), date: todayIso(),      type: "expense", amount: 45,   category: "Health",        note: "Supplements" },
    { id: uid(), date: addDays(t, -5),  type: "expense", amount: 90,   category: "Subscriptions", note: "Streaming + apps" },
  ];
  s.social.items = [
    { id: uid(), title: "Family call",        emoji: "📞", target: 2 },
    { id: uid(), title: "Meet a friend",      emoji: "☕", target: 1 },
    { id: uid(), title: "Team collaboration", emoji: "🤝", target: 3 },
    { id: uid(), title: "Network event",      emoji: "🎪", target: 1 },
  ];
  s.memories = [
    { id: uid(), date: addDays(t, -12), title: "Hike at sunrise", note: "Worth every step.", emoji: "🏔️", hue: 200 },
    { id: uid(), date: addDays(t, -6),  title: "Beach day",       note: "Salt air & laughter.", emoji: "🏖️", hue: 45 },
    { id: uid(), date: addDays(t, -2),  title: "Movie night",     note: "", emoji: "🍿", hue: 320 },
  ];
  s.journal = [
    { id: uid(), date: addDays(t, -1), mood: "😄", tags: ["Grateful"], text: "Today was a productive day! I learned a lot, worked out, ate healthy and felt grateful for the people around me." },
  ];
  return s;
}

/* ensure nested fields exist on states saved before a feature shipped */
/* Ordered migration steps: MIGRATIONS[i] upgrades schema i → i+1.
   NEVER edit a step once it has shipped — append a new one and bump SCHEMA. Without this ladder
   there is no way to tell old data from new, so a *transforming* migration (renaming a field,
   changing units, restructuring) can't be written safely — especially now that one cloud row is
   shared by several devices that may be on different versions. */
const MIGRATIONS = [
  /* 0 → 1 · everything that predates schema versioning (idempotent field backfills) */
  (s) => {
  s.profile = s.profile || {};
  if (s.profile.apiKey == null) s.profile.apiKey = "";
  if (s.profile.tmdbKey == null) s.profile.tmdbKey = "";
  if (s.profile.metrics === undefined) s.profile.metrics = null;
  s.goals = s.goals || [];
  s.todos = s.todos || [];
  s.workout = s.workout || {};
  s.workout.sessions = s.workout.sessions || [];
  s.workout.classes = s.workout.classes || [];
  (s.workout.plan || []).forEach(p => { if (!Array.isArray(p.days)) p.days = []; if (p.time == null) p.time = ""; if (p.focus == null) p.focus = ""; if (!Array.isArray(p.exercises)) p.exercises = []; });
  s.nutrition = s.nutrition || {};
  s.nutrition.shopping = s.nutrition.shopping || [];
  s.nutrition.goals = s.nutrition.goals || {};
  if (s.nutrition.goals.fiber == null) s.nutrition.goals.fiber = 30;
  s.nutrition.photos = s.nutrition.photos || {};
  s.nutrition.supplements = s.nutrition.supplements || [];
  s.nutrition.supTaken = s.nutrition.supTaken || {};
  (s.nutrition.meals || []).forEach(m => { if (m.time == null) m.time = ""; if (m.fiber == null) m.fiber = 0; });
  s.reflections = s.reflections || {};
  (s.habits || []).forEach(h => {
    h.milestones = h.milestones || [];
    h.type = h.type || "build";
    h.cadence = h.cadence || { mode: "daily" };
    if (h.why == null) h.why = "";
    if (h.target == null) h.target = 0;
    if (h.unit == null) h.unit = "";
    if (h.color == null) h.color = "#6a5ae0";
    if (!Array.isArray(h.goalIds)) h.goalIds = h.goalId ? [h.goalId] : [];
    delete h.goalId;
  });
  (s.goals || []).forEach(g => {
    g.milestones = g.milestones || [];
    g.type = g.type || "checklist";
    if (g.unit == null) g.unit = "";
    if (g.direction == null) g.direction = "down";
    if (g.start == null) g.start = 0;
    if (g.target == null) g.target = 0;
    if (g.deadline == null) g.deadline = "";
    if (!Array.isArray(g.progress)) g.progress = [];
    if (g.note == null) g.note = "";
  });
  (s.todos || []).forEach(td => { if (td.time == null) td.time = ""; if (td.habitId == null) td.habitId = ""; if (td.supId == null) td.supId = ""; if (td.areaId == null) td.areaId = ""; });
  s.finance = s.finance || { entries: [], importedClasses: [] };
  s.finance.entries = s.finance.entries || [];
  s.finance.importedClasses = s.finance.importedClasses || [];
  s.work = s.work || { items: [] };
  (s.work.items || []).forEach(k => { if (k.category == null) k.category = "Other"; if (k.due == null) k.due = ""; });
  s.university = s.university || { weeklyHours: 20, tasks: [], log: {} };
  (s.university.tasks || []).forEach(k => { if (k.course == null) k.course = ""; });
  s.skills = s.skills || { monthlyHours: 10, courses: [], log: {} };
  (s.skills.courses || []).forEach(c => { if (c.category == null) c.category = ""; });
  s.reading = s.reading || { yearlyGoal: 12, books: [], log: {} };
  (s.reading.books || []).forEach(b => {
    if (b.blurb == null) b.blurb = "";
    if (!Array.isArray(b.recommenders)) b.recommenders = [];
    if (b.notes == null) b.notes = "";
    if (b.genre == null) b.genre = "";
    if (b.format == null) b.format = "physical";
    if (b.file === undefined) b.file = null;
  });
  s.media = s.media || [];
  s.media.forEach(m => {
    if (m.cover == null) m.cover = null;
    if (m.emoji == null) m.emoji = m.type === "Series" ? "📺" : "🎬";
    if (m.genre == null) m.genre = "";
    if (m.year == null) m.year = "";
    if (m.blurb == null) m.blurb = "";
    if (m.notes == null) m.notes = "";
    if (m.favorite == null) m.favorite = false;
    if (!Array.isArray(m.recommenders)) m.recommenders = [];
    if (m.director == null) m.director = "";
    if (m.cast == null) m.cast = "";
    if (m.season == null) m.season = 1;
    if (m.epsDone == null) m.epsDone = 0;
    if (m.epTotal == null) m.epTotal = 0;
    if (m.started == null) m.started = "";
    if (m.finished == null) m.finished = "";
  });
  },

  /* 1 → 2 · de-duplicate two facts the app was storing twice.
     (a) Mood lived in BOTH health.log[d].mood and journal[].mood, so the app could hold two
         different answers to "how did you feel today". Health is now the single source of truth;
         a journal mood is adopted only for days Health has none, then the duplicate is dropped.
     (b) Study minutes lived in skills.log and university.log with no combined total. Both fold
         into one study.log[d] = {skills, university} ledger, so total study time is one lookup. */
  (s) => {
    s.health = s.health || { goals: {}, log: {} };
    s.health.log = s.health.log || {};
    (s.journal || []).forEach(j => {
      if (!j || !j.mood) return;
      const day = s.health.log[j.date] = s.health.log[j.date] || {};
      if (!day.mood) day.mood = j.mood;
      delete j.mood;
    });

    s.study = s.study || { log: {} };
    s.study.log = s.study.log || {};
    [["skills", "skills"], ["university", "university"]].forEach(([slice, key]) => {
      const old = (s[slice] && s[slice].log) || {};
      Object.keys(old).forEach(d => {
        const day = s.study.log[d] = s.study.log[d] || {};
        day[key] = (day[key] || 0) + (+old[d] || 0);
      });
      if (s[slice]) delete s[slice].log;
    });
  },

  /* 2 → 3 · reading.log[d] was a write-only boolean ("something happened today"). It becomes a
     per-day PAGE COUNT so a "Read 20 pages" habit can be fed by the pages you actually log. */
  (s) => {
    s.reading = s.reading || { yearlyGoal: 12, books: [], log: {} };
    s.reading.log = s.reading.log || {};
    Object.keys(s.reading.log).forEach(d => {
      const v = s.reading.log[d];
      s.reading.log[d] = (v === true || v === false) ? 0 : (+v || 0);
    });
  },

  /* 3 → 4 · memories gain photos + tags, and the placeholder "connected apps" toggles are dropped.
     They persisted an on/off state for five services that were never wired to anything, so the app
     stored — and synced — settings that could not possibly do anything. */
  (s) => {
    (s.memories || []).forEach(m => {
      if (!Array.isArray(m.photos)) m.photos = [];
      if (!Array.isArray(m.tags)) m.tags = [];
    });
    delete s.integrations;
  },

  /* 4 → 5 · a memory is more than a row: how it felt, who was there, and whether it's treasured */
  (s) => {
    (s.memories || []).forEach(m => {
      if (m.felt == null) m.felt = "";
      if (!Array.isArray(m.people)) m.people = [];
      if (m.starred == null) m.starred = false;
    });
  },

  /* 5 → 6 · local reminders. Opt-in by default: an app that starts notifying you without being
     asked is an app you turn off, and the OS permission prompt has to be user-triggered anyway. */
  (s) => {
    const r = s.reminders && typeof s.reminders === "object" ? s.reminders : {};
    s.reminders = {
      enabled: !!r.enabled,
      push: !!r.push,
      after: r.after || "18:00",
      quietFrom: r.quietFrom || "22:00",
      kinds: Object.assign({ habits: true, supplements: true, streak: true, deadlines: true, tasks: true }, r.kinds || {}),
    };
    (s.habits || []).forEach(h => { if (h.remindAt == null) h.remindAt = ""; });
  },

  /* 6 → 7 · Social gets real people. The app already knew these humans — as the names on
     "recommended by" and "who was there" — it just had no record of them. Promote every name
     already in use into a person, so the list arrives populated rather than empty. */
  (s) => {
    s.social = s.social || { items: [], log: {} };
    if (!Array.isArray(s.social.people)) s.social.people = [];
    const seen = new Map(s.social.people.map(p => [normName(p.name), p]));
    const meet = (name) => {
      const k = normName(name);
      if (!k || seen.has(k)) return;
      const p = { id: uid(), name: String(name).trim(), emoji: "", relation: "", birthday: "", note: "", tags: [], touches: [] };
      seen.set(k, p); s.social.people.push(p);
    };
    (s.reading && s.reading.books || []).forEach(b => (b.recommenders || []).forEach(meet));
    (s.media || []).forEach(m => (m.recommenders || []).forEach(meet));
    (s.memories || []).forEach(m => (m.people || []).forEach(meet));
    s.social.people.forEach(p => {
      if (p.emoji == null) p.emoji = "";
      if (p.relation == null) p.relation = "";
      if (p.birthday == null) p.birthday = "";
      if (p.note == null) p.note = "";
      if (!Array.isArray(p.tags)) p.tags = [];
      if (!Array.isArray(p.touches)) p.touches = [];
    });
  },

  /* 7 → 8 · tasks stop being single-use. They can repeat, they can be reordered, and an unfinished
     one from a previous day is no longer invisible forever. */
  (s) => {
    (s.todos || []).forEach((td, i) => {
      if (td.repeat === undefined) td.repeat = null;
      if (td.seriesId == null) td.seriesId = "";
      if (td.from == null) td.from = "";
      if (td.order == null) td.order = i;
    });
    if (s.tasksRolledOn == null) s.tasksRolledOn = "";
  },

  /* 8 → 9 · a habit can be retired. Until now the only way to stop doing one was to delete it,
     which destroyed its history and its goal links, or to leave it breaking the streak forever. */
  (s) => {
    (s.habits || []).forEach((h, i) => {
      if (h.archived == null) h.archived = false;
      if (h.archivedOn == null) h.archivedOn = "";
      if (h.order == null) h.order = i;
    });
  },

  /* 9 → 10 · the dashboard becomes a decision page. Goals gain the fields it ranks them by, and a
     task can say how big it is, what it serves, and whether it's one of today's three — or the one
     hard thing. All additive: an existing task is simply an unprioritised, unpinned task. */
  (s) => {
    (s.goals || []).forEach(g => {
      if (g.priority == null) g.priority = "med";
      if (g.status == null) g.status = "active";
    });
    (s.todos || []).forEach(td => {
      if (td.priority == null) td.priority = "med";
      if (td.estMin == null) td.estMin = 0;
      if (td.linkGoalId == null) td.linkGoalId = "";
      if (td.projectId == null) td.projectId = "";
      if (td.focus == null) td.focus = false;
      if (td.hard == null) td.hard = false;
    });
    if (s.challenge === undefined) s.challenge = null;
  },

  /* 10 → 11 · the focus session. `focus` is the one that may be running right now; `focusLog` is
     what it left behind. Both additive — an existing save simply has no session and no history. */
  (s) => {
    if (s.focus === undefined) s.focus = null;
    if (!s.focusLog || typeof s.focusLog !== "object") s.focusLog = {};
  },

  /* 11 → 12 · habit groups. The single `challenge` object shipped in schema 10 becomes the first
     group, because a challenge IS a named set of habits that happens to have a start date and a
     length. Anyone who had one keeps it, name and dates intact. */
  (s) => {
    if (!Array.isArray(s.groups)) s.groups = [];
    if (!Array.isArray(s.quotes)) s.quotes = [];
    const c = s.challenge;
    if (c && c.name && !s.groups.some(g => g.name === c.name)) {
      s.groups.push({ id: uid(), name: c.name, emoji: "\u{1F94B}", color: "#6a5ae0",
                      start: c.start || "", days: +c.days || 0, order: 0 });
    }
    delete s.challenge;
    (s.habits || []).forEach(h => { if (h.groupId == null) h.groupId = ""; });
  },

  /* 12 → 13 · the connected ecosystem. The graph and the history log start empty; what matters here
     is `created`, and specifically what it is NOT allowed to do. It is backfilled ONLY from a date
     the record already carries. Stamping today onto a memory from last year, or inventing a
     creation date for a habit, would be the app asserting something it cannot know — the same
     discipline that stops the dashboard claiming a goal is "on track". No date, no claim. */
  (s) => {
    if (!Array.isArray(s.links)) s.links = [];
    if (!s.history || typeof s.history !== "object") s.history = {};
    const stamp = (o, d) => { if (o && o.created == null) o.created = d || ""; if (o && o.updated == null) o.updated = o.created || ""; };
    (s.goals || []).forEach(g => stamp(g, (g.progress && g.progress[0] && g.progress[0].date) || ""));
    (s.todos || []).forEach(t => stamp(t, t.from || t.date || ""));
    (s.habits || []).forEach(h => stamp(h, Object.keys(h.log || {}).sort()[0] || ""));
    (s.memories || []).forEach(m => stamp(m, m.date || ""));
    (s.journal || []).forEach(j => stamp(j, j.date || ""));
    (s.projects || []).forEach(p => stamp(p, ""));
    (s.groups || []).forEach(g => stamp(g, g.start || ""));
    ((s.social || {}).people || []).forEach(p => stamp(p, (p.touches || []).slice().sort()[0] || ""));
    (s.reading || {}).books && s.reading.books.forEach(b => stamp(b, b.started || ""));
    (s.finance || {}).entries && s.finance.entries.forEach(e => stamp(e, e.date || ""));
  },

  /* 13 → 14 · the dashboard's Active Projects card needs one thing a project didn't carry: what
     comes next. `lastWorked` is deliberately NOT stored — it is derived from focusLog, because a
     second copy of that fact is a second thing that can disagree with the first. */
  (s) => {
    (s.projects || []).forEach(p => { if (p.nextMilestone == null) p.nextMilestone = ""; });
  },

  /* 14 → 15 · calendar events. The Bible names them a core object, and the dashboard's Timeline
     needs somewhere for the things that are not a task, a meal, a workout or a habit — a lecture, a
     meeting, a train. Starts empty; `source` distinguishes hand-entered from imported. */
  (s) => { if (!Array.isArray(s.events)) s.events = []; },

  /* 15 → 16 · Goals becomes a page of its own. Two fields it never had: when you started, and tags.
     `startedOn` is backfilled from the goal's first logged progress where there is one — the same
     rule as everywhere else, a real date or none at all. It is what makes pace answerable: without
     a start there is no "you are 40% through the time and 15% through the goal". */
  (s) => {
    (s.goals || []).forEach(g => {
      if (!Array.isArray(g.tags)) g.tags = [];
      if (g.startedOn == null) g.startedOn = ((g.progress || [])[0] || {}).date || g.created || "";
    });
  },

  /* 16 → 17 · a project stops being six fields and a small form. It gains the things the Bible asks
     a project to carry: why it exists, when it runs, what it's tagged with, the milestones it's
     built from and the files that belong to it.

     `nextMilestone` — a free-text "next step" — is deliberately NOT converted into a milestone. One
     unticked milestone would read as 0%, quietly overwriting a project sitting honestly at 60%.
     It stays as the fallback next step, and `nextMilestoneOf()` prefers a real milestone once there
     is one, so the two can never disagree. */
  (s) => {
    (s.projects || []).forEach(p => {
      if (p.purpose == null) p.purpose = "";
      if (p.priority == null) p.priority = "med";
      if (p.startedOn == null) p.startedOn = p.created || "";
      if (p.deadline == null) p.deadline = "";
      if (!Array.isArray(p.tags)) p.tags = [];
      if (!Array.isArray(p.milestones)) p.milestones = [];
      if (!Array.isArray(p.files)) p.files = [];
    });
  },

  /* 17 → 18 · work sessions. A project's history was "Focused 45 min" over and over — the time, but
     never what it produced. The four reflection fields go on the focusLog row the timer already
     writes, not into a parallel log that could disagree with it.

     `doneOn` on a milestone is what makes velocity answerable. It is deliberately left BLANK on
     milestones that are already ticked: there is no record of when that happened, and inventing one
     would be the same lie as inventing a creation date. The honest consequence is that velocity
     stays silent until two milestones have been ticked under this version — which is the correct
     behaviour, not a shortcoming to paper over. */
  (s) => {
    Object.keys(s.focusLog || {}).forEach(d => (s.focusLog[d] || []).forEach(r => {
      if (r.focus == null) r.focus = 0;              // 0 = not rated
      if (r.outcome == null) r.outcome = "";
      if (r.obstacles == null) r.obstacles = "";
      if (r.next == null) r.next = "";
    }));
    (s.projects || []).forEach(p => (p.milestones || []).forEach(m => {
      if (m.doneOn == null) m.doneOn = "";
    }));
  },

  /* 18 → 19 · money stops pretending everything is dollars. `money()` hardcoded a "$", so a class
     package bought for 18,000,000 toman was displayed as $18,000,000 — the app asserting something
     plainly false about the user's own spending.

     Existing amounts are backfilled to the profile currency, because that is what they were entered
     as when there was only one. No conversion happens here: converting would require a rate nobody
     has supplied, and guessing one would corrupt every past number. */
  (s) => {
    s.profile = s.profile || {};
    if (!CURRENCIES[s.profile.currency]) s.profile.currency = "USD";
    if (s.profile.fxRate == null) s.profile.fxRate = 0;
    if (s.profile.fxSetOn == null) s.profile.fxSetOn = "";
    const def = s.profile.currency;
    ((s.finance || {}).entries || []).forEach(e => { if (!CURRENCIES[e.cur]) e.cur = def; });
    ((s.workout || {}).classes || []).forEach(c => { if (!CURRENCIES[c.cur]) c.cur = def; });
  },

  /* 19 → 20 · Training gets the two things the spec says turn logging into a journal: the skills a
     session was actually for, and what the session taught you.

     A session's new fields all start empty. `attendance` defaults to "present" because a session
     only exists at all because you logged one — an absence is something you'd have to say. */
  (s) => {
    s.workout = s.workout || {};
    if (!Array.isArray(s.workout.skills)) s.workout.skills = [];
    (s.workout.sessions || []).forEach(x => {
      if (!Array.isArray(x.skills)) x.skills = [];
      if (x.coach == null) x.coach = "";
      if (x.location == null) x.location = "";
      if (x.duration == null) x.duration = 0;
      if (x.attendance == null) x.attendance = "present";
      if (x.energy == null) x.energy = 0;
      if (x.difficulty == null) x.difficulty = 0;
      if (x.enjoyed == null) x.enjoyed = 0;
      if (x.feedback == null) x.feedback = "";
      if (x.learned == null) x.learned = "";
      if (x.reflection == null) x.reflection = "";
      if (x.nextGoal == null) x.nextGoal = "";
    });
  },

  /* 20 → 21 · Skills & Education, University and Work Preparation become one "Learning" area.

     The user's own words: "Skills and education confuse me because they have nothing I can use — I
     can just add a name and study hours and nothing else", and the same for the other two. Three
     shallow pages covering overlapping ground is worse than one real one, so they merge — and a
     course finally becomes something you can open.

     A uni assignment and a career-prep item were LITERALLY the same shape ({title, tag, due, done}),
     which is why they merge into one list with a `kind` rather than staying two of everything.
     Nothing is dropped: every course, assignment and career item is copied across before the old
     stores are removed, and the suite round-trips a real schema-20 save to prove it. */
  (s) => {
    const sk = s.skills || {}, uni = s.university || {}, wk = s.work || {};
    const L = s.learning = s.learning || {};
    if (L.monthlyHours == null) L.monthlyHours = sk.monthlyHours != null ? sk.monthlyHours : 10;
    if (L.weeklyHours == null) L.weeklyHours = uni.weeklyHours != null ? uni.weeklyHours : 20;

    if (!Array.isArray(L.courses)) {
      L.courses = (sk.courses || []).map(c => ({
        id: c.id || uid(), name: c.name || "", emoji: c.emoji || "📘",
        /* everything that was in the old area was self-directed by definition — the university
           side only ever held assignments, never courses */
        kind: "self", category: c.category || "", institution: "", instructor: "",
        start: "", targetEnd: "", credits: 0, grade: null, gradeMax: 20,
        progress: clamp(+c.progress || 0, 0, 100), link: "", notes: "",
        created: c.created || "", updated: c.updated || "",
      }));
    }
    if (!Array.isArray(L.tasks)) {
      L.tasks = [
        ...(uni.tasks || []).map(k => ({ id: k.id || uid(), title: k.title || "", kind: "university",
          tag: k.course || "", due: k.due || "", done: !!k.done,
          created: k.created || "", updated: k.updated || "" })),
        ...(wk.items || []).map(k => ({ id: k.id || uid(), title: k.title || "", kind: "career",
          tag: k.category || "Other", due: k.due || "", done: !!k.done,
          created: k.created || "", updated: k.updated || "" })),
      ];
    }
    delete s.skills; delete s.university; delete s.work;

    /* the study ledger keeps its two totals; a per-course breakdown starts EMPTY, because nothing
       ever recorded which course an hour belonged to and back-filling would be a guess */
    Object.keys((s.study || {}).log || {}).forEach(d => {
      const day = s.study.log[d];
      if (!day.courses || typeof day.courses !== "object") day.courses = {};
    });

    /* a task pointing at an area that no longer exists renders a broken chip */
    (s.todos || []).forEach(td => {
      if (td.areaId === "skills" || td.areaId === "university" || td.areaId === "work") td.areaId = "learning";
    });
  },
];

function migrate(s) {
  let v = Number.isInteger(s.schema) ? s.schema : 0;
  if (v > SCHEMA) {
    /* Written by a newer LifeHub. Refuse rather than silently mangling fields we don't understand. */
    throw Object.assign(new Error("Saved by a newer version of LifeHub"), { code: "schema-too-new" });
  }
  for (; v < SCHEMA; v++) MIGRATIONS[v](s);
  s.schema = SCHEMA;
  /* these used to be persisted; they're per-device UI state now (see `ui`) */
  delete s._cursor; delete s._readingTab; delete s._mediaTab;
  return s;
}

function load() {
  let raw = null;
  try { raw = localStorage.getItem(STORE_KEY); }
  catch { loadIssue = { kind: "unavailable" }; }        // private mode / storage blocked

  if (!raw) { state = migrate(seedState(defaultState())); save(); return; }

  try {
    state = migrate(Object.assign(defaultState(), JSON.parse(raw)));
    save();
  } catch (e) {
    /* Never overwrite data we failed to read. Park the original byte-for-byte so it stays
       recoverable, start EMPTY (sample data here reads as "my life was deleted"), and say so.
       Deliberately no save() — the untouched original must survive this session. */
    try { localStorage.setItem(CORRUPT_KEY, raw); } catch {}
    loadIssue = { kind: e && e.code === "schema-too-new" ? "too-new" : "corrupt" };
    state = migrate(defaultState());
  }
}

/* Blocking recovery prompt shown once at startup when load() couldn't read the saved data. */
function showLoadIssue() {
  if (!loadIssue) return;
  if (loadIssue.kind === "unavailable") {
    toast("This browser is blocking local storage — LifeHub can't save here");
    loadIssue = null;
    return;
  }
  const tooNew = loadIssue.kind === "too-new";
  openModal(`
    <header class="modal-head"><h3>${tooNew ? "This device is out of date" : "We couldn't open your saved data"}</h3>
      <button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body"><p class="soft">${tooNew
      ? "Your data was saved by a newer version of LifeHub, so this device can't open it safely. <b>Nothing has been changed or deleted.</b> Reload to get the latest version."
      : "Your saved data couldn't be read, so LifeHub started empty. <b>Your original data has not been overwritten</b> — download a copy before you make changes."}</p></div>
    <footer class="modal-foot">
      <button type="button" class="btn ghost" data-action="recover-download">${I.download}Download my data</button>
      ${tooNew ? `<button type="button" class="btn primary" data-action="recover-reload">Reload</button>`
               : `<button type="button" class="btn primary" data-action="recover-fresh">Start fresh</button>`}
    </footer>`);
}
function save() {
  let ok = true;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch (e) { toast("Storage is full — try removing a book cover or two"); ok = false; }
  /* mirror to the cloud (debounced) when signed in — skip while applying a remote snapshot */
  if (isSignedIn() && cloud.key && !cloud._applyingRemote) { cloud._dirty = true; schedulePush(); }
  return ok;
}

/* ================= media store (IndexedDB — for photos & video) ================= */
const MEDIA_DB = "lifehub-media";
let _mdb = null;
const _urlCache = {};
function mediaDB() {
  return new Promise((res, rej) => {
    if (_mdb) return res(_mdb);
    if (!("indexedDB" in window)) return rej(new Error("no-idb"));
    const r = indexedDB.open(MEDIA_DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains("blobs")) r.result.createObjectStore("blobs"); };
    r.onsuccess = () => { _mdb = r.result; res(_mdb); };
    r.onerror = () => rej(r.error);
  });
}
async function mediaPut(blob) {
  const id = "md_" + uid();
  const db = await mediaDB();
  await new Promise((res, rej) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").put(blob, id);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
  scheduleMediaSync();     // a new file should reach your other devices without being asked twice
  return id;
}
/* store under a KNOWN id — used when pulling a blob down from the cloud, where the id already exists
   in the synced records and must match on every device */
async function mediaPutAt(id, blob) {
  const db = await mediaDB();
  await new Promise((res, rej) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").put(blob, id);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
  return id;
}
/* cheap existence check — never pull a 200MB video into memory just to ask "is it here?" */
async function mediaHas(id) {
  try {
    const db = await mediaDB();
    return await new Promise((res) => {
      const rq = db.transaction("blobs", "readonly").objectStore("blobs").count(id);
      rq.onsuccess = () => res(rq.result > 0); rq.onerror = () => res(false);
    });
  } catch { return false; }
}
async function mediaGet(id) {
  const db = await mediaDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("blobs", "readonly");
    const rq = tx.objectStore("blobs").get(id);
    rq.onsuccess = () => res(rq.result || null); rq.onerror = () => rej(rq.error);
  });
}
/* a media ref may own a second blob (a video's poster frame) — drop both */
function dropMedia(ref) {
  if (!ref) return;
  if (typeof ref === "string") return void mediaDelete(ref);
  mediaDelete(ref.id);
  if (ref.poster) mediaDelete(ref.poster);
}
async function mediaDelete(id) {
  try {
    const db = await mediaDB();
    await new Promise((res) => { const tx = db.transaction("blobs", "readwrite"); tx.objectStore("blobs").delete(id); tx.oncomplete = res; tx.onerror = res; });
  } catch {}
  if (_urlCache[id]) { URL.revokeObjectURL(_urlCache[id]); delete _urlCache[id]; }
  mediaDeleteRemote(id);   // deleting a memory should not leave its file paid for in the cloud
}
/* wipe every stored photo/video/file (used by Start fresh / Reset) */
function clearAllMedia() {
  Object.keys(_urlCache).forEach(id => { try { URL.revokeObjectURL(_urlCache[id]); } catch {} delete _urlCache[id]; });
  try { if (_mdb) { _mdb.close(); _mdb = null; } } catch {}
  try { indexedDB.deleteDatabase(MEDIA_DB); } catch {}
}
/* The record is here but the file isn't. There are three genuinely different reasons for that, and
   guessing wrong is worse than saying nothing — so read the ref and say which one it is. */
function mediaMissingText(id) {
  const flag = blobFlag(id);
  if (flag === UP_TOOBIG) return "Too large to sync — on its own device";
  if (!isSignedIn()) return "Not on this device";
  if (flag === UP_DONE) return cloud.media.busy ? "Downloading…" : "Not downloaded yet";
  return "Added on another device";
}
/* swap [data-media] hosts for <img>/<video> from IndexedDB, after each render */
async function hydrateMedia() {
  for (const host of $$("[data-media]")) {
    const id = host.dataset.media;
    if (host.dataset.hydrated === id) continue;
    host.dataset.hydrated = id;
    try {
      let url = _urlCache[id];
      if (!url) {
        const blob = await mediaGet(id);
        if (!blob) { host.innerHTML = `<span class="media-missing">${mediaMissingText(id)}</span>`; continue; }
        url = URL.createObjectURL(blob); _urlCache[id] = url;
      }
      host.innerHTML = host.dataset.mediaKind === "video"
        ? `<video src="${url}" controls playsinline preload="metadata"></video>`
        : `<img src="${url}" alt="" loading="lazy">`;
    } catch { host.innerHTML = `<span class="media-missing">${mediaMissingText(id)}</span>`; }
  }
  healPosters();
}
/* Posters are versioned so a capture bug can be undone on devices that already ran it. A ref whose
   posterV is missing or behind is re-captured on sight and its old blob thrown away — which is how
   the black covers written by the first version of videoPoster repair themselves. */
const POSTER_V = 2;
const posterOf = (ref) => (ref && ref.poster && ref.posterV === POSTER_V) ? ref.poster : "";

let _healing = false;
async function healPosters() {
  if (_healing) return;
  const hosts = $$("[data-poster-heal]");
  if (!hosts.length) return;
  _healing = true;
  let changed = false;
  for (const host of hosts) {
    const id = host.dataset.posterHeal;
    host.removeAttribute("data-poster-heal");
    try {
      const blob = await mediaGet(id);
      if (!blob) continue;
      const poster = await new Promise(r => videoPoster(blob, r));
      if (!poster) continue;                              // no picture is better than a black one
      const pid = await mediaPut(poster);
      const refs = mediaRefsFor(id);
      if (!refs.length) { mediaDelete(pid); continue; }   // the memory went away mid-capture
      const stale = new Set();
      refs.forEach(ref => {
        if (ref.poster && ref.poster !== pid) stale.add(ref.poster);
        ref.poster = pid; ref.posterV = POSTER_V;
      });
      stale.forEach(mediaDelete);
      changed = true;
    } catch {}
  }
  _healing = false;
  if (changed) { save(); render(); }
}
/* every stored media ref pointing at one blob, wherever in state it lives */
function mediaRefsFor(id) {
  const out = [];
  const scan = (arr) => (arr || []).forEach(p => { if (p && p.id === id) out.push(p); });
  (state.memories || []).forEach(m => scan(m.photos));
  ((state.workout || {}).sessions || []).forEach(s => scan(s.media));
  Object.values((state.nutrition || {}).photos || {}).forEach(day => Object.values(day || {}).forEach(scan));
  return out;
}
/* Decode a data: URL straight to a Blob. This used to go through `fetch(dataUrl)`, which works but
   is a network API doing a string conversion — and the moment the app got a Content-Security-Policy,
   `connect-src` refused it and saving a photo broke. Decoding it directly is faster, has no failure
   mode, and doesn't require punching a hole in the policy. */
function dataUrlToBlob(dataUrl) {
  const [head, b64] = String(dataUrl).split(",");
  const mime = (head.match(/^data:([^;]+)/) || [])[1] || "application/octet-stream";
  const bin = atob(b64 || "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
/* read a File into IndexedDB; images are downscaled unless they're already small */
const MB = (n) => Math.round(n / 1024 / 1024);
const fileSize = (n) => n >= 1024 * 1024 ? MB(n) + "MB" : Math.max(1, Math.round(n / 1024)) + "KB";
const VIDEO_MAX_MB = 300;   // a phone clip is often 130-400MB per minute; 60MB rejected almost everything
function storeMediaFile(file, cb) {
  if (!file) return;
  const kind = file.type.startsWith("video") ? "video" : "image";
  if (kind === "video" && file.size > VIDEO_MAX_MB * 1024 * 1024) {
    toast(`That clip is ${fileSize(file.size)} — too big to store. Trim it under ${VIDEO_MAX_MB}MB and try again.`);
    return;
  }
  /* only worth saying for clips big enough that the save takes a visible moment */
  if (kind === "video" && file.size > 8 * 1024 * 1024) toast(`Saving ${fileSize(file.size)} video…`);
  const finish = (blob, extra) => mediaPut(blob).then(id => cb(Object.assign({ id, kind }, extra || {}))).catch((e) => toast(`Couldn't save that ${kind} — ${e && e.name === "QuotaExceededError" ? "this device is out of storage" : "storage refused it"}`));
  if (kind === "image") {
    processCover(file, (dataUrl) => finish(dataUrlToBlob(dataUrl)), 900);
  } else {
    /* grab a still first so the clip has a real cover instead of a black rectangle */
    videoPoster(file, (poster) => {
      if (!poster) return finish(file);
      mediaPut(poster).then(pid => finish(file, { poster: pid, posterV: POSTER_V })).catch(() => finish(file));
    });
  }
}
/* Is this canvas an actual picture, or the flat nothing you get from an undecoded video?
   Flat AND dark is the signature of a frame that never arrived — a real dark shot still has
   grain and spread. Sampled sparsely; this runs on every capture attempt. */
function frameLooksBlank(g, w, h) {
  let min = 255, max = 0, sum = 0, n = 0;
  const d = g.getImageData(0, 0, w, h).data;
  for (let i = 0; i < d.length; i += 4 * 37) {
    const l = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    if (l < min) min = l;
    if (l > max) max = l;
    sum += l; n++;
  }
  return n === 0 || ((max - min) < 6 && sum / n < 24);
}

/* Capture a frame from a video so it can stand in as cover art. Always calls back — with null when
   the browser genuinely can't give us a picture — so an upload never stalls on this.

   Three things here exist specifically for iOS, which is where the first version of this failed:
     · the element must be IN the document to decode at all (and `display:none` counts as absent),
     · `preload="metadata"` yields dimensions but no frame to draw, so it has to be "auto",
     · frames often don't arrive until the video has actually played, so we start muted inline
       playback and pause once data lands.
   And regardless of platform, a captured frame is CHECKED before it's accepted: a black rectangle
   is worse than no poster, because it looks like a broken app rather than a missing feature. */
function videoPoster(file, cb) {
  let url = "", done = false, times = null, idx = 0;
  const v = document.createElement("video");
  const c = document.createElement("canvas");

  const finish = (blob) => {
    if (done) return; done = true;
    clearTimeout(timer);
    try { v.pause(); v.removeAttribute("src"); v.load(); v.remove(); } catch {}
    if (url) URL.revokeObjectURL(url);
    cb(blob || null);
  };
  const timer = setTimeout(() => finish(null), 12000);

  const capture = () => {
    if (done) return;
    const w = v.videoWidth, h = v.videoHeight;
    if (!w || !h) return next();
    const scale = Math.min(1, 900 / Math.max(w, h));
    c.width = Math.round(w * scale); c.height = Math.round(h * scale);
    const g = c.getContext("2d");
    try { g.drawImage(v, 0, 0, c.width, c.height); } catch { return finish(null); }
    if (frameLooksBlank(g, c.width, c.height)) return next();   // undecoded, or a genuinely black moment
    try { c.toBlob(b => finish(b), "image/jpeg", 0.82); } catch { finish(null); }
  };
  /* try a few points spread through the clip rather than betting everything on one timestamp */
  const next = () => {
    if (done) return;
    if (!times || idx >= times.length) return finish(null);
    const t = times[idx++];
    if (Math.abs(v.currentTime - t) < 0.03) capture();
    else { try { v.currentTime = t; } catch { finish(null); } }
  };

  try {
    v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", ""); v.setAttribute("muted", "");
    v.muted = true; v.playsInline = true; v.preload = "auto";
    v.style.cssText = "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none";
    v.onerror = () => finish(null);
    v.onseeked = capture;
    v.onloadedmetadata = () => { try { const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch {} };
    v.onloadeddata = () => {
      if (times) return;                       // fires again after each seek; only plan once
      try { v.pause(); } catch {}
      const d = isFinite(v.duration) && v.duration > 0 ? v.duration : 0;
      times = d > 1 ? [Math.min(0.7, d / 6), d * 0.35, d * 0.6] : [0];
      next();
    };
    url = URL.createObjectURL(file);
    document.body.appendChild(v);
    v.src = url;
    v.load();
  } catch { finish(null); }
}
/* store an arbitrary file (e.g. a book PDF/EPUB) in IndexedDB */
function storeFile(file, cb) {
  if (!file) return;
  if (file.size > 100 * 1024 * 1024) { toast("That file is over 100MB — too large to store here"); return; }
  mediaPut(file).then(id => cb({ id, kind: "file", name: file.name, type: file.type || "" }))
    .catch(() => toast("Couldn't save that file"));
}

/* ================= cloud sync (Supabase — Auth + REST via fetch; zero-knowledge E2E) =================
   Free cross-device sync. Local-first: localStorage stays the source of truth, the cloud is only an
   encrypted mirror. The whole `state` blob is encrypted in the browser (WebCrypto AES-GCM, key derived
   from the account password with PBKDF2) BEFORE upload — the server only ever stores ciphertext. Row-Level
   Security means each account can read/write only its own row. Runs on a live HTTPS origin only (won't
   work inside the CSP-locked artifact — same caveat as book/movie search). */
const SUPABASE_URL  = "https://kkorqjoltzkgrtngmaiy.supabase.co";
const SUPABASE_ANON = "sb_publishable_phHHeh4YTbPyxxfHpVIXSA_q6RyfNce";
/* Web-push public key (safe to ship — it's the public half). Generate a pair and paste the public
   one here; see supabase/README.md. Empty means closed-app push simply isn't offered, so a
   deployment that was never configured for it can't send anything. */
const VAPID_PUBLIC = "";
const SESSION_KEY  = "lifehub-session";   // {access_token,refresh_token,expires_at,email,user_id,salt,keyRaw}
const SYNCMETA_KEY = "lifehub-sync";      // {userId,version,updatedAt}

const cloud = { session: null, key: null, status: "idle", lastSync: 0, _pushT: null, _busy: false, _dirty: false, _applyingRemote: false, _conflictRemote: null,
  media: { busy: false, done: 0, total: 0, failed: 0, dir: "", lastRun: 0 } };

/* base64 <-> ArrayBuffer */
function bufToB64(buf) { const b = new Uint8Array(buf); let s = ""; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
function b64ToBuf(b64) { const bin = atob(b64); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b.buffer; }

/* ---- WebCrypto: AES-GCM key from password + salt (PBKDF2) ---- */
async function deriveKey(password, saltB64) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new Uint8Array(b64ToBuf(saltB64)), iterations: 200000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
async function encryptState(obj, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return { ciphertext: bufToB64(ct), iv: bufToB64(iv.buffer) };
}
async function decryptSnapshot(row, key) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(b64ToBuf(row.iv)) }, key, b64ToBuf(row.ciphertext));
  return JSON.parse(new TextDecoder().decode(pt));
}
const randomSaltB64 = () => bufToB64(crypto.getRandomValues(new Uint8Array(16)).buffer);

/* ---- session + sync-meta persistence ---- */
function loadSession() { try { cloud.session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { cloud.session = null; } }
function saveSession() { if (cloud.session) localStorage.setItem(SESSION_KEY, JSON.stringify(cloud.session)); else localStorage.removeItem(SESSION_KEY); }
function getSyncMeta() { try { return JSON.parse(localStorage.getItem(SYNCMETA_KEY) || "null"); } catch { return null; } }
function setSyncMeta(m) { if (m) localStorage.setItem(SYNCMETA_KEY, JSON.stringify(m)); else localStorage.removeItem(SYNCMETA_KEY); }
const isSignedIn = () => !!(cloud.session && cloud.session.access_token);
function baseVersion() { const m = getSyncMeta(); return (m && cloud.session && m.userId === cloud.session.user_id) ? m.version : 0; }

/* restore the cached crypto key on startup (local state is already plaintext, so caching adds no exposure) */
async function restoreKey() {
  if (!cloud.session || !cloud.session.keyRaw) { cloud.key = null; return; }
  try { cloud.key = await crypto.subtle.importKey("raw", b64ToBuf(cloud.session.keyRaw), { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]); }
  catch { cloud.key = null; }
}
async function cacheKey(key, saltB64) {
  cloud.session.keyRaw = bufToB64(await crypto.subtle.exportKey("raw", key));
  cloud.session.salt = saltB64;
  saveSession();
}

/* ---- GoTrue auth (fetch) ---- */
async function authRequest(path, body) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON }, body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error_description || data.msg || data.error || `Request failed (${r.status})`);
  return data;
}
function storeAuth(d) {
  cloud.session = Object.assign(cloud.session || {}, {
    access_token: d.access_token, refresh_token: d.refresh_token,
    expires_at: Date.now() + (d.expires_in || 3600) * 1000,
    email:   (d.user && d.user.email) || (cloud.session && cloud.session.email) || "",
    user_id: (d.user && d.user.id)    || (cloud.session && cloud.session.user_id) || "",
  });
  saveSession();
}
async function authSignup(email, password) {
  const d = await authRequest("signup", { email, password });
  if (!d.access_token) throw new Error("Almost there — check your email to confirm your address, then sign in.");
  storeAuth(d); return d;
}
async function authSignin(email, password) { storeAuth(await authRequest("token?grant_type=password", { email, password })); }
async function authRefresh() {
  if (!cloud.session || !cloud.session.refresh_token) throw new Error("no-refresh");
  storeAuth(await authRequest("token?grant_type=refresh_token", { refresh_token: cloud.session.refresh_token }));
}
function authSignout() { cloud.session = null; cloud.key = null; cloud.status = "idle"; cloud._dirty = false; saveSession(); setSyncMeta(null); }

/* ---- authenticated REST (PostgREST), refresh once on 401 ---- */
async function restFetch(path, opts = {}, retry = true) {
  const headers = Object.assign({ apikey: SUPABASE_ANON, Authorization: `Bearer ${cloud.session.access_token}`, "Content-Type": "application/json" }, opts.headers || {});
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, Object.assign({}, opts, { headers }));
  if (r.status === 401 && retry) { await authRefresh(); return restFetch(path, opts, false); }
  return r;
}
async function fetchRemoteRow() {
  const r = await restFetch(`snapshots?user_id=eq.${cloud.session.user_id}&select=*`, { method: "GET" });
  if (!r.ok) throw new Error(`Fetch failed (${r.status})`);
  const rows = await r.json();
  return (rows && rows[0]) || null;
}
async function upsertRow(row) {
  const r = await restFetch("snapshots", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
  if (!r.ok) throw new Error(`Push failed (${r.status})`);
}

/* ---- sync status (live badge in the Account card) ---- */
function timeAgo(t) {
  if (!t) return "";
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return s + "s ago";
  const m = Math.round(s / 60); if (m < 60) return m + "m ago";
  const h = Math.round(m / 60); if (h < 24) return h + "h ago";
  return Math.round(h / 24) + "d ago";
}
function syncLabel() {
  switch (cloud.status) {
    case "syncing":  return { cls: "syncing", txt: "Syncing…" };
    case "synced":   return { cls: "ok",  txt: "Synced " + timeAgo(cloud.lastSync) };
    case "offline":  return { cls: "off", txt: "Offline — will sync when back online" };
    case "conflict": return { cls: "err", txt: "Paused — needs your choice" };
    case "error":    return { cls: "err", txt: "Sync error — tap Sync now" };
    default:         return { cls: "",    txt: "Not synced yet" };
  }
}
function setSyncStatus(s) {
  cloud.status = s;
  if (s === "synced") cloud.lastSync = Date.now();
  const el = document.querySelector("[data-sync-status]");
  if (el) { const { cls, txt } = syncLabel(); el.className = "sync-badge " + cls; el.textContent = txt; }
}

/* ---- sync engine ---- */
/* Never upload while the local copy is untrustworthy: if we couldn't read local data, or the last
   pull failed, pushing would overwrite good cloud data with an empty or stale snapshot. */
function syncBlocked() { return !!loadIssue || !!cloud._pullFailed; }

function schedulePush() {
  if (!isSignedIn() || !cloud.key || syncBlocked()) return;
  clearTimeout(cloud._pushT);
  cloud._pushT = setTimeout(() => pushSnapshot(), 2500);
}
async function pushSnapshot(force = false) {
  if (!isSignedIn() || !cloud.key || cloud._busy || syncBlocked()) return;
  if (!cloud.session.salt) { setSyncStatus("error"); return; }
  cloud._busy = true; setSyncStatus("syncing");
  try {
    const base = baseVersion();
    const remote = await fetchRemoteRow();
    if (remote && remote.version > base && !force) { cloud._busy = false; setSyncStatus("conflict"); promptConflict(remote); return; }
    const version = (remote ? remote.version : base) + 1;
    const enc = await encryptState(state, cloud.key);
    const updated_at = new Date().toISOString();
    await upsertRow({ user_id: cloud.session.user_id, ciphertext: enc.ciphertext, iv: enc.iv, salt: cloud.session.salt, version, updated_at });
    setSyncMeta({ userId: cloud.session.user_id, version, updatedAt: updated_at });
    cloud._dirty = false; setSyncStatus("synced");
  } catch (e) {
    setSyncStatus(navigator.onLine === false ? "offline" : "error");
  } finally { cloud._busy = false; }
}
async function pullSnapshot(opts = {}) {
  if (!isSignedIn() || !cloud.key || cloud._busy) return;
  cloud._busy = true; setSyncStatus("syncing");
  try {
    const remote = await fetchRemoteRow();
    if (!remote) { cloud._busy = false; await pushSnapshot(true); return; }   // seed the cloud from this device
    const base = baseVersion();
    if (remote.version > base || opts.force) {
      const incoming = migrate(Object.assign(defaultState(), await decryptSnapshot(remote, cloud.key)));
      cloud._applyingRemote = true;
      state = incoming;
      setSyncMeta({ userId: cloud.session.user_id, version: remote.version, updatedAt: remote.updated_at });
      save();
      cloud._applyingRemote = false;
      cloud._dirty = false; cloud._pullFailed = false; setSyncStatus("synced");
      applyTheme(); render();
    } else {
      cloud._pullFailed = false;
      setSyncStatus("synced");
      if (cloud._dirty) schedulePush();
    }
  } catch (e) {
    cloud._applyingRemote = false;
    /* a failed pull blocks pushes (see syncBlocked) so we can't clobber good cloud data */
    cloud._pullFailed = true;
    setSyncStatus("error");
    if (e && e.code === "schema-too-new") toast("Your account was synced from a newer LifeHub — reload this page to update");
    else if (e && /decrypt/i.test(e.name + e.message)) toast("Couldn't decrypt your cloud data — is the password correct?");
    else { cloud._pullFailed = navigator.onLine !== false; setSyncStatus(navigator.onLine === false ? "offline" : "error"); }
  } finally { cloud._busy = false; }
  scheduleMediaSync();
}

/* ================= media sync (Supabase Storage — same zero-knowledge rule) ==========================
   Until now the *record* synced and the *file* stayed put, so a memory added on the iPad showed an
   empty frame on the phone. Files now travel too, encrypted in the browser exactly like the snapshot:
   the server stores ciphertext it cannot read, and each account can only touch its own folder.

   Two deliberate limits, both surfaced in the UI rather than hidden:
     · a size cap, because a 300MB clip is both a memory problem on a phone (encrypting it needs the
       file twice over in RAM) and most of a free storage tier. Over the cap the file stays on its own
       device — but its POSTER still syncs, so the memory still looks like itself everywhere;
     · nothing is ever deleted from a device to save space. This adds copies, it doesn't move them. */
const MEDIA_BUCKET = "media";
const MEDIA_SYNC_MAX = 40 * 1024 * 1024;
const UP_DONE = 1, UP_TOOBIG = "x";     // per-blob cloud state, recorded on the ref itself

/* Encrypt a blob for upload. The MIME type goes INSIDE the ciphertext — the server shouldn't learn
   whether you stored a photo or a video any more than it learns what's in it. */
async function encryptBlob(blob, key) {
  const mime = new TextEncoder().encode((blob.type || "application/octet-stream").slice(0, 120));
  const body = new Uint8Array(await blob.arrayBuffer());
  const plain = new Uint8Array(1 + mime.length + body.length);
  plain[0] = mime.length; plain.set(mime, 1); plain.set(body, 1 + mime.length);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv, 0); out.set(ct, 12);
  return out;
}
async function decryptBlob(bytes, key) {
  const pt = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12)));
  const n = pt[0];
  return new Blob([pt.slice(1 + n)], { type: new TextDecoder().decode(pt.slice(1, 1 + n)) });
}

async function storageFetch(path, opts = {}, retry = true) {
  const headers = Object.assign({ apikey: SUPABASE_ANON, Authorization: `Bearer ${cloud.session.access_token}` }, opts.headers || {});
  const r = await fetch(`${SUPABASE_URL}/storage/v1/${path}`, Object.assign({}, opts, { headers }));
  if (r.status === 401 && retry) { await authRefresh(); return storageFetch(path, opts, false); }
  return r;
}
const mediaKey = (id) => `${cloud.session.user_id}/${id}`;

async function mediaUploadOne(id) {
  const blob = await mediaGet(id);
  if (!blob) return "missing";
  if (blob.size > MEDIA_SYNC_MAX) return "big";
  const r = await storageFetch(`object/${MEDIA_BUCKET}/${mediaKey(id)}`, {
    method: "POST", headers: { "Content-Type": "application/octet-stream", "x-upsert": "true" },
    body: await encryptBlob(blob, cloud.key),
  });
  if (!r.ok) throw new Error("upload " + r.status);
  return "ok";
}
async function mediaDownloadOne(id) {
  const r = await storageFetch(`object/${MEDIA_BUCKET}/${mediaKey(id)}`, { method: "GET" });
  if (r.status === 404 || r.status === 400) return "gone";
  if (!r.ok) throw new Error("download " + r.status);
  await mediaPutAt(id, await decryptBlob(new Uint8Array(await r.arrayBuffer()), cloud.key));
  return "ok";
}
function mediaDeleteRemote(id) {
  if (!isSignedIn()) return;   // an orphan left by a signed-out delete is swept by the GC later
  storageFetch(`object/${MEDIA_BUCKET}/${mediaKey(id)}`, { method: "DELETE" }).catch(() => {});
}

/* every media ref anywhere in state, and every blob each one owns */
function allMediaRefs() {
  const out = [];
  const scan = (arr) => (arr || []).forEach(p => { if (p && p.id) out.push(p); });
  (state.memories || []).forEach(m => scan(m.photos));
  ((state.workout || {}).sessions || []).forEach(s => scan(s.media));
  Object.values((state.nutrition || {}).photos || {}).forEach(day => Object.values(day || {}).forEach(scan));
  ((state.reading || {}).books || []).forEach(b => { if (b && b.file && b.file.id) out.push(b.file); });
  return out;
}
const refBlobs = (ref) => ref.poster ? [{ id: ref.id, flag: "up" }, { id: ref.poster, flag: "pup" }] : [{ id: ref.id, flag: "up" }];

/* Read and write a blob's cloud state BY ID rather than through a held reference: a pull can replace
   the whole `state` object mid-transfer, and a mutation applied to the old one would vanish. */
function blobFlag(id) {
  for (const ref of allMediaRefs()) {
    if (ref.id === id) return ref.up;
    if (ref.poster === id) return ref.pup;
  }
  return undefined;
}
function markBlob(id, value) {
  let hit = false;
  allMediaRefs().forEach(ref => {
    if (ref.id === id) { ref.up = value; hit = true; }
    if (ref.poster === id) { ref.pup = value; hit = true; }
  });
  return hit;
}

/* What needs to move, and which way. A blob the ref says is uploaded but that isn't here came from
   another device; a blob that's here but unmarked has never been sent. */
async function mediaPlan() {
  const up = [], down = [], seen = new Set();
  for (const ref of allMediaRefs()) {
    for (const b of refBlobs(ref)) {
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      const mark = ref[b.flag], here = await mediaHas(b.id);
      if (here) { if (mark !== UP_DONE && mark !== UP_TOOBIG) up.push({ ref, id: b.id, flag: b.flag }); }
      else if (mark === UP_DONE) down.push({ ref, id: b.id, flag: b.flag });
    }
  }
  return { up, down };
}

function mediaLabel() {
  const m = cloud.media;
  if (m.busy) return m.total ? `${m.dir} ${Math.min(m.done + 1, m.total)} of ${m.total}…` : "Checking files…";
  if (m.failed) return `${m.failed} file${m.failed === 1 ? "" : "s"} didn't transfer — try again`;
  if (m.lastRun) return m.total ? `${m.total} file${m.total === 1 ? "" : "s"} synced ${timeAgo(m.lastRun)}` : "All files synced";
  return "Not checked yet";
}
function setMediaStatus() {
  const el = document.querySelector("[data-media-status]");
  if (el) el.textContent = mediaLabel();
}

let _mediaT = null;
function scheduleMediaSync() {
  if (!isSignedIn() || !cloud.key) return;
  clearTimeout(_mediaT);
  _mediaT = setTimeout(() => syncMedia(), 4000);
}
async function syncMedia(opts = {}) {
  const m = cloud.media;
  if (!isSignedIn() || !cloud.key || syncBlocked() || m.busy) return 0;
  m.busy = true; m.done = 0; m.total = 0; m.failed = 0; m.dir = "Checking";
  setMediaStatus();
  let changed = false;
  try {
    const plan = await mediaPlan();
    m.total = plan.up.length + plan.down.length;
    setMediaStatus();
    const run = async (items, dir, fn) => {
      m.dir = dir;
      for (const it of items) {
        try {
          const r = await fn(it.id);
          if (r === "ok") changed = markBlob(it.id, UP_DONE) || changed;
          else if (r === "big") changed = markBlob(it.id, UP_TOOBIG) || changed;
          else if (r === "gone") changed = markBlob(it.id, 0) || changed;   // deleted from another device
        } catch { m.failed++; }
        m.done++; setMediaStatus();
      }
    };
    await run(plan.up, "Uploading", mediaUploadOne);
    await run(plan.down, "Downloading", mediaDownloadOne);
    if (opts.gc) await gcRemoteMedia().catch(() => {});
    m.lastRun = Date.now();
  } catch { m.failed++; }
  m.busy = false; m.dir = "";
  if (changed) { save(); render(); }
  setMediaStatus();
  return m.total;
}

/* Files whose records are gone — a deleted memory, a cleared meal photo — shouldn't sit in storage
   forever burning quota. Runs on an explicit sync, not on every automatic one. */
async function gcRemoteMedia() {
  const r = await storageFetch(`object/list/${MEDIA_BUCKET}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: cloud.session.user_id + "/", limit: 1000 }),
  });
  if (!r.ok) return 0;
  const rows = await r.json().catch(() => []);
  const keep = new Set();
  allMediaRefs().forEach(ref => refBlobs(ref).forEach(b => keep.add(b.id)));
  const dead = (rows || []).map(x => x && x.name).filter(n => n && !keep.has(n));
  if (!dead.length) return 0;
  await storageFetch(`object/${MEDIA_BUCKET}`, {
    method: "DELETE", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: dead.map(n => `${cloud.session.user_id}/${n}`) }),
  });
  return dead.length;
}

/* ---- conflict (two devices diverged) ---- */
function promptConflict(remote) {
  cloud._conflictRemote = remote;
  openModal(`
    <header class="modal-head"><h3>Sync conflict</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body"><p class="soft">This account was changed on another device since this one last synced. Which version should win? The other is kept in the cloud history either way.</p></div>
    <footer class="modal-foot">
      <button type="button" class="btn ghost" data-action="conflict-keep-remote">Load the other device</button>
      <button type="button" class="btn primary" data-action="conflict-keep-local">Keep this device</button>
    </footer>`);
}

/* ---- sign in / sign up (async; called from the auth form) ---- */
function openAuthModal(mode) {
  const signup = mode === "signup";
  openModal(`
    <form data-submit="${signup ? "auth-signup" : "auth-signin"}">
      <header class="modal-head"><h3>${signup ? "Create your free account" : "Sign in"}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
      <div class="modal-body">
        <p class="soft" style="margin-bottom:12px">${signup
          ? "Free forever. Your data is encrypted on this device before it's uploaded — no one but you can read it."
          : "Welcome back — sign in to sync this device with your account."}</p>
        ${fld("Email", `<input type="email" name="email" required autocomplete="email" placeholder="you@email.com">`)}
        ${fld("Password", `<input type="password" name="password" required minlength="6" autocomplete="${signup ? "new-password" : "current-password"}" placeholder="${signup ? "At least 6 characters" : "Your password"}">`)}
        ${signup ? `<p class="soft note">${I.zap} Remember this password — it also encrypts your data. If you ever forget it your cloud copy can't be decrypted, but your data stays safe on this device.</p>` : ""}
      </div>
      <footer class="modal-foot">
        <button type="button" class="btn ghost" data-action="${signup ? "auth-switch-signin" : "auth-switch-signup"}">${signup ? "I already have an account" : "Create an account"}</button>
        <button type="submit" class="btn primary">${signup ? "Create account" : "Sign in"}</button>
      </footer>
    </form>`);
}
async function doAuth(mode, email, password) {
  const btn = document.querySelector("#modal button[type=submit]");
  const reset = () => { if (btn) { btn.disabled = false; btn.textContent = mode === "signup" ? "Create account" : "Sign in"; } };
  if (btn) { btn.disabled = true; btn.textContent = mode === "signup" ? "Creating…" : "Signing in…"; }
  try {
    if (mode === "signup") await authSignup(email, password); else await authSignin(email, password);
    const remote = await fetchRemoteRow();
    const salt = (remote && remote.salt) || randomSaltB64();
    cloud.key = await deriveKey(password, salt);
    await cacheKey(cloud.key, salt);
    setSyncMeta(null);
    closeModal();
    toast(mode === "signup" ? "Account created 🎉 Syncing…" : "Signed in ✓ Syncing…");
    render();
    await pullSnapshot({ force: !!remote });
  } catch (e) { reset(); toast(e.message || "Something went wrong"); }
}
async function initCloud() {
  loadSession();
  if (!isSignedIn()) return;
  await restoreKey();
  if (cloud.key) pullSnapshot(); else setSyncStatus("error");
}

/* ================= day navigation (Habits / Workout / Skills) ================= */
function dayCursor(view) { return ui.cursor[view] || todayIso(); }
function setCursor(view, d) { ui.cursor[view] = d; }
function dayNav(view) {
  const d = dayCursor(view), atToday = d >= todayIso();
  return `<div class="day-nav">
    <button class="icon-btn ghost" data-action="day-prev" data-view="${view}" aria-label="Previous day">${I.chevL}</button>
    <div class="day-nav-lbl">
      <b>${d === todayIso() ? "Today" : niceDate(d, { weekday: "short", month: "short", day: "numeric" })}</b>
      ${d !== todayIso() ? `<button class="btn tiny ghost" data-action="day-today" data-view="${view}">Jump to today</button>` : ""}
    </div>
    <button class="icon-btn ghost" data-action="day-next" data-view="${view}" ${atToday ? "disabled" : ""} aria-label="Next day">${I.chevR}</button>
  </div>`;
}

/* ================= gamification ================= */
function levelInfo(xp = state.xp) {
  let lvl = 1, need = 400, rem = xp;
  while (rem >= need && lvl < 99) { rem -= need; lvl++; need = Math.round(need * 1.16 / 10) * 10; }
  return { lvl, into: rem, need, pct: Math.round(100 * rem / need) };
}

function addXp(n, label) {
  const before = levelInfo().lvl;
  state.xp += n;
  const t = todayIso();
  state.xpLog[t] = (state.xpLog[t] || 0) + n;
  const after = levelInfo().lvl;
  toast(`+${n} XP${label ? " · " + label : ""}`, "xp");
  if (after > before) { toast(`Level up! You reached level ${after} 🎉`, "level"); celebrate(); }
  checkBadges();
  save();
  renderTopbar();
}

/* ----- habit model: entry / type / cadence ----- */
/* entry is legacy `true` or {done, amount, note, skip, slip, workoutId} */
function habitEntry(h, d) { const v = h.log[d]; return v === true ? { done: true } : (v || null); }
function ensureHabitEntry(h, d) {
  let e = h.log[d];
  if (e === true) e = { done: true };
  if (!e || typeof e !== "object") e = {};
  h.log[d] = e;
  return e;
}
const WEEKDAY_MON0 = (d) => (new Date(d + "T12:00:00").getDay() + 6) % 7; // 0=Mon..6=Sun
function isScheduled(h, d) {
  /* Archiving must not rewrite the past: a habit you retire today stops being "due" from the archive
     date FORWARD, so last week's streak, perfect days and heatmap stay exactly as they were. This one
     line covers the due/rest lists, isPerfectDay, missions, reminders, area progress and the dashboard
     chips — every one of them already filters through here. */
  if (h.archived && h.archivedOn && d >= h.archivedOn) return false;
  const c = h.cadence || { mode: "daily" };
  if (c.mode === "days") return (c.days || []).includes(WEEKDAY_MON0(d));
  return true; // daily & perWeek: every day is an opportunity
}
function isSkipped(h, d) { const e = habitEntry(h, d); return !!(e && e.skip); }
/* did the habit's goal get met that day? */
function workoutDone(d) { return ((state.workout.log[d] || []).length) > 0; }
/* A habit can be FED by the area that already records the same fact, so you never log it twice.
   "workout" was the first of these; the rest generalize the same idea. */
const HABIT_SOURCES = [
  { id: "workout", area: "workout", label: "Workout — logging a session completes it" },
  { id: "reading", area: "reading", label: "Reading — pages you log on a book", unit: "pages" },
  { id: "water",   area: "health",  label: "Health — water you log", unit: "L" },
  { id: "steps",   area: "health",  label: "Health — steps you log", unit: "steps" },
  { id: "sleep",   area: "health",  label: "Health — hours you slept", unit: "h" },
  { id: "study",   area: "learning", label: "Study — minutes logged (self-directed + coursework)", unit: "min" },
];
const habitSource = (h) => HABIT_SOURCES.find(x => x.id === h.kind) || null;
const pagesOn = (d) => +state.reading.log[d] || 0;
/* only forward progress counts — correcting a page number down shouldn't erase the day's reading */
function logPages(delta, d) { if (delta > 0) { const t = d || todayIso(); state.reading.log[t] = pagesOn(t) + delta; } }
function sourceAmount(kind, d) {
  switch (kind) {
    case "reading": return pagesOn(d);
    case "water":   return healthOn(d).water || 0;
    case "steps":   return healthOn(d).steps || 0;
    case "sleep":   return healthOn(d).sleep || 0;
    case "study":   return studyMins(d);
    default:        return 0;
  }
}
/* A fed habit's "+" must write to the AREA it reads from. Writing to the habit instead would store a
   number habitAmount() ignores, so the tap would silently do nothing — which is exactly what it did. */
const currentBooks = () => state.reading.books.filter(b => b.status === "current");
function applyPages(b, n, d) {
  const from = b.page || 0;
  b.page = clamp(from + n, 0, b.pages || 999999);
  logPages(b.page - from, d);
}
function logToSource(h, n) {
  const d = dayCursor("habits");
  switch (h.kind) {
    case "water": case "steps": case "sleep": {
      const l = state.health.log[d] = healthOn(d);
      l[h.kind] = Math.max(0, Math.round(((l[h.kind] || 0) + n) * 100) / 100);
      if (h.kind === "sleep") l.sleep = clamp(l.sleep, 0, 24);
      return true;
    }
    case "study": {
      const day = state.study.log[d] = state.study.log[d] || {};
      day.skills = Math.max(0, (day.skills || 0) + n);
      return true;
    }
    case "reading": {
      const cur = currentBooks();
      if (!cur.length) { toast("Start reading a book first 📖"); go("reading"); return false; }
      if (cur.length === 1) { applyPages(cur[0], n, d); return true; }
      openBookPicker(n, d);          // more than one on the go — ask which
      return false;
    }
    default: return false;
  }
}
function openBookPicker(n, d) {
  openModal(`
    <header class="modal-head"><h3>Which book?</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body"><p class="soft" style="margin-bottom:10px">Add ${n} page${n > 1 ? "s" : ""} to…</p>
      <ul class="link-list">${currentBooks().map(b => `
        <li><button class="pick-book" data-action="book-log-pages" data-id="${b.id}" data-n="${n}" data-d="${d || todayIso()}">
          <span class="book-cover sm ${b.cover ? "" : "ph"}" ${b.cover ? `style="background-image:url('${safeUrl(b.cover)}')"` : ""}>${b.cover ? "" : esc(b.emoji || "📘")}</span>
          <span class="row-txt"><b>${esc(b.title)}</b><small>page ${b.page || 0}${b.pages ? " of " + b.pages : ""}</small></span>
        </button></li>`).join("")}</ul></div>`);
}

/* a fed habit's amount is DERIVED from its area — never entered twice, so it can't drift */
function habitAmount(h, d) {
  if (h.kind && h.kind !== "workout") return sourceAmount(h.kind, d);
  const e = habitEntry(h, d);
  return (e && e.amount) || 0;
}
function habitMet(h, d) {
  const e = habitEntry(h, d);
  // a workout habit is one with your Workout section: logging a session IS completing it
  if (h.kind === "workout") return workoutDone(d) || !!(e && e.done);
  if (h.type === "avoid") return !(e && e.slip);
  if (h.type === "quantity") return habitAmount(h, d) >= (h.target || 1);
  if (h.kind) return habitAmount(h, d) > 0 || !!(e && e.done);   // build habit fed by an area
  return !!(e && e.done);
}
const habitDone = habitMet; // back-compat alias used across views
function habitStep(h) { const t = h.target || 1; return h.step || (t >= 8 ? Math.round(t / 8) : (t <= 3 ? 0.25 : 1)); }
function toggleHabit(id) {
  const h = state.habits.find(x => x.id === id); if (!h) return;
  const d = dayCursor("habits");
  if (h.type === "avoid") { const e = ensureHabitEntry(h, d); e.slip = !e.slip; save(); return; }
  if (h.type === "quantity") {
    const met = habitMet(h, d), e = ensureHabitEntry(h, d);
    if (met) e.amount = 0; else { e.amount = h.target || 1; if (d === todayIso()) addXp(10, h.name); }
    save(); return;
  }
  if (habitMet(h, d)) { const e = habitEntry(h, d); if (e) { delete e.done; if (!e.note && !e.workoutId && !e.skip) delete h.log[d]; } }
  else { const e = ensureHabitEntry(h, d); e.done = true; if (d === todayIso()) addXp(10, h.name); }
  save();
}
function addHabitAmount(h, d, n) {
  const was = habitMet(h, d), e = ensureHabitEntry(h, d);
  e.amount = Math.max(0, Math.round(((e.amount || 0) + n) * 100) / 100);
  if (!was && habitMet(h, d) && d === todayIso()) addXp(10, h.name);
  save();
}
/* "habits I'm currently doing", in display order. `state.habits` stays the full record — history and
   lookups by id must still find an archived one. */
const liveHabits = () => state.habits.filter(h => !h.archived).sort((a, b) => (a.order || 0) - (b.order || 0));
const archivedHabits = () => state.habits.filter(h => h.archived);
const nextHabitOrder = () => state.habits.reduce((m, h) => Math.max(m, h.order || 0), 0) + 1;
/* the goal picker offers live habits, plus any archived one this goal ALREADY links — hiding that
   would look like the link had been silently dropped */
const goalPickHabits = (g) => state.habits.filter(h => !h.archived || (h.goalIds || []).includes(g.id));
/* how many habits existed on a given day — used by the heatmap, which would otherwise re-scale the
   whole of your history the moment you archived anything */
const habitsLiveOn = (d) => state.habits.filter(h => !(h.archived && h.archivedOn && d >= h.archivedOn));

function isPerfectDay(d) {
  const due = state.habits.filter(h => isScheduled(h, d) && !isSkipped(h, d));
  return due.length > 0 && due.every(h => habitMet(h, d));
}
function perfectStreak() {
  let s = 0, d = todayIso(), guard = 0;
  if (!isPerfectDay(d)) d = addDays(d, -1);
  while (isPerfectDay(d) && guard++ < 3650) { s++; d = addDays(d, -1); }
  return s;
}
function habitStreak(h) {
  let s = 0, d = todayIso(), guard = 0;
  if (h.type === "avoid") {
    while (guard++ < 3650) { const e = habitEntry(h, d); if (e && e.slip) break; s++; d = addDays(d, -1); }
    return s;
  }
  if (isScheduled(h, d) && !isSkipped(h, d) && !habitMet(h, d)) d = addDays(d, -1); // today still in progress
  while (guard++ < 3650) {
    if (isScheduled(h, d) && !isSkipped(h, d)) { if (habitMet(h, d)) s++; else break; }
    d = addDays(d, -1);
  }
  return s;
}
/* completion % over the last N scheduled, non-skipped days */
function habitCompletion(h, days = 30) {
  let due = 0, met = 0, d = todayIso(), guard = 0;
  while (due < days && guard++ < 400) {
    if (isScheduled(h, d) && !isSkipped(h, d)) { due++; if (habitMet(h, d)) met++; }
    d = addDays(d, -1);
  }
  return due ? Math.round(100 * met / due) : 0;
}
const perWeekCount = (h) => weekDates().reduce((n, d) => n + (habitMet(h, d) ? 1 : 0), 0);
function cadenceLabel(h) {
  const c = h.cadence || { mode: "daily" };
  if (c.mode === "daily") return "Daily";
  if (c.mode === "perWeek") return `${c.perWeek || 3}× / week`;
  if (c.mode === "days") return (c.days || []).length === 7 ? "Daily" : (c.days || []).map(i => WD_SHORT[i]).join(" ");
  return "Daily";
}

/* ----- templates / starter library ----- */
const HABIT_TEMPLATES = [
  { name: "Drink water", emoji: "💧", type: "quantity", target: 2, unit: "L", why: "Energy & focus." },
  { name: "Meditate", emoji: "🧘", type: "build", why: "Calm mind." },
  { name: "Read", emoji: "📖", type: "quantity", target: 20, unit: "pages" },
  { name: "Walk", emoji: "🚶", type: "quantity", target: 10000, unit: "steps" },
  { name: "Workout", emoji: "💪", type: "build", kind: "workout", cadence: { mode: "perWeek", perWeek: 4 } },
  { name: "Stretch", emoji: "🤸", type: "build" },
  { name: "No sugar", emoji: "🍬", type: "avoid" },
  { name: "No smoking", emoji: "🚭", type: "avoid" },
  { name: "No doomscrolling", emoji: "📵", type: "avoid" },
  { name: "Journal", emoji: "✒️", type: "build" },
  { name: "Sleep by 11pm", emoji: "😴", type: "build" },
  { name: "Gratitude", emoji: "🙏", type: "build" },
  { name: "Learn a language", emoji: "🗣️", type: "build" },
  { name: "Take vitamins", emoji: "💊", type: "build" },
  { name: "Cold shower", emoji: "🚿", type: "build" },
  { name: "Call family", emoji: "📞", type: "build", cadence: { mode: "perWeek", perWeek: 2 } },
];
function openHabitLibrary() {
  openModal(`
    <header class="modal-head"><h3>Habit library</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body"><p class="soft small">Tap to add — you can tweak it afterwards.</p>
      <div class="tmpl-grid">
        ${HABIT_TEMPLATES.map((t, i) => `<button class="tmpl-item" data-action="habit-tmpl" data-i="${i}">
          <span class="tmpl-emoji">${t.emoji}</span><b>${esc(t.name)}</b>
          <small>${t.type === "quantity" ? `${t.target} ${esc(t.unit || "")}` : t.type === "avoid" ? "avoid" : "build"}</small>
        </button>`).join("")}
      </div>
    </div>`);
}

const WORKOUT_TEMPLATES = [
  { name: "Push day", category: "Strength", ex: ["Bench press", "Overhead press", "Incline DB press", "Triceps pushdown"] },
  { name: "Pull day", category: "Strength", ex: ["Pull-ups", "Barbell row", "Lat pulldown", "Biceps curl"] },
  { name: "Leg day", category: "Strength", ex: ["Squat", "Romanian deadlift", "Leg press", "Calf raise"] },
  { name: "Full-body calisthenics", category: "Calisthenics", ex: ["Push-ups", "Pull-ups", "Dips", "Squats", "Plank"] },
  { name: "Upper body", category: "Strength", ex: ["Bench press", "Row", "Overhead press", "Pull-ups"] },
  { name: "Core & mobility", category: "Mobility", ex: ["Plank", "Hollow hold", "Hip openers", "Thoracic rotations"] },
];
function openWorkoutLibrary() {
  openModal(`
    <header class="modal-head"><h3>Routine library</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body"><p class="soft small">Adds a session for the selected day, pre-filled with these exercises — then log your sets.</p>
      <div class="tmpl-list">
        ${WORKOUT_TEMPLATES.map((t, i) => `<button class="tmpl-row" data-action="workout-tmpl" data-i="${i}">
          <b>${esc(t.name)}</b><small>${t.ex.join(" · ")}</small>
        </button>`).join("")}
      </div>
    </div>`);
}

/* ----- daily reflection ----- */
const REFLECTION_PROMPTS = [
  "What went well today?",
  "What's one small win you're proud of?",
  "What drained you — and what can you change tomorrow?",
  "Who or what are you grateful for right now?",
  "What did you learn about yourself today?",
  "If today had a title, what would it be?",
  "What's one thing you'll do differently tomorrow?",
  "When did you feel most like yourself today?",
];
const reflectionOfDay = () => REFLECTION_PROMPTS[Math.floor(Date.now() / DAY_MS) % REFLECTION_PROMPTS.length];

/* ----- rollups ----- */
/* Date-aware accessors. The *On(d) forms back the day-navigable views; the *Today() wrappers stay
   for missions, badges, the dashboard and area progress, which always mean "actually today". */
const healthOn = (d) => state.health.log[d] || {};
const healthToday = () => healthOn(todayIso());
const weekOfDate = (d) => { const m = mondayOf(d); return [...Array(7)].map((_, i) => addDays(m, i)); };
function workoutsThisWeek() {
  return weekDates().reduce((n, d) => n + ((state.workout.log[d] || []).length ? 1 : 0), 0);
}
/* one study ledger; pass a kind for just that source, omit it for the combined total */
const studyOn = (d) => state.study.log[d] || {};
const studyMins = (d, kind) => { const x = studyOn(d); return kind ? (x[kind] || 0) : ((x.skills || 0) + (x.university || 0)); };
const studyRange = (days, kind) => days.reduce((a, d) => a + studyMins(d, kind), 0);
function studyMinutesToday() { return studyMins(todayIso()); }
/* one mood per day, owned by Health and shared with Journal */
const moodOn = (d) => (state.health.log[d] || {}).mood || "";
function setMoodOn(d, m) {
  const l = state.health.log[d] = healthOn(d);
  l.mood = l.mood === m ? "" : m;
}
function nutritionOn(d) {
  const checked = state.nutrition.log[d] || {};
  const tot = { kcal: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
  state.nutrition.meals.forEach(m => { if (checked[m.id]) { tot.kcal += m.kcal; tot.protein += m.protein; tot.carbs += m.carbs; tot.fats += m.fats; tot.fiber += (m.fiber || 0); } });
  return tot;
}
function nutritionToday() {
  return nutritionOn(todayIso());
}
/* per-day meal photos live in nutrition.photos[date][mealId] = [{id,kind}] */
function mealPhotos(t, id) { return ((state.nutrition.photos[t] || {})[id]) || []; }
/* supplement cadence + "due" status */
const SUP_PERIOD = { day: 1, week: 7, month: 30 };
const SUP_LABEL = { day: "daily", week: "weekly", month: "monthly" };
function supStatus(sup) {
  const last = state.nutrition.supTaken[sup.id];
  const period = SUP_PERIOD[sup.every] || 1;
  if (!last) return { due: true, nextInDays: 0, last: null };
  const elapsed = Math.floor((Date.parse(todayIso()) - Date.parse(last)) / DAY_MS);
  return { due: elapsed >= period, nextInDays: Math.max(0, period - elapsed), last };
}
/* ================= the connected ecosystem =================
   The Bible's core rule is that nothing exists in isolation. Until now every relationship in this
   app was its own bespoke field — todo.habitId, todo.linkGoalId, todo.projectId, habit.goalIds,
   goal.habitIds, memory.people, book.recommenders — eight-plus of them, none aware of the others,
   and none able to answer the one question that matters: what is this connected to?

   Three pieces below, and one deliberate omission.

   The omission: this does NOT migrate the bespoke fields. They are load-bearing, covered by 28
   suites, and rewriting all of them in one pass across 6,700 lines is how a working app breaks.
   Instead `linksOf()` UNIONS the generic table with the bespoke fields, so a page gets one complete
   answer while the old paths keep working untouched. They can retire one at a time later, or never. */

/* 1 — the registry. Naming every object in one place is what makes the rest generic: a new area
   costs one entry here, not a new linking scheme. */
const OBJECTS = {
  goal:    { label: "Goal",    list: () => state.goals,            title: o => o.title, emoji: o => o.emoji || "\u{1F3AF}", open: "goal-open" },
  project: { label: "Project", list: () => state.projects,         title: o => o.name,  emoji: o => o.emoji || "\u{1F680}", open: "project-open" },
  habit:   { label: "Habit",   list: () => state.habits,           title: o => o.name,  emoji: o => o.emoji || "\u2705",    open: "habit-open" },
  task:    { label: "Task",    list: () => state.todos,            title: o => o.text,  emoji: () => "\u2713",              open: "todo-open" },
  person:  { label: "Person",  list: () => peopleAll(),            title: o => o.name,  emoji: o => o.emoji || "\u{1F464}", open: "person-open" },
  book:    { label: "Book",    list: () => state.reading.books,    title: o => o.title, emoji: o => o.emoji || "\u{1F4D8}", open: "book-open" },
  media:   { label: "Watch",   list: () => state.media,            title: o => o.title, emoji: o => o.emoji || "\u{1F3AC}", open: "media-open" },
  memory:  { label: "Memory",  list: () => state.memories,         title: o => o.title, emoji: o => o.emoji || "\u2728",    open: "memory-open" },
  course:  { label: "Course",  list: () => coursesAll(),   title: o => o.name,  emoji: o => o.emoji || "\u{1F393}", open: "course-open" },
  group:   { label: "Group",   list: () => state.groups,           title: o => o.name,  emoji: o => o.emoji || "\u{1F94B}", open: "group-open" },
  txn:     { label: "Money",   list: () => state.finance.entries,  title: o => o.note || o.category, emoji: () => "\u{1F4B6}", open: "" },
  uni:     { label: "Deadline", list: () => learnTasks(),          title: o => o.title, emoji: o => taskKind(o).emoji,     open: "" },
  skill:   { label: "Skill",   list: () => skillsAll(),               title: o => o.name,  emoji: o => o.emoji || "\u{1F938}", open: "skill-open" },
  event:   { label: "Event",   list: () => state.events,           title: o => o.title, emoji: o => o.icon || "\u{1F4C5}", open: "event-open" },
};
const ref = (type, id) => `${type}:${id}`;
const parseRef = (r) => { const i = String(r || "").indexOf(":"); return i < 0 ? null : { type: r.slice(0, i), id: r.slice(i + 1) }; };
/* resolve a ref to the live object, or null if it has since been deleted */
function deref(r) {
  const p = parseRef(r); if (!p) return null;
  const spec = OBJECTS[p.type]; if (!spec) return null;
  const o = (spec.list() || []).find(x => x.id === p.id);
  return o ? { type: p.type, id: p.id, obj: o, spec } : null;
}
const refTitle = (r) => { const d = deref(r); return d ? String(d.spec.title(d.obj) || "") : ""; };

/* 2 — the graph. Directed because "serves" and "is served by" read differently, but every reader
   below looks at both ends, so a link is findable from either object. */
function linkExists(from, to) {
  return (state.links || []).some(l => (l.from === from && l.to === to) || (l.from === to && l.to === from));
}
function addLink(from, to, rel = "related") {
  if (!from || !to || from === to || linkExists(from, to)) return null;
  if (!deref(from) || !deref(to)) return null;          // never link to something that isn't there
  const l = { id: uid(), from, to, rel, at: new Date().toISOString() };
  (state.links = state.links || []).push(l);
  return l;
}
const removeLink = (id) => { state.links = (state.links || []).filter(l => l.id !== id); };
/* every link touching this object, from either end, with the OTHER end resolved */
const genericLinks = (type, id) => {
  const me = ref(type, id);
  return (state.links || []).filter(l => l.from === me || l.to === me)
    .map(l => ({ id: l.id, rel: l.rel, ref: l.from === me ? l.to : l.from, generic: true }));
};
/* The union. Bespoke fields are read here rather than migrated, so nothing that works today stops
   working, and a page still gets one complete answer. */
function bespokeLinks(type, id) {
  const out = [];
  const push = (r) => { if (r && deref(r)) out.push({ id: "", rel: "related", ref: r, generic: false }); };
  if (type === "task") {
    const td = state.todos.find(x => x.id === id); if (!td) return out;
    push(ref("goal", td.linkGoalId)); push(ref("project", td.projectId)); push(ref("habit", td.habitId));
  } else if (type === "goal") {
    state.habits.filter(h => (h.goalIds || []).includes(id)).forEach(h => push(ref("habit", h.id)));
    state.todos.filter(t => t.linkGoalId === id).forEach(t => push(ref("task", t.id)));
  } else if (type === "habit") {
    const h = state.habits.find(x => x.id === id); if (!h) return out;
    (h.goalIds || []).forEach(g => push(ref("goal", g)));
    if (h.groupId) push(ref("group", h.groupId));
    state.todos.filter(t => t.habitId === id).forEach(t => push(ref("task", t.id)));
  } else if (type === "project") {
    state.todos.filter(t => t.projectId === id).forEach(t => push(ref("task", t.id)));
  } else if (type === "group") {
    state.habits.filter(h => h.groupId === id).forEach(h => push(ref("habit", h.id)));
  } else if (type === "person") {
    const p = personById(id); if (!p) return out;
    state.memories.filter(m => (m.people || []).some(n => normName(n) === normName(p.name))).forEach(m => push(ref("memory", m.id)));
    state.reading.books.filter(b => (b.recommenders || []).some(n => normName(n) === normName(p.name))).forEach(b => push(ref("book", b.id)));
    state.media.filter(m => (m.recommenders || []).some(n => normName(n) === normName(p.name))).forEach(m => push(ref("media", m.id)));
  } else if (type === "memory") {
    const m = state.memories.find(x => x.id === id); if (!m) return out;
    (m.people || []).forEach(n => { const p = personByName(n); if (p) push(ref("person", p.id)); });
  } else if (type === "book" || type === "media") {
    const o = OBJECTS[type].list().find(x => x.id === id); if (!o) return out;
    (o.recommenders || []).forEach(n => { const p = personByName(n); if (p) push(ref("person", p.id)); });
  }
  return out;
}
function linksOf(type, id) {
  const all = [...bespokeLinks(type, id), ...genericLinks(type, id)];
  const seen = new Set(); const out = [];
  for (const l of all) {
    if (seen.has(l.ref)) continue;
    /* Drop dangling refs HERE rather than leaving it to whoever renders them. gcLinks() only runs
       once a day, so between a delete and the next roll this is the only thing standing between a
       caller and an object that no longer exists — and callers count these, not just draw them. */
    if (!deref(l.ref)) continue;
    seen.add(l.ref); out.push(l);
  }
  return out;
}

/* 3 — history. Bounded on write: an unbounded log inside a blob that is re-encrypted and uploaded
   on every change is a slow leak, not a feature. */
const HISTORY_MAX = 40;
function touch(type, id, what) {
  if (!what) return;
  const key = ref(type, id);
  const log = (state.history = state.history || {});
  const rows = (log[key] = log[key] || []);
  rows.push({ at: new Date().toISOString(), what: String(what).slice(0, 120) });
  if (rows.length > HISTORY_MAX) rows.splice(0, rows.length - HISTORY_MAX);
  const o = deref(key);
  if (o) o.obj.updated = todayIso();
}
const historyOf = (type, id) => ((state.history || {})[ref(type, id)] || []).slice().reverse();

/* A link whose endpoint is gone is garbage, and so is history for an object that no longer exists.
   Runs with the other pruning in rollTasks(). deleteWithUndo also cleans up explicitly on expiry,
   so an undo inside the window still restores everything the object was connected to. */
function gcLinks() {
  const before = (state.links || []).length;
  state.links = (state.links || []).filter(l => deref(l.from) && deref(l.to));
  Object.keys(state.history || {}).forEach(k => { if (!deref(k)) delete state.history[k]; });
  return before - state.links.length;
}
/* stamp a new object without touching fourteen constructors */
const born = (o) => Object.assign({ created: todayIso(), updated: todayIso() }, o);

/* ---------- people ---------- */
const peopleAll = () => (state.social.people = state.social.people || []);
const personByName = (name) => peopleAll().find(p => normName(p.name) === normName(name)) || null;
const personById = (id) => peopleAll().find(p => p.id === id) || null;
/* Typing a name anywhere in the app is how you meet someone — Social should already know them. */
function ensurePerson(name) {
  const clean = String(name || "").trim();
  if (!clean) return null;
  const found = personByName(clean);
  if (found) return found;
  const p = { id: uid(), name: clean, emoji: "", relation: "", birthday: "", note: "", tags: [], touches: [] };
  peopleAll().push(p);
  return p;
}
/* The name IS the join key, so renaming someone has to rewrite every place they're named — otherwise
   the rename would quietly orphan their memories and recommendations. */
function renamePersonEverywhere(from, to) {
  const swap = (list) => (list || []).forEach((n, i) => { if (normName(n) === normName(from)) list[i] = to; });
  state.memories.forEach(m => swap(m.people));
  state.reading.books.forEach(b => swap(b.recommenders));
  state.media.forEach(m => swap(m.recommenders));
}
const lastTouch = (p) => (p.touches || []).slice().sort().pop() || "";
function daysSinceTouch(p) {
  const d = lastTouch(p);
  return d ? Math.floor((Date.parse(todayIso()) - Date.parse(d)) / DAY_MS) : null;
}
function touchLabel(p) {
  const n = daysSinceTouch(p);
  if (n === null) return "no catch-up logged";
  if (n <= 0) return "spoke today";
  if (n === 1) return "spoke yesterday";
  if (n < 7) return `${n} days ago`;
  if (n < 31) return `${Math.round(n / 7)} week${n < 11 ? "" : "s"} ago`;
  return `${Math.round(n / 30)} month${n < 46 ? "" : "s"} ago`;
}
/* Everywhere else in the app this person shows up. This is the whole point of Pass C: one human,
   not three unrelated strings. */
function personAppearances(p) {
  const hit = (list) => (list || []).some(n => normName(n) === normName(p.name));
  return {
    memories: state.memories.filter(m => hit(m.people)),
    books: state.reading.books.filter(b => hit(b.recommenders)),
    media: state.media.filter(m => hit(m.recommenders)),
  };
}
/* next occurrence of a birthday (MM-DD stored as a full date), or null */
function nextBirthday(p) {
  if (!p.birthday || p.birthday.length < 10) return null;
  const t = todayIso(), md = p.birthday.slice(5);
  const thisYear = t.slice(0, 4) + "-" + md;
  return thisYear >= t ? thisYear : (+t.slice(0, 4) + 1) + "-" + md;
}
const OUT_OF_TOUCH_DAYS = 30;
function outOfTouch() {
  return peopleAll()
    .map(p => ({ p, n: daysSinceTouch(p) }))
    .filter(x => x.n !== null && x.n >= OUT_OF_TOUCH_DAYS)
    .sort((a, b) => b.n - a.n);
}

function socialWeek() {
  const log = state.social.log[weekKey()] || {};
  const done = state.social.items.reduce((n, it) => n + Math.min(log[it.id] || 0, it.target), 0);
  const target = state.social.items.reduce((n, it) => n + it.target, 0);
  return { log, done, target };
}
const journalOn = (d) => state.journal.find(j => j.date === d);
function journalToday() { return journalOn(todayIso()); }

function areaProgressToday(id) {
  // 0..100 "today / this period" score per area, for dashboard tiles
  const t = todayIso();
  switch (id) {
    case "habits":  { const due = state.habits.filter(h => isScheduled(h, t) && !isSkipped(h, t)); return due.length ? Math.round(100 * due.filter(h => habitMet(h, t)).length / due.length) : 0; }
    case "health":  { const g = state.health.goals, l = healthToday();
      return Math.round(100 * clamp(((l.steps || 0) / g.steps + (l.water || 0) / g.water + (l.sleep || 0) / g.sleep) / 3, 0, 1)); }
    case "workout": return Math.round(100 * clamp(workoutsThisWeek() / state.workout.weeklyGoal, 0, 1));
    case "nutrition": { const n = state.nutrition.meals.length, c = state.nutrition.log[t] || {};
      return n ? Math.round(100 * Object.keys(c).filter(k => c[k]).length / n) : 0; }
    /* one area now, so one score: this month's self-directed hours against the target, plus how
       much of the open coursework is actually done */
    case "learning": {
      const mins = Object.keys(state.study.log).filter(d => d.startsWith(monthKey())).reduce((a, d) => a + studyMins(d), 0);
      const hrs = clamp(mins / 60 / Math.max(1, state.learning.monthlyHours + state.learning.weeklyHours * 4), 0, 1);
      const tasks = state.learning.tasks || [];
      const done = tasks.length ? tasks.filter(k => k.done).length / tasks.length : hrs;
      return Math.round(100 * clamp((hrs + done) / 2, 0, 1)); }
    case "reading": { const done = state.reading.books.filter(b => b.status === "done").length;
      return Math.round(100 * clamp(done / state.reading.yearlyGoal, 0, 1)); }
    case "media": { const n = state.media.length; return n ? Math.round(100 * state.media.filter(m => m.status === "done").length / n) : 0; }
    case "projects": { const n = state.projects.length; return n ? Math.round(state.projects.reduce((a, p) => a + projectProgress(p).pct, 0) / n) : 0; }
    case "social": { const w = socialWeek(); return w.target ? Math.round(100 * w.done / w.target) : 0; }
    /* Savings rate in YOUR currency. financeMonth() has returned per-currency buckets since
       schema 19, and this still compared the whole object to 0 — so the tile read 0% for everyone
       from the moment currencies landed. Read the bucket, not the bag. */
    case "finance": { const m = financeMonth(), c = defaultCur();
      const inc = m.income[c] || 0, net = m.net[c] || 0;
      return inc > 0 ? Math.round(100 * clamp(net / inc, 0, 1)) : 0; }
    case "memories": return state.memories.length ? 100 : 0;
    case "journal": return journalToday() ? 100 : 0;
    default: return 0;
  }
}
function weeklyProgress() {
  const keys = ["habits", "health", "workout", "nutrition", "journal"];
  return Math.round(keys.reduce((a, k) => a + areaProgressToday(k), 0) / keys.length);
}

/* ----- missions ----- */
const MISSIONS = [
  { id: "habits",  xp: 25, area: "habits",  title: () => "Complete today's habits",
    sub: () => { const due = state.habits.filter(h => isScheduled(h, todayIso()) && !isSkipped(h, todayIso())); return `${due.filter(h => habitMet(h, todayIso())).length} / ${due.length} due today`; },
    done: () => liveHabits().length > 0 && isPerfectDay(todayIso()) },
  { id: "workout", xp: 20, area: "workout", title: () => "Log a workout",
    sub: () => `${workoutsThisWeek()} / ${state.workout.weeklyGoal} this week`,
    done: () => (state.workout.log[todayIso()] || []).length > 0 },
  { id: "water",   xp: 15, area: "health",  title: () => `Drink ${state.health.goals.water}L of water`,
    sub: () => `${(healthToday().water || 0).toFixed(2)} / ${state.health.goals.water} L`,
    done: () => (healthToday().water || 0) >= state.health.goals.water },
  { id: "study",   xp: 20, area: "learning", title: () => "Study for 1 hour",
    sub: () => `${studyMinutesToday()} / 60 min`,
    done: () => studyMinutesToday() >= 60 },
  { id: "journal", xp: 15, area: "journal", title: () => "Journal your thoughts",
    sub: () => journalToday() ? "Written ✓" : "A few lines is enough",
    done: () => !!journalToday() },
  { id: "mood",    xp: 5,  area: "health",  title: () => "Log your mood",
    sub: () => healthToday().mood ? `Feeling ${healthToday().mood}` : "How are you feeling?",
    done: () => !!healthToday().mood },
];
/* Runs on every render, so it must not write unless a mission genuinely completed — an
   unconditional save() here meant rendering wrote to disk and pushed to the cloud. */
function checkMissions() {
  const t = todayIso();
  state.claimed[t] = state.claimed[t] || {};
  let claimed = false;
  MISSIONS.forEach(m => {
    if (m.done() && !state.claimed[t][m.id]) {
      state.claimed[t][m.id] = true;
      claimed = true;
      addXp(m.xp, m.title());
      if (m.id === "habits") { toast("Perfect day! Every habit done 🌟", "badge"); celebrate(); }
    }
  });
  if (claimed) save();   // a real state change — worth persisting and syncing
}

/* ----- badges ----- */
const BADGES = [
  { id: "first-habit", name: "First step",       desc: "Complete your first habit",      emoji: "👣", test: () => state.habits.some(h => Object.values(h.log).some(Boolean)) },
  { id: "streak-3",    name: "Warming up",       desc: "3-day perfect streak",           emoji: "✨", test: () => perfectStreak() >= 3 },
  { id: "streak-7",    name: "On fire",          desc: "7-day perfect streak",           emoji: "🔥", test: () => perfectStreak() >= 7 },
  { id: "streak-14",   name: "Unstoppable",      desc: "14-day perfect streak",          emoji: "🚀", test: () => perfectStreak() >= 14 },
  { id: "streak-30",   name: "Iron will",        desc: "30-day perfect streak",          emoji: "🛡️", test: () => perfectStreak() >= 30 },
  { id: "level-5",     name: "Level 5",          desc: "Reach level 5",                  emoji: "🌟", test: () => levelInfo().lvl >= 5 },
  { id: "level-10",    name: "Level 10",         desc: "Reach level 10",                 emoji: "💎", test: () => levelInfo().lvl >= 10 },
  { id: "bookworm",    name: "Bookworm",         desc: "Finish a book",                  emoji: "📖", test: () => state.reading.books.some(b => b.status === "done") },
  { id: "librarian",   name: "Librarian",        desc: "Finish 5 books",                 emoji: "📚", test: () => state.reading.books.filter(b => b.status === "done").length >= 5 },
  { id: "athlete",     name: "Athlete",          desc: "Log 10 workouts",                emoji: "🏋️", test: () => Object.values(state.workout.log).reduce((a, v) => a + v.length, 0) >= 10 },
  { id: "hydrated",    name: "Hydro homie",      desc: "Hit your water goal 7 times",    emoji: "💧", test: () => Object.values(state.health.log).filter(l => (l.water || 0) >= state.health.goals.water).length >= 7 },
  { id: "scholar",     name: "Scholar",          desc: "Log 10 hours of study",          emoji: "🎓", test: () => Object.keys(state.study.log).reduce((a, d) => a + studyMins(d), 0) >= 600 },
  { id: "journalist",  name: "Dear diary",       desc: "Write 7 journal entries",        emoji: "✒️", test: () => state.journal.length >= 7 },
  { id: "keeper",      name: "Memory keeper",    desc: "Save 5 memories",                emoji: "📸", test: () => state.memories.length >= 5 },
  { id: "shipper",     name: "Shipped it",       desc: "Complete a project",             emoji: "🚢", test: () => state.projects.some(projectDone) },
  { id: "butterfly",   name: "Social butterfly", desc: "Hit all social goals in a week", emoji: "🦋", test: () => { const w = socialWeek(); return w.target > 0 && w.done >= w.target; } },
  { id: "explorer",    name: "Explorer",         desc: "Visit every life area",          emoji: "🧭", test: () => AREAS.every(a => state.visited[a.id]) },
];
function checkBadges() {
  BADGES.forEach(b => {
    if (!state.badges[b.id] && b.test()) {
      state.badges[b.id] = todayIso();
      toast(`Badge earned: ${b.emoji} ${b.name}`, "badge");
    }
  });
}

/* ================= theming ================= */
function applyTheme() {
  const t = state.profile.theme;
  const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  const btn = $("#themeBtn");
  if (btn) btn.innerHTML = dark ? I.sun : I.moon;
}
function toggleTheme() {
  const dark = document.documentElement.dataset.theme === "dark";
  state.profile.theme = dark ? "light" : "dark";
  save(); applyTheme(); drawCharts();
}

/* ================= shell: nav / topbar ================= */
let currentView = "dashboard";

const VIEW_META = {
  dashboard:    { title: "Dashboard",    sub: () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) },
  goals:        { title: "Goals",        sub: () => { const n = activeGoals().length; return n ? `${n} open \u00b7 where you're going` : "Where are you going?"; } },
  progress:     { title: "Progress",     sub: () => "Your journey in numbers" },
  integrations: { title: "Integrations", sub: () => "Connect your favorite apps" },
  profile:      { title: "Profile",      sub: () => "You, leveled up" },
};
function viewMeta(id) {
  const a = areaOf(id);
  if (a) return { title: a.name, sub: () => "" };
  return VIEW_META[id] || { title: id, sub: () => "" };
}

function navItemHtml(item) {
  const hue = item.hue ? `style="--a:${cssVar(item.hue)}"` : "";
  return `<button class="nav-item ${currentView === item.id ? "active" : ""}" data-nav="${item.id}" ${hue}>
    <span class="nav-ic">${I[item.icon]}</span><span>${esc(item.name)}</span>
  </button>`;
}
function renderNav() {
  $("#sideNav").innerHTML = NAV_GROUPS.map(g =>
    `<div class="nav-group"><span class="nav-label">${g.label}</span>${g.items.map(navItemHtml).join("")}</div>`
  ).join("");
  const li = levelInfo();
  $("#sideFoot").innerHTML = `
    <div class="side-level">
      <span class="side-avatar">${esc(state.profile.avatar)}</span>
      <div class="side-level-txt">
        <strong>${esc(state.profile.name || "Friend")}</strong>
        <small>Level ${li.lvl} · ${state.xp.toLocaleString()} XP</small>
        <span class="bar mini"><span style="width:${li.pct}%"></span></span>
      </div>
    </div>`;
  const bottom = [
    { id: "dashboard", name: "Home",     icon: "home" },
    { id: "habits",    name: "Habits",   icon: "target" },
    { id: "_add",      name: "Add",      icon: "plus" },
    { id: "progress",  name: "Progress", icon: "chart" },
    { id: "_areas",    name: "Areas",    icon: "grid" },
  ];
  $("#bottomNav").innerHTML = bottom.map(b => b.id === "_add"
    ? `<button class="bn-add" data-action="quick-add" aria-label="Quick add">${I.plus}</button>`
    : `<button class="bn-item ${currentView === b.id || (b.id === "_areas" && areaOf(currentView)) ? "active" : ""}" data-nav="${b.id}">
        ${I[b.icon]}<span>${b.name}</span></button>`
  ).join("");
}

function renderTopbar() {
  const li = levelInfo();
  $("#streakChip").innerHTML = `${I.flame}<b>${perfectStreak()}</b>`;
  $("#levelChip").innerHTML = `<b>Lv ${li.lvl}</b><span class="bar mini"><span style="width:${li.pct}%"></span></span>`;
  $("#avatarBtn").textContent = state.profile.avatar;
  $("#menuBtn").innerHTML = I.menu;
  const meta = viewMeta(currentView);
  $("#pageTitle").textContent = meta.title;
  $("#pageSub").textContent = meta.sub();
}

function go(viewId) {
  if (viewId === "_areas") { openDrawer(); return; }
  currentView = viewId;
  /* only write the first time an area is visited — re-navigating is a read, not a change */
  if (areaOf(viewId) && !state.visited[viewId]) { state.visited[viewId] = true; checkBadges(); save(); }
  closeDrawer(); closeModal();
  render();
  window.scrollTo({ top: 0 });
}

/* ================= shared UI ================= */
function toast(msg, kind = "") {
  const stack = $("#toastStack");
  if (!stack) return;
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.textContent = msg;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 2600);
}

/* A toast with an Undo button. `onExpire` runs only if the window closes WITHOUT an undo — that's
   where attached photos/files finally get destroyed, so an undo can always restore the whole record. */
const UNDO_MS = 7000;
function toastUndo(msg, onUndo, onExpire) {
  const stack = $("#toastStack");
  if (!stack) { if (onExpire) onExpire(); return; }
  const el = document.createElement("div");
  el.className = "toast has-undo";
  const label = document.createElement("span");
  label.textContent = msg;
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "toast-undo"; btn.textContent = "Undo";
  el.append(label, btn);
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  let settled = false;
  const close = (undone) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
    if (undone) onUndo(); else if (onExpire) onExpire();
  };
  btn.addEventListener("click", () => close(true));
  const timer = setTimeout(() => close(false), UNDO_MS);
}

/* Remove a record from a list and offer Undo that puts it back at the same position.
   `getArr` is a function so the array is re-resolved at undo time (a cloud pull can replace state). */
function deleteWithUndo(getArr, id, label, onExpire, onRestore) {
  const arr = getArr();
  const i = arr.findIndex(x => x.id === id);
  if (i < 0) return null;
  const [gone] = arr.splice(i, 1);
  save(); render();
  toastUndo(label, () => {
    const a = getArr();
    a.splice(Math.min(i, a.length), 0, gone);
    if (onRestore) onRestore();      // put back anything stored outside the list
    save(); render();
    toast("Restored");
  }, () => {
    /* Only now, once the undo window has closed for good, do the object's links and history go.
       Collecting them during the window would mean an undo restored the thing but not what it was
       connected to — the same rule the media blobs and group membership already follow. */
    if (onExpire) onExpire();
    gcLinks(); save();
  });
  return gone;
}

function openModal(html) {
  $("#modal").innerHTML = html;
  $("#modalBackdrop").hidden = false;
  /* modal content is injected outside the render cycle, so it needs hydrating too — without this
     any [data-media] inside a modal stays a "…" placeholder forever */
  hydrateMedia();
  const f = $("#modal input:not([type=hidden]), #modal textarea, #modal select");
  if (f) f.focus();
}
function closeModal() { $("#modalBackdrop").hidden = true; $("#modal").innerHTML = ""; }
function openDrawer() {
  $("#drawer").innerHTML = `
    <div class="drawer-head"><strong>Life areas</strong><button class="icon-btn" data-action="close-drawer" aria-label="Close">${I.x}</button></div>
    <div class="drawer-grid">
      <button class="drawer-item" data-nav="dashboard" style="--a:#6a5ae0"><span class="tile-ic">${I.home}</span><span>Dashboard</span></button>
      ${AREAS.map(a => `
      <button class="drawer-item" data-nav="${a.id}" style="--a:${cssVar(a.hue)}">
        <span class="tile-ic">${I[a.icon]}</span><span>${esc(a.name)}</span>
      </button>`).join("")}
      <button class="drawer-item" data-nav="integrations" style="--a:#64748b"><span class="tile-ic">${I.zap}</span><span>Integrations</span></button>
      <button class="drawer-item" data-nav="profile" style="--a:#6a5ae0"><span class="tile-ic">${I.user}</span><span>Profile</span></button>
    </div>`;
  $("#drawerBackdrop").hidden = false;
}
function closeDrawer() { $("#drawerBackdrop").hidden = true; }

/* progress ring (svg) */
function ring(pct, opts = {}) {
  const size = opts.size || 84, sw = opts.sw || 8, r = (size - sw) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - clamp(pct, 0, 100) / 100);
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${opts.label || pct + "%"}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-track" stroke-width="${sw}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-val" stroke-width="${sw}"
      stroke-dasharray="${c}" stroke-dashoffset="${off}" style="stroke:${opts.color || "var(--brand)"}"/>
    ${opts.center ? `<text x="50%" y="50%" class="ring-txt" dy="${opts.sub ? "-0.1em" : ".05em"}">${opts.center}</text>` : ""}
    ${opts.sub ? `<text x="50%" y="50%" class="ring-sub" dy="1.35em">${opts.sub}</text>` : ""}
  </svg>`;
}

const barHtml = (pct, color) =>
  `<span class="bar"><span style="width:${clamp(pct, 0, 100)}%${color ? `;background:${cssVar(color)}` : ""}"></span></span>`;

/* ---- charts (drawn post-mount into [data-chart-type] hosts) ---- */
const CHART = {
  seq: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"],
  seqDark: ["#0d366b", "#184f95", "#1c5cab", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4"],
  cat: () => document.documentElement.dataset.theme === "dark"
    ? ["#3987e5", "#008300", "#d55181", "#c98500"]
    : ["#2a78d6", "#008300", "#e87ba4", "#eda100"],
};

function roundedTopRect(x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  return `M${x} ${y + h} v${-(h - r)} q0 ${-r} ${r} ${-r} h${w - 2 * r} q${r} 0 ${r} ${r} v${h - r} z`;
}

function drawBarChart(host) {
  const data = JSON.parse(host.dataset.chart);          // [{label, value, tip}]
  const goal = host.dataset.goal ? +host.dataset.goal : null;
  const color = host.dataset.color || "var(--brand)";
  const W = host.clientWidth || 320, H = +host.dataset.h || 150;
  const padT = 12, padB = 22, plotH = H - padT - padB;
  const max = Math.max(goal || 0, ...data.map(d => d.value), 1);
  const n = data.length, slot = W / n, bw = Math.min(34, slot * 0.55);
  let marks = "", labels = "";
  data.forEach((d, i) => {
    const h = Math.max(d.value > 0 ? 3 : 0, plotH * d.value / max);
    const x = i * slot + (slot - bw) / 2, y = padT + plotH - h;
    marks += `<rect x="${i * slot}" y="0" width="${slot}" height="${H}" fill="transparent" data-tip="${esc(d.tip)}"/>`;
    marks += `<path d="${roundedTopRect(x, y, bw, h, 4)}" fill="${color}" data-tip="${esc(d.tip)}"/>`;
    labels += `<text x="${i * slot + slot / 2}" y="${H - 6}" class="ax">${esc(d.label)}</text>`;
  });
  const gy = goal ? padT + plotH * (1 - goal / max) : 0;
  const goalLine = goal ? `<line x1="0" x2="${W}" y1="${gy}" y2="${gy}" class="goal-line"/>` : "";
  host.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(host.dataset.label || "bar chart")}">
    <line x1="0" x2="${W}" y1="${padT + plotH}" y2="${padT + plotH}" class="axis-line"/>${goalLine}${marks}${labels}</svg>`;
}

function drawHeatmap(host) {
  const weeks = +host.dataset.weeks || 16;
  const cell = 13, gap = 3, padL = 30, padT = 16;
  const seq = document.documentElement.dataset.theme === "dark" ? CHART.seqDark : CHART.seq;
  const monday = mondayOf(todayIso());
  const start = addDays(monday, -7 * (weeks - 1));
  const W = padL + weeks * (cell + gap), H = padT + 7 * (cell + gap);
  let cells = "", labels = "", lastMonth = "";
  for (let w = 0; w < weeks; w++) {
    const colDate = addDays(start, w * 7);
    const m = niceDate(colDate, { month: "short" });
    if (m !== lastMonth) { labels += `<text x="${padL + w * (cell + gap)}" y="10" class="ax axl">${m}</text>`; lastMonth = m; }
    for (let day = 0; day < 7; day++) {
      const d = addDays(start, w * 7 + day);
      if (d > todayIso()) continue;
      const live = habitsLiveOn(d);
      const total = live.length || 1;
      const done = live.filter(h => habitDone(h, d)).length;
      const pct = done / total;
      const fill = pct === 0 ? "var(--heat-0)" : seq[Math.min(seq.length - 1, Math.floor(pct * (seq.length - 2)) + 1)];
      cells += `<rect x="${padL + w * (cell + gap)}" y="${padT + day * (cell + gap)}" width="${cell}" height="${cell}" rx="3.5" fill="${fill}" data-tip="${esc(`${niceDate(d)} · ${done}/${total} habits`)}"/>`;
    }
  }
  [["Mon", 0], ["Wed", 2], ["Sun", 6]].forEach(([lbl, row]) => {
    labels += `<text x="0" y="${padT + row * (cell + gap) + cell - 2}" class="ax axl">${lbl}</text>`;
  });
  host.innerHTML = `<div class="hscroll"><svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Habit consistency heatmap">${labels}${cells}</svg></div>`;
}

function drawDonut(host) {
  const segs = JSON.parse(host.dataset.chart);       // [{label,value,unit}]
  const colors = CHART.cat();
  const size = 132, sw = 16, r = (size - sw) / 2, c = 2 * Math.PI * r;
  const total = segs.reduce((a, s) => a + s.value, 0);
  let arcs = "";
  if (total > 0) {
    let off = -0.25 * c;
    segs.forEach((s, i) => {
      const frac = s.value / total;
      const len = Math.max(0, frac * c - 2.5);   // ~2px surface gap between segments
      arcs += `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="${sw}"
        stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" stroke-linecap="butt"
        data-tip="${esc(`${s.label}: ${s.value}${s.unit || ""}`)}"/>`;
      off += frac * c;
    });
  } else {
    arcs = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--heat-0)" stroke-width="${sw}"/>`;
  }
  host.innerHTML = `
    <div class="donut-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(host.dataset.label || "breakdown")}">${arcs}</svg>
      <ul class="donut-legend">
        ${segs.map((s, i) => `<li><span class="dot" style="background:${colors[i]}"></span>${esc(s.label)} <b>${s.value}${s.unit || ""}</b></li>`).join("")}
      </ul>
    </div>`;
}

function drawCharts() {
  $$("[data-chart-type]").forEach(host => {
    if (host.dataset.chartType === "bar") drawBarChart(host);
    if (host.dataset.chartType === "heatmap") drawHeatmap(host);
    if (host.dataset.chartType === "donut") drawDonut(host);
  });
}

/* ================= motion primitives ================= */
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function animateCounts() {
  if (reduceMotion()) return;
  $$("[data-count]").forEach(el => {
    if (el.dataset.counted) return; el.dataset.counted = "1";
    const raw = el.dataset.count, target = parseFloat(raw) || 0, dec = raw.includes(".") ? 1 : 0;
    const suffix = el.dataset.countSuffix || "", dur = 750, start = performance.now();
    const fmt = v => (dec ? v.toFixed(dec) : Math.round(v).toLocaleString()) + suffix;
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e);
      if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(target);
    })(start);
  });
}
function animateBars() {
  $$(".bar > span").forEach(sp => {
    if (sp.dataset.animated) return; sp.dataset.animated = "1";
    const w = sp.style.width; sp.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => { sp.style.width = w; }));
  });
}
function animateRings() {
  $$(".ring-val").forEach(c => {
    if (c.dataset.animated) return; c.dataset.animated = "1";
    const off = c.getAttribute("stroke-dashoffset"), dash = c.getAttribute("stroke-dasharray");
    c.setAttribute("stroke-dashoffset", dash);
    requestAnimationFrame(() => requestAnimationFrame(() => { c.setAttribute("stroke-dashoffset", off); }));
  });
}
function runMotion() { animateBars(); animateRings(); animateCounts(); }
function celebrate() {
  if (reduceMotion()) return;
  const c = document.createElement("canvas"); c.className = "confetti-canvas";
  document.body.appendChild(c);
  const ctx = c.getContext("2d"), W = c.width = innerWidth, H = c.height = innerHeight;
  const cols = ["#6a5ae0", "#f76b15", "#30a46c", "#e5484d", "#eda100", "#0091ff", "#d6409f"];
  const parts = [...Array(140)].map(() => ({ x: W / 2 + (Math.random() - .5) * W * .4, y: H * .28, vx: (Math.random() - .5) * 11, vy: Math.random() * -13 - 4, g: .42, r: Math.random() * 7 + 3, col: cols[Math.random() * cols.length | 0], rot: Math.random() * 6, vr: (Math.random() - .5) * .35 }));
  let t0 = performance.now();
  (function frame(now) {
    const dt = Math.min(2, (now - t0) / 16); t0 = now; ctx.clearRect(0, 0, W, H); let alive = false;
    parts.forEach(p => { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y < H + 24) alive = true; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.globalAlpha = .9; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .62); ctx.restore(); });
    if (alive) requestAnimationFrame(frame); else c.remove();
  })(t0);
  setTimeout(() => c.remove(), 4500);
}

/* tooltip */
function bindTip() {
  const tip = $("#tip");
  document.addEventListener("pointerover", e => {
    const t = e.target.closest?.("[data-tip]");
    if (!t) { tip.hidden = true; return; }
    tip.textContent = t.dataset.tip;
    tip.hidden = false;
  });
  document.addEventListener("pointermove", e => {
    if (tip.hidden) return;
    const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = clamp(e.clientX + pad, 6, innerWidth - w - 6) + "px";
    tip.style.top = clamp(e.clientY - h - 10, 6, innerHeight - h - 6) + "px";
  });
}

/* ---------- the two blocks the Bible asks every page for ----------
   Written once, generic over the OBJECTS registry, so satisfying "Relationships" and "History" on a
   new page is one call rather than a new component. */

function relChip(l) {
  const d = deref(l.ref);
  if (!d) return "";
  const openable = !!d.spec.open;
  return `<span class="rel-chip${openable ? " go" : ""}" ${openable ? `data-action="${d.spec.open}" data-id="${d.id}"` : ""}>
    <i aria-hidden="true">${esc(d.spec.emoji(d.obj))}</i>
    <b>${esc(d.spec.title(d.obj) || d.spec.label)}</b>
    <small>${esc(d.spec.label)}</small>
    ${l.generic ? `<button class="rel-x" data-action="link-del" data-lid="${l.id}" aria-label="Unlink">${I.x}</button>` : ""}
  </span>`;
}
/* Links made by hand can be removed; links that come from a bespoke field (a task's goal, a
   memory's people) are shown but not removable HERE — you change those where they live, and saying
   so is better than offering a button that would silently do nothing. */
function relatedCard(type, id, opts) {
  const o = opts || {};
  const links = linksOf(type, id);
  const derived = links.filter(l => !l.generic).length;
  return `<div class="fld rel-block">
    <span>${o.label || "Connected to"}${links.length ? ` <small class="soft">${links.length}</small>` : ""}</span>
    ${links.length ? `<div class="rel-row">${links.map(relChip).join("")}</div>`
      : `<p class="soft small">Nothing linked yet.</p>`}
    <button class="btn tiny ghost" data-action="link-add" data-type="${type}" data-id="${id}">${I.link}Link something</button>
    ${derived ? `<p class="soft small">${derived} of these come from a field on the item itself — change those where they live.</p>` : ""}
  </div>`;
}
function historyCard(type, id, opts) {
  const o = opts || {};
  const rows = historyOf(type, id).slice(0, o.limit || 8);
  if (!rows.length && !o.always) return "";
  return `<div class="fld"><span>History</span>
    ${rows.length ? `<ul class="hist-log">${rows.map(r => `<li>
      <span class="hl-when">${esc(niceDate(r.at.slice(0, 10), { month: "short", day: "numeric" }))}</span>
      <span class="hl-what">${esc(r.what)}</span></li>`).join("")}</ul>`
      : `<p class="soft small">Nothing recorded yet.</p>`}</div>`;
}
/* One picker for every object type — the payoff of the registry. */
function openLinkPicker(type, id) {
  const me = ref(type, id);
  const already = new Set(linksOf(type, id).map(l => l.ref));
  const groups = Object.keys(OBJECTS).map(t => {
    const spec = OBJECTS[t];
    const items = (spec.list() || []).filter(o => ref(t, o.id) !== me && !already.has(ref(t, o.id))).slice(0, 40);
    return items.length ? `<optgroup label="${esc(spec.label)}">${items.map(o =>
      `<option value="${esc(ref(t, o.id))}">${esc(spec.emoji(o))} ${esc(String(spec.title(o) || "").slice(0, 60))}</option>`).join("")}</optgroup>` : "";
  }).join("");
  const d = deref(me);
  openModal(`<form data-submit="link-add">
    <header class="modal-head"><h3>Link something</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <p class="soft small">Connecting <b>${esc(d ? d.spec.title(d.obj) : "this")}</b> to something else. Both sides will show the link.</p>
      <input type="hidden" name="from" value="${esc(me)}">
      <label class="fld"><span>Link to</span><select name="to" required>${groups || `<option value="">Nothing else to link to yet</option>`}</select></label>
      <label class="fld"><span>How are they related? <small class="soft">— optional</small></span>
        <input type="text" name="rel" placeholder="serves / part of / inspired by…" maxlength="40"></label>
    </div>
    <footer class="modal-foot">
      <button type="button" class="btn ghost" data-action="modal-close">Cancel</button>
      <button type="submit" class="btn primary">${I.link}Link</button>
    </footer></form>`);
}

/* small building blocks */
const card = (cls, inner) => `<section class="card ${cls || ""}">${inner}</section>`;
const cardHead = (title, action = "") => `<header class="card-head"><h2>${title}</h2>${action}</header>`;
const emptyMsg = (icon, text, actionHtml = "") =>
  `<div class="empty">${I[icon] || ""}<p>${text}</p>${actionHtml}</div>`;
const addBtn = (label, action, cls = "primary") =>
  `<button class="btn ${cls}" data-action="${action}">${I.plus}${label}</button>`;

/* ================= views ================= */

/* ---------- the dashboard's decision layer ----------
   Every helper here answers one question: what deserves this person's attention today? Nothing in
   this block reads history or produces analytics — that belongs on the areas' own pages. */

const PRIORITY = { high: { label: "High", rank: 0, hue: "#e5484d" },
                   med:  { label: "Medium", rank: 1, hue: "#f76b15" },
                   low:  { label: "Low", rank: 2, hue: "#3e63dd" } };
const prio = (v) => PRIORITY[v] || PRIORITY.med;
const prioRank = (v) => prio(v).rank;
const daysLeft = (iso) => Math.round((Date.parse(iso + "T12:00:00") - Date.parse(todayIso() + "T12:00:00")) / 86400000);

/* Goals worth showing: still open, not yet reached. Highest priority first, then whatever is due
   soonest — a goal with a deadline outranks one without, because it can actually be late. */
function activeGoals() {
  return (state.goals || [])
    .filter(g => g.status !== "done" && g.status !== "paused" && !goalReached(g))
    .sort((a, b) => prioRank(a.priority) - prioRank(b.priority)
      || (a.deadline ? Date.parse(a.deadline) : Infinity) - (b.deadline ? Date.parse(b.deadline) : Infinity));
}
/* Plain-language status. "On track" is deliberately not claimed — the app cannot know that — so this
   reports only what it can see: reached, overdue, due soon, or simply in progress. */
function goalStatus(g) {
  if (goalReached(g)) return { txt: "Reached", cls: "ok" };
  if (!g.deadline) return { txt: "In progress", cls: "" };
  const d = daysLeft(g.deadline);
  if (d < 0) return { txt: Math.abs(d) + "d overdue", cls: "err" };
  if (d <= 7) return { txt: d + "d left", cls: "warn" };
  return { txt: "In progress", cls: "" };
}

/* ---- am I actually making progress? ----
   The most useful thing a goal page can say is whether the work is keeping up with the clock, and
   it is answerable — but ONLY when both ends are known. With a start date and a deadline, "40% of
   the time has gone and you are 15% of the way" is a fact. With either missing it is a guess, so
   this returns null and the UI says nothing rather than inventing a verdict. */
function paceOf(startedOn, deadline, made, doneTxt) {
  if (!startedOn || !deadline) return null;
  const from = Date.parse(startedOn + "T12:00:00"), to = Date.parse(deadline + "T12:00:00");
  const span = to - from;
  if (!(span > 0)) return null;
  const elapsed = clamp(Math.round(100 * (Date.parse(todayIso() + "T12:00:00") - from) / span), 0, 100);
  const gap = made - elapsed;
  return { elapsed, made, gap,
    /* deliberately not "on track" — the app can compare two percentages, it cannot know your plan */
    txt: doneTxt ? doneTxt
      : gap >= 10 ? "Ahead of the clock"
      : gap <= -20 ? "The clock is ahead of you"
      : gap <= -10 ? "Slightly behind the clock"
      : "Keeping pace with the clock",
    cls: doneTxt ? "ok" : gap <= -20 ? "err" : gap <= -10 ? "warn" : "ok" };
}
const goalPace = (g) => paceOf(g.startedOn, g.deadline, goalProgress(g).pct, goalReached(g) ? "Reached" : "");
/* minutes of focus that named this goal, over the whole log */
function goalFocusMins(id) {
  let n = 0;
  Object.keys(state.focusLog || {}).forEach(d =>
    (state.focusLog[d] || []).forEach(r => { if (r.goalId === id) n += r.mins || 0; }));
  return n;
}
/* ---- projects ----
   The Bible's question for this page is "what am I building?" — which a name and a percentage can't
   answer. These are the derived facts a project can produce without asking anyone to maintain a
   second copy of anything. */

/* ONE source of truth for progress. Milestones win wherever they exist, because a checklist that
   disagrees with a hand-typed percentage is worse than either alone; without them the manual number
   is all there is. The UI hides the +10% button once milestones appear rather than leaving a switch
   wired to nothing. */
const projectDerived = (p) => !!(p.milestones || []).length;
function projectProgress(p) {
  const ms = p.milestones || [], tot = ms.length, done = ms.filter(m => m.done).length;
  if (p.status === "Done") return { pct: 100, done, tot };
  if (!tot) return { pct: clamp(p.progress || 0, 0, 100), done: 0, tot: 0 };
  return { pct: Math.round(100 * done / tot), done, tot };
}
/* the free-text "next step" is only a fallback — once there are real milestones the first unticked
   one IS the next step, and there is nothing for the two to disagree about */
function nextMilestoneOf(p) {
  const m = (p.milestones || []).find(x => !x.done);
  return m ? m.text : (p.nextMilestone || "");
}
const projectDone = (p) => p.status === "Done" || (projectDerived(p) && projectProgress(p).pct === 100);
const projectPace = (p) => paceOf(p.startedOn, p.deadline, projectProgress(p).pct, projectDone(p) ? "Shipped" : "");
function projectStatus(p) {
  if (projectDone(p)) return { txt: "Done", cls: "ok" };
  if (p.status === "Paused") return { txt: "Paused", cls: "" };
  if (!p.deadline) return { txt: p.status || "In progress", cls: "" };
  const d = daysLeft(p.deadline);
  if (d < 0) return { txt: Math.abs(d) + "d overdue", cls: "err" };
  if (d <= 7) return { txt: d + "d left", cls: "warn" };
  return { txt: p.status || "In progress", cls: "" };
}
/* minutes of focus that named this project — the timer already logs projectId, so time invested
   costs nobody a single extra keystroke */
function projectFocusMins(id) {
  let n = 0;
  Object.keys(state.focusLog || {}).forEach(d =>
    (state.focusLog[d] || []).forEach(r => { if (r.projectId === id) n += r.mins || 0; }));
  return n;
}
/* every logged session that named this project, newest first, each carrying the day it happened */
function projectSessionRows(id) {
  const out = [];
  Object.keys(state.focusLog || {}).forEach(d =>
    (state.focusLog[d] || []).forEach(r => { if (r.projectId === id) out.push(Object.assign({ date: d }, r)); }));
  return out.sort((a, b) => b.date.localeCompare(a.date) || String(b.at || "").localeCompare(String(a.at || "")));
}
const projectSessions = (id) => projectSessionRows(id).length;
const hasReflection = (r) => !!(r.outcome || r.obstacles || r.next || r.focus);

/* Sessions per week over the last 8 Monday-weeks, in the shape drawBarChart already reads —
   the same construction skillsTrend() uses, so month boundaries are somebody else's solved problem. */
function projectSessionsTrend(id) {
  const rows = projectSessionRows(id), out = [];
  for (let i = 7; i >= 0; i--) {
    const monday = mondayOf(addDays(todayIso(), -i * 7));
    const end = addDays(monday, 7);
    const wk = rows.filter(r => r.date >= monday && r.date < end);
    const mins = wk.reduce((n, r) => n + (r.mins || 0), 0);
    out.push({ label: i === 0 ? "This wk" : niceDate(monday, { month: "short", day: "numeric" }),
      value: wk.length,
      tip: `Week of ${niceDate(monday)}: ${wk.length} session${wk.length === 1 ? "" : "s"}${mins ? ` · ${estLabel(mins)}` : ""}` });
  }
  return out;
}

/* How fast milestones actually get ticked — but only from milestones ticked SINCE this shipped,
   because nothing recorded when the older ones were done. Two dated ticks is the minimum that can
   produce an interval at all; below that this returns null and the sheet shows nothing rather than
   a heading with no number under it. Same contract as paceOf(). */
function milestoneVelocity(p) {
  const dated = (p.milestones || []).filter(m => m.done && m.doneOn)
    .map(m => m.doneOn).sort();
  if (dated.length < 2) return null;
  const span = (Date.parse(dated[dated.length - 1] + "T12:00:00") - Date.parse(dated[0] + "T12:00:00")) / DAY_MS;
  const every = Math.max(1, Math.round(span / (dated.length - 1)));
  const left = (p.milestones || []).filter(m => !m.done).length;
  return { dated: dated.length, every, left,
           eta: left ? addDays(todayIso(), every * left) : "",
           /* it can only speak for the ticks it has dates for, and it says so */
           partial: dated.length < (p.milestones || []).filter(m => m.done).length };
}
function projectAvgFocus(id) {
  const rated = projectSessionRows(id).filter(r => r.focus > 0);
  if (!rated.length) return null;
  return { avg: Math.round(10 * rated.reduce((n, r) => n + r.focus, 0) / rated.length) / 10, n: rated.length };
}
/* Live projects, most recently worked first — the dashboard and the Projects page agree on order
   because they call the same function. */
function liveProjects() {
  return (state.projects || []).filter(p => !projectDone(p) && p.status !== "Paused")
    .map(p => ({ p, worked: projectLastWorked(p.id) }))
    .sort((a, b) => prioRank(a.p.priority) - prioRank(b.p.priority)
      || (b.worked || "").localeCompare(a.worked || ""))
    .map(x => x.p);
}

const goalsByStatus = (st) => (state.goals || []).filter(g =>
  st === "done" ? (g.status === "done" || goalReached(g))
  : st === "paused" ? (g.status === "paused" && !goalReached(g))
  : false);

const FOCUS_MAX = 3;
/* Exactly three, as specified. Pinned tasks come first; if fewer than three are pinned the rest fill
   by priority then time, so the section is never half-empty — and the row says which were auto-filled
   rather than pretending the person chose them. */
function focusTasks() {
  const open = tasksOn(todayIso()).filter(td => !td.done && !td.hard);
  const pinned = open.filter(td => td.focus);
  const rest = open.filter(td => !td.focus)
    .sort((a, b) => prioRank(a.priority) - prioRank(b.priority)
      || (a.time || "99:99").localeCompare(b.time || "99:99") || (a.order || 0) - (b.order || 0));
  return { picked: pinned.slice(0, FOCUS_MAX),
           filled: pinned.length >= FOCUS_MAX ? [] : rest.slice(0, FOCUS_MAX - pinned.length) };
}
const hardTask = () => tasksOn(todayIso()).find(td => td.hard) || null;

/* what a task is in service of — a goal, or a project, or nothing */
function taskServes(td) {
  if (td.linkGoalId) { const g = (state.goals || []).find(x => x.id === td.linkGoalId); if (g) return { emoji: g.emoji || "\u{1F3AF}", name: g.title, nav: "habits" }; }
  if (td.projectId) { const pr = (state.projects || []).find(x => x.id === td.projectId); if (pr) return { emoji: pr.emoji || "\u{1F680}", name: pr.name, nav: "projects" }; }
  return null;
}
const estLabel = (m) => !m ? "" : m >= 60 ? (Math.round(m / 60 * 10) / 10) + "h" : m + "m";

/* Day N of a challenge, if one is running. Returns null the rest of the time, so the welcome line
   simply does not mention it. */
/* ---- habit groups ----
   A group is a named set of habits. Give it a start date and a length and it becomes a CHALLENGE
   with a day counter; leave those blank and it is simply a category. One list, two uses. */
const groupsAll = () => (state.groups || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
const groupById = (id) => (state.groups || []).find(g => g.id === id) || null;
const habitsInGroup = (id) => liveHabits().filter(h => (h.groupId || "") === (id || ""));
const isChallenge = (g) => !!(g && g.start && g.days > 0);

/* Day N of a challenge group, or null. */
function groupDay(g, d = todayIso()) {
  if (!isChallenge(g)) return null;
  const n = Math.floor((Date.parse(d + "T12:00:00") - Date.parse(g.start + "T12:00:00")) / 86400000) + 1;
  if (n < 1 || n > g.days) return null;
  return { n, of: g.days, name: g.name || "Challenge", pct: clamp(Math.round(100 * n / g.days), 0, 100) };
}
/* If two challenges overlap the banner shows the one STARTED MOST RECENTLY — an arbitrary rule is
   fine, an unstated one is not, so the group card says which is showing. */
function activeChallenge(d = todayIso()) {
  return groupsAll().filter(g => groupDay(g, d)).sort((a, b) => a.start < b.start ? 1 : -1)[0] || null;
}
function challengeDay(d = todayIso()) {
  return groupDay(activeChallenge(d), d);
}
/* how much of a group is done on a given day — the number its header shows */
function groupProgress(g, d = todayIso()) {
  const due = habitsInGroup(g ? g.id : "").filter(h => isScheduled(h, d) && !isSkipped(h, d));
  const done = due.filter(h => habitMet(h, d)).length;
  return { due: due.length, done, pct: due.length ? Math.round(100 * done / due.length) : 0 };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Night owl mode";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ---------- Today (OS home) ---------- */
/* ================= 5 · Today's Timeline =================
   The Bible asks for one ordered view of the day. Nothing new has to be entered for it: five of the
   six sources already carry a time and were simply never read together.

   The one honest complication is items with a DATE but no TIME — a coursework deadline is due
   "today", not "today at 14:00". Those are collected separately and shown under "Any time today"
   rather than being given a slot they don't have. Sorting them as 00:00 would put your essay before
   breakfast, which is a lie the app would be telling on your behalf. */

const EV_CATS = ["Class", "Meeting", "Personal", "Travel", "Health", "Other"];
const CAT_ICON = { Class: "\u{1F393}", Meeting: "\u{1F91D}", Personal: "\u{1F331}",
                   Travel: "\u{1F686}", Health: "\u2764\uFE0F", Other: "\u{1F4C5}" };
const eventsOn = (d) => (state.events || []).filter(e => e.date === d);
const hhmm = (t) => /^\d{2}:\d{2}$/.test(t || "") ? t : "";

function timelineOn(d) {
  const timed = [], anytime = [];
  const add = (row) => (row.time ? timed : anytime).push(row);

  eventsOn(d).forEach(e => add({ kind: "event", id: e.id, time: hhmm(e.time), title: e.title,
    sub: e.category || "Event", icon: e.icon || CAT_ICON[e.category] || "\u{1F4C5}", hue: "#8e4ec6",
    mins: e.mins || 0, action: "event-open" }));

  /* Only TIMED tasks. An untimed task is already sitting in Today's Focus three cards up, and the
     Bible is explicit that duplicated information is a cost, not a courtesy. Giving it a slot here
     would say it happens at a particular hour, which is the one thing we know it doesn't. */
  tasksOn(d).filter(td => hhmm(td.time)).forEach(td => add({ kind: "task", id: td.id, time: td.time,
    title: td.text, sub: "task", icon: "\u2713", hue: "#3e63dd", done: td.done, action: "todo-open" }));

  (state.nutrition.meals || []).filter(m => hhmm(m.time)).forEach(m => add({ kind: "meal", id: m.id,
    time: m.time, title: m.name || m.slot, sub: m.slot || "meal", icon: "\u{1F37D}\uFE0F", hue: "#30a46c",
    done: !!(state.nutrition.log[d] || {})[m.id], nav: "nutrition" }));

  /* a plan item is scheduled by weekday, so "is it on today" is a cadence question, not a date one */
  (state.workout.plan || []).filter(pl => hhmm(pl.time) && (pl.days || []).includes(WEEKDAY_MON0(d)))
    .forEach(pl => add({ kind: "workout", id: pl.id, time: pl.time, title: pl.name,
      sub: pl.category || "workout", icon: pl.emoji || "\u{1F3CB}\uFE0F", hue: "#f76b15",
      done: (state.workout.log[d] || []).length > 0, nav: "workout" }));

  liveHabits().filter(h => hhmm(h.remindAt) && isScheduled(h, d) && !isSkipped(h, d))
    .forEach(h => add({ kind: "habit", id: h.id, time: h.remindAt, title: h.name, sub: "habit",
      icon: h.emoji || "\u2705", hue: h.color || "#6a5ae0", done: habitMet(h, d), action: "ag-habit" }));

  /* date but no time — never given a slot */
  (learnTasks() || []).filter(k => !k.done && k.due === d)
    .forEach(k => anytime.push({ kind: "uni", id: k.id, time: "", title: k.title,
      sub: k.tag || taskKind(k).label, icon: "\u{1F3DB}\uFE0F", hue: "#3e63dd", nav: "learning" }));

  timed.sort((a, b) => a.time.localeCompare(b.time) || String(a.title).localeCompare(String(b.title)));
  return { timed, anytime };
}

function timelineCard(d) {
  const { timed, anytime } = timelineOn(d);
  const isToday = d === todayIso();
  const now = new Date().toTimeString().slice(0, 5);
  const head = cardHead("Today's timeline", `<button class="btn ghost tiny" data-action="event-add">${I.plus}Add</button>`);
  if (!timed.length && !anytime.length) {
    return card("span2 timeline-card", head +
      `<p class="soft small">Nothing scheduled today. That is a rest day, not a broken page \u{1F324}\uFE0F</p>` +
      `<p class="soft note">${I.spark} Times come from your own tasks, meals, workout plan and habit reminders \u2014 add an event for anything else.</p>`);
  }
  /* the "now" line goes between the last item that has passed and the next that hasn't */
  const nextIdx = isToday ? timed.findIndex(r => r.time > now) : -1;
  const row = (r) => `<li class="tl ${r.done ? "done" : ""}" style="--a:${cssVar(r.hue)}"
      ${r.action ? `data-action="${r.action}" data-id="${r.id}"` : r.nav ? `data-nav="${r.nav}"` : ""}>
    <span class="tl-time">${r.time ? esc(r.time) : "\u2014"}</span>
    <span class="tl-dot" aria-hidden="true"></span>
    <span class="tl-ic" aria-hidden="true">${esc(r.icon)}</span>
    <span class="tl-txt"><b>${esc(r.title)}</b><small>${esc(r.sub)}${r.mins ? ` \u00b7 ${estLabel(r.mins)}` : ""}</small></span>
    ${r.done ? `<span class="tl-done" aria-label="done">${I.check}</span>` : ""}
  </li>`;
  const nowLine = `<li class="tl-now" aria-hidden="true"><span class="tl-time">${esc(now)}</span><span class="tl-line"></span></li>`;
  const rows = timed.map((r, i) => (i === nextIdx ? nowLine : "") + row(r)).join("")
    + (isToday && nextIdx === -1 && timed.length ? nowLine : "");
  return card("span2 timeline-card", head +
    (rows ? `<ul class="timeline">${rows}</ul>` : "") +
    (anytime.length ? `<p class="tl-anytime">Any time today</p><ul class="timeline">${anytime.map(row).join("")}</ul>` : "") +
    `<p class="soft note">${I.spark} This is your own schedule \u2014 LifeHub does not sync with Google or Apple Calendar. That needs a sign-in and a server, and this app deliberately has neither.</p>`);
}

function openEventDetail(id) {
  const e = (state.events || []).find(x => x.id === id);
  if (!e) { closeModal(); return; }
  openModal(`<header class="modal-head"><h3>${esc(e.icon || CAT_ICON[e.category] || "\u{1F4C5}")} ${esc(e.title)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <p class="soft small">${esc(niceDate(e.date, { weekday: "long", month: "long", day: "numeric" }))}${e.time ? ` \u00b7 ${esc(e.time)}` : " \u00b7 any time"}${e.mins ? ` \u00b7 ${estLabel(e.mins)}` : ""}</p>
      ${e.category ? `<p class="soft small">${esc(e.category)}</p>` : ""}
      ${e.note ? `<p class="habit-why">${esc(e.note)}</p>` : ""}
      ${relatedCard("event", e.id)}
      ${historyCard("event", e.id)}
      <div class="pill-row"><button class="btn ghost" data-action="event-edit" data-id="${e.id}">${I.edit}Edit</button><button class="btn danger" data-action="event-del" data-id="${e.id}">${I.trash}Delete</button></div>
    </div>`);
}
function eventFormFields(e) {
  e = e || {};
  return fld("What is it?", txt("title", "e.g. Statistics lecture", e.title || "")) +
    `<div class="fld-row">${fld("Date", `<input type="date" name="date" value="${esc(e.date || todayIso())}" required>`)}${fld("Time <small class=\"soft\">— leave blank for any time</small>", `<input type="time" name="time" value="${esc(e.time || "")}">`)}</div>` +
    `<div class="fld-row">${fld("How long? (minutes)", num("mins", e.mins || 0, 0))}${fld("Category", `<select name="category">${EV_CATS.map(c => `<option ${e.category === c ? "selected" : ""}>${c}</option>`).join("")}</select>`)}</div>` +
    fld("Note", `<textarea name="note" maxlength="400" placeholder="Room, who's there, what to bring…">${esc(e.note || "")}</textarea>`);
}

/* todayAgenda() and agendaRow() lived here: the old Today page's flat list of everything due.
   That page merged into the Dashboard long ago and nothing has called either since — they were dead
   code. The Bible asks for a TIMELINE in that slot instead, which is a different thing: ordered by
   the clock, not a bag of items. See timelineOn(). */

function openReflectModal() {
  openModal(`<header class="modal-head"><h3>${I.spark} Daily reflection</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body"><p class="reflect-prompt">${esc(reflectionOfDay())}</p>
      <textarea class="reflect-input" data-change="reflection" placeholder="A sentence or two…" maxlength="1000">${esc(state.reflections[todayIso()] || "")}</textarea>
      <div class="modal-foot"><button type="button" class="btn primary" data-action="modal-close">Done</button></div></div>`);
}
/* keyword → habit suggestion (the offline "smart" half of Both) */
function suggestHabitForText(text) {
  const s = (text || "").toLowerCase();
  const rules = [
    [/(workout|calisthen|gym|lift|weights|cardio|run|running|training|exercise|yoga|dance|pilates|hiit)/, h => h.kind === "workout" || /workout|exercise|gym|train/i.test(h.name)],
    [/(reflect|journal|diary|gratitude)/, h => /journal|reflect|gratitude|diary/i.test(h.name)],
    [/(read|book|pages|chapter)/, h => /read/i.test(h.name)],
    [/(water|hydrate|drink)/, h => /water|hydrate|drink/i.test(h.name)],
    [/(meditat|breath|mindful)/, h => /meditat|breath|mindful/i.test(h.name)],
    [/(walk|steps|stroll)/, h => /walk|step/i.test(h.name)],
    [/(sleep|bed|rest)/, h => /sleep|bed/i.test(h.name)],
    [/(study|learn|course|lesson|language)/, h => /learn|study|language|course/i.test(h.name)],
  ];
  for (const [re, pred] of rules) if (re.test(s)) { const h = state.habits.find(pred); if (h) return h.id; }
  const h2 = state.habits.find(h => { const n = h.name.toLowerCase(); return n && (s.includes(n) || n.split(/\s+/).some(w => w.length > 3 && s.includes(w))); });
  return h2 ? h2.id : "";
}
function completeHabitToday(habitId) {
  const h = state.habits.find(x => x.id === habitId); if (!h) return;
  const d = todayIso();
  if (habitMet(h, d) || h.type === "avoid") return;
  const e = ensureHabitEntry(h, d);
  if (h.type === "quantity") e.amount = h.target || 1; else e.done = true;
  addXp(10, h.name);
}
/* ---------- cross-linking: one check syncs task ⇄ habit / supplement ---------- */
const AREA_RULES = [
  [/\b(pay|paid|bill|billed|tuition|rent|buy|bought|purchase|subscription|invoice|expense|budget|salary|refund|deposit|spent|cost|fee)\b/, "finance"],
  [/\b(eat|ate|meal|breakfast|lunch|dinner|snack|cook|cooked|groceries|grocery|recipe)\b/, "nutrition"],
  [/\b(project|ship|shipped|launch|deploy|prototype|feature)\b/, "projects"],
  [/\b(study|studying|studied|course|lecture|revise|homework|assignment|exam|lesson|resume|portfolio|interview)\b/, "learning"],
  [/\b(workout|gym|train|training|exercise|run|running|lift|calisthen|yoga)\b/, "workout"],
  [/\b(read|reading|book|chapter|pages)\b/, "reading"],
  [/\b(call|texted|text|meet|meetup|hangout|visit|birthday)\b/, "social"],
  [/\b(journal|reflect|gratitude|diary)\b/, "journal"],
  [/\b(movie|watch|series|episode|film|show)\b/, "media"],
];
function suggestLinkForText(text) {
  const s = (text || "").toLowerCase();
  // money verbs are unambiguous — a "pay/buy/bill" task is a Finance expense even if other words match
  if (AREA_RULES[0][0].test(s)) return { type: "area", id: "finance" };
  // supplements: match a supplement whose name (or a significant word of it) appears in the task
  const sup = state.nutrition.supplements.find(x => {
    const n = (x.name || "").toLowerCase();
    return n && (s.includes(n) || n.split(/\s+/).some(w => w.length > 2 && s.includes(w)));
  });
  if (sup) return { type: "sup", id: sup.id };
  const hid = suggestHabitForText(text);
  if (hid) return { type: "habit", id: hid };
  for (const [re, id] of AREA_RULES) if (re.test(s) && areaOf(id)) return { type: "area", id };
  return { type: "", id: "" };
}
function taskForLink(type, id) {
  if (!id) return null;
  const t = todayIso();
  return state.todos.find(td => (!td.date || td.date === t) && (type === "sup" ? td.supId === id : td.habitId === id));
}
function completeSupplementToday(supId) {
  if (!supId) return;
  if (state.nutrition.supTaken[supId] !== todayIso()) { state.nutrition.supTaken[supId] = todayIso(); addXp(3, "Supplement taken"); }
}
function markLinkedTaskDone(type, id, done) {
  const td = taskForLink(type, id);
  if (td && !!td.done !== done) { td.done = done; if (done) addXp(5, "Task done"); }
}
/* called when a task is toggled: propagate to its linked habit / supplement */
function syncTaskToLinks(td) {
  if (td.done) {
    if (td.habitId) completeHabitToday(td.habitId);
    if (td.supId) completeSupplementToday(td.supId);
    // smart-log: a finance task pops an amount prompt (deferred so it survives the handler's closeModal)
    if (td.areaId === "finance" && !td._logged) { td._logged = true; setTimeout(() => finEntryForm("expense", null, td.text, "Other"), 40); }
  } else {
    if (td.supId && state.nutrition.supTaken[td.supId] === todayIso()) delete state.nutrition.supTaken[td.supId];
    td._logged = false;
  }
}
/* called when a habit is toggled: reflect its state onto a habit-linked task */
function syncHabitToTask(habitId) {
  const h = state.habits.find(x => x.id === habitId); if (!h) return;
  markLinkedTaskDone("habit", habitId, habitMet(h, todayIso()));
}
/* ---------- tasks: repeats, carry-forward, order ---------- */
/* A repeating task reuses the habit cadence shape rather than inventing a second one, so
   "every day" and "Mon/Wed/Fri" mean exactly what they already mean elsewhere in the app. */
function taskDueOn(rep, d) {
  if (!rep) return false;
  if (rep.mode === "days") return (rep.days || []).includes(WEEKDAY_MON0(d));
  return true;                                   // daily
}
const taskSort = (a, b) => (a.order - b.order) || (a.time || "99:99").localeCompare(b.time || "99:99");
const tasksOn = (d) => state.todos.filter(td => (td.date || d) === d).sort(taskSort);
const nextTaskOrder = () => state.todos.reduce((m, td) => Math.max(m, td.order || 0), 0) + 1;
/* unfinished and dated before today — the ones that used to disappear */
const strandedTasks = () => state.todos.filter(td => !td.done && td.date && td.date < todayIso())
  .sort((a, b) => a.date < b.date ? -1 : 1);

const KEEP_DONE_DAYS = 90;
/* A daily repeat is ~365 rows a year inside a blob that is re-encrypted and re-uploaded on every
   change, so spawned instances are not kept forever. One-off tasks you typed yourself always are —
   deleting something a person wrote is not a housekeeping decision. */
function pruneTasks() {
  const cutoff = addDays(todayIso(), -KEEP_DONE_DAYS);
  const before = state.todos.length;
  state.todos = state.todos.filter(td => !(td.done && td.seriesId && td.date && td.date < cutoff));
  return before - state.todos.length;
}

/* Runs at boot and whenever the app comes back to a new day. Spawns today's repeats, prunes, and
   hands any stranded tasks to the once-a-day prompt. */
function rollTasks() {
  const t = todayIso();
  if (state.tasksRolledOn === t) return 0;
  let made = 0;
  /* one instance per series per day, no matter how many times this runs */
  const seen = new Set(state.todos.filter(td => td.date === t && td.seriesId).map(td => td.seriesId));
  const seriesSeeds = new Map();
  state.todos.forEach(td => {
    if (!td.repeat || !td.seriesId) return;
    const prev = seriesSeeds.get(td.seriesId);
    if (!prev || (td.date || "") > (prev.date || "")) seriesSeeds.set(td.seriesId, td);
  });
  seriesSeeds.forEach((seed, sid) => {
    if (seen.has(sid) || !taskDueOn(seed.repeat, t)) return;
    state.todos.push({
      id: uid(), text: seed.text, done: false, date: t, time: seed.time || "",
      habitId: seed.habitId || "", supId: seed.supId || "", areaId: seed.areaId || "",
      order: seed.order || nextTaskOrder(), repeat: seed.repeat, seriesId: sid, from: "",
      /* what the task IS carries forward; what you decided about TODAY does not — a new copy is not
         automatically your focus, and never inherits "the hard thing" */
      priority: seed.priority || "med", estMin: seed.estMin || 0,
      linkGoalId: seed.linkGoalId || "", projectId: seed.projectId || "", focus: false, hard: false,
    });
    made++;
  });
  pruneTasks();
  pruneFocusLog();
  gcLinks();
  return made;
}

/* ================= focus sessions =================
   The app's only clock. Two rules govern everything below.

   1. Elapsed time is DERIVED FROM WALL-CLOCK STAMPS, never counted in ticks. A background tab has
      its timers throttled to roughly once a minute, and a reload has no ticks at all — a counter
      would drift and then reset. Subtracting stored timestamps is correct across reload, sleep and
      backgrounding without any of them being special-cased.
   2. A tick NEVER writes. save() marks the cloud dirty and schedules an encrypt-and-upload of the
      whole database, so a per-second save would upload continuously. State is written on start,
      pause, resume, finish and discard — the five moments a person actually did something. */

const FOCUS_DEFAULT_MIN = 25;
const FOCUS_KEEP_DAYS = 365;         // a year of focus history is useful and tiny; forever is not
let _focusTimer = null;

const focusRunning = () => !!(state.focus && !state.focus.pausedAt);
/* milliseconds of actual focus so far — paused time is subtracted, not counted */
function focusElapsed(f = state.focus, now = Date.now()) {
  if (!f) return 0;
  return Math.max(0, (f.pausedAt || now) - f.startedAt - (f.pausedMs || 0));
}
/* milliseconds left, floored at zero — a finished session sits at 0 waiting to be logged, it does
   not run into negative numbers */
const focusLeft = (f = state.focus, now = Date.now()) =>
  !f ? 0 : Math.max(0, f.mins * 60000 - focusElapsed(f, now));
const focusDone = (f = state.focus, now = Date.now()) => !!f && focusLeft(f, now) === 0;
const mmss = (ms) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function startFocus(td, mins) {
  if (state.focus) { toast(`"${state.focus.title}" is still running — finish it first`); return false; }
  /* the title and links are SNAPSHOTTED here, not looked up later. That is what lets the task be
     deleted (or undeleted) mid-session without the bar breaking or the log losing its meaning. */
  state.focus = {
    id: uid(), taskId: td ? td.id : "", title: td ? td.text : "Focus",
    mins: clamp(parseInt(mins, 10) || FOCUS_DEFAULT_MIN, 1, 240),
    startedAt: Date.now(), pausedAt: 0, pausedMs: 0,
    goalId: td ? (td.linkGoalId || "") : "", projectId: td ? (td.projectId || "") : "",
  };
  save(); renderFocusBar(); startFocusTimer();
  return true;
}
function pauseFocus() {
  if (!state.focus || state.focus.pausedAt) return;
  state.focus.pausedAt = Date.now();
  save(); renderFocusBar(); startFocusTimer();
}
function resumeFocus() {
  const f = state.focus;
  if (!f || !f.pausedAt) return;
  f.pausedMs = (f.pausedMs || 0) + (Date.now() - f.pausedAt);
  f.pausedAt = 0;
  save(); renderFocusBar(); startFocusTimer();
}
function extendFocus(mins) {
  if (!state.focus) return;
  state.focus.mins = clamp(state.focus.mins + mins, 1, 240);
  state.focus.rang = false;                        // it can ring again for the new stretch
  save(); renderFocusBar(); startFocusTimer();
}
/* Logged minutes are CAPPED at what was committed to. You legitimately focus with the app closed —
   that is rather the point — but the session was a promise of N minutes, so N is the most it can
   ever claim. An elapsed value of eight hours means the tab was left open, not that you worked. */
/* `re` carries the optional reflection. Every field empty must produce exactly the row this wrote
   before P2 — the reflection is never the price of recording the work. */
function finishFocus(markDone, re) {
  const f = state.focus;
  if (!f) return null;
  const r = re || {};
  const mins = clamp(Math.round(focusElapsed(f) / 60000), 0, f.mins);
  const t = todayIso();
  const row = { id: f.id, taskId: f.taskId, title: f.title, mins,
                goalId: f.goalId, projectId: f.projectId, at: new Date().toISOString(),
                focus: clamp(+r.focus || 0, 0, 5),
                outcome: String(r.outcome || "").slice(0, 400),
                obstacles: String(r.obstacles || "").slice(0, 400),
                next: String(r.next || "").slice(0, 200) };
  (state.focusLog[t] = state.focusLog[t] || []).push(row);
  /* The next action becomes the project's next step only when asked, and only where there are no
     milestones — with milestones the next step is already the first unticked one, and a second
     answer to "what's next" is the exact thing the Projects page was built to remove. */
  if (r.setNext && row.next && f.projectId) {
    const pr = (state.projects || []).find(x => x.id === f.projectId);
    if (pr && !projectDerived(pr)) pr.nextMilestone = row.next.slice(0, 90);
  }
  state.focus = null;
  stopFocusTimer();
  /* the same path the checkbox uses, so cross-linked habits and supplements still get ticked */
  if (markDone && f.taskId) {
    const td = state.todos.find(x => x.id === f.taskId);
    if (td && !td.done) { td.done = true; syncTaskToLinks(td); }
  }
  save();
  /* A focus session is one of the few things in this app that is unambiguously WORK. Recording it
     against whatever it served is how a project's history stops being empty. */
  if (mins > 0) {
    /* an outcome, where one was written, is more use in a history line than the task's title */
    const what = `Focused ${mins} min\u00a0\u00b7 ${row.outcome || f.title}`;
    if (f.taskId) touch("task", f.taskId, `Focused ${mins} min`);
    if (f.goalId) touch("goal", f.goalId, what);
    if (f.projectId) touch("project", f.projectId, what);
    addXp(15, `${mins} min focused`);              // addXp saves and refreshes the topbar itself
  }
  renderFocusBar(); render();
  return row;
}
function discardFocus() {
  state.focus = null;
  stopFocusTimer();
  save(); renderFocusBar(); render();
}
const focusMinutesOn = (d) => (state.focusLog[d] || []).reduce((n, r) => n + (r.mins || 0), 0);
const focusMinutesFor = (key, id, d = todayIso()) =>
  !id ? 0 : (state.focusLog[d] || []).filter(r => r[key] === id).reduce((n, r) => n + (r.mins || 0), 0);
function pruneFocusLog() {
  const cutoff = addDays(todayIso(), -FOCUS_KEEP_DAYS);
  Object.keys(state.focusLog || {}).forEach(d => { if (d < cutoff) delete state.focusLog[d]; });
}

/* ---- the bar ----
   Lives outside #view (see index.html) so navigating cannot destroy a running session. It is drawn
   by renderFocusBar() on every state change; between those, the interval below touches exactly one
   text node. It must never call render() — replacing the whole view once a second would steal focus
   from whatever the person is typing into. */
function renderFocusBar() {
  const el = $("#focusBar");
  if (!el) return;
  const f = state.focus;
  if (!f) { el.hidden = true; el.innerHTML = ""; return; }
  const done = focusDone(f), paused = !!f.pausedAt;
  el.hidden = false;
  el.className = "focus-bar" + (done ? " is-done" : paused ? " is-paused" : "");
  el.innerHTML = done
    ? `<span class="fb-time" id="focusTime">${f.mins}:00</span>
       <span class="fb-txt"><b>Time's up</b><small>${esc(f.title)}</small></span>
       <button class="btn ghost tiny" data-action="focus-extend">+5 min</button>
       <button class="btn primary tiny" data-action="focus-finish">${I.check}Log it</button>
       <button class="icon-btn ghost" data-action="focus-discard" aria-label="Discard this session">${I.x}</button>`
    : `<span class="fb-time" id="focusTime">${mmss(focusLeft(f))}</span>
       <span class="fb-txt"><b>${esc(f.title)}</b><small>${paused ? "Paused" : `${f.mins} min session`}</small></span>
       <button class="btn ghost tiny" data-action="${paused ? "focus-resume" : "focus-pause"}">${paused ? "Resume" : "Pause"}</button>
       <button class="btn primary tiny" data-action="focus-finish">Finish</button>
       <button class="icon-btn ghost" data-action="focus-discard" aria-label="Discard this session">${I.x}</button>`;
}
function focusTick() {
  const f = state.focus;
  if (!f) { stopFocusTimer(); return; }
  if (focusDone(f)) {
    renderFocusBar();                 // the buttons change, so this transition needs a full redraw
    stopFocusTimer();
    if (!f.rang) { f.rang = true; save(); ringFocus(f); }
    return;
  }
  const n = $("#focusTime");
  if (n) n.textContent = mmss(focusLeft(f));   // one text node, no save, no render
}
function startFocusTimer() {
  stopFocusTimer();
  renderFocusBar();
  if (focusRunning() && !focusDone()) _focusTimer = setInterval(focusTick, 1000);
  else if (state.focus && focusDone() && !state.focus.rang) focusTick();
}
function stopFocusTimer() { clearInterval(_focusTimer); _focusTimer = null; }
/* Reuses the reminder permission rather than asking for its own. If reminders are off this stays
   silent — and the start sheet says so — because a permission prompt fired the instant someone
   sits down to concentrate is the worst possible moment to ask. */
function ringFocus(f) {
  toast(`${f.mins} minutes done — ${f.title} 🌿`, "xp");
  if (notifyPermission() === "granted") {
    sendNudge({ key: "focus-" + f.id, title: "⏱ Focus session done",
                body: `${f.mins} minutes on "${f.title}".`, nav: "dashboard" }).catch(() => {});
  }
}

function openFocusStart(id) {
  const td = state.todos.find(x => x.id === id);
  if (!td) { toast("That task is gone"); return; }
  const suggested = td.estMin ? clamp(td.estMin, 1, 240) : FOCUS_DEFAULT_MIN;
  openModal(`<form data-submit="focus-start">
    <header class="modal-head"><h3>Focus session</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <p class="focus-task">${esc(td.text)}</p>
      <input type="hidden" name="id" value="${td.id}">
      <label class="fld"><span>How long?</span>
        <select name="mins">
          ${[15, 25, 45, 60, 90].concat(suggested).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b)
            .map(m => `<option value="${m}" ${m === suggested ? "selected" : ""}>${m} minutes</option>`).join("")}
        </select></label>
      <p class="soft note">${I.spark} The clock keeps running if you switch section, close the tab or reload — it counts real time, not screen time. At the end it stops and asks before logging anything.</p>
      ${notifyPermission() === "granted" ? "" : `<p class="soft note">${I.bell} It can't buzz you when time is up — reminders aren't switched on. Turn them on in <b>Profile → Reminders</b> if you want the bell.</p>`}
    </div>
    <footer class="modal-foot">
      <button type="button" class="btn ghost" data-action="modal-close">Cancel</button>
      <button type="submit" class="btn primary">${I.clock}Start</button>
    </footer></form>`);
}
/* Finishing OFFERS to tick the task; it never assumes. Twenty-five minutes on something rarely
   means the something is over, and a done list full of unfinished work is worse than no done list. */
const FOCUS_RATING = ["", "Scattered", "Patchy", "OK", "Good", "Deep"];
/* The reflection is offered ONLY for a session that served a project. A 25-minute timer on "reply
   to emails" gets the same one-tap finish it always had — four textareas on every pomodoro is the
   friction the Bible's own principles warn against, and a goal has nowhere to display them. */
function focusReflectFields(pr) {
  const canSetNext = !projectDerived(pr);
  return `<details class="reflect">
    <summary>How did it go? <small class="soft">— optional</small></summary>
    <div class="reflect-body">
      <div class="fld"><span>Focus</span>
        <div class="rate-row" role="radiogroup" aria-label="How focused were you?">
          ${[1, 2, 3, 4, 5].map(n => `<label class="rate-chip">
            <input type="radio" name="focus" value="${n}"><span>${n}<i>${esc(FOCUS_RATING[n])}</i></span>
          </label>`).join("")}
        </div>
      </div>
      ${fld("What got done", `<textarea name="outcome" maxlength="400" rows="2" placeholder="the thing you actually finished…"></textarea>`)}
      ${fld("What got in the way <small class=\"soft\">— optional</small>", `<textarea name="obstacles" maxlength="400" rows="2" placeholder="what slowed it down"></textarea>`)}
      ${fld("Next action", txt("next", "where to pick up next time", "", false))}
      ${canSetNext ? `<label class="chip-check" style="display:inline-flex;margin-top:2px">
        <input type="checkbox" name="setNext"><span>…and make this ${esc(pr.name)}'s next step</span></label>`
        : `<p class="soft small">${I.target} ${esc(pr.name)} takes its next step from its milestones, so this note stays with the session.</p>`}
      <p class="soft note">${I.clock} Sessions — and these notes with them — are kept for ${Math.round(FOCUS_KEEP_DAYS / 365)} year, then dropped. They can't be edited afterwards, so write what you'd want to read.</p>
    </div>
  </details>`;
}
function openFocusFinish() {
  const f = state.focus;
  if (!f) return;
  const mins = clamp(Math.round(focusElapsed(f) / 60000), 0, f.mins);
  const td = f.taskId ? state.todos.find(x => x.id === f.taskId) : null;
  const pr = f.projectId ? (state.projects || []).find(x => x.id === f.projectId) : null;
  openModal(`<form data-submit="focus-log">
    <header class="modal-head"><h3>${focusDone(f) ? "Session complete" : "End this session"}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <p class="focus-task">${esc(f.title)}</p>
      <p class="focus-total"><b>${mins}</b> minute${mins === 1 ? "" : "s"} focused${mins < f.mins ? ` <small class="soft">of ${f.mins} planned</small>` : ""}</p>
      ${td && !td.done ? `<label class="chip-check" style="display:inline-flex;margin:4px 0 8px">
        <input type="checkbox" name="markDone"><span>…and mark the task done</span></label>` : ""}
      ${!td && f.taskId ? `<p class="soft note">${I.spark} That task has since been deleted — the minutes are still logged against what you were doing.</p>` : ""}
      ${pr ? focusReflectFields(pr) : ""}
    </div>
    <footer class="modal-foot">
      <button type="button" class="btn danger" data-action="focus-discard">Discard</button>
      <button type="submit" class="btn primary">${I.check}Log it</button>
    </footer></form>`);
}

/* The prompt the user chose over silent auto-carry: shown at most once a day, and only when there is
   actually something stranded. Answering it (either way) marks the day as rolled. */
function maybeCarryForward() {
  const t = todayIso();
  if (state.tasksRolledOn === t) return false;
  const stranded = strandedTasks();
  if (!stranded.length) { state.tasksRolledOn = t; save(); return false; }
  openModal(`
    <header class="modal-head"><h3>${stranded.length} unfinished from before</h3>
      <button type="button" class="icon-btn" data-action="carry-dismiss" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <p class="soft">These were never finished. Bring them into today, or let them go.</p>
      <ul class="check-list carry-list">
        ${stranded.map(td => `<li data-carry="${td.id}">
          <span class="row-emoji">✅</span>
          <span class="row-txt"><b>${esc(td.text)}</b><small>${esc(niceDate(td.date, { weekday: "long", month: "short", day: "numeric" }))}</small></span>
          <span class="pill-row">
            <button class="btn tiny" data-action="carry-one" data-id="${td.id}">${I.check}Today</button>
            <button class="icon-btn ghost" data-action="carry-drop" data-id="${td.id}" aria-label="Drop ${esc(td.text)}">${I.trash}</button>
          </span>
        </li>`).join("")}
      </ul>
    </div>
    <footer class="modal-foot">
      <button type="button" class="btn ghost" data-action="carry-dismiss">Not now</button>
      <button type="button" class="btn primary" data-action="carry-all">${I.check}Bring all forward</button>
    </footer>`);
  return true;
}
function carryTask(td) { if (td) { td.from = td.date; td.date = todayIso(); td.done = false; } }
/* The repeat belongs to the SERIES, not to the copy you happen to have open. Setting it on one row
   only would leave older copies still carrying it — and since rollTasks seeds from the latest row
   in a series, switching a repeat off would look like it worked and then keep spawning tomorrow.
   Each row gets its own object so two todos never share one mutable repeat. */
function setSeriesRepeat(td, rep) {
  const rows = td.seriesId ? state.todos.filter(x => x.seriesId === td.seriesId) : [td];
  rows.forEach(x => { x.repeat = rep ? JSON.parse(JSON.stringify(rep)) : null; });
}
/* after handling one, keep the sheet open if there are more; close and settle the day if not */
function maybeCarryForwardAgain() {
  if (strandedTasks().length) { maybeCarryForward(); return true; }
  state.tasksRolledOn = todayIso(); closeModal(); save(); render();
  return false;
}
/* Swap with the neighbour in the CURRENT visible order, so the arrows do what they look like.
   If two rows share an order value (possible after a migration backfill), renumber first. */
function swapOrder(list, id, dir) {
  const i = list.findIndex(x => x.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return false;
  if (list[i].order === list[j].order) list.forEach((x, k) => { x.order = k; });
  const a = list[i].order;
  list[i].order = list[j].order; list[j].order = a;
  return true;
}
function moveTask(id, dir) {
  if (swapOrder(tasksOn(todayIso()).filter(td => !td.done), id, dir)) { save(); render(); }
}
function moveHabit(id, dir) {
  const d = dayCursor("habits");
  if (swapOrder(liveHabits().filter(h => isScheduled(h, d) && !isSkipped(h, d)), id, dir)) { save(); render(); }
}

function taskRow(td, i, total, opts) {
  const o = opts || {};
  const h = td.habitId ? state.habits.find(x => x.id === td.habitId) : null;
  const sup = td.supId ? state.nutrition.supplements.find(x => x.id === td.supId) : null;
  const ar = td.areaId ? areaOf(td.areaId) : null;
  const link = h ? `<small>${I.target} ${esc(h.name)}</small>` : sup ? `<small>💊 ${esc(sup.name)}</small>`
    : ar ? `<small class="task-area" style="--a:${cssVar(ar.hue)}">${esc(ar.name)}</small>` : "";
  const pr = td.priority ? prio(td.priority) : null;
  const serves = taskServes(td);
  const marks = [
    td.from ? `<small class="task-from">${I.chevL}from ${esc(niceDate(td.from, { weekday: "short" }))}</small>` : "",
    td.repeat ? `<small class="task-rep" title="${esc(repeatLabel(td.repeat))}">${I.spark}${esc(repeatShort(td.repeat))}</small>` : "",
    pr && td.priority !== "med" ? `<small class="task-prio" style="--a:${cssVar(pr.hue)}">${pr.label}</small>` : "",
    td.estMin ? `<small class="task-est">${esc(estLabel(td.estMin))}</small>` : "",
    serves ? `<small class="task-serves">${serves.emoji} ${esc(serves.name)}</small>` : "",
    o.auto ? `<small class="task-auto">auto-picked</small>` : "",
  ].join("");
  /* i/total are passed only from the ordered "to do" list — the done drawer has nothing to reorder */
  const canMove = typeof i === "number" && total > 1;
  return `<li class="todo ${td.done ? "done" : ""}" data-row-id="${td.id}">
    <span class="todo-time">${td.time || ""}</span>
    <button class="checkbox" data-action="todo-toggle" data-id="${td.id}" aria-label="Toggle task">${I.check}</button>
    <span class="row-txt open" data-action="todo-open" data-id="${td.id}"><b>${esc(td.text)}</b>${link || marks ? `<span class="task-marks">${link}${marks}</span>` : ""}</span>
    ${o.pin && !td.done ? `<button class="icon-btn ghost pin ${td.focus ? "on" : ""}" data-action="task-pin" data-id="${td.id}" aria-pressed="${td.focus ? "true" : "false"}" aria-label="${td.focus ? "Unpin from today's focus" : "Pin to today's focus"}">${I.target}</button>` : ""}
    ${canMove ? `<span class="grip" data-drag="${td.id}" aria-hidden="true" title="Drag to reorder">${I.grip}</span>` : ""}
    <button class="icon-btn ghost" data-action="todo-open" data-id="${td.id}" aria-label="Edit task">${I.chevR}</button>
  </li>`;
}
const repeatShort = (r) => !r ? "" : r.mode === "days" ? (r.days || []).map(i => WD_SHORT[i]).join("") : "daily";
const repeatLabel = (r) => !r ? "Does not repeat" : r.mode === "days"
  ? "Repeats on " + (r.days || []).map(i => WD_SHORT[i]).join(", ") : "Repeats every day";
function openTaskDetail(id) {
  const td = state.todos.find(x => x.id === id); if (!td) { closeModal(); return; }
  openModal(`<header class="modal-head"><h3>Task</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <label class="fld"><span>Task</span><input type="text" data-change="task-text" data-id="${td.id}" value="${esc(td.text)}" maxlength="120"></label>
      <div class="fld-row">
        <label class="fld"><span>Time (optional)</span><input type="time" data-change="task-time" data-id="${td.id}" value="${td.time || ""}"></label>
        <label class="fld"><span>Counts toward</span>
          <select data-change="task-link" data-id="${td.id}">
            <option value="">— none —</option>
            <optgroup label="Habits">${liveHabits().map(h => `<option value="h:${h.id}" ${td.habitId === h.id ? "selected" : ""}>${esc(h.emoji)} ${esc(h.name)}</option>`).join("")}</optgroup>
            <optgroup label="Supplements">${state.nutrition.supplements.map(s => `<option value="s:${s.id}" ${td.supId === s.id ? "selected" : ""}>${esc(s.emoji || "💊")} ${esc(s.name)}</option>`).join("")}</optgroup>
            <optgroup label="Areas">${AREAS.filter(a => a.id !== "habits").map(a => `<option value="a:${a.id}" ${td.areaId === a.id ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</optgroup>
          </select></label>
      </div>
      <div class="fld-row">
        <label class="fld"><span>Priority</span>
          <select data-change="task-prio" data-id="${td.id}">
            ${Object.keys(PRIORITY).map(k => `<option value="${k}" ${(td.priority || "med") === k ? "selected" : ""}>${PRIORITY[k].label}</option>`).join("")}
          </select></label>
        <label class="fld"><span>How long? (minutes)</span><input type="number" min="0" max="1440" step="5" data-change="task-est" data-id="${td.id}" value="${td.estMin || ""}" placeholder="e.g. 45"></label>
      </div>
      <label class="fld"><span>In service of</span>
        <select data-change="task-serves" data-id="${td.id}">
          <option value="">— nothing in particular —</option>
          <optgroup label="Goals">${activeGoals().map(g => `<option value="g:${g.id}" ${td.linkGoalId === g.id ? "selected" : ""}>${esc(g.emoji || "\u{1F3AF}")} ${esc(g.title)}</option>`).join("")}</optgroup>
          <optgroup label="Projects">${(state.projects || []).filter(p => p.status !== "done").map(p => `<option value="p:${p.id}" ${td.projectId === p.id ? "selected" : ""}>${esc(p.emoji || "\u{1F680}")} ${esc(p.name)}</option>`).join("")}</optgroup>
        </select></label>
      <label class="chip-check" style="display:inline-flex;margin:2px 0 10px">
        <input type="checkbox" data-change="task-hard" data-id="${td.id}" ${td.hard ? "checked" : ""}>
        <span>This is today's hard thing</span></label>
      <p class="soft note">${I.spark} Only one task can be the hard thing — marking this one releases whichever held it before. It gets its own card on the dashboard so three easy wins can't bury it.</p>
      <div class="fld"><span>Repeat</span>
        <select data-change="task-repeat" data-id="${td.id}">
          <option value="" ${!td.repeat ? "selected" : ""}>Never — a one-off</option>
          <option value="daily" ${td.repeat && td.repeat.mode === "daily" ? "selected" : ""}>Every day</option>
          <option value="days" ${td.repeat && td.repeat.mode === "days" ? "selected" : ""}>Specific weekdays</option>
        </select>
      </div>
      ${td.repeat && td.repeat.mode === "days" ? `<label class="fld"><span>On these days</span>
        ${WD_SHORT.map((w, i) => `<label class="chip-check" style="display:inline-flex;margin:0 6px 6px 0"><input type="checkbox" data-change="task-repeat-day" data-id="${td.id}" data-d="${i}" ${(td.repeat.days || []).includes(i) ? "checked" : ""}><span>${w}</span></label>`).join("")}
      </label>` : ""}
      ${td.repeat ? `<p class="soft note">${I.spark} A fresh copy appears on each day it's due. Changing this affects <b>future copies</b> — days you've already ticked keep their record. Completed copies older than ${KEEP_DONE_DAYS} days are cleared automatically; one-off tasks never are.</p>` : ""}
      ${td.from ? `<p class="soft note">${I.chevL} Carried forward from ${esc(niceDate(td.from, { weekday: "long", month: "short", day: "numeric" }))}.</p>` : ""}
      ${td.done ? "" : (state.focus && state.focus.taskId === td.id)
        ? `<button class="btn good slim" data-action="focus-finish" style="margin-bottom:10px">${I.clock}Focusing now — ${focusDone() ? "log it" : mmss(focusLeft()) + " left"}</button>`
        : `<button class="btn ghost slim" data-action="focus-open" data-id="${td.id}" style="margin-bottom:10px">${I.clock}Start a focus session</button>`}
      ${focusMinutesFor("taskId", td.id) ? `<p class="soft small">${I.clock} ${focusMinutesFor("taskId", td.id)} min focused on this today.</p>` : ""}
      <label class="fld"><span>Order</span>
        <span class="pill-row">
          <button type="button" class="btn ghost slim" data-action="task-up" data-id="${td.id}">${I.chevL}Earlier</button>
          <button type="button" class="btn ghost slim" data-action="task-down" data-id="${td.id}">Later${I.chevR}</button>
        </span></label>
      <p class="soft note">${I.grip} On the list you can drag a task by its handle. These buttons do the same thing — drag needs a pointer, so they stay for keyboards and anyone who'd rather not.</p>
      ${relatedCard("task", td.id)}
      ${historyCard("task", td.id)}
      <div class="pill-row"><button class="btn ${td.done ? "good" : "primary"} slim" data-action="todo-toggle" data-id="${td.id}">${td.done ? I.check + "Done — tap to undo" : "Mark done"}</button><button class="btn danger" data-action="todo-del" data-id="${td.id}">${I.trash}Delete</button></div>
    </div>`);
}
function taskAddForm() {
  return `<form data-submit="todo-add" class="task-add">
    <input name="text" placeholder="Add a task…" autocomplete="off" required maxlength="120">
    <input name="time" type="time" class="task-time-in" aria-label="Time (optional)">
    <button class="btn primary" type="submit" aria-label="Add task">${I.plus}</button>
  </form>`;
}
/* ---------- 6 · Habits, compact and measurable ----------
   The spec is explicit: today only, measurable, NO historical statistics. Streaks, heatmaps and
   completion percentages live on the Habit Tracker page — putting them here would turn a decision
   into a scoreboard. What this has to show is the one thing a chip could not: how far through you
   are. A water habit at 1.2 of 2 L is not the same as one you haven't started. */
function habitsTodayCard(d) {
  const due = liveHabits().filter(h => isScheduled(h, d) && !isSkipped(h, d));
  const done = due.filter(h => habitMet(h, d)).length;
  const head = cardHead(`Today's habits${due.length ? ` <small class="soft">${done}/${due.length}</small>` : ""}`,
    `<button class="btn ghost tiny" data-nav="habits">Open habits</button>`);
  if (!due.length) return card("span2", head + `<p class="soft small">Nothing scheduled today — enjoy the rest \u{1F324}\uFE0F</p>`);
  const rows = due.map(h => {
    const met = habitMet(h, d), g = groupById(h.groupId);
    const src = habitSource(h);
    /* a fed habit is ticked by its own area, so tapping goes there rather than pretending to edit */
    const act = h.kind === "workout" ? "habit-workout-jump" : src ? "habit-source-jump" : h.type === "avoid" ? "habit-open" : "ag-habit";
    let sub = "", bar = "";
    if (h.type === "quantity") {
      const amt = habitAmount(h, d);
      sub = `${amt} / ${h.target}${h.unit ? " " + esc(h.unit) : ""}`;
      bar = barHtml(100 * amt / (h.target || 1), h.color);
    } else if (h.type === "avoid") {
      sub = (habitEntry(h, d) || {}).slip ? "slipped today" : "kept";
    }
    return `<li class="dh ${met ? "done" : ""}" style="--hc:${cssVar(h.color, "#6a5ae0")}">
      <button class="dh-hit" data-action="${act}" data-id="${h.id}" aria-label="${met ? "Done" : "Complete"} ${esc(h.name)}">
        <span class="dh-check">${I.check}</span>
        <span class="dh-emoji" aria-hidden="true">${esc(h.emoji)}</span>
        <span class="dh-txt"><b>${esc(h.name)}</b>${sub ? `<small>${sub}</small>` : ""}${bar}</span>
      </button>
      ${g ? `<span class="dh-group" style="--a:${cssVar(g.color, "#6a5ae0")}" title="${esc(g.name)}">${esc(g.emoji || "\u{1F94B}")}</span>` : ""}
    </li>`;
  }).join("");
  return card("span2", head + `<ul class="dash-habits">${rows}</ul>`);
}

/* ---------- 9 · Active Projects ----------
   Three at most, per spec. `lastWorked` is DERIVED from the focus log rather than stored: L1 already
   records every finished session against the project it served, and a second copy of that fact is
   just something that can disagree with the first. */
/* daysUntil() reads the future — "in 3d", "1d overdue". A date something last happened on needs the
   other tense, and "worked 1d overdue" is nonsense. */
function agoLabel(d) {
  const n = Math.round((Date.parse(todayIso() + "T12:00:00") - Date.parse(d + "T12:00:00")) / DAY_MS);
  if (n <= 0) return "today";
  if (n === 1) return "yesterday";
  if (n < 7) return `${n} days ago`;
  if (n < 14) return "last week";
  if (n < 60) return `${Math.round(n / 7)} weeks ago`;
  return `${Math.round(n / 30)} months ago`;
}
function projectLastWorked(id) {
  let best = "";
  Object.keys(state.focusLog || {}).forEach(d => {
    if ((state.focusLog[d] || []).some(r => r.projectId === id) && d > best) best = d;
  });
  return best;
}
function activeProjectsCard() {
  const live = liveProjects();
  const head = cardHead("Active projects", `<button class="btn ghost tiny" data-nav="projects">All projects</button>`);
  if (!live.length) return card("span2", head +
    emptyMsg("rocket", "Nothing in flight. A project is the thing a goal actually gets built by.",
      `<button class="btn primary" data-nav="projects">${I.plus}Start one</button>`));
  const rows = live.slice(0, 3).map(p => {
    const worked = projectLastWorked(p.id), pp = projectProgress(p), next = nextMilestoneOf(p);
    return `
    <li class="ap-item" data-action="project-open" data-id="${p.id}">
      <span class="ap-emoji" aria-hidden="true">${esc(p.emoji || "\u{1F680}")}</span>
      <span class="ap-body">
        <span class="ap-top"><b>${esc(p.name)}</b><b class="ap-pct">${pp.pct}%</b></span>
        ${barHtml(pp.pct, "#12a594")}
        <span class="ap-meta">
          <span class="ap-next">${next ? `${I.target}${esc(next)}` : `<i class="soft">no next step set</i>`}</span>
          <span class="ap-when">${worked ? `worked ${esc(agoLabel(worked))}` : "not worked yet"}</span>
        </span>
      </span>
      <span class="ap-go" aria-hidden="true">${I.chevR}</span>
    </li>`;
  }).join("");
  return card("span2", head + `<ul class="active-projects">${rows}</ul>` +
    (live.length > 3 ? `<p class="soft small">${live.length - 3} more in Projects.</p>` : ""));
}

function currentlyReadingCard() {
  const reading = state.reading.books.filter(b => b.status === "current").slice(0, 3);
  const body = reading.length
    ? `<ul class="now-reading">${reading.map(b => {
        const pct = Math.round(100 * (b.page || 0) / (b.pages || 1));
        return `<li class="nr-item" data-action="book-open" data-id="${b.id}">
          ${bookCover(b, "sm")}
          <span class="row-txt"><b>${esc(b.title)}</b><small>${esc(b.author || "")}${b.pages ? ` · p.${b.page || 0}/${b.pages}` : ""}</small>${barHtml(pct, "#0091ff")}</span>
          <span class="nr-pct">${pct}%</span>
        </li>`;
      }).join("")}</ul>`
    : `<p class="soft small">No book in progress — <button class="linkish" data-nav="reading">start one</button>.</p>`;
  return card("", cardHead("Currently reading", `<button class="btn ghost tiny" data-nav="reading">Shelf</button>`) + body);
}
function supplementsDueCard() {
  const due = state.nutrition.supplements.filter(s => supStatus(s).due);
  const body = due.length
    ? `<ul class="sup-list">${due.map(s => `<li class="sup-item due">
        <span class="sup-emoji" aria-hidden="true">${esc(s.emoji || "💊")}</span>
        <div class="row-txt"><b>${esc(s.name)}</b><small>${esc(s.dose || "")}${s.dose ? " · " : ""}${SUP_LABEL[s.every] || "daily"}</small></div>
        <button class="btn tiny good" data-action="sup-take" data-id="${s.id}">${I.check}Take</button>
      </li>`).join("")}</ul>`
    : `<p class="soft small">${I.check} All supplements taken — nice.</p>`;
  return card("", cardHead(`Supplements due${due.length ? ` · ${due.length}` : ""}`, `<button class="btn ghost tiny" data-nav="nutrition">Nutrition</button>`) + body);
}
/* ---------- the four above-the-fold cards ----------
   Order is fixed and deliberate: who you are today, what you are building, what you'll do about it,
   and the one thing you'd rather avoid. Nothing here reports history. */

/* Enough lines that one won't come round again for three months, and the user's own are mixed in —
   someone running a Bushido challenge wants Bushido lines, not mine. */
const MOTIVATION = [
  "Small, boring, repeated. That's the whole trick.",
  "You don't have to feel like it. You just have to start it.",
  "One honest hour beats a perfect plan.",
  "The goal isn't the streak. The streak is the evidence.",
  "Do the hard one while you still have the morning.",
  "Progress is quiet. Keep going anyway.",
  "Today only has to be slightly better than yesterday.",
  "Discipline is choosing what you want most over what you want now.",
  "The work you avoid is usually the work that counts.",
  "Start before you're ready. Ready arrives later, if at all.",
  "A bad session still beats a skipped one.",
  "You are what you repeat, not what you intend.",
  "Consistency is a skill. Practise it like one.",
  "Nobody is coming. That's the good news.",
  "Do it tired. Do it unmotivated. Do it anyway.",
  "The first ten minutes are the whole fight.",
  "Rest is part of the work, not a break from it.",
  "Comparison is a tax on your attention. Stop paying it.",
  "You can do hard things. You've done them before.",
  "Momentum is built, never found.",
  "Half-finished is still further than not started.",
  "Motivation follows action. It rarely leads.",
  "Show up on the days it doesn't matter.",
  "The plan is not the point. The reps are the point.",
  "Slow is smooth. Smooth is fast.",
  "Fall down seven times, stand up eight.",
  "The obstacle is the way.",
  "A river cuts through rock not by power but by persistence.",
  "Excellence is a habit, not an act.",
  "He who has a why can bear almost any how.",
  "Do not pray for an easy life; pray for the strength to endure a difficult one.",
  "The successful warrior is the average person with laser-like focus.",
  "Perfection is the enemy of finished.",
  "You don't rise to your goals. You fall to your systems.",
  "Make it so easy you can't say no.",
  "Never miss twice.",
  "What gets scheduled gets done.",
  "Direction matters more than speed.",
  "Small hinges swing big doors.",
  "The compound interest of daily effort is absurd. Trust it.",
  "Yesterday's discipline is today's freedom.",
  "Suffer the pain of discipline or the pain of regret.",
  "Ordinary things done consistently produce extraordinary results.",
  "Effort is the only thing you fully control. Spend it well.",
  "Don't count the days. Make the days count.",
  "One more rep. One more page. One more day.",
  "You will never regret finishing.",
  "Doubt is a feeling, not a verdict.",
  "The standard you walk past is the standard you accept.",
  "Amateurs wait for inspiration. The rest of us get up and work.",
  "Быть, а не казаться — be, don't seem.",
  "Fear is a compass. It points at the work.",
  "You cannot think your way into a new habit. You act your way in.",
  "Environment beats willpower. Change the room.",
  "Boredom is the price of mastery.",
  "A goal without a date is a wish with good branding.",
  "If it's important, do it every day. If not, don't do it at all.",
  "Two minutes now beats two hours someday.",
  "Nothing changes until something changes daily.",
  "The days you least want to are the days it counts double.",
  "Quiet effort outlasts loud intention.",
  "Be stubborn about the goal, flexible about the method.",
  "Track it or guess. Only one of those improves.",
  "Rest deliberately, so you don't collapse accidentally.",
  "The body achieves what the mind believes is normal.",
  "Habits are the compound interest of self-improvement.",
  "Focus is saying no to a hundred good things.",
  "A single candle is enough to end the argument with the dark.",
  "You're not behind. You're just early in a long game.",
  "Difficulty is where the value is stored.",
  "Discomfort is the fee for growth. Pay it early.",
  "First we form habits, then they form us.",
  "The pain of today is the strength of next month.",
  "Don't break the chain.",
  "The master has failed more times than the beginner has tried.",
  "Attention is the rarest form of generosity. Give it to your own life.",
  "You can always do a little more than you think.",
  "Water shapes stone. Be water, and be patient.",
  "Better a diamond with a flaw than a pebble without.",
  "Fall in love with the process and the results take care of themselves.",
  "Move the needle a millimetre. Then do it again.",
  "There is no finish line, and that is a relief.",
  "Simplify until it's obvious, then do it.",
  "Willpower is a battery, not a personality.",
  "Protect the streak, but don't worship it.",
  "The day is long enough for the things that matter.",
  "Grit is patience with a spine.",
  "You already know what to do. Go do that.",
  "Every expert was once an embarrassment.",
  "Some days you win. Some days you learn. No days you quit.",
  "A promise to yourself is still a promise.",
  "Silence the noise. Keep the signal. Begin.",
];
/* the built-in lines plus the user's own, so the rotation grows as they add to it */
const quotePool = () => MOTIVATION.concat((state.quotes || []).filter(q => String(q || "").trim()));
const motivationOfDay = () => { const p = quotePool(); return p[Math.floor(Date.now() / DAY_MS) % p.length]; };

function welcomeCard(remaining) {
  const ch = challengeDay();
  return card("welcome span2", `
    <p class="wel-hi">${greeting()}, ${esc(state.profile.name || "friend")}</p>
    <h2 class="wel-big">${remaining ? `${remaining} thing${remaining > 1 ? "s" : ""} left today` : "Today is clear \u{1F33F}"}</h2>
    <p class="wel-meta">
      <span>${esc(niceDate(todayIso(), { weekday: "long", month: "long", day: "numeric" }))}</span>
      ${ch ? `<span class="wel-ch">${esc(ch.name)} · day ${ch.n}${ch.of ? ` of ${ch.of}` : ""}</span>` : ""}
    </p>
    <p class="wel-line">${esc(motivationOfDay())}</p>`);
}

/* The largest block on the page, on purpose: if you only read one thing here, read what you are
   actually building. Four at most — a wall of goals is the same as none. */
function goalsCard() {
  const goals = activeGoals();
  const head = cardHead("What you're building", `<button class="btn ghost tiny" data-nav="goals">All goals</button>`);
  if (!goals.length) return card("goals-card span2", head +
    emptyMsg("target", "No open goal yet — without one this page is just a to-do list.",
      `<button class="btn primary" data-nav="goals">${I.plus}Set a goal</button>`));
  const rows = goals.slice(0, 4).map(g => {
    const gp = goalProgress(g), pr = prio(g.priority), st = goalStatus(g);
    const dl = g.deadline ? daysLeft(g.deadline) : null;
    /* Focus minutes are shown BESIDE the goal, never folded into its progress — a goal measured in
       kilograms cannot absorb a number of minutes without its chart becoming nonsense. */
    const fm = focusMinutesFor("goalId", g.id);
    return `<li class="gf-item" data-action="goal-open" data-id="${g.id}">
      <span class="gf-emoji" aria-hidden="true">${esc(g.emoji || "\u{1F3AF}")}</span>
      <span class="gf-body">
        <span class="gf-top"><b>${esc(g.title)}</b><span class="gf-prio" style="--a:${cssVar(pr.hue)}">${pr.label}</span></span>
        ${barHtml(gp.pct, pr.hue)}
        <span class="gf-meta">
          <b class="gf-pct">${gp.pct}%</b>
          <span>${g.type === "outcome" ? `${gp.cur}${g.unit ? " " + esc(g.unit) : ""} → ${g.target}${g.unit ? " " + esc(g.unit) : ""}` : `${gp.done}/${gp.tot} milestones`}</span>
          ${g.deadline ? `<span class="gf-dl">${esc(niceDate(g.deadline, { month: "short", day: "numeric" }))}${dl != null ? ` · ${dl < 0 ? `${-dl}d over` : `${dl}d left`}` : ""}</span>` : ""}
          ${fm ? `<span class="gf-focus">${I.clock}${estLabel(fm)} today</span>` : ""}
          <span class="gf-status ${st.cls}">${esc(st.txt)}</span>
        </span>
      </span>
      <span class="gf-go" aria-hidden="true">${I.chevR}</span>
    </li>`;
  }).join("");
  return card("goals-card span2", head + `<ul class="goal-focus">${rows}</ul>` +
    (goals.length > 4 ? `<p class="soft small">${goals.length - 4} more open in Goals.</p>` : ""));
}

/* Three, as specified — but the tasks beyond three are disclosed rather than hidden. A dashboard
   that quietly drops task four is the same silent-loss bug this app already fixed once. */
function focusCard(uniDue, undone, done, stranded) {
  const t = todayIso();
  const { picked, filled } = focusTasks();
  const shown = [...picked, ...filled];
  const more = undone.filter(td => !td.hard && !shown.some(x => x.id === td.id));
  const rows = shown.map((td, i) => taskRow(td, i, shown.length, { pin: true, auto: !td.focus }));
  const uni = uniDue.map(k => `
    <li class="todo ${k.due < t ? "overdue" : ""}">
      <span class="todo-time"></span>
      <button class="checkbox" data-action="ag-uni" data-id="${k.id}" aria-label="Mark ${esc(k.title)} done">${I.check}</button>
      <span class="row-txt" data-nav="learning"><b>${esc(k.title)}</b><small><span class="task-area" style="--a:#3e63dd">${esc(k.tag || taskKind(k).label)}</span> · due ${daysUntil(k.due)}</small></span>
    </li>`);
  const body = (uni.length + rows.length)
    ? `${uni.length ? `<ul class="todo-list">${uni.join("")}</ul>` : ""}${rows.length ? `<ul class="todo-list" data-drag-list="todos">${rows.join("")}</ul>` : ""}`
    : `<p class="soft small" style="padding:6px 2px">Nothing chosen yet — add the first thing below \u{1F33F}</p>`;
  return card("focus-card span2", cardHead(`Today's focus <small class="soft">${picked.length ? `${picked.length} of ${FOCUS_MAX} chosen` : shown.length ? "picked for you" : "nothing yet"}</small>`) + body +
    (filled.length ? `<p class="soft small">${I.spark} ${filled.length === shown.length ? "These were" : `${filled.length} of these were`} picked for you by priority — tap ${I.target} on any task to choose your own.</p>` : "") +
    taskAddForm() +
    `<p class="soft note">${I.spark} Name a task after a habit, supplement or area ("Take Vitamin D3", "Pay yoga tuition") and it auto-links. Priority, duration, the goal it serves and <b>repeat</b> all live in the task's detail sheet.</p>` +
    (more.length ? `<details class="done-wrap"${ui.showMore ? " open" : ""}><summary data-action="focus-more">${more.length} more task${more.length > 1 ? "s" : ""} today</summary><ul class="todo-list">${more.map(td => taskRow(td, null, null, { pin: true })).join("")}</ul></details>` : "") +
    (stranded.length ? `<button class="btn ghost slim" data-action="carry-open" style="margin-top:10px">${I.chevL}${stranded.length} unfinished from before</button>` : "") +
    (done.length ? `<details class="done-wrap"><summary>${I.check} Done today (${done.length})</summary><ul class="todo-list done-list">${done.map(td => taskRow(td)).join("")}</ul></details>` : ""));
}

/* One task, marked by hand as the one you're avoiding. Kept separate from the focus three so it
   cannot be buried under three easy wins. */
function hardTaskCard() {
  const td = hardTask();
  const head = cardHead("Today's hard thing");
  if (!td) return card("hard-card span2", head + `<p class="soft small">Nothing marked yet. Open a task and mark it <b>the hard one</b> — the thing you'd rather push to tomorrow.</p>`);
  const serves = taskServes(td);
  const mins = focusMinutesFor("taskId", td.id);
  /* If a session is already running on THIS task, the button must say so — otherwise tapping it
     just earns the "one at a time" refusal, which reads as a broken button. */
  const onIt = !!(state.focus && state.focus.taskId === td.id);
  return card("hard-card span2" + (td.done ? " is-done" : ""), head + `
    <div class="hard-body">
      <button class="checkbox" data-action="todo-toggle" data-id="${td.id}" aria-label="Toggle ${esc(td.text)}">${I.check}</button>
      <div class="hard-txt">
        <b>${esc(td.text)}</b>
        <small>${[td.time ? esc(td.time) : "", estLabel(td.estMin), serves ? `${serves.emoji} ${esc(serves.name)}` : "",
                  mins ? `${estLabel(mins)} focused today` : ""].filter(Boolean).join(" · ") || "no time set"}</small>
      </div>
    </div>
    ${td.done
      ? `<button class="btn good" data-action="todo-open" data-id="${td.id}">${I.check}Done — open it</button>`
      : onIt
        ? `<button class="btn good" data-action="focus-finish">${I.clock}Focusing now — ${focusDone() ? "log it" : mmss(focusLeft()) + " left"}</button>
           <button class="btn ghost slim" data-action="todo-open" data-id="${td.id}">Open task</button>`
        : `<button class="btn primary" data-action="focus-open" data-id="${td.id}">${I.clock}Start focus session</button>
           <button class="btn ghost slim" data-action="todo-open" data-id="${td.id}">Open task</button>`}`);
}

function vDashboard() {
  const t = todayIso();
  const todos = tasksOn(t);
  const undone = todos.filter(td => !td.done);
  const done = todos.filter(td => td.done);
  const stranded = strandedTasks();
  const dueHabits = state.habits.filter(h => isScheduled(h, t) && !isSkipped(h, t));
  /* everything with a date, not just University — this card is the one place you look for "what's coming" */
  const deadlines = [
    ...learnTasks().filter(k => !k.done && k.due && k.due <= addDays(t, 5))
      .map(k => ({ title: k.title, due: k.due, nav: "learning", area: "learning" })),
    ...[]
      .map(k => ({ title: k.title, due: k.due, nav: "learning", area: "learning" })),
    ...state.goals.filter(g => g.deadline && g.deadline <= addDays(t, 5) && !goalReached(g))
      .map(g => ({ title: g.title, due: g.deadline, nav: "habits", area: "habits" })),
    /* a birthday is a deadline you actually care about missing */
    ...peopleAll().map(p => ({ p, d: nextBirthday(p) })).filter(x => x.d && x.d <= addDays(t, 5))
      .map(({ p, d }) => ({ title: `${p.name}'s birthday`, due: d, nav: "social", area: "social" })),
  ].sort((a, b) => a.due < b.due ? -1 : 1);
  /* coursework due today or overdue is a thing you must do today — it belongs in Today's Focus */
  const uniDue = learnTasks().filter(k => !k.done && k.due && k.due <= t)
    .sort((a, b) => a.due < b.due ? -1 : 1);
  const remaining = undone.length + uniDue.length + dueHabits.filter(h => !habitMet(h, t)).length;
  return `
  <div class="grid dash">
    ${welcomeCard(remaining)}
    ${goalsCard()}
    ${focusCard(uniDue, undone, done, stranded)}
    ${hardTaskCard()}

    ${timelineCard(t)}
    ${habitsTodayCard(t)}
    ${currentlyReadingCard()}
    ${supplementsDueCard()}
    ${activeProjectsCard()}

    ${deadlines.length ? card("", cardHead("What's next") + `
      <ul class="mini-agenda">${deadlines.map(k => { const a = areaOf(k.area); return `<li data-nav="${k.nav}"><span class="a-ic" style="--a:${cssVar(a.hue)}">${I[a.icon]}</span><span class="row-txt"><b>${esc(k.title)}</b><small>${esc(a.name.toLowerCase())}</small></span><span class="a-when ${k.due < t ? "over" : ""}">${daysUntil(k.due)}</span></li>`; }).join("")}</ul>`) : ""}

    ${card("", cardHead("Reflection") + `
      <p class="reflect-prompt">${esc(reflectionOfDay())}</p>
      <textarea class="reflect-input" data-change="reflection" placeholder="A sentence or two…" maxlength="1000">${esc(state.reflections[t] || "")}</textarea>`)}

  </div>`;
}

/* ================= Goals — "Where am I going?" =================
   The Bible lists Goals second, right after the Dashboard. Until now it was a card at the bottom of
   the Habit Tracker, which said the opposite: that your direction is a footnote to your routines.

   The Universal Rules ask every page for Purpose, Progress, Timeline, Relationships, History,
   Analytics and Reflection. All seven on one screen would fight the same document's "avoid clutter,
   whitespace is valuable, users should never wonder where to look first" — so the page carries
   Purpose, Progress and Timeline, and the per-goal sheet carries Relationships, History and the
   rest. Each shows the ones that earn their place there. */

function goalCardBig(g) {
  const gp = goalProgress(g), pr = prio(g.priority), st = goalStatus(g), pace = goalPace(g);
  const dl = g.deadline ? daysLeft(g.deadline) : null;
  const mins = goalFocusMins(g.id);
  const habits = liveHabits().filter(h => (h.goalIds || []).includes(g.id));
  const serves = state.todos.filter(td => td.linkGoalId === g.id && !td.done).length;
  return `<li class="gb" data-action="goal-open" data-id="${g.id}" style="--a:${cssVar(pr.hue)}">
    <div class="gb-head">
      <span class="gb-emoji" aria-hidden="true">${esc(g.emoji || "\u{1F3AF}")}</span>
      <span class="gb-title">
        <b>${esc(g.title)}</b>
        ${g.note ? `<small>${esc(g.note)}</small>` : ""}
      </span>
      <span class="gb-prio">${pr.label}</span>
    </div>
    ${barHtml(gp.pct, pr.hue)}
    <div class="gb-nums">
      <b>${gp.pct}%</b>
      <span>${g.type === "outcome"
        ? `${gp.cur}${g.unit ? " " + esc(g.unit) : ""} \u2192 ${g.target}${g.unit ? " " + esc(g.unit) : ""}`
        : `${gp.done} of ${gp.tot} milestones`}</span>
      <span class="gb-status ${st.cls}">${esc(st.txt)}</span>
    </div>
    ${pace ? `<div class="gb-pace ${pace.cls}">
      <span class="gb-pace-bar"><i style="width:${pace.elapsed}%"></i></span>
      <span>${pace.elapsed}% of the time \u00b7 ${pace.made}% of the goal \u2014 ${esc(pace.txt)}</span>
    </div>` : ""}
    <div class="gb-foot">
      ${g.deadline ? `<span>${I.clock}${esc(niceDate(g.deadline, { month: "short", day: "numeric" }))}${dl != null ? ` \u00b7 ${dl < 0 ? `${-dl}d over` : `${dl}d left`}` : ""}</span>` : `<span class="soft">no deadline</span>`}
      ${habits.length ? `<span>${I.target}${habits.length} habit${habits.length > 1 ? "s" : ""}</span>` : ""}
      ${serves ? `<span>${I.check}${serves} open task${serves > 1 ? "s" : ""}</span>` : ""}
      ${mins ? `<span>${I.clock}${estLabel(mins)} focused</span>` : ""}
      ${(g.tags || []).length ? `<span class="gb-tags">${g.tags.slice(0, 3).map(t => `<i>${esc(t)}</i>`).join("")}</span>` : ""}
    </div>
  </li>`;
}

function vGoals() {
  const open = activeGoals(), paused = goalsByStatus("paused"), done = goalsByStatus("done");
  const withDeadline = open.filter(g => g.deadline);
  const soon = withDeadline.filter(g => daysLeft(g.deadline) >= 0 && daysLeft(g.deadline) <= 30).length;
  const over = withDeadline.filter(g => daysLeft(g.deadline) < 0).length;
  const totalMins = open.reduce((n, g) => n + goalFocusMins(g.id), 0);
  return `
  <div class="grid">
    ${card("span2 goals-hero", `
      <p class="gh-q">Where am I going?</p>
      <div class="gh-row">
        <div class="gh-stat"><b>${open.length}</b><small>open</small></div>
        <div class="gh-stat"><b>${done.length}</b><small>reached</small></div>
        ${soon ? `<div class="gh-stat warn"><b>${soon}</b><small>due within a month</small></div>` : ""}
        ${over ? `<div class="gh-stat err"><b>${over}</b><small>past deadline</small></div>` : ""}
        ${totalMins ? `<div class="gh-stat"><b>${estLabel(totalMins)}</b><small>focused so far</small></div>` : ""}
      </div>`)}

    ${card("span2", cardHead(`Open goals${open.length ? ` <small class="soft">${open.length}</small>` : ""}`,
      addBtn("New goal", "goal-add")) + (open.length
      ? `<ul class="goal-big">${open.map(goalCardBig).join("")}</ul>`
      : emptyMsg("target", "Nothing open. A goal is the thing your habits and projects are for \u2014 without one they are just activity.",
          addBtn("Set your first goal", "goal-add"))))}

    ${paused.length ? card("span2", `<details class="done-wrap"><summary>${I.moon} Paused (${paused.length})</summary>
      <ul class="goal-big dim">${paused.map(goalCardBig).join("")}</ul>
      <p class="soft note">${I.check} A paused goal keeps every number it ever had. It simply stops asking for your attention on the dashboard.</p>
    </details>`) : ""}

    ${done.length ? card("span2", `<details class="done-wrap"><summary>${I.check} Reached (${done.length})</summary>
      <ul class="goal-list">${done.map(g => {
        const gp = goalProgress(g);
        return `<li data-action="goal-open" data-id="${g.id}">
          <span class="row-emoji">${esc(g.emoji || "\u{1F3AF}")}</span>
          <span class="row-txt"><b>${esc(g.title)}</b><small>${g.deadline ? `target was ${esc(niceDate(g.deadline, { month: "short", day: "numeric", year: "numeric" }))}` : "no deadline"}${goalFocusMins(g.id) ? ` \u00b7 ${estLabel(goalFocusMins(g.id))} focused` : ""}</small></span>
          <b class="pct">${gp.pct}%</b>
        </li>`;
      }).join("")}</ul>
    </details>`) : ""}

    ${card("span2", cardHead("How goals work here") + `
      <p class="soft small">A goal is measured either by a <b>number to reach</b> or by a <b>checklist of milestones</b>. Habits are the daily actions that build it, tasks are the one-off pieces, and a <b>focus session</b> started on a linked task logs its minutes here automatically.</p>
      <p class="soft note">${I.spark} Give a goal a <b>start date</b> and a <b>deadline</b> and this page can compare the two things it actually knows: how much of the time has gone, and how much of the goal is done. It will not tell you you're "on track" \u2014 it has no idea what your plan was.</p>`)}
  </div>`;
}

/* ---------- habits ---------- */
function goalCurrent(g) {
  if (!g.progress || !g.progress.length) return g.start;
  return g.progress[g.progress.length - 1].value;
}
/* an outcome goal is reached when its latest logged value passes the target in its direction;
   a checklist goal is reached when every milestone is ticked */
function goalReached(g) {
  if (g.type === "outcome") {
    const cur = goalCurrent(g);
    return g.direction === "down" ? cur <= g.target : cur >= g.target;
  }
  return !!(g.milestones || []).length && g.milestones.every(m => m.done);
}
function goalProgress(g) {
  const tot = g.milestones.length, done = g.milestones.filter(m => m.done).length;
  if (g.type === "outcome") {
    const cur = goalCurrent(g), span = (g.start - g.target) || 1;
    let pct = Math.round(100 * (g.start - cur) / span);
    pct = clamp(pct, 0, 100);
    return { done, tot, pct, cur };
  }
  return { done, tot, pct: tot ? Math.round(100 * done / tot) : 0, cur: null };
}
/* auto-complete numeric milestones when the logged value crosses their target */
function syncGoalMilestones(g) {
  if (g.type !== "outcome") return;
  const cur = goalCurrent(g);
  g.milestones.forEach(m => {
    if (m.target == null || m.target === "") return;
    const reached = g.direction === "down" ? cur <= m.target : cur >= m.target;
    if (reached && !m.done) { m.done = true; addXp(15, "Milestone"); }
  });
}
function habitRow(h, d, i, total) {
  const e = habitEntry(h, d) || {}, met = habitMet(h, d), streak = habitStreak(h);
  let control, sub;
  const src = habitSource(h);
  if (h.kind === "workout") {
    control = `<button class="checkbox" data-action="habit-workout-jump" data-id="${h.id}" aria-label="${met ? "Workout logged — open Workout" : "Log a workout"}">${I.check}</button>`;
    sub = met ? `Workout logged · ${streak} day streak` : `Log it in Workout · ${streak}🔥`;
  } else if (src) {
    /* fed by another area — the number is derived, so tapping goes there instead of editing here */
    const amt = habitAmount(h, d);
    control = `<button class="checkbox ${met ? "" : ""}" data-action="habit-source-jump" data-id="${h.id}" aria-label="Open ${esc(areaOf(src.area).name)}">${I.check}</button>`;
    /* "10 pages of 10 pages · from Reading" said pages twice and cost three lines on a phone */
    sub = h.type === "quantity"
      ? `${amt} / ${h.target}${h.unit ? " " + h.unit : ""} · ${areaOf(src.area).name} · ${streak}🔥`
      : `${met ? "Done" : "Not yet"} · ${areaOf(src.area).name} · ${streak}🔥`;
  } else if (h.type === "avoid") {
    control = `<button class="checkbox avoid ${e.slip ? "slip" : "kept"}" data-action="habit-toggle" data-id="${h.id}" aria-label="${e.slip ? "Slipped" : "Kept"}">${e.slip ? I.x : I.check}</button>`;
    sub = `${streak} days clean${e.slip ? " · slipped" : ""}`;
  } else if (h.type === "quantity") {
    control = `<button class="checkbox" data-action="habit-toggle" data-id="${h.id}" aria-label="Mark complete">${I.check}</button>`;
    sub = `${e.amount || 0} / ${h.target}${h.unit ? " " + h.unit : ""} · ${streak}🔥`;
  } else {
    control = `<button class="checkbox" data-action="habit-toggle" data-id="${h.id}" aria-label="Toggle ${esc(h.name)}">${I.check}</button>`;
    sub = `${streak} day streak`;
  }
  const col = h.color || "#6a5ae0";
  /* habitAmount(), not e.amount — a habit fed by another area keeps its number in that area, so
     e.amount is permanently 0 for it and the bar rendered at 0% while the text beside it read
     "10 of 10". The text was right; the bar was reading the wrong field. */
  const quantBar = h.type === "quantity" ? barHtml(100 * habitAmount(h, d) / (h.target || 1), col) : "";
  const incBtn = h.type === "quantity" ? `<button class="btn tiny ghost inc" data-action="habit-inc" data-id="${h.id}" aria-label="Add ${habitStep(h)}${h.unit ? " " + esc(h.unit) : ""}">+${habitStep(h)}</button>` : "";
  const canMove = typeof i === "number" && total > 1;
  /* The whole text block is the primary action now, not just the small checkbox — ticking a habit
     was three or four taps' worth of aiming on a phone. `avoid` habits keep their explicit button:
     tapping a row is not how anyone should confess a slip. */
  const rowAct = h.kind === "workout" ? "habit-workout-jump"
    : src ? "habit-source-jump"
    : h.type === "avoid" ? "habit-open"
    : "habit-toggle";
  return `<li class="habit-li ${met ? "done" : ""}" style="--hc:${cssVar(col, "#6a5ae0")}" data-row-id="${h.id}">
    ${control}
    <span class="row-txt hit" data-action="${rowAct}" data-id="${h.id}" role="button" tabindex="0">
      <span class="row-emoji" aria-hidden="true">${esc(h.emoji)}</span>
      <span class="hit-txt">
        <b>${esc(h.name)}${h.kind === "workout" ? ` <span class="mini-badge">${I.dumbbell}</span>` : ""}</b>
        <small>${sub}${e.note ? " · noted" : ""}</small>${quantBar}
      </span>
    </span>
    ${incBtn}
    ${canMove ? `<span class="grip" data-drag="${h.id}" aria-hidden="true" title="Drag to reorder">${I.grip}</span>` : ""}
    <button class="icon-btn ghost" data-action="habit-open" data-id="${h.id}" aria-label="Details for ${esc(h.name)}">${I.chevR}</button>
  </li>`;
}
function habitHistoryRow(h) {
  const cells = []; let d = todayIso();
  for (let i = 0; i < 28; i++) {
    const cls = !isScheduled(h, d) ? "off" : (isSkipped(h, d) ? "skip" : (habitMet(h, d) ? "met" : "miss"));
    cells.unshift(`<i class="hc ${cls}" title="${niceDate(d)}"></i>`);
    d = addDays(d, -1);
  }
  return `<div class="hist-row">${cells.join("")}</div>`;
}
/* The due list, split by group. Someone with no groups sees exactly what they saw before — a plain
   list — so the feature costs nothing until it's used. */
function dueByGroup(due, d) {
  const empty = `<p class="soft small" style="padding:8px 4px">Nothing scheduled for this day — enjoy the rest \u{1F324}\uFE0F</p>`;
  if (!due.length) return empty;
  const groups = groupsAll().filter(g => due.some(h => (h.groupId || "") === g.id));
  if (!groups.length) return `<ul class="check-list habit-list" data-drag-list="habits">${due.map((h, i) => habitRow(h, d, i, due.length)).join("")}</ul>`;
  const loose = due.filter(h => !groupById(h.groupId));
  const block = (g, list) => {
    const gp = { due: list.length, done: list.filter(h => habitMet(h, d)).length };
    const day = g ? groupDay(g, d) : null;
    return `<div class="hgroup" style="--a:${cssVar(g ? g.color : "", "#8b8b99")}">
      <div class="hgroup-head" ${g ? `data-action="group-open" data-id="${g.id}"` : ""}>
        <span class="hgroup-emoji" aria-hidden="true">${esc(g ? (g.emoji || "\u{1F94B}") : "\u{1F33F}")}</span>
        <span class="hgroup-txt">
          <b>${esc(g ? g.name : "Everything else")}</b>
          <small>${gp.done}/${gp.due} done${day ? ` \u00b7 day ${day.n} of ${day.of}` : ""}</small>
        </span>
        ${day ? `<span class="hgroup-day">${day.pct}%</span>` : ""}
      </div>
      <ul class="check-list habit-list" data-drag-list="habits">${list.map((h, i) => habitRow(h, d, i, list.length)).join("")}</ul>
    </div>`;
  };
  return groups.map(g => block(g, due.filter(h => h.groupId === g.id))).join("")
    + (loose.length ? block(null, loose) : "");
}

/* Groups live here rather than in a settings screen: you make one while looking at the habits you
   want in it. A challenge is just a group with a start date and a length. */
function groupsCard(d) {
  const gs = groupsAll();
  const head = cardHead("Groups & challenges", addBtn("New group", "group-add", "ghost tiny"));
  if (!gs.length) return card("", head + `<p class="soft small">Group habits that belong together \u2014 a morning routine, a training block. Give a group a <b>start date and a length</b> and it becomes a <b>challenge</b>: the dashboard then counts your day, like <i>day 10 of 75</i>.</p>`);
  const active = activeChallenge(d);
  return card("", head + `<ul class="group-list">${gs.map(g => {
    const day = groupDay(g, d), gp = groupProgress(g, d), n = habitsInGroup(g.id).length;
    return `<li data-action="group-open" data-id="${g.id}" style="--a:${cssVar(g.color, "#6a5ae0")}">
      <span class="row-emoji">${esc(g.emoji || "\u{1F94B}")}</span>
      <span class="row-txt"><b>${esc(g.name)}</b>
        <small>${n} habit${n === 1 ? "" : "s"}${gp.due ? ` \u00b7 ${gp.done}/${gp.due} today` : ""}${day ? ` \u00b7 day ${day.n} of ${day.of}` : isChallenge(g) ? " \u00b7 challenge over" : ""}</small>
        ${day ? barHtml(day.pct, g.color) : ""}</span>
      <span class="chev">${I.chevR}</span>
    </li>`;
  }).join("")}</ul>` +
    (active ? `<p class="soft note">${I.spark} The dashboard is counting <b>${esc(active.name)}</b>. If two challenges overlap it shows the one that <b>started most recently</b>.</p>` : ""));
}

function vHabits() {
  const d = dayCursor("habits"), week = weekDates();
  const isToday = d === todayIso();
  const live = liveHabits(), archived = archivedHabits();
  const due = live.filter(h => isScheduled(h, d) && !isSkipped(h, d));
  const rest = live.filter(h => !(isScheduled(h, d) && !isSkipped(h, d)));
  const pct = due.length ? Math.round(100 * due.filter(h => habitMet(h, d)).length / due.length) : 0;
  return `
  <div class="grid">
    ${card("span2", dayNav("habits") + `
      <div class="week-strip">
        ${week.map((wd, i) => `
          <button class="wday ${wd === d ? "today" : ""} ${wd > todayIso() ? "future" : ""}" data-action="habit-day" data-d="${wd}">
            <small>${WD_SHORT[i]}</small><b>${+wd.slice(-2)}</b>
            <span class="wdot ${isPerfectDay(wd) ? "full" : liveHabits().some(h => habitMet(h, wd)) ? "part" : ""}"></span>
          </button>`).join("")}
      </div>
      <div class="progress-line"><span>${isToday ? "Today's" : "That day's"} progress</span>${barHtml(pct)}<b>${pct}%</b></div>`)}

    ${card("span2", cardHead(isToday ? "Today's habits" : niceDate(d, { weekday: "long", month: "short", day: "numeric" }), `<button class="btn ghost tiny" data-action="habit-library">${I.grid}Library</button>${addBtn("New habit", "habit-add")}`) + (live.length ? `
      ${dueByGroup(due, d)}
      ${rest.length ? `<p class="rest-label">Not scheduled / resting</p><ul class="check-list habit-list dim">${rest.map(h => habitRow(h, d)).join("")}</ul>` : ""}
      ${archived.length ? `<details class="done-wrap arch-wrap"><summary>${I.moon} Archived (${archived.length})</summary>
        <ul class="check-list habit-list dim">
          ${archived.map(h => `<li class="habit-li archived">
            <span class="row-emoji">${esc(h.emoji)}</span>
            <span class="row-txt"><b>${esc(h.name)}</b><small>retired ${esc(niceDate(h.archivedOn || todayIso(), { month: "short", day: "numeric", year: "numeric" }))} · ${Object.keys(h.log || {}).length} days recorded</small></span>
            <button class="btn tiny ghost" data-action="habit-restore" data-id="${h.id}">${I.check}Restore</button>
          </li>`).join("")}
        </ul>
        <p class="soft note">${I.check} Archived habits keep every day they were logged — your past streaks and heatmap are untouched. They just stop counting from the day you retired them.</p>
      </details>` : ""}`
      : emptyMsg("target", "No habits yet — build your first ritual.", addBtn("Add a habit", "habit-add"))))}

    ${groupsCard(d)}

    ${card("streak-card", `
      <div class="streak-hero">${I.flame}<div><b>${perfectStreak()} days</b><small>current perfect streak</small></div></div>
      <p class="soft">A perfect day = every habit that was <em>due</em> is done. Rest days and skips don't break your chain.</p>`)}

    ${card("reflect-card", `
      <div class="reflect-head">${I.spark}<span>Daily reflection</span></div>
      <p class="reflect-prompt">${esc(reflectionOfDay())}</p>
      <textarea class="reflect-input" data-change="reflection" placeholder="A sentence or two…" maxlength="1000">${esc(state.reflections[todayIso()] || "")}</textarea>`)}

    ${/* Goals has its own page now. This stays as the bridge — habits are the daily actions, Goals
          is where they add up — rather than being the only place goals live. */
      card("", cardHead("Goals", `<button class="btn ghost tiny" data-nav="goals">Open goals</button>`) + (activeGoals().length ? `
      <ul class="goal-list">
        ${activeGoals().slice(0, 4).map(g => {
          const gp = goalProgress(g);
          const sub = g.type === "outcome" ? `${goalCurrent(g)} → ${g.target} ${esc(g.unit || "")}` : `${gp.done}/${gp.tot} milestones`;
          return `<li data-action="goal-open" data-id="${g.id}">
            <span class="row-emoji">${esc(g.emoji || "🎯")}</span>
            <span class="row-txt open"><b>${esc(g.title)}</b><small>${sub}</small>${barHtml(gp.pct, "#6a5ae0")}</span>
            <b class="pct">${gp.pct}%</b>
          </li>`;
        }).join("")}
      </ul>${activeGoals().length > 4 ? `<p class="soft small">${activeGoals().length - 4} more in Goals.</p>` : ""}`
      : emptyMsg("target", "Set a goal your habits build toward.", `<button class="btn primary" data-nav="goals">${I.plus}Open Goals</button>`)))}
  </div>`;
}

function weekdayPicker(selected) {
  return `<div class="wd-pick">${WD_SHORT.map((w, i) => `<label><input type="checkbox" name="wd${i}" ${selected.includes(i) ? "checked" : ""}><span>${w}</span></label>`).join("")}</div>`;
}
function habitFormFields(h) {
  h = h || {}; const c = h.cadence || { mode: "daily" };
  return fld("Name", txt("name", "e.g. Drink water", h.name || "")) +
    `<div class="fld-row">${fld("Emoji", txt("emoji", "💧", h.emoji || "💧", false))}<label class="fld"><span>Color</span><input type="color" name="color" value="${cssVar(h.color, "#6a5ae0")}"></label></div>` +
    fld("Type", `<select name="type">
      <option value="build" ${(!h.type || h.type === "build") ? "selected" : ""}>Build — just do it (checkbox)</option>
      <option value="quantity" ${h.type === "quantity" ? "selected" : ""}>Amount — reach a target (e.g. 2L, 20 pages)</option>
      <option value="avoid" ${h.type === "avoid" ? "selected" : ""}>Avoid — break a bad habit (days clean)</option>
    </select>`) +
    `<div class="fld-row">${fld("Target", num("target", h.target || 0, 0))}${fld("Unit", txt("unit", "L / pages", h.unit || "", false))}</div>` +
    fld("Why — your reason", txt("why", "keeps me focused…", h.why || "", false)) +
    fld("Group <small class=\"soft\">— a routine, or a challenge</small>",
      `<select name="groupId"><option value="">No group</option>${groupsAll().map(g =>
        `<option value="${g.id}" ${h.groupId === g.id ? "selected" : ""}>${esc(g.emoji || "\u{1F94B}")} ${esc(g.name)}${isChallenge(g) ? " (challenge)" : ""}</option>`).join("")}</select>`) +
    fld("How often", `<select name="cmode">
      <option value="daily" ${c.mode === "daily" ? "selected" : ""}>Every day</option>
      <option value="days" ${c.mode === "days" ? "selected" : ""}>Specific weekdays</option>
      <option value="perWeek" ${c.mode === "perWeek" ? "selected" : ""}>A number of times per week</option>
    </select>`) +
    `<div class="fld-row"><label class="fld"><span>On these days</span>${weekdayPicker(c.days || [0, 1, 2, 3, 4])}</label>${fld("× per week", num("perWeek", c.perWeek || 3, 1))}</div>` +
    fld("Filled in by <small class=\"soft\">— let an area log it for you</small>",
      `<select name="kind"><option value="">Nothing — I tick it myself</option>${HABIT_SOURCES.map(x =>
        `<option value="${x.id}" ${h.kind === x.id ? "selected" : ""}>${esc(x.label)}</option>`).join("")}</select>`) +
    fld("Remind me at <small class=\"soft\">— leave empty to use the general nudge time</small>",
      `<input type="time" name="remindAt" value="${esc(h.remindAt || "")}">`);
}
function groupFormFields(g) {
  g = g || {};
  return fld("Name", txt("name", "e.g. Bushido challenge", g.name || "")) +
    `<div class="fld-row">${fld("Emoji", txt("emoji", "\u{1F94B}", g.emoji || "\u{1F94B}", false))}<label class="fld"><span>Color</span><input type="color" name="color" value="${cssVar(g.color, "#6a5ae0")}"></label></div>` +
    `<div class="fld-row">${fld("Starts <small class=\"soft\">— optional</small>", `<input type="date" name="start" value="${esc(g.start || "")}">`)}${fld("For how many days", num("days", g.days || 0, 0))}</div>` +
    `<p class="soft note">${I.spark} Leave those two blank and this is simply a <b>category</b>. Fill them in and it becomes a <b>challenge</b> \u2014 the dashboard counts your day, like <i>day 10 of 75</i>.</p>`;
}
function openGroupDetail(id) {
  const g = groupById(id); if (!g) { closeModal(); return; }
  const day = groupDay(g), gp = groupProgress(g), inside = habitsInGroup(g.id);
  openModal(`<header class="modal-head"><h3>${esc(g.emoji || "\u{1F94B}")} ${esc(g.name)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      ${day ? `<div class="progress-line"><span>Day ${day.n} of ${day.of}</span>${barHtml(day.pct, g.color)}<b>${day.pct}%</b></div>`
        : isChallenge(g) ? `<p class="soft small">This challenge ${g.start > todayIso() ? `starts ${esc(niceDate(g.start, { month: "long", day: "numeric" }))}` : "has finished"}.</p>`
        : `<p class="soft small">A category \u2014 no dates on it, so no day counter.</p>`}
      <div class="progress-line"><span>Today</span>${barHtml(gp.pct, g.color)}<b>${gp.done}/${gp.due}</b></div>
      <p class="soft small" style="margin-top:10px">${inside.length} habit${inside.length === 1 ? "" : "s"} in this group${inside.length ? ": " + inside.map(h => esc(h.emoji) + " " + esc(h.name)).join(", ") : " \u2014 set a habit's <b>Group</b> from its own sheet."}</p>
      <div class="pill-row"><button class="btn primary slim" data-action="group-edit" data-id="${g.id}">Edit</button><button class="btn danger" data-action="group-del" data-id="${g.id}">${I.trash}Delete</button></div>
      <p class="soft note">${I.check} Deleting a group never deletes its habits \u2014 they simply stop being grouped, and keep every day they were logged.</p>
      ${relatedCard("group", g.id)}
    </div>`);
}
function parseCadence(f) {
  const mode = f.cmode || "daily";
  if (mode === "days") { const days = [...Array(7)].map((_, i) => f["wd" + i] ? i : -1).filter(x => x >= 0); return { mode: "days", days: days.length ? days : [0, 1, 2, 3, 4, 5, 6] }; }
  if (mode === "perWeek") return { mode: "perWeek", perWeek: Math.max(1, +f.perWeek || 3) };
  return { mode: "daily" };
}
function habitDayControl(h, d, e) {
  if (h.type === "avoid") {
    return `<div class="detail-control avoid-control">
      <div class="big-num">${habitStreak(h)}<span>days clean</span></div>
      <button class="btn ${e.slip ? "danger" : "ghost"} slim" data-action="habit-toggle-d" data-id="${h.id}">${e.slip ? "I stayed clean — clear slip" : "I slipped today"}</button>
    </div>`;
  }
  if (h.type === "quantity") {
    const src = habitSource(h), amt = habitAmount(h, d), met = habitMet(h, d);
    const bar = `<div class="progress-line"><span>${amt} / ${h.target}${h.unit ? " " + h.unit : ""}</span>${barHtml(100 * amt / (h.target || 1), cssVar(h.color, "#6a5ae0"))}<b>${met ? "✓" : Math.round(100 * amt / (h.target || 1)) + "%"}</b></div>`;
    /* fed habits have no manual controls — the number comes from the area, so editing it here
       would be a value the app ignores. Send them to the source instead. */
    if (src) return `<div class="detail-control">${bar}
      <div class="pill-row"><button class="btn ghost slim" data-action="habit-source-jump" data-id="${h.id}">${I[areaOf(src.area).icon]}Log it in ${esc(areaOf(src.area).name)}</button></div>
    </div>`;
    return `<div class="detail-control">${bar}
      <div class="pill-row"><button class="btn tiny ghost" data-action="habit-dec" data-id="${h.id}">−${habitStep(h)}</button>
        <input class="num-input" type="number" step="any" min="0" value="${amt}" data-change="habit-amount" data-id="${h.id}" aria-label="Amount">
        <button class="btn tiny ghost" data-action="habit-inc" data-id="${h.id}">+${habitStep(h)}</button>
        <button class="btn tiny good" data-action="habit-toggle-d" data-id="${h.id}">${met ? "Reset" : "Mark full"}</button></div>
    </div>`;
  }
  const met = habitMet(h, d);
  if (h.kind === "workout") {
    return `<button class="btn ${met ? "good" : "primary"} slim" data-action="habit-log-workout" data-id="${h.id}">${met ? I.check + "Workout logged — open Workout" : I.dumbbell + "Log a workout"}</button>`;
  }
  return `<button class="btn ${met ? "good" : "primary"} slim" data-action="habit-toggle-d" data-id="${h.id}">${met ? I.check + "Done — tap to undo" : "Mark done"}</button>`;
}
function openHabitDetail(id) {
  const h = state.habits.find(x => x.id === id);
  if (!h) { closeModal(); return; }
  const d = dayCursor("habits");
  const e = habitEntry(h, d) || {};
  openModal(`
    <header class="modal-head"><h3>${esc(h.emoji)} ${esc(h.name)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      ${h.why ? `<p class="habit-why">“${esc(h.why)}”</p>` : ""}
      ${dayNav("habits")}
      ${habitDayControl(h, d, e)}
      <div class="pill-row"><span class="chip-cad">${cadenceLabel(h)}</span><span class="spacer"></span><button class="btn tiny ghost" data-action="habit-skip" data-id="${h.id}">${e.skip ? "Un-skip this day" : "Skip / rest day"}</button></div>
      <label class="fld"><span>What did you do? · ${niceDate(d, { month: "short", day: "numeric" })}</span>
        <textarea data-change="habit-note" data-id="${h.id}" placeholder="A line about how it went…" maxlength="600">${esc(e.note || "")}</textarea></label>
      <div class="fld"><span>Last 4 weeks · ${habitCompletion(h, 30)}% completion</span>${habitHistoryRow(h)}</div>
      <label class="fld"><span>Order in the list</span>
        <span class="pill-row">
          <button type="button" class="btn ghost slim" data-action="habit-up" data-id="${h.id}">${I.chevL}Earlier</button>
          <button type="button" class="btn ghost slim" data-action="habit-down" data-id="${h.id}">Later${I.chevR}</button>
        </span></label>
      <p class="soft note">${I.grip} On the list you can drag a habit by its handle. These do the same thing — drag needs a pointer, so they stay for keyboards.</p>
      ${relatedCard("habit", h.id)}
      ${historyCard("habit", h.id)}
      ${(() => {
        const src = habitSource(h);
        if (!src) return `<p class="soft note">${I.link} Not linked to an area — you tick this one by hand. Add a source in <b>Edit</b> to have it fill itself in.</p>`;
        const a = areaOf(src.area);
        return `<div class="fed-note">
          <span class="tile-ic" style="--a:${cssVar(a.hue)}">${I[a.icon]}</span>
          <span class="row-txt"><b>Filled in by ${esc(a.name)}</b><small>${h.kind === "workout"
            ? (workoutDone(d) ? `${(state.workout.log[d] || []).length} session${(state.workout.log[d] || []).length > 1 ? "s" : ""} logged that day` : "No session logged that day")
            : `${habitAmount(h, d)}${h.unit ? " " + esc(h.unit) : ""} on that day`}</small></span>
          <button class="btn tiny ghost" data-action="habit-source-jump" data-id="${h.id}">Open</button>
        </div>`;
      })()}
      <div class="fld"><span>Milestones</span>
        ${h.milestones.length ? `<ul class="ms-list">
          ${h.milestones.map(m => `<li class="${m.done ? "done" : ""}"><button class="checkbox sm" data-action="ms-toggle" data-h="${h.id}" data-m="${m.id}" aria-label="Toggle milestone">${I.check}</button><span>${esc(m.text)}</span><button class="icon-btn ghost" data-action="ms-del" data-h="${h.id}" data-m="${m.id}" aria-label="Delete milestone">${I.x}</button></li>`).join("")}
        </ul>` : `<p class="soft small">No milestones yet.</p>`}
        <button class="btn tiny ghost" data-action="ms-add" data-id="${h.id}">${I.plus}Add milestone</button>
      </div>
      <div class="fld"><span>Part of goals</span>
        ${state.goals.length ? `<div class="goal-pick-wrap">${state.goals.map(g => `<label class="goal-pick"><input type="checkbox" data-change="habit-goal-toggle" data-h="${h.id}" data-g="${g.id}" ${(h.goalIds || []).includes(g.id) ? "checked" : ""}><span class="gp-emoji">${esc(g.emoji || "🎯")}</span><span class="gp-name">${esc(g.title || "Untitled goal")}</span><i class="gp-tick">${I.check}</i></label>`).join("")}</div>` : `<p class="soft small">No goals yet — create one below.</p>`}
      </div>
      <div class="pill-row"><button class="btn ghost" data-action="habit-edit" data-id="${h.id}">${I.edit}Edit</button><button class="btn ghost" data-action="${h.archived ? 'habit-restore' : 'habit-archive'}" data-id="${h.id}">${h.archived ? I.check + 'Restore' : I.moon + 'Archive'}</button><button class="btn danger" data-action="habit-del-d" data-id="${h.id}">${I.trash}Delete</button></div><p class="soft note">${I.moon} <b>Archive</b> retires a habit without touching a single day you already logged — it stops counting toward today&rsquo;s perfect day and streak from now on, and you can restore it any time. <b>Delete</b> removes it and its whole history.</p>
    </div>`);
}

function openGoalDetail(id) {
  const g = state.goals.find(x => x.id === id);
  if (!g) { closeModal(); return; }
  const gp = goalProgress(g);
  const linked = state.habits.filter(h => (h.goalIds || []).includes(g.id));
  const isNum = g.type === "outcome";
  const cur = goalCurrent(g);
  const chartData = (g.progress || []).map(p => ({ label: +p.date.slice(-2), value: p.value, tip: `${niceDate(p.date)} · ${p.value} ${g.unit || ""}` }));
  openModal(`
    <header class="modal-head"><h3>${esc(g.emoji || "🎯")} ${esc(g.title)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      ${isNum ? `
        <div class="goal-num"><div class="goal-num-big">${cur}<span>${esc(g.unit || "")}</span></div><div class="goal-num-meta"><small class="soft">start ${g.start} → target ${g.target} ${esc(g.unit || "")}</small>${g.deadline ? `<small class="soft">${I.calendar} ${daysUntil(g.deadline)}</small>` : ""}</div></div>
        <div class="progress-line"><span>${gp.pct}% there</span>${barHtml(gp.pct, "#6a5ae0")}<b>${gp.pct}%</b></div>
        ${chartData.length ? `<div class="fld"><span>Progress log</span><div data-chart-type="bar" data-chart='${esc(JSON.stringify(chartData))}' data-color="#6a5ae0" data-h="120" data-goal="${g.target}" data-label="progress"></div></div>` : ""}
        <button class="btn primary slim" data-action="goal-log" data-id="${g.id}">${I.plus}Log ${esc(g.unit || "value")}</button>
      ` : `<div class="progress-line"><span>${gp.done}/${gp.tot} milestones</span>${barHtml(gp.pct, "#6a5ae0")}<b>${gp.pct}%</b></div>`}
      ${g.note ? `<p class="habit-why">“${esc(g.note)}”</p>` : ""}
      <div class="fld"><span>Milestones${isNum ? " (auto-complete as you log)" : ""}</span>
        ${g.milestones.length ? `<ul class="ms-list">
          ${g.milestones.map(m => `<li class="${m.done ? "done" : ""}"><button class="checkbox sm" data-action="gms-toggle" data-g="${g.id}" data-m="${m.id}" aria-label="Toggle milestone">${I.check}</button><span>${esc(m.text)}${m.target != null && m.target !== "" ? ` <i class="soft">@ ${m.target}${esc(g.unit || "")}</i>` : ""}</span><button class="icon-btn ghost" data-action="gms-del" data-g="${g.id}" data-m="${m.id}" aria-label="Delete milestone">${I.x}</button></li>`).join("")}
        </ul>` : `<p class="soft small">No milestones yet.</p>`}
        <button class="btn tiny ghost" data-action="gms-add" data-id="${g.id}">${I.plus}Add milestone</button>
      </div>
      <div class="fld"><span>Daily actions — habits building this goal</span>
        ${linked.length ? `<ul class="goal-habits">${linked.map(h => `<li data-action="habit-open" data-id="${h.id}"><span class="hdot" style="background:${cssVar(h.color, "#6a5ae0")}"></span><b>${esc(h.emoji)} ${esc(h.name)}</b><small class="soft">${habitStreak(h)}🔥 · ${habitCompletion(h, 30)}%</small></li>`).join("")}</ul>` : `<p class="soft small">No habits linked yet.</p>`}
        <button class="btn tiny ghost" data-action="goal-habits" data-id="${g.id}">${I.plus}Link habits</button>
      </div>
      ${(() => {
        const pace = goalPace(g), mins = goalFocusMins(g.id);
        if (!pace && !mins && !g.deadline) return "";
        return `<div class="fld"><span>Progress against the clock</span>
          ${pace ? `<div class="gb-pace ${pace.cls}">
            <span class="gb-pace-bar"><i style="width:${pace.elapsed}%"></i></span>
            <span>${pace.elapsed}% of the time · ${pace.made}% of the goal — ${esc(pace.txt)}</span>
          </div>` : `<p class="soft small">Add a <b>start date</b> as well as a deadline and this can compare the two.</p>`}
          ${mins ? `<p class="soft small">${I.clock} ${estLabel(mins)} of focus sessions have named this goal.</p>` : ""}
        </div>`;
      })()}
      ${relatedCard("goal", g.id)}
      ${historyCard("goal", g.id)}
      <div class="pill-row"><button class="btn ghost" data-action="goal-edit" data-id="${g.id}">${I.edit}Edit</button><button class="btn danger" data-action="goal-del" data-id="${g.id}">${I.trash}Delete</button></div>
    </div>`);
  drawCharts();
}
function goalFormFields(g) {
  g = g || {};
  return fld("Title", txt("title", "e.g. Lose 8 kg", g.title || "")) +
    fld("Emoji", txt("emoji", "🎯", g.emoji || "🎯", false)) +
    fld("Type", `<select name="type">
      <option value="outcome" ${g.type === "outcome" ? "selected" : ""}>Number to reach (track progress + chart)</option>
      <option value="checklist" ${g.type !== "outcome" ? "selected" : ""}>Checklist of milestones</option>
    </select>`) +
    `<div class="fld-row">${fld("Start", num("start", g.start || 0, 0, "any"))}${fld("Target", num("target", g.target || 0, 0, "any"))}${fld("Unit", txt("unit", "kg", g.unit || "", false))}</div>` +
    fld("Direction", `<select name="direction"><option value="down" ${g.direction !== "up" ? "selected" : ""}>Lower is better (lose weight)</option><option value="up" ${g.direction === "up" ? "selected" : ""}>Higher is better (gain / save)</option></select>`) +
    `<div class="fld-row">${
      fld("Started on <small class=\"soft\">— optional</small>", `<input type="date" name="startedOn" value="${esc(g.startedOn || "")}">`)}${
      fld("Deadline <small class=\"soft\">— optional</small>", `<input type="date" name="deadline" value="${g.deadline || ""}">`)
    }</div>` +
    `<p class="soft note">${I.spark} Fill in <b>both</b> dates and the Goals page can compare how much of the time has gone against how much of the goal is done. Leave either blank and it stays quiet rather than guessing.</p>` +
    fld("Priority", `<select name="priority">${Object.keys(PRIORITY).map(k => `<option value="${k}" ${(g.priority || "med") === k ? "selected" : ""}>${PRIORITY[k].label}</option>`).join("")}</select>`) +
    fld("Tags <small class=\"soft\">— comma separated</small>", txt("tags", "health, career", (g.tags || []).join(", "), false)) +
    fld("Status", `<select name="status">
      <option value="active" ${(g.status || "active") === "active" ? "selected" : ""}>Active — show it on my dashboard</option>
      <option value="paused" ${g.status === "paused" ? "selected" : ""}>Paused — keep it, hide it for now</option>
      <option value="done" ${g.status === "done" ? "selected" : ""}>Done — archived</option>
    </select>`) +
    fld("Why / note", txt("note", "your reason…", g.note || "", false));
}
function openGoalHabits(id) {
  const g = state.goals.find(x => x.id === id); if (!g) return;
  openModal(`<header class="modal-head"><h3>Link habits · ${esc(g.title)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body"><p class="soft small">Tick the habits that build this goal.</p>
      <ul class="link-list">${goalPickHabits(g).map(h => `<li><label class="check-inline"><input type="checkbox" data-change="goal-habit-toggle" data-g="${g.id}" data-h="${h.id}" ${(h.goalIds || []).includes(g.id) ? "checked" : ""}> <span>${esc(h.emoji)} ${esc(h.name)}</span></label></li>`).join("")}</ul>
      <div class="modal-foot"><button type="button" class="btn primary" data-action="goal-open" data-id="${g.id}">Done</button></div></div>`);
}

/* ---------- health ---------- */
function vHealth() {
  const d = dayCursor("health"), isToday = d === todayIso();
  const g = state.health.goals, l = healthOn(d);
  const week = weekOfDate(d);
  const stepsData = week.map((x, i) => {
    const v = (state.health.log[x] || {}).steps || 0;
    return { label: WD_SHORT[i], value: v, tip: `${WD_SHORT[i]} · ${v.toLocaleString()} steps` };
  });
  const moods = ["😄", "🙂", "😌", "😐", "🥱", "😔", "😤"];
  return `
  <div class="grid">
    ${card("span2 daynav-card", dayNav("health"))}
    ${card("center", `
      ${ring(100 * (l.steps || 0) / g.steps, { size: 130, sw: 10, color: "#30a46c", center: (l.steps || 0).toLocaleString(), sub: `/ ${g.steps.toLocaleString()} steps`, label: isToday ? "steps today" : "steps that day" })}
      <div class="pill-row">
        <button class="btn ghost" data-action="steps-add" data-n="500">+500</button>
        <button class="btn ghost" data-action="steps-add" data-n="2000">+2,000</button>
        <button class="btn ghost" data-action="health-goals">${I.sliders}Goals</button>
      </div>`)}

    ${card("", cardHead((isToday ? "Today's" : niceDate(d, { weekday: "long" }) + "'s") + " log") + `
      <ul class="log-list">
        <li><span class="tile-ic" style="--a:#00a2c7">${I.drop}</span><span class="row-txt"><b>Water</b><small>${(l.water || 0).toFixed(2)} / ${g.water} L</small></span>
          <span class="pill-row"><button class="btn tiny" data-action="water-add" data-n="0.25">+0.25</button><button class="btn tiny" data-action="water-add" data-n="0.5">+0.5</button></span></li>
        <li><span class="tile-ic" style="--a:#7c66dc">${I.moon}</span><span class="row-txt"><b>Sleep</b><small>${l.sleep ? l.sleep + " h" : "not logged"}</small></span>
          <span class="pill-row"><input class="num-input" type="number" min="0" max="24" step="0.5" value="${l.sleep || ""}" placeholder="h" data-change="sleep-set" aria-label="Hours slept"></span></li>
        <li><span class="tile-ic" style="--a:#e5484d">${I.heart}</span><span class="row-txt"><b>Mood</b><small>${l.mood ? "Feeling " + l.mood : "how do you feel?"}</small></span>
          <span class="mood-row">${moods.map(m => `<button class="mood ${l.mood === m ? "on" : ""}" data-action="mood-set" data-m="${m}">${m}</button>`).join("")}</span></li>
      </ul>`)}

    ${card("span2", cardHead("Steps this week") + `
      <div data-chart-type="bar" data-chart='${esc(JSON.stringify(stepsData))}' data-goal="${g.steps}" data-color="#30a46c" data-h="160" data-label="Steps that week"></div>
      <p class="chart-note">${I.target} goal line at ${g.steps.toLocaleString()} steps</p>`)}

    ${card("span2", cardHead("Mood · last 14 days") + (() => {
      const days = [...Array(14)].map((_, i) => addDays(d, i - 13));
      const logged = days.filter(x => moodOn(x)).length;
      return `<div class="mood-strip">${days.map(x => `
        <button class="mood-day ${x === d ? "on" : ""}" data-action="mood-goto" data-d="${x}" title="${niceDate(x, { weekday: "long", month: "short", day: "numeric" })}">
          <span class="md-face">${moodOn(x) || "·"}</span>
          <small>${niceDate(x, { day: "numeric" })}</small>
        </button>`).join("")}</div>
      <p class="chart-note">${I.heart} ${logged} of 14 days logged${logged ? " — tap a day to jump to it" : ""}. Journal and Health share one mood.</p>`;
    })())}
  </div>`;
}

/* ---------- workout ---------- */
const WORKOUT_CATS = ["Calisthenics", "Strength", "Cardio", "Mobility", "Yoga", "Class"];
function planFormFields(p) {
  p = p || {};
  return fld("Name", txt("name", "e.g. Pull-ups", p.name || "")) +
    fld("Type", `<select name="category">${WORKOUT_CATS.map(c => `<option ${p.category === c ? "selected" : ""}>${c}</option>`).join("")}</select>`) +
    `<div class="fld-row">${fld("Minutes", `<input type="number" name="minutes" value="${p.minutes || 30}" min="0">`)}${fld("Sets — optional", `<input type="number" name="sets" value="${p.sets || ""}" min="0" placeholder="—">`)}${fld("Reps — optional", `<input type="number" name="reps" value="${p.reps || ""}" min="0" placeholder="—">`)}</div>` +
    `<div class="fld-row"><label class="fld"><span>On days (optional)</span>${weekdayPicker(p.days || [])}</label>${fld("Time", `<input type="time" name="time" value="${p.time || ""}">`)}</div>` +
    fld("Focus — optional", txt("focus", "e.g. Chest & triceps", p.focus || "", false)) +
    fld("Exercises — optional, comma-separated (makes it an all-in-one routine)", txt("exercises", "Bench press, Squat, Row", (p.exercises || []).map(e => e.name).join(", "), false)) +
    fld("Emoji", txt("emoji", "🏋️", p.emoji || "🏋️", false));
}
function planFromForm(f) {
  const days = [...Array(7)].map((_, i) => f["wd" + i] ? i : -1).filter(x => x >= 0);
  const exercises = (f.exercises || "").split(",").map(s => s.trim()).filter(Boolean).map(n => ({ id: uid(), name: n, kind: "reps", sets: [] }));
  return { name: f.name, category: f.category || "", minutes: +f.minutes || 0, sets: +f.sets || 0, reps: +f.reps || 0, days, time: f.time || "", focus: f.focus || "", exercises, emoji: f.emoji || "🏋️" };
}
const CAT_COLORS = { Calisthenics: "#12a594", Strength: "#f76b15", Cardio: "#e5484d", Mobility: "#7c66dc", Yoga: "#8e4ec6" };
function removeSession(id) {
  const s = state.workout.sessions.find(x => x.id === id);
  if (!s) return;
  (s.media || []).forEach(dropMedia);
  dropSessionSkills(id);        // the practice entries this session created go with it
  state.workout.sessions = state.workout.sessions.filter(x => x.id !== id);
  Object.keys(state.workout.log).forEach(d => {
    state.workout.log[d] = (state.workout.log[d] || []).filter(x => x !== id);
    if (!state.workout.log[d].length) delete state.workout.log[d];
  });
  state.habits.forEach(h => Object.values(h.log).forEach(e => { if (e && typeof e === "object" && e.workoutId === id) delete e.workoutId; }));
}
/* ===== athletic skills — "am I improving?" =====
   A skill is not a percentage. "Back wheel" is somewhere between can't and can, and the honest
   description of where you are is a stage you pick, not a number the app computes. The four stages
   come straight from the spec; the app supplies the evidence (when you last practised, how often,
   your best) and leaves the judgement to you. It will never decide you have Mastered something. */
const SKILL_STAGES = [
  { id: "learning",   label: "Learning",   pct: 25,  hue: "#e5484d", hint: "mostly failing — which is what learning looks like" },
  { id: "practicing", label: "Practicing", pct: 50,  hue: "#f76b15", hint: "it happens sometimes" },
  { id: "consistent", label: "Consistent", pct: 75,  hue: "#3e63dd", hint: "it happens most times you try" },
  { id: "mastered",   label: "Mastered",   pct: 100, hue: "#30a46c", hint: "on demand, cold" },
];
const SKILL_CATS = ["Calisthenics", "Gymnastics", "Mobility", "Balance", "Other"];
const skillsAll = () => (state.workout.skills = state.workout.skills || []);
const skillById = (id) => skillsAll().find(x => x.id === id) || null;
const skillStage = (sk) => SKILL_STAGES.find(x => x.id === sk.status) || SKILL_STAGES[0];
const skillLog = (sk) => (sk.log = sk.log || []);
const skillLastPracticed = (sk) => skillLog(sk).map(r => r.date).sort().pop() || "";
/* Best is DERIVED from the practice log, never stored beside it — a stored personal best is a second
   number that can quietly disagree with the entries it was supposed to summarise. */
function skillBest(sk) {
  const vals = skillLog(sk).map(r => +r.best || 0).filter(v => v > 0);
  return vals.length ? Math.max(...vals) : 0;
}
function skillTrend(sk) {
  return skillLog(sk).filter(r => +r.best > 0).sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ label: +r.date.slice(-2), value: +r.best,
                 tip: `${niceDate(r.date)} · ${r.best}${sk.pbUnit ? " " + sk.pbUnit : ""}` }));
}
/* A session names the skills it was for; those entries live in the skill's own log so a skill can
   also be practised outside a session. This reconciles the two directions in one pass and is
   idempotent, so editing a session's skill list adds and removes exactly what changed. */
function syncSessionSkills(sess) {
  skillsAll().forEach(sk => {
    const log = skillLog(sk);
    const has = log.some(r => r.sessionId === sess.id);
    const want = (sess.skills || []).includes(sk.id);
    if (want && !has) log.push({ id: uid(), date: sess.date, note: "", best: 0, sessionId: sess.id });
    else if (want && has) log.forEach(r => { if (r.sessionId === sess.id) r.date = sess.date; });
    else if (!want && has) sk.log = log.filter(r => r.sessionId !== sess.id);
  });
}
/* deleting a session must take its practice entries with it, exactly as removeSession already
   strips the session id out of habit logs */
const dropSessionSkills = (id) => skillsAll().forEach(sk => { sk.log = skillLog(sk).filter(r => r.sessionId !== id); });
/* skills nobody has touched lately — evidence for the user, not a verdict from the app */
function staleSkills(days = 14) {
  return skillsAll().filter(sk => {
    if (sk.status === "mastered") return false;
    const last = skillLastPracticed(sk);
    return !last || daysLeft(last) < -days;
  });
}
/* Every coach correction ever received, newest first — no new storage at all, just the feedback
   already sitting on sessions. */
function coachNotes(coach) {
  const out = [];
  (state.workout.sessions || []).forEach(s => {
    if (s.feedback && (!coach || normName(s.coach) === normName(coach))) {
      out.push({ date: s.date, coach: s.coach || "", text: s.feedback, id: s.id });
    }
  });
  skillsAll().forEach(sk => (sk.notes || []).forEach(n => {
    if (!coach || normName(n.coach) === normName(coach)) {
      out.push({ date: (n.at || "").slice(0, 10), coach: n.coach || "", text: n.text, skill: sk.name });
    }
  }));
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
const coachesSeen = () => [...new Set((state.workout.sessions || []).map(s => s.coach).filter(Boolean))];

/* ----- exercise / PR helpers ----- */
function setLabel(ex, set) {
  if (ex.kind === "time") return `${set.seconds || 0}s`;
  if (ex.kind === "distance") return `${set.distance || 0} ${set.unit || "km"}`;
  return `${set.weight || 0}kg × ${set.reps || 0}`;
}
function exerciseNames() { const s = new Set(); state.workout.sessions.forEach(x => (x.exercises || []).forEach(e => s.add(e.name))); return [...s]; }
/* Names you've already used, offered back to you. Same fix as the people list in Pass C, and for the
   same reason: "Bench press" and "bench Press" would otherwise split one exercise's PR history in two. */
function exerciseDatalist() {
  const names = exerciseNames();
  return names.length ? `<datalist id="ex-names">${names.map(n => `<option value="${esc(n)}"></option>`).join("")}</datalist>` : "";
}
/* What a session actually amounted to. Volume only means something for weight work, so time and
   distance are totalled in their own units rather than mashed into one meaningless number. */
function sessionTotals(s) {
  let sets = 0, reps = 0, volume = 0, seconds = 0, distance = 0, unit = "km";
  (s.exercises || []).forEach(ex => (ex.sets || []).forEach(set => {
    sets++;
    if (ex.kind === "time") seconds += +set.seconds || 0;
    else if (ex.kind === "distance") { distance += +set.distance || 0; if (set.unit) unit = set.unit; }
    else { reps += +set.reps || 0; volume += (+set.weight || 0) * (+set.reps || 0); }
  }));
  return { sets, reps, volume: Math.round(volume), seconds, distance: Math.round(distance * 100) / 100, unit,
    exercises: (s.exercises || []).length };
}
function totalsLabel(t) {
  const bits = [];
  if (t.exercises) bits.push(`${t.exercises} exercise${t.exercises === 1 ? "" : "s"}`);
  if (t.sets) bits.push(`${t.sets} set${t.sets === 1 ? "" : "s"}`);
  if (t.reps) bits.push(`${t.reps} reps`);
  if (t.volume) bits.push(`${t.volume.toLocaleString()} kg volume`);
  if (t.seconds) bits.push(t.seconds >= 120 ? `${Math.round(t.seconds / 60)} min held` : `${t.seconds}s held`);
  if (t.distance) bits.push(`${t.distance} ${t.unit}`);
  return bits.join(" · ");
}
/* the most recent earlier session of the same category that actually had exercises in it */
function lastSessionLike(s) {
  return state.workout.sessions
    .filter(x => x.id !== s.id && (x.exercises || []).length && (x.category || "") === (s.category || "") && x.date <= s.date)
    .sort((a, b) => a.date < b.date ? 1 : -1)[0] || null;
}
/* the same totals across every session in a set of days */
function totalsFor(sessions) {
  return sessions.reduce((a, s) => {
    const t = sessionTotals(s);
    a.sets += t.sets; a.reps += t.reps; a.volume += t.volume; a.seconds += t.seconds;
    a.distance += t.distance; a.exercises += t.exercises;
    if (t.unit) a.unit = t.unit;
    return a;
  }, { sets: 0, reps: 0, volume: 0, seconds: 0, distance: 0, exercises: 0, unit: "km" });
}
function exerciseKind(name) { for (const s of state.workout.sessions) for (const e of (s.exercises || [])) if (e.name === name) return e.kind; return "reps"; }
/* Is every weighted set on this exercise bodyweight? Pull-ups and push-ups are logged as
   `0 kg × 12`, so measuring them by weight gives 0 and the app proudly announced "PR 0 kg" — while
   "Maximum Pull Ups" is the very first line of the spec's Personal Records. For an exercise that
   has never carried load, the record IS the rep count. */
function isBodyweight(name) {
  let any = false;
  for (const s of state.workout.sessions)
    for (const e of (s.exercises || []))
      if (e.name === name && e.kind === "reps")
        for (const set of (e.sets || [])) { any = true; if ((+set.weight || 0) > 0) return false; }
  return any;
}
const setMetric = (kind, set, bw) =>
  kind === "reps" ? (bw ? (+set.reps || 0) : (+set.weight || 0))
  : kind === "time" ? (+set.seconds || 0) : (+set.distance || 0);
function prPrimary(name, kind) {
  const bw = kind === "reps" && isBodyweight(name);
  let best = 0;
  state.workout.sessions.forEach(s => (s.exercises || []).forEach(e => { if (e.name !== name) return; (e.sets || []).forEach(set => { best = Math.max(best, setMetric(kind, set, bw)); }); }));
  return best;
}
function prLabel(kind, v, name) {
  if (kind === "time") return `${v}s`;
  if (kind === "distance") return `${v} km`;
  return (name && isBodyweight(name)) ? `${v} reps` : `${v} kg`;
}
function exerciseSessionBest(name, kind) {
  const bw = kind === "reps" && isBodyweight(name);
  const rows = [];
  state.workout.sessions.forEach(s => {
    let v = 0; (s.exercises || []).forEach(e => { if (e.name !== name) return; (e.sets || []).forEach(set => { v = Math.max(v, setMetric(kind, set, bw)); }); });
    if (v > 0) rows.push({ date: s.date, value: v });
  });
  return rows.sort((a, b) => a.date < b.date ? -1 : 1);
}
function exerciseCard(s, ex) {
  return `<div class="ex">
    <div class="ex-head"><b>${esc(ex.name)}</b><span class="soft small">${(ex.sets || []).length} set${(ex.sets || []).length !== 1 ? "s" : ""}</span><span class="spacer"></span><button class="icon-btn ghost" data-action="ex-del" data-s="${s.id}" data-e="${ex.id}" aria-label="Delete exercise">${I.x}</button></div>
    ${(ex.sets || []).length ? `<div class="set-wrap">${ex.sets.map((set, i) => `<span class="set-chip">${setLabel(ex, set)}<button data-action="set-del" data-s="${s.id}" data-e="${ex.id}" data-i="${i}" aria-label="Remove set">×</button></span>`).join("")}</div>` : ""}
    <button class="btn tiny ghost" data-action="set-add" data-s="${s.id}" data-e="${ex.id}">${I.plus}Add set</button>
  </div>`;
}
/* One shape for a session, in one place. Three call sites used to build this object literal by hand,
   which is how two of them end up missing a field a migration added. */
const bornSession = (o) => Object.assign({
  id: uid(), date: todayIso(), category: "Strength", planId: null, planName: "", note: "",
  exercises: [], media: [], skills: [],
  coach: "", location: "", duration: 0, attendance: "present",
  energy: 0, difficulty: 0, enjoyed: 0, feedback: "", learned: "", reflection: "", nextGoal: "",
}, o);
const sessionReported = (s) => !!(s.coach || s.duration || s.energy || s.difficulty || s.enjoyed || s.feedback || s.learned || s.reflection || s.nextGoal || (s.skills || []).length);
function sessionCard(s) {
  const c = cssVar(Object.prototype.hasOwnProperty.call(CAT_COLORS, s.category) ? CAT_COLORS[s.category] : "", "#f76b15");
  return `<li class="session">
    <div class="session-head">
      <span class="chip-cat" style="--a:${c}">${esc(s.category || "Session")}</span>
      ${s.planName ? `<b>${esc(s.planName)}</b>` : ""}
      <span class="spacer"></span>
      ${(() => { const t = sessionTotals(s); return t.sets ? `<span class="sess-totals" title="${esc(totalsLabel(t))}">${t.sets} set${t.sets === 1 ? "" : "s"}${t.volume ? ` · ${t.volume.toLocaleString()}kg` : ""}</span>` : ""; })()}
      <button class="icon-btn ghost" data-action="session-note" data-id="${s.id}" aria-label="Edit note">${I.pen}</button>
      <button class="icon-btn ghost" data-action="session-del" data-id="${s.id}" aria-label="Delete session">${I.trash}</button>
    </div>
    ${s.note ? `<p class="session-note">${esc(s.note)}</p>` : ""}
    ${(s.exercises && s.exercises.length) ? `<div class="ex-list">${s.exercises.map(ex => exerciseCard(s, ex)).join("")}</div>` : ""}
    ${(() => { const t = sessionTotals(s); return t.sets ? `<p class="sess-sum">${I.chart} ${esc(totalsLabel(t))}</p>` : ""; })()}
    ${(() => {
      const bits = [];
      if (s.coach) bits.push(`${I.user}${esc(s.coach)}`);
      if (s.duration) bits.push(`${I.clock}${s.duration} min`);
      if (s.energy) bits.push(`energy ${s.energy}/5`);
      if (s.difficulty) bits.push(`hard ${s.difficulty}/5`);
      (s.skills || []).forEach(id => { const sk = skillById(id); if (sk) bits.push(`${esc(sk.emoji || "\u{1F938}")} ${esc(sk.name)}`); });
      return bits.length ? `<p class="sess-meta">${bits.join(" · ")}</p>` : "";
    })()}
    ${s.feedback ? `<p class="sess-coach">${I.pen}${esc(s.feedback)}</p>` : ""}
    ${s.learned ? `<p class="sess-learn">${I.spark}${esc(s.learned)}</p>` : ""}
    ${s.nextGoal ? `<p class="sess-next">${I.target}Next: ${esc(s.nextGoal)}</p>` : ""}
    <div class="pill-row">
      <button class="btn tiny ghost" data-action="ex-add" data-id="${s.id}">${I.plus}Add exercise</button>
      <button class="btn tiny ghost" data-action="session-report" data-id="${s.id}">${I.pen}${sessionReported(s) ? "Edit reflection" : "How did it go?"}</button>
      ${!(s.exercises || []).length && lastSessionLike(s) ? `<button class="btn tiny ghost" data-action="session-repeat" data-id="${s.id}">${I.chevL}Same as last time</button>` : ""}
    </div>
    ${(s.media && s.media.length) ? `<div class="media-grid">
      ${s.media.map(m => `<div class="media-item">
        <span class="media-host" data-media="${m.id}" data-media-kind="${m.kind}"><span class="media-missing">loading…</span></span>
        <button class="icon-btn ghost media-thumb-del" data-action="session-media-del" data-s="${s.id}" data-m="${m.id}" aria-label="Remove media">${I.x}</button>
      </div>`).join("")}
    </div>` : ""}
    <label class="btn tiny ghost upload-btn"><input type="file" accept="image/*,video/*" hidden data-change="session-media" data-id="${s.id}"><span>${I.upload}Add photo / video</span></label>
  </li>`;
}
/* the session report — the spec's questions, in one editable sheet.
   Deliberately NOT a start/finish timer: the focus timer already exists, and a second clock in the
   same app is a second answer to "how long was that". A session is logged after the fact anyway,
   and coach feedback often arrives the next day, so this stays editable — unlike a project
   reflection, which is written in the moment. */
const rateRow = (name, val, n, lo, hi) => `<div class="rate-row" role="radiogroup">
  ${[...Array(n)].map((_, i) => i + 1).map(v => `<label class="rate-chip">
    <input type="radio" name="${name}" value="${v}" ${+val === v ? "checked" : ""}><span>${v}${v === 1 ? `<i>${esc(lo)}</i>` : v === n ? `<i>${esc(hi)}</i>` : ""}</span>
  </label>`).join("")}</div>`;

function openSessionReport(id) {
  const s = state.workout.sessions.find(x => x.id === id);
  if (!s) { closeModal(); return; }
  const skills = skillsAll();
  openModal(`<form data-submit="session-report">
    <header class="modal-head"><h3>How did it go?</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <p class="soft small">${esc(s.category || "Session")} · ${esc(niceDate(s.date, { weekday: "long", month: "long", day: "numeric" }))}</p>
      <div class="fld-row">
        ${fld("Coach <small class=\"soft\">— optional</small>", `<input type="text" name="coach" list="people-list" value="${esc(s.coach || "")}" placeholder="who taught it" autocomplete="off">`)}
        ${fld("Where", txt("location", "studio, park, home", s.location || "", false))}
      </div>
      ${peopleDatalist()}
      <div class="fld-row">
        ${fld("Minutes", `<input type="number" name="duration" min="0" step="5" value="${s.duration || ""}" inputmode="numeric" placeholder="90">`)}
        ${fld("Attendance", `<select name="attendance">
          <option value="present" ${s.attendance !== "missed" ? "selected" : ""}>Present</option>
          <option value="missed" ${s.attendance === "missed" ? "selected" : ""}>Missed it</option>
        </select>`)}
      </div>

      ${skills.length ? `<div class="fld"><span>Which skills did you practise?</span>
        <ul class="link-list">${skills.map(sk => `<li><label class="check-inline">
          <input type="checkbox" name="skill_${sk.id}" ${(s.skills || []).includes(sk.id) ? "checked" : ""}>
          <span>${esc(sk.emoji || "\u{1F938}")} ${esc(sk.name)}</span></label></li>`).join("")}</ul>
        <p class="soft small">Ticking one records a practice against that skill — you never log it twice.</p>
      </div>` : ""}

      <div class="fld"><span>Energy</span>${rateRow("energy", s.energy, 5, "empty", "buzzing")}</div>
      <div class="fld"><span>How hard was it?</span>${rateRow("difficulty", s.difficulty, 5, "easy", "brutal")}</div>
      <div class="fld"><span>Did you enjoy it?</span>${rateRow("enjoyed", s.enjoyed, 5, "not really", "loved it")}</div>

      ${fld("What did your coach correct?", `<textarea name="feedback" rows="2" maxlength="400" placeholder="e.g. Open your shoulders more">${esc(s.feedback || "")}</textarea>`)}
      ${fld("What improved, or what did you learn?", `<textarea name="learned" rows="2" maxlength="400" placeholder="e.g. The back wheel felt much smoother">${esc(s.learned || "")}</textarea>`)}
      ${fld("Anything else <small class=\"soft\">— optional</small>", `<textarea name="reflection" rows="2" maxlength="600" placeholder="how it felt">${esc(s.reflection || "")}</textarea>`)}
      ${fld("What should you focus on next time?", txt("nextGoal", "e.g. bridge kick-over", s.nextGoal || "", false))}

      <p class="soft note">${I.spark} Every part of this is optional, and all of it can be changed later — coach feedback often only makes sense the next day.</p>
      <input type="hidden" name="id" value="${s.id}">
    </div>
    <footer class="modal-foot">
      <button type="button" class="btn ghost" data-action="modal-close">Cancel</button>
      <button type="submit" class="btn primary">${I.check}Save</button>
    </footer></form>`);
}

function coachNotebookCard() {
  const rows = coachNotes();
  if (!rows.length) return "";
  const who = coachesSeen();
  return card("span2", cardHead(`Coach notebook <small class="soft">${rows.length}</small>`) + `
    <ul class="hist-log coach-log">${rows.slice(0, 12).map(r => `<li>
      <span class="hl-when">${esc(niceDate(r.date, { month: "short", day: "numeric" }))}</span>
      <span class="hl-what">${esc(r.text)}${r.coach ? ` <i class="soft">— ${esc(r.coach)}</i>` : ""}${r.skill ? ` <i class="soft">· ${esc(r.skill)}</i>` : ""}</span>
    </li>`).join("")}</ul>
    ${rows.length > 12 ? `<p class="soft small">${rows.length - 12} older note${rows.length - 12 === 1 ? "" : "s"} not shown.</p>` : ""}
    <p class="soft note">${I.spark} Every correction you've written down${who.length ? `, from ${who.map(x => esc(x)).join(", ")}` : ""}. Nothing here is stored twice — it's the feedback already on your sessions.</p>`);
}

function skillTile(sk) {
  const st = skillStage(sk), last = skillLastPracticed(sk), best = skillBest(sk);
  return `<li class="skl" data-action="skill-open" data-id="${sk.id}" style="--a:${cssVar(st.hue)}">
    <span class="skl-emoji" aria-hidden="true">${esc(sk.emoji || "\u{1F938}")}</span>
    <span class="skl-body">
      <span class="skl-top"><b>${esc(sk.name)}</b><span class="skl-stage">${esc(st.label)}</span></span>
      ${barHtml(st.pct, st.hue)}
      <span class="skl-meta">
        ${best ? `<span>${I.trophy}${best}${sk.pbUnit ? " " + esc(sk.pbUnit) : ""}</span>` : ""}
        <span>${last ? esc(agoLabel(last)) : `<i class="soft">not practised yet</i>`}</span>
      </span>
    </span>
    <span class="skl-go" aria-hidden="true">${I.chevR}</span>
  </li>`;
}
function skillsCard() {
  const all = skillsAll();
  const head = cardHead(`Skills${all.length ? ` <small class="soft">${all.length}</small>` : ""}`, addBtn("New skill", "skill-add"));
  if (!all.length) return card("span2", head + emptyMsg("target",
    "A handstand, a muscle-up, a back wheel. Name the ones you're chasing and every session can say which of them it was for.",
    addBtn("Add your first skill", "skill-add")));
  const order = SKILL_STAGES.map(x => x.id);
  const sorted = [...all].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status) || a.name.localeCompare(b.name));
  const stale = staleSkills();
  return card("span2", head + `<ul class="skill-list">${sorted.map(skillTile).join("")}</ul>` +
    (stale.length ? `<p class="soft note">${I.clock} ${stale.length === 1
      ? `<b>${esc(stale[0].name)}</b> hasn't been practised in a fortnight.`
      : `${stale.length} skills haven't been practised in a fortnight: ${stale.slice(0, 3).map(x => esc(x.name)).join(", ")}${stale.length > 3 ? "…" : ""}`}</p>` : ""));
}

function openSkillDetail(id) {
  const sk = skillById(id);
  if (!sk) { closeModal(); return; }
  const st = skillStage(sk), last = skillLastPracticed(sk), best = skillBest(sk);
  const log = [...skillLog(sk)].sort((a, b) => b.date.localeCompare(a.date));
  const trend = skillTrend(sk);
  openModal(`
    <header class="modal-head"><h3>${esc(sk.emoji || "\u{1F938}")} ${esc(sk.name)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      ${sk.why ? `<p class="habit-why">“${esc(sk.why)}”</p>` : ""}
      <div class="progress-line"><span>${esc(st.label)}</span>${barHtml(st.pct, st.hue)}<b>${st.pct}%</b></div>

      <div class="fld"><span>Where are you with it?</span>
        <div class="stage-row">
          ${SKILL_STAGES.map(x => `<button class="stage-chip ${x.id === sk.status ? "on" : ""}" style="--a:${cssVar(x.hue)}"
            data-action="skill-stage" data-id="${sk.id}" data-s="${x.id}">${esc(x.label)}</button>`).join("")}
        </div>
        <p class="soft small">${esc(st.hint)}. <b>You decide this</b> — LifeHub won't declare a skill mastered on your behalf. It only shows you when you last practised and how you've been doing.</p>
      </div>

      ${(sk.level || sk.target) ? `<div class="fld"><span>Now → next</span>
        <p class="soft small">${sk.level ? `<b>Now:</b> ${esc(sk.level)}` : ""}${sk.level && sk.target ? "<br>" : ""}${sk.target ? `<b>Next:</b> ${esc(sk.target)}` : ""}</p></div>` : ""}

      <div class="fld"><span>Practice</span>
        <p class="soft small">${log.length
          ? `${I.check} ${log.length} session${log.length === 1 ? "" : "s"}${last ? ` · last ${esc(agoLabel(last))}` : ""}${best ? ` · best <b>${best}${sk.pbUnit ? " " + esc(sk.pbUnit) : ""}</b>` : ""}`
          : "Not practised yet. Tick it on a session, or log a practice below."}</p>
        ${trend.length > 1 ? `<div data-chart-type="bar" data-chart='${esc(JSON.stringify(trend))}' data-color="${cssVar(st.hue)}" data-h="110" data-label="${esc(sk.name)} best"></div>` : ""}
        <button class="btn tiny ghost" data-action="skill-practice" data-id="${sk.id}">${I.plus}Log a practice</button>
        ${log.length ? `<ul class="skl-log">${log.slice(0, 10).map(r => `<li>
          <span class="sl-when">${esc(niceDate(r.date, { month: "short", day: "numeric" }))}</span>
          <span class="sl-what">${r.best ? `<b>${r.best}${sk.pbUnit ? " " + esc(sk.pbUnit) : ""}</b> ` : ""}${esc(r.note || (r.sessionId ? "in a session" : "practised"))}</span>
          ${!r.sessionId ? `<button class="icon-btn ghost" data-action="skill-practice-del" data-id="${sk.id}" data-r="${r.id}" aria-label="Remove">${I.x}</button>` : ""}
        </li>`).join("")}</ul>` : ""}
      </div>

      <div class="fld"><span>Coach notes</span>
        ${(sk.notes || []).length ? `<ul class="hist-log">${[...sk.notes].reverse().map(n => `<li>
          <span class="hl-when">${esc(niceDate((n.at || "").slice(0, 10), { month: "short", day: "numeric" }))}</span>
          <span class="hl-what">${esc(n.text)}${n.coach ? ` — ${esc(n.coach)}` : ""}</span>
          <button class="icon-btn ghost" data-action="skill-note-del" data-id="${sk.id}" data-n="${n.id}" aria-label="Remove">${I.x}</button>
        </li>`).join("")}</ul>` : `<p class="soft small">Nothing yet. Corrections you write on a session show up in the Coach Notebook too.</p>`}
        <button class="btn tiny ghost" data-action="skill-note" data-id="${sk.id}">${I.plus}Add a correction</button>
      </div>

      <div class="fld"><span>Photos &amp; video</span>
        <div class="mem-gallery">
          ${(sk.media || []).map(m => `<span class="mem-shot">
            <span class="media-host" data-media="${m.id}" data-media-kind="${m.kind}"><span class="media-missing">…</span></span>
            <button class="photo-x" data-action="skill-media-del" data-id="${sk.id}" data-ref="${m.id}" aria-label="Remove">${I.x}</button>
          </span>`).join("")}
          <label class="mem-add" aria-label="Add a photo or video of this skill">
            <input type="file" accept="image/*,video/*" hidden data-change="skill-media" data-id="${sk.id}">
            ${I.camera}<span>Add clip<br>or photo</span>
          </label>
        </div>
        <p class="soft small">A clip from today next to one from three months ago is the most honest progress report there is.</p>
      </div>

      ${relatedCard("skill", sk.id)}
      ${historyCard("skill", sk.id)}
      <div class="pill-row">
        <button class="btn ghost" data-action="skill-edit" data-id="${sk.id}">${I.edit}Edit</button>
        <button class="btn danger" data-action="skill-del" data-id="${sk.id}">${I.trash}Delete</button>
      </div>
    </div>`);
  drawCharts();
}

function skillFormFields(sk) {
  sk = sk || {};
  return `<div class="fld-row">${fld("Skill", txt("name", "e.g. Muscle up", sk.name || ""))}${fld("Emoji", txt("emoji", "\u{1F938}", sk.emoji || "\u{1F938}", false))}</div>` +
    `<div class="fld-row">${
      fld("Category", `<select name="category">${SKILL_CATS.map(c => `<option ${sk.category === c ? "selected" : ""}>${c}</option>`).join("")}</select>`)}${
      fld("Stage", `<select name="status">${SKILL_STAGES.map(x => `<option value="${x.id}" ${(sk.status || "learning") === x.id ? "selected" : ""}>${x.label}</option>`).join("")}</select>`)
    }</div>` +
    fld("Where you are now <small class=\"soft\">— optional</small>", txt("level", "e.g. kick-over with the wall", sk.level || "", false)) +
    fld("What's next <small class=\"soft\">— optional</small>", txt("target", "e.g. unassisted, both sides", sk.target || "", false)) +
    fld("Measured in <small class=\"soft\">— optional, e.g. seconds or reps</small>", txt("pbUnit", "seconds", sk.pbUnit || "", false)) +
    fld("Why this one?", txt("why", "what having it would mean", sk.why || "", false));
}

function vWorkout() {
  const d = dayCursor("workout"), isToday = d === todayIso();
  const wk = workoutsThisWeek();
  const daySessions = state.workout.sessions.filter(s => s.date === d);
  return `
  <div class="grid">
    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">This week</p><h3>${wk} / ${state.workout.weeklyGoal} workouts</h3>${barHtml(100 * wk / state.workout.weeklyGoal, "#f76b15")}
          ${(() => { const t = totalsFor(state.workout.sessions.filter(s => weekDates().includes(s.date))); return t.sets ? `<small class="soft">${esc(totalsLabel(t))}</small>` : ""; })()}</div>
        <span class="big-ic" style="--a:#f76b15">${I.trophy}</span>
      </div>
      <div class="week-strip small">
        ${weekDates().map((wd, i) => `<button class="wday ${wd === d ? "today" : ""} ${wd > todayIso() ? "future" : ""}" data-action="workout-day" data-d="${wd}"><small>${WD_SHORT[i]}</small><span class="wdot ${(state.workout.log[wd] || []).length ? "full" : ""}"></span></button>`).join("")}
      </div>`)}

    ${skillsCard()}

    ${card("span2", cardHead("Workout plan", `<button class="btn ghost tiny" data-action="workout-library">${I.grid}Routines</button>${addBtn("Add to plan", "workout-add")}`) + (state.workout.plan.length ? `
      <ul class="check-list plan-list">
        ${state.workout.plan.map((p, i) => {
          const on = state.workout.sessions.some(s => s.date === d && s.planId === p.id);
          const meta = [p.category, p.minutes ? p.minutes + " min" : "", p.sets ? `${p.sets}×${p.reps || "?"}` : "", (p.days || []).length ? (p.days || []).map(x => WD_SHORT[x]).join("") : "", p.time, p.focus, (p.exercises || []).length ? `${p.exercises.length} exercises` : ""].filter(Boolean).join(" · ");
          return `<li class="${on ? "done" : ""}">
            <button class="checkbox" data-action="workout-toggle" data-id="${p.id}" aria-label="Toggle ${esc(p.name)}">${I.check}</button>
            <span class="row-emoji">${esc(p.emoji)}</span>
            <span class="row-txt open" data-action="workout-edit" data-id="${p.id}"><b>${esc(p.name)}</b><small>${esc(meta)}</small></span>
            <span class="reorder"><button class="icon-btn ghost" data-action="plan-up" data-id="${p.id}" aria-label="Move up" ${i === 0 ? "disabled" : ""}>${I.chevL}</button><button class="icon-btn ghost" data-action="plan-down" data-id="${p.id}" aria-label="Move down" ${i === state.workout.plan.length - 1 ? "disabled" : ""}>${I.chevR}</button></span>
            <button class="icon-btn ghost" data-action="workout-edit" data-id="${p.id}" aria-label="Edit ${esc(p.name)}">${I.edit}</button>
            <button class="icon-btn ghost" data-action="workout-del" data-id="${p.id}" aria-label="Delete ${esc(p.name)}">${I.trash}</button>
          </li>`;
        }).join("")}
      </ul>` : emptyMsg("dumbbell", "No workouts in your plan yet.", addBtn("Add one", "workout-add"))))}

    ${card("span2", cardHead("Classes & packages", addBtn("Add package", "class-add")) + (state.workout.classes.length ? `
      <ul class="class-list">
        ${state.workout.classes.map(c => {
          const used = (c.log || []).length, remaining = c.total - used, pct = Math.round(100 * used / c.total), doneAll = remaining <= 0;
          return `<li class="${doneAll ? "spent" : ""}">
            <span class="row-emoji">🎟️</span>
            <span class="row-txt"><b>${esc(c.name)}</b><small>${used}/${c.total} sessions${c.price ? ` · ${money(c.price, c.cur)}` : ""}${used ? ` · last ${niceDate((c.log[c.log.length - 1]))}` : ""}</small>${barHtml(pct, doneAll ? "#e5484d" : "#f76b15")}</span>
            <span class="pill-row">
              ${doneAll ? `<button class="btn tiny good" data-action="class-renew" data-id="${c.id}">Renew</button>` : `<button class="btn tiny" data-action="class-attend" data-id="${c.id}">+ Attend</button>`}
              ${used ? `<button class="icon-btn ghost" data-action="class-undo" data-id="${c.id}" aria-label="Undo last">${I.chevL}</button>` : ""}
              <button class="icon-btn ghost" data-action="class-edit" data-id="${c.id}" aria-label="Edit package">${I.edit}</button>
              <button class="icon-btn ghost" data-action="class-del" data-id="${c.id}" aria-label="Delete package">${I.trash}</button>
            </span>
          </li>`;
        }).join("")}
      </ul>
      <p class="soft note">${I.spark} Total on classes: <b>${moneyTotal(sumByCur(state.workout.classes, c => (c.price || 0) * (1 + (c.renewals || 0)), c => c.cur))}</b> — this feeds the Finance section.</p>`
      : emptyMsg("calendar", "Track class packages (e.g. 8 yoga sessions) so you know when to rebook.", addBtn("Add a package", "class-add"))))}

    ${card("span2", cardHead((isToday ? "Today's" : "That day's") + " sessions", addBtn("Log session", "session-add")) + dayNav("workout") + (daySessions.length ? `
      <ul class="session-list">${daySessions.map(sessionCard).join("")}</ul>`
      : emptyMsg("activity", "No sessions logged for this day — check a plan item or log one, and attach a photo/video of your progress.", addBtn("Log a session", "session-add"))))}

    ${exerciseNames().length ? card("span2", cardHead("Exercises & personal records") + `
      <ul class="ex-pr-list">
        ${exerciseNames().map(name => {
          const kind = exerciseKind(name);
          const rows = exerciseSessionBest(name, kind).slice(-12);
          const chartData = rows.map(r => ({ label: +r.date.slice(-2), value: r.value, tip: `${niceDate(r.date)} · ${prLabel(kind, r.value, name)}` }));
          return `<li data-action="ex-history" data-name="${esc(name)}">
            <div class="ex-pr-head"><b>${esc(name)}</b><span class="pr-badge">${I.trophy} PR ${prLabel(kind, prPrimary(name, kind), name)}</span></div>
            ${chartData.length ? `<div data-chart-type="bar" data-chart='${esc(JSON.stringify(chartData))}' data-color="#f76b15" data-h="86" data-label="${esc(name)} progress"></div>` : `<p class="soft small">Log a set to start tracking.</p>`}
          </li>`;
        }).join("")}
      </ul>
      <p class="chart-note">${I.chart} Tap an exercise for its full history. Bars show your best set per session.</p>`) : ""}

    ${coachNotebookCard()}
  </div>`;
}

function openExerciseHistory(name) {
  const kind = exerciseKind(name);
  const rows = exerciseSessionBest(name, kind);
  const chartData = rows.map(r => ({ label: +r.date.slice(-2), value: r.value, tip: `${niceDate(r.date)} · ${prLabel(kind, r.value, name)}` }));
  openModal(`
    <header class="modal-head"><h3>${esc(name)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <div class="pill-row"><span class="pr-badge">${I.trophy} Best ${prLabel(kind, prPrimary(name, kind), name)}</span><span class="soft small">${rows.length} session${rows.length !== 1 ? "s" : ""} logged</span></div>
      ${chartData.length ? `<div data-chart-type="bar" data-chart='${esc(JSON.stringify(chartData))}' data-color="#f76b15" data-h="150" data-label="${esc(name)} progress"></div>` : `<p class="soft">No sets logged yet.</p>`}
      <div class="fld"><span>Session history</span>
        <ul class="ex-hist-list">
          ${state.workout.sessions.filter(s => (s.exercises || []).some(e => e.name === name)).sort((a, b) => b.date < a.date ? -1 : 1).map(s => {
            const ex = s.exercises.find(e => e.name === name);
            return `<li><b>${niceDate(s.date, { month: "short", day: "numeric", year: "numeric" })}</b> <span class="set-wrap">${(ex.sets || []).map(set => `<span class="set-chip">${setLabel(ex, set)}</span>`).join("")}</span></li>`;
          }).join("")}
        </ul>
      </div>
    </div>`);
  drawCharts();
}

/* ---------- nutrition ---------- */
function macroBar(label, value, goal, color) {
  const pct = goal ? 100 * value / goal : 0;
  return `<div class="macro-bar">
    <div class="macro-top"><span>${label}</span><b>${Math.round(value)}<small> / ${goal} g</small></b></div>
    ${barHtml(pct, color)}
  </div>`;
}
function vNutrition() {
  const t = dayCursor("nutrition"), isToday = t === todayIso();
  const g = state.nutrition.goals, tot = nutritionOn(t);
  const checked = state.nutrition.log[t] || {};
  const kcalPct = g.kcal ? Math.round(100 * tot.kcal / g.kcal) : 0;
  const meals = [...state.nutrition.meals].sort((a, b) => (a.time || "99") < (b.time || "99") ? -1 : 1);
  const sups = state.nutrition.supplements;
  const dueCount = sups.filter(s => supStatus(s).due).length;
  return `
  <div class="grid">
    ${card("span2 daynav-card", dayNav("nutrition"))}
    ${card("", `
      <div class="goal-row">
        <div><p class="soft">Calories ${isToday ? "today" : "that day"}</p><h3>${tot.kcal.toLocaleString()} / ${g.kcal.toLocaleString()}</h3><small class="soft">kcal · ${kcalPct}%</small></div>
        <span class="big-ic" style="--a:#30a46c">${I.apple}</span>
      </div>
      ${barHtml(kcalPct, "#30a46c")}
      <div class="pill-row" style="margin-top:12px"><button class="btn ghost" data-action="nutrition-goals">${I.sliders}Edit goals</button></div>`)}
    ${card("", cardHead("Macros " + (isToday ? "today" : "that day")) + `<div class="macro-bars">
      ${macroBar("Protein", tot.protein, g.protein, "#e5484d")}
      ${macroBar("Carbs", tot.carbs, g.carbs, "#f5a623")}
      ${macroBar("Fats", tot.fats, g.fats, "#7c66dc")}
      ${macroBar("Fiber", tot.fiber, g.fiber, "#30a46c")}
    </div>`)}
    ${card("span2", cardHead("Meal schedule", addBtn("Add meal", "meal-add")) + (meals.length ? `
      <ul class="meal-sched">
        ${meals.map(m => {
          const done = !!checked[m.id];
          const photos = mealPhotos(t, m.id);
          return `<li class="meal-item ${done ? "done" : ""}">
            <span class="meal-time">${m.time ? esc(m.time) : "—"}</span>
            <button class="checkbox" data-action="meal-toggle" data-id="${m.id}" aria-label="Mark ${esc(m.name)} eaten">${I.check}</button>
            <div class="meal-main">
              <div class="meal-head">
                <b>${esc(m.slot)}</b>
                <span class="meal-actions">
                  <button class="icon-btn ghost" data-action="meal-edit" data-id="${m.id}" aria-label="Edit meal">${I.edit}</button>
                  <button class="icon-btn ghost" data-action="meal-del" data-id="${m.id}" aria-label="Delete meal">${I.trash}</button>
                </span>
              </div>
              <small class="soft">${esc(m.name)}</small>
              <div class="meal-macros">
                <span class="mm kcal">${m.kcal} kcal</span>
                <span class="mm">${m.protein}P</span><span class="mm">${m.carbs}C</span><span class="mm">${m.fats}F</span>${m.fiber ? `<span class="mm">${m.fiber}Fi</span>` : ""}
              </div>
              <div class="meal-photos">
                ${photos.map(p => `<span class="meal-photo">
                  <span class="media-host" data-media="${p.id}" data-media-kind="${p.kind}"><span class="media-missing">…</span></span>
                  <button class="photo-x" data-action="meal-photo-del" data-id="${m.id}" data-ref="${p.id}" aria-label="Remove photo">${I.x}</button>
                </span>`).join("")}
                <label class="meal-photo-add" aria-label="Add a photo of this meal">
                  <input type="file" accept="image/*" data-change="meal-photo-add" data-id="${m.id}" hidden>
                  <span>${I.camera || I.upload}</span>
                </label>
              </div>
            </div>
          </li>`;
        }).join("")}
      </ul>` : emptyMsg("apple", "Plan your meals for the day.", addBtn("Add a meal", "meal-add"))))}
    ${card("span2", cardHead(`Supplements${dueCount ? ` · ${dueCount} due` : ""}`, addBtn("Add", "sup-add")) + (sups.length ? `
      <ul class="sup-list">
        ${sups.map(s => {
          const st = supStatus(s);
          const status = st.due
            ? `<span class="sup-due">Due now</span>`
            : `<span class="sup-next">in ${st.nextInDays} day${st.nextInDays === 1 ? "" : "s"}</span>`;
          return `<li class="sup-item ${st.due ? "due" : "taken"}">
            <span class="sup-emoji" aria-hidden="true">${esc(s.emoji || "💊")}</span>
            <div class="row-txt"><b>${esc(s.name)}</b><small>${esc(s.dose || "")}${s.dose ? " · " : ""}${SUP_LABEL[s.every] || "daily"}</small></div>
            ${status}
            ${st.due
              ? `<button class="btn tiny good" data-action="sup-take" data-id="${s.id}">${I.check}Take</button>`
              : `<button class="btn tiny ghost" data-action="sup-undo" data-id="${s.id}" aria-label="Undo">${I.rotate || ""}Undo</button>`}
            <button class="icon-btn ghost" data-action="sup-edit" data-id="${s.id}" aria-label="Edit supplement">${I.edit}</button>
            <button class="icon-btn ghost" data-action="sup-del" data-id="${s.id}" aria-label="Delete supplement">${I.trash}</button>
          </li>`;
        }).join("")}
      </ul>` : emptyMsg("apple", "Track vitamins & supplements with reminders.", addBtn("Add a supplement", "sup-add"))))}
  </div>`;
}

/* ---------- learning ---------- */
function skillsTrend() {
  const out = [];
  for (let i = 7; i >= 0; i--) {
    const monday = mondayOf(addDays(todayIso(), -i * 7));
    let mins = 0;
    let self = 0, uni = 0;
    for (let d = 0; d < 7; d++) { const x = addDays(monday, d); self += studyMins(x, "skills"); uni += studyMins(x, "university"); }
    mins = self + uni;
    const hrs = Math.round(mins / 6) / 10;
    const h = (m) => Math.round(m / 6) / 10;
    out.push({ label: i === 0 ? "This wk" : niceDate(monday, { month: "short", day: "numeric" }), value: hrs,
      tip: `Week of ${niceDate(monday)}: ${hrs}h · ${h(self)}h self-directed + ${h(uni)}h coursework` });
  }
  return out;
}

/* ===== Learning — "what am I learning?" =====
   Three thin pages (Skills & Education, University, Work Preparation) merged into one real one.
   The user's complaint was exact: a course was a name and a percentage, "nothing I can use". */
const COURSE_KINDS = [
  { id: "self",       label: "Self-directed", emoji: "🧑‍💻", hue: "#8e4ec6" },
  { id: "university", label: "University",    emoji: "🏛️", hue: "#3e63dd" },
  { id: "cert",       label: "Certification", emoji: "📜", hue: "#ad6f2d" },
];
const TASK_KINDS = [
  { id: "university", label: "Coursework", emoji: "🏛️", hue: "#3e63dd" },
  { id: "career",     label: "Career",     emoji: "💼", hue: "#ad6f2d" },
];
const courseKind = (c) => COURSE_KINDS.find(x => x.id === c.kind) || COURSE_KINDS[0];
const taskKind = (k) => TASK_KINDS.find(x => x.id === k.kind) || TASK_KINDS[0];
const coursesAll = () => (state.learning.courses = state.learning.courses || []);
const learnTasks = () => (state.learning.tasks = state.learning.tasks || []);
const courseById = (id) => coursesAll().find(c => c.id === id) || null;
const openCourses = () => coursesAll().filter(c => (c.progress || 0) < 100);

/* Minutes attributed to a specific course. The study ledger keeps the totals; this is a BREAKDOWN of
   the same minutes, not a second ledger, so it can only ever be a subset. Nothing was back-filled —
   before this shipped nothing recorded which course an hour belonged to, and guessing would be a
   lie in the one place a student would actually check. */
function courseMins(id) {
  let n = 0;
  Object.keys(state.study.log || {}).forEach(d => { n += +((state.study.log[d].courses || {})[id]) || 0; });
  return n;
}
const attributedMins = () => coursesAll().reduce((a, c) => a + courseMins(c.id), 0);

/* Weighted by credits where they exist, and it counts ONLY graded courses — an average that
   quietly includes ungraded ones is not an average of anything. It says how many it left out. */
function courseGpa() {
  const graded = coursesAll().filter(c => c.grade != null && c.grade !== "" && +c.gradeMax > 0);
  const ungraded = coursesAll().filter(c => c.kind === "university" && (c.grade == null || c.grade === "")).length;
  if (!graded.length) return null;
  let pts = 0, w = 0;
  graded.forEach(c => { const cr = Math.max(1, +c.credits || 1); pts += cr * (+c.grade / +c.gradeMax); w += cr; });
  const pct = pts / w;
  const maxes = [...new Set(graded.map(c => +c.gradeMax))];
  return { pct: Math.round(1000 * pct) / 10, n: graded.length, ungraded,
           /* only quote a scale when every graded course shares one */
           scale: maxes.length === 1 ? maxes[0] : null,
           onScale: maxes.length === 1 ? Math.round(10 * pct * maxes[0]) / 10 : null };
}
const learnOverdue = () => learnTasks().filter(k => !k.done && k.due && k.due < todayIso());
function nextDeadline() {
  return learnTasks().filter(k => !k.done && k.due).sort((a, b) => a.due.localeCompare(b.due))[0] || null;
}

function courseCard(c) {
  const kd = courseKind(c), mins = courseMins(c.id), done = (c.progress || 0) >= 100;
  return `<li class="lc ${done ? "done" : ""}" data-action="course-open" data-id="${c.id}" style="--a:${cssVar(kd.hue)}">
    <span class="lc-emoji" aria-hidden="true">${esc(c.emoji || kd.emoji)}</span>
    <span class="lc-body">
      <span class="lc-top"><b>${esc(c.name)}</b><b class="lc-pct">${c.progress || 0}%</b></span>
      ${barHtml(c.progress || 0, kd.hue)}
      <span class="lc-meta">
        <span class="lc-kind">${esc(kd.label)}</span>
        ${c.institution ? `<span>${esc(c.institution)}</span>` : ""}
        ${c.credits ? `<span>${c.credits} cr</span>` : ""}
        ${(c.grade != null && c.grade !== "") ? `<span class="lc-grade">${c.grade}/${c.gradeMax || 20}</span>` : ""}
        ${mins ? `<span>${I.clock}${estLabel(mins)}</span>` : ""}
      </span>
    </span>
    <span class="lc-go" aria-hidden="true">${I.chevR}</span>
  </li>`;
}

function vLearning() {
  const cur = dayCursor("learning"), curMonth = cur.slice(0, 7);
  const self = Object.keys(state.study.log).filter(d => d.startsWith(curMonth)).reduce((a, d) => a + studyMins(d, "skills"), 0);
  const uni = Object.keys(state.study.log).filter(d => d.startsWith(curMonth)).reduce((a, d) => a + studyMins(d, "university"), 0);
  const hrs = (m) => Math.round(m / 6) / 10;
  const target = state.learning.monthlyHours;
  const courses = [...coursesAll()].sort((a, b) => ((a.progress || 0) >= 100 ? 1 : 0) - ((b.progress || 0) >= 100 ? 1 : 0)
    || COURSE_KINDS.findIndex(k => k.id === a.kind) - COURSE_KINDS.findIndex(k => k.id === b.kind)
    || a.name.localeCompare(b.name));
  const tasks = [...learnTasks()].sort((a, b) => (a.done - b.done)
    || ((a.due || "9999") < (b.due || "9999") ? -1 : 1));
  const open = tasks.filter(k => !k.done);
  const gpa = courseGpa(), over = learnOverdue(), next = nextDeadline();
  const career = tasks.filter(k => k.kind === "career");
  const careerPct = career.length ? Math.round(100 * career.filter(k => k.done).length / career.length) : 0;

  return `
  <div class="grid">
    ${card("span2 daynav-card", dayNav("learning"))}

    ${card("span2 goals-hero learn-hero", `
      <p class="gh-q">What am I learning?</p>
      <div class="gh-row">
        <div class="gh-stat"><b>${hrs(self + uni)}h</b><small>this month</small></div>
        <div class="gh-stat"><b>${openCourses().length}</b><small>courses open</small></div>
        ${open.length ? `<div class="gh-stat"><b>${open.length}</b><small>deadline${open.length === 1 ? "" : "s"} open</small></div>` : ""}
        ${over.length ? `<div class="gh-stat err"><b>${over.length}</b><small>overdue</small></div>` : ""}
        ${gpa ? `<div class="gh-stat"><b>${gpa.scale ? gpa.onScale : gpa.pct + "%"}</b><small>${gpa.scale ? `of ${gpa.scale}` : "average"}</small></div>` : ""}
      </div>
      ${next ? `<p class="learn-next">${I.clock} Next: <b>${esc(next.title)}</b> · ${esc(daysUntil(next.due))}</p>` : ""}`)}

    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">Study time · this month</p><h3>${hrs(self)} / ${target} h self-directed</h3>
          ${barHtml(100 * hrs(self) / Math.max(1, target), "#8e4ec6")}
          <small class="soft study-total">${I.building} plus <b>${hrs(uni)} h</b> coursework · <b>${hrs(self + uni)} h</b> in total</small></div>
        <span class="big-ic" style="--a:#8e4ec6">${I.gradcap}</span>
      </div>
      <div class="pill-row" style="margin-top:14px">
        <button class="btn ghost" data-action="study-log" data-kind="skills" data-n="30">+30 min</button>
        <button class="btn ghost" data-action="study-log" data-kind="skills" data-n="60">+1 h</button>
        <button class="btn ghost" data-action="study-log" data-kind="university" data-n="60">+1 h coursework</button>
        <button class="btn ghost" data-action="learn-goal">${I.sliders}Goals</button>
      </div>`)}

    ${card("span2", cardHead("Study time · last 8 weeks") + `<div data-chart-type="bar" data-chart='${esc(JSON.stringify(skillsTrend()))}' data-color="#8e4ec6" data-label="Study hours per week"></div>`)}

    ${card("span2", cardHead(`Courses${courses.length ? ` <small class="soft">${courses.length}</small>` : ""}`, addBtn("New course", "course-add")) + (courses.length
      ? `<ul class="course-cards">${courses.map(courseCard).join("")}</ul>`
        + (gpa ? `<p class="soft note">${I.chart} Average <b>${gpa.scale ? `${gpa.onScale} of ${gpa.scale}` : `${gpa.pct}%`}</b> across ${gpa.n} graded course${gpa.n === 1 ? "" : "s"}${gpa.ungraded ? ` — ${gpa.ungraded} not graded yet, and not counted.` : "."}</p>` : "")
      : emptyMsg("gradcap", "Everything you're studying — a language, a university subject, a certification — in one place.", addBtn("Add a course", "course-add"))))}

    ${card("span2", cardHead(`Deadlines${open.length ? ` <small class="soft">${open.length}</small>` : ""}`, addBtn("Add", "learn-task-add")) + (tasks.length ? `
      <ul class="check-list">
        ${tasks.map(k => {
          const kd = taskKind(k);
          return `<li class="${k.done ? "done" : ""} ${!k.done && k.due && k.due < todayIso() ? "overdue" : ""}">
            <button class="checkbox" data-action="learn-task-toggle" data-id="${k.id}" aria-label="Toggle ${esc(k.title)}">${I.check}</button>
            <span class="row-txt"><b>${esc(k.title)}</b><small><span class="task-area" style="--a:${cssVar(kd.hue)}">${esc(k.tag || kd.label)}</span>${k.due ? ` · ${esc(niceDate(k.due))}` : ""}</small></span>
            ${dueMeta(k.due, k.done)}
            <button class="icon-btn ghost" data-action="learn-task-edit" data-id="${k.id}" aria-label="Edit">${I.edit}</button>
            <button class="icon-btn ghost" data-action="learn-task-del" data-id="${k.id}" aria-label="Delete">${I.trash}</button>
          </li>`;
        }).join("")}
      </ul>` : emptyMsg("building", "Assignments, exam dates, application deadlines — anything with a date on it.", addBtn("Add one", "learn-task-add"))))}

    ${career.length ? card("span2", cardHead("Career readiness") + `
      <div class="career-row">
        ${ring(careerPct, { size: 104, sw: 9, color: "#ad6f2d", center: careerPct + "%", sub: "ready", label: "career readiness" })}
        <p class="soft">${career.filter(k => k.done).length} of ${career.length} career items done. Resume, portfolio, applications and interview prep all live in the list above — tagged <b>Career</b>.</p>
      </div>`) : ""}

    ${card("span2", cardHead("How Learning works here") + `
      <p class="soft small">Self-directed study, university coursework and career prep used to be three separate pages with almost nothing in them. They're one area now — courses on top, everything with a date underneath.</p>
      <p class="soft note">${I.spark} <b>Hours per course</b> only count study you logged <i>against that course</i>. Time logged before this existed, or logged without naming one, is in your totals but not on any course — it was never recorded which course it belonged to, and LifeHub won't guess.</p>`)}
  </div>`;
}

function openCourseDetail(id) {
  const c = courseById(id);
  if (!c) { closeModal(); return; }
  const kd = courseKind(c), mins = courseMins(c.id);
  const done = (c.progress || 0) >= 100;
  const linked = learnTasks().filter(k => !k.done && normName(k.tag) === normName(c.name));
  return openModal(`
    <header class="modal-head"><h3>${esc(c.emoji || kd.emoji)} ${esc(c.name)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <div class="progress-line"><span>${esc(kd.label)}</span>${barHtml(c.progress || 0, kd.hue)}<b>${c.progress || 0}%</b></div>
      ${!done ? `<div class="pill-row">
        <button class="btn tiny" data-action="course-bump" data-id="${c.id}" data-n="5">+5%</button>
        <button class="btn tiny ghost" data-action="course-bump" data-id="${c.id}" data-n="-5">−5%</button>
        <button class="btn tiny good" data-action="course-done" data-id="${c.id}">${I.check}Finished</button>
      </div>` : `<div class="pill-row"><button class="btn tiny ghost" data-action="course-bump" data-id="${c.id}" data-n="-100">Reopen</button></div>`}

      ${(c.institution || c.instructor || c.start || c.targetEnd || c.credits) ? `<div class="fld"><span>Details</span>
        <p class="soft small">
          ${c.institution ? `<b>Where:</b> ${esc(c.institution)}<br>` : ""}
          ${c.instructor ? `<b>Who:</b> ${esc(c.instructor)}<br>` : ""}
          ${c.start || c.targetEnd ? `<b>When:</b> ${c.start ? esc(niceDate(c.start, { month: "short", day: "numeric", year: "numeric" })) : "—"} → ${c.targetEnd ? esc(niceDate(c.targetEnd, { month: "short", day: "numeric", year: "numeric" })) : "—"}<br>` : ""}
          ${c.credits ? `<b>Credits:</b> ${c.credits}` : ""}
        </p></div>` : ""}

      <div class="fld"><span>Grade</span>
        ${(c.grade != null && c.grade !== "") ? `<p class="soft small">${I.trophy} <b>${c.grade} / ${c.gradeMax || 20}</b>${c.credits ? ` · ${c.credits} credit${c.credits === 1 ? "" : "s"}, weighted into your average` : ""}.</p>`
          : `<p class="soft small">Not graded yet — so it isn't counted in your average. Add one from Edit when you have it.</p>`}
      </div>

      <div class="fld"><span>Time on this course</span>
        ${mins ? `<p class="soft small">${I.clock} <b>${estLabel(mins)}</b> logged against this course.</p>`
          : `<p class="soft small">Nothing logged against this course yet. Use <b>Log study</b> below and it starts counting — study logged without naming a course stays in your totals but not here.</p>`}
        <button class="btn tiny ghost" data-action="course-study" data-id="${c.id}">${I.plus}Log study</button>
      </div>

      ${linked.length ? `<div class="fld"><span>Open deadlines tagged "${esc(c.name)}"</span>
        <ul class="hist-log">${linked.map(k => `<li>
          <span class="hl-when">${esc(niceDate(k.due, { month: "short", day: "numeric" }))}</span>
          <span class="hl-what">${esc(k.title)}</span></li>`).join("")}</ul></div>` : ""}

      ${c.link ? `<div class="fld"><span>Materials</span><p class="soft small"><a href="${esc(safeUrl(c.link))}" target="_blank" rel="noopener">${esc(c.link)}</a></p></div>` : ""}
      ${c.notes ? `<div class="fld"><span>Notes</span><p class="soft small">${esc(c.notes)}</p></div>` : ""}
      ${relatedCard("course", c.id)}
      ${historyCard("course", c.id)}
      <div class="pill-row">
        <button class="btn ghost" data-action="course-edit" data-id="${c.id}">${I.edit}Edit</button>
        <button class="btn danger" data-action="course-del" data-id="${c.id}">${I.trash}Delete</button>
      </div>
    </div>`);
}

/* one place that reads the course form, so add and edit can never drift apart */
function courseFromForm(f) {
  const g = String(f.grade || "").trim();
  return {
    name: String(f.name || "").trim().slice(0, 90), emoji: f.emoji || "📘",
    kind: COURSE_KINDS.some(k => k.id === f.kind) ? f.kind : "self",
    category: (f.category || "").slice(0, 40),
    institution: (f.institution || "").slice(0, 60),
    instructor: (() => { const n = String(f.instructor || "").trim(); if (n) ensurePerson(n); return n.slice(0, 60); })(),
    start: f.start || "", targetEnd: f.targetEnd || "",
    credits: Math.max(0, +f.credits || 0),
    /* an empty grade must stay NULL, not become 0 — a zero is a mark, "not graded yet" is not */
    grade: g === "" ? null : +g,
    gradeMax: Math.max(1, +f.gradeMax || 20),
    progress: clamp(+f.progress || 0, 0, 100),
    link: (f.link || "").slice(0, 300), notes: (f.notes || "").slice(0, 400),
  };
}
function courseFormFields(c) {
  c = c || {};
  return `<div class="fld-row">${fld("Course", txt("name", "e.g. Linear Algebra", c.name || ""))}${fld("Emoji", txt("emoji", "📘", c.emoji || "📘", false))}</div>` +
    fld("What kind?", `<select name="kind">${COURSE_KINDS.map(k => `<option value="${k.id}" ${(c.kind || "self") === k.id ? "selected" : ""}>${k.emoji} ${k.label}</option>`).join("")}</select>`) +
    `<div class="fld-row">${
      fld("Where <small class=\"soft\">— optional</small>", txt("institution", "university, Coursera…", c.institution || "", false))}${
      fld("Who teaches it <small class=\"soft\">— optional</small>", `<input type="text" name="instructor" list="people-list" value="${esc(c.instructor || "")}" autocomplete="off">`)
    }</div>` + peopleDatalist() +
    `<div class="fld-row">${
      fld("Started <small class=\"soft\">— optional</small>", `<input type="date" name="start" value="${esc(c.start || "")}">`)}${
      fld("Ends <small class=\"soft\">— optional</small>", `<input type="date" name="targetEnd" value="${esc(c.targetEnd || "")}">`)
    }</div>` +
    `<div class="fld-row">${
      fld("Credits <small class=\"soft\">— optional</small>", `<input type="number" name="credits" min="0" step="1" value="${c.credits || ""}" inputmode="numeric">`)}${
      fld("Grade <small class=\"soft\">— optional</small>", `<input type="number" name="grade" min="0" step="any" value="${(c.grade == null ? "" : c.grade)}" inputmode="decimal">`)}${
      fld("out of", `<input type="number" name="gradeMax" min="1" step="any" value="${c.gradeMax || 20}" inputmode="decimal">`)
    }</div>` +
    `<p class="soft note">${I.spark} A grade only counts toward your average once you enter it — an average that quietly includes ungraded courses is an average of nothing.</p>` +
    fld("Progress %", `<input type="number" name="progress" min="0" max="100" value="${c.progress || 0}" inputmode="numeric">`) +
    fld("Link <small class=\"soft\">— optional</small>", txt("link", "https://…", c.link || "", false)) +
    fld("Notes", `<textarea name="notes" maxlength="400" placeholder="syllabus, what to revise…">${esc(c.notes || "")}</textarea>`);
}

function learnTaskFormFields(k) {
  k = k || {};
  return fld("What's due?", txt("title", "e.g. Calculus problem set 4", k.title || "")) +
    `<div class="fld-row">${
      fld("Kind", `<select name="kind">${TASK_KINDS.map(x => `<option value="${x.id}" ${(k.kind || "university") === x.id ? "selected" : ""}>${x.emoji} ${x.label}</option>`).join("")}</select>`)}${
      fld("Due", `<input type="date" name="due" value="${esc(k.due || todayIso())}">`)
    }</div>` +
    fld("Course or category <small class=\"soft\">— optional</small>",
      `<input type="text" name="tag" list="course-names" value="${esc(k.tag || "")}" placeholder="Linear Algebra / Resume" autocomplete="off">` +
      `<datalist id="course-names">${[...coursesAll().map(c => c.name), ...WORK_CATS].map(n => `<option value="${esc(n)}"></option>`).join("")}</datalist>`);
}

/* ---------- reading ---------- */
/* Memory time is emotional, not clerical: lead with distance ("3 years ago"), keep the exact date
   as a quiet second line. Deliberately no seasons — "three summers ago" reads beautifully but is
   wrong half the year and in the southern hemisphere. */
function memWhen(dateIso) {
  const days = Math.round((new Date(todayIso() + "T12:00:00") - new Date(dateIso + "T12:00:00")) / DAY_MS);
  let rel;
  if (days <= 0) rel = "today";
  else if (days === 1) rel = "yesterday";
  else if (days < 7) rel = `${days} days ago`;
  else if (days < 14) rel = "last week";
  else if (days < 35) rel = `${Math.round(days / 7)} weeks ago`;
  else if (days < 365) { const m = Math.max(1, Math.round(days / 30)); rel = m === 1 ? "last month" : `${m} months ago`; }
  else { const y = Math.floor(days / 365); rel = y === 1 ? "a year ago" : `${y} years ago`; }
  const exact = days < 35
    ? niceDate(dateIso, { weekday: "long", month: "long", day: "numeric" })
    : niceDate(dateIso, { month: "long", year: "numeric" });
  return { rel, exact, days };
}
/* group into a timeline so scrolling feels like moving back through your life */
function memGroups(list) {
  const thisYear = todayIso().slice(0, 4), thisMonth = todayIso().slice(0, 7);
  const buckets = new Map();
  list.forEach(m => {
    const y = m.date.slice(0, 4);
    const key = m.date.slice(0, 7) === thisMonth ? "This month"
      : y === thisYear ? niceDate(m.date, { month: "long" })
      : y;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(m);
  });
  return [...buckets.entries()];
}

function readingStats() {
  const books = state.reading.books;
  const done = books.filter(b => b.status === "done");
  const pages = books.reduce((a, b) => a + (b.page || 0), 0);
  const rated = done.filter(b => b.rating > 0);
  const avg = rated.length ? (rated.reduce((a, b) => a + b.rating, 0) / rated.length).toFixed(1) : "—";
  const t = todayIso();
  const today = pagesOn(t);
  const week = weekDates().reduce((a, d) => a + pagesOn(d), 0);
  /* consecutive days ending today (or yesterday, so an unread today doesn't look like a broken streak) */
  let streak = 0;
  for (let i = pagesOn(t) > 0 ? 0 : 1; i < 400; i++) { if (pagesOn(addDays(t, -i)) > 0) streak++; else break; }
  const logged = Object.keys(state.reading.log).filter(d => pagesOn(d) > 0);
  const avgDay = logged.length ? Math.round(logged.reduce((a, d) => a + pagesOn(d), 0) / logged.length) : 0;
  return { done: done.length, pages, avg, favs: books.filter(b => b.favorite).length, today, week, streak, avgDay };
}
function readingTrend() {
  const t = todayIso();
  return [...Array(14)].map((_, i) => {
    const d = addDays(t, i - 13), v = pagesOn(d);
    return { label: +d.slice(-2), value: v, tip: `${niceDate(d)} · ${v} page${v === 1 ? "" : "s"}` };
  });
}
/* ---------- search & autofill (Reading + Movies) ---------- */
let _searchResults = [];
async function searchBooks(q) {
  // primary: Google Books (keyless, CORS). fallback: Open Library (different host)
  try {
    const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12`);
    if (!r.ok) throw new Error("Google Books HTTP " + r.status);
    const j = await r.json();
    const items = (j.items || []).map(it => {
      const v = it.volumeInfo || {};
      let cover = (v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || "";
      cover = cover.replace(/^http:/, "https:");
      return {
        kind: "book", title: v.title || "Untitled", author: (v.authors || []).join(", ") || "Unknown",
        year: (v.publishedDate || "").slice(0, 4), pages: v.pageCount || 0,
        genre: (v.categories || [])[0] || "", blurb: (v.description || "").replace(/<[^>]+>/g, "").slice(0, 140),
        cover,
      };
    });
    if (items.length) return items;
    throw new Error("no Google Books results");
  } catch (e) {
    return await searchBooksOpenLibrary(q);
  }
}
async function searchBooksOpenLibrary(q) {
  const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=title,author_name,first_publish_year,number_of_pages_median,subject,cover_i`);
  if (!r.ok) throw new Error("Open Library HTTP " + r.status);
  const j = await r.json();
  return (j.docs || []).map(d => ({
    kind: "book", title: d.title || "Untitled", author: (d.author_name || []).join(", ") || "Unknown",
    year: d.first_publish_year ? String(d.first_publish_year) : "", pages: d.number_of_pages_median || 0,
    genre: (d.subject || [])[0] || "", blurb: "",
    cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : "",
  }));
}
/* TMDb accepts either a v3 API key (?api_key=) or a v4 read token (Authorization: Bearer, JWT-like "eyJ…") */
function tmdbRequest(path) {
  const key = (state.profile.tmdbKey || "").trim();
  const isBearer = /^eyJ/.test(key) || key.length > 100;
  const sep = path.includes("?") ? "&" : "?";
  const url = "https://api.themoviedb.org/3" + path + (isBearer ? "" : `${sep}api_key=${encodeURIComponent(key)}`);
  return fetch(url, isBearer ? { headers: { Authorization: "Bearer " + key } } : undefined);
}
async function tmdbJson(path) {
  const r = await tmdbRequest(path);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.status_message || ("TMDb HTTP " + r.status) + " — check your key");
  return j;
}
async function searchMovies(q) {
  const j = await tmdbJson(`/search/multi?query=${encodeURIComponent(q)}`);
  return (j.results || []).filter(x => x.media_type === "movie" || x.media_type === "tv").map(x => ({
    kind: "media", tmdbId: x.id, mediaType: x.media_type,
    title: x.title || x.name || "Untitled",
    year: ((x.release_date || x.first_air_date) || "").slice(0, 4),
    typeLabel: x.media_type === "tv" ? "Series" : "Movie",
    cover: x.poster_path ? `https://image.tmdb.org/t/p/w200${x.poster_path}` : "",
  }));
}
async function fetchMovieDetail(id, mediaType) {
  const d = await tmdbJson(`/${mediaType}/${id}?append_to_response=credits`);
  const crew = (d.credits && d.credits.crew) || [], cast = (d.credits && d.credits.cast) || [];
  return {
    type: mediaType === "tv" ? "Series" : "Movie",
    title: d.title || d.name || "Untitled",
    year: ((d.release_date || d.first_air_date) || "").slice(0, 4),
    genre: ((d.genres || [])[0] || {}).name || "",
    epTotal: mediaType === "tv" ? (d.number_of_episodes || 0) : 0,
    director: (crew.find(c => c.job === "Director") || {}).name || "",
    cast: cast.slice(0, 4).map(c => c.name).join(", "),
    blurb: (d.overview || "").slice(0, 140),
    poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : "",
  };
}
function createBookFromResult(r) {
  const b = { id: uid(), title: r.title, author: r.author || "Unknown", emoji: "📘", cover: r.cover || null,
    genre: r.genre || "", blurb: r.blurb || "", notes: "", recommenders: [], favorite: false,
    status: "current", pages: +r.pages || 0, page: 0, rating: 0, format: "physical", file: null, started: todayIso() };
  state.reading.books.push(b); save(); checkBadges(); return b.id;
}
function createMediaFromDetail(d) {
  const m = { id: uid(), title: d.title, type: d.type, status: "watchlist", rating: 0,
    emoji: d.type === "Series" ? "📺" : "🎬", cover: d.poster || null, genre: d.genre || "", year: d.year || "",
    blurb: d.blurb || "", notes: "", favorite: false, recommenders: [], director: d.director || "",
    cast: d.cast || "", season: 1, epsDone: 0, epTotal: d.epTotal || 0, started: "", finished: "" };
  state.media.push(m); save(); return m.id;
}
function openSearchPicker(kind) {
  const isMedia = kind === "media";
  if (isMedia && !state.profile.tmdbKey) {
    openModal(`<header class="modal-head"><h3>Search movies &amp; series</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
      <div class="modal-body"><p class="soft">Movie &amp; series search uses a free <b>TMDb API key</b>. Add it once in your profile and this works everywhere.</p>
      <button class="btn primary" data-action="go-tmdb-key">Add TMDb key in Profile</button></div>`);
    return;
  }
  _searchResults = [];
  openModal(`<header class="modal-head"><h3>Search ${isMedia ? "movies &amp; series" : "books"}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <form data-search-form="${kind}" class="search-bar">
        <input type="text" id="searchQ" placeholder="Type a ${isMedia ? "title" : "title or author"}…" autocomplete="off" aria-label="Search query">
        <button class="btn primary" type="submit">${I.search}Search</button>
      </form>
      <div id="searchResults" class="search-results"><p class="soft small">Search a title, pick a result, and every field fills in — then you review and save.</p></div>
    </div>`);
  setTimeout(() => { const q = $("#searchQ"); if (q) q.focus(); }, 40);
}
async function runSearch(kind) {
  const inp = $("#searchQ"), box = $("#searchResults");
  const q = inp && inp.value.trim();
  if (!q || !box) return;
  box.innerHTML = `<p class="soft small">Searching…</p>`;
  try {
    _searchResults = kind === "media" ? await searchMovies(q) : await searchBooks(q);
  } catch (e) {
    const detail = esc((e && e.message) || "network error");
    box.innerHTML = `<p class="soft small">Couldn't reach the ${kind === "media" ? "movie" : "book"} database.<br><b>${detail}</b><br><span style="opacity:.8">Tip: search works on the live site (${location.host || "GitHub Pages"}), not the private preview — those block outside lookups${kind === "media" ? ". For TMDb, use an <b>API Key (v3 auth)</b> or a v4 Read Token." : "."}</span></p>`;
    return;
  }
  if (!_searchResults.length) { box.innerHTML = `<p class="soft small">No matches — try a different spelling.</p>`; return; }
  box.innerHTML = _searchResults.map((r, i) => {
    const sub = r.kind === "media" ? [r.typeLabel, r.year].filter(Boolean).join(" · ") : [r.author, r.year].filter(Boolean).join(" · ");
    return `<button type="button" class="search-res" data-action="${kind}-pick" data-i="${i}">
      <span class="sr-cover" ${r.cover ? `style="background-image:url('${safeUrl(r.cover)}')"` : ""}>${r.cover ? "" : (r.kind === "media" ? "🎬" : "📘")}</span>
      <span class="sr-txt"><b>${esc(r.title)}</b><small>${esc(sub)}</small></span>
    </button>`;
  }).join("");
}
function bookCover(b, cls = "") {
  return b.cover
    ? `<span class="book-cover ${cls}" style="background-image:url('${safeUrl(b.cover)}')" role="img" aria-label="${esc(b.title)} cover"></span>`
    : `<span class="book-cover ${cls}" aria-hidden="true">${esc(b.emoji || "📘")}</span>`;
}
function starRow(b, action = "book-rate") {
  return `<div class="star-pick" role="group" aria-label="Rating">
    ${[1, 2, 3, 4, 5].map(r => `<button class="star ${b.rating >= r ? "on" : ""}" data-action="${action}" data-id="${b.id}" data-r="${r}" aria-label="${r} star${r > 1 ? "s" : ""}">★</button>`).join("")}
    ${b.rating ? `<button class="star clear" data-action="${action}" data-id="${b.id}" data-r="0" aria-label="Clear rating">✕</button>` : ""}
  </div>`;
}

/* ---------- gallery shared helpers (Reading + Movies) ---------- */
function nameColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 62% 52%)`;
}
function recInitials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0] || "")[0] || "?").toUpperCase() + (parts.length > 1 ? (parts[parts.length - 1][0] || "").toUpperCase() : "");
}
/* small static avatar row shown on cards (max 4 + overflow count) */
function recChips(list) {
  if (!list || !list.length) return "";
  const shown = list.slice(0, 4);
  const extra = list.length - shown.length;
  return `<div class="rec-row" aria-label="Recommended by ${esc(list.join(", "))}">
    ${shown.map(n => `<span class="rec-chip" style="--rc:${cssVar(nameColor(n))}" title="${esc(n)}">${esc(recInitials(n))}</span>`).join("")}
    ${extra > 0 ? `<span class="rec-more">+${extra}</span>` : ""}
  </div>`;
}
/* Books and films call them "recommenders", a memory calls them "who was there" — same list of
   humans, one resolver. Pass C turns these strings into real people shared with Social. */
function peopleListFor(kind, id) {
  if (kind === "memory") { const m = state.memories.find(x => x.id === id); if (!m) return null; m.people = m.people || []; return m.people; }
  const item = kind === "media" ? state.media.find(x => x.id === id) : state.reading.books.find(x => x.id === id);
  if (!item) return null;
  item.recommenders = item.recommenders || [];
  return item.recommenders;
}
function reopenDetail(kind, id) {
  if (kind === "memory") return openMemoryDetail(id);
  return (kind === "media" ? openMediaDetail : openBookDetail)(id);
}

/* native autocomplete over everyone Social already knows — the cheapest way to stop the same human
   being typed three slightly different ways */
function peopleDatalist() {
  const list = peopleAll();
  return list.length ? `<datalist id="people-list">${list.map(p => `<option value="${esc(p.name)}"></option>`).join("")}</datalist>` : "";
}
/* editable recommenders block for the detail modal */
function recEditor(kind, id, list) {
  return `<div class="rec-edit">
    <span class="rec-label">${I.heart}Recommended by</span>
    <div class="rec-chips">
      ${(list || []).map((n, i) => `<span class="rec-chip lg"><span class="rec-ava" style="--rc:${cssVar(nameColor(n))}">${esc(recInitials(n))}</span><em>${esc(n)}</em><button type="button" class="rec-x" data-action="rec-del" data-kind="${kind}" data-id="${id}" data-i="${i}" aria-label="Remove ${esc(n)}">${I.x}</button></span>`).join("") || `<small class="soft">No one yet.</small>`}
    </div>
    <form class="rec-add" data-submit="rec-add">
      <input type="hidden" name="kind" value="${kind}"><input type="hidden" name="id" value="${id}">
      <input type="text" name="name" placeholder="Add a name…" maxlength="24" aria-label="Person's name"
             list="people-list" autocomplete="off">
      <button class="btn tiny" type="submit">${I.plus}Add</button>
    </form>
    ${peopleDatalist()}
  </div>`;
}
function starsStatic(rating) {
  return rating ? `<span class="gc-stars" aria-label="${rating} of 5 stars">${"★".repeat(rating)}<span class="off">${"★".repeat(5 - rating)}</span></span>` : "";
}
/* the poster gallery card, reused by Reading and Movies */
function posterCard(o) {
  const cover = o.cover
    ? `<span class="gc-cover" style="background-image:url('${safeUrl(o.cover)}')" role="img" aria-label="${esc(o.title)} cover"></span>`
    : `<span class="gc-cover ph" aria-hidden="true">${esc(o.emoji || "📘")}</span>`;
  return `<button class="gallery-card" data-action="${o.action}" data-id="${o.id}" aria-label="Open ${esc(o.title)}">
    <span class="gc-poster">
      ${cover}
      ${o.favorite ? `<span class="gc-fav" aria-hidden="true">♥</span>` : ""}
      ${o.badge ? `<span class="gc-badge">${o.badge}</span>` : ""}
    </span>
    <span class="gc-body">
      <b class="gc-title">${esc(o.title)}</b>
      ${o.sub ? `<small class="gc-sub">${esc(o.sub)}</small>` : ""}
      ${starsStatic(o.rating)}
      ${o.blurb ? `<small class="gc-blurb">${esc(o.blurb)}</small>` : ""}
      ${recChips(o.recommenders)}
    </span>
  </button>`;
}

function vReading() {
  const st = readingStats();
  const tab = ui.readingTab;
  const tabs = [["current", "Reading"], ["wishlist", "Wishlist"], ["done", "Completed"]];
  const books = state.reading.books.filter(b => b.status === tab).sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
  return `
  <div class="grid">
    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">Reading goal</p><h3>${st.done} / ${state.reading.yearlyGoal} books this year</h3>${barHtml(100 * st.done / state.reading.yearlyGoal, "#0091ff")}</div>
        <span class="big-ic" style="--a:#0091ff">${I.book}</span>
      </div>
      <div class="read-stats">
        <div><b>${st.today}</b><small>pages today</small></div>
        <div><b>${st.week}</b><small>this week</small></div>
        <div><b>${st.streak}</b><small>day streak</small></div>
        <div><b>${st.pages.toLocaleString()}</b><small>pages total</small></div>
      </div>`)}

    ${card("span2", cardHead("Pages per day · last 14 days", `<button class="btn ghost tiny" data-nav="habits">Link a habit</button>`) + `
      <div data-chart-type="bar" data-chart='${esc(JSON.stringify(readingTrend()))}' data-color="#0091ff" data-h="150" data-label="Pages read per day"></div>
      <p class="chart-note">${I.book} ${st.avgDay ? `About <b>${st.avgDay}</b> pages on a day you read` : "Log pages on a book and they show up here"}${st.streak > 1 ? ` · <b>${st.streak}</b> days in a row` : ""}. A habit set to <b>Filled in by Reading</b> fills itself from this.</p>`)}
    ${card("span2", `
      <div class="tab-row">${tabs.map(([id, lbl]) => `<button class="tab ${tab === id ? "on" : ""}" data-action="reading-tab" data-id="${id}">${lbl}</button>`).join("")}
        <span class="spacer"></span>${addBtn("Add book", "book-add")}</div>
      ${books.length ? `<div class="gallery">
        ${books.map(b => {
          const pct = Math.round(100 * (b.page || 0) / (b.pages || 1));
          const badge = b.status === "current" ? `${pct}%` : b.status === "done" ? "✓ Read" : "Wishlist";
          return posterCard({
            id: b.id, action: "book-open", cover: b.cover, emoji: b.emoji || "📘",
            title: b.title, sub: [b.author, b.genre].filter(Boolean).join(" · "),
            rating: b.rating, blurb: b.blurb, favorite: b.favorite, badge,
            recommenders: b.recommenders,
          });
        }).join("")}
      </div>` : emptyMsg("book", tab === "done" ? "No finished books yet — the first one is the sweetest." : "Nothing here yet.", addBtn("Add a book", "book-add"))}`)}
  </div>`;
}

function openBookDetail(id) {
  const b = state.reading.books.find(x => x.id === id);
  if (!b) { closeModal(); return; }
  const pct = Math.round(100 * (b.page || 0) / (b.pages || 1));
  openModal(`
    <header class="modal-head"><h3>Book details</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body book-detail">
      <div class="bd-top">
        ${b.cover ? `<span class="bd-cover" style="background-image:url('${safeUrl(b.cover)}')" role="img" aria-label="${esc(b.title)} cover"></span>` : `<span class="bd-cover ph">${esc(b.emoji || "📘")}</span>`}
        <div class="bd-meta">
          <h3 class="bd-title">${esc(b.title)}</h3>
          <p class="soft">${esc(b.author || "")}</p>
          ${b.genre ? `<span class="chip-genre">${esc(b.genre)}</span>` : ""}
          ${starRow(b)}
          <button class="btn tiny ${b.favorite ? "fav-on" : "ghost"}" data-action="book-fav" data-id="${b.id}">${I.heart}${b.favorite ? "Favorite" : "Add favorite"}</button>
        </div>
      </div>
      <label class="cover-upload">
        <input type="file" accept="image/*" data-change="book-cover-pick" data-id="${b.id}" hidden>
        <span class="btn ghost slim">${I.upload}${b.cover ? "Change cover" : "Upload cover"}</span>
        ${b.cover ? `<button type="button" class="btn ghost slim" data-action="book-cover-clear" data-id="${b.id}">${I.trash}Remove</button>` : ""}
      </label>
      ${b.status === "current" ? `
        <div class="progress-line"><span>Page ${b.page || 0} / ${b.pages}</span>${barHtml(pct, "#0091ff")}<b>${pct}%</b></div>
        <div class="pill-row">
          <button class="btn tiny" data-action="book-page" data-id="${b.id}" data-d="-10">−10</button>
          <button class="btn tiny" data-action="book-page" data-id="${b.id}" data-d="10">+10</button>
          <button class="btn tiny" data-action="book-page" data-id="${b.id}" data-d="25">+25</button>
          <input class="num-input" type="number" min="0" max="${b.pages}" value="${b.page || 0}" data-change="book-page-set" data-id="${b.id}" aria-label="Set current page">
          <button class="btn tiny good" data-action="book-finish-d" data-id="${b.id}">Finish 🎉</button>
        </div>` : ""}
      ${b.status === "wishlist" ? `<button class="btn primary slim" data-action="book-start-d" data-id="${b.id}">${I.book}Start reading</button>` : ""}
      ${b.status === "done" ? `<p class="soft">${I.check} Finished${b.finished ? ` · ${niceDate(b.finished)}` : ""}</p><button class="btn ghost slim" data-action="book-reread" data-id="${b.id}">Read again</button>` : ""}
      <label class="fld"><span>Blurb <small class="soft">— one line for the gallery card</small></span><input type="text" data-change="book-blurb" data-id="${b.id}" placeholder="A short hook or synopsis…" maxlength="140" value="${esc(b.blurb || "")}"></label>
      <label class="fld"><span>Notes &amp; thoughts</span><textarea data-change="book-notes" data-id="${b.id}" placeholder="What did you think? Favorite quotes, takeaways…" maxlength="1200">${esc(b.notes || "")}</textarea></label>
      <div class="fld"><span>Format</span>
        <div class="seg">
          <button type="button" class="seg-btn ${b.format !== "digital" ? "on" : ""}" data-action="book-format" data-id="${b.id}" data-v="physical">${I.book}Physical</button>
          <button type="button" class="seg-btn ${b.format === "digital" ? "on" : ""}" data-action="book-format" data-id="${b.id}" data-v="digital">📱 Digital</button>
        </div>
      </div>
      ${b.format === "digital" ? `<div class="book-file">
        ${b.file
          ? `<a class="btn primary slim book-file-link" id="bookFileLink" target="_blank" rel="noopener" aria-label="Open ${esc(b.file.name || "file")}">${I.book}Open / continue reading</a>
             <div class="book-file-meta"><span class="soft small">📄 ${esc(b.file.name || "file")}</span><button class="btn tiny ghost" data-action="book-file-del" data-id="${b.id}">${I.trash}Remove file</button></div>
             <p class="soft note">Opens in your device's reader — PDFs preview here; iPhone offers Books/Files. The reader keeps its own place; the app tracks your page${b.page ? ` (currently ${b.page}${b.pages ? " / " + b.pages : ""})` : ""}.</p>`
          : `<label class="cover-upload"><input type="file" accept=".pdf,.epub,application/pdf,application/epub+zip" data-change="book-file-add" data-id="${b.id}" hidden><span class="btn ghost slim">${I.upload}Attach a PDF / EPUB</span></label>
             <p class="soft note">Optional — attach the file, then tap to open it on your device. Stored privately in this browser.</p>`}
      </div>` : ""}
      ${recEditor("book", b.id, b.recommenders)}
      <div class="pill-row">
        <button class="btn ghost" data-action="book-edit" data-id="${b.id}">${I.edit}Edit details</button>
        <button class="btn danger" data-action="book-del-d" data-id="${b.id}">${I.trash}Delete</button>
      </div>
    </div>`);
  if (b.format === "digital" && b.file) hydrateBookFile(b.file);
}
/* set the Open link's href to a blob URL up-front so tapping it is a real (iOS-safe) link, not an async click */
function hydrateBookFile(file) {
  const a = $("#bookFileLink");
  if (!a) return;
  const apply = (url) => {
    a.href = url;
    const isPdf = /pdf/i.test(file.type || "") || /\.pdf$/i.test(file.name || "");
    if (isPdf) a.removeAttribute("download"); else a.setAttribute("download", file.name || "book");
  };
  if (_urlCache[file.id]) { apply(_urlCache[file.id]); return; }
  mediaGet(file.id).then(blob => {
    if (!blob) { a.textContent = "File unavailable on this device"; a.classList.add("disabled"); return; }
    const url = URL.createObjectURL(blob); _urlCache[file.id] = url; apply(url);
  }).catch(() => {});
}

/* downscale an uploaded image to a data URL that's small enough for localStorage */
function processCover(file, cb, maxW = 240) {
  if (!file || !file.type.startsWith("image/")) { toast("Please choose an image file"); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      try { cb(c.toDataURL("image/jpeg", 0.72)); }
      catch { toast("Couldn't process that image"); }
    };
    img.onerror = () => toast("Couldn't read that image");
    img.src = reader.result;
  };
  reader.onerror = () => toast("Couldn't read that file");
  reader.readAsDataURL(file);
}

/* ---------- media ---------- */
function mediaSub(m) {
  const bits = [m.type];
  if (m.year) bits.push(m.year);
  if (m.genre) bits.push(m.genre);
  return bits.join(" · ");
}
function mediaStats() {
  const done = state.media.filter(m => m.status === "done");
  const rated = state.media.filter(m => m.rating > 0);
  const avg = rated.length ? (rated.reduce((a, m) => a + m.rating, 0) / rated.length).toFixed(1) : "—";
  return {
    watching: state.media.filter(m => m.status === "watching").length,
    done: done.length, avg, favs: state.media.filter(m => m.favorite).length,
  };
}
function vMedia() {
  const tab = ui.mediaTab;
  const tabs = [["watchlist", "Watchlist"], ["watching", "Watching"], ["done", "Completed"]];
  const items = state.media
    .filter(m => m.status === tab)
    .sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
  const st = mediaStats();
  return `
  <div class="grid">
    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">Movies &amp; series</p><h3>${st.done} completed${st.watching ? ` · ${st.watching} watching` : ""}</h3></div>
        <span class="big-ic" style="--a:#d6409f">${I.film}</span>
      </div>
      <div class="read-stats">
        <div><b>${st.watching}</b><small>watching now</small></div>
        <div><b>${st.avg}</b><small>avg rating</small></div>
        <div><b>${st.favs}</b><small>favorites</small></div>
      </div>`)}
    ${card("span2", `
      <div class="tab-row">${tabs.map(([id, lbl]) => `<button class="tab ${tab === id ? "on" : ""}" data-action="media-tab" data-id="${id}">${lbl}</button>`).join("")}
        <span class="spacer"></span>${addBtn("Add title", "media-add")}</div>
      ${items.length ? `<div class="gallery">
        ${items.map(m => {
          const isSeries = m.type === "Series";
          const pct = isSeries && m.epTotal ? Math.round(100 * (m.epsDone || 0) / m.epTotal) : 0;
          const badge = m.status === "done" ? "✓ Watched"
            : isSeries && m.epTotal ? `S${m.season || 1} · ${pct}%`
            : m.status === "watching" ? "Watching" : "Watchlist";
          return posterCard({
            id: m.id, action: "media-open", cover: m.cover, emoji: m.emoji || (isSeries ? "📺" : "🎬"),
            title: m.title, sub: mediaSub(m), rating: m.rating, blurb: m.blurb,
            favorite: m.favorite, badge, recommenders: m.recommenders,
          });
        }).join("")}
      </div>` : emptyMsg("film", "Nothing here — add something to watch.", addBtn("Add a title", "media-add"))}`)}
  </div>`;
}

function openMediaDetail(id) {
  const m = state.media.find(x => x.id === id);
  if (!m) { closeModal(); return; }
  const isSeries = m.type === "Series";
  const pct = isSeries && m.epTotal ? Math.round(100 * (m.epsDone || 0) / m.epTotal) : 0;
  openModal(`
    <header class="modal-head"><h3>${isSeries ? "Series" : "Movie"} details</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body book-detail">
      <div class="bd-top">
        ${m.cover ? `<span class="bd-cover" style="background-image:url('${safeUrl(m.cover)}')" role="img" aria-label="${esc(m.title)} cover"></span>` : `<span class="bd-cover ph">${esc(m.emoji || (isSeries ? "📺" : "🎬"))}</span>`}
        <div class="bd-meta">
          <h3 class="bd-title">${esc(m.title)}</h3>
          <p class="soft">${esc(mediaSub(m))}</p>
          ${m.director ? `<p class="soft">Dir. ${esc(m.director)}</p>` : ""}
          ${m.cast ? `<p class="soft cast">${esc(m.cast)}</p>` : ""}
          ${starRow(m, "media-rate")}
          <button class="btn tiny ${m.favorite ? "fav-on" : "ghost"}" data-action="media-fav" data-id="${m.id}">${I.heart}${m.favorite ? "Favorite" : "Add favorite"}</button>
        </div>
      </div>
      <label class="cover-upload">
        <input type="file" accept="image/*" data-change="media-cover-pick" data-id="${m.id}" hidden>
        <span class="btn ghost slim">${I.upload}${m.cover ? "Change poster" : "Upload poster"}</span>
        ${m.cover ? `<button type="button" class="btn ghost slim" data-action="media-cover-clear" data-id="${m.id}">${I.trash}Remove</button>` : ""}
      </label>
      ${isSeries ? `
        <div class="progress-line"><span>Season ${m.season || 1} · Episode ${m.epsDone || 0}${m.epTotal ? ` / ${m.epTotal}` : ""}</span>${m.epTotal ? barHtml(pct, "#d6409f") : ""}${m.epTotal ? `<b>${pct}%</b>` : ""}</div>
        <div class="pill-row">
          <button class="btn tiny" data-action="media-ep" data-id="${m.id}" data-d="-1">−1 ep</button>
          <button class="btn tiny good" data-action="media-ep" data-id="${m.id}" data-d="1">+1 ep</button>
          <input class="num-input" type="number" min="0" value="${m.epsDone || 0}" data-change="media-ep-set" data-id="${m.id}" aria-label="Episodes watched">
          <span class="soft ep-of">of</span>
          <input class="num-input" type="number" min="0" value="${m.epTotal || 0}" data-change="media-eptotal-set" data-id="${m.id}" aria-label="Total episodes">
        </div>` : ""}
      ${m.status === "watchlist" ? `<button class="btn primary slim" data-action="media-advance" data-id="${m.id}">${I.film}Start watching</button>` : ""}
      ${m.status === "watching" ? `<button class="btn good slim" data-action="media-advance" data-id="${m.id}">${I.check}Mark completed 🎉</button>` : ""}
      ${m.status === "done" ? `<p class="soft">${I.check} Completed${m.finished ? ` · ${niceDate(m.finished)}` : ""}</p><button class="btn ghost slim" data-action="media-rewatch" data-id="${m.id}">Watch again</button>` : ""}
      <label class="fld"><span>Blurb <small class="soft">— one line for the gallery card</small></span><input type="text" data-change="media-blurb" data-id="${m.id}" placeholder="A short hook or synopsis…" maxlength="140" value="${esc(m.blurb || "")}"></label>
      <label class="fld"><span>Review &amp; thoughts</span><textarea data-change="media-notes" data-id="${m.id}" placeholder="What did you think? Favorite scenes, takeaways…" maxlength="1200">${esc(m.notes || "")}</textarea></label>
      ${recEditor("media", m.id, m.recommenders)}
      <div class="pill-row">
        <button class="btn ghost" data-action="media-edit" data-id="${m.id}">${I.edit}Edit details</button>
        <button class="btn danger" data-action="media-del-d" data-id="${m.id}">${I.trash}Delete</button>
      </div>
    </div>`);
}

/* ---------- learning: deadlines & career prep helpers ---------- */
const WORK_CATS = ["Resume", "Portfolio", "Applications", "Interviews", "Networking", "Skills", "Other"];
function dueMeta(due, done) {
  if (!due || done) return "";
  const d = daysUntil(due);
  const overdue = due < todayIso();
  const soon = !overdue && due <= addDays(todayIso(), 3);
  return `<span class="due-tag ${overdue ? "over" : soon ? "soon" : ""}">${overdue ? "Overdue" : d}</span>`;
}

/* ---------- projects ---------- */
const PJ_HUE = "#12a594";

function projectCardBig(p) {
  const pp = projectProgress(p), pr = prio(p.priority), st = projectStatus(p), pace = projectPace(p);
  const worked = projectLastWorked(p.id), mins = projectFocusMins(p.id), next = nextMilestoneOf(p);
  const dl = p.deadline ? daysLeft(p.deadline) : null;
  return `<li class="gb pj" data-action="project-open" data-id="${p.id}" style="--a:${cssVar(pr.hue)}">
    <div class="gb-head">
      <span class="gb-emoji" aria-hidden="true">${esc(p.emoji || "\u{1F680}")}</span>
      <span class="gb-title">
        <b>${esc(p.name)}</b>
        ${p.purpose ? `<small>${esc(p.purpose)}</small>` : ""}
      </span>
      <span class="gb-prio">${pr.label}</span>
    </div>
    ${barHtml(pp.pct, PJ_HUE)}
    <div class="gb-nums">
      <b>${pp.pct}%</b>
      <span>${pp.tot ? `${pp.done} of ${pp.tot} milestones` : "set by hand"}</span>
      <span class="gb-status ${st.cls}">${esc(st.txt)}</span>
    </div>
    ${pace ? `<div class="gb-pace ${pace.cls}">
      <span class="gb-pace-bar"><i style="width:${pace.elapsed}%"></i></span>
      <span>${pace.elapsed}% of the time · ${pace.made}% of the work — ${esc(pace.txt)}</span>
    </div>` : ""}
    <p class="pj-next">${next ? `${I.target}<span>${esc(next)}</span>` : `<span class="soft">No next step set.</span>`}</p>
    <div class="gb-foot">
      <span>${worked ? `${I.clock}worked ${esc(agoLabel(worked))}` : `<i class="soft">not worked yet</i>`}</span>
      ${mins ? `<span>${I.spark}${estLabel(mins)} invested</span>` : ""}
      ${p.deadline ? `<span>${I.calendar}${esc(niceDate(p.deadline, { month: "short", day: "numeric" }))}${dl != null ? ` · ${dl < 0 ? `${-dl}d over` : `${dl}d left`}` : ""}</span>` : ""}
      ${(p.files || []).length ? `<span>${I.camera}${p.files.length} file${p.files.length > 1 ? "s" : ""}</span>` : ""}
      ${(p.tags || []).length ? `<span class="gb-tags">${p.tags.slice(0, 3).map(t => `<i>${esc(t)}</i>`).join("")}</span>` : ""}
    </div>
  </li>`;
}

function vProjects() {
  const all = state.projects || [];
  const live = liveProjects();
  const paused = all.filter(p => p.status === "Paused" && !projectDone(p));
  const done = all.filter(projectDone);
  const mins = live.reduce((n, p) => n + projectFocusMins(p.id), 0);
  const stale = live.filter(p => { const w = projectLastWorked(p.id); return !w || daysLeft(w) < -14; }).length;
  const over = live.filter(p => p.deadline && daysLeft(p.deadline) < 0).length;
  return `
  <div class="grid">
    ${card("span2 goals-hero pj-hero", `
      <p class="gh-q">What am I building?</p>
      <div class="gh-row">
        <div class="gh-stat"><b>${live.length}</b><small>in flight</small></div>
        <div class="gh-stat"><b>${done.length}</b><small>shipped</small></div>
        ${over ? `<div class="gh-stat err"><b>${over}</b><small>past deadline</small></div>` : ""}
        ${stale ? `<div class="gh-stat warn"><b>${stale}</b><small>untouched 2+ weeks</small></div>` : ""}
        ${mins ? `<div class="gh-stat"><b>${estLabel(mins)}</b><small>invested</small></div>` : ""}
      </div>`)}

    ${card("span2", cardHead(`In flight${live.length ? ` <small class="soft">${live.length}</small>` : ""}`,
      addBtn("New project", "project-add")) + (live.length
      ? `<ul class="goal-big">${live.map(projectCardBig).join("")}</ul>`
      : emptyMsg("rocket", "Nothing in flight. A goal says where you're going; a project is how it actually gets built.",
          addBtn("Start a project", "project-add"))))}

    ${paused.length ? card("span2", `<details class="done-wrap"><summary>${I.moon} Paused (${paused.length})</summary>
      <ul class="goal-big dim">${paused.map(projectCardBig).join("")}</ul>
      <p class="soft note">${I.check} A paused project keeps everything — its milestones, its files, every minute logged against it. It just stops competing for today.</p>
    </details>`) : ""}

    ${done.length ? card("span2", `<details class="done-wrap"><summary>${I.check} Shipped (${done.length})</summary>
      <ul class="project-list">${done.map(p => `<li data-action="project-open" data-id="${p.id}">
        <span class="row-emoji">${esc(p.emoji || "\u{1F680}")}</span>
        <span class="row-txt"><b>${esc(p.name)}</b><small>${projectFocusMins(p.id) ? `${estLabel(projectFocusMins(p.id))} invested` : "no time logged"}${(p.milestones || []).length ? ` · ${p.milestones.length} milestones` : ""}</small></span>
        <b class="pct">100%</b>
      </li>`).join("")}</ul>
    </details>`) : ""}

    ${card("span2", cardHead("How projects work here") + `
      <p class="soft small">A project is the work a goal gets built by. Give it <b>milestones</b> and its progress is counted from them — tick one and the bar moves, and there is no percentage to keep up to date by hand. Without milestones you set the percentage yourself.</p>
      <p class="soft note">${I.clock} <b>Time invested comes from focus sessions.</b> Start a timer on a task that names this project and the minutes land here on their own — nothing to log twice.</p>`)}
  </div>`;
}

function openProjectDetail(id) {
  const p = (state.projects || []).find(x => x.id === id);
  if (!p) { closeModal(); return; }
  const pp = projectProgress(p), st = projectStatus(p), pace = projectPace(p);
  const mins = projectFocusMins(p.id), sessions = projectSessions(p.id), worked = projectLastWorked(p.id);
  openModal(`
    <header class="modal-head"><h3>${esc(p.emoji || "\u{1F680}")} ${esc(p.name)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      ${p.purpose ? `<p class="habit-why">“${esc(p.purpose)}”</p>` : ""}
      <div class="progress-line">
        <span>${pp.tot ? `${pp.done}/${pp.tot} milestones` : `${pp.pct}% done`}</span>
        ${barHtml(pp.pct, PJ_HUE)}<b>${pp.pct}%</b>
      </div>
      <p class="soft small pj-status"><span class="gb-status ${st.cls}">${esc(st.txt)}</span>${(p.tags || []).length ? ` <span class="gb-tags">${p.tags.map(t => `<i>${esc(t)}</i>`).join("")}</span>` : ""}</p>

      ${!pp.tot ? `<div class="pill-row">
        <button class="btn tiny" data-action="project-bump" data-id="${p.id}" data-n="10">+10%</button>
        <button class="btn tiny ghost" data-action="project-bump" data-id="${p.id}" data-n="-10">−10%</button>
      </div>` : ""}

      <div class="fld"><span>Milestones${pp.tot ? " — progress is counted from these" : ""}</span>
        ${pp.tot ? `<ul class="ms-list">
          ${p.milestones.map(m => `<li class="${m.done ? "done" : ""}"><button class="checkbox sm" data-action="pms-toggle" data-p="${p.id}" data-m="${m.id}" aria-label="Toggle milestone">${I.check}</button><span>${esc(m.text)}</span><button class="icon-btn ghost" data-action="pms-del" data-p="${p.id}" data-m="${m.id}" aria-label="Delete milestone">${I.x}</button></li>`).join("")}
        </ul>` : `<p class="soft small">None yet — the percentage above is the one you set by hand. Add a milestone and the bar starts counting itself instead.</p>`}
        <button class="btn tiny ghost" data-action="pms-add" data-id="${p.id}">${I.plus}Add milestone</button>
        ${!pp.tot && p.nextMilestone ? `<p class="soft small">${I.target} Next step: ${esc(p.nextMilestone)}</p>` : ""}
      </div>

      <div class="fld"><span>Time invested</span>
        ${mins ? `<p class="soft small">${I.clock} <b>${estLabel(mins)}</b> across ${sessions} focus session${sessions > 1 ? "s" : ""}${worked ? ` · last worked ${esc(agoLabel(worked))}` : ""}${(() => { const af = projectAvgFocus(p.id); return af ? ` · focus ${af.avg}/5 over ${af.n} rated` : ""; })()}.</p>`
          : `<p class="soft small">No focus sessions have named this project yet. Start a timer on a task that serves it and the minutes land here on their own.</p>`}
        ${pace ? `<div class="gb-pace ${pace.cls}">
          <span class="gb-pace-bar"><i style="width:${pace.elapsed}%"></i></span>
          <span>${pace.elapsed}% of the time · ${pace.made}% of the work — ${esc(pace.txt)}</span>
        </div>` : `<p class="soft small">Give it a <b>start date</b> and a <b>deadline</b> and this can compare how much of the time has gone with how much is done. It won't guess without both.</p>`}
        ${sessions ? `<div data-chart-type="bar" data-chart='${esc(JSON.stringify(projectSessionsTrend(p.id)))}' data-color="${PJ_HUE}" data-h="110" data-label="Sessions per week"></div>` : ""}
        ${(() => {
          const v = milestoneVelocity(p);
          if (!v) return "";
          return `<p class="soft small">${I.target} A milestone about every <b>${v.every} day${v.every === 1 ? "" : "s"}</b> across ${v.dated} dated ticks${v.left ? ` — at that rate the last of the ${v.left} remaining lands around <b>${esc(niceDate(v.eta, { month: "short", day: "numeric" }))}</b>` : ""}.${v.partial ? " Older milestones aren't counted — nothing recorded when they were ticked." : ""}</p>`;
        })()}
      </div>

      <div class="fld"><span>Work sessions${sessions ? ` <small class="soft">${sessions}</small>` : ""}</span>
        ${sessions ? `<ul class="ws-list">${projectSessionRows(p.id).slice(0, 8).map(r => `<li class="ws${hasReflection(r) ? "" : " bare"}">
          <span class="ws-top">
            <b>${esc(niceDate(r.date, { month: "short", day: "numeric" }))}</b>
            <span class="ws-mins">${r.mins} min</span>
            ${r.focus ? `<span class="ws-rate" title="how focused">${"●".repeat(r.focus)}<i>${"●".repeat(5 - r.focus)}</i> ${esc(FOCUS_RATING[r.focus])}</span>` : ""}
          </span>
          ${r.outcome ? `<p class="ws-out">${esc(r.outcome)}</p>` : ""}
          ${r.obstacles ? `<p class="ws-obs">${I.x}${esc(r.obstacles)}</p>` : ""}
          ${r.next ? `<p class="ws-next">${I.target}${esc(r.next)}</p>` : ""}
          ${!hasReflection(r) ? `<p class="ws-out soft">${esc(r.title || "Focus session")}</p>` : ""}
        </li>`).join("")}</ul>
        ${sessions > 8 ? `<p class="soft small">${sessions - 8} older session${sessions - 8 === 1 ? "" : "s"} not shown.</p>` : ""}`
        : `<p class="soft small">Nothing logged yet. When you finish a focus session on this project you can note what got done, what got in the way and where to pick up — or skip it, and the minutes are still recorded.</p>`}
      </div>

      <div class="fld"><span>Files</span>
        <div class="mem-gallery">
          ${(p.files || []).map(f => `<span class="mem-shot">
            <span class="media-host" data-media="${f.id}" data-media-kind="${f.kind}"><span class="media-missing">…</span></span>
            <button class="photo-x" data-action="project-file-del" data-id="${p.id}" data-ref="${f.id}" aria-label="Remove file">${I.x}</button>
          </span>`).join("")}
          <label class="mem-add" aria-label="Add a photo or video to this project">
            <input type="file" accept="image/*,video/*" data-change="project-file-add" data-id="${p.id}" hidden>
            ${I.camera}<span>Add shot<br>or clip</span>
          </label>
        </div>
        <p class="soft small">Screenshots, mockups, a clip of it working. They sync encrypted with your account, like every other photo here.</p>
      </div>

      ${p.note ? `<div class="fld"><span>Notes</span><p class="soft small">${esc(p.note)}</p></div>` : ""}
      ${relatedCard("project", p.id)}
      ${historyCard("project", p.id)}
      <div class="pill-row">
        ${!projectDone(p) ? `<button class="btn good" data-action="project-done" data-id="${p.id}">${I.check}Mark shipped</button>` : ""}
        <button class="btn ghost" data-action="project-edit" data-id="${p.id}">${I.edit}Edit</button>
        <button class="btn danger" data-action="project-del" data-id="${p.id}">${I.trash}Delete</button>
      </div>
    </div>`);
  drawCharts();          // the sessions-per-week host is injected outside the render cycle
}

function projectFormFields(p) {
  p = p || {};
  return `<div class="fld-row">${fld("Name", txt("name", "e.g. Portfolio site", p.name || ""))}${fld("Emoji", txt("emoji", "\u{1F680}", p.emoji || "\u{1F680}", false))}</div>` +
    fld("Why does it exist? <small class=\"soft\">— optional</small>",
      txt("purpose", "the point of building this at all…", p.purpose || "", false)) +
    `<div class="fld-row">${
      fld("Status", `<select name="status">${["Planning", "In progress", "Paused", "Done"].map(v => `<option ${p.status === v ? "selected" : ""}>${v}</option>`).join("")}</select>`)}${
      fld("Priority", `<select name="priority">${Object.keys(PRIORITY).map(k => `<option value="${k}" ${(p.priority || "med") === k ? "selected" : ""}>${PRIORITY[k].label}</option>`).join("")}</select>`)
    }</div>` +
    `<div class="fld-row">${
      fld("Started on <small class=\"soft\">— optional</small>", `<input type="date" name="startedOn" value="${esc(p.startedOn || "")}">`)}${
      fld("Deadline <small class=\"soft\">— optional</small>", `<input type="date" name="deadline" value="${esc(p.deadline || "")}">`)
    }</div>` +
    `<p class="soft note">${I.spark} Fill in <b>both</b> dates and the project can compare how much of the time has gone against how much of the work is done. Leave either blank and it stays quiet rather than guessing.</p>` +
    fld("Next step <small class=\"soft\">— used until you add milestones</small>",
      txt("nextMilestone", "e.g. ship the migration", p.nextMilestone || "", false)) +
    fld("Tags <small class=\"soft\">— comma separated</small>", txt("tags", "code, side project", (p.tags || []).join(", "), false)) +
    fld("Notes", `<textarea name="note" maxlength="400" placeholder="What is it, and what's next?">${esc(p.note || "")}</textarea>`);
}

const curSelect = (sel, name = "cur") => `<select name="${name}">${CUR_CODES.map(c =>
  `<option value="${c}" ${(sel || defaultCur()) === c ? "selected" : ""}>${esc(CURRENCIES[c].name)} (${esc(CURRENCIES[c].sym)})</option>`).join("")}</select>`;
/* One block that renders a set of per-currency subtotals honestly: each on its own, plus a combined
   figure ONLY where the user has supplied a rate — always labelled with the rate and its date. */
function moneyTotal(sums, cls) {
  const combo = combinedTotal(sums);
  return `<span class="${cls || ""}">${moneyLine(sums)}</span>` +
    (combo ? `<small class="soft fx-note"> ≈ ${money(combo.amount, combo.cur)} <i>${esc(combo.note)}</i></small>`
      : curCount(sums) > 1 ? `<small class="soft fx-note"> Two currencies — set a rate in Profile to see one number.</small>` : "");
}

/* ---------- finance ---------- */
const EXPENSE_CATS = ["Food", "Health", "Fitness", "Subscriptions", "Transport", "Bills", "Shopping", "Fun", "Education", "Other"];
const INCOME_CATS = ["Salary", "Freelance", "Gift", "Refund", "Other"];
/* Per currency, never one merged number — see sumByCur(). */
function financeMonth(mk) {
  mk = mk || monthKey();
  const rows = state.finance.entries.filter(e => (e.date || "").slice(0, 7) === mk);
  const income = sumByCur(rows.filter(e => e.type === "income"), e => e.amount, e => e.cur);
  const expense = sumByCur(rows.filter(e => e.type !== "income"), e => e.amount, e => e.cur);
  const net = {};
  [...Object.keys(income), ...Object.keys(expense)].forEach(c => { net[c] = (income[c] || 0) - (expense[c] || 0); });
  return { income, expense, net, rows: rows.length };
}
/* A bar chart mixing dollars and toman would be a picture of nothing, so the trend shows ONE
   currency and names it. Anything spent in the other is reported separately rather than folded in. */
function financeTrend(cur) {
  const c = CURRENCIES[cur] ? cur : defaultCur();
  const out = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mk = d.toISOString().slice(0, 7);
    const exp = financeMonth(mk).expense[c] || 0;
    out.push({ label: d.toLocaleDateString(undefined, { month: "short" }), value: Math.round(exp), tip: `${d.toLocaleDateString(undefined, { month: "long" })}: ${money(exp, c)} spent` });
  }
  return out;
}
/* which currencies this person actually uses — drives whether the UI mentions them at all */
const usedCurrencies = () => Object.keys(sumByCur(state.finance.entries || [], e => 1, e => e.cur)).filter(Boolean);
function pendingClassSpend() {
  return (state.workout.classes || []).filter(c => !state.finance.importedClasses.includes(c.id) && (c.price || 0) > 0);
}
function vFinance() {
  const m = financeMonth();
  const entries = [...state.finance.entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 24);
  const pending = pendingClassSpend();
  const pendingTot = sumByCur(pending, c => (c.price || 0) * (1 + (c.renewals || 0)), c => c.cur);
  const trendCur = defaultCur(), others = usedCurrencies().filter(c => c !== trendCur);
  return `
  <div class="grid">
    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">This month · net</p><h3 class="${(m.net[defaultCur()] || 0) < 0 ? "neg" : "pos"}">${moneyLine(m.net)}</h3>${curCount(m.net) > 1 ? `<small class="soft">${esc((combinedTotal(m.net) || {}).note || "Two currencies — set a rate in Profile to see one number.")}</small>` : ""}</div>
        <span class="big-ic" style="--a:#2f9e6f">${I.wallet}</span>
      </div>
      <div class="read-stats">
        <div><b class="pos">${moneyLine(m.income)}</b><small>income</small></div>
        <div><b class="neg">${moneyLine(m.expense)}</b><small>spent</small></div>
        <div><b>${state.finance.entries.length}</b><small>entries</small></div>
      </div>
      <div class="pill-row" style="margin-top:12px">
        <button class="btn good" data-action="fin-income">${I.plus}Income</button>
        <button class="btn danger" data-action="fin-expense">${I.plus}Expense</button>
      </div>`)}

    ${card("span2", cardHead(`Spending · last 6 months <small class="soft">${esc(CURRENCIES[trendCur].name)}</small>`) + `<div data-chart-type="bar" data-chart='${esc(JSON.stringify(financeTrend(trendCur)))}' data-color="#2f9e6f" data-label="Monthly spending"></div>` +
      (others.length ? `<p class="soft small">${I.spark} You also spend in ${others.map(c => esc(CURRENCIES[c].name)).join(" and ")}. That isn't drawn here — two currencies on one axis would be a picture of nothing.</p>` : ""))}

    ${pending.length ? card("span2", cardHead("From your Workout classes") + `
      <p class="soft">You've got <b>${moneyLine(pendingTot)}</b> of class-package spend not yet in Finance.</p>
      <div class="pill-row"><button class="btn primary slim" data-action="fin-import-classes">${I.wallet}Import ${pending.length} class ${pending.length > 1 ? "packages" : "package"}</button></div>`) : ""}

    ${card("span2", cardHead("Recent activity", addBtn("Add", "fin-expense")) + (entries.length ? `
      <ul class="fin-list">
        ${entries.map(e => `<li>
          <span class="fin-ic ${e.type}">${e.type === "income" ? "↑" : "↓"}</span>
          <span class="row-txt"><b>${esc(e.category || (e.type === "income" ? "Income" : "Expense"))}</b><small>${e.note ? esc(e.note) + " · " : ""}${niceDate(e.date)}</small></span>
          <b class="fin-amt ${e.type === "income" ? "pos" : "neg"}">${e.type === "income" ? "+" : "−"}${money(e.amount, e.cur)}</b>
          <button class="icon-btn ghost" data-action="fin-edit" data-id="${e.id}" aria-label="Edit entry">${I.edit}</button>
          <button class="icon-btn ghost" data-action="fin-del" data-id="${e.id}" aria-label="Delete entry">${I.trash}</button>
        </li>`).join("")}
      </ul>` : emptyMsg("wallet", "Log income and expenses to see your money at a glance.", addBtn("Add an expense", "fin-expense"))))}
  </div>`;
}
function finEntryForm(type, presetAmount, presetNote, presetCat) {
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;
  formModal(type === "income" ? "Add income" : "Add expense",
    `<div class="fld-row">${fld("Amount", `<input type="number" name="amount" min="0" step="any" value="${presetAmount != null ? presetAmount : ""}" inputmode="decimal" required>`)}${fld("Currency", curSelect())}</div>` +
    `<div class="fld-row">${fld("Date", `<input type="date" name="date" value="${todayIso()}">`)}${fld("Category", `<select name="category">${cats.map(c => `<option ${presetCat === c ? "selected" : ""}>${c}</option>`).join("")}</select>`)}</div>` +
    fld("Note", txt("note", "optional", presetNote || "", false)) +
    `<input type="hidden" name="type" value="${type}">`, "fin-entry");
}

/* ---------- social ---------- */
/* one person as a tappable tile */
function personTile(p) {
  const n = daysSinceTouch(p);
  const cold = n !== null && n >= OUT_OF_TOUCH_DAYS;
  return `<button class="person" data-action="person-open" data-id="${p.id}" style="--rc:${cssVar(nameColor(p.name))}">
    <span class="person-ava">${p.emoji ? esc(p.emoji) : esc(recInitials(p.name))}</span>
    <b class="person-name">${esc(p.name)}</b>
    <small class="person-sub ${cold ? "cold" : ""}">${esc(p.relation || touchLabel(p))}</small>
  </button>`;
}

function vSocial() {
  const w = socialWeek();
  const people = peopleAll().slice().sort((a, b) => a.name.localeCompare(b.name));
  const cold = outOfTouch();
  const bdays = people.map(p => ({ p, d: nextBirthday(p) })).filter(x => x.d && x.d <= addDays(todayIso(), 45))
    .sort((a, b) => a.d < b.d ? -1 : 1);
  return `
  <div class="grid">
    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">This week</p><h3>${w.done} / ${w.target} connections</h3>${barHtml(100 * w.done / (w.target || 1), "#e93d82")}</div>
        <span class="big-ic" style="--a:#e93d82">${I.users}</span>
      </div>`)}

    ${card("span2", cardHead(`Your people <small class="soft">${people.length || ""}</small>`, addBtn("Add someone", "person-add")) + (people.length ? `
      <div class="people-grid">${people.map(personTile).join("")}</div>
      <p class="soft note">${I.heart} Everyone you name as “recommended by” on a book or film, or “who was there” on a memory, shows up here automatically — same person, one place.</p>`
      : emptyMsg("users", "The people who matter, in one place.", addBtn("Add someone", "person-add"))))}

    ${cold.length ? card("span2", cardHead("Been a while") + `
      <ul class="check-list">
        ${cold.slice(0, 6).map(({ p, n }) => `<li>
          <span class="rec-ava" style="--rc:${cssVar(nameColor(p.name))}">${p.emoji ? esc(p.emoji) : esc(recInitials(p.name))}</span>
          <span class="row-txt"><b>${esc(p.name)}</b><small>${esc(touchLabel(p))}${p.relation ? " · " + esc(p.relation) : ""}</small></span>
          <span class="pill-row">
            <button class="btn tiny" data-action="person-touch" data-id="${p.id}">${I.check}Caught up</button>
            <button class="icon-btn ghost" data-action="person-open" data-id="${p.id}" aria-label="Open ${esc(p.name)}">${I.chevR}</button>
          </span>
        </li>`).join("")}
      </ul>
      <p class="soft note">${I.clock} People you haven't logged a catch-up with in ${OUT_OF_TOUCH_DAYS}+ days. Only people you've actually logged once appear here — it won't nag you about someone you just met.</p>`) : ""}

    ${bdays.length ? card("span2", cardHead("Birthdays coming up") + `
      <ul class="check-list">
        ${bdays.map(({ p, d }) => `<li>
          <span class="row-emoji">🎂</span>
          <span class="row-txt"><b>${esc(p.name)}</b><small>${esc(niceDate(d, { month: "long", day: "numeric" }))}</small></span>
          <span class="a-when">${esc(daysUntil(d))}</span>
        </li>`).join("")}
      </ul>`) : ""}
    ${card("span2", cardHead("Connection goals", addBtn("Add goal", "social-add")) + (state.social.items.length ? `
      <ul class="check-list">
        ${state.social.items.map(itm => {
          const n = w.log[itm.id] || 0, hit = n >= itm.target;
          return `<li class="${hit ? "done" : ""}">
            <span class="row-emoji">${esc(itm.emoji)}</span>
            <span class="row-txt"><b>${esc(itm.title)}</b><small>${n} / ${itm.target} this week</small></span>
            <span class="pill-row">
              <button class="btn tiny" data-action="social-bump" data-id="${itm.id}">+1</button>
              <button class="icon-btn ghost" data-action="social-edit" data-id="${itm.id}" aria-label="Edit goal">${I.edit}</button>
              <button class="icon-btn ghost" data-action="social-del" data-id="${itm.id}" aria-label="Delete goal">${I.trash}</button>
            </span>
          </li>`;
        }).join("")}
      </ul>` : emptyMsg("users", "Relationships are the best investment.", addBtn("Add a goal", "social-add"))))}
  </div>`;
}

function openPersonDetail(id) {
  const p = personById(id);
  if (!p) { closeModal(); return; }
  const app = personAppearances(p);
  const bd = nextBirthday(p);
  const n = (p.touches || []).length;
  const line = (icon, items, kind, label) => items.length ? `
    <div class="fld"><span>${label}</span>
      <ul class="check-list tight">${items.map(x => `<li data-action="person-goto" data-kind="${kind}" data-id="${x.id}">
        <span class="row-emoji">${icon}</span><span class="row-txt"><b>${esc(x.title)}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</span>
        <span class="a-when">${I.chevR}</span>
      </li>`).join("")}</ul>
    </div>` : "";
  /* the header carries who they are; the line below carries the history — saying "no catch-up logged"
     in both places is noise, and joining empty fields gives you "— · " */
  const bits = [n ? "Last spoke " + touchLabel(p) : "No catch-ups logged yet"];
  if (n > 1) bits.push(`${n} logged`);
  if (bd) bits.push(`birthday ${niceDate(bd, { month: "long", day: "numeric" })} (${daysUntil(bd)})`);

  openModal(`
    <header class="modal-head">
      <div class="person-head">
        <span class="person-ava lg" style="--rc:${cssVar(nameColor(p.name))}">${p.emoji ? esc(p.emoji) : esc(recInitials(p.name))}</span>
        <div><h3>${esc(p.name)}</h3>
          ${p.relation ? `<p class="soft">${esc(p.relation)}</p>` : ""}</div>
      </div>
      <button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button>
    </header>
    <div class="modal-body">
      <div class="pill-row">
        <button class="btn primary" data-action="person-touch" data-id="${p.id}">${I.check}Caught up today</button>
      </div>
      <p class="soft note">${I.clock} ${esc(bits.join(" · "))}</p>
      ${p.note ? `<p class="mem-note">${esc(p.note)}</p>` : ""}
      ${(p.tags || []).length ? `<span class="j-tags">${p.tags.map(x => `<i>${esc(x)}</i>`).join("")}</span>` : ""}

      ${line("📸", app.memories.map(m => ({ id: m.id, title: m.title, sub: memWhen(m.date).rel })), "memory", "Memories you shared")}
      ${line("📚", app.books.map(b => ({ id: b.id, title: b.title, sub: b.author || "" })), "book", "Books they recommended")}
      ${line("🎬", app.media.map(m => ({ id: m.id, title: m.title, sub: m.type || "" })), "media", "Films &amp; series they recommended")}
      ${(!app.memories.length && !app.books.length && !app.media.length)
        ? `<p class="soft note">${I.heart} Name them on a memory or as who recommended a book, and it'll show up here.</p>` : ""}
      ${relatedCard("person", p.id, { label: "Also connected to" })}
      ${historyCard("person", p.id)}
    </div>
    <footer class="modal-foot">
      <button type="button" class="btn ghost" data-action="person-edit" data-id="${p.id}">${I.edit}Edit</button>
      <button type="button" class="btn danger" data-action="person-del" data-id="${p.id}">${I.trash}Delete</button>
    </footer>`);
}

function personFormFields(p) {
  p = p || {};
  return fld("Name", txt("name", "e.g. Mara", p.name || "")) +
    `<div class="fld-row">${fld("Emoji <small class=\"soft\">— optional</small>", txt("emoji", "🙂", p.emoji || "", false))}${fld("How you know them", txt("relation", "sister / colleague…", p.relation || "", false))}</div>` +
    `<div class="fld-row"><label class="fld"><span>Birthday</span><input type="date" name="birthday" value="${esc(p.birthday || "")}"></label>${fld("Tags", txt("tags", "family, uni", (p.tags || []).join(", "), false))}</div>` +
    fld("Note", `<textarea name="note" rows="2" maxlength="500" placeholder="Anything worth remembering…">${esc(p.note || "")}</textarea>`);
}

/* ---------- memories ---------- */
/* One memory, editorial treatment: the photo IS the subject, the title sits in serif over a scrim,
   and time is expressed as distance rather than a timestamp. */
function memoryCard(m, big) {
  const w = memWhen(m.date);
  const ph = (m.photos || [])[0];
  const more = (m.photos || []).length - 1;
  const vid = !!ph && ph.kind === "video";
  /* A video shows its captured poster frame. If there isn't a current one — an old clip, or a file
     the browser couldn't decode — the cover falls back to the same gradient a photo-less memory gets
     and quietly asks for a capture. It never falls back to the <video> itself: an unplayed inline
     video paints black on iOS, which is exactly the "broken app" look this is meant to avoid. */
  const poster = vid ? posterOf(ph) : "";
  const cover = ph ? (vid ? (poster ? { id: poster, kind: "image" } : null) : ph) : null;
  return `
  <article class="mem-card ${big ? "big" : ""} ${m.starred ? "starred" : ""}" style="--h:${cssVar(m.hue)}">
    <button class="mem-hit" data-action="memory-open" data-id="${m.id}" aria-label="Open ${esc(m.title)}"></button>
    <div class="mc-frame">
      ${cover ? `<span class="mc-photo" data-media="${cover.id}" data-media-kind="${cover.kind}"></span>`
              : `<span class="mc-blank"${vid ? ` data-poster-heal="${ph.id}"` : ""}><span class="mc-glyph">${esc(m.emoji || "📸")}</span></span>`}
      <span class="mc-scrim" aria-hidden="true"></span>
      ${vid ? `<span class="mc-play" aria-hidden="true">${I.play}</span>` : ""}
      <span class="mc-badges">
        ${m.starred ? `<span class="mc-star" title="Treasured">${I.star}</span>` : ""}
        ${more > 0 ? `<span class="mc-count">+${more}</span>` : ""}
      </span>
      ${ph ? `<span class="mc-feel" title="${esc(m.emoji)}">${esc(m.emoji || "📸")}</span>` : ""}
      <div class="mc-caption">
        <h3 class="mc-title">${esc(m.title)}</h3>
        <p class="mc-when"><b>${esc(w.rel)}</b><span>${esc(w.exact)}</span></p>
      </div>
    </div>
    ${(m.felt || (m.people || []).length || (m.tags || []).length) ? `<div class="mc-below">
      ${m.felt ? `<p class="mc-felt">“${esc(m.felt)}”</p>` : ""}
      <div class="mc-meta">
        ${(m.people || []).length ? recChips(m.people) : ""}
        ${(m.tags || []).length ? `<span class="mc-tags">${m.tags.slice(0, 3).map(t => `<i>${esc(t)}</i>`).join("")}</span>` : ""}
      </div>
    </div>` : ""}
  </article>`;
}

function vMemories() {
  const q = (ui.memorySearch || "").trim().toLowerCase();
  const all = [...state.memories].sort((a, b) => b.date < a.date ? -1 : 1);
  const matches = (m) => [m.title, m.note, m.felt, ...(m.tags || []), ...(m.people || [])].join(" ").toLowerCase().includes(q);
  const list = q ? all.filter(matches) : all;
  const treasured = q ? [] : all.filter(m => m.starred);
  const timeline = q ? [["Results", list]] : memGroups(all.filter(m => !m.starred));
  const md = todayIso().slice(5);
  const onThisDay = all.filter(m => m.date.slice(5) === md && m.date !== todayIso());
  const tags = [...new Set(all.flatMap(m => m.tags || []))].slice(0, 12);

  return `
  <div class="grid mem-page">
    ${card("span2 mem-head", `
      <div class="goal-row">
        <div>
          <p class="soft">${all.length} memor${all.length === 1 ? "y" : "ies"} kept${treasured.length ? ` · ${treasured.length} treasured` : ""}</p>
          <h3 class="mem-h">Moments worth keeping</h3>
        </div>
        ${addBtn("Add memory", "memory-add")}
      </div>
      ${all.length ? `<div class="search-bar" style="margin-top:14px">
        <input type="search" placeholder="Search a name, a feeling, a place…" value="${esc(ui.memorySearch || "")}" data-change="memory-search" aria-label="Search memories">
        ${q ? `<button class="btn ghost tiny" data-action="memory-search-clear">Clear</button>` : ""}
      </div>
      ${tags.length && !q ? `<div class="chip-row">${tags.map(x => `<button class="tag" data-action="memory-tag-filter" data-t="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : ""}` : ""}`)}

    ${onThisDay.length && !q ? card("span2 mem-otd", cardHead("On this day") + `
      <div class="mem-grid">${onThisDay.map(m => memoryCard(m)).join("")}</div>`) : ""}

    ${treasured.length ? `<section class="mem-section span2">
      <h2 class="mem-rule"><span>${I.star} Treasured</span></h2>
      <div class="mem-grid treasure">${treasured.map(m => memoryCard(m, true)).join("")}</div>
    </section>` : ""}

    ${list.length ? timeline.filter(([, items]) => items.length).map(([label, items]) => `
      <section class="mem-section span2">
        <h2 class="mem-rule"><span>${esc(label)}</span><small>${items.length}</small></h2>
        <div class="mem-grid">${items.map(m => memoryCard(m)).join("")}</div>
      </section>`).join("")
      : `<div class="span2">${q
          ? `<p class="soft small" style="padding:10px 2px">Nothing matches “${esc(q)}”.</p>`
          : emptyMsg("camera", "Collect moments, not things.", addBtn("Save your first memory", "memory-add"))}</div>`}
  </div>`;
}

/* A memory, full size — the photo leads, then how it felt, who was there, and the note. */
function openMemoryDetail(id) {
  const m = state.memories.find(x => x.id === id);
  if (!m) { closeModal(); return; }
  const w = memWhen(m.date);
  openModal(`
    <header class="modal-head mem-sheet-head">
      <div><h3 class="mem-sheet-title">${esc(m.title)}</h3>
        <p class="mem-sheet-when"><b>${esc(w.rel)}</b> · ${esc(w.exact)}</p></div>
      <button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button>
    </header>
    <div class="modal-body mem-sheet">
      <div class="mem-sheet-top">
        <button class="btn tiny ${m.starred ? "good" : "ghost"}" data-action="memory-star" data-id="${m.id}">${I.star}${m.starred ? "Treasured" : "Treasure this"}</button>
        <span class="mem-feel-big" title="how it felt">${esc(m.emoji || "📸")}</span>
      </div>

      ${m.felt ? `<p class="mem-felt-big">“${esc(m.felt)}”</p>` : ""}
      ${m.note ? `<p class="mem-note">${esc(m.note)}</p>` : ""}

      <div class="mem-gallery">
        ${(m.photos || []).map(ph => `<span class="mem-shot">
          <span class="media-host" data-media="${ph.id}" data-media-kind="${ph.kind}"><span class="media-missing">…</span></span>
          <button class="photo-x" data-action="memory-photo-del" data-id="${m.id}" data-ref="${ph.id}" aria-label="Remove photo">${I.x}</button>
        </span>`).join("")}
        <label class="mem-add" aria-label="Add a photo or video to this memory">
          <input type="file" accept="image/*,video/*" data-change="memory-photo-add" data-id="${m.id}" hidden>
          ${I.camera}<span>Add photo<br>or video</span>
        </label>
      </div>

      <div class="fld"><span>Who was there</span>${recEditor("memory", m.id, m.people || [])}</div>
      ${(m.tags || []).length ? `<span class="j-tags" style="margin-top:10px">${m.tags.map(x => `<i>${esc(x)}</i>`).join("")}</span>` : ""}
      <p class="soft note">${I.camera} Photos and videos <b>sync with your account</b>, encrypted — they'll appear on your other devices a moment after you add them. Clips over ${MEDIA_SYNC_MAX / 1024 / 1024}MB stay on this device (their cover still travels). Videos up to ${VIDEO_MAX_MB}MB, and media isn't part of the JSON export.</p>
    </div>
    <footer class="modal-foot">
      <button type="button" class="btn ghost" data-action="memory-edit" data-id="${m.id}">${I.edit}Edit</button>
      <button type="button" class="btn danger" data-action="memory-del" data-id="${m.id}">${I.trash}Delete</button>
    </footer>`);
}

/* ---------- journal ---------- */
function vJournal() {
  const d = dayCursor("journal"), isToday = d === todayIso();
  const entry = journalOn(d);
  const moods = ["😄", "🙂", "😌", "😐", "😔"];
  const past = state.journal.filter(j => j.date !== d && j.text).sort((a, b) => b.date < a.date ? -1 : 1).slice(0, 14);
  return `
  <div class="grid">
    ${card("span2 daynav-card", dayNav("journal"))}
    ${card("span2", cardHead(`${isToday ? "Today" : niceDate(d, { weekday: "long" })} · ${niceDate(d, { month: "long", day: "numeric" })}`) + `
      <textarea class="journal-input" id="journalText" placeholder="What's on your mind? A few honest lines beat a perfect page…">${esc(entry?.text || "")}</textarea>
      <div class="journal-foot">
        <span class="mood-row">${moods.map(m => `<button class="mood ${moodOn(d) === m ? "on" : ""}" data-action="journal-mood" data-m="${m}">${m}</button>`).join("")}</span>
        <span class="pill-row">
          ${["Grateful", "Happy", "Focused", "Tired"].map(tag => `<button class="tag ${entry?.tags?.includes(tag) ? "on" : ""}" data-action="journal-tag" data-tag="${tag}">${tag}</button>`).join("")}
        </span>
        ${entry && entry.text ? `<button class="btn ghost" data-action="journal-del" data-d="${d}">${I.trash}Delete</button>` : ""}
        <button class="btn primary" data-action="journal-save">${I.check}Save entry</button>
      </div>`)}
    ${past.length ? card("span2", cardHead("Earlier entries") + `
      <ul class="journal-list">
        ${past.map(j => `<li data-action="journal-open" data-d="${j.date}" class="j-open"><span class="j-date"><b>${niceDate(j.date)}</b>${moodOn(j.date) ? `<span>${moodOn(j.date)}</span>` : ""}</span><p>${esc(j.text)}</p>${j.tags?.length ? `<span class="j-tags">${j.tags.map(x => `<i>${esc(x)}</i>`).join("")}</span>` : ""}</li>`).join("")}
      </ul>`) : ""}
  </div>`;
}

/* ---------- progress ---------- */
function vProgress() {
  const days = [...Array(14)].map((_, i) => addDays(todayIso(), i - 13));
  const xpData = days.map(d => ({ label: +d.slice(-2), value: state.xpLog[d] || 0, tip: `${niceDate(d)} · ${state.xpLog[d] || 0} XP` }));
  const li = levelInfo();
  const missionsDone = MISSIONS.filter(m => m.done()).length;
  return `
  <div class="grid">
    ${card("", `
      <div class="totals">
        <div><b>${state.xp.toLocaleString()}</b><small>total XP</small></div>
        <div><b>${li.lvl}</b><small>level</small></div>
        <div><b>${perfectStreak()}</b><small>day streak</small></div>
        <div><b>${Object.keys(state.badges).length}/${BADGES.length}</b><small>badges</small></div>
      </div>`)}

    ${/* Missions moved here from the dashboard: they are a scoreboard, not a decision, and the
          dashboard is a decision page. The XP they award is unchanged — only the placement moved. */
      card("", cardHead(`Today's missions <small class="soft">${missionsDone}/${MISSIONS.length}</small>`) + `
      <ul class="mission-list">
        ${MISSIONS.map(m => {
          const a = areaOf(m.area), md = m.done();
          return `<li class="mission ${md ? "done" : ""}" data-nav="${m.area}" style="--a:${cssVar(a.hue)}">
            <span class="tile-ic">${I[a.icon]}</span>
            <span class="mission-txt"><b>${esc(m.title())}</b><small>${esc(m.sub())}</small></span>
            <span class="mission-check">${md ? I.check : `<i class="xp-tag">+${m.xp}</i>`}</span>
          </li>`;
        }).join("")}
      </ul>`)}
    ${card("", cardHead("Areas today") + `
      <ul class="area-progress">
        ${AREAS.slice(0, 8).map(a => {
          const p = areaProgressToday(a.id);
          return `<li data-nav="${a.id}"><span class="dot" style="background:${cssVar(a.hue)}"></span>${esc(a.name)}${barHtml(p, a.hue)}<b>${p}%</b></li>`;
        }).join("")}
      </ul>`)}
    ${card("span2", cardHead("XP earned · last 14 days") + `
      <div data-chart-type="bar" data-chart='${esc(JSON.stringify(xpData))}' data-color="var(--brand)" data-h="170" data-label="XP earned in the last 14 days"></div>`)}
    ${card("span2", cardHead("Habit consistency") + `
      <div data-chart-type="heatmap" data-weeks="16"></div>
      <p class="chart-note">Each cell is a day — darker means more habits completed. Hover for details.</p>`)}
  </div>`;
}

/* ---------- integrations ---------- */
function vIntegrations() {
  const live = [
    { emoji: "☁️", name: "Cloud sync", desc: "Your own encrypted Supabase project — free, end-to-end encrypted", on: isSignedIn(), hint: isSignedIn() ? "Signed in" : "Set it up in Profile", nav: "profile" },
    { emoji: "🖼️", name: "Photo & video sync", desc: "Your files follow your account, encrypted before they leave this device",
      on: isSignedIn(), hint: isSignedIn() ? mediaLabel() : "Needs an account", nav: "profile" },
    { emoji: "📚", name: "Book database", desc: "Search & autofill titles, covers, authors and page counts", on: true, hint: "No key needed", nav: "reading" },
    { emoji: "🎬", name: "Movie database (TMDb)", desc: "Search & autofill posters, cast, director and runtime", on: !!state.profile.tmdbKey, hint: state.profile.tmdbKey ? "Key added" : "Add a free key in Profile", nav: state.profile.tmdbKey ? "media" : "profile" },
    { emoji: "📲", name: "Install & offline", desc: "Add to your Home Screen — works with no connection", on: true, hint: "Built in" },
    { emoji: "🔔", name: "Reminders", desc: "Nudges while the app is open or in the background",
      on: (state.reminders || {}).enabled && notifyPermission() === "granted",
      hint: notifyPermission() === "denied" ? "Blocked in browser settings" : ((state.reminders || {}).enabled && notifyPermission() === "granted" ? "On" : "Turn on in Profile"), nav: "profile" },
    { emoji: "📣", name: "Reminders with the app closed", desc: "Scheduled web push — the one feature whose times and titles the server can read",
      on: pushOn(), hint: !VAPID_PUBLIC ? "Needs server setup" : (pushOn() ? "On" : "Turn on in Profile"), nav: "profile" },
  ];
  const planned = [
    ["📅", "Calendar", "Two-way sync for deadlines and time-blocking"],
    ["❤️", "Apple Health / Google Fit", "Pull steps and sleep instead of typing them"],

    ["📝", "Notion", "Mirror notes and tasks"],
  ];
  return `
  <div class="grid">
    ${card("span2", cardHead("What LifeHub connects to") + `
      <ul class="int-list">
        ${live.map(x => `
          <li ${x.nav ? `data-nav="${x.nav}"` : ""} ${x.nav ? 'style="cursor:pointer"' : ""}>
            <span class="int-logo">${x.emoji}</span>
            <span class="row-txt"><b>${esc(x.name)}</b><small>${esc(x.desc)}</small></span>
            <span class="int-state ${x.on ? "on" : ""}">${x.on ? I.check : ""}${esc(x.hint)}</span>
          </li>`).join("")}
      </ul>`)}

    ${card("span2", cardHead("Not built yet") + `
      <ul class="int-list muted">
        ${planned.map(([e, n, d]) => `
          <li><span class="int-logo">${e}</span><span class="row-txt"><b>${esc(n)}</b><small>${esc(d)}</small></span>
            <span class="int-state">soon</span></li>`).join("")}
      </ul>
      <p class="soft note">${I.zap} These are honest placeholders — nothing here is half-wired behind a switch. Each one needs that service's API, and reminders need a small server, so they'll arrive as real features rather than toggles.</p>`)}
  </div>`;
}

/* ================= reminders (stage 1 — local) ======================================================
   The honest scope, stated here and in the UI: with no push server the browser only runs this code
   while LifeHub is open or still alive in the background. That genuinely covers "I opened the app and
   something is overdue" and "a reminder time passed while it was up" — it is NOT a silent 8am alarm
   with the app fully closed. That needs Web Push (server + VAPID) and is a separate step. */
const NUDGE_KEY = "lifehub-nudges";   // per-DEVICE delivery log: what's been said today, never synced
let _nudgeTimer = null;

const remindersSupported = () => typeof Notification !== "undefined" && "serviceWorker" in navigator;
const notifyPermission = () => remindersSupported() ? Notification.permission : "unsupported";
const pad2 = (n) => String(n).padStart(2, "0");
const nowHM = () => { const d = new Date(); return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); };

function nudgeLog() {
  try { const r = JSON.parse(localStorage.getItem(NUDGE_KEY) || "{}");
    return r && r.date === todayIso() ? { date: r.date, sent: r.sent || {} } : { date: todayIso(), sent: {} };
  } catch { return { date: todayIso(), sent: {} }; }
}
const alreadyNudged = (key) => !!nudgeLog().sent[key];
function markNudged(key) {
  const l = nudgeLog(); l.sent[key] = Date.now();
  try { localStorage.setItem(NUDGE_KEY, JSON.stringify(l)); } catch {}
}

/* Everything worth a nudge right now. Pure: reads state + the clock, writes nothing — so the whole
   decision layer can be asserted directly without any notification plumbing in the way. */
function dueNudges(now) {
  now = now || nowHM();
  const r = (state && state.reminders) || {};
  if (!r.enabled) return [];
  if (r.quietFrom && now >= r.quietFrom) return [];      // don't buzz someone at midnight
  const t = todayIso(), k = r.kinds || {}, out = [];
  const late = !r.after || now >= r.after;

  if (k.supplements) state.nutrition.supplements.filter(s => supStatus(s).due).forEach(s =>
    out.push({ key: `sup:${s.id}:${t}`, title: `${s.name} is due`,
      body: s.dose ? `${s.dose} · ${SUP_LABEL[s.every] || "daily"}` : "Tap to mark it taken", nav: "nutrition" }));

  if (k.deadlines) {
    learnTasks().filter(x => !x.done && x.due === t).forEach(x =>
      out.push({ key: `learn:${x.id}:${t}`, title: "Due today", body: x.title + (x.tag ? ` \u00b7 ${x.tag}` : ""), nav: "learning" }));
  }

  if (k.tasks) state.todos.filter(x => !x.done && x.date === t && x.time && now >= x.time).forEach(x =>
    out.push({ key: `task:${x.id}:${t}`, title: x.text, body: `You planned this for ${x.time}`, nav: "dashboard" }));

  /* a habit with its own time fires on the clock; everything else waits for the nudge hour */
  state.habits.filter(h => h.remindAt && now >= h.remindAt && isScheduled(h, t) && !isSkipped(h, t) && !habitMet(h, t))
    .forEach(h => out.push({ key: `habit:${h.id}:${t}`, title: `${h.emoji} ${h.name}`, body: h.why || "Time for this one", nav: "habits" }));

  if (late && k.habits) {
    /* one summary, not one buzz per habit */
    const open = state.habits.filter(h => !h.remindAt && isScheduled(h, t) && !isSkipped(h, t) && !habitMet(h, t));
    if (open.length) out.push({ key: `habits:${t}`,
      title: open.length === 1 ? `${open[0].emoji} ${open[0].name} is still open` : `${open.length} habits still open`,
      body: open.slice(0, 3).map(h => h.name).join(" · ") + (open.length > 3 ? " …" : ""), nav: "habits" });
  }
  if (late && k.streak) {
    const s = perfectStreak();
    if (s >= 3 && !isPerfectDay(t)) out.push({ key: `streak:${t}`, title: `Your ${s}-day streak needs today`,
      body: "One more day keeps the flame alive.", nav: "habits" });
  }
  return out;
}

async function sendNudge(n) {
  if (notifyPermission() !== "granted") return false;
  const opts = { body: n.body, tag: n.key, icon: "./icon-192.png", badge: "./icon-192.png", data: { nav: n.nav || "" } };
  try {
    /* iOS only delivers notifications shown by the service worker, so prefer it and fall back */
    const reg = navigator.serviceWorker.getRegistration ? await navigator.serviceWorker.getRegistration() : null;
    if (reg && reg.showNotification) { await reg.showNotification(n.title, opts); return true; }
    new Notification(n.title, opts);
    return true;
  } catch { return false; }
}

/* Never carpet-bomb: a wall of notifications is one you swipe away forever. The cap is a moving
   WINDOW rather than a per-call limit, because several triggers can land at once — coming back to
   the tab fires both `visibilitychange` and `focus` — and a per-call cap would let each of them
   spend its own budget. Anything held back simply goes out on a later tick. */
const NUDGE_BURST = 3;
const NUDGE_WINDOW = 60000;
/* `now` is injectable purely so the delivery path can be driven at a chosen time of day in tests —
   in the app it is always the real clock. */
async function tickReminders(now) {
  if (!state || !(state.reminders || {}).enabled || notifyPermission() !== "granted") return 0;
  const t0 = Date.now();
  let budget = NUDGE_BURST - Object.values(nudgeLog().sent).filter(ts => t0 - ts < NUDGE_WINDOW).length;
  let sent = 0;
  for (const n of dueNudges(now)) {
    if (budget <= 0) break;
    if (alreadyNudged(n.key)) continue;
    if (await sendNudge(n)) { markNudged(n.key); sent++; budget--; }
  }
  return sent;
}
function startReminders() {
  clearInterval(_nudgeTimer); _nudgeTimer = null;
  if (!state || !(state.reminders || {}).enabled) return;
  tickReminders();
  _nudgeTimer = setInterval(tickReminders, 60000);   // catches a reminder time passing while open
}
async function enableReminders() {
  if (!remindersSupported()) { toast("This browser can't show reminders"); return; }
  let perm = Notification.permission;
  if (perm === "default") { try { perm = await Notification.requestPermission(); } catch { perm = "denied"; } }
  if (perm !== "granted") {
    state.reminders.enabled = false; save(); render();
    toast("Reminders are blocked — allow notifications for this site in your browser settings");
    return;
  }
  state.reminders.enabled = true; save(); render(); startReminders();
  toast("Reminders on 🔔");
}

/* ================= push: reminders with the app fully closed ========================================
   Everything else in LifeHub is encrypted before it leaves the device. This is the one exception, and
   it is deliberate, opt-in and narrow: a server cannot wake your phone at 8am without knowing that it
   should, and it cannot say anything useful without knowing what to say. So the REMINDER SCHEDULE —
   times, weekdays and the short titles you see on the lock screen — is stored readable. Habit logs,
   journal, health, finances, memories and photos remain ciphertext the server has no key for.

   The second honest limit: a schedule is not a state check. The server cannot know whether you have
   already taken your vitamins, so closed-app pushes fire ON TIME rather than only when something is
   genuinely outstanding. The conditional nudges ("3 habits still open") stay app-open. Both facts are
   stated on the card, not buried here. */
const pushSupported = () => !!VAPID_PUBLIC && "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
const pushOn = () => !!(state.reminders && state.reminders.push);

function urlB64ToU8(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

/* What this device will be pinged about. Derived from settings you already made — a habit's own
   reminder time, and the evening nudge hour — so there is no second place to configure. */
function pushSchedule() {
  const r = state.reminders || {}, rows = [];
  const tz = -new Date().getTimezoneOffset();          // minutes east of UTC
  /* liveHabits() and not state.habits: a habit you retired that kept buzzing at 7am would be worse
     than having no archive at all */
  liveHabits().filter(h => h.remindAt).forEach(h => {
    const c = h.cadence || { mode: "daily" };
    rows.push({ at: h.remindAt, days: c.mode === "days" ? (c.days || []) : [0, 1, 2, 3, 4, 5, 6],
      title: `${h.emoji} ${h.name}`, body: h.why || "Time for this one", nav: "habits", tz_offset: tz });
  });
  if ((r.kinds || {}).habits && r.after) {
    rows.push({ at: r.after, days: [0, 1, 2, 3, 4, 5, 6], title: "🌿 LifeHub",
      body: "Anything still open today?", nav: "dashboard", tz_offset: tz });
  }
  return rows;
}

async function pushSubscribe() {
  if (!pushSupported()) { toast("Closed-app reminders aren't set up for this build"); return false; }
  if (!isSignedIn()) { toast("Sign in first — the server needs to know which device is yours"); return false; }
  let perm = Notification.permission;
  if (perm === "default") { try { perm = await Notification.requestPermission(); } catch { perm = "denied"; } }
  if (perm !== "granted") { toast("Notifications are blocked — allow them for this site first"); return false; }
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToU8(VAPID_PUBLIC) });
    await savePushSub(sub);
    state.reminders.push = true;
    save();
    await syncPushSchedule();
    render();
    toast("Closed-app reminders on 🔔");
    return true;
  } catch (e) {
    toast("Couldn't register for push — " + ((e && e.message) || "the browser refused"));
    return false;
  }
}
async function savePushSub(sub) {
  const j = sub.toJSON ? sub.toJSON() : sub;
  const keys = j.keys || {};
  const r = await restFetch("push_subs", {
    method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: cloud.session.user_id, endpoint: j.endpoint, p256dh: keys.p256dh, auth: keys.auth }),
  });
  if (!r.ok) throw new Error("couldn't store this device (" + r.status + ")");
}
/* Replace this account's schedule wholesale — simpler than diffing, and it means turning a habit's
   reminder off actually removes it from the server rather than leaving an orphan buzzing at 7am. */
async function syncPushSchedule() {
  if (!isSignedIn() || !pushOn()) return;
  const rows = pushSchedule().map(x => Object.assign({ user_id: cloud.session.user_id }, x));
  try {
    await restFetch(`push_schedule?user_id=eq.${cloud.session.user_id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    if (rows.length) await restFetch("push_schedule", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(rows) });
  } catch {}
}
async function pushUnsubscribe() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      /* delete the row FIRST: a subscription we can no longer identify is a device that keeps buzzing */
      if (isSignedIn()) await restFetch(`push_subs?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }).catch(() => {});
      await sub.unsubscribe();
    }
    if (isSignedIn()) await restFetch(`push_schedule?user_id=eq.${cloud.session.user_id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }).catch(() => {});
  } catch {}
  state.reminders.push = false;
  save(); render();
  toast("Closed-app reminders off — this device and its schedule were removed from the server");
}

/* The one place in LifeHub where data leaves the device readable. It gets its own box, its own
   switch, and a plain list of exactly what goes up — because "we encrypt everything" stops being
   true here, and the person using it should be the one deciding whether that trade is worth it. */
function pushCard(ios, standalone) {
  if (!VAPID_PUBLIC) return `<div class="push-box">
    <b>${I.zap}Even when the app is closed</b>
    <p class="soft note">Not switched on for this build yet — it needs a push key and a small scheduled function on the server. Setup steps are in <code>supabase/README.md</code>.</p>
  </div>`;
  if (!isSignedIn()) return `<div class="push-box">
    <b>${I.zap}Even when the app is closed</b>
    <p class="soft note">Needs an account, so the server knows which device to wake. <button class="linkish" data-nav="profile">Create one free</button> — it stays free.</p>
  </div>`;
  const rows = pushSchedule();
  return `<div class="push-box ${pushOn() ? "on" : ""}">
    <b>${I.zap}Even when the app is closed${pushOn() ? `<span class="int-state on">${I.check}On</span>` : ""}</b>
    <p class="soft">Reminders that arrive with LifeHub fully shut — a real alarm, not a nudge you find later.</p>
    <p class="soft note"><b>What this shares.</b> Everything else you keep here is encrypted so the server can't read it. This is the exception: to buzz you on time, the server stores <b>the times, the weekdays and the short titles</b> shown on your lock screen — nothing else. Your logs, journal, health, finances and photos stay unreadable to it.</p>
    <p class="soft note"><b>What it can't do.</b> A schedule isn't a state check: the server can't tell whether you've already taken your vitamins, so these fire <b>on time</b> rather than only when something's outstanding. The smarter "3 habits still open" nudges stay app-open.</p>
    ${rows.length ? `<div class="fld"><span>What would be sent</span>
      <ul class="check-list tight">${rows.map(x => `<li>
        <span class="row-emoji">🔔</span>
        <span class="row-txt"><b>${esc(x.title)}</b><small>${esc(x.at)} · ${x.days.length === 7 ? "every day" : x.days.map(i => WD_SHORT[i]).join(", ")}</small></span>
      </li>`).join("")}</ul></div>`
      : `<p class="soft note">${I.clock} Nothing to send yet — give a habit its own time above, or keep the evening nudge on.</p>`}
    <div class="pill-row">
      ${pushOn()
        ? `<button class="btn ghost" data-action="push-off">Turn off &amp; delete from server</button>`
        : `<button class="btn primary" data-action="push-on">${I.bell}Turn on</button>`}
    </div>
    ${ios && !standalone ? `<p class="soft note"><b>On iPhone</b> this only works once LifeHub is on your Home Screen (Share → Add to Home Screen), then opened from there.</p>` : ""}
  </div>`;
}

function remindersCard() {
  const r = state.reminders, perm = notifyPermission();
  const timed = liveHabits().filter(h => h.remindAt);
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  const head = cardHead("Reminders", r.enabled && perm === "granted"
    ? `<span class="int-state on">${I.check}On</span>` : `<span class="int-state">Off</span>`);

  if (perm === "unsupported") return card("span2", head + `
    <p class="soft note">${I.bell} This browser can't show notifications, so reminders aren't available here. Everything else works normally.</p>`);

  if (perm === "denied") return card("span2", head + `
    <p class="soft note">${I.bell} Notifications are <b>blocked</b> for this site. Turn them back on in your browser or phone settings for LifeHub, then reload this page.</p>`);

  if (!r.enabled || perm !== "granted") return card("span2", head + `
    <p class="soft">Get a nudge when a supplement is due, a deadline lands today, or your habits are still open in the evening.</p>
    <div class="pill-row" style="margin-top:12px"><button class="btn primary" data-action="rem-enable">${I.bell}Turn on reminders</button></div>
    ${remindersHonesty(ios, standalone)}`);

  return card("span2", head + `
    <div class="fld-row">
      <label class="fld"><span>Nudge me after</span><input type="time" data-change="rem-after" value="${esc(r.after)}"></label>
      <label class="fld"><span>Quiet from</span><input type="time" data-change="rem-quiet" value="${esc(r.quietFrom)}"></label>
    </div>
    <p class="soft note" style="margin-top:-2px">Evening nudges — habits still open, streak at risk — start at the first time and stop at the second. Deadlines, timed tasks and habits with their own time ignore both.</p>
    <div class="fld"><span>What to nudge about</span>
      <div class="chip-checks">
        ${[["habits", "🎯 Habits still open"], ["supplements", "💊 Supplements due"], ["streak", "🔥 Streak at risk"],
           ["deadlines", "🎓 Deadlines today"], ["tasks", "✅ Timed tasks"]].map(([id, label]) =>
          `<label class="chip-check"><input type="checkbox" data-change="rem-kind" data-id="${id}" ${r.kinds[id] ? "checked" : ""}><span>${label}</span></label>`).join("")}
      </div>
    </div>
    ${timed.length ? `<p class="soft note">${I.clock} Own time: ${timed.map(h => `<b>${esc(h.emoji)} ${esc(h.name)}</b> at ${esc(h.remindAt)}`).join(", ")} — set it on a habit's Edit form.</p>`
      : `<p class="soft note">${I.clock} You can give any single habit its own time on its <b>Edit</b> form.</p>`}
    <div class="pill-row" style="margin-top:12px">
      <button class="btn ghost" data-action="rem-test">${I.bell}Send a test</button>
      <button class="btn ghost" data-action="rem-off">Turn off</button>
    </div>
    ${pushCard(ios, standalone)}
    ${remindersHonesty(ios, standalone)}`);
}
/* Said plainly, in the app, where it matters — not buried in a README. */
function remindersHonesty(ios, standalone) {
  return `<p class="soft note">${I.zap} <b>What this can and can't do.</b> These arrive while LifeHub is open or still running in the background — so you'll get them when you pick your phone up, not silently at 8am with the app closed. Always-on reminders need a push server, which is the next step.
  ${ios && !standalone ? `<br><b>On iPhone:</b> notifications only work once LifeHub is added to your Home Screen (Share → Add to Home Screen).` : ""}</p>`;
}

/* ---------- profile ---------- */
function accountCard() {
  if (isSignedIn()) {
    const { cls, txt } = syncLabel();
    return card("span2", cardHead("Account &amp; sync") + `
      <div class="acct-row">
        <span class="acct-avatar">${I.user}</span>
        <div class="acct-meta">
          <b>${esc(cloud.session.email || "Signed in")}</b>
          <span class="sync-badge ${cls}" data-sync-status>${esc(txt)}</span>
        </div>
      </div>
      <div class="acct-row" style="margin-top:12px">
        <span class="acct-avatar">${I.camera}</span>
        <div class="acct-meta">
          <b>Photos &amp; videos</b>
          <span class="sync-badge" data-media-status>${esc(mediaLabel())}</span>
        </div>
      </div>
      <div class="pill-row" style="margin-top:14px">
        <button class="btn ghost" data-action="sync-now">${I.zap}Sync now</button>
        <button class="btn ghost" data-action="media-sync">${I.camera}Sync files</button>
        <button class="btn ghost" data-action="auth-signout">Sign out</button>
      </div>
      <p class="soft note">${I.check} Habits, books, workouts — and now your <b>photos and videos too</b>. Files are encrypted in this browser before they're uploaded, so only you can open them.</p>
      <p class="soft note">${I.zap} Clips over <b>${MEDIA_SYNC_MAX / 1024 / 1024}MB</b> stay on the device you added them on, but their <b>cover still syncs</b> so memories look right everywhere. Nothing is ever removed from a device to save room.</p>`);
  }
  return card("span2", cardHead(`Account &amp; sync <small class="soft">— free forever</small>`) + `
    <p class="soft">Create a free account to <b>sync LifeHub across all your devices</b> — phone, laptop, tablet. Your data is <b>encrypted on your device before it ever leaves</b>, so it stays completely private. No paywall, ever.</p>
    <div class="pill-row" style="margin-top:14px">
      <button class="btn primary" data-action="auth-open">${I.user}Sign in / Create account</button>
    </div>
    <p class="soft note">${I.zap} Everything keeps working offline — the cloud is just an encrypted mirror. Sync runs on the live site (not the in-chat preview).</p>`);
}

/* The daily line on the dashboard. The built-in pool is long enough that nothing repeats for three
   months; adding your own is what makes it yours \u2014 Bushido lines for a Bushido challenge. */
function quotesCard() {
  const mine = (state.quotes || []);
  return card("", cardHead(`Daily lines <small class="soft">${quotePool().length} in rotation</small>`) + `
    <p class="reflect-prompt">${esc(motivationOfDay())}</p>
    <p class="soft small">Today's line. It changes every day and draws from ${MOTIVATION.length} built-in lines plus anything you add below.</p>
    <form data-submit="quote-add" class="task-add" style="margin-top:10px">
      <input name="text" placeholder="Add your own line…" autocomplete="off" required maxlength="160">
      <button class="btn primary" type="submit" aria-label="Add line">${I.plus}</button>
    </form>
    ${mine.length ? `<ul class="quote-list">${mine.map((q, i) => `<li>
      <span class="row-txt"><b>${esc(q)}</b></span>
      <button class="icon-btn ghost" data-action="quote-del" data-i="${i}" aria-label="Remove this line">${I.trash}</button>
    </li>`).join("")}</ul>` : `<p class="soft small" style="margin-top:8px">None of your own yet.</p>`}`);
}

function vProfile() {
  const li = levelInfo();
  return `
  <div class="grid">
    ${accountCard()}
    ${remindersCard()}
    ${quotesCard()}
    ${card("center span2", `
      <button class="avatar-big" data-action="profile-edit" aria-label="Edit profile">${esc(state.profile.avatar)}</button>
      <h2 style="margin-top:10px">${esc(state.profile.name || "Set your name")}</h2>
      <p class="soft">Level ${li.lvl} · ${state.xp.toLocaleString()} XP</p>
      <div style="max-width:340px;margin:8px auto 0">${barHtml(li.pct)}</div>
      <small class="soft">${li.into.toLocaleString()} / ${li.need.toLocaleString()} XP to level ${li.lvl + 1}</small>
      <div class="pill-row" style="justify-content:center;margin-top:14px">
        <button class="btn ghost" data-action="profile-edit">${I.edit}Edit profile</button>
        <button class="btn ghost" data-action="theme-toggle">${I.moon}Theme</button>
      </div>`)}
    ${card("span2", cardHead(`Badges <small class="soft">${Object.keys(state.badges).length}/${BADGES.length}</small>`) + `
      <div class="badge-grid">
        ${BADGES.map(b => {
          const got = state.badges[b.id];
          return `<div class="badge ${got ? "got" : ""}" data-tip="${esc(b.desc + (got ? ` · earned ${niceDate(got)}` : ""))}">
            <span class="badge-emoji">${b.emoji}</span><b>${esc(b.name)}</b><small>${got ? niceDate(got) : "locked"}</small>
          </div>`;
        }).join("")}
      </div>`)}
    ${card("span2", cardHead("Your data") + `
      <div class="pill-row">
        <button class="btn ghost" data-action="data-export">${I.download}Export JSON</button>
        <button class="btn ghost" data-action="data-import">${I.upload}Import</button>
      </div>
      <p class="soft note">Everything lives in this browser's local storage — export regularly if you care about it.</p>
      <div class="pill-row" style="margin-top:14px">
        <button class="btn primary" data-action="data-fresh">${I.spark}Start fresh</button>
        <button class="btn ghost" data-action="data-sample">${I.grid}Load sample data</button>
        <button class="btn danger" data-action="data-reset">${I.trash}Reset everything</button>
      </div>
      <p class="soft note"><b>Start fresh</b> clears all the demo/sample content &amp; uploaded media but keeps your name, theme and keys. <b>Load sample data</b> refills the demo. <b>Reset everything</b> wipes it all, including your profile.</p>`)}
    ${card("span2", cardHead("Money") + `
      <label class="fld"><span>Your currency <small class="soft">— what new amounts default to</small></span>
        ${curSelect(state.profile.currency, "profile-currency").replace('name="profile-currency"', 'data-change="profile-currency"')}</label>
      <label class="fld"><span>Exchange rate <small class="soft">— optional</small></span>
        <input type="number" min="0" step="any" inputmode="decimal" data-change="profile-fx"
          value="${state.profile.fxRate || ""}" placeholder="${esc(CURRENCIES.IRT.sym)} per ${esc(CURRENCIES.USD.sym)}1"></label>
      <p class="soft note">${I.spark} Every amount remembers the currency it was paid in, and totals are shown per currency. LifeHub <b>never looks up a rate</b> — if you give it one it will show a combined figure, always labelled with your rate and the day you set it${state.profile.fxSetOn ? ` (currently ${esc(niceDate(state.profile.fxSetOn, { month: "long", day: "numeric", year: "numeric" }))})` : ""}. Leave it blank and it simply shows both.</p>`)}

    ${card("span2", cardHead("Connections") + `
      <label class="fld"><span>TMDb API key <small class="soft">— powers movie &amp; series search + autofill</small></span>
        <input type="text" data-change="tmdb-key" value="${esc(state.profile.tmdbKey || "")}" placeholder="Paste your free TMDb key" autocomplete="off"></label>
      <p class="soft note">${I.search} Get a free key at <b>themoviedb.org → Settings → API</b>. Book search needs no key. Your key is stored only in this browser.</p>`)}
  </div>`;
}

/* ================= render ================= */
const VIEWS = {
  dashboard: vDashboard, goals: vGoals, habits: vHabits, health: vHealth, workout: vWorkout,
  nutrition: vNutrition, learning: vLearning, reading: vReading, media: vMedia,
  projects: vProjects, finance: vFinance, social: vSocial,
  memories: vMemories, journal: vJournal, progress: vProgress,
  integrations: vIntegrations, profile: vProfile,
};

function render() {
  checkMissions();
  $("#view").innerHTML = (VIEWS[currentView] || vDashboard)();
  renderNav();
  renderTopbar();
  renderFocusBar();      // lives outside #view, but must still track the state a render reflects
  drawCharts();
  hydrateMedia();
  runMotion();
}

/* ================= modals / forms ================= */
function formModal(title, fieldsHtml, submitAction, submitLabel = "Save") {
  openModal(`
    <form data-submit="${submitAction}">
      <header class="modal-head"><h3>${title}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
      <div class="modal-body">${fieldsHtml}</div>
      <footer class="modal-foot"><button type="button" class="btn ghost" data-action="modal-close">Cancel</button><button type="submit" class="btn primary">${submitLabel}</button></footer>
    </form>`);
}
const fld = (label, inner) => `<label class="fld"><span>${label}</span>${inner}</label>`;
const txt = (name, ph = "", val = "", required = true) => `<input type="text" name="${name}" placeholder="${esc(ph)}" value="${esc(val)}" ${required ? "required" : ""} maxlength="80">`;
const num = (name, val = "", min = 0, step = 1) => `<input type="number" name="${name}" value="${val}" min="${min}" step="${step}" required>`;

const AVATARS = ["🌱", "🦊", "🐼", "🦋", "🌞", "🌙", "🐯", "🦄", "🐢", "🐳", "🍀", "⚡"];
const avatarPick = (selected) =>
  `<div class="avatar-pick">${AVATARS.map(a => `<label><input type="radio" name="avatar" value="${a}" ${selected === a ? "checked" : ""}><span>${a}</span></label>`).join("")}</div>`;

/* quick-add sheet (mobile + button) */
function openQuickAdd() {
  openModal(`
    <header class="modal-head"><h3>Quick add</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="quick-grid">
      ${[["task-add", "check", "Task"], ["habit-add", "target", "Habit"], ["workout-add", "dumbbell", "Workout"], ["book-add", "book", "Book"],
         ["media-add", "film", "Movie / series"], ["uni-task-add", "building", "Uni task"], ["project-add", "rocket", "Project"],
         ["memory-add", "camera", "Memory"], ["go-journal", "pen", "Journal"]]
        .map(([act, ic, lbl]) => `<button class="quick-item" data-action="${act}">${I[ic]}<span>${lbl}</span></button>`).join("")}
    </div>`);
}

/* ================= actions ================= */
const ACTIONS = {
  "modal-close": closeModal,
  "close-drawer": closeDrawer,
  "theme-toggle": toggleTheme,

  /* reminders */
  "rem-enable": () => enableReminders(),
  "rem-off": () => { state.reminders.enabled = false; if (pushOn()) pushUnsubscribe(); save(); render(); startReminders(); toast("Reminders off"); },
  "push-on": () => pushSubscribe(),
  "push-off": () => pushUnsubscribe(),
  "rem-test": async () => {
    const ok = await sendNudge({ key: "test:" + Date.now(), title: "🌿 LifeHub", body: "This is what a nudge looks like.", nav: "dashboard" });
    toast(ok ? "Sent — check your notifications" : "Couldn't show it. Your browser or system may have notifications muted.");
  },
  "quick-add": openQuickAdd,
  "go-journal": () => { closeModal(); go("journal"); },

  /* account + cloud sync */
  /* data recovery (shown when startup couldn't read saved data) */
  "recover-download": () => {
    let raw = ""; try { raw = localStorage.getItem(CORRUPT_KEY) || ""; } catch {}
    const blob = new Blob([raw], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `lifehub-recovered-${todayIso()}.json` });
    a.click(); URL.revokeObjectURL(a.href);
  },
  "recover-reload": () => location.reload(),
  "recover-fresh": () => {
    /* keep CORRUPT_KEY — the old data stays downloadable even after starting over */
    loadIssue = null; state = migrate(defaultState()); save();
    closeModal(); applyTheme(); render();
    toast("Started fresh — your old data is still saved in this browser");
  },

  "auth-open": () => openAuthModal("signin"),
  "auth-switch-signup": () => openAuthModal("signup"),
  "auth-switch-signin": () => openAuthModal("signin"),
  "auth-signout": () => { authSignout(); toast("Signed out — your data stays on this device"); render(); },
  "sync-now": async () => { await pullSnapshot(); if (cloud._dirty) await pushSnapshot(); },
  /* an explicit file sync also sweeps files whose records are gone */
  "media-sync": async () => {
    if (!isSignedIn()) { toast("Sign in first — files sync with your account"); return; }
    const n = await syncMedia({ gc: true });
    toast(cloud.media.failed ? `${cloud.media.failed} file${cloud.media.failed === 1 ? "" : "s"} didn't transfer — check your connection`
      : n ? `${n} file${n === 1 ? "" : "s"} synced 📸` : "Your files are already up to date");
  },
  "conflict-keep-local": () => { closeModal(); pushSnapshot(true); },
  "conflict-keep-remote": async () => {
    closeModal();
    const remote = cloud._conflictRemote; if (!remote) return;
    cloud._busy = true; setSyncStatus("syncing");
    try {
      const incoming = migrate(Object.assign(defaultState(), await decryptSnapshot(remote, cloud.key)));
      cloud._applyingRemote = true; state = incoming;
      setSyncMeta({ userId: cloud.session.user_id, version: remote.version, updatedAt: remote.updated_at });
      save(); cloud._applyingRemote = false; cloud._dirty = false;
      setSyncStatus("synced"); applyTheme(); render();
    } catch { setSyncStatus("error"); toast("Couldn't load the other version"); }
    finally { cloud._busy = false; }
  },

  /* Today agenda + tasks */
  "ag-habit": (el) => {
    const h = state.habits.find(x => x.id === el.dataset.id);
    if (h && h.kind === "workout") { setCursor("workout", todayIso()); go("workout"); toast("Log your workout here — it ticks the habit 💪"); return; }
    setCursor("habits", todayIso()); toggleHabit(el.dataset.id); syncHabitToTask(el.dataset.id); render();
  },
  "ag-meal": (el) => { const t = todayIso(); const l = state.nutrition.log[t] = state.nutrition.log[t] || {}; l[el.dataset.id] = !l[el.dataset.id]; if (l[el.dataset.id]) addXp(5, "Meal logged"); save(); render(); },
  "ag-uni": (el) => {
    const k = learnTasks().find(x => x.id === el.dataset.id);
    if (!k) return;
    k.done = true; addXp(10, k.title);
    save(); checkBadges(); render(); toast("Assignment done ✓");
  },
  "ag-task": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.done = !td.done; if (td.done) addXp(5, "Task done"); syncTaskToLinks(td); save(); render(); } },
  "ag-reflect": openReflectModal,
  "todo-open": (el) => openTaskDetail(el.dataset.id),

  /* carry-forward: unfinished tasks from previous days, offered once a day */
  "carry-open": () => { state.tasksRolledOn = ""; maybeCarryForward(); },
  "carry-one": (el) => {
    carryTask(state.todos.find(x => x.id === el.dataset.id));
    save(); render();
    if (!maybeCarryForwardAgain()) toast("Brought forward ✅");
  },
  "carry-drop": (el) => {
    state.todos = state.todos.filter(x => x.id !== el.dataset.id);
    save(); render();
    if (!maybeCarryForwardAgain()) toast("Dropped");
  },
  "carry-all": () => {
    const n = strandedTasks().length;
    strandedTasks().forEach(carryTask);
    state.tasksRolledOn = todayIso();
    closeModal(); save(); render();
    toast(`${n} task${n === 1 ? "" : "s"} brought forward ✅`);
  },
  "carry-dismiss": () => { state.tasksRolledOn = todayIso(); closeModal(); save(); render(); },

  "task-up": (el) => moveTask(el.dataset.id, -1),
  "task-down": (el) => moveTask(el.dataset.id, 1),
  /* Pinning is capped at three. Rather than silently refusing the fourth — which reads as a broken
     button — it says so and leaves the existing three alone. */
  "task-pin": (el) => {
    const td = state.todos.find(x => x.id === el.dataset.id); if (!td) return;
    if (!td.focus && tasksOn(todayIso()).filter(x => x.focus && !x.done && !x.hard).length >= FOCUS_MAX) {
      toast(`Today's focus holds ${FOCUS_MAX}. Unpin one first.`); return;
    }
    td.focus = !td.focus;
    save(); render();
  },
  /* <details> toggles itself; this only remembers the state across the re-render a pin causes */
  "focus-more": () => { ui.showMore = !ui.showMore; },
  "focus-open": (el) => openFocusStart(el.dataset.id),
  "focus-pause": () => pauseFocus(),
  "focus-resume": () => resumeFocus(),
  "focus-extend": () => extendFocus(5),
  "focus-finish": () => openFocusFinish(),
  "focus-discard": () => { closeModal(); discardFocus(); toast("Session discarded — nothing logged"); },

  /* retire a habit without destroying it */
  "habit-archive": (el) => {
    const h = state.habits.find(x => x.id === el.dataset.id); if (!h) return;
    h.archived = true;
    /* dated TODAY: everything before this stays exactly as it was scored */
    h.archivedOn = todayIso();
    touch("habit", h.id, "Archived");
    closeModal(); save(); render();
    toastUndo(`${h.name} archived`, () => { h.archived = false; h.archivedOn = ""; save(); render(); });
  },
  "habit-restore": (el) => {
    touch("habit", el.dataset.id, "Restored from archive");
    const h = state.habits.find(x => x.id === el.dataset.id); if (!h) return;
    h.archived = false; h.archivedOn = "";
    closeModal(); save(); render();
    toast(`${h.name} is back`);
  },
  "habit-up": (el) => moveHabit(el.dataset.id, -1),
  "habit-down": (el) => moveHabit(el.dataset.id, 1),

  /* copy the exercise LIST from last time — names and kinds, never the sets. The point is to skip
     the typing, not to pretend you lifted something you haven't yet. */
  "session-repeat": (el) => {
    const s = state.workout.sessions.find(x => x.id === el.dataset.id); if (!s) return;
    const prev = lastSessionLike(s); if (!prev) return;
    s.exercises = (prev.exercises || []).map(ex => ({ id: uid(), name: ex.name, kind: ex.kind, sets: [] }));
    save(); render();
    toast(`${s.exercises.length} exercise${s.exercises.length === 1 ? "" : "s"} copied — sets are yours to log`);
  },
  "todo-toggle": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.done = !td.done; if (td.done) addXp(5, "Task done"); syncTaskToLinks(td); save(); closeModal(); render(); } },
  "todo-del": (el) => { closeModal(); deleteWithUndo(() => state.todos, el.dataset.id, "Task deleted"); },
  "task-add": () => formModal("New task",
    fld("Task", txt("text", "e.g. Calisthenics workout")) +
    `<div class="fld-row"><label class="fld"><span>Time (optional)</span><input type="time" name="time"></label>
     <label class="fld"><span>Counts toward habit</span><select name="habitId"><option value="">Auto-detect</option><option value="none">None</option>${liveHabits().map(h => `<option value="${h.id}">${esc(h.emoji)} ${esc(h.name)}</option>`).join("")}</select></label></div>`, "todo-add"),

  /* day navigation (shared) */
  "day-prev": (el) => { const v = el.dataset.view; setCursor(v, addDays(dayCursor(v), -1)); render(); },
  "day-next": (el) => { const v = el.dataset.view; const nd = addDays(dayCursor(v), 1); if (nd <= todayIso()) { setCursor(v, nd); render(); } },
  "day-today": (el) => { setCursor(el.dataset.view, todayIso()); render(); },

  /* habits */
  "habit-add": () => formModal("New habit", habitFormFields(), "habit-add"),
  "habit-library": openHabitLibrary,
  "habit-tmpl": (el) => {
    const t = HABIT_TEMPLATES[+el.dataset.i]; if (!t) return;
    state.habits.push({ id: uid(), name: t.name, emoji: t.emoji || "✅", type: t.type || "build", target: t.target || 0, unit: t.unit || "", why: t.why || "", color: t.color || "#6a5ae0", cadence: t.cadence || { mode: "daily" }, kind: t.kind || "", goalIds: [], milestones: [], log: {}, archived: false, archivedOn: "", order: nextHabitOrder() });
    save(); render(); toast(`Added ${t.emoji} ${t.name}`);
  },
  "workout-library": openWorkoutLibrary,
  "workout-tmpl": (el) => {
    const t = WORKOUT_TEMPLATES[+el.dataset.i]; if (!t) return;
    const d = dayCursor("workout");
    const sess = bornSession({ date: d, category: t.category || "Strength", planName: t.name, exercises: t.ex.map(n => ({ id: uid(), name: n, kind: "reps", sets: [] })) });
    state.workout.sessions.push(sess);
    (state.workout.log[d] = state.workout.log[d] || []).push(sess.id);
    if (d === todayIso()) addXp(20, "Workout");
    save(); render(); toast(`${t.name} added — log your sets 💪`);
  },
  "habit-day": (el) => { if (el.dataset.d <= todayIso()) { setCursor("habits", el.dataset.d); render(); } },
  "habit-open": (el) => openHabitDetail(el.dataset.id),
  "habit-toggle": (el) => { toggleHabit(el.dataset.id); syncHabitToTask(el.dataset.id); render(); },
  "habit-toggle-d": (el) => { toggleHabit(el.dataset.id); syncHabitToTask(el.dataset.id); render(); openHabitDetail(el.dataset.id); },
  "habit-inc": (el) => {
    const h = state.habits.find(x => x.id === el.dataset.id); if (!h) return;
    const src = habitSource(h);
    if (src) {
      if (logToSource(h, habitStep(h))) { save(); render(); toast(`Logged in ${areaOf(src.area).name} ✓`); }
      return;
    }
    addHabitAmount(h, dayCursor("habits"), habitStep(h)); render();
    if ($("#modal").innerHTML) openHabitDetail(h.id);
  },
  "book-log-pages": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id); if (!b) return;
    applyPages(b, +el.dataset.n, el.dataset.d);
    save(); closeModal(); render(); toast(`${el.dataset.n} pages logged in Reading ✓`);
  },
  "habit-dec": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h && !habitSource(h)) { addHabitAmount(h, dayCursor("habits"), -habitStep(h)); render(); openHabitDetail(h.id); } },
  "habit-skip": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { const e = ensureHabitEntry(h, dayCursor("habits")); e.skip = !e.skip; if (!e.skip && !e.done && !e.note && !e.amount && !e.workoutId && !e.slip) delete h.log[dayCursor("habits")]; save(); render(); openHabitDetail(h.id); } },
  "habit-source-jump": (el) => {
    const h = state.habits.find(x => x.id === el.dataset.id); if (!h) return;
    const src = habitSource(h); if (!src) return;
    if (src.area === "workout" || src.area === "health") setCursor(src.area, dayCursor("habits"));
    closeModal(); go(src.area);
    toast(`Log it here — it fills in “${h.name}” for you`);
  },
  "habit-make-workout": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { h.kind = "workout"; save(); render(); openHabitDetail(h.id); } },
  "habit-unmake-workout": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { h.kind = ""; save(); render(); openHabitDetail(h.id); } },
  // workout habits are completed by logging a real session — jump to the Workout section for that day
  "habit-log-workout": (el) => { setCursor("workout", dayCursor("habits")); closeModal(); go("workout"); },
  "habit-workout-jump": (el) => { setCursor("workout", dayCursor("habits")); closeModal(); go("workout"); toast("Log your workout here — it ticks the habit 💪"); },
  "habit-edit": (el) => {
    const h = state.habits.find(x => x.id === el.dataset.id);
    formModal("Edit habit", habitFormFields(h) + `<input type="hidden" name="id" value="${h.id}">`, "habit-edit");
  },
  "habit-del": (el) => { closeModal(); deleteWithUndo(() => state.habits, el.dataset.id, "Habit deleted — history kept"); },
  "habit-del-d": (el) => { closeModal(); deleteWithUndo(() => state.habits, el.dataset.id, "Habit deleted — history kept"); },
  "ms-add": (el) => { const id = el.dataset.id; formModal("New milestone", fld("Milestone", txt("text", "e.g. 30-day streak")) + `<input type="hidden" name="hid" value="${id}">`, "ms-add"); },
  "ms-toggle": (el) => { const h = state.habits.find(x => x.id === el.dataset.h); const m = h && h.milestones.find(x => x.id === el.dataset.m); if (m) { m.done = !m.done; if (m.done) addXp(15, "Milestone"); save(); render(); openHabitDetail(h.id); } },
  "ms-del": (el) => { const h = state.habits.find(x => x.id === el.dataset.h); if (h) { h.milestones = h.milestones.filter(x => x.id !== el.dataset.m); save(); render(); openHabitDetail(h.id); } },

  /* goals */
  "event-add": () => formModal("New event", eventFormFields(), "event-add"),
  "event-open": (el) => openEventDetail(el.dataset.id),
  "event-edit": (el) => { const e = (state.events || []).find(x => x.id === el.dataset.id); if (e) formModal("Edit event", eventFormFields(e) + `<input type="hidden" name="id" value="${e.id}">`, "event-edit"); },
  "event-del": (el) => { closeModal(); deleteWithUndo(() => state.events, el.dataset.id, "Event deleted"); },
  "link-add": (el) => openLinkPicker(el.dataset.type, el.dataset.id),
  "link-del": (el) => {
    const l = (state.links || []).find(x => x.id === el.dataset.lid);
    if (!l) return;
    removeLink(l.id); save(); render();
    /* reopen whatever sheet we were in, so unlinking doesn't feel like the app closed on you */
    const d = deref(l.from) || deref(l.to);
    if (d && d.spec.open && ACTIONS[d.spec.open]) ACTIONS[d.spec.open]({ dataset: { id: d.id } });
    toast("Unlinked");
  },
  "quote-del": (el) => { state.quotes.splice(+el.dataset.i, 1); save(); render(); },
  "group-add": () => formModal("New group", groupFormFields(), "group-add"),
  "group-open": (el) => openGroupDetail(el.dataset.id),
  "group-edit": (el) => { const g = groupById(el.dataset.id); if (g) formModal("Edit group", groupFormFields(g) + `<input type="hidden" name="id" value="${g.id}">`, "group-edit"); },
  /* the habits outlive the group — they just lose the label, and an undo puts it back */
  "group-del": (el) => {
    const id = el.dataset.id; closeModal();
    const members = state.habits.filter(h => h.groupId === id).map(h => h.id);
    members.forEach(hid => { const h = state.habits.find(x => x.id === hid); if (h) h.groupId = ""; });
    deleteWithUndo(() => state.groups, id, "Group deleted",
      null,
      () => members.forEach(hid => { const h = state.habits.find(x => x.id === hid); if (h) h.groupId = id; }));
  },
  "goal-add": () => formModal("New goal", goalFormFields(), "goal-add"),
  "goal-log": (el) => { const g = state.goals.find(x => x.id === el.dataset.id); if (g) formModal(`Log ${esc(g.unit || "value")} · ${esc(g.title)}`, fld(`Current ${esc(g.unit || "value")}`, num("value", goalCurrent(g), 0, "any")) + `<input type="hidden" name="gid" value="${g.id}">`, "goal-log"); },
  "goal-habits": (el) => openGoalHabits(el.dataset.id),
  "goal-open": (el) => openGoalDetail(el.dataset.id),
  "goal-edit": (el) => { const g = state.goals.find(x => x.id === el.dataset.id); formModal("Edit goal", goalFormFields(g) + `<input type="hidden" name="id" value="${g.id}">`, "goal-edit"); },
  "goal-del": (el) => {
    const id = el.dataset.id;
    const linked = state.habits.filter(h => (h.goalIds || []).includes(id)).map(h => h.id);
    state.habits.forEach(h => { h.goalIds = (h.goalIds || []).filter(x => x !== id); });
    closeModal();
    deleteWithUndo(() => state.goals, id, "Goal deleted", null, () => {
      linked.forEach(hid => { const h = state.habits.find(x => x.id === hid); if (h && !h.goalIds.includes(id)) h.goalIds.push(id); });
    });
  },
  "gms-add": (el) => { const id = el.dataset.id; formModal("New milestone", fld("Milestone", txt("text", "e.g. Finish week 4")) + `<input type="hidden" name="gid" value="${id}">`, "gms-add"); },
  "gms-toggle": (el) => { const g = state.goals.find(x => x.id === el.dataset.g); const m = g && g.milestones.find(x => x.id === el.dataset.m); if (m) { m.done = !m.done; if (m.done) addXp(15, "Milestone"); save(); render(); openGoalDetail(g.id); } },
  "gms-del": (el) => { const g = state.goals.find(x => x.id === el.dataset.g); if (g) { g.milestones = g.milestones.filter(x => x.id !== el.dataset.m); save(); render(); openGoalDetail(g.id); } },

  /* health */
  "steps-add": (el) => { const d = dayCursor("health"); const l = state.health.log[d] = healthOn(d); l.steps = (l.steps || 0) + +el.dataset.n; save(); render(); },
  "water-add": (el) => { const d = dayCursor("health"); const l = state.health.log[d] = healthOn(d); l.water = +((l.water || 0) + +el.dataset.n).toFixed(2); save(); render(); },
  "mood-goto": (el) => { setCursor("health", el.dataset.d); render(); },
  "mood-set": (el) => { setMoodOn(dayCursor("health"), el.dataset.m); save(); render(); },
  "health-goals": () => formModal("Health goals",
    fld("Daily steps", num("steps", state.health.goals.steps, 1000, 500)) +
    fld("Water (L)", num("water", state.health.goals.water, 0.5, 0.25)) +
    fld("Sleep (h)", num("sleep", state.health.goals.sleep, 4, 0.5)), "health-goals"),

  /* workout */
  "workout-day": (el) => { if (el.dataset.d <= todayIso()) { setCursor("workout", el.dataset.d); render(); } },
  "workout-add": () => formModal("Add to plan", planFormFields(), "workout-add"),
  "workout-edit": (el) => { const p = state.workout.plan.find(x => x.id === el.dataset.id); if (p) formModal("Edit plan", planFormFields(p) + `<input type="hidden" name="id" value="${p.id}">`, "workout-edit"); },
  "plan-up": (el) => { const a = state.workout.plan, i = a.findIndex(p => p.id === el.dataset.id); if (i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; save(); render(); } },
  "plan-down": (el) => { const a = state.workout.plan, i = a.findIndex(p => p.id === el.dataset.id); if (i >= 0 && i < a.length - 1) { [a[i + 1], a[i]] = [a[i], a[i + 1]]; save(); render(); } },
  "workout-toggle": (el) => {
    const p = state.workout.plan.find(x => x.id === el.dataset.id); if (!p) return;
    const d = dayCursor("workout");
    const existing = state.workout.sessions.find(s => s.date === d && s.planId === p.id);
    if (existing) { removeSession(existing.id); }
    else {
      const sess = bornSession({ date: d, category: p.category || "Strength", planId: p.id, planName: p.name, note: p.focus || "", exercises: (p.exercises || []).map(e => ({ id: uid(), name: e.name, kind: e.kind || "reps", sets: [] })) });
      state.workout.sessions.push(sess);
      (state.workout.log[d] = state.workout.log[d] || []).push(sess.id);
      if (d === todayIso()) addXp(20, "Workout");
    }
    save(); render();
  },
  "workout-del": (el) => { deleteWithUndo(() => state.workout.plan, el.dataset.id, "Removed from your plan"); },
  /* class packages */
  "class-add": () => formModal("New class package",
    fld("Class name", txt("name", "e.g. Yoga studio")) +
    `<div class="fld-row">${fld("Total sessions", `<input type="number" name="total" value="8" min="1">`)}${fld("Price paid", `<input type="number" name="price" value="0" min="0" step="any">`)}</div>` +
    `<div class="fld-row">${fld("Currency", curSelect())}${fld("Start date", `<input type="date" name="start" value="${todayIso()}">`)}</div>`, "class-add"),
  "class-attend": (el) => { const c = state.workout.classes.find(x => x.id === el.dataset.id); if (c && (c.log || []).length < c.total) { c.log = c.log || []; c.log.push(todayIso()); addXp(10, c.name); save(); render(); if ((c.log.length) >= c.total) toast(`Last session of ${c.name} — time to renew 🔁`); } },
  "class-undo": (el) => { const c = state.workout.classes.find(x => x.id === el.dataset.id); if (c && (c.log || []).length) { c.log.pop(); save(); render(); } },
  "class-renew": (el) => { const c = state.workout.classes.find(x => x.id === el.dataset.id); if (c) { c.renewals = (c.renewals || 0) + 1; c.log = []; c.start = todayIso(); save(); render(); toast(`${c.name} renewed`); } },
  "class-del": (el) => { deleteWithUndo(() => state.workout.classes, el.dataset.id, "Package deleted"); },
  "session-add": () => formModal("Log a session",
    fld("Type", `<select name="category">${WORKOUT_CATS.map(c => `<option>${c}</option>`).join("")}</select>`) +
    fld("What did you do?", `<textarea name="note" placeholder="Sets, reps, how it felt…" maxlength="600"></textarea>`), "session-add"),
  "session-note": (el) => { const s = state.workout.sessions.find(x => x.id === el.dataset.id); if (s) formModal("Session note", fld("Notes", `<textarea name="note" maxlength="600">${esc(s.note || "")}</textarea>`) + `<input type="hidden" name="id" value="${s.id}">`, "session-note"); },
  "session-del": (el) => { removeSession(el.dataset.id); save(); render(); },
  "session-report": (el) => openSessionReport(el.dataset.id),

  /* skills */
  "skill-add": () => formModal("New skill", skillFormFields(), "skill-add", "Add"),
  "skill-open": (el) => openSkillDetail(el.dataset.id),
  "skill-edit": (el) => {
    const sk = skillById(el.dataset.id); if (!sk) return;
    formModal("Edit skill", skillFormFields(sk) + `<input type="hidden" name="id" value="${sk.id}">`, "skill-edit");
  },
  "skill-stage": (el) => {
    const sk = skillById(el.dataset.id); if (!sk) return;
    const st = SKILL_STAGES.find(x => x.id === el.dataset.s); if (!st) return;
    if (sk.status !== st.id) {
      sk.status = st.id; sk.updated = todayIso();
      touch("skill", sk.id, `Now ${st.label}`);
      if (st.id === "mastered") { addXp(60, `${sk.name} mastered`); celebrate && celebrate(); }
    }
    save(); render(); openSkillDetail(sk.id);
  },
  "skill-practice": (el) => {
    const sk = skillById(el.dataset.id); if (!sk) return;
    formModal(`Practised ${sk.name}`,
      `<div class="fld-row">${fld("Date", `<input type="date" name="date" value="${todayIso()}">`)}${
        fld(`Best${sk.pbUnit ? ` <small class="soft">— ${esc(sk.pbUnit)}</small>` : ""} <small class="soft">— optional</small>`,
          `<input type="number" name="best" min="0" step="any" inputmode="decimal" placeholder="e.g. 12">`)}</div>` +
      fld("How did it go?", txt("note", "what you tried, what happened", "", false)) +
      `<input type="hidden" name="sid" value="${sk.id}">`, "skill-practice", "Log it");
  },
  "skill-practice-del": (el) => {
    const sk = skillById(el.dataset.id); if (!sk) return;
    sk.log = skillLog(sk).filter(r => r.id !== el.dataset.r);
    save(); render(); openSkillDetail(sk.id);
  },
  "skill-note": (el) => {
    const sk = skillById(el.dataset.id); if (!sk) return;
    formModal("Coach correction",
      fld("What were you told?", `<textarea name="text" rows="2" maxlength="300" placeholder="e.g. Keep your core tighter"></textarea>`) +
      fld("Who said it <small class=\"soft\">— optional</small>", `<input type="text" name="coach" list="people-list" autocomplete="off">`) + peopleDatalist() +
      `<input type="hidden" name="sid" value="${sk.id}">`, "skill-note", "Save");
  },
  "skill-note-del": (el) => {
    const sk = skillById(el.dataset.id); if (!sk) return;
    sk.notes = (sk.notes || []).filter(n => n.id !== el.dataset.n);
    save(); render(); openSkillDetail(sk.id);
  },
  "skill-media-del": (el) => {
    const sk = skillById(el.dataset.id); if (!sk) return;
    dropMedia((sk.media || []).find(m => m.id === el.dataset.ref));
    sk.media = (sk.media || []).filter(m => m.id !== el.dataset.ref);
    save(); render(); openSkillDetail(sk.id);
  },
  "skill-del": (el) => {
    const sk = skillById(el.dataset.id);
    const refs = ((sk && sk.media) || []).slice();
    /* a deleted skill must also stop being ticked on sessions, or the session keeps a reference to
       something that no longer exists — and undo has to put that back too */
    const onSessions = (state.workout.sessions || []).filter(x => (x.skills || []).includes(el.dataset.id)).map(x => x.id);
    closeModal();
    deleteWithUndo(() => skillsAll(), el.dataset.id, "Skill deleted",
      () => refs.forEach(dropMedia),
      () => onSessions.forEach(sid => {
        const sess = state.workout.sessions.find(x => x.id === sid);
        if (sess && !(sess.skills || []).includes(el.dataset.id)) sess.skills.push(el.dataset.id);
      }));
    (state.workout.sessions || []).forEach(x => { x.skills = (x.skills || []).filter(i => i !== el.dataset.id); });
    save(); render();
  },
  "session-media-del": (el) => { const s = state.workout.sessions.find(x => x.id === el.dataset.s); if (s) { dropMedia((s.media || []).find(m => m.id === el.dataset.m)); s.media = (s.media || []).filter(m => m.id !== el.dataset.m); save(); render(); } },
  "ex-add": (el) => formModal("Add exercise",
    fld("Exercise", `<input type="text" name="name" placeholder="e.g. Bench press" list="ex-names" autocomplete="off" required maxlength="60">`) + exerciseDatalist() +
    fld("Measured in", `<select name="kind"><option value="reps">Weight × reps</option><option value="time">Time / hold (seconds)</option><option value="distance">Distance</option></select>`) +
    `<input type="hidden" name="sid" value="${el.dataset.id}">`, "ex-add"),
  "set-add": (el) => {
    const s = state.workout.sessions.find(x => x.id === el.dataset.s), ex = s && (s.exercises || []).find(e => e.id === el.dataset.e);
    if (!ex) return;
    let fields;
    if (ex.kind === "time") fields = fld("Seconds", num("seconds", 30, 0));
    else if (ex.kind === "distance") fields = `<div class="fld-row">${fld("Distance", num("distance", 1, 0))}${fld("Unit", txt("unit", "km", "km", false))}</div>`;
    else fields = `<div class="fld-row">${fld("Weight (kg)", num("weight", 20, 0))}${fld("Reps", num("reps", 8, 0))}</div>`;
    formModal(`Add set · ${esc(ex.name)}`, fields + `<input type="hidden" name="sid" value="${s.id}"><input type="hidden" name="eid" value="${ex.id}"><input type="hidden" name="kind" value="${ex.kind}">`, "set-add");
  },
  "set-del": (el) => { const s = state.workout.sessions.find(x => x.id === el.dataset.s), ex = s && (s.exercises || []).find(e => e.id === el.dataset.e); if (ex) { ex.sets.splice(+el.dataset.i, 1); save(); render(); } },
  "ex-del": (el) => { const s = state.workout.sessions.find(x => x.id === el.dataset.s); if (s) { s.exercises = (s.exercises || []).filter(e => e.id !== el.dataset.e); save(); render(); } },
  "ex-history": (el) => openExerciseHistory(el.dataset.name),

  /* nutrition */
  "meal-add": () => formModal("Add meal",
    `<div class="fld-row">${fld("Slot", `<select name="slot">${["Breakfast", "Lunch", "Dinner", "Snacks"].map(s => `<option>${s}</option>`).join("")}</select>`)}${fld("Time", `<input type="time" name="time" value="08:00">`)}</div>` +
    fld("Description", txt("name", "e.g. Oatmeal & berries")) +
    `<div class="fld-row">${fld("kcal", num("kcal", 400, 0, 10))}${fld("Protein g", num("protein", 20, 0, 1))}${fld("Carbs g", num("carbs", 40, 0, 1))}${fld("Fats g", num("fats", 10, 0, 1))}${fld("Fiber g", num("fiber", 5, 0, 1))}</div>`, "meal-add"),
  "meal-edit": (el) => {
    const m = state.nutrition.meals.find(x => x.id === el.dataset.id);
    if (!m) return;
    formModal("Edit meal",
      `<div class="fld-row">${fld("Slot", `<select name="slot">${["Breakfast", "Lunch", "Dinner", "Snacks"].map(s => `<option${s === m.slot ? " selected" : ""}>${s}</option>`).join("")}</select>`)}${fld("Time", `<input type="time" name="time" value="${m.time || ""}">`)}</div>` +
      fld("Description", txt("name", "", m.name)) +
      `<div class="fld-row">${fld("kcal", num("kcal", m.kcal, 0, 10))}${fld("Protein g", num("protein", m.protein, 0, 1))}${fld("Carbs g", num("carbs", m.carbs, 0, 1))}${fld("Fats g", num("fats", m.fats, 0, 1))}${fld("Fiber g", num("fiber", m.fiber || 0, 0, 1))}</div>` +
      `<input type="hidden" name="id" value="${m.id}">`, "meal-edit");
  },
  "meal-toggle": (el) => {
    const t = dayCursor("nutrition"); const l = state.nutrition.log[t] = state.nutrition.log[t] || {};
    l[el.dataset.id] = !l[el.dataset.id];
    if (l[el.dataset.id]) addXp(5, "Meal logged");
    save(); render();
  },
  "meal-del": (el) => {
    const id = el.dataset.id;
    deleteWithUndo(() => state.nutrition.meals, id, "Meal deleted", () => {
      /* photos survive the undo window, then go — across every day, not just today */
      Object.keys(state.nutrition.photos || {}).forEach(day => {
        mealPhotos(day, id).forEach(dropMedia);
        if (state.nutrition.photos[day]) delete state.nutrition.photos[day][id];
      });
      save();
    });
  },
  "meal-photo-del": (el) => {
    const t = todayIso(), arr = (state.nutrition.photos[t] || {})[el.dataset.id];
    if (!arr) return;
    dropMedia(arr.find(p => p.id === el.dataset.ref));
    state.nutrition.photos[t][el.dataset.id] = arr.filter(p => p.id !== el.dataset.ref);
    save(); render();
  },
  "nutrition-goals": () => formModal("Nutrition goals",
    fld("Calories", num("kcal", state.nutrition.goals.kcal, 800, 50)) +
    `<div class="fld-row">${fld("Protein g", num("protein", state.nutrition.goals.protein))}${fld("Carbs g", num("carbs", state.nutrition.goals.carbs))}${fld("Fats g", num("fats", state.nutrition.goals.fats))}${fld("Fiber g", num("fiber", state.nutrition.goals.fiber))}</div>`, "nutrition-goals"),
  "sup-add": () => formModal("Add supplement",
    `<div class="fld-row">${fld("Name", txt("name", "e.g. Vitamin D3"))}${fld("Emoji", txt("emoji", "💊", "💊", false))}</div>` +
    `<div class="fld-row">${fld("Dose", txt("dose", "e.g. 1000 IU", "", false))}${fld("Every", `<select name="every"><option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option></select>`)}</div>`, "sup-add"),
  /* edit forms for records that used to be create-only */
  "sup-edit": (el) => {
    const x = state.nutrition.supplements.find(v => v.id === el.dataset.id); if (!x) return;
    formModal("Edit supplement",
      `<div class="fld-row">${fld("Name", txt("name", "", x.name))}${fld("Emoji", txt("emoji", "💊", x.emoji || "💊", false))}</div>` +
      `<div class="fld-row">${fld("Dose", txt("dose", "e.g. 1000 IU", x.dose || "", false))}${fld("Every", `<select name="every">${[["day","Daily"],["week","Weekly"],["month","Monthly"]].map(([v,l]) => `<option value="${v}" ${x.every === v ? "selected" : ""}>${l}</option>`).join("")}</select>`)}</div>` +
      `<input type="hidden" name="id" value="${x.id}">`, "sup-edit");
  },
  "project-edit": (el) => {
    const x = state.projects.find(v => v.id === el.dataset.id); if (!x) return;
    formModal("Edit project", projectFormFields(x) + `<input type="hidden" name="id" value="${x.id}">`, "project-edit");
  },
  "social-edit": (el) => {
    const x = state.social.items.find(v => v.id === el.dataset.id); if (!x) return;
    formModal("Edit connection goal",
      fld("Goal", txt("title", "", x.title)) +
      `<div class="fld-row">${fld("Times per week", num("target", x.target, 1))}${fld("Emoji", txt("emoji", "🤝", x.emoji || "🤝", false))}</div>` +
      `<input type="hidden" name="id" value="${x.id}">`, "social-edit");
  },
  "memory-edit": (el) => {
    const x = state.memories.find(v => v.id === el.dataset.id); if (!x) return;
    formModal("Edit memory",
      fld("Title", txt("title", "", x.title)) +
      fld("Note", `<textarea name="note" maxlength="240">${esc(x.note || "")}</textarea>`) +
      `<div class="fld-row">${fld("Emoji", txt("emoji", "📸", x.emoji || "📸", false))}${fld("Date", `<input type="date" name="date" value="${x.date}" required>`)}</div>` +
      fld("How did it feel?", txt("felt", "e.g. Like the whole summer was ours", x.felt || "", false)) +
      fld("Tags <small class=\"soft\">— comma separated</small>", txt("tags", "e.g. family, travel", (x.tags || []).join(", "), false)) +
      `<input type="hidden" name="id" value="${x.id}">`, "memory-edit");
  },
  "fin-edit": (el) => {
    const x = state.finance.entries.find(v => v.id === el.dataset.id); if (!x) return;
    const cats = x.type === "income" ? INCOME_CATS : EXPENSE_CATS;
    formModal(x.type === "income" ? "Edit income" : "Edit expense",
      `<div class="fld-row">${fld("Amount", `<input type="number" name="amount" min="0" step="any" value="${x.amount}" inputmode="decimal" required>`)}${fld("Currency", curSelect(x.cur))}</div>` +
      `<div class="fld-row">${fld("Date", `<input type="date" name="date" value="${x.date}">`)}${fld("Category", `<select name="category">${cats.map(c => `<option ${x.category === c ? "selected" : ""}>${c}</option>`).join("")}</select>`)}</div>` +
      fld("Note", txt("note", "optional", x.note || "", false)) +
      `<input type="hidden" name="id" value="${x.id}">`, "fin-edit");
  },
  "class-edit": (el) => {
    const x = state.workout.classes.find(v => v.id === el.dataset.id); if (!x) return;
    formModal("Edit class package",
      fld("Class name", txt("name", "", x.name)) +
      `<div class="fld-row">${fld("Total sessions", `<input type="number" name="total" value="${x.total}" min="1">`)}${fld("Price paid", `<input type="number" name="price" value="${x.price || 0}" min="0" step="any">`)}</div>` +
      fld("Start date", `<input type="date" name="start" value="${x.start || todayIso()}">`) +
      `<input type="hidden" name="id" value="${x.id}">`, "class-edit");
  },
  "journal-del": (el) => {
    const d = el.dataset.d || dayCursor("journal");
    deleteWithUndo(() => state.journal, (journalOn(d) || {}).id, "Entry deleted");
  },

  "sup-take": (el) => { state.nutrition.supTaken[el.dataset.id] = todayIso(); addXp(3, "Supplement taken"); markLinkedTaskDone("sup", el.dataset.id, true); toast("Nice — logged 💊"); save(); render(); },
  "sup-undo": (el) => { delete state.nutrition.supTaken[el.dataset.id]; markLinkedTaskDone("sup", el.dataset.id, false); save(); render(); },
  "sup-del": (el) => {
    const id = el.dataset.id, taken = state.nutrition.supTaken[id];
    delete state.nutrition.supTaken[id];
    deleteWithUndo(() => state.nutrition.supplements, id, "Supplement deleted", null,
      () => { if (taken !== undefined) state.nutrition.supTaken[id] = taken; });
  },

  /* skills / university */
  "study-log": (el) => {
    /* The bucket ("skills" / "university") is not a view. It used to be BOTH, because each bucket
       had its own page with its own day cursor — after the merge there is one page, so the day
       being navigated is Learning's. Reading dayCursor(bucket) here silently wrote every entry to
       today, however far back you had navigated. */
    const k = el.dataset.kind, t = dayCursor("learning");
    const day = state.study.log[t] = state.study.log[t] || {};
    day[k] = (day[k] || 0) + +el.dataset.n;
    addXp(Math.round(+el.dataset.n / 6), "Study time");
    save(); render();
  },
  "learn-goal": () => formModal("Study goals",
    `<div class="fld-row">${fld("Self-directed hours / month", num("monthly", state.learning.monthlyHours, 1))}${fld("Coursework hours / week", num("weekly", state.learning.weeklyHours, 1))}</div>`, "learn-goal"),
  "course-open": (el) => openCourseDetail(el.dataset.id),
  "course-study": (el) => {
    const c = courseById(el.dataset.id); if (!c) return;
    formModal(`Study · ${c.name}`,
      `<div class="fld-row">${fld("Minutes", num("mins", 60, 1))}${fld("Date", `<input type="date" name="date" value="${todayIso()}">`)}</div>` +
      `<p class="soft note">${I.spark} These minutes go into your monthly totals <b>and</b> onto this course.</p>` +
      `<input type="hidden" name="cid" value="${c.id}">`, "course-study", "Log it");
  },
  "course-add": () => formModal("New course", courseFormFields(), "course-add", "Add"),
  "course-edit": (el) => {
    const c = courseById(el.dataset.id); if (!c) return;
    formModal("Edit course", courseFormFields(c) + `<input type="hidden" name="id" value="${c.id}">`, "course-edit");
  },
  "course-done": (el) => { const c = courseById(el.dataset.id); if (c && c.progress < 100) { c.progress = 100; touch("course", c.id, "Finished"); addXp(40, `${c.name} completed`); save(); render(); closeModal(); } },
  "course-bump": (el) => {
    const c = courseById(el.dataset.id); if (!c) return;
    const was = c.progress || 0;
    c.progress = clamp(was + +el.dataset.n, 0, 100);
    if (c.progress === 100 && was < 100) { touch("course", c.id, "Finished"); addXp(40, `${c.name} completed`); }
    save(); render(); if (!$("#modalBackdrop").hidden) openCourseDetail(c.id);
  },
  "course-del": (el) => { closeModal(); deleteWithUndo(() => coursesAll(), el.dataset.id, "Course deleted"); },
  /* one list, one form — a coursework deadline and a career deadline were the same four fields */
  "learn-task-add": () => formModal("New deadline", learnTaskFormFields(), "learn-task-add", "Add"),
  "learn-task-edit": (el) => {
    const k = learnTasks().find(x => x.id === el.dataset.id); if (!k) return;
    formModal("Edit deadline", learnTaskFormFields(k) + `<input type="hidden" name="id" value="${k.id}">`, "learn-task-edit");
  },
  "learn-task-toggle": (el) => {
    const k = learnTasks().find(x => x.id === el.dataset.id); if (!k) return;
    k.done = !k.done; if (k.done) addXp(15, k.title);
    save(); render();
  },
  "learn-task-del": (el) => { deleteWithUndo(() => learnTasks(), el.dataset.id, "Deadline deleted"); },

  /* reading */
  "reading-tab": (el) => { ui.readingTab = el.dataset.id; render(); },
  "book-add": () => formModal("Add book",
    `<button type="button" class="btn primary slim autofill-btn" data-action="book-search">${I.search}Search &amp; autofill</button>
     <p class="autofill-or"><span>or add it manually</span></p>
     <label class="cover-upload add">
       <input type="file" accept="image/*" data-change="book-cover-new" hidden>
       <span class="cover-preview" id="coverPreview">${I.upload}<i>Add cover</i></span>
     </label>
     <input type="hidden" name="cover" id="coverField">` +
    fld("Title", txt("title", "e.g. Atomic Habits")) + fld("Author", txt("author", "", "", false)) +
    `<div class="fld-row">${fld("Pages", num("pages", 300, 1))}${fld("Genre", txt("genre", "e.g. Self-help", "", false))}</div>` +
    fld("Emoji (used if no cover)", txt("emoji", "📘", "📘", false)), "book-add"),
  "book-search": () => openSearchPicker("book"),
  "media-search": () => openSearchPicker("media"),
  "go-tmdb-key": () => { closeModal(); go("profile"); toast("Add your TMDb key under Connections"); },
  "book-pick": (el) => { const r = _searchResults[+el.dataset.i]; if (!r) return; const id = createBookFromResult(r); render(); openBookDetail(id); toast("Filled in — review & edit, it's saved"); },
  "media-pick": async (el) => {
    const r = _searchResults[+el.dataset.i]; if (!r) return;
    const box = $("#searchResults"); if (box) box.innerHTML = `<p class="soft small">Loading details…</p>`;
    try { const d = await fetchMovieDetail(r.tmdbId, r.mediaType); const id = createMediaFromDetail(d); render(); openMediaDetail(id); toast("Filled in — review it, it's saved"); }
    catch (e) { toast("Couldn't load those details — try again"); }
  },
  "book-open": (el) => openBookDetail(el.dataset.id),
  "book-rate": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b) { b.rating = +el.dataset.r; save(); checkBadges(); render(); openBookDetail(b.id); } },
  "book-fav": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b) { b.favorite = !b.favorite; if (b.favorite) toast("Added to favorites ♥"); save(); render(); openBookDetail(b.id); } },
  "book-page": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (!b) return;
    const from = b.page || 0;
    b.page = clamp(from + +el.dataset.d, 0, b.pages);
    logPages(b.page - from);
    save(); render(); openBookDetail(b.id);
  },
  "book-start-d": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b) { b.status = "current"; b.started = todayIso(); save(); render(); openBookDetail(b.id); } },
  "book-finish-d": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (b) { const was = b.status; b.status = "done"; b.page = b.pages; b.finished = todayIso(); if (was !== "done") addXp(50, `Finished ${b.title}`); ui.readingTab = "done"; save(); checkBadges(); render(); openBookDetail(b.id); }
  },
  "book-reread": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b) { b.status = "current"; b.page = 0; b.started = todayIso(); ui.readingTab = "current"; save(); render(); openBookDetail(b.id); } },
  "book-cover-clear": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b) { b.cover = null; save(); render(); openBookDetail(b.id); } },
  "book-edit": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (!b) return;
    formModal("Edit book",
      fld("Title", txt("title", "", b.title)) + fld("Author", txt("author", "", b.author, false)) +
      `<div class="fld-row">${fld("Pages", num("pages", b.pages, 1))}${fld("Genre", txt("genre", "", b.genre || "", false))}</div>` +
      fld("Emoji", txt("emoji", "", b.emoji || "📘", false)) +
      `<input type="hidden" name="id" value="${b.id}">`, "book-edit");
  },
  "book-del-d": (el) => {
    const id = el.dataset.id, b = state.reading.books.find(x => x.id === id);
    const fileRef = b && b.file ? b.file.id : null;
    closeModal();
    /* the file is only destroyed once Undo is no longer possible */
    deleteWithUndo(() => state.reading.books, id, "Book removed", () => { if (fileRef) mediaDelete(fileRef); });
  },
  "book-format": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b) { b.format = el.dataset.v; save(); render(); openBookDetail(b.id); } },
  "book-file-del": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b && b.file) { mediaDelete(b.file.id); b.file = null; save(); render(); openBookDetail(b.id); } },

  /* recommenders (shared by books + media) */
  "rec-del": (el) => {
    const list = peopleListFor(el.dataset.kind, el.dataset.id);
    if (!list) return;
    list.splice(+el.dataset.i, 1);
    save();
    reopenDetail(el.dataset.kind, el.dataset.id);
  },

  /* media */
  "media-tab": (el) => { ui.mediaTab = el.dataset.id; render(); },
  "media-add": () => formModal("Add a title",
    `<button type="button" class="btn primary slim autofill-btn" data-action="media-search">${I.search}Search &amp; autofill</button>
     <p class="autofill-or"><span>or add it manually</span></p>` +
    fld("Title", txt("title", "e.g. Interstellar")) +
    `<div class="fld-row">${fld("Type", `<select name="type"><option>Movie</option><option>Series</option></select>`)}${fld("Year", txt("year", "e.g. 2014", "", false))}</div>` +
    fld("Genre", txt("genre", "e.g. Sci-Fi", "", false)) +
    fld("Emoji (used if no poster)", txt("emoji", "🎬", "🎬", false)), "media-add"),
  "media-open": (el) => openMediaDetail(el.dataset.id),
  "media-rate": (el) => { const m = state.media.find(x => x.id === el.dataset.id); if (m) { m.rating = +el.dataset.r; save(); checkBadges(); render(); openMediaDetail(m.id); } },
  "media-fav": (el) => { const m = state.media.find(x => x.id === el.dataset.id); if (m) { m.favorite = !m.favorite; if (m.favorite) toast("Added to favorites ♥"); save(); render(); openMediaDetail(m.id); } },
  "media-cover-clear": (el) => { const m = state.media.find(x => x.id === el.dataset.id); if (m) { m.cover = null; save(); render(); openMediaDetail(m.id); } },
  "media-ep": (el) => {
    const m = state.media.find(x => x.id === el.dataset.id);
    if (!m) return;
    const max = m.epTotal || Infinity;
    m.epsDone = clamp((m.epsDone || 0) + +el.dataset.d, 0, max);
    if (m.status === "watchlist" && m.epsDone > 0) m.status = "watching";
    save(); render(); openMediaDetail(m.id);
  },
  "media-advance": (el) => {
    const m = state.media.find(x => x.id === el.dataset.id);
    if (!m) return;
    if (m.status === "watchlist") { m.status = "watching"; m.started = todayIso(); }
    else if (m.status === "watching") {
      m.status = "done"; m.finished = todayIso();
      if (m.epTotal) m.epsDone = m.epTotal;
      addXp(10, `Finished ${m.title}`);
      ui.mediaTab = "done";
    }
    save(); checkBadges(); render(); openMediaDetail(m.id);
  },
  "media-rewatch": (el) => { const m = state.media.find(x => x.id === el.dataset.id); if (m) { m.status = "watching"; m.epsDone = 0; m.started = todayIso(); ui.mediaTab = "watching"; save(); render(); openMediaDetail(m.id); } },
  "media-edit": (el) => {
    const m = state.media.find(x => x.id === el.dataset.id);
    if (!m) return;
    const isSeries = m.type === "Series";
    formModal("Edit title",
      fld("Title", txt("title", "", m.title)) +
      `<div class="fld-row">${fld("Type", `<select name="type"><option${!isSeries ? " selected" : ""}>Movie</option><option${isSeries ? " selected" : ""}>Series</option></select>`)}${fld("Year", txt("year", "", m.year || "", false))}</div>` +
      fld("Genre", txt("genre", "", m.genre || "", false)) +
      (isSeries
        ? `<div class="fld-row">${fld("Current season", num("season", m.season || 1, 1))}${fld("Total episodes", num("epTotal", m.epTotal || 0, 0))}</div>`
        : fld("Director", txt("director", "", m.director || "", false)) + fld("Cast", txt("cast", "", m.cast || "", false))) +
      fld("Emoji", txt("emoji", "", m.emoji || (isSeries ? "📺" : "🎬"), false)) +
      `<input type="hidden" name="id" value="${m.id}">`, "media-edit");
  },
  "media-del-d": (el) => { closeModal(); deleteWithUndo(() => state.media, el.dataset.id, "Title removed"); },
  "media-del": (el) => { deleteWithUndo(() => state.media, el.dataset.id, "Removed from your list"); },

  /* work / projects / social / memories */
  "project-add": () => formModal("New project", projectFormFields(), "project-add"),
  "project-open": (el) => openProjectDetail(el.dataset.id),
  /* only reachable while a project has no milestones — once it has some, progress is counted from
     them and this button is not rendered rather than being rendered and ignored */
  "project-bump": (el) => {
    const p = state.projects.find(x => x.id === el.dataset.id); if (!p || projectDerived(p)) return;
    p.progress = clamp((p.progress || 0) + +el.dataset.n, 0, 100);
    if (p.status === "Planning") p.status = "In progress";
    save(); render(); if (!$("#modalBackdrop").hidden) openProjectDetail(p.id);
  },
  "project-done": (el) => {
    const p = state.projects.find(x => x.id === el.dataset.id); if (!p) return;
    p.status = "Done"; p.progress = 100;
    (p.milestones || []).forEach(m => { m.done = true; });
    touch("project", p.id, "Shipped"); addXp(60, `${p.name} shipped`);
    closeModal(); save(); render();
  },
  "project-del": (el) => {
    const p = state.projects.find(x => x.id === el.dataset.id);
    const refs = ((p && p.files) || []).slice();
    closeModal();
    /* files outlive the undo window, exactly like a memory's photos */
    deleteWithUndo(() => state.projects, el.dataset.id, "Project deleted", () => refs.forEach(dropMedia));
  },
  "pms-add": (el) => {
    formModal("New milestone", fld("Milestone", txt("text", "e.g. ship the migration")) +
      `<input type="hidden" name="pid" value="${el.dataset.id}">`, "pms-add");
  },
  "pms-toggle": (el) => {
    const p = state.projects.find(x => x.id === el.dataset.p);
    const m = p && (p.milestones || []).find(x => x.id === el.dataset.m); if (!m) return;
    m.done = !m.done;
    /* stamped on tick, cleared on untick — this is what makes velocity answerable, and an untick
       means it was never really done, so the date must go with it */
    m.doneOn = m.done ? todayIso() : "";
    if (m.done) { addXp(15, "Milestone"); touch("project", p.id, `Milestone: ${m.text}`); }
    save(); render(); openProjectDetail(p.id);
  },
  "pms-del": (el) => {
    const p = state.projects.find(x => x.id === el.dataset.p); if (!p) return;
    p.milestones = (p.milestones || []).filter(x => x.id !== el.dataset.m);
    save(); render(); openProjectDetail(p.id);
  },
  "project-file-del": (el) => {
    const p = state.projects.find(x => x.id === el.dataset.id); if (!p) return;
    dropMedia((p.files || []).find(f => f.id === el.dataset.ref));
    p.files = (p.files || []).filter(f => f.id !== el.dataset.ref);
    save(); render(); openProjectDetail(p.id);
  },
  /* finance */
  "fin-income": () => finEntryForm("income"),
  "fin-expense": () => finEntryForm("expense"),
  "fin-del": (el) => { deleteWithUndo(() => state.finance.entries, el.dataset.id, "Entry deleted"); },
  "fin-import-classes": () => {
    const pending = pendingClassSpend();
    pending.forEach(c => {
      state.finance.entries.push({ id: uid(), date: c.start || todayIso(), type: "expense", amount: (c.price || 0) * (1 + (c.renewals || 0)), cur: CURRENCIES[c.cur] ? c.cur : defaultCur(), category: "Fitness", note: `${c.name} class package` });
      state.finance.importedClasses.push(c.id);
    });
    save(); render(); toast(`Imported ${pending.length} class ${pending.length > 1 ? "packages" : "package"} 💸`);
  },
  "social-add": () => formModal("New connection goal",
    fld("Goal", txt("title", "e.g. Call grandma")) + `<div class="fld-row">${fld("Times per week", num("target", 1, 1))}${fld("Emoji", txt("emoji", "📞", "📞", false))}</div>`, "social-add"),
  /* people */
  "person-add": () => formModal("Add someone", personFormFields(), "person-add", "Add"),
  "person-open": (el) => openPersonDetail(el.dataset.id),
  "person-edit": (el) => {
    const p = personById(el.dataset.id); if (!p) return;
    formModal("Edit person", personFormFields(p) + `<input type="hidden" name="id" value="${p.id}">`, "person-edit");
  },
  "person-touch": (el) => {
    const p = personById(el.dataset.id); if (!p) return;
    const t = todayIso();
    p.touches = p.touches || [];
    if (p.touches.includes(t)) { toast(`Already logged a catch-up with ${p.name} today`); return; }
    p.touches.push(t);
    addXp(10, "Caught up with " + p.name);
    save(); render();
    if (!document.querySelector("#modalBackdrop").hidden) openPersonDetail(p.id);
    toast(`Caught up with ${p.name} 💛`);
  },
  "person-del": (el) => {
    const p = personById(el.dataset.id); if (!p) return;
    closeModal();
    /* their name stays on the memories and books — deleting a contact card shouldn't rewrite history */
    deleteWithUndo(() => state.social.people, el.dataset.id, `${p.name} removed`);
  },
  "person-goto": (el) => {
    const kind = el.dataset.kind;
    go(kind === "memory" ? "memories" : kind === "media" ? "media" : "reading");
    reopenDetail(kind, el.dataset.id);
  },

  "social-bump": (el) => {
    const wk = weekKey(); const log = state.social.log[wk] = state.social.log[wk] || {};
    const itm = state.social.items.find(x => x.id === el.dataset.id);
    log[itm.id] = (log[itm.id] || 0) + 1;
    if (log[itm.id] === itm.target) addXp(15, itm.title);
    checkBadges(); save(); render();
  },
  "social-del": (el) => { deleteWithUndo(() => state.social.items, el.dataset.id, "Goal deleted"); },
  "memory-add": () => formModal("New memory",
    fld("Title", txt("title", "e.g. Sunset picnic")) + fld("Note", `<textarea name="note" placeholder="What made it special?" maxlength="240"></textarea>`) +
    `<div class="fld-row">${fld("Emoji", txt("emoji", "🌅", "🌅", false))}${fld("Date", `<input type="date" name="date" value="${todayIso()}" required>`)}</div>` +
    fld("How did it feel? <small class=\"soft\">— one line, in your words</small>", txt("felt", "e.g. Like the whole summer was ours", "", false)) +
    fld("Who was there <small class=\"soft\">— comma separated</small>", txt("people", "e.g. Mum, Sara", "", false)) +
    fld("Tags <small class=\"soft\">— comma separated</small>", txt("tags", "e.g. family, travel", "", false)) +
    `<p class="soft note">${I.camera} Save it, then open the memory to add photos and video.</p>`, "memory-add"),
  "memory-open": (el) => openMemoryDetail(el.dataset.id),
  "memory-star": (el) => {
    const m = state.memories.find(x => x.id === el.dataset.id); if (!m) return;
    m.starred = !m.starred; save(); render(); openMemoryDetail(m.id);
    toast(m.starred ? "Treasured ⭐" : "Removed from treasured");
  },
  "memory-search-clear": () => { ui.memorySearch = ""; render(); },
  "memory-tag-filter": (el) => { const t = el.dataset.t.toLowerCase(); ui.memorySearch = ui.memorySearch === t ? "" : t; render(); },
  "memory-photo-del": (el) => {
    const m = state.memories.find(x => x.id === el.dataset.id); if (!m) return;
    dropMedia((m.photos || []).find(ph => ph.id === el.dataset.ref));
    m.photos = (m.photos || []).filter(ph => ph.id !== el.dataset.ref);
    save(); render(); openMemoryDetail(m.id);
  },
  "memory-del": (el) => {
    const m = state.memories.find(x => x.id === el.dataset.id);
    const refs = (m && m.photos || []).slice();
    closeModal();
    deleteWithUndo(() => state.memories, el.dataset.id, "Memory deleted",
      () => refs.forEach(dropMedia));   // photos outlive the undo window
  },

  /* journal */
  "journal-mood": (el) => { setMoodOn(dayCursor("journal"), el.dataset.m); save(); render(); },   /* same store as Health */
  "journal-open": (el) => { setCursor("journal", el.dataset.d); render(); window.scrollTo({ top: 0 }); },
  "journal-tag": (el) => {
    const e = ensureJournalOn(dayCursor("journal")); e.tags = e.tags || [];
    const i = e.tags.indexOf(el.dataset.tag);
    if (i >= 0) e.tags.splice(i, 1); else e.tags.push(el.dataset.tag);
    save(); render();
  },
  "journal-save": () => {
    const d = dayCursor("journal");
    const text = $("#journalText").value.trim();
    if (!text) { toast("Write a few lines first ✍️"); return; }
    const existed = !!journalOn(d)?.text;
    const e = ensureJournalOn(d); e.text = text;
    if (!existed) addXp(15, "Journal entry");
    save(); render(); toast(existed ? "Entry updated" : "Entry saved");
  },

  /* profile & data */
  "profile-edit": () => formModal("Your profile",
    fld("Name", txt("name", "How should we greet you?", state.profile.name)) +
    fld("Avatar", avatarPick(state.profile.avatar)), "profile-save"),
  "data-export": () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `lifehub-${todayIso()}.json` });
    a.click(); URL.revokeObjectURL(a.href);
  },
  "data-import": () => {
    const inp = Object.assign(document.createElement("input"), { type: "file", accept: "application/json" });
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      f.text().then(txtC => {
        try {
          const incoming = JSON.parse(txtC);
          if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) throw new Error("shape");
          /* An import file is untrusted input — it may not have come from you. Keep only the keys this
             version knows, then put it through the same migration ladder as cloud data so an export
             from a NEWER LifeHub is refused rather than silently mangled. */
          const allowed = Object.keys(defaultState());
          const trimmed = {};
          allowed.forEach(k => { if (k in incoming) trimmed[k] = incoming[k]; });
          if (incoming.schema != null) trimmed.schema = incoming.schema;
          state = migrate(Object.assign(defaultState(), trimmed));
          save(); applyTheme(); render();
          toast("Data imported ✓");
        } catch (e) {
          toast(e && e.code === "schema-too-new"
            ? "That export is from a newer LifeHub — update this one first"
            : "That file doesn't look like a LifeHub export");
        }
      });
    };
    inp.click();
  },
  "data-reset": () => formModal("Reset everything?",
    `<p class="soft">This deletes <b>all</b> your LifeHub data in this browser — including your profile and keys — and starts the welcome over. No undo; export first if unsure.</p>`, "data-reset", "Yes, wipe it all"),
  "data-fresh": () => formModal("Start fresh?",
    `<p class="soft">Clears all the demo/sample content and your uploaded photos, and gives you an empty LifeHub to fill. Your <b>name, theme and keys are kept</b>. No undo — export first if unsure.</p>`, "data-fresh", "Start fresh"),
  "data-sample": () => formModal("Load sample data?",
    `<p class="soft">Refills LifeHub with the demo content so you can explore every feature. This replaces your current content (your profile &amp; keys are kept).</p>`, "data-sample", "Load sample data"),
};

function ensureJournalOn(d) {
  let e = journalOn(d);
  if (!e) { e = { id: uid(), date: d, text: "", mood: "", tags: [] }; state.journal.push(e); }
  return e;
}
function ensureJournal() { return ensureJournalOn(todayIso()); }

/* form submits */
const SUBMITS = {
  /* account (async — return true so the framework leaves the modal open; doAuth closes on success) */
  "auth-signin": (f) => { doAuth("signin", f.email, f.password); return true; },
  "auth-signup": (f) => { doAuth("signup", f.email, f.password); return true; },

  "habit-add": (f) => { state.habits.push(born({ id: uid(), name: f.name, emoji: f.emoji || "✅", type: f.type || "build", target: +f.target || 0, unit: f.unit || "", why: f.why || "", color: f.color || "#6a5ae0", cadence: parseCadence(f), kind: HABIT_SOURCES.some(x => x.id === f.kind) ? f.kind : "", groupId: groupById(f.groupId) ? f.groupId : "", remindAt: f.remindAt || "", goalIds: [], milestones: [], log: {}, archived: false, archivedOn: "", order: nextHabitOrder() })); touch("habit", state.habits[state.habits.length - 1].id, "Habit created"); },
  "habit-edit": (f) => { const h = state.habits.find(x => x.id === f.id); if (h) { h.name = f.name; h.emoji = f.emoji || h.emoji; h.type = f.type || "build"; h.target = +f.target || 0; h.unit = f.unit || ""; h.why = f.why || ""; h.color = f.color || h.color; h.cadence = parseCadence(f); h.kind = HABIT_SOURCES.some(x => x.id === f.kind) ? f.kind : ""; h.groupId = groupById(f.groupId) ? f.groupId : ""; h.remindAt = f.remindAt || ""; syncPushSchedule(); } },
  "ms-add": (f) => { const h = state.habits.find(x => x.id === f.hid); if (h) h.milestones.push({ id: uid(), text: f.text, done: false }); },
  "event-add": (f) => {
    if (!f.title) return;
    const e = born({ id: uid(), title: f.title.slice(0, 120), date: f.date || todayIso(),
      time: /^\d{2}:\d{2}$/.test(f.time || "") ? f.time : "", mins: clamp(+f.mins || 0, 0, 1440),
      category: EV_CATS.includes(f.category) ? f.category : "Other",
      icon: CAT_ICON[f.category] || "\u{1F4C5}", note: (f.note || "").slice(0, 400),
      /* "" means you typed it. A calendar import would stamp its own source here. */
      source: "" });
    (state.events = state.events || []).push(e);
    touch("event", e.id, "Event created");
  },
  "event-edit": (f) => {
    const e = (state.events || []).find(x => x.id === f.id); if (!e || !f.title) return;
    e.title = f.title.slice(0, 120); e.date = f.date || e.date;
    e.time = /^\d{2}:\d{2}$/.test(f.time || "") ? f.time : "";
    e.mins = clamp(+f.mins || 0, 0, 1440);
    if (EV_CATS.includes(f.category)) { e.category = f.category; e.icon = CAT_ICON[f.category]; }
    e.note = (f.note || "").slice(0, 400);
    touch("event", e.id, "Updated");
  },
  "link-add": (f) => {
    const l = addLink(f.from, f.to, (f.rel || "").trim() || "related");
    if (!l) { toast("Already linked"); return; }
    /* both objects remember it — a relationship is an event in the life of each */
    const a = parseRef(f.from), b = parseRef(f.to);
    if (a) touch(a.type, a.id, `Linked to ${refTitle(f.to)}`);
    if (b) touch(b.type, b.id, `Linked to ${refTitle(f.from)}`);
    toast("Linked \u{1F517}");
  },
  "quote-add": (f) => { const q = String(f.text || "").trim().slice(0, 160); if (q && !state.quotes.includes(q)) state.quotes.push(q); },
  "group-add": (f) => { if (f.name) state.groups.push(born({ id: uid(), name: f.name, emoji: f.emoji || "\u{1F94B}", color: f.color || "#6a5ae0", start: f.start || "", days: Math.max(0, +f.days || 0), order: (state.groups.length ? Math.max(...state.groups.map(g => g.order || 0)) + 1 : 0) })); },
  "group-edit": (f) => { const g = groupById(f.id); if (g && f.name) { g.name = f.name; g.emoji = f.emoji || g.emoji; g.color = f.color || g.color; g.start = f.start || ""; g.days = Math.max(0, +f.days || 0); } },
  "goal-add": (f) => { state.goals.push(born({ id: uid(), title: f.title, emoji: f.emoji || "🎯", type: f.type || "checklist", unit: f.unit || "", direction: f.direction || "down", start: +f.start || 0, target: +f.target || 0, startedOn: f.startedOn || todayIso(), deadline: f.deadline || "", note: f.note || "", priority: PRIORITY[f.priority] ? f.priority : "med", status: ["active", "paused", "done"].includes(f.status) ? f.status : "active", tags: parseTags(f.tags), progress: [], habitIds: [], milestones: [] })); touch("goal", state.goals[state.goals.length - 1].id, "Goal created"); },
  "goal-edit": (f) => { const g = state.goals.find(x => x.id === f.id); if (g) { g.title = f.title; g.emoji = f.emoji || g.emoji; g.type = f.type || "checklist"; g.unit = f.unit || ""; g.direction = f.direction || "down"; g.start = +f.start || 0; g.target = +f.target || 0; g.startedOn = f.startedOn || ""; g.deadline = f.deadline || ""; g.note = f.note || ""; g.tags = parseTags(f.tags); if (PRIORITY[f.priority]) g.priority = f.priority; if (["active", "paused", "done"].includes(f.status)) g.status = f.status; syncGoalMilestones(g); } },
  "goal-log": (f) => { const g = state.goals.find(x => x.id === f.gid); if (g) { g.progress.push({ date: todayIso(), value: +f.value || 0 }); syncGoalMilestones(g); touch("goal", g.id, `Logged ${+f.value || 0}${g.unit ? " " + g.unit : ""}`); addXp(5, "Progress logged"); } },
  "gms-add": (f) => { const g = state.goals.find(x => x.id === f.gid); if (g) g.milestones.push({ id: uid(), text: f.text, done: false }); },
  "health-goals": (f) => { state.health.goals = { steps: +f.steps, water: +f.water, sleep: +f.sleep }; },
  "workout-add": (f) => { state.workout.plan.push(Object.assign({ id: uid() }, planFromForm(f))); },
  "workout-edit": (f) => { const p = state.workout.plan.find(x => x.id === f.id); if (p) Object.assign(p, planFromForm(f)); },
  "class-add": (f) => { state.workout.classes.push({ id: uid(), name: f.name, total: Math.max(1, +f.total || 8), price: +f.price || 0, cur: CURRENCIES[f.cur] ? f.cur : defaultCur(), start: f.start || todayIso(), log: [], renewals: 0 }); },
  "session-add": (f) => { const d = dayCursor("workout"); const sess = bornSession({ date: d, category: f.category || "Strength", note: f.note || "" }); state.workout.sessions.push(sess); (state.workout.log[d] = state.workout.log[d] || []).push(sess.id); if (d === todayIso()) addXp(20, "Workout"); },
  "session-note": (f) => { const s = state.workout.sessions.find(x => x.id === f.id); if (s) s.note = f.note; },
  "session-report": (f) => {
    const s = state.workout.sessions.find(x => x.id === f.id); if (!s) return;
    /* typing a coach's name is how you meet them — Social should already know who they are */
    const coach = String(f.coach || "").trim();
    if (coach && normName(coach) !== normName(s.coach)) ensurePerson(coach);
    s.coach = coach;
    s.location = String(f.location || "").trim();
    s.duration = Math.max(0, +f.duration || 0);
    s.attendance = f.attendance === "missed" ? "missed" : "present";
    s.energy = clamp(+f.energy || 0, 0, 5);
    s.difficulty = clamp(+f.difficulty || 0, 0, 5);
    s.enjoyed = clamp(+f.enjoyed || 0, 0, 5);
    s.feedback = String(f.feedback || "").slice(0, 400);
    s.learned = String(f.learned || "").slice(0, 400);
    s.reflection = String(f.reflection || "").slice(0, 600);
    s.nextGoal = String(f.nextGoal || "").slice(0, 200);
    s.skills = skillsAll().filter(sk => f["skill_" + sk.id]).map(sk => sk.id);
    syncSessionSkills(s);       // one pass, both directions, idempotent
    if (s.feedback) touch("session", s.id, `Coach: ${s.feedback.slice(0, 60)}`);
  },
  "skill-add": (f) => {
    if (!String(f.name || "").trim()) return;
    const sk = born({ id: uid(), name: f.name.trim(), emoji: f.emoji || "🤸",
      category: f.category || "Calisthenics", status: f.status || "learning",
      level: (f.level || "").slice(0, 120), target: (f.target || "").slice(0, 120),
      pbUnit: (f.pbUnit || "").slice(0, 20), why: (f.why || "").slice(0, 200),
      media: [], notes: [], log: [] });
    skillsAll().push(sk);
    touch("skill", sk.id, "Skill added");
  },
  "skill-edit": (f) => {
    const sk = skillById(f.id); if (!sk) return;
    sk.name = f.name || sk.name; sk.emoji = f.emoji || sk.emoji;
    sk.category = f.category || sk.category;
    if (SKILL_STAGES.some(x => x.id === f.status)) sk.status = f.status;
    sk.level = (f.level || "").slice(0, 120); sk.target = (f.target || "").slice(0, 120);
    sk.pbUnit = (f.pbUnit || "").slice(0, 20); sk.why = (f.why || "").slice(0, 200);
    sk.updated = todayIso();
    touch("skill", sk.id, "Updated");
    setTimeout(() => openSkillDetail(sk.id), 0);
  },
  "skill-practice": (f) => {
    const sk = skillById(f.sid); if (!sk) return;
    skillLog(sk).push({ id: uid(), date: f.date || todayIso(), note: (f.note || "").slice(0, 200),
      best: Math.max(0, +f.best || 0), sessionId: "" });
    addXp(5, `${sk.name} practised`);
    touch("skill", sk.id, f.best ? `Practised · ${f.best}${sk.pbUnit ? " " + sk.pbUnit : ""}` : "Practised");
    setTimeout(() => openSkillDetail(sk.id), 0);
  },
  "skill-note": (f) => {
    const sk = skillById(f.sid); if (!sk || !String(f.text || "").trim()) return;
    const coach = String(f.coach || "").trim();
    if (coach) ensurePerson(coach);
    sk.notes = sk.notes || [];
    sk.notes.push({ id: uid(), at: new Date().toISOString(), text: f.text.trim().slice(0, 300), coach });
    setTimeout(() => openSkillDetail(sk.id), 0);
  },
  "ex-add": (f) => {
    const s = state.workout.sessions.find(x => x.id === f.sid); if (!s || !f.name) return;
    /* reuse the spelling already on record, so one exercise can't split its PR history across
       "Bench press" and "bench Press" */
    const known = exerciseNames().find(n => normName(n) === normName(f.name));
    const name = known || f.name.trim();
    s.exercises = s.exercises || [];
    s.exercises.push({ id: uid(), name, kind: known ? exerciseKind(known) : (f.kind || "reps"), sets: [] });
  },
  "set-add": (f) => {
    const s = state.workout.sessions.find(x => x.id === f.sid), ex = s && (s.exercises || []).find(e => e.id === f.eid);
    if (!ex) return;
    const before = prPrimary(ex.name, ex.kind);
    let set;
    if (f.kind === "time") set = { seconds: +f.seconds || 0 };
    else if (f.kind === "distance") set = { distance: +f.distance || 0, unit: f.unit || "km" };
    else set = { weight: +f.weight || 0, reps: +f.reps || 0 };
    ex.sets.push(set);
    const after = prPrimary(ex.name, ex.kind);
    if (after > before && before > 0) toast(`New PR on ${ex.name} — ${prLabel(ex.kind, after, ex.name)} 🏆`, "badge");
    addXp(5, "Set logged");
  },
  "meal-add": (f) => { state.nutrition.meals.push({ id: uid(), slot: f.slot, name: f.name, time: f.time || "", kcal: +f.kcal, protein: +f.protein, carbs: +f.carbs, fats: +f.fats, fiber: +f.fiber || 0 }); },
  "meal-edit": (f) => {
    const m = state.nutrition.meals.find(x => x.id === f.id);
    if (m) { m.slot = f.slot; m.name = f.name; m.time = f.time || ""; m.kcal = +f.kcal; m.protein = +f.protein; m.carbs = +f.carbs; m.fats = +f.fats; m.fiber = +f.fiber || 0; }
  },
  "nutrition-goals": (f) => { state.nutrition.goals = { kcal: +f.kcal, protein: +f.protein, carbs: +f.carbs, fats: +f.fats, fiber: +f.fiber || 0 }; },
  "sup-edit": (f) => { const x = state.nutrition.supplements.find(v => v.id === f.id); if (x) { x.name = f.name; x.emoji = f.emoji || x.emoji; x.dose = f.dose || ""; x.every = ["day","week","month"].includes(f.every) ? f.every : x.every; } },
  "project-edit": (f) => {
    const x = state.projects.find(v => v.id === f.id); if (!x) return;
    x.name = f.name; x.emoji = f.emoji || x.emoji; x.status = f.status || x.status;
    x.note = f.note || ""; x.purpose = (f.purpose || "").slice(0, 200);
    x.priority = f.priority || x.priority || "med";
    x.startedOn = f.startedOn || ""; x.deadline = f.deadline || "";
    x.nextMilestone = (f.nextMilestone || "").slice(0, 90); x.tags = parseTags(f.tags);
    if (x.status === "Done") { x.progress = 100; (x.milestones || []).forEach(m => { m.done = true; }); }
    touch("project", x.id, "Updated");
  },
  "social-edit": (f) => { const x = state.social.items.find(v => v.id === f.id); if (x) { x.title = f.title; x.emoji = f.emoji || x.emoji; x.target = Math.max(1, +f.target || 1); } },
  "memory-edit": (f) => { const x = state.memories.find(v => v.id === f.id); if (x) { x.title = f.title; x.note = f.note || ""; x.emoji = f.emoji || x.emoji; x.date = f.date || x.date; x.tags = parseTags(f.tags); x.felt = f.felt || ""; } },
  "fin-edit": (f) => { const x = state.finance.entries.find(v => v.id === f.id); if (x) { x.amount = Math.max(0, +f.amount || 0); if (CURRENCIES[f.cur]) x.cur = f.cur; x.date = f.date || x.date; x.category = f.category || x.category; x.note = f.note || ""; } },
  "class-edit": (f) => { const x = state.workout.classes.find(v => v.id === f.id); if (x) { x.name = f.name; x.total = Math.max(1, +f.total || x.total); x.price = +f.price || 0; if (CURRENCIES[f.cur]) x.cur = f.cur; x.start = f.start || x.start; } },
  "sup-add": (f) => { state.nutrition.supplements.push({ id: uid(), name: f.name, emoji: f.emoji || "💊", dose: f.dose || "", every: ["day", "week", "month"].includes(f.every) ? f.every : "day" }); },
  "learn-goal": (f) => {
    state.learning.monthlyHours = Math.max(1, +f.monthly || state.learning.monthlyHours);
    state.learning.weeklyHours = Math.max(1, +f.weekly || state.learning.weeklyHours);
  },
  "course-add": (f) => {
    if (!String(f.name || "").trim()) return;
    const c = born(Object.assign({ id: uid() }, courseFromForm(f)));
    coursesAll().push(c); touch("course", c.id, "Course added");
  },
  "course-edit": (f) => {
    const c = courseById(f.id); if (!c) return;
    Object.assign(c, courseFromForm(f), { updated: todayIso() });
    touch("course", c.id, "Updated");
    setTimeout(() => openCourseDetail(c.id), 0);
  },
  /* the minutes land in the monthly totals AND on the course — one set of minutes, two views of it */
  "course-study": (f) => {
    const c = courseById(f.cid); if (!c) return;
    const n = Math.max(1, +f.mins || 0), d = f.date || todayIso();
    const day = state.study.log[d] = state.study.log[d] || {};
    const bucket = c.kind === "university" ? "university" : "skills";
    day[bucket] = (day[bucket] || 0) + n;
    day.courses = day.courses || {};
    day.courses[c.id] = (day.courses[c.id] || 0) + n;
    addXp(Math.round(n / 6), "Study time");
    touch("course", c.id, `Studied ${n} min`);
    setTimeout(() => openCourseDetail(c.id), 0);
  },
  "learn-task-add": (f) => {
    if (!String(f.title || "").trim()) return;
    learnTasks().push(born({ id: uid(), title: f.title.trim(), kind: TASK_KINDS.some(x => x.id === f.kind) ? f.kind : "university",
      tag: (f.tag || "").slice(0, 60), due: f.due || "", done: false }));
  },
  "learn-task-edit": (f) => {
    const k = learnTasks().find(x => x.id === f.id); if (!k) return;
    k.title = f.title || k.title;
    if (TASK_KINDS.some(x => x.id === f.kind)) k.kind = f.kind;
    k.tag = (f.tag || "").slice(0, 60); k.due = f.due || k.due; k.updated = todayIso();
  },
  "book-add": (f) => { state.reading.books.push({ id: uid(), title: f.title, author: f.author || "Unknown", emoji: f.emoji || "📘", cover: f.cover || null, genre: f.genre || "", blurb: "", notes: "", recommenders: [], favorite: false, status: "current", pages: +f.pages, page: 0, rating: 0, started: todayIso() }); },
  "book-edit": (f) => {
    const b = state.reading.books.find(x => x.id === f.id);
    if (b) { b.title = f.title; b.author = f.author || b.author; b.pages = Math.max(1, +f.pages); b.page = clamp(b.page, 0, b.pages); b.genre = f.genre || ""; b.emoji = f.emoji || b.emoji; }
  },
  "media-add": (f) => {
    const type = f.type === "Series" ? "Series" : "Movie";
    state.media.push({ id: uid(), title: f.title, type, status: "watchlist", rating: 0,
      emoji: f.emoji || (type === "Series" ? "📺" : "🎬"), cover: null, genre: f.genre || "", year: f.year || "",
      blurb: "", notes: "", favorite: false, recommenders: [], director: "", cast: "",
      season: 1, epsDone: 0, epTotal: 0, started: "", finished: "" });
  },
  "rec-add": (f) => {
    if (!f.name) return true;
    const list = peopleListFor(f.kind, f.id);
    if (!list || list.length >= 12) return true;
    /* reuse the spelling Social already knows, so "mara" and "Mara" stay one person */
    const person = ensurePerson(f.name);
    const name = person ? person.name : f.name.trim();
    if (!list.some(n => normName(n) === normName(name))) list.push(name);
    return true;
  },
  "person-add": (f) => {
    if (!f.name || !f.name.trim()) return;
    const p = ensurePerson(f.name);
    if (!p) return;
    p.emoji = f.emoji || ""; p.relation = f.relation || ""; p.birthday = f.birthday || "";
    p.note = f.note || ""; p.tags = parseTags(f.tags);
  },
  "person-edit": (f) => {
    const p = personById(f.id); if (!p) return;
    const was = p.name;
    const name = (f.name || "").trim();
    if (name && normName(name) !== normName(was)) renamePersonEverywhere(was, name);
    if (name) p.name = name;
    p.emoji = f.emoji || ""; p.relation = f.relation || ""; p.birthday = f.birthday || "";
    p.note = f.note || ""; p.tags = parseTags(f.tags);
  },
  "media-edit": (f) => {
    const m = state.media.find(x => x.id === f.id);
    if (!m) return;
    m.title = f.title; m.type = f.type === "Series" ? "Series" : "Movie";
    m.year = f.year || ""; m.genre = f.genre || ""; m.emoji = f.emoji || m.emoji;
    if (m.type === "Series") { m.season = Math.max(1, +f.season || 1); m.epTotal = Math.max(0, +f.epTotal || 0); m.epsDone = clamp(m.epsDone || 0, 0, m.epTotal || Infinity); }
    else { m.director = f.director || ""; m.cast = f.cast || ""; }
  },
  "project-add": (f) => {
    const p = born({ id: uid(), name: f.name, emoji: f.emoji || "🚀",
      status: f.status || "Planning", progress: 0, note: f.note || "",
      purpose: (f.purpose || "").slice(0, 200), priority: f.priority || "med",
      startedOn: f.startedOn || "", deadline: f.deadline || "",
      nextMilestone: (f.nextMilestone || "").slice(0, 90), tags: parseTags(f.tags),
      milestones: [], files: [] });
    state.projects.push(p); touch("project", p.id, "Project created");
  },
  "pms-add": (f) => {
    const p = state.projects.find(x => x.id === f.pid);
    if (p && (f.text || "").trim()) {
      p.milestones = p.milestones || [];
      p.milestones.push({ id: uid(), text: f.text.trim().slice(0, 120), done: false });
      touch("project", p.id, `Milestone added: ${f.text.trim().slice(0, 60)}`);
      setTimeout(() => openProjectDetail(p.id), 0);
    }
  },
  "fin-entry": (f) => {
    const amt = +f.amount || 0; if (amt <= 0) return;
    const type = f.type === "income" ? "income" : "expense";
    state.finance.entries.push({ id: uid(), date: f.date || todayIso(), type, amount: amt, cur: CURRENCIES[f.cur] ? f.cur : defaultCur(), category: f.category || "Other", note: f.note || "" });
    addXp(3, type === "income" ? "Income logged" : "Expense logged");
  },
  "social-add": (f) => { state.social.items.push({ id: uid(), title: f.title, emoji: f.emoji || "🤝", target: Math.max(1, +f.target) }); },
  "memory-add": (f) => { state.memories.push({ id: uid(), date: f.date, title: f.title, note: f.note || "", emoji: f.emoji || "📸", hue: Math.floor(Math.random() * 360), photos: [], tags: parseTags(f.tags), felt: f.felt || "", people: parseTags(f.people), starred: false }); addXp(10, "Memory saved"); },
  "todo-add": (f) => {
    if (!f.text) return;
    let habitId = "", supId = "", areaId = "";
    if (f.habitId === "none") { /* explicitly unlinked */ }
    else if (f.habitId) { habitId = f.habitId; }
    else { const link = suggestLinkForText(f.text); if (link.type === "sup") supId = link.id; else if (link.type === "area") areaId = link.id; else habitId = link.id; }
    state.todos.push(born({ id: uid(), text: f.text, done: false, date: todayIso(), time: f.time || "",
      habitId, supId, areaId, order: nextTaskOrder(), repeat: null, seriesId: "", from: "",
      priority: "med", estMin: 0, linkGoalId: "", projectId: "", focus: false, hard: false }));
  },
  "focus-start": (f) => { startFocus(state.todos.find(x => x.id === f.id), f.mins); },
  "focus-log": (f) => { finishFocus(!!f.markDone, f); },
  "profile-save": (f) => { state.profile.name = f.name; state.profile.avatar = f.avatar || state.profile.avatar; state.profile.onboarded = true; },
  "data-reset": () => { clearAllMedia(); localStorage.removeItem(STORE_KEY); state = defaultState(); save(); setTimeout(() => maybeOnboard(), 60); },
  "data-fresh": () => {
    clearAllMedia();
    const p = state.profile;
    state = defaultState();
    state.profile = Object.assign(state.profile, p, { onboarded: true });
    save(); toast("Fresh start — it's all yours ✨");
  },
  "data-sample": () => {
    clearAllMedia();
    const p = state.profile;
    /* migrate(), same as a fresh install — the seed is written against today's shape, and skipping
       the ladder here left sample data missing every field a later migration backfills */
    state = migrate(seedState(defaultState()));
    state.profile = Object.assign(state.profile, p, { onboarded: true });
    save(); toast("Sample data loaded");
  },
};

/* changes (inputs) */
const CHANGES = {
  "sleep-set": (el) => { const d = dayCursor("health"); const l = state.health.log[d] = healthOn(d); l.sleep = clamp(+el.value || 0, 0, 24); save(); render(); },
  "habit-note": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { const e = ensureHabitEntry(h, dayCursor("habits")); e.note = el.value.slice(0, 600); save(); } },
  "habit-goal-toggle": (el) => { const h = state.habits.find(x => x.id === el.dataset.h); if (h) { h.goalIds = h.goalIds || []; const i = h.goalIds.indexOf(el.dataset.g); if (el.checked && i < 0) h.goalIds.push(el.dataset.g); else if (!el.checked && i >= 0) h.goalIds.splice(i, 1); save(); } },
  "goal-habit-toggle": (el) => { const h = state.habits.find(x => x.id === el.dataset.h); if (h) { h.goalIds = h.goalIds || []; const i = h.goalIds.indexOf(el.dataset.g); if (el.checked && i < 0) h.goalIds.push(el.dataset.g); else if (!el.checked && i >= 0) h.goalIds.splice(i, 1); save(); } },
  "habit-amount": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { const was = habitMet(h, dayCursor("habits")); const e = ensureHabitEntry(h, dayCursor("habits")); e.amount = Math.max(0, +el.value || 0); if (!was && habitMet(h, dayCursor("habits")) && dayCursor("habits") === todayIso()) addXp(10, h.name); save(); render(); openHabitDetail(h.id); } },
  "reflection": (el) => {
    const v = el.value.trim();
    if (v) { state.reflections[todayIso()] = v.slice(0, 1000); const jid = suggestHabitForText("reflection journal"); if (jid) completeHabitToday(jid); }
    else delete state.reflections[todayIso()];
    save();
  },
  "task-text": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.text = el.value.slice(0, 120); save(); } },
  "task-time": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.time = el.value || ""; save(); } },
  "task-prio": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.priority = PRIORITY[el.value] ? el.value : "med"; save(); render(); } },
  "task-est": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.estMin = clamp(parseInt(el.value, 10) || 0, 0, 1440); save(); render(); } },
  "task-serves": (el) => {
    const td = state.todos.find(x => x.id === el.dataset.id); if (!td) return;
    const v = el.value || "";
    td.linkGoalId = v.startsWith("g:") ? v.slice(2) : "";
    td.projectId = v.startsWith("p:") ? v.slice(2) : "";
    save(); render(); openTaskDetail(td.id);
  },
  /* Exactly one hard task, the same one-of-many rule the app already uses elsewhere: setting this
     clears whoever held it, so the card can never show two "the one thing"s. */
  "task-hard": (el) => {
    const td = state.todos.find(x => x.id === el.dataset.id); if (!td) return;
    if (el.checked) { state.todos.forEach(x => { x.hard = false; }); td.hard = true; td.focus = false; }
    else td.hard = false;
    save(); render(); openTaskDetail(td.id);
  },
  "task-repeat": (el) => {
    const td = state.todos.find(x => x.id === el.dataset.id); if (!td) return;
    if (!el.value) setSeriesRepeat(td, null);
    else {
      if (!td.seriesId) td.seriesId = uid();      // a series id is what ties future copies together
      setSeriesRepeat(td, el.value === "days"
        ? { mode: "days", days: (td.repeat && td.repeat.days || []).length ? td.repeat.days : [WEEKDAY_MON0(todayIso())] }
        : { mode: "daily" });
    }
    save(); render(); openTaskDetail(td.id);
  },
  "task-repeat-day": (el) => {
    const td = state.todos.find(x => x.id === el.dataset.id);
    if (!td || !td.repeat || td.repeat.mode !== "days") return;
    const d = +el.dataset.d, days = td.repeat.days || [];
    setSeriesRepeat(td, { mode: "days", days: el.checked ? [...new Set([...days, d])].sort() : days.filter(x => x !== d) });
    save(); render(); openTaskDetail(td.id);
  },
  "task-link": (el) => {
    const td = state.todos.find(x => x.id === el.dataset.id); if (!td) return;
    const v = el.value || "";
    td.habitId = v.startsWith("h:") ? v.slice(2) : "";
    td.supId = v.startsWith("s:") ? v.slice(2) : "";
    td.areaId = v.startsWith("a:") ? v.slice(2) : "";
    save(); render(); openTaskDetail(td.id);
  },
  "session-media": (el) => {
    const s = state.workout.sessions.find(x => x.id === el.dataset.id); if (!s) return;
    storeMediaFile(el.files[0], (ref) => { s.media = s.media || []; s.media.push(ref); save(); render(); toast(`${ref.kind === "video" ? "Video" : "Photo"} added 📎`); });
  },
  "meal-photo-add": (el) => {
    const t = todayIso(), id = el.dataset.id;
    storeMediaFile(el.files[0], (ref) => {
      const day = state.nutrition.photos[t] = state.nutrition.photos[t] || {};
      (day[id] = day[id] || []).push(ref);
      save(); render(); toast("Meal photo added 📸");
    });
  },
  "book-page-set": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (!b) return;
    const from = b.page || 0;
    b.page = clamp(+el.value || 0, 0, b.pages);
    logPages(b.page - from);
    save(); render(); openBookDetail(b.id);
  },
  "book-notes": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (b) { b.notes = el.value.slice(0, 1200); save(); }   // no re-render: keep the textarea focused
  },
  "book-blurb": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (b) { b.blurb = el.value.slice(0, 140); save(); }
  },
  "media-blurb": (el) => {
    const m = state.media.find(x => x.id === el.dataset.id);
    if (m) { m.blurb = el.value.slice(0, 140); save(); }
  },
  "media-notes": (el) => {
    const m = state.media.find(x => x.id === el.dataset.id);
    if (m) { m.notes = el.value.slice(0, 1200); save(); }
  },
  "media-ep-set": (el) => {
    const m = state.media.find(x => x.id === el.dataset.id);
    if (m) { m.epsDone = clamp(+el.value || 0, 0, m.epTotal || Infinity); if (m.status === "watchlist" && m.epsDone > 0) m.status = "watching"; save(); render(); openMediaDetail(m.id); }
  },
  "media-eptotal-set": (el) => {
    const m = state.media.find(x => x.id === el.dataset.id);
    if (m) { m.epTotal = Math.max(0, +el.value || 0); m.epsDone = clamp(m.epsDone || 0, 0, m.epTotal || Infinity); save(); render(); openMediaDetail(m.id); }
  },
  "media-cover-pick": (el) => {
    const m = state.media.find(x => x.id === el.dataset.id);
    if (!m) return;
    processCover(el.files[0], (dataUrl) => {
      try { m.cover = dataUrl; save(); render(); openMediaDetail(m.id); toast("Poster updated 🎬"); }
      catch { toast("That image is too large to save"); }
    });
  },
  "book-cover-pick": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (!b) return;
    processCover(el.files[0], (dataUrl) => {
      try { b.cover = dataUrl; save(); render(); openBookDetail(b.id); toast("Cover updated 📚"); }
      catch { toast("That image is too large to save"); }
    });
  },
  "book-file-add": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (!b) return;
    storeFile(el.files[0], (ref) => { if (b.file) mediaDelete(b.file.id); b.file = ref; save(); render(); openBookDetail(b.id); toast("File attached 📎"); });
  },
  "memory-search": (el) => { ui.memorySearch = el.value; render(); const q = $('[data-change="memory-search"]'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } },
  "memory-photo-add": (el) => {
    const m = state.memories.find(x => x.id === el.dataset.id); if (!m) return;
    storeMediaFile(el.files[0], (ref) => { m.photos = m.photos || []; m.photos.push(ref); save(); render(); openMemoryDetail(m.id); toast("Photo added 📸"); });
  },
  "skill-media": (el) => {
    const sk = skillById(el.dataset.id); if (!sk) return;
    storeMediaFile(el.files[0], (ref) => {
      sk.media = sk.media || []; sk.media.push(ref);
      touch("skill", sk.id, "Clip added");
      save(); render(); openSkillDetail(sk.id); toast("Saved 🎬");
    });
  },
  "project-file-add": (el) => {
    const p = state.projects.find(x => x.id === el.dataset.id); if (!p) return;
    storeMediaFile(el.files[0], (ref) => {
      p.files = p.files || []; p.files.push(ref);
      touch("project", p.id, "File added");
      save(); render(); openProjectDetail(p.id); toast("File added 📎");
    });
  },
  "profile-currency": (el) => { if (CURRENCIES[el.value]) { state.profile.currency = el.value; save(); render(); } },
  /* the date is stamped alongside the rate, because a rate without a date is a number pretending
     not to go stale */
  "profile-fx": (el) => {
    const v = Math.max(0, +el.value || 0);
    state.profile.fxRate = v;
    state.profile.fxSetOn = v ? todayIso() : "";
    save(); render();
  },
  "tmdb-key": (el) => { state.profile.tmdbKey = el.value.trim(); save(); },

  /* reminders */
  "rem-after": (el) => { state.reminders.after = el.value || "18:00"; save(); startReminders(); syncPushSchedule(); },
  "rem-quiet": (el) => { state.reminders.quietFrom = el.value || "22:00"; save(); startReminders(); },
  "rem-kind":  (el) => { state.reminders.kinds[el.dataset.id] = el.checked; save(); startReminders(); syncPushSchedule(); },
  "book-cover-new": (el) => {
    processCover(el.files[0], (dataUrl) => {
      const field = $("#coverField"), preview = $("#coverPreview");
      if (field) field.value = dataUrl;
      if (preview) { preview.style.backgroundImage = `url('${dataUrl}')`; preview.classList.add("has-img"); preview.innerHTML = ""; }
    });
  },
};

/* ================= events ================= */
/* ================= drag to reorder =================
   One implementation on Pointer Events, so touch and mouse share a path — no library, no build step.

   Three things this has to get right, all of them learned the hard way by every drag list ever:

   1. `touch-action: none` goes on the HANDLE, never the row. On the row it would swallow vertical
      swipes and the page would stop scrolling on a phone.
   2. A drag ends in a `click`. Without suppressing it, letting go of a task row opens its detail
      sheet every single time. Anything past the threshold sets a flag the click listener honours.
   3. Under the threshold it is still a TAP, and must behave like one — otherwise "hold to drag"
      quietly eats the fast way to tick a habit.

   Reordering also stays reachable from each item's detail sheet, because you cannot drag with a
   keyboard and this must not be the only way. */

const DRAG_SLOP = 6;            // mouse: px of movement before it counts as a drag
const DRAG_TOUCH_SLOP = 10;     // finger: a stationary finger still wanders a few px
const DRAG_HOLD_MS = 400;       // finger: how long you must hold still before a drag arms
let _drag = null;
let _dragSuppressClick = false;

function dragList(el) { return el ? el.closest("[data-drag-list]") : null; }

/* A finger does not mean the same thing as a mouse.
   With a mouse, pressing a drag handle is unambiguous — nothing else starts there, so the drag can
   begin at once. With a finger it is the opposite: people scroll a list by putting a thumb wherever
   it lands, which is often straight on the handle. Engaging immediately meant an ordinary scroll
   picked a habit up and dropped it somewhere else. So on touch the drag must be ASKED for: hold
   still for a moment, feel it lift, then move. Move before that and it was a scroll, and the page
   scrolls normally. */
function armDrag() {
  const g = _drag;
  if (!g || g.armed) return;
  g.armed = true;
  try { g.handle.setPointerCapture(g.pid); } catch { /* pointer already gone */ }
  g.row.classList.add("dragging");
  g.list.classList.add("is-dragging");
  /* say it out loud, so picking something up is never a surprise */
  if (navigator.vibrate && !reduceMotion()) { try { navigator.vibrate(12); } catch { /* not allowed */ } }
}
function cancelDrag() {
  clearTimeout(_drag && _drag.holdTimer);
  if (_drag) { _drag.row.classList.remove("dragging"); _drag.list.classList.remove("is-dragging"); }
  _drag = null;
}

function onDragStart(e) {
  if (e.button != null && e.button !== 0) return;             // right-click / middle-click never drags
  const handle = e.target.closest("[data-drag]");
  if (!handle) return;
  const row = handle.closest("li");
  const list = dragList(row);
  if (!row || !list) return;
  const rows = [...list.querySelectorAll(":scope > li")];
  if (rows.length < 2) return;
  const touch = e.pointerType === "touch" || e.pointerType === "pen";
  _drag = {
    list, row, handle, kind: list.dataset.dragList, id: handle.dataset.drag,
    rows, from: rows.indexOf(row), to: rows.indexOf(row),
    startY: e.clientY, startX: e.clientX, h: row.getBoundingClientRect().height,
    moved: false, pid: e.pointerId, touch,
    slop: touch ? DRAG_TOUCH_SLOP : DRAG_SLOP,
    armed: false, holdTimer: null,
  };
  /* a mouse arms at once; a finger has to hold still first */
  if (!touch) armDrag();
  else _drag.holdTimer = setTimeout(armDrag, DRAG_HOLD_MS);
}
function onDragMove(e) {
  const g = _drag;
  if (!g || e.pointerId !== g.pid) return;
  const dy = e.clientY - g.startY;
  if (!g.armed) {
    /* Moving before the hold completes means this was a scroll, not a drag. Let go of it entirely
       so the page scrolls the way it always has. */
    if (Math.abs(dy) > 4 || Math.abs(e.clientX - g.startX) > 4) cancelDrag();
    return;
  }
  if (!g.moved && Math.abs(dy) < g.slop) return;              // armed, but not yet moving
  g.moved = true;
  e.preventDefault();
  g.row.style.transform = `translateY(${dy}px)`;
  /* which slot are we over? measured in whole rows, so the list can have any row height */
  const to = clamp(g.from + Math.round(dy / g.h), 0, g.rows.length - 1);
  if (to !== g.to) {
    g.to = to;
    g.rows.forEach((r, i) => {
      if (r === g.row) return;
      /* everything between the origin and the target slides one row out of the way */
      const shift = (i > g.from && i <= to) ? -g.h : (i < g.from && i >= to) ? g.h : 0;
      r.style.transform = shift ? `translateY(${shift}px)` : "";
    });
  }
}
/* iOS decides whether a gesture scrolls the page from `touchmove`, and it will not honour
   preventDefault from a passive listener. This is the one that actually stops the page moving
   under a habit you are carrying — and it only fires once a drag is armed, so an ordinary swipe
   across the handle still scrolls. */
function onTouchMove(e) {
  if (_drag && _drag.armed) e.preventDefault();
}
function onDragEnd(e) {
  const g = _drag;
  if (!g || (e && e.pointerId !== g.pid)) return;
  clearTimeout(g.holdTimer);
  _drag = null;
  g.rows.forEach(r => { r.style.transform = ""; });
  g.row.classList.remove("dragging");
  g.list.classList.remove("is-dragging");
  if (!g.moved) return;                                      // a tap: let the click through
  /* A drag: swallow the click it produces. The flag must NOT stay armed — a drag whose pointerup
     lands somewhere that yields no click would otherwise poison the next legitimate tap, anywhere
     in the app. The synthetic click fires before this timeout, so one turn of the loop is exactly
     the right window. */
  _dragSuppressClick = true;
  setTimeout(() => { _dragSuppressClick = false; }, 0);
  if (g.to !== g.from) commitDrag(g.kind, g.rows.map(r => r.dataset.rowId), g.from, g.to);
}
/* Write the new sequence into the same `order` field the arrows use, so both paths agree. */
function commitDrag(kind, ids, from, to) {
  const moved = ids.splice(from, 1)[0];
  ids.splice(to, 0, moved);
  const arr = kind === "habits" ? state.habits : state.todos;
  ids.forEach((id, i) => { const it = arr.find(x => x.id === id); if (it) it.order = i; });
  save(); render();
}
function bindDrag() {
  document.addEventListener("pointerdown", onDragStart);
  document.addEventListener("pointermove", onDragMove, { passive: false });
  document.addEventListener("pointerup", onDragEnd);
  document.addEventListener("pointercancel", onDragEnd);
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  /* a scroll that begins elsewhere and runs under a waiting finger is still a scroll */
  window.addEventListener("scroll", () => { if (_drag && !_drag.armed) cancelDrag(); }, { passive: true });
}

function bindEvents() {
  document.addEventListener("click", (e) => {
    /* a finished drag still fires a click on the row it dropped — without this, letting go of a
       task would open its detail sheet every time */
    if (_dragSuppressClick) { _dragSuppressClick = false; e.preventDefault(); e.stopPropagation(); return; }
    const act = e.target.closest("[data-action]");
    if (act && ACTIONS[act.dataset.action]) { ACTIONS[act.dataset.action](act); return; }
    const nav = e.target.closest("[data-nav]");
    if (nav) { go(nav.dataset.nav); return; }
    if (e.target === $("#modalBackdrop")) closeModal();
    if (e.target === $("#drawerBackdrop")) closeDrawer();
  });
  document.addEventListener("submit", (e) => {
    const sf = e.target.closest("[data-search-form]");
    if (sf) { e.preventDefault(); runSearch(sf.dataset.searchForm); return; }
    const form = e.target.closest("[data-submit]");
    if (!form) return;
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    Object.keys(data).forEach(k => { if (typeof data[k] === "string") data[k] = data[k].trim(); });
    const fn = SUBMITS[form.dataset.submit];
    if (fn) {
      const keepOpen = fn(data) === true;   // rec-add reopens the detail modal itself
      save();
      if (!keepOpen) closeModal();
      checkBadges();
      render();
      if (keepOpen && form.dataset.submit === "rec-add") reopenDetail(data.kind, data.id);
    }
  });
  document.addEventListener("change", (e) => {
    const el = e.target.closest("[data-change]");
    if (el && CHANGES[el.dataset.change]) CHANGES[el.dataset.change](el);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal(); closeDrawer(); }
  });
  $("#themeBtn").addEventListener("click", toggleTheme);
  $("#menuBtn").addEventListener("click", openDrawer);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { applyTheme(); drawCharts(); });
  let rT; window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(drawCharts, 150); });
}

/* ================= onboarding ================= */
function maybeOnboard() {
  if (loadIssue) return;          // recovery prompt takes precedence over onboarding
  if (state.profile.onboarded) return;
  formModal("Welcome to LifeHub 🌿",
    `<p class="soft" style="margin-bottom:12px">All your life, in one place — habits, health, learning, projects and more. Earn XP, keep streaks, collect badges.</p>` +
    fld("What's your name?", txt("name", "e.g. Selene")) +
    fld("Pick an avatar", avatarPick("🌱")),
    "profile-save", "Let's go");
}

/* ================= init ================= */
load();
applyTheme();
/* a notification tap can open us cold at #habits — honour it before the first paint */
{ const h = (location.hash || "").replace(/^#/, ""); if (h && VIEWS[h]) currentView = h; }
bindEvents();
bindDrag();
bindTip();
render();
showLoadIssue();
/* spawn today's repeating tasks, prune old copies, then offer anything left unfinished from before */
if (!loadIssue) { if (rollTasks()) { save(); render(); } setTimeout(() => maybeCarryForward(), 900); }
maybeOnboard();

/* cloud sync: restore any saved session, then pull the latest snapshot (HTTPS origins only) */
if (location.protocol === "https:" && window.crypto && crypto.subtle) {
  initCloud();
  window.addEventListener("online", () => { if (isSignedIn() && cloud.key && cloud._dirty) schedulePush(); });
}

/* PWA: register the service worker for offline + installability.
   localhost counts as a secure context, so it registers there too — which is what makes the
   caching behaviour testable instead of only observable in production. */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline unsupported here — app still works */ });
  });
  /* tapping a notification asks the worker to focus us and land on the right section */
  navigator.serviceWorker.addEventListener("message", (e) => {
    const d = e.data || {};
    if (d.type === "nav" && d.view && VIEWS[d.view]) { go(d.view); window.scrollTo({ top: 0 }); }
    /* the browser rotated our push subscription — re-register it before reminders quietly die */
    if (d.type === "push-resub" && d.sub && isSignedIn()) {
      if (d.old) restFetch(`push_subs?endpoint=eq.${encodeURIComponent(d.old)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }).catch(() => {});
      savePushSub(d.sub).catch(() => {});
    }
  });
}

/* reminders: start the local nudge loop, and re-check whenever the app comes back to the foreground.
   Coming back into view is the moment that matters — it's when the browser is guaranteed to run us. */
startReminders();
/* Pick up a session that was running when the page was last alive. Nothing about it lived in a
   closure, so this is just "look at state and start counting again". */
startFocusTimer();
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  tickReminders();
  /* a background tab has its interval throttled to about once a minute, so the displayed time is
     stale the moment you look at it again — re-sync from the clock rather than from the ticks */
  startFocusTimer();
  /* the app is often left open overnight — coming back is when "today" actually changes */
  if (!loadIssue && state.tasksRolledOn !== todayIso()) { if (rollTasks()) save(); render(); maybeCarryForward(); }
});
window.addEventListener("focus", () => { tickReminders(); startFocusTimer(); });
