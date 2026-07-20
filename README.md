# 🌿 LifeHub — your Life OS

**All your life. All in one place.** A gamified life operating system: habits, health, workouts, nutrition, learning, reading, movies, university, career prep, projects, social life, memories and journaling — tied together with XP, levels, streaks, daily missions and badges.

No server, no account, no build step. Open `index.html` (or host the folder anywhere, e.g. GitHub Pages) and everything is saved privately in your browser's local storage.

## ✨ Life areas

| Area | What it does |
|---|---|
| 🏠 **Dashboard** | Greeting, level & XP bar, day streak, today's missions (auto-completing, each worth XP), life-area grid with live progress, weekly snapshot |
| 🎯 **Habit Tracker** | Daily check-offs, per-habit streaks, week strip, perfect-day streak with flame |
| ❤️ **Health** | Steps ring vs. goal, water counter, sleep log, mood picker, steps-per-week chart with goal line |
| 💪 **Workout** | Weekly workout goal, workout plan you check off per day, week overview |
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

Everything lives in `localStorage` under the `lifehub-v1` key. Use **Profile → Export JSON** for backups and **Import** to restore.
