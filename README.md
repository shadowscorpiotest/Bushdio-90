# 🌿 LifeHub — your Life OS

**All your life. All in one place.** A gamified life operating system: habits, health, workouts, nutrition, learning, reading, movies, projects, social life, memories and journaling — tied together with XP, levels, streaks, daily missions and badges.

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

## 💱 Dollars and toman, kept apart

Every amount you enter — an expense, a class package — remembers **which currency you actually paid
in**. Nothing is converted behind your back, and totals are shown **per currency**:

> **1,800,000 تومان  ·  $40**

Two currencies cannot be added together without an exchange rate, and LifeHub **never looks one up**.
If you type your own rate in Profile, a combined figure appears — always marked *approximate* and
always labelled with **your rate and the day you set it**, because a rate goes stale and a number
that hides its age is worse than two honest subtotals. Clear the rate and the combined figure simply
disappears.

The spending chart draws **one currency** and names it. Anything spent in the other is reported
separately rather than folded in — two currencies on one axis would be a picture of nothing.

## 🤸 A skill is a stage, not a percentage

"Back wheel" is somewhere between can't and can, and no honest number describes that. So a skill
carries one of four stages — **Learning · Practicing · Consistent · Mastered** — and **you** pick it.

LifeHub will never decide you have mastered something. What it does instead is put the evidence in
front of you: when you last practised, how many times, your best so far, and a chart if you've been
recording numbers. The judgement stays yours.

It will tell you when something has gone untouched for a fortnight — but not about a skill you've
marked Mastered, because that isn't a lapse, it's a skill you have.

## 🎓 Your average counts only what is graded

A course can carry a **grade out of whatever scale you use** (20 by default), and credits. The average
is weighted by credits — and it counts **only courses you've actually graded**, saying how many it
left out:

> **16.1 of 20** across 2 graded courses — 1 not graded yet, and not counted.

No grades at all means **no average is shown**, rather than a zero. And a blank grade stays blank: a
zero is a mark you earned, "not graded yet" is not the same thing.

**Hours per course** work the same way. Study you log against a course counts toward it; study logged
without naming one stays in your totals but appears on no course — because before this existed
nothing recorded which course an hour belonged to, and LifeHub won't guess.

## 📖 A study session is what you did, not how long

Logging "100 minutes" tells you nothing in a week's time. A **session** records the rest of it:

- **what kind of work** — vocabulary, grammar, a lesson, listening, speaking, review…
- **which material**, chosen from the ones you've used before, so *Menschen A2 Kursbuch* can't split
  into three spellings, each with its own half-history;
- **which chapter and pages** — free text, because *Kapitel 4*, *112–118* and *Lektion 7B* are all
  real answers and a number field would reject two of them;
- **a link**, for the podcast episode or video you actually used;
- **what you learned**, your notes, and **photos of your notebook**;
- and an **error log** — everything you got wrong.

One course can have many materials. Studying German A2 from a grammar book, a vocabulary book and a
lesson book is **one course with three materials**, not three courses.

### Two ways to log time, and they add up

The quick **+30 min** buttons still record just a number. A session carries its own minutes. Your
totals are the **sum of both**, computed every time they're read rather than kept as a running
figure — so editing a session's minutes moves the total by exactly the difference, and deleting one
removes exactly its own minutes and nothing else. There is no stored total to drift out of step.

### The error log, and what LifeHub will never do to it

Every mistake you write down appears in **To review** on the Learning page, gathered from every
session, until you tick it off. **Nothing is ever marked reviewed for you** — not by time passing,
not by studying the same chapter again. A mistake stops being one when *you* say so.

Any review item, or a whole session, can become **tomorrow's task** in one tap. It lands in your
daily tasks dated tomorrow, filed under Learning.

## 📆 The dashboard walks back through your week

You can step the Dashboard back a day at a time — *"so I can know why I did and didn't do."*

What **travels with the day**: its tasks (still tickable), its timeline, its habits (still tickable —
back-filling Tuesday marks Tuesday), and its reflection. Adding a task while looking at Tuesday files
it under **Tuesday**, not today.

What **stays behind on today**: *Today's focus* picking and pinning, the hard thing, supplements due,
*Start focus session*, and "N things left today". Those decide about the day you're living. A focus
session started on Tuesday is not a thing that can exist, and a button offering one would be lying.

This is also what makes it safe for a task to stay on its own day rather than chasing you into today —
see **One list, and a task that stays on its day** below.

Back-filling a past day earns **no XP** — the streak system stays honest. Navigating into the
Dashboard from anywhere else returns you to today.

## 🪶 Starting something should be typing its name

A new project asks for a **name**. That's it. Everything else — purpose, priority, dates, tags, the
next step — is folded behind *More details*, one tap away, and skipping it costs nothing: sensible
defaults fill in and you add the rest later, in the sheet you open when you actually have something
to say. New courses work the same way.

**Editing** shows everything at once, because by then you already know what you meant.

## 🙈 Hiding something never deletes it

Health & Food has eight switches — steps, water, sleep, mood, calories, macros, meals, supplements —
and **every one starts on**, because quietly hiding data you already logged is worse than showing one
ring you ignore.

Turn one off and it leaves the page *and* stops counting toward that area's score, so a steps ring you
can't fill isn't dragging your number down forever. **Nothing is deleted.** Switch it back on and the
whole history is exactly where you left it.

**Whole areas work the same way.** Profile has a switch for each one; untick the areas you don't use
and they leave the menu — and stop dragging your weekly number down. Everything they hold stays, keeps
syncing, and is still reachable from any link that points at it. A menu group with nothing left in it
disappears rather than sitting there as an empty heading.

## ⏳ "Am I actually making progress?" — and when LifeHub refuses to answer

Give a goal — or a project — a **start date** and a **deadline** and it gets a pace line comparing the
only two things the app genuinely knows: how much of the time has gone, and how much of the work is
done.

> **75% of the time · 50% of the goal** — *the clock is ahead of you.*

Note what it does **not** say: **"on track."** LifeHub has no idea what your plan was. Maybe you always
meant to do the bulk of it in the last fortnight. Comparing two percentages is not the same as knowing
whether you're going to make it, and the page says so out loud rather than dressing an arithmetic up
as a verdict.

And if either date is missing, there is **no pace line at all** — not a zero, not a guess, nothing. The
same rule as creation dates: the app doesn't claim to know things it can't.

**Milestone velocity works the same way.** A project can tell you how fast its milestones are actually
landing — but only from ones ticked *since that started being recorded*. Nothing ever noted when the
older ones were done, so they're left out and the app says so, rather than inventing dates to make a
prettier number. That means velocity stays quiet until you've ticked two. That's not a gap; it's the
app declining to make something up.

One more limit worth knowing: focus history is kept for **a year**, so session notes expire with the
session they belong to, and they can't be edited after you write them.

## ✨ Life areas

| Area | What it does |
|---|---|
| 🏠 **Dashboard** | **A decision page, not a storage page.** In the first five seconds it answers four questions, in this order: **Welcome** (greeting, date, an optional *challenge day N of M*, one line to read), **What you're building** — the largest block on the page: your open goals with progress bar, percent, target, deadline, days remaining, priority and an honest status (*in progress / Nd left / Nd overdue / reached* — never a fake "on track"), each one tappable; **Today's focus** — **exactly three** things, chosen by you with the 🎯 pin or auto-filled by priority and time when you haven't picked (and the row says which were auto-picked rather than pretending you chose them); and **Today's hard thing** — one task you marked as the one you'd rather avoid, on its own card so three easy wins can't bury it, with **Start focus session** on it. Below that, in the Bible's order: **Today's timeline** — one ordered day pulled from everything that already has a time (your events, timed tasks, meals, scheduled workouts and habit reminders), with a line showing where you are in it. Things with a date but no hour — a coursework deadline — sit under *Any time today* rather than being given a slot they don't have. Then **Habits** — compact and *measurable*, so a water habit reads *1.2 / 2 L* rather than an un-ticked chip, today only with no streaks or heatmaps (those live on the Habit Tracker page); **Currently reading**; **Supplements due**; and **Active projects** — three at most, newest-worked first, each with its next milestone and when you last actually worked on it (derived from your focus sessions, not a field you have to keep up to date). Then **What's next** and a **Reflection**. **Nothing is hidden to make room for three:** tasks four and up sit under *"N more today"*, done ones in the *Done today* drawer. Deliberately **not** here: analytics, missions, charts, the life-areas grid — those live in **Progress** and in each area's own page. **Check once, syncs everywhere:** name a task after a habit or supplement (e.g. *"Take Vitamin D3"*) and it **auto-links** — checking the task marks it done in its own section, and doing it there checks the task back. **Nothing gets lost:** an unfinished task from yesterday isn't forgotten — LifeHub asks **once a day** whether to bring each one forward. Tasks can **repeat**, be **reordered**, and carry a **priority, a duration and the goal or project they serve**, all from the task's detail sheet. **Focus sessions:** start a timer on any task (default 25 min, or its own estimate). It runs in a slim bar that **survives changing section, closing the tab and reloading** — it counts real time from the clock, not screen time. Pause and resume freely. At the end it **stops and asks** rather than logging on its own, offers *+5 min*, and can **offer** to tick the task — never assumes it. Minutes are logged against the goal or project the task serves and shown beside it, but never folded *into* that goal's own progress: a goal measured in kilograms shouldn't silently absorb a number of minutes. A session left running overnight can only ever log the minutes you committed to. If reminders are already on, the timer buzzes you when it's up; if not it stays silent and says so rather than demanding permission the moment you sit down to concentrate. |
| 🎯 **Goals** | **Where am I going?** — a page of its own, next to the Dashboard, because your direction is not a footnote to your routines. An **outcome goal** (e.g. lose 8 kg) with **numeric progress logging + a chart**, **staged milestones that auto-complete as you log**, a start date, a deadline, a priority, tags, and the **habits that serve it** (a habit can serve several goals), the **open tasks** pointing at it and the **focus minutes** you've actually spent on it. Open, paused and reached goals are kept apart, so a finished goal stops competing for your attention without being deleted. Each goal also gets an honest **pace line** — see below. |
| 🎯 **Habit Tracker** | Three habit **types** — *build* (checkbox), *amount* (reach a target like 2L / 20 pages), and *avoid* (break a bad habit, shows days clean). Set a **cadence** (daily / specific weekdays / N× per week) that streaks respect, a **why** for each habit, and **skip / rest days** that don't break the chain. **Navigate any day**, add per-day **notes**, see a **4-week completion history + %**, pick a **custom color** per habit, and mark a habit as a **workout habit** — it then completes itself whenever you **log a real session in the Workout section** (one workout = one ticked habit, no duplicate stub), and tapping it jumps you straight there. Add habits fast from a **starter library**, **drag** them into the sequence you actually do them in, and end the day with a rotating **daily reflection** prompt. **Group them:** put habits in a named group — a morning routine, a training block — and the list splits by group with its own *3/5 done today*. Give a group a **start date and a length** and it becomes a **challenge**: the dashboard counts your day, *day 10 of 75*. Deleting a group never deletes its habits. **One tap to tick:** the whole habit row is the target, not a small checkbox — except *avoid* habits, which keep an explicit button, since tapping a row is no way to confess a slip. **Finished with a habit? Archive it** — it stops counting toward your streak and perfect days *from that day forward*, keeps every day it was ever logged, and can be restored any time. Your past streaks and heatmap don't change one pixel. A short **Goals** preview sits at the bottom showing which goals your habits are serving — the goals themselves live on their own page. |
| ❤️ **Health & Food** | **What goes in, and how the body's doing** — one page instead of two half-used ones. Water, sleep and mood as one-tap rows; a calorie goal with **macro bars** (protein / carbs / fats **and fiber**); a **timed meal schedule** you check off, each meal carrying kcal, full macros and its own **photo gallery**; and a **supplements tracker** that tells you what's due and counts down to the next dose. Steps get a ring and a weekly chart — *if you want them*. **Navigate to any past day** and everything you log lands on **that** day. Mood is **one shared value** with Journal. **Show only what you use:** eight switches, all on by default; turn one off and it disappears from the page — nothing is deleted, and turning it back on brings every number with it. No step tracker? Turn Steps off and the ring and its chart go too. |
| 💪 **Workout** | Weekly goal and a plan with **categories** (incl. **Class** for yoga/dance). Plan items are **editable & reorderable**, can be **scheduled** (days / time / focus), and can carry **attached exercises** so checking one off creates an **all-in-one session** pre-filled to log. **Sets/reps are optional**. **Per-day sessions** you can navigate; log **exercises with real sets** — *weight × reps*, *time/holds*, or *distance* — with **personal records** (PR toast), a **per-exercise progress chart**, note, and **photo & video** uploads. Every session shows **what it amounted to**: exercises, sets, reps and total volume (kg lifted), with holds and distance kept in their own units rather than mashed into one meaningless number — and the week's totals sit under your weekly goal. Exercise names **autocomplete from what you've already logged**, so "Bench press" can't split its PR history with "bench Press", and an empty session offers **"Same as last time"** to copy the exercise list (never the sets — you still have to lift them). Plus **class packages** (e.g. 8 yoga sessions): track attendance + dates, see when to **renew**, and total spend (feeds Finance). **Skills** — the handstand, the muscle-up, the back wheel: each one carries where you are now, what's next, photos and clips, coach corrections, and a practice log with your best. Tick the skills a session was *for* and the practice records itself — you never log it twice. **Personal records** now read correctly for bodyweight work: max pull-ups is **12 reps**, not "0 kg". Every session can carry the rest of the story too — coach, minutes, energy, how hard it was, what got corrected, what improved, what to work on next — all optional, all editable later. And every correction you've ever written down collects into a **Coach notebook**, built from the sessions themselves rather than stored twice. |
| 🎓 **Learning** | **What am I learning?** Self-directed study, university coursework and career prep used to be three separate pages with almost nothing in any of them. They're **one area** now. A **course** is finally something you can open: what kind it is (self-directed / university / certification), where, **who teaches it** (they become a real person in Social), start and end dates, **credits and a grade**, a link to the materials, notes and progress. Underneath, **one deadline list** — assignments and career items together, overdue first, because they were literally the same four fields in two different places. Plus the monthly study-hours goal, one-tap logging on **any day**, an 8-week trend, and a **career readiness** ring. |
| 📚 **Reading** | Yearly book goal with a **cover-forward gallery** — each book is a poster card with star rating, a one-line **blurb**, a status/progress badge, and a **"recommended by"** avatar row. **🔎 Search & autofill** a title from a free book database (cover, author, page count, genre, blurb fill themselves — no key needed), then review. Mark a book **physical or digital**, and for digital **attach a PDF/EPUB and tap to open it** on your device (stored privately in your browser). Plus Reading/Wishlist/Completed shelves, page progress, cover uploads, ratings, favorites and notes |
| 🎬 **Movies & Series** | Same **gallery** treatment with **🔎 Search & autofill** — pick a title and poster, year, genre, runtime, **director + cast** fill in from TMDb (add a free TMDb key once under **Profile → Connections**). Poster uploads, a review, Watchlist → Watching → Completed (earns XP), and **series episode tracking** (season + per-episode progress bar) |
| 🚀 **Projects** | **What am I building?** A goal says where you're going; a project is how it actually gets built — so a project here is something you can *open*, not a name and a percentage. Each one carries **why it exists**, a priority, a start date and a deadline, tags, **milestones**, **files** (screenshots, mockups, a clip of it working — encrypted and synced like every other photo), and everything the link system already knows it touches. **Progress has exactly one source:** give a project milestones and the bar counts itself from them — tick one and it moves, and the *+10%* button disappears rather than sitting there wired to nothing. Without milestones you set the percentage by hand, and it says which of the two it's doing. The **next step** works the same way: the first unticked milestone, or the one you typed if there aren't any — never both disagreeing. **Time invested comes from your focus sessions** — start a timer on a task that names the project and the minutes land here on their own, with the session count and when you last actually worked on it. **Work sessions:** when you finish a focus session on a project you can rate how focused you were and note what got done, what got in the way and where to pick up — or skip all of it, and the minutes are recorded exactly the same. The project then keeps a real log of the work, not just the hours. A session's **next action can become the project's next step**, but only if you tick the box, and only where the project has no milestones. Plus honest **analytics** off data you never had to type twice: **sessions per week**, average focus, and — once you've ticked two milestones — how fast they're actually landing and roughly when the rest will. With both dates it gets the same **pace line** as a goal. In flight, paused and shipped are kept apart; shipping one earns big XP. |
| 💸 **Finance** | Income & expense log with categories, a this-month **net** summary, a **6-month spending trend**, and it **imports your Workout class-package spend**. **Two currencies:** every amount remembers whether you paid in **dollars or toman**, and totals are shown per currency rather than added together — see below. A task like *"Pay yoga tuition"* auto-routes here and, when you check it, pops a quick amount box and records the expense |
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
| *Study 1 h* | minutes logged in **Learning** — self-directed and coursework both count |
| *Workout* | any session logged in **Workout** |

**People work the same way.** A name typed on a book, a film or a memory *is* a person in **Social** — matched however you capitalise or space it, so "mara" and "Mara" never become two humans. Rename someone once and every memory and recommendation follows.

Fed habits have no manual counter — the number is derived, so it can never drift from the truth, and tapping one takes you to the place that logs it. **Today's Focus** also shows coursework due today (checking one there marks it done), and **Upcoming** gathers deadlines from Learning *and* your goals.

## ✅ One list, and a task that stays on its day

Every task for the day is in **one checklist**. Finish one and it gets a line through it **where it is** — it doesn't drop into a "Done today" drawer, and there's no "3 more tasks today" fold hiding the rest. What you see is what the day holds.

**Today's focus** is separate and holds only what *you* pinned, up to three. It used to top itself up from priority and label the result "picked for you"; it doesn't any more. An empty focus list means you haven't chosen yet, which is a true and useful thing for a page to say.

**A task belongs to the day it was for**, the way a calendar entry does. Nothing is dragged into today and nothing asks you a question about it each morning. If you didn't do Tuesday's task, it stays on Tuesday — where you can still find it, tick it, or delete it by stepping the dashboard back.

> The honest trade: an unfinished task will no longer come and find you. That's deliberate, and it's only safe because the dashboard can now walk back through days — before that, the same change would have made old tasks unreachable.

### One link, one meaning

A task used to offer three overlapping ways to connect it to something — *Counts toward*, *In service of*, and a generic *Link something* picker. There's now **one** control:

- point it at a **habit** and ticking the task ticks the habit;
- point it at a **goal** or **project** and its focus minutes are filed there;
- point it at an **area** and it's simply filed there.

Name a task after a supplement ("Take Vitamin D3") and it still links itself — the sheet says so plainly, with a button to undo it.

## 🔁 Tasks that repeat and reorder

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
