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
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

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
    clock:     w('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.4 2"/>'),
    sliders:   w('<path d="M4.5 21v-6.5M4.5 10V3M12 21V11.5M12 7.5V3M19.5 21v-4.5M19.5 12V3M2 14.5h5M9.5 7.5h5M17 16.5h5"/>'),
    menu:      w('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    chevL:     w('<path d="M15 5l-7 7 7 7"/>'),
    chevR:     w('<path d="M9 5l7 7-7 7"/>'),
    play:      w('<path d="M7 5v14l11-7-11-7Z"/>'),
    link:      w('<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>'),
    tv:        w('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 21h8M12 3l4 3H8l4-3Z"/>'),
    calc:      w('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h4M8 15h.01M12 15h.01M8 19h.01M12 19h.01M16 15v4"/>'),
    cart:      w('<path d="M3 4h2l2.4 12.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6"/><circle cx="9.5" cy="20.5" r="1.3"/><circle cx="17.5" cy="20.5" r="1.3"/>'),
    spark:     w('<path d="M12 3.5 13.7 9 19 10.7 13.7 12.4 12 18l-1.7-5.6L5 10.7 10.3 9 12 3.5Z"/><path d="M18.6 15.6l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.4Z"/>'),
    download:  w('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>'),
    upload:    w('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 8 5-5 5 5M12 3v12"/>'),
    grid:      w('<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>'),
  };
})();

/* ================= life areas registry ================= */
const AREAS = [
  { id: "habits",     name: "Habit Tracker",      icon: "target",    hue: "#6a5ae0" },
  { id: "health",     name: "Health",             icon: "heart",     hue: "#e5484d" },
  { id: "workout",    name: "Workout",            icon: "dumbbell",  hue: "#f76b15" },
  { id: "nutrition",  name: "Nutrition",          icon: "apple",     hue: "#30a46c" },
  { id: "skills",     name: "Skills & Education", icon: "gradcap",   hue: "#8e4ec6" },
  { id: "reading",    name: "Reading",            icon: "book",      hue: "#0091ff" },
  { id: "media",      name: "Movies & Series",    icon: "film",      hue: "#d6409f" },
  { id: "university", name: "University",         icon: "building",  hue: "#3e63dd" },
  { id: "work",       name: "Work Preparation",   icon: "briefcase", hue: "#ad6f2d" },
  { id: "projects",   name: "Projects",           icon: "rocket",    hue: "#12a594" },
  { id: "social",     name: "Social",             icon: "users",     hue: "#e93d82" },
  { id: "memories",   name: "Memories",           icon: "camera",    hue: "#00a2c7" },
  { id: "journal",    name: "Journal",            icon: "pen",       hue: "#7c66dc" },
];
const areaOf = (id) => AREAS.find(a => a.id === id);

const NAV_GROUPS = [
  { label: "Overview", items: [
    { id: "today",     name: "Today",     icon: "spark" },
    { id: "dashboard", name: "Dashboard", icon: "home" },
    { id: "progress",  name: "Progress",  icon: "chart" },
  ]},
  { label: "Daily", items: ["habits", "health", "workout", "nutrition", "journal"].map(areaOf) },
  { label: "Growth", items: ["skills", "reading", "university", "work", "projects"].map(areaOf) },
  { label: "Life", items: ["media", "social", "memories"].map(areaOf) },
  { label: "System", items: [
    { id: "integrations", name: "Integrations", icon: "zap" },
    { id: "profile",      name: "Profile",      icon: "user" },
  ]},
];

/* ================= state ================= */
const STORE_KEY = "lifehub-v1";
let state = null;

function defaultState() {
  return {
    profile: { name: "", avatar: "🌱", theme: "auto", onboarded: false, apiKey: "", metrics: null },
    xp: 0,
    xpLog: {},                 // {date: xp gained}
    claimed: {},               // {date: {missionId:true}}
    badges: {},                // {badgeId: dateEarned}
    visited: {},               // {viewId: true}
    goals: [],                 // {id,title,emoji,milestones:[{id,text,done}]}
    todos: [],                 // {id,text,done,date}
    habits: [],                // {id,name,emoji,kind,goalId,milestones,log:{date:{done,note,workoutId}}}
    health: { goals: { steps: 10000, water: 2, sleep: 8 }, log: {} }, // log[date]={steps,water,sleep,mood}
    workout: { weeklyGoal: 5, plan: [], log: {}, sessions: [] },  // log[date]=[planIds]; sessions:[{id,date,category,planId,note,exercises,media}]
    nutrition: { goals: { kcal: 2200, protein: 150, carbs: 250, fats: 70 }, meals: [], log: {}, shopping: [] },
    skills: { monthlyHours: 10, courses: [], log: {} }, // log[date]=minutes
    reflections: {},           // {date: text}
    reading: { yearlyGoal: 12, books: [], log: {} },
    media: [],                 // {id,title,type,status,rating}
    university: { weeklyHours: 20, tasks: [], log: {} },
    work: { items: [] },       // {id,title,done}
    projects: [],              // {id,name,emoji,status,progress,note}
    social: { items: [], log: {} }, // items {id,title,emoji,target}; log[weekKey]={itemId:count}
    memories: [],              // {id,date,title,note,emoji,hue}
    journal: [],               // {id,date,text,mood,tags:[]}
    integrations: [
      { id: "gcal",    name: "Google Calendar", desc: "Sync events & tasks",     on: true },
      { id: "notion",  name: "Notion",          desc: "Sync notes & tasks",      on: true },
      { id: "gfit",    name: "Google Fit",      desc: "Sync health data",        on: false },
      { id: "spotify", name: "Spotify",         desc: "Sync what you listen to", on: false },
      { id: "youtube", name: "YouTube",         desc: "Sync watch history",      on: false },
    ],
  };
}

function seedState(s) {
  const t = todayIso();
  const H = (o) => Object.assign({ id: uid(), emoji: "✅", type: "build", target: 0, unit: "", why: "", cadence: { mode: "daily" }, kind: "", goalId: null, milestones: [], log: {} }, o);
  s.habits = [
    H({ name: "Morning meditation", emoji: "🧘", why: "Start calm, stay calm." }),
    H({ name: "Workout", emoji: "💪", kind: "workout", cadence: { mode: "days", days: [0, 2, 4] }, why: "Strong body, strong mind." }),
    H({ name: "Drink water", emoji: "💧", type: "quantity", target: 2, unit: "L", why: "Energy & focus." }),
    H({ name: "Read", emoji: "📖", type: "quantity", target: 20, unit: "pages" }),
    H({ name: "No sugar", emoji: "🍬", type: "avoid", why: "Steady energy, clear skin." }),
  ];
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
  s.nutrition.meals = [
    { id: uid(), slot: "Breakfast", name: "Oatmeal, banana & nuts",       kcal: 420, protein: 16, carbs: 62, fats: 13 },
    { id: uid(), slot: "Lunch",     name: "Grilled chicken, rice, salad", kcal: 650, protein: 48, carbs: 70, fats: 16 },
    { id: uid(), slot: "Dinner",    name: "Salmon, quinoa & veggies",     kcal: 580, protein: 40, carbs: 48, fats: 22 },
    { id: uid(), slot: "Snacks",    name: "Greek yogurt & berries",       kcal: 220, protein: 18, carbs: 24, fats: 6 },
  ];
  s.skills.courses = [
    { id: uid(), name: "Python for Beginners", progress: 60 },
    { id: uid(), name: "UI/UX Design",         progress: 40 },
    { id: uid(), name: "Digital Marketing",    progress: 20 },
  ];
  s.reading.books = [
    { id: uid(), title: "Atomic Habits", author: "James Clear", emoji: "⚛️", status: "current", pages: 320, page: 218, rating: 0 },
    { id: uid(), title: "Deep Work", author: "Cal Newport", emoji: "🎯", status: "current", pages: 296, page: 40, rating: 0 },
    { id: uid(), title: "The Psychology of Money", author: "M. Housel", emoji: "🪙", status: "done", pages: 256, page: 256, rating: 5 },
    { id: uid(), title: "How to Win Friends…", author: "D. Carnegie", emoji: "🤝", status: "wishlist", pages: 288, page: 0, rating: 0 },
  ];
  s.media = [
    { id: uid(), title: "Interstellar",    type: "Movie",  status: "watchlist", rating: 0 },
    { id: uid(), title: "Breaking Bad",    type: "Series", status: "watching",  rating: 0 },
    { id: uid(), title: "The Dark Knight", type: "Movie",  status: "done",      rating: 5 },
    { id: uid(), title: "Stranger Things", type: "Series", status: "watching",  rating: 0 },
  ];
  s.university.tasks = [
    { id: uid(), title: "Calculus assignment", due: addDays(t, 3), done: false },
    { id: uid(), title: "Physics lab report",  due: addDays(t, 5), done: false },
    { id: uid(), title: "History essay",       due: addDays(t, 8), done: false },
  ];
  s.work.items = [
    { id: uid(), title: "Resume building",    done: true },
    { id: uid(), title: "LinkedIn profile",   done: true },
    { id: uid(), title: "Cover letter",       done: false },
    { id: uid(), title: "Portfolio",          done: false },
    { id: uid(), title: "Interview practice", done: false },
  ];
  s.projects = [
    { id: uid(), name: "LifeHub app",       emoji: "🌿", status: "In progress", progress: 60, note: "" },
    { id: uid(), name: "AI tools research", emoji: "🤖", status: "In progress", progress: 40, note: "" },
    { id: uid(), name: "YouTube channel",   emoji: "🎬", status: "Planning",    progress: 20, note: "" },
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
function migrate(s) {
  s.profile = s.profile || {};
  if (s.profile.apiKey == null) s.profile.apiKey = "";
  if (s.profile.metrics === undefined) s.profile.metrics = null;
  s.goals = s.goals || [];
  s.todos = s.todos || [];
  s.workout = s.workout || {};
  s.workout.sessions = s.workout.sessions || [];
  s.nutrition = s.nutrition || {};
  s.nutrition.shopping = s.nutrition.shopping || [];
  s.reflections = s.reflections || {};
  (s.habits || []).forEach(h => {
    h.milestones = h.milestones || [];
    h.type = h.type || "build";
    h.cadence = h.cadence || { mode: "daily" };
    if (h.why == null) h.why = "";
    if (h.target == null) h.target = 0;
    if (h.unit == null) h.unit = "";
  });
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    state = migrate(raw ? Object.assign(defaultState(), JSON.parse(raw)) : seedState(defaultState()));
  } catch { state = seedState(defaultState()); }
  save();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); return true; }
  catch (e) {
    toast("Storage is full — try removing a book cover or two");
    return false;
  }
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
  return id;
}
async function mediaGet(id) {
  const db = await mediaDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("blobs", "readonly");
    const rq = tx.objectStore("blobs").get(id);
    rq.onsuccess = () => res(rq.result || null); rq.onerror = () => rej(rq.error);
  });
}
async function mediaDelete(id) {
  try {
    const db = await mediaDB();
    await new Promise((res) => { const tx = db.transaction("blobs", "readwrite"); tx.objectStore("blobs").delete(id); tx.oncomplete = res; tx.onerror = res; });
  } catch {}
  if (_urlCache[id]) { URL.revokeObjectURL(_urlCache[id]); delete _urlCache[id]; }
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
        if (!blob) { host.innerHTML = `<span class="media-missing">media unavailable</span>`; continue; }
        url = URL.createObjectURL(blob); _urlCache[id] = url;
      }
      host.innerHTML = host.dataset.mediaKind === "video"
        ? `<video src="${url}" controls playsinline preload="metadata"></video>`
        : `<img src="${url}" alt="" loading="lazy">`;
    } catch { host.innerHTML = `<span class="media-missing">media unavailable</span>`; }
  }
}
/* read a File into IndexedDB; images are downscaled unless they're already small */
function storeMediaFile(file, cb) {
  if (!file) return;
  const kind = file.type.startsWith("video") ? "video" : "image";
  if (kind === "video" && file.size > 60 * 1024 * 1024) { toast("That video is over 60MB — try a shorter clip"); return; }
  const finish = (blob) => mediaPut(blob).then(id => cb({ id, kind })).catch(() => toast("Couldn't save that media"));
  if (kind === "image") {
    processCover(file, (dataUrl) => fetch(dataUrl).then(r => r.blob()).then(finish), 900);
  } else {
    finish(file);
  }
}

/* ================= day navigation (Habits / Workout / Skills) ================= */
function dayCursor(view) { state._cursor = state._cursor || {}; return state._cursor[view] || todayIso(); }
function setCursor(view, d) { state._cursor = state._cursor || {}; state._cursor[view] = d; }
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
  const c = h.cadence || { mode: "daily" };
  if (c.mode === "days") return (c.days || []).includes(WEEKDAY_MON0(d));
  return true; // daily & perWeek: every day is an opportunity
}
function isSkipped(h, d) { const e = habitEntry(h, d); return !!(e && e.skip); }
/* did the habit's goal get met that day? */
function habitMet(h, d) {
  const e = habitEntry(h, d);
  if (h.type === "avoid") return !(e && e.slip);
  if (h.type === "quantity") return ((e && e.amount) || 0) >= (h.target || 1);
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
const healthToday = () => state.health.log[todayIso()] || {};
function workoutsThisWeek() {
  return weekDates().reduce((n, d) => n + ((state.workout.log[d] || []).length ? 1 : 0), 0);
}
function studyMinutesToday() {
  const t = todayIso();
  return (state.skills.log[t] || 0) + (state.university.log[t] || 0);
}
function nutritionToday() {
  const checked = state.nutrition.log[todayIso()] || {};
  const tot = { kcal: 0, protein: 0, carbs: 0, fats: 0 };
  state.nutrition.meals.forEach(m => { if (checked[m.id]) { tot.kcal += m.kcal; tot.protein += m.protein; tot.carbs += m.carbs; tot.fats += m.fats; } });
  return tot;
}
function socialWeek() {
  const log = state.social.log[weekKey()] || {};
  const done = state.social.items.reduce((n, it) => n + Math.min(log[it.id] || 0, it.target), 0);
  const target = state.social.items.reduce((n, it) => n + it.target, 0);
  return { log, done, target };
}
function journalToday() { return state.journal.find(j => j.date === todayIso()); }

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
    case "skills": { const mins = Object.entries(state.skills.log).filter(([d]) => d.startsWith(monthKey())).reduce((a, [, m]) => a + m, 0);
      return Math.round(100 * clamp(mins / 60 / state.skills.monthlyHours, 0, 1)); }
    case "reading": { const done = state.reading.books.filter(b => b.status === "done").length;
      return Math.round(100 * clamp(done / state.reading.yearlyGoal, 0, 1)); }
    case "media": { const n = state.media.length; return n ? Math.round(100 * state.media.filter(m => m.status === "done").length / n) : 0; }
    case "university": { const mins = weekDates().reduce((a, d) => a + (state.university.log[d] || 0), 0);
      return Math.round(100 * clamp(mins / 60 / state.university.weeklyHours, 0, 1)); }
    case "work": { const n = state.work.items.length; return n ? Math.round(100 * state.work.items.filter(i => i.done).length / n) : 0; }
    case "projects": { const n = state.projects.length; return n ? Math.round(state.projects.reduce((a, p) => a + p.progress, 0) / n) : 0; }
    case "social": { const w = socialWeek(); return w.target ? Math.round(100 * w.done / w.target) : 0; }
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
    done: () => state.habits.length > 0 && isPerfectDay(todayIso()) },
  { id: "workout", xp: 20, area: "workout", title: () => "Log a workout",
    sub: () => `${workoutsThisWeek()} / ${state.workout.weeklyGoal} this week`,
    done: () => (state.workout.log[todayIso()] || []).length > 0 },
  { id: "water",   xp: 15, area: "health",  title: () => `Drink ${state.health.goals.water}L of water`,
    sub: () => `${(healthToday().water || 0).toFixed(2)} / ${state.health.goals.water} L`,
    done: () => (healthToday().water || 0) >= state.health.goals.water },
  { id: "study",   xp: 20, area: "skills",  title: () => "Study for 1 hour",
    sub: () => `${studyMinutesToday()} / 60 min`,
    done: () => studyMinutesToday() >= 60 },
  { id: "journal", xp: 15, area: "journal", title: () => "Journal your thoughts",
    sub: () => journalToday() ? "Written ✓" : "A few lines is enough",
    done: () => !!journalToday() },
  { id: "mood",    xp: 5,  area: "health",  title: () => "Log your mood",
    sub: () => healthToday().mood ? `Feeling ${healthToday().mood}` : "How are you feeling?",
    done: () => !!healthToday().mood },
];
function checkMissions() {
  const t = todayIso();
  state.claimed[t] = state.claimed[t] || {};
  MISSIONS.forEach(m => {
    if (m.done() && !state.claimed[t][m.id]) {
      state.claimed[t][m.id] = true;
      addXp(m.xp, m.title());
      if (m.id === "habits") { toast("Perfect day! Every habit done 🌟", "badge"); celebrate(); }
    }
  });
  save();
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
  { id: "scholar",     name: "Scholar",          desc: "Log 10 hours of study",          emoji: "🎓", test: () => (Object.values(state.skills.log).reduce((a, b) => a + b, 0) + Object.values(state.university.log).reduce((a, b) => a + b, 0)) >= 600 },
  { id: "journalist",  name: "Dear diary",       desc: "Write 7 journal entries",        emoji: "✒️", test: () => state.journal.length >= 7 },
  { id: "keeper",      name: "Memory keeper",    desc: "Save 5 memories",                emoji: "📸", test: () => state.memories.length >= 5 },
  { id: "shipper",     name: "Shipped it",       desc: "Complete a project",             emoji: "🚢", test: () => state.projects.some(p => p.status === "Done") },
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
let currentView = "today";

const VIEW_META = {
  today:        { title: "Today",        sub: () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) },
  dashboard:    { title: "Dashboard",    sub: () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) },
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
  const hue = item.hue ? `style="--a:${item.hue}"` : "";
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
    { id: "today",     name: "Today",    icon: "spark" },
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
  if (areaOf(viewId)) { state.visited[viewId] = true; checkBadges(); save(); }
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

function openModal(html) {
  $("#modal").innerHTML = html;
  $("#modalBackdrop").hidden = false;
  const f = $("#modal input:not([type=hidden]), #modal textarea, #modal select");
  if (f) f.focus();
}
function closeModal() { $("#modalBackdrop").hidden = true; $("#modal").innerHTML = ""; }
function openDrawer() {
  $("#drawer").innerHTML = `
    <div class="drawer-head"><strong>Life areas</strong><button class="icon-btn" data-action="close-drawer" aria-label="Close">${I.x}</button></div>
    <div class="drawer-grid">
      <button class="drawer-item" data-nav="today" style="--a:#7c66dc"><span class="tile-ic">${I.spark}</span><span>Today</span></button>
      <button class="drawer-item" data-nav="dashboard" style="--a:#6a5ae0"><span class="tile-ic">${I.home}</span><span>Dashboard</span></button>
      ${AREAS.map(a => `
      <button class="drawer-item" data-nav="${a.id}" style="--a:${a.hue}">
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
  `<span class="bar"><span style="width:${clamp(pct, 0, 100)}%${color ? `;background:${color}` : ""}"></span></span>`;

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
      const total = state.habits.length || 1;
      const done = state.habits.filter(h => habitDone(h, d)).length;
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

/* small building blocks */
const card = (cls, inner) => `<section class="card ${cls || ""}">${inner}</section>`;
const cardHead = (title, action = "") => `<header class="card-head"><h2>${title}</h2>${action}</header>`;
const emptyMsg = (icon, text, actionHtml = "") =>
  `<div class="empty">${I[icon] || ""}<p>${text}</p>${actionHtml}</div>`;
const addBtn = (label, action, cls = "primary") =>
  `<button class="btn ${cls}" data-action="${action}">${I.plus}${label}</button>`;

/* ================= views ================= */

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Night owl mode";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ---------- Today (OS home) ---------- */
function todayAgenda() {
  const t = todayIso(), items = [];
  state.habits.filter(h => h.type !== "avoid" && isScheduled(h, t) && !isSkipped(h, t)).forEach(h => {
    items.push({ kind: "habit", id: h.id, emoji: h.emoji, hue: "#6a5ae0", title: h.name,
      sub: h.type === "quantity" ? `${(habitEntry(h, t) || {}).amount || 0} / ${h.target} ${h.unit || ""}` : "habit",
      done: habitMet(h, t), action: "ag-habit" });
  });
  const checked = state.nutrition.log[t] || {};
  state.nutrition.meals.forEach(m => items.push({ kind: "meal", id: m.id, hue: "#30a46c", title: m.slot, sub: m.name, done: !!checked[m.id], action: "ag-meal", emoji: "🍽️" }));
  state.todos.filter(td => !td.date || td.date === t).forEach(td => items.push({ kind: "task", id: td.id, hue: "#3e63dd", title: td.text, sub: "task", done: td.done, action: "ag-task", emoji: "✅" }));
  items.push({ kind: "reflect", hue: "#7c66dc", title: "Daily reflection", sub: reflectionOfDay(), done: !!state.reflections[t], action: "ag-reflect", emoji: "✨" });
  state.university.tasks.filter(k => !k.done && k.due <= addDays(t, 5)).forEach(k => items.push({ kind: "deadline", nav: "university", icon: "building", hue: "#3e63dd", title: k.title, when: daysUntil(k.due), sub: "university deadline" }));
  return items;
}
function agendaRow(it) {
  if (it.nav) {
    return `<div class="agenda-item" style="--a:${it.hue}" data-nav="${it.nav}">
      <span class="a-ic" style="--a:${it.hue}">${I[it.icon]}</span>
      <span class="a-txt"><b>${esc(it.title)}</b><small>${esc(it.sub)}</small></span>
      <span class="a-when">${esc(it.when || "")}</span>
    </div>`;
  }
  return `<div class="agenda-item ${it.done ? "done" : ""}" style="--a:${it.hue}">
    <button class="a-check ${it.done ? "on" : ""}" data-action="${it.action}" data-id="${it.id || ""}" aria-label="${it.action === "ag-reflect" ? "Write reflection" : "Complete " + esc(it.title)}">${I.check}</button>
    <span class="a-txt"><b>${it.emoji ? esc(it.emoji) + " " : ""}${esc(it.title)}</b><small>${esc(it.sub)}</small></span>
  </div>`;
}
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
function taskRow(td) {
  const h = td.habitId ? state.habits.find(x => x.id === td.habitId) : null;
  return `<li class="todo ${td.done ? "done" : ""}">
    <span class="todo-time">${td.time || ""}</span>
    <button class="checkbox" data-action="todo-toggle" data-id="${td.id}" aria-label="Toggle task">${I.check}</button>
    <span class="row-txt open" data-action="todo-open" data-id="${td.id}"><b>${esc(td.text)}</b>${h ? `<small>${I.target} ${esc(h.name)}</small>` : ""}</span>
    <button class="icon-btn ghost" data-action="todo-open" data-id="${td.id}" aria-label="Edit task">${I.chevR}</button>
  </li>`;
}
function openTaskDetail(id) {
  const td = state.todos.find(x => x.id === id); if (!td) { closeModal(); return; }
  openModal(`<header class="modal-head"><h3>Task</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <label class="fld"><span>Task</span><input type="text" data-change="task-text" data-id="${td.id}" value="${esc(td.text)}" maxlength="120"></label>
      <div class="fld-row">
        <label class="fld"><span>Time (optional)</span><input type="time" data-change="task-time" data-id="${td.id}" value="${td.time || ""}"></label>
        <label class="fld"><span>Counts toward habit</span>
          <select data-change="task-habit" data-id="${td.id}">
            <option value="">— none —</option>
            ${state.habits.map(h => `<option value="${h.id}" ${td.habitId === h.id ? "selected" : ""}>${esc(h.emoji)} ${esc(h.name)}</option>`).join("")}
          </select></label>
      </div>
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
function vToday() {
  const li = levelInfo(), t = todayIso();
  const todos = state.todos.filter(td => !td.date || td.date === t);
  const undone = todos.filter(td => !td.done).sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  const done = todos.filter(td => td.done);
  const dueHabits = state.habits.filter(h => isScheduled(h, t) && !isSkipped(h, t));
  const deadlines = state.university.tasks.filter(k => !k.done && k.due <= addDays(t, 5)).sort((a, b) => a.due < b.due ? -1 : 1);
  const remaining = undone.length + dueHabits.filter(h => !habitMet(h, t)).length;
  return `
  <div class="grid dash">
    ${card("today-hero span2", `
      <div class="hero-row">
        <div>
          <p class="hero-hi">${greeting()}, ${esc(state.profile.name || "friend")} <span aria-hidden="true">☀️</span></p>
          <h2 class="hero-big">${remaining ? `${remaining} thing${remaining > 1 ? "s" : ""} left today` : "All done for today 🎉"}</h2>
          <div class="hero-level">
            <span class="lv-pill">Level ${li.lvl}</span>
            <span class="bar"><span style="width:${li.pct}%"></span></span>
            <small>${li.into.toLocaleString()} / ${li.need.toLocaleString()} XP</small>
          </div>
        </div>
        <div class="hero-ring">${ring(li.pct, { size: 96, sw: 9, color: "#fff", center: "Lv " + li.lvl, label: "level progress" })}</div>
      </div>
      <div class="stat-row">
        <div class="stat"><b data-count="${perfectStreak()}">0</b><span>${I.flame} day streak</span></div>
        <div class="stat"><b data-count="${weeklyProgress()}" data-count-suffix="%">0</b><span>${I.activity} today</span></div>
        <div class="stat"><b data-count="${Object.keys(state.badges).length}">0</b><span>${I.medal} badges</span></div>
      </div>`)}

    ${card("span2", cardHead(`Today's focus <small class="soft">${undone.length} to do</small>`) + `
      <ul class="todo-list">${undone.length ? undone.map(taskRow).join("") : `<p class="soft small" style="padding:6px 2px">Nothing to do — add a task below or enjoy the day 🌿</p>`}</ul>
      ${taskAddForm()}
      ${done.length ? `<details class="done-wrap"><summary>${I.check} Done today (${done.length})</summary><ul class="todo-list done-list">${done.map(taskRow).join("")}</ul></details>` : ""}`)}

    ${card("span2", cardHead("Today's habits", `<button class="btn ghost tiny" data-nav="habits">Open habits</button>`) + (dueHabits.length ? `
      <div class="habit-chips">${dueHabits.map(h => `<button class="habit-chip ${habitMet(h, t) ? "on" : ""}" data-action="ag-habit" data-id="${h.id}" style="--a:${h.color || "#6a5ae0"}">${esc(h.emoji)} ${esc(h.name)}${habitMet(h, t) ? " " + I.check : ""}</button>`).join("")}</div>
      <p class="soft note">${I.spark} Add a task that "counts toward" a habit and checking it will tick the habit for you.</p>` : `<p class="soft small">No habits scheduled today.</p>`))}

    ${card("", cardHead("Upcoming") + (deadlines.length ? `
      <ul class="mini-agenda">${deadlines.map(k => `<li data-nav="university"><span class="a-ic" style="--a:#3e63dd">${I.building}</span><span class="row-txt"><b>${esc(k.title)}</b><small>university</small></span><span class="a-when">${daysUntil(k.due)}</span></li>`).join("")}</ul>` : `<p class="soft small">Nothing due soon 🎉</p>`))}

    ${card("", cardHead("Reflection") + `
      <p class="reflect-prompt">${esc(reflectionOfDay())}</p>
      <textarea class="reflect-input" data-change="reflection" placeholder="A sentence or two…" maxlength="1000">${esc(state.reflections[t] || "")}</textarea>`)}
  </div>`;
}

function vDashboard() {
  const li = levelInfo();
  const missionsDone = MISSIONS.filter(m => m.done()).length;
  const wk = socialWeek();
  const studiedH = Math.round(weekDates().reduce((a, d) => a + (state.university.log[d] || 0) + (state.skills.log[d] || 0), 0) / 6) / 10;
  return `
  <div class="grid dash">
    ${card("hero-card span2", `
      <div class="hero-row">
        <div>
          <p class="hero-hi">${greeting()}, ${esc(state.profile.name || "friend")} <span aria-hidden="true">👋</span></p>
          <h2 class="hero-big">Let's make today amazing.</h2>
          <div class="hero-level">
            <span class="lv-pill">Level ${li.lvl}</span>
            <span class="bar"><span style="width:${li.pct}%"></span></span>
            <small>${li.into.toLocaleString()} / ${li.need.toLocaleString()} XP</small>
          </div>
        </div>
        <div class="hero-mascot" aria-hidden="true">${esc(state.profile.avatar)}</div>
      </div>
      <div class="stat-row">
        <div class="stat"><b>${perfectStreak()}</b><span>${I.flame} day streak</span></div>
        <div class="stat"><b>${weeklyProgress()}%</b><span>${I.activity} today's progress</span></div>
        <div class="stat"><b>${Object.keys(state.badges).length}</b><span>${I.medal} badges</span></div>
      </div>`)}

    ${card("", cardHead(`Today's missions <small class="soft">${missionsDone}/${MISSIONS.length} completed</small>`) + `
      <ul class="mission-list">
        ${MISSIONS.map(m => {
          const a = areaOf(m.area), done = m.done();
          return `<li class="mission ${done ? "done" : ""}" data-nav="${m.area}" style="--a:${a.hue}">
            <span class="tile-ic">${I[a.icon]}</span>
            <span class="mission-txt"><b>${esc(m.title())}</b><small>${esc(m.sub())}</small></span>
            <span class="mission-check">${done ? I.check : `<i class="xp-tag">+${m.xp}</i>`}</span>
          </li>`;
        }).join("")}
      </ul>`)}

    ${card("", cardHead("This week") + `
      <div class="mini-stats">
        <div class="mini-stat" data-nav="workout"><span class="tile-ic" style="--a:#f76b15">${I.dumbbell}</span><div><b>${workoutsThisWeek()}/${state.workout.weeklyGoal}</b><small>workouts</small></div></div>
        <div class="mini-stat" data-nav="university"><span class="tile-ic" style="--a:#3e63dd">${I.clock}</span><div><b>${studiedH}h</b><small>studied</small></div></div>
        <div class="mini-stat" data-nav="social"><span class="tile-ic" style="--a:#e93d82">${I.users}</span><div><b>${wk.done}/${wk.target}</b><small>social goals</small></div></div>
        <div class="mini-stat" data-nav="reading"><span class="tile-ic" style="--a:#0091ff">${I.book}</span><div><b>${state.reading.books.filter(b => b.status === "done").length}/${state.reading.yearlyGoal}</b><small>books this year</small></div></div>
      </div>`)}
    ${card("span2", cardHead("Life areas") + `
      <div class="area-grid">
        ${AREAS.map(a => `
          <button class="area-tile" data-nav="${a.id}" style="--a:${a.hue}">
            <span class="tile-ic">${I[a.icon]}</span>
            <span class="tile-name">${esc(a.name)}</span>
            ${barHtml(areaProgressToday(a.id), "var(--a)")}
          </button>`).join("")}
      </div>`)}

  </div>`;
}

/* ---------- habits ---------- */
function goalProgress(g) {
  const tot = g.milestones.length, done = g.milestones.filter(m => m.done).length;
  return { done, tot, pct: tot ? Math.round(100 * done / tot) : 0 };
}
function habitRow(h, d) {
  const e = habitEntry(h, d) || {}, met = habitMet(h, d), streak = habitStreak(h);
  let control, sub;
  if (h.type === "avoid") {
    control = `<button class="checkbox avoid ${e.slip ? "slip" : "kept"}" data-action="habit-toggle" data-id="${h.id}" aria-label="${e.slip ? "Slipped" : "Kept"}">${e.slip ? I.x : I.check}</button>`;
    sub = `${streak} days clean${e.slip ? " · slipped" : ""}`;
  } else if (h.type === "quantity") {
    control = `<button class="checkbox" data-action="habit-toggle" data-id="${h.id}" aria-label="Mark complete">${I.check}</button>`;
    sub = `${e.amount || 0} / ${h.target}${h.unit ? " " + h.unit : ""} · ${streak}🔥`;
  } else {
    control = `<button class="checkbox" data-action="habit-toggle" data-id="${h.id}" aria-label="Toggle ${esc(h.name)}">${I.check}</button>`;
    sub = `${streak} day streak`;
  }
  const quantBar = h.type === "quantity" ? barHtml(100 * ((e.amount) || 0) / (h.target || 1), "#6a5ae0") : "";
  const incBtn = h.type === "quantity" ? `<button class="btn tiny ghost" data-action="habit-inc" data-id="${h.id}">+${habitStep(h)}</button>` : "";
  return `<li class="${met ? "done" : ""}">
    ${control}
    <button class="row-emoji as-btn" data-action="habit-open" data-id="${h.id}" aria-label="Open ${esc(h.name)}">${esc(h.emoji)}</button>
    <span class="row-txt open" data-action="habit-open" data-id="${h.id}">
      <b>${esc(h.name)}${h.kind === "workout" ? ` <span class="mini-badge">${I.dumbbell}</span>` : ""}</b>
      <small>${sub}${e.note ? " · noted" : ""}</small>${quantBar}
    </span>
    ${incBtn}
    <button class="icon-btn ghost" data-action="habit-open" data-id="${h.id}" aria-label="Details">${I.chevR}</button>
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
function vHabits() {
  const d = dayCursor("habits"), week = weekDates();
  const isToday = d === todayIso();
  const due = state.habits.filter(h => isScheduled(h, d) && !isSkipped(h, d));
  const rest = state.habits.filter(h => !(isScheduled(h, d) && !isSkipped(h, d)));
  const pct = due.length ? Math.round(100 * due.filter(h => habitMet(h, d)).length / due.length) : 0;
  return `
  <div class="grid">
    ${card("span2", dayNav("habits") + `
      <div class="week-strip">
        ${week.map((wd, i) => `
          <button class="wday ${wd === d ? "today" : ""} ${wd > todayIso() ? "future" : ""}" data-action="habit-day" data-d="${wd}">
            <small>${WD_SHORT[i]}</small><b>${+wd.slice(-2)}</b>
            <span class="wdot ${isPerfectDay(wd) ? "full" : state.habits.some(h => habitMet(h, wd)) ? "part" : ""}"></span>
          </button>`).join("")}
      </div>
      <div class="progress-line"><span>${isToday ? "Today's" : "That day's"} progress</span>${barHtml(pct)}<b>${pct}%</b></div>`)}

    ${card("span2", cardHead(isToday ? "Today's habits" : niceDate(d, { weekday: "long", month: "short", day: "numeric" }), `<button class="btn ghost tiny" data-action="habit-library">${I.grid}Library</button>${addBtn("New habit", "habit-add")}`) + (state.habits.length ? `
      <ul class="check-list habit-list">${due.map(h => habitRow(h, d)).join("") || `<p class="soft small" style="padding:8px 4px">Nothing scheduled for this day — enjoy the rest 🌤️</p>`}</ul>
      ${rest.length ? `<p class="rest-label">Not scheduled / resting</p><ul class="check-list habit-list dim">${rest.map(h => habitRow(h, d)).join("")}</ul>` : ""}`
      : emptyMsg("target", "No habits yet — build your first ritual.", addBtn("Add a habit", "habit-add"))))}

    ${card("streak-card", `
      <div class="streak-hero">${I.flame}<div><b>${perfectStreak()} days</b><small>current perfect streak</small></div></div>
      <p class="soft">A perfect day = every habit that was <em>due</em> is done. Rest days and skips don't break your chain.</p>`)}

    ${card("reflect-card", `
      <div class="reflect-head">${I.spark}<span>Daily reflection</span></div>
      <p class="reflect-prompt">${esc(reflectionOfDay())}</p>
      <textarea class="reflect-input" data-change="reflection" placeholder="A sentence or two…" maxlength="1000">${esc(state.reflections[todayIso()] || "")}</textarea>`)}

    ${card("", cardHead("Goals", addBtn("New goal", "goal-add")) + (state.goals.length ? `
      <ul class="goal-list">
        ${state.goals.map(g => {
          const gp = goalProgress(g);
          return `<li data-action="goal-open" data-id="${g.id}">
            <span class="row-emoji">${esc(g.emoji || "🎯")}</span>
            <span class="row-txt open"><b>${esc(g.title)}</b><small>${gp.done}/${gp.tot} milestones</small>${barHtml(gp.pct, "#6a5ae0")}</span>
            <b class="pct">${gp.pct}%</b>
          </li>`;
        }).join("")}
      </ul>` : emptyMsg("target", "Set a goal your habits build toward.", addBtn("Add a goal", "goal-add"))))}
  </div>`;
}

function weekdayPicker(selected) {
  return `<div class="wd-pick">${WD_SHORT.map((w, i) => `<label><input type="checkbox" name="wd${i}" ${selected.includes(i) ? "checked" : ""}><span>${w}</span></label>`).join("")}</div>`;
}
function habitFormFields(h) {
  h = h || {}; const c = h.cadence || { mode: "daily" };
  return fld("Name", txt("name", "e.g. Drink water", h.name || "")) +
    fld("Emoji", txt("emoji", "💧", h.emoji || "💧", false)) +
    fld("Type", `<select name="type">
      <option value="build" ${(!h.type || h.type === "build") ? "selected" : ""}>Build — just do it (checkbox)</option>
      <option value="quantity" ${h.type === "quantity" ? "selected" : ""}>Amount — reach a target (e.g. 2L, 20 pages)</option>
      <option value="avoid" ${h.type === "avoid" ? "selected" : ""}>Avoid — break a bad habit (days clean)</option>
    </select>`) +
    `<div class="fld-row">${fld("Target", num("target", h.target || 0, 0))}${fld("Unit", txt("unit", "L / pages", h.unit || "", false))}</div>` +
    fld("Why — your reason", txt("why", "keeps me focused…", h.why || "", false)) +
    fld("How often", `<select name="cmode">
      <option value="daily" ${c.mode === "daily" ? "selected" : ""}>Every day</option>
      <option value="days" ${c.mode === "days" ? "selected" : ""}>Specific weekdays</option>
      <option value="perWeek" ${c.mode === "perWeek" ? "selected" : ""}>A number of times per week</option>
    </select>`) +
    `<div class="fld-row"><label class="fld"><span>On these days</span>${weekdayPicker(c.days || [0, 1, 2, 3, 4])}</label>${fld("× per week", num("perWeek", c.perWeek || 3, 1))}</div>` +
    `<label class="check-inline"><input type="checkbox" name="kind" ${h.kind === "workout" ? "checked" : ""}> <span>Workout habit (can log to Workout)</span></label>`;
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
    const amt = e.amount || 0, met = habitMet(h, d);
    return `<div class="detail-control">
      <div class="progress-line"><span>${amt} / ${h.target}${h.unit ? " " + h.unit : ""}</span>${barHtml(100 * amt / (h.target || 1), "#6a5ae0")}<b>${met ? "✓" : Math.round(100 * amt / (h.target || 1)) + "%"}</b></div>
      <div class="pill-row"><button class="btn tiny ghost" data-action="habit-dec" data-id="${h.id}">−${habitStep(h)}</button>
        <input class="num-input" type="number" step="any" min="0" value="${amt}" data-change="habit-amount" data-id="${h.id}" aria-label="Amount">
        <button class="btn tiny ghost" data-action="habit-inc" data-id="${h.id}">+${habitStep(h)}</button>
        <button class="btn tiny good" data-action="habit-toggle-d" data-id="${h.id}">${met ? "Reset" : "Mark full"}</button></div>
    </div>`;
  }
  const met = habitMet(h, d);
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
      ${h.kind === "workout"
        ? `<div class="pill-row">${e.workoutId ? `<span class="soft small">${I.check} Linked to a workout session</span><button class="btn tiny ghost" data-action="habit-goto-workout" data-id="${h.id}">Open workout</button>` : `<button class="btn ghost slim" data-action="habit-log-workout" data-id="${h.id}">${I.dumbbell}Log this as a workout session</button>`}</div>`
        : `<button class="btn ghost slim" data-action="habit-make-workout" data-id="${h.id}">${I.dumbbell}This is a workout habit</button>`}
      <div class="fld"><span>Milestones</span>
        ${h.milestones.length ? `<ul class="ms-list">
          ${h.milestones.map(m => `<li class="${m.done ? "done" : ""}"><button class="checkbox sm" data-action="ms-toggle" data-h="${h.id}" data-m="${m.id}" aria-label="Toggle milestone">${I.check}</button><span>${esc(m.text)}</span><button class="icon-btn ghost" data-action="ms-del" data-h="${h.id}" data-m="${m.id}" aria-label="Delete milestone">${I.x}</button></li>`).join("")}
        </ul>` : `<p class="soft small">No milestones yet.</p>`}
        <button class="btn tiny ghost" data-action="ms-add" data-id="${h.id}">${I.plus}Add milestone</button>
      </div>
      <label class="fld"><span>Part of a goal</span>
        <select data-change="habit-goal" data-id="${h.id}">
          <option value="">— none —</option>
          ${state.goals.map(g => `<option value="${g.id}" ${h.goalId === g.id ? "selected" : ""}>${esc(g.emoji || "🎯")} ${esc(g.title)}</option>`).join("")}
        </select>
      </label>
      <div class="pill-row"><button class="btn ghost" data-action="habit-edit" data-id="${h.id}">${I.edit}Edit</button><button class="btn danger" data-action="habit-del-d" data-id="${h.id}">${I.trash}Delete</button></div>
    </div>`);
}

function openGoalDetail(id) {
  const g = state.goals.find(x => x.id === id);
  if (!g) { closeModal(); return; }
  const gp = goalProgress(g);
  const linked = state.habits.filter(h => h.goalId === g.id);
  openModal(`
    <header class="modal-head"><h3>${esc(g.emoji || "🎯")} ${esc(g.title)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <div class="progress-line"><span>${gp.done}/${gp.tot} milestones</span>${barHtml(gp.pct, "#6a5ae0")}<b>${gp.pct}%</b></div>
      <div class="fld"><span>Milestones</span>
        ${g.milestones.length ? `<ul class="ms-list">
          ${g.milestones.map(m => `<li class="${m.done ? "done" : ""}"><button class="checkbox sm" data-action="gms-toggle" data-g="${g.id}" data-m="${m.id}" aria-label="Toggle milestone">${I.check}</button><span>${esc(m.text)}</span><button class="icon-btn ghost" data-action="gms-del" data-g="${g.id}" data-m="${m.id}" aria-label="Delete milestone">${I.x}</button></li>`).join("")}
        </ul>` : `<p class="soft small">No milestones yet.</p>`}
        <button class="btn tiny ghost" data-action="gms-add" data-id="${g.id}">${I.plus}Add milestone</button>
      </div>
      ${linked.length ? `<div class="fld"><span>Habits building this goal</span><div class="chip-wrap">${linked.map(h => `<span class="chip-genre">${esc(h.emoji)} ${esc(h.name)}</span>`).join("")}</div></div>` : `<p class="soft small">Link habits to this goal from a habit's detail view.</p>`}
      <div class="pill-row"><button class="btn ghost" data-action="goal-edit" data-id="${g.id}">${I.edit}Edit</button><button class="btn danger" data-action="goal-del" data-id="${g.id}">${I.trash}Delete</button></div>
    </div>`);
}

/* ---------- health ---------- */
function vHealth() {
  const g = state.health.goals, l = healthToday();
  const week = weekDates();
  const stepsData = week.map((d, i) => {
    const v = (state.health.log[d] || {}).steps || 0;
    return { label: WD_SHORT[i], value: v, tip: `${WD_SHORT[i]} · ${v.toLocaleString()} steps` };
  });
  const moods = ["😄", "🙂", "😌", "😐", "🥱", "😔", "😤"];
  return `
  <div class="grid">
    ${card("center", `
      ${ring(100 * (l.steps || 0) / g.steps, { size: 130, sw: 10, color: "#30a46c", center: (l.steps || 0).toLocaleString(), sub: `/ ${g.steps.toLocaleString()} steps`, label: "steps today" })}
      <div class="pill-row">
        <button class="btn ghost" data-action="steps-add" data-n="500">+500</button>
        <button class="btn ghost" data-action="steps-add" data-n="2000">+2,000</button>
        <button class="btn ghost" data-action="health-goals">${I.sliders}Goals</button>
      </div>`)}

    ${card("", cardHead("Today's log") + `
      <ul class="log-list">
        <li><span class="tile-ic" style="--a:#00a2c7">${I.drop}</span><span class="row-txt"><b>Water</b><small>${(l.water || 0).toFixed(2)} / ${g.water} L</small></span>
          <span class="pill-row"><button class="btn tiny" data-action="water-add" data-n="0.25">+0.25</button><button class="btn tiny" data-action="water-add" data-n="0.5">+0.5</button></span></li>
        <li><span class="tile-ic" style="--a:#7c66dc">${I.moon}</span><span class="row-txt"><b>Sleep</b><small>${l.sleep ? l.sleep + " h" : "not logged"}</small></span>
          <span class="pill-row"><input class="num-input" type="number" min="0" max="24" step="0.5" value="${l.sleep || ""}" placeholder="h" data-change="sleep-set" aria-label="Hours slept"></span></li>
        <li><span class="tile-ic" style="--a:#e5484d">${I.heart}</span><span class="row-txt"><b>Mood</b><small>${l.mood ? "Feeling " + l.mood : "how do you feel?"}</small></span>
          <span class="mood-row">${moods.map(m => `<button class="mood ${l.mood === m ? "on" : ""}" data-action="mood-set" data-m="${m}">${m}</button>`).join("")}</span></li>
      </ul>`)}

    ${card("span2", cardHead("Steps this week") + `
      <div data-chart-type="bar" data-chart='${esc(JSON.stringify(stepsData))}' data-goal="${g.steps}" data-color="#30a46c" data-h="160" data-label="Steps this week"></div>
      <p class="chart-note">${I.target} goal line at ${g.steps.toLocaleString()} steps</p>`)}
  </div>`;
}

/* ---------- workout ---------- */
const WORKOUT_CATS = ["Calisthenics", "Strength", "Cardio", "Mobility", "Yoga"];
const CAT_COLORS = { Calisthenics: "#12a594", Strength: "#f76b15", Cardio: "#e5484d", Mobility: "#7c66dc", Yoga: "#8e4ec6" };
function removeSession(id) {
  const s = state.workout.sessions.find(x => x.id === id);
  if (!s) return;
  (s.media || []).forEach(m => mediaDelete(m.id));
  state.workout.sessions = state.workout.sessions.filter(x => x.id !== id);
  Object.keys(state.workout.log).forEach(d => {
    state.workout.log[d] = (state.workout.log[d] || []).filter(x => x !== id);
    if (!state.workout.log[d].length) delete state.workout.log[d];
  });
  state.habits.forEach(h => Object.values(h.log).forEach(e => { if (e && typeof e === "object" && e.workoutId === id) delete e.workoutId; }));
}
/* ----- exercise / PR helpers ----- */
function setLabel(ex, set) {
  if (ex.kind === "time") return `${set.seconds || 0}s`;
  if (ex.kind === "distance") return `${set.distance || 0} ${set.unit || "km"}`;
  return `${set.weight || 0}kg × ${set.reps || 0}`;
}
function exerciseNames() { const s = new Set(); state.workout.sessions.forEach(x => (x.exercises || []).forEach(e => s.add(e.name))); return [...s]; }
function exerciseKind(name) { for (const s of state.workout.sessions) for (const e of (s.exercises || [])) if (e.name === name) return e.kind; return "reps"; }
function prPrimary(name, kind) {
  let best = 0;
  state.workout.sessions.forEach(s => (s.exercises || []).forEach(e => { if (e.name !== name) return; (e.sets || []).forEach(set => { best = Math.max(best, kind === "reps" ? (set.weight || 0) : kind === "time" ? (set.seconds || 0) : (set.distance || 0)); }); }));
  return best;
}
function prLabel(kind, v) { return kind === "reps" ? `${v} kg` : kind === "time" ? `${v}s` : `${v} km`; }
function exerciseSessionBest(name, kind) {
  const rows = [];
  state.workout.sessions.forEach(s => {
    let v = 0; (s.exercises || []).forEach(e => { if (e.name !== name) return; (e.sets || []).forEach(set => { v = Math.max(v, kind === "reps" ? (set.weight || 0) : kind === "time" ? (set.seconds || 0) : (set.distance || 0)); }); });
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
function sessionCard(s) {
  const c = CAT_COLORS[s.category] || "#f76b15";
  return `<li class="session">
    <div class="session-head">
      <span class="chip-cat" style="--a:${c}">${esc(s.category || "Session")}</span>
      ${s.planName ? `<b>${esc(s.planName)}</b>` : ""}
      <span class="spacer"></span>
      <button class="icon-btn ghost" data-action="session-note" data-id="${s.id}" aria-label="Edit note">${I.pen}</button>
      <button class="icon-btn ghost" data-action="session-del" data-id="${s.id}" aria-label="Delete session">${I.trash}</button>
    </div>
    ${s.note ? `<p class="session-note">${esc(s.note)}</p>` : ""}
    ${(s.exercises && s.exercises.length) ? `<div class="ex-list">${s.exercises.map(ex => exerciseCard(s, ex)).join("")}</div>` : ""}
    <button class="btn tiny ghost" data-action="ex-add" data-id="${s.id}">${I.plus}Add exercise</button>
    ${(s.media && s.media.length) ? `<div class="media-grid">
      ${s.media.map(m => `<div class="media-item">
        <span class="media-host" data-media="${m.id}" data-media-kind="${m.kind}"><span class="media-missing">loading…</span></span>
        <button class="icon-btn ghost media-thumb-del" data-action="session-media-del" data-s="${s.id}" data-m="${m.id}" aria-label="Remove media">${I.x}</button>
      </div>`).join("")}
    </div>` : ""}
    <label class="btn tiny ghost upload-btn"><input type="file" accept="image/*,video/*" hidden data-change="session-media" data-id="${s.id}"><span>${I.upload}Add photo / video</span></label>
  </li>`;
}
function vWorkout() {
  const d = dayCursor("workout"), isToday = d === todayIso();
  const wk = workoutsThisWeek();
  const daySessions = state.workout.sessions.filter(s => s.date === d);
  return `
  <div class="grid">
    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">This week</p><h3>${wk} / ${state.workout.weeklyGoal} workouts</h3>${barHtml(100 * wk / state.workout.weeklyGoal, "#f76b15")}</div>
        <span class="big-ic" style="--a:#f76b15">${I.trophy}</span>
      </div>
      <div class="week-strip small">
        ${weekDates().map((wd, i) => `<button class="wday ${wd === d ? "today" : ""} ${wd > todayIso() ? "future" : ""}" data-action="workout-day" data-d="${wd}"><small>${WD_SHORT[i]}</small><span class="wdot ${(state.workout.log[wd] || []).length ? "full" : ""}"></span></button>`).join("")}
      </div>`)}

    ${card("span2", cardHead("Workout plan", `<button class="btn ghost tiny" data-action="workout-library">${I.grid}Routines</button>${addBtn("Add to plan", "workout-add")}`) + (state.workout.plan.length ? `
      <ul class="check-list">
        ${state.workout.plan.map(p => {
          const on = state.workout.sessions.some(s => s.date === d && s.planId === p.id);
          return `<li class="${on ? "done" : ""}">
            <button class="checkbox" data-action="workout-toggle" data-id="${p.id}" aria-label="Toggle ${esc(p.name)}">${I.check}</button>
            <span class="row-emoji">${esc(p.emoji)}</span>
            <span class="row-txt"><b>${esc(p.name)}</b><small>${p.category ? esc(p.category) + " · " : ""}${p.minutes} min${p.sets ? ` · ${p.sets}×${p.reps || "?"}` : ""}</small></span>
            <button class="icon-btn ghost" data-action="workout-del" data-id="${p.id}" aria-label="Delete ${esc(p.name)}">${I.trash}</button>
          </li>`;
        }).join("")}
      </ul>` : emptyMsg("dumbbell", "No workouts in your plan yet.", addBtn("Add one", "workout-add"))))}

    ${card("span2", cardHead((isToday ? "Today's" : "That day's") + " sessions", addBtn("Log session", "session-add")) + dayNav("workout") + (daySessions.length ? `
      <ul class="session-list">${daySessions.map(sessionCard).join("")}</ul>`
      : emptyMsg("activity", "No sessions logged for this day — check a plan item or log one, and attach a photo/video of your progress.", addBtn("Log a session", "session-add"))))}

    ${exerciseNames().length ? card("span2", cardHead("Exercises & personal records") + `
      <ul class="ex-pr-list">
        ${exerciseNames().map(name => {
          const kind = exerciseKind(name);
          const rows = exerciseSessionBest(name, kind).slice(-12);
          const chartData = rows.map(r => ({ label: +r.date.slice(-2), value: r.value, tip: `${niceDate(r.date)} · ${prLabel(kind, r.value)}` }));
          return `<li data-action="ex-history" data-name="${esc(name)}">
            <div class="ex-pr-head"><b>${esc(name)}</b><span class="pr-badge">${I.trophy} PR ${prLabel(kind, prPrimary(name, kind))}</span></div>
            ${chartData.length ? `<div data-chart-type="bar" data-chart='${esc(JSON.stringify(chartData))}' data-color="#f76b15" data-h="86" data-label="${esc(name)} progress"></div>` : `<p class="soft small">Log a set to start tracking.</p>`}
          </li>`;
        }).join("")}
      </ul>
      <p class="chart-note">${I.chart} Tap an exercise for its full history. Bars show your best set per session.</p>`) : ""}
  </div>`;
}

function openExerciseHistory(name) {
  const kind = exerciseKind(name);
  const rows = exerciseSessionBest(name, kind);
  const chartData = rows.map(r => ({ label: +r.date.slice(-2), value: r.value, tip: `${niceDate(r.date)} · ${prLabel(kind, r.value)}` }));
  openModal(`
    <header class="modal-head"><h3>${esc(name)}</h3><button type="button" class="icon-btn" data-action="modal-close" aria-label="Close">${I.x}</button></header>
    <div class="modal-body">
      <div class="pill-row"><span class="pr-badge">${I.trophy} Best ${prLabel(kind, prPrimary(name, kind))}</span><span class="soft small">${rows.length} session${rows.length !== 1 ? "s" : ""} logged</span></div>
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
function vNutrition() {
  const g = state.nutrition.goals, tot = nutritionToday();
  const checked = state.nutrition.log[todayIso()] || {};
  const macro = [
    { label: "Protein", value: tot.protein, unit: "g" },
    { label: "Carbs",   value: tot.carbs,   unit: "g" },
    { label: "Fats",    value: tot.fats,    unit: "g" },
  ];
  return `
  <div class="grid">
    ${card("", `
      <p class="soft">Calories today</p><h3>${tot.kcal.toLocaleString()} / ${g.kcal.toLocaleString()} kcal</h3>
      ${barHtml(100 * tot.kcal / g.kcal, "#30a46c")}
      <div class="pill-row" style="margin-top:12px"><button class="btn ghost" data-action="nutrition-goals">${I.sliders}Edit goals</button></div>`)}
    ${card("", cardHead("Macros") + `<div data-chart-type="donut" data-chart='${esc(JSON.stringify(macro))}' data-label="Macros today"></div>`)}
    ${card("span2", cardHead("Today's meals", addBtn("Add meal", "meal-add")) + (state.nutrition.meals.length ? `
      <ul class="check-list">
        ${state.nutrition.meals.map(m => `
          <li class="${checked[m.id] ? "done" : ""}">
            <button class="checkbox" data-action="meal-toggle" data-id="${m.id}" aria-label="Toggle ${esc(m.name)}">${I.check}</button>
            <span class="row-txt"><b>${esc(m.slot)}</b><small>${esc(m.name)} · ${m.kcal} kcal</small></span>
            <span class="soft small">${m.protein}P · ${m.carbs}C · ${m.fats}F</span>
            <button class="icon-btn ghost" data-action="meal-del" data-id="${m.id}" aria-label="Delete meal">${I.trash}</button>
          </li>`).join("")}
      </ul>` : emptyMsg("apple", "Plan your meals for the day.", addBtn("Add a meal", "meal-add"))))}
  </div>`;
}

/* ---------- skills ---------- */
function vSkills() {
  const mins = Object.entries(state.skills.log).filter(([d]) => d.startsWith(monthKey())).reduce((a, [, m]) => a + m, 0);
  const hrs = Math.round(mins / 6) / 10;
  return `
  <div class="grid">
    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">This month</p><h3>${hrs} / ${state.skills.monthlyHours} study hours</h3>${barHtml(100 * hrs / state.skills.monthlyHours, "#8e4ec6")}</div>
        <span class="big-ic" style="--a:#8e4ec6">${I.gradcap}</span>
      </div>
      <div class="pill-row" style="margin-top:14px">
        <button class="btn ghost" data-action="study-log" data-kind="skills" data-n="30">+30 min</button>
        <button class="btn ghost" data-action="study-log" data-kind="skills" data-n="60">+1 h</button>
        <button class="btn ghost" data-action="skills-goal">${I.sliders}Goal</button>
      </div>`)}
    ${card("span2", cardHead("Current courses", addBtn("New course", "course-add")) + (state.skills.courses.length ? `
      <ul class="course-list">
        ${state.skills.courses.map(c => `
          <li>
            <span class="row-txt"><b>${esc(c.name)}</b>${barHtml(c.progress, "#8e4ec6")}</span>
            <b class="pct">${c.progress}%</b>
            <span class="pill-row">
              <button class="btn tiny" data-action="course-bump" data-id="${c.id}" data-n="5">+5%</button>
              <button class="icon-btn ghost" data-action="course-del" data-id="${c.id}" aria-label="Delete course">${I.trash}</button>
            </span>
          </li>`).join("")}
      </ul>` : emptyMsg("gradcap", "Track the things you're learning.", addBtn("Add a course", "course-add"))))}
  </div>`;
}

/* ---------- reading ---------- */
function readingStats() {
  const books = state.reading.books;
  const done = books.filter(b => b.status === "done");
  const pages = books.reduce((a, b) => a + (b.page || 0), 0);
  const rated = done.filter(b => b.rating > 0);
  const avg = rated.length ? (rated.reduce((a, b) => a + b.rating, 0) / rated.length).toFixed(1) : "—";
  return { done: done.length, pages, avg, favs: books.filter(b => b.favorite).length };
}
function bookCover(b, cls = "") {
  return b.cover
    ? `<span class="book-cover ${cls}" style="background-image:url('${b.cover}')" role="img" aria-label="${esc(b.title)} cover"></span>`
    : `<span class="book-cover ${cls}" aria-hidden="true">${esc(b.emoji || "📘")}</span>`;
}
function starRow(b) {
  return `<div class="star-pick" role="group" aria-label="Rating">
    ${[1, 2, 3, 4, 5].map(r => `<button class="star ${b.rating >= r ? "on" : ""}" data-action="book-rate" data-id="${b.id}" data-r="${r}" aria-label="${r} star${r > 1 ? "s" : ""}">★</button>`).join("")}
    ${b.rating ? `<button class="star clear" data-action="book-rate" data-id="${b.id}" data-r="0" aria-label="Clear rating">✕</button>` : ""}
  </div>`;
}

function vReading() {
  const st = readingStats();
  const tab = state._readingTab || "current";
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
        <div><b>${st.pages.toLocaleString()}</b><small>pages read</small></div>
        <div><b>${st.avg}</b><small>avg rating</small></div>
        <div><b>${st.favs}</b><small>favorites</small></div>
      </div>`)}
    ${card("span2", `
      <div class="tab-row">${tabs.map(([id, lbl]) => `<button class="tab ${tab === id ? "on" : ""}" data-action="reading-tab" data-id="${id}">${lbl}</button>`).join("")}
        <span class="spacer"></span>${addBtn("Add book", "book-add")}</div>
      ${books.length ? `<ul class="book-list">
        ${books.map(b => {
          const pct = Math.round(100 * (b.page || 0) / (b.pages || 1));
          return `<li class="book-row" data-action="book-open" data-id="${b.id}">
            ${bookCover(b)}
            <span class="row-txt">
              <b>${esc(b.title)}${b.favorite ? ` <span class="fav-dot" aria-label="Favorite">♥</span>` : ""}</b>
              <small>${esc(b.author)}${b.genre ? ` · ${esc(b.genre)}` : ""}</small>
              ${b.status === "current" ? barHtml(pct, "#0091ff") : ""}
              ${b.rating ? `<small class="stars">${"★".repeat(b.rating)}${"☆".repeat(5 - b.rating)}</small>` : ""}
            </span>
            ${b.status === "current" ? `<span class="pct">${pct}%</span>` : ""}
            <span class="row-open">${I.plus}</span>
          </li>`;
        }).join("")}
      </ul>` : emptyMsg("book", tab === "done" ? "No finished books yet — the first one is the sweetest." : "Nothing here yet.", addBtn("Add a book", "book-add"))}`)}
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
        ${b.cover ? `<span class="bd-cover" style="background-image:url('${b.cover}')" role="img" aria-label="${esc(b.title)} cover"></span>` : `<span class="bd-cover ph">${esc(b.emoji || "📘")}</span>`}
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
      <label class="fld"><span>Notes &amp; thoughts</span><textarea data-change="book-notes" data-id="${b.id}" placeholder="What did you think? Favorite quotes, takeaways…" maxlength="1200">${esc(b.notes || "")}</textarea></label>
      <div class="pill-row">
        <button class="btn ghost" data-action="book-edit" data-id="${b.id}">${I.edit}Edit details</button>
        <button class="btn danger" data-action="book-del-d" data-id="${b.id}">${I.trash}Delete</button>
      </div>
    </div>`);
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
function vMedia() {
  const tab = state._mediaTab || "watchlist";
  const tabs = [["watchlist", "Watchlist"], ["watching", "Watching"], ["done", "Completed"]];
  const items = state.media.filter(m => m.status === tab);
  return `
  <div class="grid">
    ${card("span2", `
      <div class="tab-row">${tabs.map(([id, lbl]) => `<button class="tab ${tab === id ? "on" : ""}" data-action="media-tab" data-id="${id}">${lbl}</button>`).join("")}
        <span class="spacer"></span>${addBtn("Add title", "media-add")}</div>
      ${items.length ? `<ul class="media-list">
        ${items.map(m => `
          <li>
            <span class="media-poster" aria-hidden="true">${m.type === "Series" ? "📺" : "🎬"}</span>
            <span class="row-txt"><b>${esc(m.title)}</b><small>${m.type}${m.rating ? ` · ${"★".repeat(m.rating)}` : ""}</small></span>
            ${tab !== "done" ? `<button class="btn tiny" data-action="media-advance" data-id="${m.id}">${tab === "watchlist" ? "Start" : "Finish"}</button>` : ""}
            <button class="icon-btn ghost" data-action="media-del" data-id="${m.id}" aria-label="Delete title">${I.trash}</button>
          </li>`).join("")}
      </ul>` : emptyMsg("film", "Nothing here — add something to watch.", addBtn("Add a title", "media-add"))}`)}
  </div>`;
}

/* ---------- university ---------- */
function vUniversity() {
  const mins = weekDates().reduce((a, d) => a + (state.university.log[d] || 0), 0);
  const hrs = Math.round(mins / 6) / 10;
  const tasks = [...state.university.tasks].sort((a, b) => (a.done - b.done) || (a.due < b.due ? -1 : 1));
  return `
  <div class="grid">
    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">This week</p><h3>${hrs} / ${state.university.weeklyHours} study hours</h3>${barHtml(100 * hrs / state.university.weeklyHours, "#3e63dd")}</div>
        <span class="big-ic" style="--a:#3e63dd">${I.building}</span>
      </div>
      <div class="pill-row" style="margin-top:14px">
        <button class="btn ghost" data-action="study-log" data-kind="university" data-n="30">+30 min</button>
        <button class="btn ghost" data-action="study-log" data-kind="university" data-n="60">+1 h</button>
        <button class="btn ghost" data-action="uni-goal">${I.sliders}Goal</button>
      </div>`)}
    ${card("span2", cardHead("Tasks & deadlines", addBtn("Add task", "uni-task-add")) + (tasks.length ? `
      <ul class="check-list">
        ${tasks.map(k => `
          <li class="${k.done ? "done" : ""}">
            <button class="checkbox" data-action="uni-task-toggle" data-id="${k.id}" aria-label="Toggle ${esc(k.title)}">${I.check}</button>
            <span class="row-txt"><b>${esc(k.title)}</b><small>${niceDate(k.due)} · ${daysUntil(k.due)}</small></span>
            <button class="icon-btn ghost" data-action="uni-task-del" data-id="${k.id}" aria-label="Delete task">${I.trash}</button>
          </li>`).join("")}
      </ul>` : emptyMsg("building", "No tasks — enjoy the calm 🌤️", addBtn("Add a task", "uni-task-add"))))}
  </div>`;
}

/* ---------- work prep ---------- */
function vWork() {
  const items = state.work.items;
  const pct = items.length ? Math.round(100 * items.filter(i => i.done).length / items.length) : 0;
  return `
  <div class="grid">
    ${card("center", `${ring(pct, { size: 130, sw: 10, color: "#ad6f2d", center: pct + "%", sub: "ready", label: "work preparation progress" })}
      <p class="soft" style="margin-top:10px">Career preparation</p>`)}
    ${card("span2", cardHead("Checklist", addBtn("Add item", "work-add")) + (items.length ? `
      <ul class="check-list">
        ${items.map(k => `
          <li class="${k.done ? "done" : ""}">
            <button class="checkbox" data-action="work-toggle" data-id="${k.id}" aria-label="Toggle ${esc(k.title)}">${I.check}</button>
            <span class="row-txt"><b>${esc(k.title)}</b></span>
            <button class="icon-btn ghost" data-action="work-del" data-id="${k.id}" aria-label="Delete item">${I.trash}</button>
          </li>`).join("")}
      </ul>` : emptyMsg("briefcase", "Build your career checklist.", addBtn("Add an item", "work-add"))))}
  </div>`;
}

/* ---------- projects ---------- */
function vProjects() {
  const active = state.projects.filter(p => p.status !== "Done").length;
  return `
  <div class="grid">
    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">Active projects</p><h3>${active}</h3></div>
        <span class="big-ic" style="--a:#12a594">${I.rocket}</span>
      </div>`)}
    ${card("span2", cardHead("Projects", addBtn("New project", "project-add")) + (state.projects.length ? `
      <ul class="project-list">
        ${state.projects.map(p => `
          <li>
            <span class="row-emoji">${esc(p.emoji)}</span>
            <span class="row-txt"><b>${esc(p.name)}</b><small>${esc(p.status)}</small>${barHtml(p.progress, "#12a594")}</span>
            <b class="pct">${p.progress}%</b>
            <span class="pill-row">
              <button class="btn tiny" data-action="project-bump" data-id="${p.id}" data-n="10">+10%</button>
              ${p.status !== "Done" ? `<button class="btn tiny good" data-action="project-done" data-id="${p.id}">Done</button>` : ""}
              <button class="icon-btn ghost" data-action="project-del" data-id="${p.id}" aria-label="Delete project">${I.trash}</button>
            </span>
          </li>`).join("")}
      </ul>` : emptyMsg("rocket", "What are you building?", addBtn("Start a project", "project-add"))))}
  </div>`;
}

/* ---------- social ---------- */
function vSocial() {
  const w = socialWeek();
  return `
  <div class="grid">
    ${card("span2", `
      <div class="goal-row">
        <div><p class="soft">This week</p><h3>${w.done} / ${w.target} connections</h3>${barHtml(100 * w.done / (w.target || 1), "#e93d82")}</div>
        <span class="big-ic" style="--a:#e93d82">${I.users}</span>
      </div>`)}
    ${card("span2", cardHead("Connection goals", addBtn("Add goal", "social-add")) + (state.social.items.length ? `
      <ul class="check-list">
        ${state.social.items.map(itm => {
          const n = w.log[itm.id] || 0, hit = n >= itm.target;
          return `<li class="${hit ? "done" : ""}">
            <span class="row-emoji">${esc(itm.emoji)}</span>
            <span class="row-txt"><b>${esc(itm.title)}</b><small>${n} / ${itm.target} this week</small></span>
            <span class="pill-row">
              <button class="btn tiny" data-action="social-bump" data-id="${itm.id}">+1</button>
              <button class="icon-btn ghost" data-action="social-del" data-id="${itm.id}" aria-label="Delete goal">${I.trash}</button>
            </span>
          </li>`;
        }).join("")}
      </ul>` : emptyMsg("users", "Relationships are the best investment.", addBtn("Add a goal", "social-add"))))}
  </div>`;
}

/* ---------- memories ---------- */
function vMemories() {
  const mem = [...state.memories].sort((a, b) => b.date < a.date ? -1 : 1);
  return `
  <div class="grid">
    ${card("span2", cardHead(`Your memories <small class="soft">${mem.length}</small>`, addBtn("Add memory", "memory-add")) + (mem.length ? `
      <div class="memory-grid">
        ${mem.map(m => `
          <figure class="memory" style="--h:${m.hue}">
            <span class="memory-emoji">${esc(m.emoji)}</span>
            <figcaption><b>${esc(m.title)}</b><small>${niceDate(m.date, { month: "short", day: "numeric", year: "numeric" })}</small>${m.note ? `<p>${esc(m.note)}</p>` : ""}</figcaption>
            <button class="icon-btn ghost memory-del" data-action="memory-del" data-id="${m.id}" aria-label="Delete memory">${I.x}</button>
          </figure>`).join("")}
      </div>` : emptyMsg("camera", "Collect moments, not things.", addBtn("Save your first memory", "memory-add"))))}
  </div>`;
}

/* ---------- journal ---------- */
function vJournal() {
  const entry = journalToday();
  const moods = ["😄", "🙂", "😌", "😐", "😔"];
  const past = state.journal.filter(j => j.date !== todayIso()).sort((a, b) => b.date < a.date ? -1 : 1).slice(0, 14);
  return `
  <div class="grid">
    ${card("span2", cardHead(`Today · ${niceDate(todayIso(), { month: "long", day: "numeric" })}`) + `
      <textarea class="journal-input" id="journalText" placeholder="What's on your mind? A few honest lines beat a perfect page…">${esc(entry?.text || "")}</textarea>
      <div class="journal-foot">
        <span class="mood-row">${moods.map(m => `<button class="mood ${entry?.mood === m ? "on" : ""}" data-action="journal-mood" data-m="${m}">${m}</button>`).join("")}</span>
        <span class="pill-row">
          ${["Grateful", "Happy", "Focused", "Tired"].map(tag => `<button class="tag ${entry?.tags?.includes(tag) ? "on" : ""}" data-action="journal-tag" data-tag="${tag}">${tag}</button>`).join("")}
        </span>
        <button class="btn primary" data-action="journal-save">${I.check}Save entry</button>
      </div>`)}
    ${past.length ? card("span2", cardHead("Earlier entries") + `
      <ul class="journal-list">
        ${past.map(j => `<li><span class="j-date"><b>${niceDate(j.date)}</b>${j.mood ? `<span>${j.mood}</span>` : ""}</span><p>${esc(j.text)}</p>${j.tags?.length ? `<span class="j-tags">${j.tags.map(x => `<i>${esc(x)}</i>`).join("")}</span>` : ""}</li>`).join("")}
      </ul>`) : ""}
  </div>`;
}

/* ---------- progress ---------- */
function vProgress() {
  const days = [...Array(14)].map((_, i) => addDays(todayIso(), i - 13));
  const xpData = days.map(d => ({ label: +d.slice(-2), value: state.xpLog[d] || 0, tip: `${niceDate(d)} · ${state.xpLog[d] || 0} XP` }));
  const li = levelInfo();
  return `
  <div class="grid">
    ${card("", `
      <div class="totals">
        <div><b>${state.xp.toLocaleString()}</b><small>total XP</small></div>
        <div><b>${li.lvl}</b><small>level</small></div>
        <div><b>${perfectStreak()}</b><small>day streak</small></div>
        <div><b>${Object.keys(state.badges).length}/${BADGES.length}</b><small>badges</small></div>
      </div>`)}
    ${card("", cardHead("Areas today") + `
      <ul class="area-progress">
        ${AREAS.slice(0, 8).map(a => {
          const p = areaProgressToday(a.id);
          return `<li data-nav="${a.id}"><span class="dot" style="background:${a.hue}"></span>${esc(a.name)}${barHtml(p, a.hue)}<b>${p}%</b></li>`;
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
  const logos = { gcal: "📅", notion: "📝", gfit: "❤️", spotify: "🎧", youtube: "▶️" };
  return `
  <div class="grid">
    ${card("span2", cardHead("Connected apps") + `
      <ul class="int-list">
        ${state.integrations.map(x => `
          <li>
            <span class="int-logo">${logos[x.id] || "🔌"}</span>
            <span class="row-txt"><b>${esc(x.name)}</b><small>${esc(x.desc)}</small></span>
            <button class="switch ${x.on ? "on" : ""}" data-action="int-toggle" data-id="${x.id}" role="switch" aria-checked="${x.on}" aria-label="Toggle ${esc(x.name)}"><i></i></button>
          </li>`).join("")}
      </ul>
      <p class="soft note">${I.zap} Connections here are placeholders — LifeHub stores everything locally in your browser. Real syncing would need each service's API.</p>`)}
  </div>`;
}

/* ---------- profile ---------- */
function vProfile() {
  const li = levelInfo();
  return `
  <div class="grid">
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
        <button class="btn danger" data-action="data-reset">${I.trash}Reset everything</button>
      </div>
      <p class="soft note">Everything lives in this browser's local storage — export regularly if you care about it.</p>`)}
  </div>`;
}

/* ================= render ================= */
const VIEWS = {
  today: vToday, dashboard: vDashboard, habits: vHabits, health: vHealth, workout: vWorkout,
  nutrition: vNutrition, skills: vSkills, reading: vReading, media: vMedia,
  university: vUniversity, work: vWork, projects: vProjects, social: vSocial,
  memories: vMemories, journal: vJournal, progress: vProgress,
  integrations: vIntegrations, profile: vProfile,
};

function render() {
  checkMissions();
  $("#view").innerHTML = (VIEWS[currentView] || vDashboard)();
  renderNav();
  renderTopbar();
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
  "quick-add": openQuickAdd,
  "go-journal": () => { closeModal(); go("journal"); },

  /* Today agenda + tasks */
  "ag-habit": (el) => { setCursor("habits", todayIso()); toggleHabit(el.dataset.id); render(); },
  "ag-meal": (el) => { const t = todayIso(); const l = state.nutrition.log[t] = state.nutrition.log[t] || {}; l[el.dataset.id] = !l[el.dataset.id]; if (l[el.dataset.id]) addXp(5, "Meal logged"); save(); render(); },
  "ag-task": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.done = !td.done; if (td.done) addXp(5, "Task done"); save(); render(); } },
  "ag-reflect": openReflectModal,
  "todo-open": (el) => openTaskDetail(el.dataset.id),
  "todo-toggle": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.done = !td.done; if (td.done) { addXp(5, "Task done"); if (td.habitId) completeHabitToday(td.habitId); } save(); closeModal(); render(); } },
  "todo-del": (el) => { state.todos = state.todos.filter(x => x.id !== el.dataset.id); save(); closeModal(); render(); },
  "task-add": () => formModal("New task",
    fld("Task", txt("text", "e.g. Calisthenics workout")) +
    `<div class="fld-row"><label class="fld"><span>Time (optional)</span><input type="time" name="time"></label>
     <label class="fld"><span>Counts toward habit</span><select name="habitId"><option value="">Auto-detect</option><option value="none">None</option>${state.habits.map(h => `<option value="${h.id}">${esc(h.emoji)} ${esc(h.name)}</option>`).join("")}</select></label></div>`, "todo-add"),

  /* day navigation (shared) */
  "day-prev": (el) => { const v = el.dataset.view; setCursor(v, addDays(dayCursor(v), -1)); render(); },
  "day-next": (el) => { const v = el.dataset.view; const nd = addDays(dayCursor(v), 1); if (nd <= todayIso()) { setCursor(v, nd); render(); } },
  "day-today": (el) => { setCursor(el.dataset.view, todayIso()); render(); },

  /* habits */
  "habit-add": () => formModal("New habit", habitFormFields(), "habit-add"),
  "habit-library": openHabitLibrary,
  "habit-tmpl": (el) => {
    const t = HABIT_TEMPLATES[+el.dataset.i]; if (!t) return;
    state.habits.push({ id: uid(), name: t.name, emoji: t.emoji || "✅", type: t.type || "build", target: t.target || 0, unit: t.unit || "", why: t.why || "", cadence: t.cadence || { mode: "daily" }, kind: t.kind || "", goalId: null, milestones: [], log: {} });
    save(); render(); toast(`Added ${t.emoji} ${t.name}`);
  },
  "workout-library": openWorkoutLibrary,
  "workout-tmpl": (el) => {
    const t = WORKOUT_TEMPLATES[+el.dataset.i]; if (!t) return;
    const d = dayCursor("workout");
    const sess = { id: uid(), date: d, category: t.category || "Strength", planId: null, planName: t.name, note: "", exercises: t.ex.map(n => ({ id: uid(), name: n, kind: "reps", sets: [] })), media: [] };
    state.workout.sessions.push(sess);
    (state.workout.log[d] = state.workout.log[d] || []).push(sess.id);
    if (d === todayIso()) addXp(20, "Workout");
    save(); render(); toast(`${t.name} added — log your sets 💪`);
  },
  "habit-day": (el) => { if (el.dataset.d <= todayIso()) { setCursor("habits", el.dataset.d); render(); } },
  "habit-open": (el) => openHabitDetail(el.dataset.id),
  "habit-toggle": (el) => { toggleHabit(el.dataset.id); render(); },
  "habit-toggle-d": (el) => { toggleHabit(el.dataset.id); render(); openHabitDetail(el.dataset.id); },
  "habit-inc": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { addHabitAmount(h, dayCursor("habits"), habitStep(h)); render(); if ($("#modal").innerHTML) openHabitDetail(h.id); } },
  "habit-dec": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { addHabitAmount(h, dayCursor("habits"), -habitStep(h)); render(); openHabitDetail(h.id); } },
  "habit-skip": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { const e = ensureHabitEntry(h, dayCursor("habits")); e.skip = !e.skip; if (!e.skip && !e.done && !e.note && !e.amount && !e.workoutId && !e.slip) delete h.log[dayCursor("habits")]; save(); render(); openHabitDetail(h.id); } },
  "habit-make-workout": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { h.kind = "workout"; save(); render(); openHabitDetail(h.id); } },
  "habit-log-workout": (el) => {
    const h = state.habits.find(x => x.id === el.dataset.id); if (!h) return;
    const d = dayCursor("habits");
    const sess = { id: uid(), date: d, category: "Strength", planId: null, note: `From habit: ${h.name}`, exercises: [], media: [] };
    state.workout.sessions.push(sess);
    (state.workout.log[d] = state.workout.log[d] || []).push(sess.id);
    const e = ensureHabitEntry(h, d); e.done = true; e.workoutId = sess.id;
    if (d === todayIso()) addXp(20, "Workout");
    save(); render(); openHabitDetail(h.id);
    toast("Workout session created 💪");
  },
  "habit-goto-workout": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { const e = habitEntry(h, dayCursor("habits")); if (e && e.workoutId) setCursor("workout", dayCursor("habits")); closeModal(); go("workout"); } },
  "habit-edit": (el) => {
    const h = state.habits.find(x => x.id === el.dataset.id);
    formModal("Edit habit", habitFormFields(h) + `<input type="hidden" name="id" value="${h.id}">`, "habit-edit");
  },
  "habit-del": (el) => { state.habits = state.habits.filter(x => x.id !== el.dataset.id); save(); closeModal(); render(); },
  "habit-del-d": (el) => { state.habits = state.habits.filter(x => x.id !== el.dataset.id); save(); closeModal(); render(); },
  "ms-add": (el) => { const id = el.dataset.id; formModal("New milestone", fld("Milestone", txt("text", "e.g. 30-day streak")) + `<input type="hidden" name="hid" value="${id}">`, "ms-add"); },
  "ms-toggle": (el) => { const h = state.habits.find(x => x.id === el.dataset.h); const m = h && h.milestones.find(x => x.id === el.dataset.m); if (m) { m.done = !m.done; if (m.done) addXp(15, "Milestone"); save(); render(); openHabitDetail(h.id); } },
  "ms-del": (el) => { const h = state.habits.find(x => x.id === el.dataset.h); if (h) { h.milestones = h.milestones.filter(x => x.id !== el.dataset.m); save(); render(); openHabitDetail(h.id); } },

  /* goals */
  "goal-add": () => formModal("New goal", fld("Title", txt("title", "e.g. Run a half marathon")) + fld("Emoji", txt("emoji", "🎯", "🎯", false)), "goal-add"),
  "goal-open": (el) => openGoalDetail(el.dataset.id),
  "goal-edit": (el) => { const g = state.goals.find(x => x.id === el.dataset.id); formModal("Edit goal", fld("Title", txt("title", "", g.title)) + fld("Emoji", txt("emoji", "", g.emoji || "🎯", false)) + `<input type="hidden" name="id" value="${g.id}">`, "goal-edit"); },
  "goal-del": (el) => { state.goals = state.goals.filter(x => x.id !== el.dataset.id); state.habits.forEach(h => { if (h.goalId === el.dataset.id) h.goalId = null; }); save(); closeModal(); render(); },
  "gms-add": (el) => { const id = el.dataset.id; formModal("New milestone", fld("Milestone", txt("text", "e.g. Finish week 4")) + `<input type="hidden" name="gid" value="${id}">`, "gms-add"); },
  "gms-toggle": (el) => { const g = state.goals.find(x => x.id === el.dataset.g); const m = g && g.milestones.find(x => x.id === el.dataset.m); if (m) { m.done = !m.done; if (m.done) addXp(15, "Milestone"); save(); render(); openGoalDetail(g.id); } },
  "gms-del": (el) => { const g = state.goals.find(x => x.id === el.dataset.g); if (g) { g.milestones = g.milestones.filter(x => x.id !== el.dataset.m); save(); render(); openGoalDetail(g.id); } },

  /* health */
  "steps-add": (el) => { const l = state.health.log[todayIso()] = healthToday(); l.steps = (l.steps || 0) + +el.dataset.n; save(); render(); },
  "water-add": (el) => { const l = state.health.log[todayIso()] = healthToday(); l.water = +((l.water || 0) + +el.dataset.n).toFixed(2); save(); render(); },
  "mood-set": (el) => { const l = state.health.log[todayIso()] = healthToday(); l.mood = l.mood === el.dataset.m ? "" : el.dataset.m; save(); render(); },
  "health-goals": () => formModal("Health goals",
    fld("Daily steps", num("steps", state.health.goals.steps, 1000, 500)) +
    fld("Water (L)", num("water", state.health.goals.water, 0.5, 0.25)) +
    fld("Sleep (h)", num("sleep", state.health.goals.sleep, 4, 0.5)), "health-goals"),

  /* workout */
  "workout-day": (el) => { if (el.dataset.d <= todayIso()) { setCursor("workout", el.dataset.d); render(); } },
  "workout-add": () => formModal("Add to plan",
    fld("Name", txt("name", "e.g. Pull-ups")) +
    fld("Type", `<select name="category">${WORKOUT_CATS.map(c => `<option>${c}</option>`).join("")}</select>`) +
    `<div class="fld-row">${fld("Minutes", num("minutes", 30, 1, 5))}${fld("Sets", num("sets", 0, 0))}${fld("Reps", num("reps", 0, 0))}</div>` +
    fld("Emoji", txt("emoji", "🏋️", "🏋️", false)), "workout-add"),
  "workout-toggle": (el) => {
    const p = state.workout.plan.find(x => x.id === el.dataset.id); if (!p) return;
    const d = dayCursor("workout");
    const existing = state.workout.sessions.find(s => s.date === d && s.planId === p.id);
    if (existing) { removeSession(existing.id); }
    else {
      const sess = { id: uid(), date: d, category: p.category || "Strength", planId: p.id, planName: p.name, note: "", exercises: [], media: [] };
      state.workout.sessions.push(sess);
      (state.workout.log[d] = state.workout.log[d] || []).push(sess.id);
      if (d === todayIso()) addXp(20, "Workout");
    }
    save(); render();
  },
  "workout-del": (el) => { state.workout.plan = state.workout.plan.filter(p => p.id !== el.dataset.id); save(); render(); },
  "session-add": () => formModal("Log a session",
    fld("Type", `<select name="category">${WORKOUT_CATS.map(c => `<option>${c}</option>`).join("")}</select>`) +
    fld("What did you do?", `<textarea name="note" placeholder="Sets, reps, how it felt…" maxlength="600"></textarea>`), "session-add"),
  "session-note": (el) => { const s = state.workout.sessions.find(x => x.id === el.dataset.id); if (s) formModal("Session note", fld("Notes", `<textarea name="note" maxlength="600">${esc(s.note || "")}</textarea>`) + `<input type="hidden" name="id" value="${s.id}">`, "session-note"); },
  "session-del": (el) => { removeSession(el.dataset.id); save(); render(); },
  "session-media-del": (el) => { const s = state.workout.sessions.find(x => x.id === el.dataset.s); if (s) { s.media = (s.media || []).filter(m => m.id !== el.dataset.m); mediaDelete(el.dataset.m); save(); render(); } },
  "ex-add": (el) => formModal("Add exercise",
    fld("Exercise", txt("name", "e.g. Bench press")) +
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
    fld("Slot", `<select name="slot">${["Breakfast", "Lunch", "Dinner", "Snacks"].map(s => `<option>${s}</option>`).join("")}</select>`) +
    fld("Description", txt("name", "e.g. Oatmeal & berries")) +
    `<div class="fld-row">${fld("kcal", num("kcal", 400, 0, 10))}${fld("Protein g", num("protein", 20, 0, 1))}${fld("Carbs g", num("carbs", 40, 0, 1))}${fld("Fats g", num("fats", 10, 0, 1))}</div>`, "meal-add"),
  "meal-toggle": (el) => {
    const t = todayIso(); const l = state.nutrition.log[t] = state.nutrition.log[t] || {};
    l[el.dataset.id] = !l[el.dataset.id];
    if (l[el.dataset.id]) addXp(5, "Meal logged");
    save(); render();
  },
  "meal-del": (el) => { state.nutrition.meals = state.nutrition.meals.filter(m => m.id !== el.dataset.id); save(); render(); },
  "nutrition-goals": () => formModal("Nutrition goals",
    fld("Calories", num("kcal", state.nutrition.goals.kcal, 800, 50)) +
    `<div class="fld-row">${fld("Protein g", num("protein", state.nutrition.goals.protein))}${fld("Carbs g", num("carbs", state.nutrition.goals.carbs))}${fld("Fats g", num("fats", state.nutrition.goals.fats))}</div>`, "nutrition-goals"),

  /* skills / university */
  "study-log": (el) => {
    const k = el.dataset.kind, t = todayIso();
    state[k].log[t] = (state[k].log[t] || 0) + +el.dataset.n;
    addXp(Math.round(+el.dataset.n / 6), "Study time");
    save(); render();
  },
  "skills-goal": () => formModal("Monthly goal", fld("Study hours per month", num("hours", state.skills.monthlyHours, 1)), "skills-goal"),
  "uni-goal": () => formModal("Weekly goal", fld("Study hours per week", num("hours", state.university.weeklyHours, 1)), "uni-goal"),
  "course-add": () => formModal("New course", fld("Course name", txt("name", "e.g. Python for beginners")), "course-add"),
  "course-bump": (el) => {
    const c = state.skills.courses.find(x => x.id === el.dataset.id);
    const was = c.progress;
    c.progress = clamp(c.progress + +el.dataset.n, 0, 100);
    if (c.progress === 100 && was < 100) addXp(40, `${c.name} completed`);
    save(); render();
  },
  "course-del": (el) => { state.skills.courses = state.skills.courses.filter(c => c.id !== el.dataset.id); save(); render(); },
  "uni-task-add": () => formModal("New task",
    fld("Task", txt("title", "e.g. Calculus assignment")) + fld("Due date", `<input type="date" name="due" value="${addDays(todayIso(), 3)}" required>`), "uni-task-add"),
  "uni-task-toggle": (el) => {
    const k = state.university.tasks.find(x => x.id === el.dataset.id);
    k.done = !k.done; if (k.done) addXp(15, k.title);
    save(); render();
  },
  "uni-task-del": (el) => { state.university.tasks = state.university.tasks.filter(k => k.id !== el.dataset.id); save(); render(); },

  /* reading */
  "reading-tab": (el) => { state._readingTab = el.dataset.id; render(); },
  "book-add": () => formModal("Add book",
    `<label class="cover-upload add">
       <input type="file" accept="image/*" data-change="book-cover-new" hidden>
       <span class="cover-preview" id="coverPreview">${I.upload}<i>Add cover</i></span>
     </label>
     <input type="hidden" name="cover" id="coverField">` +
    fld("Title", txt("title", "e.g. Atomic Habits")) + fld("Author", txt("author", "", "", false)) +
    `<div class="fld-row">${fld("Pages", num("pages", 300, 1))}${fld("Genre", txt("genre", "e.g. Self-help", "", false))}</div>` +
    fld("Emoji (used if no cover)", txt("emoji", "📘", "📘", false)), "book-add"),
  "book-open": (el) => openBookDetail(el.dataset.id),
  "book-rate": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b) { b.rating = +el.dataset.r; save(); checkBadges(); render(); openBookDetail(b.id); } },
  "book-fav": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b) { b.favorite = !b.favorite; if (b.favorite) toast("Added to favorites ♥"); save(); render(); openBookDetail(b.id); } },
  "book-page": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (b) { b.page = clamp((b.page || 0) + +el.dataset.d, 0, b.pages); state.reading.log[todayIso()] = true; save(); render(); openBookDetail(b.id); }
  },
  "book-start-d": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b) { b.status = "current"; b.started = todayIso(); save(); render(); openBookDetail(b.id); } },
  "book-finish-d": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (b) { const was = b.status; b.status = "done"; b.page = b.pages; b.finished = todayIso(); if (was !== "done") addXp(50, `Finished ${b.title}`); state._readingTab = "done"; save(); checkBadges(); render(); openBookDetail(b.id); }
  },
  "book-reread": (el) => { const b = state.reading.books.find(x => x.id === el.dataset.id); if (b) { b.status = "current"; b.page = 0; b.started = todayIso(); state._readingTab = "current"; save(); render(); openBookDetail(b.id); } },
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
  "book-del-d": (el) => { state.reading.books = state.reading.books.filter(b => b.id !== el.dataset.id); save(); closeModal(); render(); toast("Book removed"); },

  /* media */
  "media-tab": (el) => { state._mediaTab = el.dataset.id; render(); },
  "media-add": () => formModal("Add to watchlist",
    fld("Title", txt("title", "e.g. Interstellar")) + fld("Type", `<select name="type"><option>Movie</option><option>Series</option></select>`), "media-add"),
  "media-advance": (el) => {
    const m = state.media.find(x => x.id === el.dataset.id);
    if (m.status === "watchlist") { m.status = "watching"; save(); render(); }
    else formModal(`Finished “${esc(m.title)}”`, fld("Rating", `<select name="rating">${[5, 4, 3, 2, 1].map(r => `<option value="${r}">${"★".repeat(r)}</option>`).join("")}</select>`) + `<input type="hidden" name="id" value="${m.id}">`, "media-finish", "Done");
  },
  "media-del": (el) => { state.media = state.media.filter(m => m.id !== el.dataset.id); save(); render(); },

  /* work / projects / social / memories */
  "work-add": () => formModal("New checklist item", fld("Item", txt("title", "e.g. Update portfolio")), "work-add"),
  "work-toggle": (el) => { const k = state.work.items.find(x => x.id === el.dataset.id); k.done = !k.done; if (k.done) addXp(15, k.title); save(); render(); },
  "work-del": (el) => { state.work.items = state.work.items.filter(k => k.id !== el.dataset.id); save(); render(); },
  "project-add": () => formModal("New project", fld("Name", txt("name", "e.g. Portfolio site")) + fld("Emoji", txt("emoji", "🚀", "🚀", false)), "project-add"),
  "project-bump": (el) => { const p = state.projects.find(x => x.id === el.dataset.id); p.progress = clamp(p.progress + +el.dataset.n, 0, 100); if (p.status === "Planning") p.status = "In progress"; save(); render(); },
  "project-done": (el) => { const p = state.projects.find(x => x.id === el.dataset.id); p.status = "Done"; p.progress = 100; addXp(60, `${p.name} shipped`); save(); render(); },
  "project-del": (el) => { state.projects = state.projects.filter(p => p.id !== el.dataset.id); save(); render(); },
  "social-add": () => formModal("New connection goal",
    fld("Goal", txt("title", "e.g. Call grandma")) + `<div class="fld-row">${fld("Times per week", num("target", 1, 1))}${fld("Emoji", txt("emoji", "📞", "📞", false))}</div>`, "social-add"),
  "social-bump": (el) => {
    const wk = weekKey(); const log = state.social.log[wk] = state.social.log[wk] || {};
    const itm = state.social.items.find(x => x.id === el.dataset.id);
    log[itm.id] = (log[itm.id] || 0) + 1;
    if (log[itm.id] === itm.target) addXp(15, itm.title);
    checkBadges(); save(); render();
  },
  "social-del": (el) => { state.social.items = state.social.items.filter(x => x.id !== el.dataset.id); save(); render(); },
  "memory-add": () => formModal("New memory",
    fld("Title", txt("title", "e.g. Sunset picnic")) + fld("Note", `<textarea name="note" placeholder="What made it special?" maxlength="240"></textarea>`) +
    `<div class="fld-row">${fld("Emoji", txt("emoji", "🌅", "🌅", false))}${fld("Date", `<input type="date" name="date" value="${todayIso()}" required>`)}</div>`, "memory-add"),
  "memory-del": (el) => { state.memories = state.memories.filter(m => m.id !== el.dataset.id); save(); render(); },

  /* journal */
  "journal-mood": (el) => { const e = ensureJournal(); e.mood = e.mood === el.dataset.m ? "" : el.dataset.m; save(); render(); },
  "journal-tag": (el) => {
    const e = ensureJournal(); e.tags = e.tags || [];
    const i = e.tags.indexOf(el.dataset.tag);
    if (i >= 0) e.tags.splice(i, 1); else e.tags.push(el.dataset.tag);
    save(); render();
  },
  "journal-save": () => {
    const text = $("#journalText").value.trim();
    if (!text) { toast("Write a few lines first ✍️"); return; }
    const existed = !!journalToday()?.text;
    const e = ensureJournal(); e.text = text;
    if (!existed) addXp(15, "Journal entry");
    save(); render(); toast("Entry saved");
  },

  /* integrations */
  "int-toggle": (el) => {
    const x = state.integrations.find(i => i.id === el.dataset.id);
    x.on = !x.on; save(); render();
    toast(x.on ? `${x.name} connected (simulated)` : `${x.name} disconnected`);
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
        try { state = Object.assign(defaultState(), JSON.parse(txtC)); save(); applyTheme(); render(); toast("Data imported ✓"); }
        catch { toast("That file doesn't look like a LifeHub export"); }
      });
    };
    inp.click();
  },
  "data-reset": () => formModal("Reset everything?",
    `<p class="soft">This deletes all your LifeHub data in this browser. There is no undo — export first if unsure.</p>`, "data-reset", "Yes, reset"),
};

function ensureJournal() {
  let e = journalToday();
  if (!e) { e = { id: uid(), date: todayIso(), text: "", mood: "", tags: [] }; state.journal.push(e); }
  return e;
}

/* form submits */
const SUBMITS = {
  "habit-add": (f) => { state.habits.push({ id: uid(), name: f.name, emoji: f.emoji || "✅", type: f.type || "build", target: +f.target || 0, unit: f.unit || "", why: f.why || "", cadence: parseCadence(f), kind: f.kind ? "workout" : "", goalId: null, milestones: [], log: {} }); },
  "habit-edit": (f) => { const h = state.habits.find(x => x.id === f.id); if (h) { h.name = f.name; h.emoji = f.emoji || h.emoji; h.type = f.type || "build"; h.target = +f.target || 0; h.unit = f.unit || ""; h.why = f.why || ""; h.cadence = parseCadence(f); h.kind = f.kind ? "workout" : ""; } },
  "ms-add": (f) => { const h = state.habits.find(x => x.id === f.hid); if (h) h.milestones.push({ id: uid(), text: f.text, done: false }); },
  "goal-add": (f) => { state.goals.push({ id: uid(), title: f.title, emoji: f.emoji || "🎯", milestones: [] }); },
  "goal-edit": (f) => { const g = state.goals.find(x => x.id === f.id); if (g) { g.title = f.title; g.emoji = f.emoji || g.emoji; } },
  "gms-add": (f) => { const g = state.goals.find(x => x.id === f.gid); if (g) g.milestones.push({ id: uid(), text: f.text, done: false }); },
  "health-goals": (f) => { state.health.goals = { steps: +f.steps, water: +f.water, sleep: +f.sleep }; },
  "workout-add": (f) => { state.workout.plan.push({ id: uid(), name: f.name, category: f.category || "", minutes: +f.minutes, sets: +f.sets || 0, reps: +f.reps || 0, emoji: f.emoji || "🏋️" }); },
  "session-add": (f) => { const d = dayCursor("workout"); const sess = { id: uid(), date: d, category: f.category || "Strength", planId: null, planName: "", note: f.note || "", exercises: [], media: [] }; state.workout.sessions.push(sess); (state.workout.log[d] = state.workout.log[d] || []).push(sess.id); if (d === todayIso()) addXp(20, "Workout"); },
  "session-note": (f) => { const s = state.workout.sessions.find(x => x.id === f.id); if (s) s.note = f.note; },
  "ex-add": (f) => { const s = state.workout.sessions.find(x => x.id === f.sid); if (s) { s.exercises = s.exercises || []; s.exercises.push({ id: uid(), name: f.name, kind: f.kind || "reps", sets: [] }); } },
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
    if (after > before && before > 0) toast(`New PR on ${ex.name} — ${prLabel(ex.kind, after)} 🏆`, "badge");
    addXp(5, "Set logged");
  },
  "meal-add": (f) => { state.nutrition.meals.push({ id: uid(), slot: f.slot, name: f.name, kcal: +f.kcal, protein: +f.protein, carbs: +f.carbs, fats: +f.fats }); },
  "nutrition-goals": (f) => { state.nutrition.goals = { kcal: +f.kcal, protein: +f.protein, carbs: +f.carbs, fats: +f.fats }; },
  "skills-goal": (f) => { state.skills.monthlyHours = +f.hours; },
  "uni-goal": (f) => { state.university.weeklyHours = +f.hours; },
  "course-add": (f) => { state.skills.courses.push({ id: uid(), name: f.name, progress: 0 }); },
  "uni-task-add": (f) => { state.university.tasks.push({ id: uid(), title: f.title, due: f.due, done: false }); },
  "book-add": (f) => { state.reading.books.push({ id: uid(), title: f.title, author: f.author || "Unknown", emoji: f.emoji || "📘", cover: f.cover || null, genre: f.genre || "", notes: "", favorite: false, status: "current", pages: +f.pages, page: 0, rating: 0, started: todayIso() }); },
  "book-edit": (f) => {
    const b = state.reading.books.find(x => x.id === f.id);
    if (b) { b.title = f.title; b.author = f.author || b.author; b.pages = Math.max(1, +f.pages); b.page = clamp(b.page, 0, b.pages); b.genre = f.genre || ""; b.emoji = f.emoji || b.emoji; }
  },
  "media-add": (f) => { state.media.push({ id: uid(), title: f.title, type: f.type, status: "watchlist", rating: 0 }); },
  "media-finish": (f) => { const m = state.media.find(x => x.id === f.id); if (m) { m.status = "done"; m.rating = +f.rating; addXp(10, `Finished ${m.title}`); } },
  "work-add": (f) => { state.work.items.push({ id: uid(), title: f.title, done: false }); },
  "project-add": (f) => { state.projects.push({ id: uid(), name: f.name, emoji: f.emoji || "🚀", status: "Planning", progress: 0, note: "" }); },
  "social-add": (f) => { state.social.items.push({ id: uid(), title: f.title, emoji: f.emoji || "🤝", target: Math.max(1, +f.target) }); },
  "memory-add": (f) => { state.memories.push({ id: uid(), date: f.date, title: f.title, note: f.note || "", emoji: f.emoji || "📸", hue: Math.floor(Math.random() * 360) }); addXp(10, "Memory saved"); },
  "todo-add": (f) => {
    if (!f.text) return;
    const habitId = f.habitId === "none" ? "" : (f.habitId || suggestHabitForText(f.text));
    state.todos.push({ id: uid(), text: f.text, done: false, date: todayIso(), time: f.time || "", habitId: habitId || "" });
  },
  "profile-save": (f) => { state.profile.name = f.name; state.profile.avatar = f.avatar || state.profile.avatar; state.profile.onboarded = true; },
  "data-reset": () => { localStorage.removeItem(STORE_KEY); state = seedState(defaultState()); state.profile.onboarded = true; save(); },
};

/* changes (inputs) */
const CHANGES = {
  "sleep-set": (el) => { const l = state.health.log[todayIso()] = healthToday(); l.sleep = clamp(+el.value || 0, 0, 24); save(); render(); },
  "habit-note": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { const e = ensureHabitEntry(h, dayCursor("habits")); e.note = el.value.slice(0, 600); save(); } },
  "habit-goal": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { h.goalId = el.value || null; save(); } },
  "habit-amount": (el) => { const h = state.habits.find(x => x.id === el.dataset.id); if (h) { const was = habitMet(h, dayCursor("habits")); const e = ensureHabitEntry(h, dayCursor("habits")); e.amount = Math.max(0, +el.value || 0); if (!was && habitMet(h, dayCursor("habits")) && dayCursor("habits") === todayIso()) addXp(10, h.name); save(); render(); openHabitDetail(h.id); } },
  "reflection": (el) => {
    const v = el.value.trim();
    if (v) { state.reflections[todayIso()] = v.slice(0, 1000); const jid = suggestHabitForText("reflection journal"); if (jid) completeHabitToday(jid); }
    else delete state.reflections[todayIso()];
    save();
  },
  "task-text": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.text = el.value.slice(0, 120); save(); } },
  "task-time": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.time = el.value || ""; save(); } },
  "task-habit": (el) => { const td = state.todos.find(x => x.id === el.dataset.id); if (td) { td.habitId = el.value || ""; save(); render(); openTaskDetail(td.id); } },
  "session-media": (el) => {
    const s = state.workout.sessions.find(x => x.id === el.dataset.id); if (!s) return;
    storeMediaFile(el.files[0], (ref) => { s.media = s.media || []; s.media.push(ref); save(); render(); toast(`${ref.kind === "video" ? "Video" : "Photo"} added 📎`); });
  },
  "book-page-set": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (b) { b.page = clamp(+el.value || 0, 0, b.pages); state.reading.log[todayIso()] = true; save(); render(); openBookDetail(b.id); }
  },
  "book-notes": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (b) { b.notes = el.value.slice(0, 1200); save(); }   // no re-render: keep the textarea focused
  },
  "book-cover-pick": (el) => {
    const b = state.reading.books.find(x => x.id === el.dataset.id);
    if (!b) return;
    processCover(el.files[0], (dataUrl) => {
      try { b.cover = dataUrl; save(); render(); openBookDetail(b.id); toast("Cover updated 📚"); }
      catch { toast("That image is too large to save"); }
    });
  },
  "book-cover-new": (el) => {
    processCover(el.files[0], (dataUrl) => {
      const field = $("#coverField"), preview = $("#coverPreview");
      if (field) field.value = dataUrl;
      if (preview) { preview.style.backgroundImage = `url('${dataUrl}')`; preview.classList.add("has-img"); preview.innerHTML = ""; }
    });
  },
};

/* ================= events ================= */
function bindEvents() {
  document.addEventListener("click", (e) => {
    const act = e.target.closest("[data-action]");
    if (act && ACTIONS[act.dataset.action]) { ACTIONS[act.dataset.action](act); return; }
    const nav = e.target.closest("[data-nav]");
    if (nav) { go(nav.dataset.nav); return; }
    if (e.target === $("#modalBackdrop")) closeModal();
    if (e.target === $("#drawerBackdrop")) closeDrawer();
  });
  document.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-submit]");
    if (!form) return;
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    Object.keys(data).forEach(k => { if (typeof data[k] === "string") data[k] = data[k].trim(); });
    const fn = SUBMITS[form.dataset.submit];
    if (fn) { fn(data); save(); closeModal(); checkBadges(); render(); }
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
bindEvents();
bindTip();
render();
maybeOnboard();
