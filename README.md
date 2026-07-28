# 🌿 LifeHub — your Life OS

**All your life. All in one place.** A gamified life operating system: habits, health, workouts, nutrition, learning, reading, movies, university, career prep, projects, social life, memories and journaling — tied together with XP, levels, streaks, daily missions and badges.

No server, no account, no build step. Open `index.html` (or host the folder anywhere, e.g. GitHub Pages) and everything is saved privately in your browser's local storage.

## 📅 A note on the calendar

LifeHub has its own events, and the dashboard timeline merges them with everything else that has a
time. It does **not** sync with Google or Apple Calendar — that needs a sign-in and a server, and this
app deliberately has neither. Events carry a `source` field from day one, so if that ever changes,
imported entries can be told apart from the ones you typed.

## 🔗 Everything connects

Nothing in LifeHub exists in isolation. Any object — a goal, a project, a habit, a task, a person, a
book, a memory, a course, a transaction — **can be linked to any other**, and every detail sheet shows
a **Connected to** block listing what it touches, from either end.

Links you make by hand can be removed. Links the app already knows about — the goal a task serves, the
people named on a memory, who recommended a book — are shown alongside them but changed where they
live, and it says so rather than offering a button that would do nothing.

Each object also keeps a short **History**: when it was created, when work was logged against it, when
it was archived. A finished focus session writes itself into the history of the task, the goal *and*
the project it served, so a project's record fills in from the work you actually did.

**One thing it deliberately won't do:** invent a creation date. Objects that pre-date this feature get
`created` only if the record already carried a real date — a memory's date, a task's date, a habit's
first logged day. Everything else stays blank. The app doesn't claim to know things it can't.

## ⏳ "Am I actually making progress?" — and when LifeHub refuses to answer

Give a goal a **start date** and a **deadline** and it gets a pace line comparing the only two things
the app genuinely knows: how much of the time has gone, and how much of the goal is done.

> **75% of the time · 50% of the goal** — *the clock is ahead of you.*

Note what it does **not** say: **"on track."** LifeHub has no idea what your plan was. Maybe you always
meant to do the bulk of it in the last fortnight. Comparing two percentages is not the same as knowing
whether you're going to make it, and the page says so out loud rather than dressing an arithmetic up
as a verdict.

And if either date is missing, there is **no pace line at all** — not a zero, not a guess, nothing. The
same rule as creation dates: the app doesn't claim to know things it can't.

## ✨ Life areas

| Area | What it does |
|---|---|
| 🏠 **Dashboard** | **A decision page, not a storage page.** In the first five seconds it answers four questions, in this order: **Welcome** (greeting, date, an optional *challenge day N of M*, one line to read), **What you're building** — the largest block on the page: your open goals with progress bar, percent, target, deadline, days remaining, priority and an honest status (*in progress / Nd left / Nd overdue / reached* — never a fake "on track"), each one tappable; **Today's focus** — **exactly three** things, chosen by you with the 🎯 pin or auto-filled by priority and time when you haven't picked (and the row says which were auto-picked rather than pretending you chose them); and **Today's hard thing** — one task you marked as the one you'd rather avoid, on its own card so three easy wins can't bury it, with **Start focus session** on it. Below that, in the Bible's order: **Today's timeline** — one ordered day pulled from everything that already has a time (your events, timed tasks, meals, scheduled workouts and habit reminders), with a line showing where you are in it. Things with a date but no hour — a coursework deadline — sit under *Any time today* rather than being given a slot they don't have. Then **Habits** — compact and *measurable*, so a water habit reads *1.2 / 2 L* rather than an un-ticked chip, today only with no streaks or heatmaps (those live on the Habit Tracker page); **Currently reading**; **Supplements due**; and **Active projects** — three at most, newest-worked first, each with its next milestone and when you last actually worked on it (derived from your focus sessions, not a field you have to keep up to date). Then **What's next** and a **Reflection**. **Nothing is hidden to make room for three:** tasks four and up sit under *"N more today"*, done ones in the *Done today* drawer. Deliberately **not** here: analytics, missions, charts, the life-areas grid — those live in **Progress** and in each area's own page. **Check once, syncs everywhere:** name a task after a habit or supplement (e.g. *"Take Vitamin D3"*) and it **auto-links** — checking the task marks it done in its own section, and doing it there checks the task back. **Nothing gets lost:** an unfinished task from yesterday isn't forgotten — LifeHub asks **once a day** whether to bring each one forward. Tasks can **repeat**, be **reordered**, and carry a **priority, a duration and the goal or project they serve**, all from the task's detail sheet. **Focus sessions:** start a timer on any task (default 25 min, or its own estimate). It runs in a slim bar that **survives changing section, closing the tab and reloading** — it counts real time from the clock, not screen time. Pause and resume freely. At the end it **stops and asks** rather than logging on its own, offers *+5 min*, and can **offer** to tick the task — never assumes it. Minutes are logged against the goal or project the task serves and shown beside it, but never folded *into* that goal's own progress: a goal measured in kilograms shouldn't silently absorb a number of minutes. A session left running overnight can only ever log the minutes you committed to. If reminders are already on, the timer buzzes you when it's up; if not it stays silent and says so rather than demanding permission the moment you sit down to concentrate. |
| 🎯 **Goals** | **Where am I going?** — a page of its own, next to the Dashboard, because your direction is not a footnote to your routines. An **outcome goal** (e.g. lose 8 kg) with **numeric progress logging + a chart**, **staged milestones that auto-complete as you log**, a start date, a deadline, a priority, tags, and the **habits that serve it** (a habit can serve several goals), the **open tasks** pointing at it and the **focus minutes** you've actually spent on it. Open, paused and reached goals are kept apart, so a finished goal stops competing for your attention without being deleted. Each goal also gets an honest **pace line** — see below. |
| 🎯 **Habit Tracker** | Three habit **types** — *build* (checkbox), *amount* (reach a target like 2L / 20 pages), and *avoid* (break a bad habit, shows days clean). Set a **cadence** (daily / specific weekdays / N× per week) that streaks respect, a **why** for each habit, and **skip / rest days** that don't break the chain. **Navigate any day**, add per-day **notes**, see a **4-week completion history + %**, pick a **custom color** per habit, and mark a habit as a **workout habit** — it then completes itself whenever you **log a real session in the Workout section** (one workout = one ticked habit, no duplicate stub), and tapping it jumps you straight there. Add habits fast from a **starter library**, **drag** them into the sequence you actually do them in, and end the day with a rotating **daily reflection** prompt. **Group them:** put habits in a named group — a morning routine, a training block — and the list splits by group with its own *3/5 done today*. Give a group a **start date and a length** and it becomes a **challenge**: the dashboard counts your day, *day 10 of 75*. Deleting a group never deletes its habits. **One tap to tick:** the whole habit row is the target, not a small checkbox — except *avoid* habits, which keep an explicit button, since tapping a row is no way to confess a slip. **Finished with a habit? Archive it** — it stops counting toward your streak and perfect days *from that day forward*, keeps every day it was ever logged, and can be restored any time. Your past streaks and heatmap don't change one pixel. A short **Goals** preview sits at the bottom showing which goals your habits are serving — the goals themselves live on their own page. |
| ❤️ **Health** | Steps ring vs. goal, water counter, sleep log, mood picker, steps-per-week chart with goal line, and a **14-day mood strip** you can tap to jump to any day. **Navigate to any past day** to fill in what you forgot. Mood is **one shared value** with Journal — set it in either place |
| 💪 **Workout** | Weekly goal and a plan with **categories** (incl. **Class** for yoga/dance). Plan items are **editable & reorderable**, can be **scheduled** (days / time / focus), and can carry **attached exercises** so checking one off creates an **all-in-one session** pre-filled to log. **Sets/reps are optional**. **Per-day sessions** you can navigate; log **exercises with real sets** — *weight × reps*, *time/holds*, or *distance* — with **personal records** (PR toast), a **per-exercise progress chart**, note, and **photo & video** uploads. Every session shows **what it amounted to**: exercises, sets, reps and total volume (kg lifted), with holds and distance kept in their own units rather than mashed into one meaningless number — and the week's totals sit under your weekly goal. Exercise names **autocomplete from what you've already logged**, so "Bench press" can't split its PR history with "bench Press", and an empty session offers **"Same as last time"** to copy the exercise list (never the sets — you still have to lift them). Plus **class packages** (e.g. 8 yoga sessions): track attendance + dates, see when to **renew**, and total spend (feeds Finance later). |
| 🍎 **Nutrition** | Calorie goal with **macro progress bars** — protein / carbs / fats **and fiber** — each vs. its target. A **timed meal schedule** (a clock-ordered timeline you can check off) where each meal carries kcal + full macros and its own **photo gallery** (snap what you actually ate; stored in IndexedDB). Meals are editable. Plus a **supplements tracker with reminders**: give each one a dose and a cadence (**daily / weekly / monthly** — e.g. D3 daily, Iron weekly, B12 monthly) and it tells you when each is **due** and counts down to the next dose. **Navigate any day** to log meals you ate yesterday. |
| 🎓 **Skills & Education** | Your **self-directed learning** hub: monthly study-hours goal, one-tap study logging, an **8-week study-time trend** chart, and courses/skills you can **edit, categorize, mark complete** and track by progress. **Log study time against any day**, not just today, and see your **coursework hours counted alongside** self-directed learning for a real total. |
| 📚 **Reading** | Yearly book goal with a **cover-forward gallery** — each book is a poster card with star rating, a one-line **blurb**, a status/progress badge, and a **"recommended by"** avatar row. **🔎 Search & autofill** a title from a free book database (cover, author, page count, genre, blurb fill themselves — no key needed), then review. Mark a book **physical or digital**, and for digital **attach a PDF/EPUB and tap to open it** on your device (stored privately in your browser). Plus Reading/Wishlist/Completed shelves, page progress, cover uploads, ratings, favorites and notes |
| 🎬 **Movies & Series** | Same **gallery** treatment with **🔎 Search & autofill** — pick a title and poster, year, genre, runtime, **director + cast** fill in from TMDb (add a free TMDb key once under **Profile → Connections**). Poster uploads, a review, Watchlist → Watching → Completed (earns XP), and **series episode tracking** (season + per-episode progress bar) |
| 🏛️ **University** | Your **formal coursework**: weekly study-hours goal and **assignments/deadlines** with a course/subject label, editable tasks, due-date tags and **overdue** highlighting. **Day navigation** for backfilling study hours, with your **self-directed learning counted alongside** coursework. |
| 💼 **Work Preparation** | A real **career tracker**: a readiness ring plus a checklist **grouped by category** (Resume, Portfolio, Applications, Interviews, Networking, Skills) with **target dates**, due/overdue tags, and editable items |
| 🚀 **Projects** | Project cards with status and progress; shipping one earns big XP |
| 💸 **Finance** | Income & expense log with categories, a this-month **net** summary, a **6-month spending trend**, and it **imports your Workout class-package spend**. A task like *"Pay yoga tuition"* auto-routes here and, when you check it, pops a quick amount box and records the expense |
| 🫂 **Social** | **Real people, not just counters.** Everyone you name as *"recommended by"* on a book or film, or *"who was there"* on a memory, becomes a **person** here automatically — one human, not three unrelated strings. Give them an emoji or initial avatar, how you know them, a birthday, tags and a note; log a **catch-up** with one tap and see when you last spoke. **Been a while** surfaces anyone you haven't caught up with in a month (only people you've actually logged, so it won't nag about a stranger). **Birthdays** appear here and in the dashboard's Upcoming. Open anyone to see every memory you shared and everything they recommended, and jump straight to it. Weekly connection goals are still here too |
| 📸 **Memories** | Not a list of rows — an **editorial wall** where the photo is the subject: serif titles over the image, and time told as **distance** (*“three years ago”*, with the date kept quiet underneath). Each memory holds **how it felt** in your own words, **who was there** as avatars, photos and video, and tags. A **video gets a real cover**: LifeHub grabs a frame from inside the clip when you add it, checks the frame is actually a picture, and shows it as a still with a ▶ mark — it plays when you open the memory. If a frame can't be captured, the cover falls back to the memory's own gradient, never a black box. **Star** the ones that matter and they rise to a **Treasured** shelf; everything else flows down a **timeline** (This month → last months → 2024). Plus **search** across names, feelings and places, and **On this day** |
| ✒️ **Journal** | Daily entry with mood and tags, past-entry timeline. **Any day is editable** — navigate back, or tap a past entry to open and rewrite it. Its mood is **the same value Health tracks**, so the two can never disagree |
| 📊 **Progress** | Totals, per-area progress, **today's missions** (auto-completing, each worth XP), XP-per-day chart, 16-week habit-consistency heatmap |
| ⚡ **Connections** | An honest list of what LifeHub actually talks to — cloud sync, the book database, TMDb, install &amp; offline, reminders — each showing its **real** status, plus a clearly separated "not built yet" list. No switches that do nothing |
| 👤 **Profile** | Avatar & name, badge gallery (17 badges), theme, **reminders**, JSON export / import / reset |

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

### 📸 Photos & videos sync too

Your files travel with your account, **encrypted in the browser exactly like the rest of your data** — the server stores ciphertext it can't read, and each account can only touch its own folder. Add a photo on your iPad and it appears on your phone.

- **Automatic.** New files upload a few seconds after you add them; missing ones download when you open the app or sign in. **Profile → Sync files** forces a pass and also sweeps files whose records you've deleted, so nothing sits in storage you're not using.
- **Clips over 40MB stay put.** Encrypting a 300MB video needs it twice over in a phone's memory, and it would swallow a free storage tier. Its **cover still syncs**, so the memory looks right on every device — only the clip itself stays home, and the app says so where the video would be.
- **Nothing is ever removed from a device to save space.** This adds copies; it doesn't move them. Deleting a memory deletes its files everywhere.
- If a file hasn't arrived yet the frame says which it is — *"Added on another device"*, *"Not downloaded yet"*, or *"Too large to sync"* — rather than a blank box.

Sync runs on the **live site** over HTTPS (not the in-chat preview, whose sandbox blocks network calls — same as search).

## 🔔 Reminders

Turn them on in **Profile → Reminders** and LifeHub nudges you about the things that are actually due: a **supplement** you haven't taken, a **deadline landing today**, a **timed task** whose time has passed, your **habits still open** in the evening (one summary, not one buzz per habit), and a **streak at risk**. Any single habit can carry **its own time** — set it on the habit's Edit form. You choose the nudge hour, a quiet-from time, and which of those five kinds you want at all.

These arrive while LifeHub is **open or still running in the background** — you get them when you pick your phone up. Nothing is sent without your permission, nothing is repeated, and at most three arrive in any minute.

### 🔔 …and with the app fully closed

Optional, off by default, and it needs a one-time server setup — see **[`supabase/README.md`](supabase/README.md)**. Once it's on, a small scheduled function pushes your reminders at their times even with LifeHub shut.

> **What this shares — the one exception in the whole app.** Everything else is encrypted in your browser before upload, so the server holds ciphertext it can't read. To wake your phone on time, the server has to store **the times, the weekdays and the short titles** shown on your lock screen. That's all. Your habit logs, journal, health, finances, memories and photos stay unreadable to it. The app says this on the screen where you switch it on, and turning it off deletes both the schedule and the device registration.

> **What it can't do.** A schedule isn't a state check — the server can't tell whether you've already taken your vitamins, so these fire **on time** rather than only when something's genuinely outstanding. The smarter "3 habits still open" nudges stay app-open.

On **iPhone**, web push only works for a PWA **added to the Home Screen** and opened from that icon — an Apple restriction, not a LifeHub one.

## 🔗 Log it once, it counts everywhere

Areas feed each other, so the same fact is never entered twice. A habit can be **filled in by** the section that already records it — pick a source when you create or edit it:

| Habit | Filled in by |
|---|---|
| *Read 20 pages* | pages you log on a book in **Reading** |
| *Drink 2 L* / *Sleep 8 h* / *10k steps* | what you log in **Health** |
| *Study 1 h* | minutes logged in **Skills or University** (both count) |
| *Workout* | any session logged in **Workout** |

**People work the same way.** A name typed on a book, a film or a memory *is* a person in **Social** — matched however you capitalise or space it, so "mara" and "Mara" never become two humans. Rename someone once and every memory and recommendation follows.

Fed habits have no manual counter — the number is derived, so it can never drift from the truth, and tapping one takes you to the place that logs it. **Today's Focus** also shows university assignments due today (checking one there marks it done), and **Upcoming** now gathers deadlines from University, Work Prep *and* your goals.

## 🔁 Tasks that carry, repeat and reorder

An unfinished task used to disappear the moment the day turned over. Now, once a day, LifeHub shows you what's still open from before and lets you **bring each one forward or drop it** — nothing is moved silently, and nothing is deleted without you saying so. Dismiss it and they're still one tap away on the dashboard.

A task can also **repeat** — every day, or on chosen weekdays. Each due day gets a fresh copy, so ticking Monday's doesn't erase Tuesday's; the days you've already completed stay as history. Changing or switching off a repeat applies to **future copies** — and it really switches off, series-wide.

> Repeating tasks add up (a daily one is ~365 rows a year, inside a blob that's re-encrypted on every change), so **completed copies older than 90 days are cleared automatically**. One-off tasks you typed yourself are never removed, however old.

## 🌙 Retiring a habit without losing it

A habit you've stopped doing used to leave you two bad options: delete it (destroying its history and its goal links) or watch it break your perfect-day streak forever. **Archive** is the third one.

An archived habit stops being *due* from the day you retire it — so today's perfect day and streak carry on without it — while **every day it was ever logged stays exactly as scored**. Last month's streak, the 16-week heatmap and your badges are unchanged. It's hidden from the habit list, the dashboard chips, the agenda and reminders, sits in a collapsible **Archived** section with the days it recorded, and restores with one tap. A goal that already links an archived habit still shows it, so nothing looks silently dropped.

## ↩️ Nothing is lost by accident

Every delete — a habit, book, meal, memory, journal entry, expense, project — shows an **Undo** button for a few seconds and puts the record back exactly where it was. Attached photos and files are only destroyed once that window closes, so an undo restores the whole thing intact. Everything you can create you can also **edit**, including supplements, projects, connection goals, memories, expenses and class packages.

## 🔒 Your data

### Setting up your own Supabase project

Everything the server needs lives in **[`supabase/`](supabase/)**: run `supabase/schema.sql` in the SQL
Editor for the snapshot table, the private `media` bucket and their row-level-security policies.
Optional closed-app push (Edge Function + cron) is documented in
**[`supabase/README.md`](supabase/README.md)**.

### 🔐 Security posture — and its limits

- **Content Security Policy.** `script-src 'self'`, so an injected `<script>` or `onerror=` cannot
  run even if an escaping bug slips through. There is no inline JavaScript in the page, which is what
  makes that strictness possible. `connect-src` names only the origins the app genuinely uses, so an
  injection has nowhere to send anything.
- **Untrusted values are allow-listed, not filtered.** Covers and posters go through `safeUrl()`
  (`data:image/*` or `https:`, and nothing that could close a `url()` or an attribute); colours and
  hues go through `cssVar()`. Anything unrecognised is dropped rather than sanitised-and-hoped.
- **Imported files are treated as hostile.** `Import` keeps only keys this version knows, then runs
  the same migration ladder as cloud data — so an export from a newer LifeHub is refused rather than
  silently mangled, and unknown keys never reach your state.

**What is *not* covered, stated plainly:**

- `style-src` still needs `'unsafe-inline'` — the UI is built on inline `style=` attributes. The CSP
  is defence in depth here, not a substitute for escaping.
- **Clickjacking is not blocked.** `frame-ancestors` only works as a real response header, and GitHub
  Pages cannot send one. Self-hosting behind a server or CDN? Add
  `Content-Security-Policy: frame-ancestors 'none'` there.
- **The encryption key lives on the device.** It has to, for the app to open your data without asking
  for a password every time — which means any code running in the page could use it. That is exactly
  why the CSP and the escaping above matter more here than in an ordinary web app.

### Where things are stored

Structured data lives in `localStorage` under the `lifehub-v1` key. Use **Profile → Export JSON** for backups and **Import** to restore. **Uploaded photos & videos** are stored separately in your browser's **IndexedDB** (`lifehub-media`) so large media doesn't blow the localStorage limit. They aren't part of the JSON export — but with an account they **do sync**, encrypted, to Supabase Storage (see above). Your structured data is mirrored the same way.

**Starting out:** LifeHub opens with sample content so you can see how everything works. When you're ready, **Profile → Your data** gives you **Start fresh** (clears the demo content + media but keeps your name, theme and keys), **Load sample data** (brings the demo back), and **Reset everything** (a full wipe, including your profile).
