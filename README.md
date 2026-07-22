# 🌿 LifeHub — your Life OS

**All your life. All in one place.** A gamified life operating system: habits, health, workouts, nutrition, learning, reading, movies, university, career prep, projects, social life, memories and journaling — tied together with XP, levels, streaks, daily missions and badges.

No server, no account, no build step. Open `index.html` (or host the folder anywhere, e.g. GitHub Pages) and everything is saved privately in your browser's local storage.

## ✨ Life areas

| Area | What it does |
|---|---|
| ✨ **Today** | The OS home: animated hero (level ring, streak, count-up stats); **Today's Focus** is a **to-do list** with optional **times/timeline** where done items collapse into a "Done today" drawer; a task can **count toward a habit** (auto-detected or chosen) so checking it **ticks that habit**; habits live in their own **chip strip**; plus **Upcoming** deadlines and a **Reflection** that ticks your journaling habit. |
| 🏠 **Dashboard** | Greeting, level & XP bar, day streak, today's missions (auto-completing, each worth XP), life-area grid with live progress, weekly snapshot |
| 🎯 **Habit Tracker** | Three habit **types** — *build* (checkbox), *amount* (reach a target like 2L / 20 pages), and *avoid* (break a bad habit, shows days clean). Set a **cadence** (daily / specific weekdays / N× per week) that streaks respect, a **why** for each habit, and **skip / rest days** that don't break the chain. **Navigate any day**, add per-day **notes**, see a **4-week completion history + %**, pick a **custom color** per habit, and mark a habit as a workout to **log it into the Workout section**. Add habits fast from a **starter library**, and end the day with a rotating **daily reflection** prompt. **Goals** are a real system: an **outcome goal** (e.g. lose 8 kg) with **numeric progress logging + a chart**, **staged milestones that auto-complete as you log**, a deadline, and **linked process habits** (a habit can serve **multiple goals**) shown as the goal's daily actions |
| ❤️ **Health** | Steps ring vs. goal, water counter, sleep log, mood picker, steps-per-week chart with goal line |
| 💪 **Workout** | Weekly goal and a plan with **categories** (incl. **Class** for yoga/dance). Plan items are **editable & reorderable**, can be **scheduled** (days / time / focus), and can carry **attached exercises** so checking one off creates an **all-in-one session** pre-filled to log. **Sets/reps are optional**. **Per-day sessions** you can navigate; log **exercises with real sets** — *weight × reps*, *time/holds*, or *distance* — with **personal records** (PR toast), a **per-exercise progress chart**, note, and **photo & video** uploads. Plus **class packages** (e.g. 8 yoga sessions): track attendance + dates, see when to **renew**, and total spend (feeds Finance later). |
| 🍎 **Nutrition** | Calorie goal, macro donut (protein / carbs / fats), daily meal checklist with kcal & macros |
| 🎓 **Skills & Education** | Monthly study-hours goal, courses with progress, one-tap study logging |
| 📚 **Reading** | Yearly book goal, Reading / Wishlist / Completed shelves, page progress, ratings |
| 🎬 **Movies & Series** | Watchlist → Watching → Completed pipeline with ratings |
| 🏛️ **University** | Weekly study-hours goal, tasks with due dates and overdue indicators |
| 💼 **Work Preparation** | Career-readiness ring and checklist (resume, LinkedIn, portfolio…) |
| 🚀 **Projects** | Project cards with status and progress; shipping one earns big XP |
| 🫂 **Social** | Weekly connection goals (family calls, meetups…) with per-week counters |
| 📸 **Memories** | A wall of memory cards with dates and notes |
| ✒️ **Journal** | Daily entry with mood and tags, past-entry timeline |
| 📊 **Progress** | Totals, per-area progress, XP-per-day chart, 16-week habit-consistency heatmap |
| ⚡ **Integrations** | Placeholder toggles for Calendar / Notion / Fit / Spotify / YouTube |
| 👤 **Profile** | Avatar & name, badge gallery (17 badges), theme, JSON export / import / reset |

## 🕹️ Gamification

- **XP** for nearly everything: habits (+10), workouts (+20), finishing a book (+50), shipping a project (+60), journal entries, meals, study time…
- **Levels** with a rising XP curve, shown everywhere.
- **Daily missions** that complete themselves as you live your day and pay bonus XP.
- **Badges** — 17 achievements from *First step* to *Iron will* (30-day perfect streak).
- **Streaks** — a perfect day means every habit checked; keep the flame alive.

## 🖥️ Design

- Responsive: sidebar navigation on desktop, bottom tab bar + quick-add sheet + area drawer on mobile.
- Light & dark themes (auto-follows your system, one-tap toggle).
- Accessible: keyboard focus styles, aria labels, 44px touch targets, reduced-motion support, colorblind-validated chart palette.
- Hand-drawn SVG icon set, no icon fonts, no dependencies — plain HTML/CSS/JS.

## 🔒 Your data

Structured data lives in `localStorage` under the `lifehub-v1` key. Use **Profile → Export JSON** for backups and **Import** to restore. **Uploaded photos & videos** are stored separately in your browser's **IndexedDB** (`lifehub-media`) so large media doesn't blow the localStorage limit — this media stays on the device/browser you added it in and isn't part of the JSON export.
