# 🌿 LifeHub — your Life OS

**All your life. All in one place.** A gamified life operating system: habits, health, workouts, nutrition, learning, reading, movies, university, career prep, projects, social life, memories and journaling — tied together with XP, levels, streaks, daily missions and badges.

No server, no account, no build step. Open `index.html` (or host the folder anywhere, e.g. GitHub Pages) and everything is saved privately in your browser's local storage.

## ✨ Life areas

| Area | What it does |
|---|---|
| 🏠 **Dashboard** | The OS home (there's no separate "Today" page — it all lives here): animated hero with a **"N things left today"** headline, level ring, streak and count-up stats; **Today's Focus** to-do list with optional times and a "Done today" drawer; a **habit chip strip**; **Currently reading** (covers + live page progress); **Supplements due** with one-tap "Take"; today's **missions** (auto-completing, each worth XP); a weekly snapshot; **Upcoming** deadlines; a **Reflection**; and the life-area grid with live progress. **Check once, syncs everywhere:** name a task after a habit or supplement (e.g. *"Take Vitamin D3"*, *"Meditate"*) and it **auto-links** — checking the task marks that supplement/habit done in its own section, and doing it there checks the task back. |
| 🎯 **Habit Tracker** | Three habit **types** — *build* (checkbox), *amount* (reach a target like 2L / 20 pages), and *avoid* (break a bad habit, shows days clean). Set a **cadence** (daily / specific weekdays / N× per week) that streaks respect, a **why** for each habit, and **skip / rest days** that don't break the chain. **Navigate any day**, add per-day **notes**, see a **4-week completion history + %**, pick a **custom color** per habit, and mark a habit as a **workout habit** — it then completes itself whenever you **log a real session in the Workout section** (one workout = one ticked habit, no duplicate stub), and tapping it jumps you straight there. Add habits fast from a **starter library**, and end the day with a rotating **daily reflection** prompt. **Goals** are a real system: an **outcome goal** (e.g. lose 8 kg) with **numeric progress logging + a chart**, **staged milestones that auto-complete as you log**, a deadline, and **linked process habits** (a habit can serve **multiple goals**) shown as the goal's daily actions |
| ❤️ **Health** | Steps ring vs. goal, water counter, sleep log, mood picker, steps-per-week chart with goal line |
| 💪 **Workout** | Weekly goal and a plan with **categories** (incl. **Class** for yoga/dance). Plan items are **editable & reorderable**, can be **scheduled** (days / time / focus), and can carry **attached exercises** so checking one off creates an **all-in-one session** pre-filled to log. **Sets/reps are optional**. **Per-day sessions** you can navigate; log **exercises with real sets** — *weight × reps*, *time/holds*, or *distance* — with **personal records** (PR toast), a **per-exercise progress chart**, note, and **photo & video** uploads. Plus **class packages** (e.g. 8 yoga sessions): track attendance + dates, see when to **renew**, and total spend (feeds Finance later). |
| 🍎 **Nutrition** | Calorie goal with **macro progress bars** — protein / carbs / fats **and fiber** — each vs. its target. A **timed meal schedule** (a clock-ordered timeline you can check off) where each meal carries kcal + full macros and its own **photo gallery** (snap what you actually ate; stored in IndexedDB). Meals are editable. Plus a **supplements tracker with reminders**: give each one a dose and a cadence (**daily / weekly / monthly** — e.g. D3 daily, Iron weekly, B12 monthly) and it tells you when each is **due** and counts down to the next dose |
| 🎓 **Skills & Education** | Your **self-directed learning** hub: monthly study-hours goal, one-tap study logging, an **8-week study-time trend** chart, and courses/skills you can **edit, categorize, mark complete** and track by progress |
| 📚 **Reading** | Yearly book goal with a **cover-forward gallery** — each book is a poster card with star rating, a one-line **blurb**, a status/progress badge, and a **"recommended by"** avatar row. **🔎 Search & autofill** a title from a free book database (cover, author, page count, genre, blurb fill themselves — no key needed), then review. Mark a book **physical or digital**, and for digital **attach a PDF/EPUB and tap to open it** on your device (stored privately in your browser). Plus Reading/Wishlist/Completed shelves, page progress, cover uploads, ratings, favorites and notes |
| 🎬 **Movies & Series** | Same **gallery** treatment with **🔎 Search & autofill** — pick a title and poster, year, genre, runtime, **director + cast** fill in from TMDb (add a free TMDb key once under **Profile → Connections**). Poster uploads, a review, Watchlist → Watching → Completed (earns XP), and **series episode tracking** (season + per-episode progress bar) |
| 🏛️ **University** | Your **formal coursework**: weekly study-hours goal and **assignments/deadlines** with a course/subject label, editable tasks, due-date tags and **overdue** highlighting |
| 💼 **Work Preparation** | A real **career tracker**: a readiness ring plus a checklist **grouped by category** (Resume, Portfolio, Applications, Interviews, Networking, Skills) with **target dates**, due/overdue tags, and editable items |
| 🚀 **Projects** | Project cards with status and progress; shipping one earns big XP |
| 💸 **Finance** | Income & expense log with categories, a this-month **net** summary, a **6-month spending trend**, and it **imports your Workout class-package spend**. A task like *"Pay yoga tuition"* auto-routes here and, when you check it, pops a quick amount box and records the expense |
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

## 📲 Install it like an app

LifeHub is a **PWA** — install it to your home screen for a full-screen, offline-capable app with its own icon.
- **iPhone/iPad (Safari):** open the live site → **Share** → **Add to Home Screen**.
- **Android (Chrome):** open the site → menu → **Install app** (or the install prompt).
- **Desktop (Chrome/Edge):** click the **install** icon in the address bar.

Once installed it launches standalone and works offline (a service worker caches the app shell). Search and
autofill still need a connection since they query outside databases.

## 🖥️ Design

- Responsive: sidebar navigation on desktop, bottom tab bar + quick-add sheet + area drawer on mobile.
- Light & dark themes (auto-follows your system, one-tap toggle).
- Accessible: keyboard focus styles, aria labels, 44px touch targets, reduced-motion support, colorblind-validated chart palette.
- Hand-drawn SVG icon set, no icon fonts, no dependencies — plain HTML/CSS/JS.

## ☁️ Free cross-device sync (optional)

Create a **free account** (Profile → **Account & sync**) to keep LifeHub in step across your phone, laptop and tablet. It's **free forever** — no paywall.

- **Local-first.** Your device stays the source of truth; the cloud is only a mirror. Everything keeps working **offline** and syncs when you're back.
- **Zero-knowledge encryption.** Your whole LifeHub is **encrypted in your browser** (WebCrypto AES-GCM, key derived from your password with PBKDF2) *before* it's uploaded — the server only ever stores ciphertext. Nobody but you can read your journal, health or finances.
- **Row-Level Security.** The database itself only ever returns your own row.
- **Sign in on a new device** and your data appears; a **conflict prompt** protects you if two devices diverge.
- Because it's encrypted with your password: if you ever forget it, the *cloud copy* can't be decrypted — but your data is still safe on your device.

> Photos & videos stay on-device for now (they live in IndexedDB); media cloud-sync is a follow-up. Sync runs on the **live site** over HTTPS (not the in-chat preview, whose sandbox blocks network calls — same as search).

## 🔒 Your data

Structured data lives in `localStorage` under the `lifehub-v1` key. Use **Profile → Export JSON** for backups and **Import** to restore. **Uploaded photos & videos** are stored separately in your browser's **IndexedDB** (`lifehub-media`) so large media doesn't blow the localStorage limit — this media stays on the device/browser you added it in and isn't part of the JSON export. With an account, your structured data is also mirrored to the cloud, **end-to-end encrypted** (see above).

**Starting out:** LifeHub opens with sample content so you can see how everything works. When you're ready, **Profile → Your data** gives you **Start fresh** (clears the demo content + media but keeps your name, theme and keys), **Load sample data** (brings the demo back), and **Reset everything** (a full wipe, including your profile).
