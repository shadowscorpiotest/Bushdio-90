/* ============================================================
   Life OS — all-in-one life planner
   Everything lives in localStorage; no server, no build step.
   ============================================================ */
"use strict";

/* ---------- tiny utils ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const DAY_MS = 86400000;
const iso = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const todayIso = () => iso(new Date());
const addDays = (dateIso, n) => iso(new Date(dateIso + "T12:00:00").getTime() + n * DAY_MS);
const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const money = (n) => (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
const niceDate = (dateIso) => new Date(dateIso + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function weekDates() {
  // Monday..Sunday of the current week, as ISO dates
  const t = todayIso();
  const mondayOffset = (new Date().getDay() + 6) % 7;
  const monday = addDays(t, -mondayOffset);
  return [...Array(7)].map((_, i) => addDays(monday, i));
}

function daysUntil(dateIso) {
  const diff = Math.round((new Date(dateIso + "T12:00:00") - new Date(todayIso() + "T12:00:00")) / DAY_MS);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff < 0) return `${-diff}d ago`;
  return `in ${diff}d`;
}

/* ---------- state ---------- */
const STORE_KEY = "lifeos-v1";
let state = null;

function defaultState() {
  return {
    settings: { name: "", theme: "auto", apiKey: "" },
    habits: [],
    tasks: [],       // {id,title,done,date|null,day|null(0=Mon..6=Sun),createdAt}
    events: [],      // {id,title,date,category}
    goals: [],       // {id,title,emoji,category,term,why,milestones:[{id,text,done}]}
    journal: [],     // {id,date,type,text}
    moods: {},       // {date: emoji}
    finance: [],     // {id,type,amount,category,note,date}
    books: [],       // {id,title,author,status,rating,emoji}
    widgets: [],     // {id,type,title,emoji,config,data}
    meals: {},       // {date: {breakfast,lunch,dinner}}
    shopping: [],    // {id,text,done}
    workouts: [],    // {id,date,type,duration,note}
  };
}

function seedState(s) {
  const t = todayIso();
  s.habits = [
    { id: uid(), name: "Meditate", emoji: "🧘", log: {}, createdAt: t },
    { id: uid(), name: "Move my body", emoji: "🏃", log: {}, createdAt: t },
    { id: uid(), name: "Read 10 pages", emoji: "📖", log: {}, createdAt: t },
    { id: uid(), name: "Journal", emoji: "✒️", log: {}, createdAt: t },
  ];
  s.goals = [
    {
      id: uid(), title: "Cozy, organized home", emoji: "🏡", category: "Lifestyle", term: "long",
      why: "A calm space makes a calm mind.",
      milestones: [
        { id: uid(), text: "Declutter one room", done: false },
        { id: uid(), text: "Create a reading corner", done: false },
        { id: uid(), text: "Morning tidy routine", done: false },
      ],
    },
    {
      id: uid(), title: "Read 24 books this year", emoji: "📚", category: "Growth", term: "short",
      why: "Readers are dreamers with a plan.",
      milestones: [
        { id: uid(), text: "Finish current book", done: false },
        { id: uid(), text: "Pick next 3 reads", done: false },
      ],
    },
    {
      id: uid(), title: "Build my savings", emoji: "🪙", category: "Finance", term: "long",
      why: "Freedom is bought one deposit at a time.",
      milestones: [
        { id: uid(), text: "Track every expense for a month", done: false },
        { id: uid(), text: "Set a monthly budget", done: false },
      ],
    },
  ];
  s.books = [
    { id: uid(), title: "Atomic Habits", author: "James Clear", status: "reading", rating: 5, emoji: "⚛️" },
    { id: uid(), title: "The Alchemist", author: "Paulo Coelho", status: "toread", rating: 0, emoji: "🏜️" },
    { id: uid(), title: "Deep Work", author: "Cal Newport", status: "toread", rating: 0, emoji: "🎧" },
  ];
  s.tasks = [
    { id: uid(), title: "Plan my week", done: false, date: t, day: null, createdAt: t },
    { id: uid(), title: "Check in with a friend", done: false, date: t, day: null, createdAt: t },
  ];
  s.widgets = [
    { id: uid(), type: "counter", title: "Water", emoji: "💧", config: { target: 8, unit: "glasses" }, data: {} },
  ];
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { state = Object.assign(defaultState(), JSON.parse(raw)); return; }
  } catch (e) { /* corrupted storage — start fresh */ }
  state = seedState(defaultState());
  save();
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

/* ---------- quotes & affirmations (rotate daily) ---------- */
const QUOTES = [
  "Dream it. Believe it. Do it.",
  "Success is the product of daily habits — not once-in-a-lifetime transformations.",
  "The way is in training.",
  "Little by little, a little becomes a lot.",
  "Discipline is choosing what you want most over what you want now.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Slow progress is still progress.",
];
const AFFIRMATIONS = [
  "Your dreams are not random — they are whispers from your future self.",
  "Every small step you take today is shaping the life you once imagined.",
  "You are the manager of your own life. Run it kindly.",
  "Consistency is self-love in action.",
  "Do it for your future self.",
  "Rest is productive too.",
  "One page, one glass of water, one deep breath at a time.",
];
const dayIndex = () => Math.floor(Date.now() / DAY_MS);
const quoteOfDay = () => QUOTES[dayIndex() % QUOTES.length];
const affirmationOfDay = () => AFFIRMATIONS[dayIndex() % AFFIRMATIONS.length];

/* ---------- theme ---------- */
function applyTheme() {
  const t = state.settings.theme;
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  $("#themeToggle").textContent = dark ? "☀️" : "🌙";
}
function toggleTheme() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark" ||
    (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
  state.settings.theme = dark ? "light" : "dark";
  save(); applyTheme();
}

/* ---------- streak engine ---------- */
function habitDone(h, dateIso) { return !!h.log[dateIso]; }

function habitStreak(h) {
  let d = todayIso(), s = 0;
  if (!habitDone(h, d)) d = addDays(d, -1); // today isn't over yet — don't break the streak
  while (habitDone(h, d)) { s++; d = addDays(d, -1); }
  return s;
}
function habitBestStreak(h) {
  const days = Object.keys(h.log).filter(k => h.log[k]).sort();
  let best = 0, run = 0, prev = null;
  for (const d of days) {
    run = (prev && addDays(prev, 1) === d) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
function isPerfectDay(dateIso) {
  return state.habits.length > 0 && state.habits.every(h => habitDone(h, dateIso));
}
function perfectStreak() {
  let d = todayIso(), s = 0;
  if (!isPerfectDay(d)) d = addDays(d, -1);
  while (isPerfectDay(d)) { s++; d = addDays(d, -1); }
  return s;
}
function bestPerfectStreak() {
  if (!state.habits.length) return 0;
  const allDays = new Set();
  state.habits.forEach(h => Object.keys(h.log).forEach(d => allDays.add(d)));
  const days = [...allDays].filter(isPerfectDay).sort();
  let best = 0, run = 0, prev = null;
  for (const d of days) {
    run = (prev && addDays(prev, 1) === d) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
function habitsDoneToday() { return state.habits.filter(h => habitDone(h, todayIso())).length; }
function habitsPctToday() {
  return state.habits.length ? Math.round(100 * habitsDoneToday() / state.habits.length) : 0;
}

/* ---------- derived helpers ---------- */
function goalProgress(g) {
  if (!g.milestones.length) return 0;
  return Math.round(100 * g.milestones.filter(m => m.done).length / g.milestones.length);
}
function monthKey(dateIso) { return dateIso.slice(0, 7); }
function financeMonth(key) {
  let income = 0, expense = 0;
  for (const tx of state.finance) {
    if (monthKey(tx.date) !== key) continue;
    if (tx.type === "income") income += tx.amount; else expense += tx.amount;
  }
  return { income, expense, balance: income - expense };
}
function upcomingItems(limit = 6) {
  const t = todayIso();
  const evts = state.events.map(e => ({ ...e, kind: "event" }));
  const dated = state.tasks.filter(x => x.date && x.date > t && !x.done).map(x => ({ ...x, kind: "task" }));
  return [...evts, ...dated]
    .filter(x => x.date >= t)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

/* ============================================================
   RENDERING
   ============================================================ */
let currentView = "dashboard";

function renderAll() {
  renderHero();
  $("#streakBadgeNum").textContent = perfectStreak();
  const renderer = {
    dashboard: renderDashboard, habits: renderHabits, goals: renderGoals,
    planner: renderPlanner, journal: renderJournal, finance: renderFinance, books: renderBooks,
    meals: renderMeals, workout: renderWorkout,
  }[currentView];
  renderer && renderer();
}

function renderHero() {
  const h = new Date().getHours();
  const name = state.settings.name ? `, ${state.settings.name}` : "";
  const greet = h < 5 ? `Sweet dreams${name} 🌙` :
    h < 12 ? `Good morning${name} ☀️` :
    h < 18 ? `Good afternoon${name} 🌿` : `Good evening${name} 🕯️`;
  $("#heroGreeting").textContent = greet;
  $("#heroQuote").textContent = quoteOfDay();
  $("#heroDate").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

/* ---------- shared partials ---------- */
function ringSVG(pct, id = "ring") {
  const r = 34, c = 2 * Math.PI * r;
  const filled = c * pct / 100;
  return `
  <svg class="ring" viewBox="0 0 84 84" role="img" aria-label="${pct}% of habits done today">
    <circle class="track" cx="42" cy="42" r="${r}"/>
    <circle class="fill" cx="42" cy="42" r="${r}" stroke-dasharray="${filled} ${c - filled}"/>
    <text x="42" y="48" text-anchor="middle">${pct}%</text>
  </svg>`;
}

function habitChecklistHTML() {
  const t = todayIso();
  if (!state.habits.length) return `<p class="empty">No habits yet — add one below 🌱</p>`;
  return `<ul class="check-list">` + state.habits.map(h => `
    <li class="check-item ${habitDone(h, t) ? "done" : ""}">
      <input type="checkbox" data-action="toggle-habit" data-id="${h.id}" data-date="${t}" ${habitDone(h, t) ? "checked" : ""}>
      <span class="label">${esc(h.emoji)} ${esc(h.name)}</span>
      <span class="meta">🔥 ${habitStreak(h)}</span>
    </li>`).join("") + `</ul>`;
}

function tasksTodayHTML() {
  const t = todayIso();
  const tasks = state.tasks.filter(x => x.date === t);
  const list = tasks.length ? `<ul class="check-list">` + tasks.map(x => `
    <li class="check-item ${x.done ? "done" : ""}">
      <input type="checkbox" data-action="toggle-task" data-id="${x.id}" ${x.done ? "checked" : ""}>
      <span class="label">${esc(x.title)}</span>
      <button class="del" data-action="del-task" data-id="${x.id}" title="Delete">✕</button>
    </li>`).join("") + `</ul>` : `<p class="empty">Nothing planned for today yet.</p>`;
  return list + `
    <form class="add-inline" data-form="add-task-today">
      <input type="text" name="title" placeholder="Add a task for today…" required>
      <button type="submit">＋</button>
    </form>`;
}

function weekBoardHTML(compact = false) {
  const jsDay = new Date().getDay();           // 0=Sun
  const todayCol = (jsDay + 6) % 7;            // 0=Mon
  return `<div class="week-board">` + DAY_NAMES.map((name, i) => {
    const tasks = state.tasks.filter(x => x.day === i);
    return `
    <div class="week-day ${i === todayCol ? "today" : ""}">
      <h4>${compact ? name.slice(0, 3) : name}</h4>
      <ul class="check-list">${tasks.map(x => `
        <li class="check-item ${x.done ? "done" : ""}">
          <input type="checkbox" data-action="toggle-task" data-id="${x.id}" ${x.done ? "checked" : ""}>
          <span class="label">${esc(x.title)}</span>
          <button class="del" data-action="del-task" data-id="${x.id}">✕</button>
        </li>`).join("")}
      </ul>
      <button class="week-add" data-action="add-week-task" data-day="${i}">＋ to-do</button>
    </div>`;
  }).join("") + `</div>`;
}

function upcomingHTML() {
  const items = upcomingItems();
  const t = todayIso();
  const todayEvents = state.events.filter(e => e.date === t);
  const all = [...todayEvents.map(e => ({ ...e, kind: "event" })), ...items.filter(x => x.date !== t || x.kind !== "event")];
  if (!all.length) return `<p class="empty">No upcoming events. Add birthdays, appointments, deadlines…</p>`;
  return `<ul class="check-list">` + all.map(x => `
    <li class="check-item">
      <span>${x.kind === "event" ? "🗓️" : "🗒️"}</span>
      <span class="label">${esc(x.title)}
        ${x.category ? `<span class="pill plain">${esc(x.category)}</span>` : ""}
      </span>
      <span class="meta">${niceDate(x.date)} · ${daysUntil(x.date)}</span>
      ${x.kind === "event" ? `<button class="del" data-action="del-event" data-id="${x.id}">✕</button>` : ""}
    </li>`).join("") + `</ul>`;
}

function goalCardHTML(g, withMilestones = false) {
  const pct = goalProgress(g);
  return `
  <div class="goal-card">
    <button class="del-goal" data-action="del-goal" data-id="${g.id}" title="Delete goal">✕</button>
    <span class="goal-emoji">${esc(g.emoji || "🎯")}</span>
    <span class="goal-title">${esc(g.title)}</span>
    ${g.why ? `<span class="goal-why">${esc(g.why)}</span>` : ""}
    <span class="pills">
      <span class="pill ${g.term === "long" ? "sage" : "accent"}">${g.term === "long" ? "Long-term" : "Short-term"}</span>
      ${g.category ? `<span class="pill gold">${esc(g.category)}</span>` : ""}
    </span>
    <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    <span class="goal-pct">${pct}% — ${g.milestones.filter(m => m.done).length}/${g.milestones.length} milestones</span>
    ${withMilestones ? `
      <ul class="milestone-list">${g.milestones.map(m => `
        <li class="${m.done ? "done" : ""}">
          <input type="checkbox" data-action="toggle-milestone" data-goal="${g.id}" data-id="${m.id}" ${m.done ? "checked" : ""}>
          <span>${esc(m.text)}</span>
        </li>`).join("")}
      </ul>
      <form class="add-inline" data-form="add-milestone" data-goal="${g.id}">
        <input type="text" name="text" placeholder="Add milestone…" required>
        <button type="submit">＋</button>
      </form>` : ""}
  </div>`;
}

function widgetHTML(w) {
  const t = todayIso();
  let body = "";
  if (w.type === "counter") {
    const n = w.data[t] || 0;
    const target = w.config.target || 0;
    body = `
      <div class="widget-counter">
        <button data-action="widget-dec" data-id="${w.id}">−</button>
        <div class="count">${n}${target ? ` <small>/ ${target} ${esc(w.config.unit || "")}</small>` : ""}</div>
        <button data-action="widget-inc" data-id="${w.id}">＋</button>
      </div>
      ${target ? `<div class="progress-track" style="margin-top:10px"><div class="progress-fill" style="width:${Math.min(100, Math.round(100 * n / target))}%"></div></div>` : ""}`;
  } else if (w.type === "checklist") {
    const done = w.data[t] || {};
    body = `<ul class="check-list">` + (w.config.items || []).map((item, i) => `
      <li class="check-item ${done[i] ? "done" : ""}">
        <input type="checkbox" data-action="widget-check" data-id="${w.id}" data-idx="${i}" ${done[i] ? "checked" : ""}>
        <span class="label">${esc(item)}</span>
      </li>`).join("") + `</ul>`;
  } else if (w.type === "note") {
    body = `<div class="widget-note"><textarea data-action="widget-note" data-id="${w.id}" placeholder="Write anything…">${esc(w.data.text || "")}</textarea></div>`;
  } else if (w.type === "tracker") {
    const days = [...Array(7)].map((_, i) => addDays(t, i - 6));
    const vals = days.map(d => w.data[d] || 0);
    const max = Math.max(...vals, 1);
    body = `
      <div class="bars" style="height:70px">${days.map((d, i) => `
        <div class="bar-group">
          <div class="bar accent" style="height:${Math.max(3, Math.round(64 * vals[i] / max))}px" data-v="${vals[i]} ${esc(w.config.unit || "")} — ${niceDate(d)}"></div>
          <span class="bar-label">${weekdayShort[new Date(d + "T12:00:00").getDay()]}</span>
        </div>`).join("")}
      </div>
      <form class="add-inline" data-form="widget-track" data-id="${w.id}">
        <input type="number" step="any" name="value" placeholder="Log today's ${esc(w.config.unit || "value")}…" required>
        <button type="submit">Log</button>
      </form>`;
  }
  return `
  <div class="card">
    <h3><span>${esc(w.emoji || "🧩")} ${esc(w.title)}</span>
      <span class="h3-actions"><button class="widget-del" data-action="del-widget" data-id="${w.id}">remove</button></span>
    </h3>
    ${body}
  </div>`;
}

/* ---------- meals & workout partials ---------- */
const MEAL_SLOTS = [["breakfast", "🍳 Breakfast"], ["lunch", "🥗 Lunch"], ["dinner", "🍲 Dinner"]];

function mealsForDate(d) { return state.meals[d] || {}; }
function setMeal(dateIso, slot, text) {
  state.meals[dateIso] = state.meals[dateIso] || {};
  if (text && text.trim()) state.meals[dateIso][slot] = text.trim();
  else delete state.meals[dateIso][slot];
  if (!Object.keys(state.meals[dateIso]).length) delete state.meals[dateIso];
  save(); renderAll();
}
function addShoppingItem(text) {
  text = String(text || "").trim();
  if (!text) return;
  state.shopping.push({ id: uid(), text, done: false });
  save(); renderAll(); toast("Added to shopping list 🧺");
}
function addWorkout({ type, duration = 0, note = "", date = null }) {
  type = String(type || "Workout").trim();
  state.workouts.push({ id: uid(), date: date || todayIso(), type, duration: +duration || 0, note });
  save(); renderAll(); toast(`Workout logged: ${type} 💪`);
}
function workoutsThisWeek() {
  const week = new Set(weekDates().filter(d => d <= todayIso()));
  return state.workouts.filter(w => week.has(w.date));
}

function shoppingListHTML(limit = 0) {
  let items = state.shopping;
  if (limit) items = items.filter(x => !x.done).slice(0, limit);
  const list = items.length ? `<ul class="check-list">` + items.map(x => `
    <li class="check-item ${x.done ? "done" : ""}">
      <input type="checkbox" data-action="toggle-shopping" data-id="${x.id}" ${x.done ? "checked" : ""}>
      <span class="label">${esc(x.text)}</span>
      <button class="del" data-action="del-shopping" data-id="${x.id}">✕</button>
    </li>`).join("") + `</ul>` : `<p class="empty">Shopping list is empty.</p>`;
  return list + `
    <form class="add-inline" data-form="add-shopping">
      <input type="text" name="text" placeholder="Add item…" required>
      <button type="submit">＋</button>
    </form>`;
}

/* ---------- dashboard ---------- */
function renderDashboard() {
  const t = todayIso();
  const mk = monthKey(t);
  const fin = financeMonth(mk);
  const reading = state.books.find(b => b.status === "reading");
  const tasksToday = state.tasks.filter(x => x.date === t);
  const doneToday = tasksToday.filter(x => x.done).length;
  const avgGoal = state.goals.length ? Math.round(state.goals.reduce((a, g) => a + goalProgress(g), 0) / state.goals.length) : 0;
  const mood = state.moods[t];
  const moods = ["😄", "🙂", "😐", "😔", "😴", "🤒", "🥰", "😤"];

  $("#view-dashboard").innerHTML = `
  <div class="dash-stats">
    <div class="stat"><span class="stat-label">🔥 Perfect-day streak</span>
      <div class="stat-value">${perfectStreak()}</div>
      <span class="stat-note">best: ${bestPerfectStreak()} days</span></div>
    <div class="stat"><span class="stat-label">🌱 Habits today</span>
      <div class="stat-value">${habitsDoneToday()}/${state.habits.length}</div>
      <span class="stat-note">${habitsPctToday()}% complete</span></div>
    <div class="stat"><span class="stat-label">✅ Tasks today</span>
      <div class="stat-value">${doneToday}/${tasksToday.length}</div>
      <span class="stat-note">${tasksToday.length ? (tasksToday.length - doneToday) + " to go" : "plan your day"}</span></div>
    <div class="stat"><span class="stat-label">🎯 Goal progress</span>
      <div class="stat-value">${avgGoal}%</div>
      <span class="stat-note">across ${state.goals.length} goals</span></div>
    <div class="stat"><span class="stat-label">🪙 This month</span>
      <div class="stat-value" style="color:var(--${fin.balance >= 0 ? "good" : "bad"})">${money(fin.balance)}</div>
      <span class="stat-note">${money(fin.income)} in · ${money(fin.expense)} out</span></div>
  </div>

  <div class="dash-grid">
    <div class="dash-col col-a">
      <div class="card">
        <h3>⚡ Quick Adds</h3>
        <div class="quick-adds">
          <button data-action="open-modal" data-modal="habit">🌱 New Habit</button>
          <button data-action="open-modal" data-modal="goal">🎯 New Goal</button>
          <button data-action="open-modal" data-modal="event">🗓️ New Event</button>
          <button data-action="open-modal" data-modal="tx">🪙 New Expense / Income</button>
          <button data-action="open-modal" data-modal="book">📚 New Book</button>
          <button data-action="open-modal" data-modal="widget">🧩 New Widget</button>
        </div>
      </div>
      <div class="card">
        <h3>🌸 Daily Bloom</h3>
        <form class="add-inline" data-form="add-journal" data-type="gratitude" style="margin-top:0">
          <input type="text" name="text" placeholder="Gratitude — today I'm thankful for…" required>
          <button type="submit">🤍</button>
        </form>
        <form class="add-inline" data-form="add-journal" data-type="reflection">
          <input type="text" name="text" placeholder="Reflection — one thought about today…" required>
          <button type="submit">🪞</button>
        </form>
      </div>
      <div class="card">
        <h3>🫶 Mood today</h3>
        <div class="mood-row">${moods.map(m => `
          <button data-action="set-mood" data-mood="${m}" class="${mood === m ? "selected" : ""}">${m}</button>`).join("")}
        </div>
      </div>
      <div class="affirmation">${esc(affirmationOfDay())}</div>
      <div class="card">
        <h3><span>🍽️ Today's plate</span><span class="h3-actions"><button class="btn" style="padding:4px 10px;font-size:12px" data-action="go" data-view="meals">Open →</button></span></h3>
        ${MEAL_SLOTS.map(([slot, label]) => {
          const val = mealsForDate(t)[slot];
          return `<button class="meal-slot ${val ? "filled" : ""}" data-action="edit-meal" data-date="${t}" data-slot="${slot}">
            <span class="meal-label">${label}</span><span class="meal-text">${val ? esc(val) : "＋ plan"}</span></button>`;
        }).join("")}
        ${state.shopping.filter(x => !x.done).length ? `<p style="font-size:12px;color:var(--ink-soft);margin:8px 0 0">🧺 ${state.shopping.filter(x => !x.done).length} item${state.shopping.filter(x => !x.done).length === 1 ? "" : "s"} on the shopping list</p>` : ""}
      </div>
      <div class="card">
        <h3>📖 Currently reading</h3>
        ${reading ? `
          <div style="display:flex;gap:12px;align-items:center">
            <div class="book-cover" style="width:52px;height:64px;font-size:24px;flex-shrink:0">${esc(reading.emoji || "📕")}</div>
            <div><div class="book-title" style="font-family:var(--font-display);font-weight:700">${esc(reading.title)}</div>
            <div class="book-author" style="font-size:12px;color:var(--ink-soft);font-style:italic">${esc(reading.author || "")}</div>
            <button class="btn" style="margin-top:6px;padding:4px 10px;font-size:12px" data-action="finish-book" data-id="${reading.id}">Mark finished ✓</button></div>
          </div>` : `<p class="empty">No book in progress — pick one from your shelf!</p>`}
      </div>
    </div>

    <div class="dash-col col-b">
      <div class="card">
        <h3><span>🌟 Vision Board</span><span class="h3-actions"><button class="btn" style="padding:4px 10px;font-size:12px" data-action="go" data-view="goals">Open →</button></span></h3>
        ${state.goals.length ? `<div class="goal-grid">${state.goals.slice(0, 6).map(g => goalCardHTML(g)).join("")}</div>` : `<p class="empty">Your dreams go here — add your first goal ✨</p>`}
      </div>
      <div class="card">
        <h3>⏰ Important Tasks &amp; Events</h3>
        ${upcomingHTML()}
        <form class="add-inline" data-form="add-event">
          <input type="text" name="title" placeholder="Event title…" required>
          <input type="date" name="date" required style="flex:0 0 130px">
          <button type="submit">＋</button>
        </form>
      </div>
      <div class="card">
        <h3><span>📅 This Week</span><span class="h3-actions"><button class="btn" style="padding:4px 10px;font-size:12px" data-action="go" data-view="planner">Open →</button></span></h3>
        ${weekBoardHTML(true)}
      </div>
      <div class="card">
        <h3><span>📚 Bookshelf</span><span class="h3-actions"><button class="btn" style="padding:4px 10px;font-size:12px" data-action="go" data-view="books">Open →</button></span></h3>
        ${state.books.length ? `<div class="shelf">${state.books.slice(0, 4).map(bookCardHTML).join("")}</div>` : `<p class="empty">Your shelf is empty.</p>`}
      </div>
    </div>

    <div class="dash-col col-c">
      <div class="card">
        <h3>☀️ Today's Tasks</h3>
        ${tasksTodayHTML()}
      </div>
      <div class="card">
        <h3><span>🌱 Habits</span><span class="h3-actions"><button class="btn" style="padding:4px 10px;font-size:12px" data-action="go" data-view="habits">Open →</button></span></h3>
        <div class="ring-wrap">
          ${ringSVG(habitsPctToday())}
          <div style="font-size:12.5px;color:var(--ink-soft)">
            <div><b style="color:var(--accent-ink)">🔥 ${perfectStreak()} day${perfectStreak() === 1 ? "" : "s"}</b> perfect streak</div>
            <div>Do <b>all</b> your habits to keep it alive!</div>
          </div>
        </div>
        <div style="margin-top:8px">${habitChecklistHTML()}</div>
      </div>
      <div class="card">
        <h3><span>💪 Movement</span><span class="h3-actions"><button class="btn" style="padding:4px 10px;font-size:12px" data-action="go" data-view="workout">Open →</button></span></h3>
        ${(() => {
          const wk = workoutsThisWeek();
          const last = [...state.workouts].sort((a, b) => b.date.localeCompare(a.date))[0];
          return `<div style="font-size:13px;color:var(--ink-soft)">
            <div><b style="font-family:var(--font-display);font-size:20px;color:var(--ink)">${wk.length}</b> workout${wk.length === 1 ? "" : "s"} this week · <b>${wk.reduce((a, w) => a + w.duration, 0)}</b> min</div>
            ${last ? `<div style="margin-top:4px">Last: ${esc(last.type)} · ${last.duration} min · ${niceDate(last.date)}</div>` : `<div style="margin-top:4px">No sessions yet — start today 🌱</div>`}
          </div>`;
        })()}
      </div>
      ${state.widgets.map(widgetHTML).join("")}
    </div>
  </div>`;
}

/* ---------- habits view ---------- */
function renderHabits() {
  const t = todayIso();
  const days14 = [...Array(14)].map((_, i) => addDays(t, i - 13));
  // heatmap: last 20 weeks aligned to weeks starting Monday
  const weeks = 20;
  const jsDay = new Date().getDay();
  const mondayOffset = (jsDay + 6) % 7;
  const gridStart = addDays(t, -(weeks * 7 - 1) - (6 - mondayOffset) + 6); // start on a Monday
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(gridStart, i);
    if (d > t) break;
    const total = state.habits.length;
    const done = state.habits.filter(h => habitDone(h, d)).length;
    const level = total === 0 || done === 0 ? 0 : Math.ceil(4 * done / total);
    cells.push(`<div class="heat-cell" data-l="${level}" title="${niceDate(d)} — ${done}/${total} habits"></div>`);
  }
  // last 7 days completion bars
  const days7 = [...Array(7)].map((_, i) => addDays(t, i - 6));
  const barVals = days7.map(d => state.habits.length ? Math.round(100 * state.habits.filter(h => habitDone(h, d)).length / state.habits.length) : 0);

  $("#view-habits").innerHTML = `
  <div class="section-head">
    <h2>🌱 Habit Tracker</h2>
    <span class="sub">tick every day — the streak counts consecutive days</span>
  </div>
  <div class="dash-stats">
    <div class="stat"><span class="stat-label">🔥 Perfect-day streak</span><div class="stat-value">${perfectStreak()}</div><span class="stat-note">all habits, every day · best ${bestPerfectStreak()}</span></div>
    <div class="stat"><span class="stat-label">✅ Today</span><div class="stat-value">${habitsDoneToday()}/${state.habits.length}</div><span class="stat-note">${habitsPctToday()}% done</span></div>
    <div class="stat"><span class="stat-label">🏆 Longest habit streak</span><div class="stat-value">${Math.max(0, ...state.habits.map(habitBestStreak))}</div><span class="stat-note">days in a row</span></div>
  </div>

  <div class="card">
    <h3>Last 14 days</h3>
    ${state.habits.length ? state.habits.map(h => `
      <div class="habit-row">
        <span class="habit-name">${esc(h.emoji)} ${esc(h.name)}</span>
        <div class="habit-days">${days14.map(d => `
          <button class="day-dot ${habitDone(h, d) ? "on" : ""} ${d === t ? "today" : ""}"
            data-action="toggle-habit" data-id="${h.id}" data-date="${d}"
            title="${niceDate(d)}"></button>`).join("")}
        </div>
        <span class="habit-streaks">🔥 <b>${habitStreak(h)}</b> now · 🏆 ${habitBestStreak(h)} best</span>
        <button class="del" style="opacity:.6;border:none;background:none;color:var(--ink-faint)" data-action="del-habit" data-id="${h.id}" title="Delete habit">✕</button>
      </div>`).join("") : `<p class="empty">No habits yet.</p>`}
    <form class="add-inline" data-form="add-habit">
      <input type="text" name="name" placeholder="New habit… (add an emoji if you like 🌿)" required>
      <button type="submit">＋ Add</button>
    </form>
  </div>

  <div class="card">
    <h3>Consistency — last ${weeks} weeks</h3>
    <div class="heatmap">${cells.join("")}</div>
    <div class="heat-legend">less
      <span class="heat-cell" data-l="0"></span><span class="heat-cell" data-l="1"></span>
      <span class="heat-cell" data-l="2"></span><span class="heat-cell" data-l="3"></span>
      <span class="heat-cell" data-l="4"></span> more · share of habits completed each day
    </div>
  </div>

  <div class="card">
    <h3>Completion — last 7 days (%)</h3>
    <div class="bars">${days7.map((d, i) => `
      <div class="bar-group">
        <div class="bar accent" style="height:${Math.max(3, barVals[i])}%" data-v="${barVals[i]}% — ${niceDate(d)}"></div>
        <span class="bar-label">${weekdayShort[new Date(d + "T12:00:00").getDay()]}</span>
      </div>`).join("")}
    </div>
  </div>`;
}

/* ---------- goals view ---------- */
function renderGoals() {
  $("#view-goals").innerHTML = `
  <div class="section-head">
    <h2>🎯 Goals &amp; Vision</h2>
    <button class="btn primary" data-action="open-modal" data-modal="goal">＋ New Goal</button>
  </div>
  ${state.goals.length ? `<div class="goal-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
    ${state.goals.map(g => goalCardHTML(g, true)).join("")}
  </div>` : `<div class="card"><p class="empty">No goals yet — what does your dream life look like? ✨</p></div>`}`;
}

/* ---------- planner view ---------- */
function renderPlanner() {
  $("#view-planner").innerHTML = `
  <div class="section-head">
    <h2>📅 Weekly Planner</h2>
    <span class="sub">plan the week, check things off as you go</span>
  </div>
  <div class="card">${weekBoardHTML()}</div>
  <div class="card">
    <h3>☀️ Today's Tasks</h3>
    ${tasksTodayHTML()}
  </div>
  <div class="card">
    <h3>⏰ Important Tasks &amp; Events</h3>
    ${upcomingHTML()}
    <form class="add-inline" data-form="add-event">
      <input type="text" name="title" placeholder="Event title…" required>
      <input type="date" name="date" required style="flex:0 0 130px">
      <button type="submit">＋</button>
    </form>
  </div>`;
}

/* ---------- journal view ---------- */
function renderJournal() {
  const entries = [...state.journal].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const typeEmoji = { gratitude: "🤍", reflection: "🪞", entry: "✒️" };
  // mood month strip
  const t = todayIso();
  const monthStart = t.slice(0, 8) + "01";
  const daysInMonth = new Date(+t.slice(0, 4), +t.slice(5, 7), 0).getDate();
  const moodCells = [...Array(daysInMonth)].map((_, i) => {
    const d = addDays(monthStart, i);
    if (d > t) return `<span style="opacity:.25">·</span>`;
    return `<span title="${niceDate(d)}">${state.moods[d] || "·"}</span>`;
  }).join(" ");

  $("#view-journal").innerHTML = `
  <div class="section-head">
    <h2>✒️ Journal</h2>
    <span class="sub">gratitude · reflections · brain dumps</span>
  </div>
  <div class="card">
    <h3>New entry</h3>
    <form data-form="add-journal-full">
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <select name="type" style="background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;padding:8px">
          <option value="entry">✒️ Journal</option>
          <option value="gratitude">🤍 Gratitude</option>
          <option value="reflection">🪞 Reflection</option>
        </select>
      </div>
      <textarea name="text" placeholder="Let it flow…" required style="width:100%;min-height:90px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;padding:10px;resize:vertical"></textarea>
      <div style="text-align:right;margin-top:8px"><button class="btn primary" type="submit">Save entry</button></div>
    </form>
  </div>
  <div class="card">
    <h3>🫶 Mood this month</h3>
    <div style="font-size:17px;line-height:2;letter-spacing:2px">${moodCells}</div>
  </div>
  <div class="card">
    <h3>Past entries</h3>
    ${entries.length ? entries.map(e => `
      <div class="journal-entry">
        <button class="del" data-action="del-journal" data-id="${e.id}">✕</button>
        <div class="j-head">${typeEmoji[e.type] || "✒️"} <span class="pill plain">${esc(e.type)}</span> ${niceDate(e.date)}</div>
        <div class="j-text">${esc(e.text)}</div>
      </div>`).join("") : `<p class="empty">Your story starts with the first entry.</p>`}
  </div>`;
}

/* ---------- finance view ---------- */
function renderFinance() {
  const t = todayIso();
  const mk = monthKey(t);
  const fin = financeMonth(mk);
  // last 6 months chart
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(+t.slice(0, 4), +t.slice(5, 7) - 1 - i, 15);
    months.push(monthKey(iso(d)));
  }
  const series = months.map(m => financeMonth(m));
  const maxV = Math.max(...series.flatMap(s => [s.income, s.expense]), 1);
  // category breakdown this month
  const cats = {};
  state.finance.filter(x => monthKey(x.date) === mk && x.type === "expense")
    .forEach(x => { cats[x.category || "other"] = (cats[x.category || "other"] || 0) + x.amount; });
  const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const catMax = Math.max(...catRows.map(c => c[1]), 1);
  const txs = [...state.finance].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);

  $("#view-finance").innerHTML = `
  <div class="section-head">
    <h2>🪙 Finance Tracker</h2>
    <button class="btn primary" data-action="open-modal" data-modal="tx">＋ Add transaction</button>
  </div>
  <div class="card">
    <div class="fin-summary">
      <div class="fin-box"><div class="fin-label">Income — ${mk}</div><div class="fin-value pos">${money(fin.income)}</div></div>
      <div class="fin-box"><div class="fin-label">Expenses — ${mk}</div><div class="fin-value neg">${money(fin.expense)}</div></div>
      <div class="fin-box"><div class="fin-label">Balance — ${mk}</div><div class="fin-value ${fin.balance >= 0 ? "pos" : "neg"}">${money(fin.balance)}</div></div>
    </div>
  </div>
  <div class="card">
    <h3>Income vs expenses — last 6 months</h3>
    <div class="bars">${months.map((m, i) => `
      <div class="bar-group">
        <div class="bar-pair">
          <div class="bar s1" style="height:${Math.max(3, Math.round(100 * series[i].income / maxV))}%" data-v="income ${money(series[i].income)}"></div>
          <div class="bar s2" style="height:${Math.max(3, Math.round(100 * series[i].expense / maxV))}%" data-v="expenses ${money(series[i].expense)}"></div>
        </div>
        <span class="bar-label">${new Date(m + "-15T12:00:00").toLocaleDateString(undefined, { month: "short" })}</span>
      </div>`).join("")}
    </div>
    <div class="chart-legend">
      <span><span class="key" style="background:var(--series-1)"></span>Income</span>
      <span><span class="key" style="background:var(--series-2)"></span>Expenses</span>
    </div>
  </div>
  <div class="card">
    <h3>Spending by category — ${mk}</h3>
    ${catRows.length ? catRows.map(([cat, v]) => `
      <div style="display:flex;align-items:center;gap:10px;margin:6px 0">
        <span style="flex:0 0 110px;font-size:13px">${esc(cat)}</span>
        <div class="progress-track" style="flex:1"><div class="progress-fill" style="width:${Math.round(100 * v / catMax)}%;background:var(--series-2)"></div></div>
        <span style="font-size:12.5px;color:var(--ink-soft);min-width:70px;text-align:right">${money(v)}</span>
      </div>`).join("") : `<p class="empty">No expenses logged this month.</p>`}
  </div>
  <div class="card">
    <h3>Recent transactions</h3>
    ${txs.length ? `<ul class="tx-list">${txs.map(x => `
      <li>
        <span>${x.type === "income" ? "💵" : "🧾"}</span>
        <span>${esc(x.note || x.category || x.type)} ${x.category ? `<span class="pill plain">${esc(x.category)}</span>` : ""}</span>
        <span class="tx-date">${niceDate(x.date)}</span>
        <span class="tx-amount ${x.type === "income" ? "pos" : "neg"}">${x.type === "income" ? "+" : "−"}${money(x.amount)}</span>
        <button class="del" style="opacity:.5;border:none;background:none;color:var(--ink-faint)" data-action="del-tx" data-id="${x.id}">✕</button>
      </li>`).join("")}</ul>` : `<p class="empty">Log your first income or expense.</p>`}
  </div>`;
}

/* ---------- meals view ---------- */
function renderMeals() {
  const dates = weekDates();
  const t = todayIso();
  $("#view-meals").innerHTML = `
  <div class="section-head">
    <h2>🍽️ Meal Planner</h2>
    <span class="sub">click any slot to plan a meal — tap again to change it</span>
  </div>
  <div class="card">
    <div class="week-board">${dates.map((d, i) => `
      <div class="week-day ${d === t ? "today" : ""}">
        <h4>${DAY_NAMES[i].slice(0, 3)} <span style="opacity:.6">${d.slice(8)}</span></h4>
        ${MEAL_SLOTS.map(([slot, label]) => {
          const val = mealsForDate(d)[slot];
          return `
          <button class="meal-slot ${val ? "filled" : ""}" data-action="edit-meal" data-date="${d}" data-slot="${slot}">
            <span class="meal-label">${label}</span>
            <span class="meal-text">${val ? esc(val) : "＋ plan"}</span>
          </button>`;
        }).join("")}
      </div>`).join("")}
    </div>
  </div>
  <div class="card">
    <h3>🧺 Shopping List</h3>
    ${shoppingListHTML()}
    ${state.shopping.some(x => x.done) ? `<div style="text-align:right;margin-top:8px"><button class="btn" style="padding:4px 10px;font-size:12px" data-action="clear-shopping">Clear checked</button></div>` : ""}
  </div>`;
}

/* ---------- workout view ---------- */
function renderWorkout() {
  const t = todayIso();
  const week = workoutsThisWeek();
  const weekMin = week.reduce((a, w) => a + w.duration, 0);
  const days7 = [...Array(7)].map((_, i) => addDays(t, i - 6));
  const mins = days7.map(d => state.workouts.filter(w => w.date === d).reduce((a, w) => a + w.duration, 0));
  const maxM = Math.max(...mins, 1);
  const recent = [...state.workouts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
  const typeEmoji = { strength: "🏋️", cardio: "🏃", yoga: "🧘", walk: "🚶", sports: "⚽", other: "💪" };

  $("#view-workout").innerHTML = `
  <div class="section-head">
    <h2>💪 Workout</h2>
    <span class="sub">move a little every day — your body is where you live</span>
  </div>
  <div class="dash-stats">
    <div class="stat"><span class="stat-label">📅 This week</span><div class="stat-value">${week.length}</div><span class="stat-note">workout${week.length === 1 ? "" : "s"}</span></div>
    <div class="stat"><span class="stat-label">⏱️ Minutes this week</span><div class="stat-value">${weekMin}</div><span class="stat-note">across ${week.length} sessions</span></div>
    <div class="stat"><span class="stat-label">🏆 All-time sessions</span><div class="stat-value">${state.workouts.length}</div><span class="stat-note">keep stacking!</span></div>
  </div>
  <div class="card">
    <h3>Log a workout</h3>
    <form data-form="add-workout" style="display:flex;gap:8px;flex-wrap:wrap">
      <select name="type" style="background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;padding:8px">
        <option value="Strength">🏋️ Strength</option><option value="Cardio">🏃 Cardio</option>
        <option value="Yoga">🧘 Yoga</option><option value="Walk">🚶 Walk</option>
        <option value="Sports">⚽ Sports</option><option value="Other">💪 Other</option>
      </select>
      <input type="number" name="duration" min="1" placeholder="minutes" required style="width:100px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;padding:8px">
      <input type="text" name="note" placeholder="note (optional)…" style="flex:1;min-width:140px;background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;padding:8px">
      <input type="date" name="date" value="${t}" style="background:var(--bg-soft);border:1px solid var(--border);border-radius:10px;padding:8px">
      <button class="btn primary" type="submit">＋ Log</button>
    </form>
  </div>
  <div class="card">
    <h3>Minutes — last 7 days</h3>
    <div class="bars">${days7.map((d, i) => `
      <div class="bar-group">
        <div class="bar accent" style="height:${Math.max(3, Math.round(100 * mins[i] / maxM))}%" data-v="${mins[i]} min — ${niceDate(d)}"></div>
        <span class="bar-label">${weekdayShort[new Date(d + "T12:00:00").getDay()]}</span>
      </div>`).join("")}
    </div>
  </div>
  <div class="card">
    <h3>Recent sessions</h3>
    ${recent.length ? `<ul class="tx-list">${recent.map(w => `
      <li>
        <span>${typeEmoji[w.type.toLowerCase()] || "💪"}</span>
        <span>${esc(w.type)}${w.note ? ` — <span style="color:var(--ink-soft)">${esc(w.note)}</span>` : ""}</span>
        <span class="tx-date">${niceDate(w.date)}</span>
        <span class="tx-amount">${w.duration} min</span>
        <button class="del" style="opacity:.5;border:none;background:none;color:var(--ink-faint)" data-action="del-workout" data-id="${w.id}">✕</button>
      </li>`).join("")}</ul>` : `<p class="empty">No workouts yet — log your first session above 💪</p>`}
  </div>`;
}

/* ---------- books view ---------- */
let shelfFilter = "all";
function bookCardHTML(b) {
  const statusPill = { toread: `<span class="pill plain">📌 want to read</span>`, reading: `<span class="pill accent">☕ reading</span>`, read: `<span class="pill sage">✓ read</span>` }[b.status];
  return `
  <div class="book-card">
    <button class="del" data-action="del-book" data-id="${b.id}">✕</button>
    <div class="book-cover">${esc(b.emoji || "📕")}</div>
    <div class="book-title">${esc(b.title)}</div>
    <div class="book-author">${esc(b.author || "")}</div>
    <div style="margin:6px 0 4px">${statusPill}</div>
    <div class="stars" data-action="rate-book" data-id="${b.id}" title="Click to rate">${"★".repeat(b.rating || 0)}${"☆".repeat(5 - (b.rating || 0))}</div>
    <select data-action="book-status" data-id="${b.id}" style="margin-top:6px;width:100%;background:var(--bg-soft);border:1px solid var(--border);border-radius:8px;padding:4px;font-size:12px">
      <option value="toread" ${b.status === "toread" ? "selected" : ""}>Want to read</option>
      <option value="reading" ${b.status === "reading" ? "selected" : ""}>Reading</option>
      <option value="read" ${b.status === "read" ? "selected" : ""}>Read</option>
    </select>
  </div>`;
}
function renderBooks() {
  const filters = [["all", "🗂️ All"], ["reading", "☕ Reading"], ["toread", "📌 Want to read"], ["read", "✓ Read"]];
  const books = state.books.filter(b => shelfFilter === "all" || b.status === shelfFilter);
  $("#view-books").innerHTML = `
  <div class="section-head">
    <h2>📚 Books</h2>
    <button class="btn primary" data-action="open-modal" data-modal="book">＋ Add book</button>
  </div>
  <div class="shelf-filters">${filters.map(([k, label]) => `
    <button class="${shelfFilter === k ? "active" : ""}" data-action="shelf-filter" data-filter="${k}">${label}</button>`).join("")}
  </div>
  ${books.length ? `<div class="shelf">${books.map(bookCardHTML).join("")}</div>` : `<div class="card"><p class="empty">Nothing on this shelf yet.</p></div>`}`;
}

/* ============================================================
   MODALS
   ============================================================ */
function openModal(html, onMount) {
  $("#modal").innerHTML = html;
  $("#modalBackdrop").hidden = false;
  onMount && onMount();
  const first = $("#modal input, #modal textarea, #modal select");
  first && first.focus();
}
function closeModal() { $("#modalBackdrop").hidden = true; $("#modal").innerHTML = ""; }

const MODALS = {
  habit() {
    openModal(`
      <h3>🌱 New Habit</h3>
      <form id="mform">
        <div class="form-row"><label>Habit</label><input type="text" name="name" placeholder="e.g. Meditate 10 minutes" required></div>
        <div class="form-row"><label>Emoji</label><input type="text" name="emoji" placeholder="🧘" maxlength="4"></div>
        <div class="modal-actions"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary">Add habit</button></div>
      </form>`, () => {
      $("#mform").onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        addHabit(f.get("name"), f.get("emoji"));
        closeModal();
      };
    });
  },
  goal() {
    openModal(`
      <h3>🎯 New Goal</h3>
      <form id="mform">
        <div class="form-row"><label>Goal</label><input type="text" name="title" placeholder="e.g. Visit Japan" required></div>
        <div class="form-row"><label>Emoji</label><input type="text" name="emoji" placeholder="🗾" maxlength="4"></div>
        <div class="form-row"><label>Category</label><input type="text" name="category" placeholder="Travel, Health, Career…"></div>
        <div class="form-row"><label>Term</label>
          <select name="term"><option value="short">Short-term</option><option value="long">Long-term</option></select></div>
        <div class="form-row"><label>Why does this matter?</label><input type="text" name="why" placeholder="your deeper reason…"></div>
        <div class="form-row"><label>First milestones (one per line)</label><textarea name="milestones" placeholder="Book flights&#10;Save $2000&#10;Learn 50 phrases"></textarea></div>
        <div class="modal-actions"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary">Add goal</button></div>
      </form>`, () => {
      $("#mform").onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        const milestones = String(f.get("milestones") || "").split("\n").map(x => x.trim()).filter(Boolean)
          .map(text => ({ id: uid(), text, done: false }));
        state.goals.push({ id: uid(), title: f.get("title"), emoji: f.get("emoji") || "🎯", category: f.get("category") || "", term: f.get("term"), why: f.get("why") || "", milestones });
        save(); closeModal(); renderAll(); toast("Goal added — dream big ✨");
      };
    });
  },
  event() {
    openModal(`
      <h3>🗓️ New Event</h3>
      <form id="mform">
        <div class="form-row"><label>Title</label><input type="text" name="title" placeholder="e.g. Dentist appointment" required></div>
        <div class="form-row"><label>Date</label><input type="date" name="date" required value="${todayIso()}"></div>
        <div class="form-row"><label>Category</label><input type="text" name="category" placeholder="Health, Family, Work…"></div>
        <div class="modal-actions"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary">Add event</button></div>
      </form>`, () => {
      $("#mform").onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        state.events.push({ id: uid(), title: f.get("title"), date: f.get("date"), category: f.get("category") || "" });
        save(); closeModal(); renderAll(); toast("Event added 🗓️");
      };
    });
  },
  tx() {
    openModal(`
      <h3>🪙 New Transaction</h3>
      <form id="mform">
        <div class="form-row"><label>Type</label>
          <select name="type"><option value="expense">Expense</option><option value="income">Income</option></select></div>
        <div class="form-row"><label>Amount</label><input type="number" name="amount" step="0.01" min="0.01" placeholder="0.00" required></div>
        <div class="form-row"><label>Category</label><input type="text" name="category" placeholder="food, rent, salary…"></div>
        <div class="form-row"><label>Note</label><input type="text" name="note" placeholder="optional"></div>
        <div class="form-row"><label>Date</label><input type="date" name="date" value="${todayIso()}" required></div>
        <div class="modal-actions"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary">Save</button></div>
      </form>`, () => {
      $("#mform").onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        state.finance.push({ id: uid(), type: f.get("type"), amount: +f.get("amount"), category: (f.get("category") || "").toLowerCase(), note: f.get("note") || "", date: f.get("date") });
        save(); closeModal(); renderAll(); toast("Transaction logged 🪙");
      };
    });
  },
  book() {
    openModal(`
      <h3>📚 New Book</h3>
      <form id="mform">
        <div class="form-row"><label>Title</label><input type="text" name="title" required></div>
        <div class="form-row"><label>Author</label><input type="text" name="author"></div>
        <div class="form-row"><label>Cover emoji</label><input type="text" name="emoji" placeholder="📕" maxlength="4"></div>
        <div class="form-row"><label>Status</label>
          <select name="status"><option value="toread">Want to read</option><option value="reading">Reading</option><option value="read">Read</option></select></div>
        <div class="modal-actions"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary">Add book</button></div>
      </form>`, () => {
      $("#mform").onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        state.books.push({ id: uid(), title: f.get("title"), author: f.get("author") || "", emoji: f.get("emoji") || "📕", status: f.get("status"), rating: 0 });
        save(); closeModal(); renderAll(); toast("Added to your shelf 📚");
      };
    });
  },
  widget() {
    openModal(`
      <h3>🧩 New Widget</h3>
      <p class="hint" style="margin-bottom:12px">Widgets live on your dashboard. Tip: you can also ask Sage ✨ to build these for you.</p>
      <form id="mform">
        <div class="form-row"><label>Type</label>
          <select name="type" id="wtype">
            <option value="counter">Counter (e.g. glasses of water)</option>
            <option value="tracker">Daily tracker (e.g. sleep hours)</option>
            <option value="checklist">Daily checklist</option>
            <option value="note">Sticky note</option>
          </select></div>
        <div class="form-row"><label>Title</label><input type="text" name="title" required placeholder="Water"></div>
        <div class="form-row"><label>Emoji</label><input type="text" name="emoji" placeholder="💧" maxlength="4"></div>
        <div class="form-row" id="w-target"><label>Daily target (optional)</label><input type="number" name="target" min="0" placeholder="8"></div>
        <div class="form-row" id="w-unit"><label>Unit</label><input type="text" name="unit" placeholder="glasses"></div>
        <div class="form-row" id="w-items" style="display:none"><label>Checklist items (one per line)</label><textarea name="items"></textarea></div>
        <div class="modal-actions"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary">Create</button></div>
      </form>`, () => {
      const sync = () => {
        const v = $("#wtype").value;
        $("#w-target").style.display = v === "counter" ? "" : "none";
        $("#w-unit").style.display = (v === "counter" || v === "tracker") ? "" : "none";
        $("#w-items").style.display = v === "checklist" ? "" : "none";
      };
      $("#wtype").onchange = sync; sync();
      $("#mform").onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        addWidget({
          type: f.get("type"), title: f.get("title"), emoji: f.get("emoji"),
          target: +f.get("target") || 0, unit: f.get("unit") || "",
          items: String(f.get("items") || "").split("\n").map(x => x.trim()).filter(Boolean),
        });
        closeModal();
      };
    });
  },
  settings() {
    openModal(`
      <h3>⚙️ Settings</h3>
      <form id="mform">
        <div class="form-row"><label>Your name</label><input type="text" name="name" value="${esc(state.settings.name)}" placeholder="What should we call you?"></div>
        <div class="form-row"><label>Theme</label>
          <select name="theme">
            <option value="auto" ${state.settings.theme === "auto" ? "selected" : ""}>Auto (system)</option>
            <option value="light" ${state.settings.theme === "light" ? "selected" : ""}>Cream ☀️</option>
            <option value="dark" ${state.settings.theme === "dark" ? "selected" : ""}>Cocoa 🌙</option>
          </select></div>
        <div class="form-row"><label>Anthropic API key (optional — powers Sage's smart mode)</label>
          <input type="password" name="apiKey" value="${esc(state.settings.apiKey)}" placeholder="sk-ant-…">
          <p class="hint">Stored only in this browser. Without a key, Sage still understands common commands locally.</p></div>
        <div class="modal-actions">
          <button type="button" class="btn" data-action="export-data">⬇ Export</button>
          <button type="button" class="btn" data-action="import-data">⬆ Import</button>
          <button type="button" class="btn danger" data-action="reset-data">Reset all</button>
        </div>
        <div class="modal-actions"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary">Save</button></div>
      </form>`, () => {
      $("#mform").onsubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.target);
        state.settings.name = String(f.get("name") || "").trim();
        state.settings.theme = f.get("theme");
        state.settings.apiKey = String(f.get("apiKey") || "").trim();
        save(); applyTheme(); closeModal(); renderAll(); toast("Settings saved ⚙️");
      };
    });
  },
};

/* ============================================================
   MUTATIONS (shared by UI + assistant)
   ============================================================ */
function addHabit(name, emoji) {
  name = String(name || "").trim();
  if (!name) return;
  if (!emoji) {
    const m = name.match(/(\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)\s*$/u);
    if (m) { emoji = m[1]; name = name.slice(0, m.index).trim(); }
  }
  state.habits.push({ id: uid(), name, emoji: emoji || "🌱", log: {}, createdAt: todayIso() });
  save(); renderAll(); toast(`Habit added: ${emoji || "🌱"} ${name}`);
}
function addTask(title, { date = null, day = null } = {}) {
  title = String(title || "").trim();
  if (!title) return;
  state.tasks.push({ id: uid(), title, done: false, date, day, createdAt: todayIso() });
  save(); renderAll(); toast("Task added ✅");
}
function addJournal(type, text) {
  text = String(text || "").trim();
  if (!text) return;
  state.journal.push({ id: uid(), date: todayIso(), type, text });
  save(); renderAll(); toast(type === "gratitude" ? "Gratitude saved 🤍" : "Entry saved ✒️");
}
function addWidget({ type, title, emoji, target = 0, unit = "", items = [] }) {
  const cfg = type === "counter" ? { target, unit } :
    type === "tracker" ? { unit } :
    type === "checklist" ? { items: items.length ? items : ["Item 1"] } : {};
  state.widgets.push({ id: uid(), type, title: title || "Widget", emoji: emoji || "🧩", config: cfg, data: {} });
  save(); renderAll(); toast(`Widget created: ${emoji || "🧩"} ${title}`);
}

/* ============================================================
   ASSISTANT — "Sage"
   ============================================================ */
function assistantSay(text, cls = "bot") {
  const div = document.createElement("div");
  div.className = `msg ${cls}`;
  div.textContent = text;
  $("#assistantLog").appendChild(div);
  $("#assistantLog").scrollTop = 1e6;
  return div;
}

function stateSummary() {
  const t = todayIso();
  const fin = financeMonth(monthKey(t));
  return [
    `Today: ${t}.`,
    `Habits (${state.habits.length}): ${state.habits.map(h => `${h.name} [streak ${habitStreak(h)}]`).join(", ") || "none"}. Done today: ${habitsDoneToday()}/${state.habits.length}. Perfect-day streak: ${perfectStreak()}.`,
    `Tasks today: ${state.tasks.filter(x => x.date === t).map(x => `${x.title}${x.done ? " (done)" : ""}`).join(", ") || "none"}.`,
    `Goals: ${state.goals.map(g => `${g.title} (${goalProgress(g)}%)`).join(", ") || "none"}.`,
    `This month: income ${money(fin.income)}, expenses ${money(fin.expense)}, balance ${money(fin.balance)}.`,
    `Books reading: ${state.books.filter(b => b.status === "reading").map(b => b.title).join(", ") || "none"}.`,
    `Widgets: ${state.widgets.map(w => `${w.title} (${w.type})`).join(", ") || "none"}.`,
    `Workouts this week: ${workoutsThisWeek().length} (${workoutsThisWeek().reduce((a, w) => a + w.duration, 0)} min).`,
    `Meals planned today: ${Object.entries(mealsForDate(t)).map(([k, v]) => `${k}: ${v}`).join(", ") || "none"}. Shopping list: ${state.shopping.filter(x => !x.done).length} open items.`,
  ].join("\n");
}

const HELP_TEXT = `I'm Sage 🌿 — I help you run your Life OS. Try:
• "add habit Stretch 🧘"
• "add task Buy groceries today" / "…on friday"
• "add goal Run a 10k"
• "add expense 45 food" / "add income 3000 salary"
• "add book Dune by Frank Herbert"
• "gratitude: my morning coffee"
• "add workout Yoga 30 min" · "plan dinner: pasta night"
• "add eggs to the shopping list"
• "create a water tracker" or "create a checklist widget called Evening routine"
• "how am I doing?" for a progress report
• "dark mode" / "light mode"

💡 Add an Anthropic API key in ⚙️ Settings and I can design new widgets, plan your week, and answer anything in natural language.`;

function progressReport() {
  const t = todayIso();
  const fin = financeMonth(monthKey(t));
  const bestHabit = [...state.habits].sort((a, b) => habitStreak(b) - habitStreak(a))[0];
  const lines = [
    `Here's your snapshot 🌿`,
    `🔥 Perfect-day streak: ${perfectStreak()} (best ever: ${bestPerfectStreak()})`,
    `🌱 Habits today: ${habitsDoneToday()}/${state.habits.length} (${habitsPctToday()}%)`,
    bestHabit ? `🏆 Strongest habit: ${bestHabit.emoji} ${bestHabit.name} — ${habitStreak(bestHabit)} days` : null,
    `✅ Tasks today: ${state.tasks.filter(x => x.date === t && x.done).length}/${state.tasks.filter(x => x.date === t).length}`,
    `🎯 Goals: ${state.goals.map(g => `${g.emoji} ${goalProgress(g)}%`).join(" · ") || "none yet"}`,
    `🪙 ${monthKey(t)}: ${money(fin.income)} in, ${money(fin.expense)} out → ${money(fin.balance)}`,
  ].filter(Boolean);
  return lines.join("\n");
}

/* action executor shared by local intents and Claude */
function runAction(a) {
  try {
    switch (a.action) {
      case "addHabit": addHabit(a.name, a.emoji); return `Added habit "${a.name}"`;
      case "addTask": {
        let date = null, day = null;
        if (a.date === "today" || !a.date && !a.day) date = todayIso();
        else if (a.date) date = a.date;
        if (typeof a.day === "number") day = a.day;
        addTask(a.title, { date, day }); return `Added task "${a.title}"`;
      }
      case "addEvent": state.events.push({ id: uid(), title: a.title, date: a.date || todayIso(), category: a.category || "" }); save(); renderAll(); return `Added event "${a.title}"`;
      case "addGoal": {
        const milestones = (a.milestones || []).map(text => ({ id: uid(), text, done: false }));
        state.goals.push({ id: uid(), title: a.title, emoji: a.emoji || "🎯", category: a.category || "", term: a.term || "short", why: a.why || "", milestones });
        save(); renderAll(); return `Added goal "${a.title}"`;
      }
      case "addTransaction": state.finance.push({ id: uid(), type: a.type === "income" ? "income" : "expense", amount: Math.abs(+a.amount) || 0, category: (a.category || "").toLowerCase(), note: a.note || "", date: a.date || todayIso() }); save(); renderAll(); return `Logged ${a.type} of ${money(+a.amount)}`;
      case "addBook": state.books.push({ id: uid(), title: a.title, author: a.author || "", emoji: a.emoji || "📕", status: a.status || "toread", rating: 0 }); save(); renderAll(); return `Added book "${a.title}"`;
      case "addJournal": addJournal(a.type || "entry", a.text); return "Journal entry saved";
      case "addWidget": addWidget(a); return `Created widget "${a.title}"`;
      case "addWorkout": addWorkout(a); return `Logged ${a.type} (${a.duration || 0} min)`;
      case "addShopping": (a.items || [a.text]).filter(Boolean).forEach(addShoppingItem); return `Added to the shopping list`;
      case "setMeal": {
        const d = typeof a.day === "number" ? weekDates()[Math.max(0, Math.min(6, a.day))] : (a.date || todayIso());
        setMeal(d, a.meal, a.text); return `Planned ${a.meal}: ${a.text}`;
      }
      case "setTheme": state.settings.theme = a.mode === "dark" ? "dark" : "light"; save(); applyTheme(); return `Theme set to ${a.mode}`;
      case "setName": state.settings.name = a.name; save(); renderAll(); return `Nice to meet you, ${a.name}!`;
      default: return null;
    }
  } catch (e) { return null; }
}

const DAY_LOOKUP = { mon: 0, monday: 0, tue: 1, tuesday: 1, wed: 2, wednesday: 2, thu: 3, thursday: 3, fri: 4, friday: 4, sat: 5, saturday: 5, sun: 6, sunday: 6 };

function localIntent(text) {
  const s = text.trim();
  const l = s.toLowerCase();
  let m;
  if (/^(help|what can you do)\b/.test(l)) return { reply: HELP_TEXT };
  if (/(how am i doing|progress|summary|report|stats)/.test(l)) return { reply: progressReport() };
  if ((m = s.match(/^add (?:a )?habit:? (.+)$/i))) return { actions: [{ action: "addHabit", name: m[1] }] };
  if ((m = s.match(/^add (?:a )?task:? (.+?)(?:\s+(?:on\s+)?(today|tomorrow|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?))?$/i))) {
    const when = (m[2] || "today").toLowerCase();
    if (when === "today") return { actions: [{ action: "addTask", title: m[1], date: todayIso() }] };
    if (when === "tomorrow") return { actions: [{ action: "addTask", title: m[1], date: addDays(todayIso(), 1) }] };
    return { actions: [{ action: "addTask", title: m[1], day: DAY_LOOKUP[when.slice(0, 3)] }] };
  }
  if ((m = s.match(/^add (?:a )?goal:? (.+)$/i))) return { actions: [{ action: "addGoal", title: m[1] }] };
  if ((m = s.match(/^add (?:an? )?(expense|income)s?:? \$?(\d+(?:\.\d+)?)\s*(?:for |on |from )?(.*)$/i)))
    return { actions: [{ action: "addTransaction", type: m[1].toLowerCase(), amount: +m[2], category: m[3] || "" }] };
  if ((m = s.match(/^add (?:a )?book:? (.+?)(?: by (.+))?$/i))) return { actions: [{ action: "addBook", title: m[1], author: m[2] || "" }] };
  if ((m = s.match(/^gratitude[:\-]?\s*(.+)$/i))) return { actions: [{ action: "addJournal", type: "gratitude", text: m[1] }] };
  if ((m = s.match(/^(?:journal|entry)[:\-]?\s*(.+)$/i))) return { actions: [{ action: "addJournal", type: "entry", text: m[1] }] };
  if ((m = s.match(/^reflect(?:ion)?[:\-]?\s*(.+)$/i))) return { actions: [{ action: "addJournal", type: "reflection", text: m[1] }] };
  if (/water tracker/.test(l)) return { actions: [{ action: "addWidget", type: "counter", title: "Water", emoji: "💧", target: 8, unit: "glasses" }] };
  if ((m = s.match(/^(?:create|make|build) (?:a |an )?(counter|tracker|checklist|note)(?: widget)?(?: (?:called|named|for) (.+?))?(?: target (\d+))?$/i)))
    return { actions: [{ action: "addWidget", type: m[1].toLowerCase(), title: m[2] || (m[1][0].toUpperCase() + m[1].slice(1)), target: +m[3] || 0 }] };
  if ((m = s.match(/^add (?:a )?workout:? (.+?)(?:\s+(\d+)\s*min(?:ute)?s?)?$/i))) return { actions: [{ action: "addWorkout", type: m[1], duration: +m[2] || 30 }] };
  if ((m = s.match(/^add (.+?) to (?:the |my )?shopping list$/i)) || (m = s.match(/^shopping[:\-]?\s*(.+)$/i)))
    return { actions: m[1].split(/,\s*/).map(text => ({ action: "addShopping", items: [text] })) };
  if ((m = s.match(/^plan (breakfast|lunch|dinner)[:\-]?\s*(.+)$/i))) return { actions: [{ action: "setMeal", meal: m[1].toLowerCase(), text: m[2], day: (new Date().getDay() + 6) % 7 }] };
  if (/^(dark|night) ?mode/.test(l)) return { actions: [{ action: "setTheme", mode: "dark" }] };
  if (/^(light|cream|day) ?mode/.test(l)) return { actions: [{ action: "setTheme", mode: "light" }] };
  if ((m = s.match(/^(?:set )?(?:my )?name (?:is |to )?(.+)$/i))) return { actions: [{ action: "setName", name: m[1] }] };
  return null;
}

const CLAUDE_SYSTEM = `You are Sage, the warm, encouraging assistant living inside "Life OS" — the user's personal all-in-one life planner (habits with streaks, tasks, weekly planner, goals with milestones, journal, finance tracker, bookshelf, and custom dashboard widgets).

You can modify the app by returning actions. Respond ONLY with a single JSON object, no markdown fences:
{"reply": "<short friendly message to the user>", "actions": [ ...zero or more... ]}

Available actions:
- {"action":"addHabit","name":str,"emoji":str}
- {"action":"addTask","title":str,"date":"YYYY-MM-DD"|null,"day":0-6|null}  (day: 0=Monday…6=Sunday, for the weekly board)
- {"action":"addEvent","title":str,"date":"YYYY-MM-DD","category":str}
- {"action":"addGoal","title":str,"emoji":str,"category":str,"term":"short"|"long","why":str,"milestones":[str]}
- {"action":"addTransaction","type":"income"|"expense","amount":num,"category":str,"note":str,"date":"YYYY-MM-DD"}
- {"action":"addBook","title":str,"author":str,"emoji":str,"status":"toread"|"reading"|"read"}
- {"action":"addJournal","type":"gratitude"|"reflection"|"entry","text":str}
- {"action":"addWidget","type":"counter"|"tracker"|"checklist"|"note","title":str,"emoji":str,"target":num,"unit":str,"items":[str]}
- {"action":"addWorkout","type":str,"duration":num,"note":str,"date":"YYYY-MM-DD"}
- {"action":"setMeal","day":0-6,"meal":"breakfast"|"lunch"|"dinner","text":str}  (day 0=Monday of the current week)
- {"action":"addShopping","items":[str]}
- {"action":"setTheme","mode":"light"|"dark"}

Design new dashboard widgets generously when the user wants to track something new. When asked to plan a week, create tasks across days 0-6. Keep replies to 1-3 sentences, warm and specific. If no action is needed, return an empty actions array.`;

async function askClaude(text) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": state.settings.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      system: CLAUDE_SYSTEM,
      messages: [{ role: "user", content: `Current state of my Life OS:\n${stateSummary()}\n\nMy request: ${text}` }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  if (data.stop_reason === "refusal") throw new Error("Claude declined that request.");
  const raw = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  const jsonText = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const start = jsonText.indexOf("{");
  const end = jsonText.lastIndexOf("}");
  return JSON.parse(jsonText.slice(start, end + 1));
}

async function handleAssistantMessage(text) {
  assistantSay(text, "user");
  const local = localIntent(text);
  if (local) {
    const results = (local.actions || []).map(runAction).filter(Boolean);
    assistantSay(local.reply || (results.length ? results.join("\n") + " ✨" : "Hmm, I couldn't do that."));
    return;
  }
  if (!state.settings.apiKey) {
    assistantSay(`I didn't recognize that as a command. Type "help" to see what I understand — or add an Anthropic API key in ⚙️ Settings to unlock my smart mode, where I can plan, design widgets, and chat freely 🌿`);
    return;
  }
  const thinking = assistantSay("thinking…", "bot thinking");
  try {
    const out = await askClaude(text);
    thinking.remove();
    const results = (out.actions || []).map(runAction).filter(Boolean);
    assistantSay((out.reply || "Done!") + (results.length ? `\n\n${results.map(r => "• " + r).join("\n")}` : ""));
  } catch (e) {
    thinking.remove();
    assistantSay(`I couldn't reach Claude (${e.message}). Check your API key in ⚙️ Settings, or use my built-in commands — type "help".`);
  }
}

/* ============================================================
   EVENTS
   ============================================================ */
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2200);
}

function switchView(view) {
  currentView = view;
  $$(".tab").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  $$(".view").forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
  renderAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  const tab = e.target.closest(".tab");
  if (tab) { switchView(tab.dataset.view); return; }
  if (e.target === $("#modalBackdrop")) { closeModal(); return; }
  if (!el) return;
  const a = el.dataset.action;
  const id = el.dataset.id;

  if (a === "go") switchView(el.dataset.view);
  else if (a === "open-modal") MODALS[el.dataset.modal] && MODALS[el.dataset.modal]();
  else if (a === "close-modal") closeModal();
  else if (a === "toggle-habit") {
    const h = state.habits.find(x => x.id === id);
    if (h) {
      const d = el.dataset.date;
      if (h.log[d]) delete h.log[d]; else h.log[d] = true;
      save(); renderAll();
      if (h.log[d] && isPerfectDay(d) && d === todayIso()) toast(`Perfect day! 🔥 Streak: ${perfectStreak()}`);
    }
  }
  else if (a === "del-habit") { if (confirm("Delete this habit and its history?")) { state.habits = state.habits.filter(x => x.id !== id); save(); renderAll(); } }
  else if (a === "toggle-task") { const x = state.tasks.find(t => t.id === id); if (x) { x.done = !x.done; save(); renderAll(); } }
  else if (a === "del-task") { state.tasks = state.tasks.filter(t => t.id !== id); save(); renderAll(); }
  else if (a === "add-week-task") {
    const title = prompt(`Add a to-do for ${DAY_NAMES[+el.dataset.day]}:`);
    if (title && title.trim()) addTask(title, { day: +el.dataset.day });
  }
  else if (a === "del-event") { state.events = state.events.filter(x => x.id !== id); save(); renderAll(); }
  else if (a === "del-goal") { if (confirm("Delete this goal?")) { state.goals = state.goals.filter(g => g.id !== id); save(); renderAll(); } }
  else if (a === "toggle-milestone") {
    const g = state.goals.find(x => x.id === el.dataset.goal);
    const ms = g && g.milestones.find(x => x.id === id);
    if (ms) { ms.done = !ms.done; save(); renderAll(); if (ms.done && goalProgress(g) === 100) toast(`Goal complete: ${g.emoji} ${g.title} 🎉`); }
  }
  else if (a === "set-mood") { state.moods[todayIso()] = el.dataset.mood; save(); renderAll(); }
  else if (a === "del-journal") { state.journal = state.journal.filter(j => j.id !== id); save(); renderAll(); }
  else if (a === "del-tx") { state.finance = state.finance.filter(x => x.id !== id); save(); renderAll(); }
  else if (a === "del-book") { state.books = state.books.filter(b => b.id !== id); save(); renderAll(); }
  else if (a === "finish-book") { const b = state.books.find(x => x.id === id); if (b) { b.status = "read"; save(); renderAll(); toast(`Finished "${b.title}" 🎉`); } }
  else if (a === "rate-book") {
    const b = state.books.find(x => x.id === id);
    if (b) { b.rating = (b.rating || 0) % 5 + 1; save(); renderAll(); }
  }
  else if (a === "shelf-filter") { shelfFilter = el.dataset.filter; renderBooks(); }
  else if (a === "edit-meal") {
    const d = el.dataset.date, slot = el.dataset.slot;
    const cur = mealsForDate(d)[slot] || "";
    const val = prompt(`${slot[0].toUpperCase() + slot.slice(1)} on ${niceDate(d)}:`, cur);
    if (val !== null) setMeal(d, slot, val);
  }
  else if (a === "toggle-shopping") { const x = state.shopping.find(s => s.id === id); if (x) { x.done = !x.done; save(); renderAll(); } }
  else if (a === "del-shopping") { state.shopping = state.shopping.filter(s => s.id !== id); save(); renderAll(); }
  else if (a === "clear-shopping") { state.shopping = state.shopping.filter(s => !s.done); save(); renderAll(); }
  else if (a === "del-workout") { state.workouts = state.workouts.filter(w => w.id !== id); save(); renderAll(); }
  else if (a === "widget-inc" || a === "widget-dec") {
    const w = state.widgets.find(x => x.id === id);
    if (w) { const t = todayIso(); w.data[t] = Math.max(0, (w.data[t] || 0) + (a === "widget-inc" ? 1 : -1)); save(); renderAll(); }
  }
  else if (a === "del-widget") { state.widgets = state.widgets.filter(w => w.id !== id); save(); renderAll(); }
  else if (a === "export-data") {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `lifeos-backup-${todayIso()}.json`; link.click();
    URL.revokeObjectURL(url);
  }
  else if (a === "import-data") {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "application/json";
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      file.text().then(txt => {
        try {
          const data = JSON.parse(txt);
          if (!data.habits || !data.settings) throw new Error("bad format");
          state = Object.assign(defaultState(), data);
          save(); applyTheme(); closeModal(); renderAll(); toast("Data imported ✓");
        } catch { toast("That file doesn't look like a Life OS backup."); }
      });
    };
    input.click();
  }
  else if (a === "reset-data") {
    if (confirm("Reset EVERYTHING? This wipes all habits, goals, journal, finance and books in this browser.")) {
      localStorage.removeItem(STORE_KEY);
      state = seedState(defaultState());
      save(); closeModal(); renderAll(); toast("Fresh start 🌱");
    }
  }
});

document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action, id = el.dataset.id;
  if (a === "book-status") { const b = state.books.find(x => x.id === id); if (b) { b.status = el.value; save(); renderAll(); } }
  else if (a === "widget-check") {
    const w = state.widgets.find(x => x.id === id);
    if (w) {
      const t = todayIso();
      w.data[t] = w.data[t] || {};
      if (el.checked) w.data[t][el.dataset.idx] = true; else delete w.data[t][el.dataset.idx];
      save(); renderAll();
    }
  }
});

document.addEventListener("input", (e) => {
  const el = e.target.closest('[data-action="widget-note"]');
  if (!el) return;
  const w = state.widgets.find(x => x.id === el.dataset.id);
  if (w) { w.data.text = el.value; save(); }
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest("[data-form]");
  if (!form) return;
  e.preventDefault();
  const f = new FormData(form);
  const kind = form.dataset.form;
  if (kind === "add-task-today") addTask(f.get("title"), { date: todayIso() });
  else if (kind === "add-journal") addJournal(form.dataset.type, f.get("text"));
  else if (kind === "add-journal-full") addJournal(f.get("type"), f.get("text"));
  else if (kind === "add-habit") addHabit(f.get("name"));
  else if (kind === "add-event") {
    state.events.push({ id: uid(), title: f.get("title"), date: f.get("date"), category: "" });
    save(); renderAll(); toast("Event added 🗓️");
  }
  else if (kind === "add-milestone") {
    const g = state.goals.find(x => x.id === form.dataset.goal);
    if (g) { g.milestones.push({ id: uid(), text: f.get("text"), done: false }); save(); renderAll(); }
  }
  else if (kind === "add-shopping") addShoppingItem(f.get("text"));
  else if (kind === "add-workout") addWorkout({ type: f.get("type"), duration: f.get("duration"), note: f.get("note") || "", date: f.get("date") || todayIso() });
  else if (kind === "widget-track") {
    const w = state.widgets.find(x => x.id === form.dataset.id);
    if (w) { w.data[todayIso()] = +f.get("value") || 0; save(); renderAll(); }
  }
  form.reset && form.reset();
});

/* assistant wiring */
$("#assistantFab").addEventListener("click", () => {
  const p = $("#assistant");
  p.classList.toggle("open");
  if (p.classList.contains("open") && !$("#assistantLog").children.length) {
    assistantSay(`Hi${state.settings.name ? " " + state.settings.name : ""}! I'm Sage 🌿 — your Life OS assistant.\nI can add habits, tasks, goals, expenses, books… and even build new dashboard widgets for you. Type "help" to see everything.`);
  }
  $("#assistantText").focus();
});
$("#assistantClose").addEventListener("click", () => $("#assistant").classList.remove("open"));
$("#assistantForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("#assistantText").value.trim();
  if (!text) return;
  $("#assistantText").value = "";
  handleAssistantMessage(text);
});
$("#assistantChips").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-msg]");
  if (b) handleAssistantMessage(b.dataset.msg);
});

$("#themeToggle").addEventListener("click", toggleTheme);
$("#settingsBtn").addEventListener("click", () => MODALS.settings());
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", applyTheme);

/* re-render at midnight so "today" rolls over */
(function scheduleMidnight() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  setTimeout(() => { renderAll(); scheduleMidnight(); }, next - now);
})();

/* ---------- init ---------- */
load();
applyTheme();
renderAll();
