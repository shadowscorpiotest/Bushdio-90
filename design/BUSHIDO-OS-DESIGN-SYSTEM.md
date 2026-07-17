# Bushido OS — Design System

**Version 1.0 · The 90-Day Campaign**

> Bushido OS is not a planner. It is a Life Operating System.
> Every choice has a long-term consequence.

---

## 1 · Brand Identity

### 1.1 The idea

Bushido OS sits at the intersection of three traditions:

- **The dōjō** — a place stripped of everything unnecessary, where the only thing left to do is practice.
- **The atelier** — Muji, Braun, Apple: objects so quiet and resolved they disappear into use.
- **The training log** — the athlete's notebook: honest numbers, no decoration, no excuses.

The product speaks to a 21-year-old woman rebuilding herself over 90 days — body, language, mind, discipline. The brand must never shout at her. It holds a standard, calmly, the way a good coach does. It is **serene on the surface, severe underneath.**

### 1.2 Brand character

| Bushido OS is… | Bushido OS is never… |
|---|---|
| Calm, spacious, quiet | Loud, gamified, neon |
| Precise, editorial, Swiss | Cute, sticker-covered, cozy |
| Warm paper and ink | Cold chrome and glass |
| A dōjō | A theme park |
| A standard to live up to | A cheerleader |

### 1.3 Logotype & mark

- **Wordmark:** `BUSHIDO OS` set in the UI grotesk, all caps, +12% letter-spacing, medium weight. Nothing else — no sword glyphs, no dragons.
- **Mark:** the **Ensō** — a single hand-drawn circle, deliberately left open at the top-right. The open ensō means *unfinished — still in training*. It doubles as the app's completion motif: closing the circle is completing the day.
- **The Seal:** a small square vermilion stamp (hanko) containing 「道」 *(dō — the Way)*. Used exactly once per surface, like a signature on a painting. The seal is the only place the accent red appears at full strength.

### 1.4 Voice

Short declaratives. Second person, present tense. No exclamation marks, ever.

- ✅ "Day 34. The work is waiting."
- ✅ "You kept your word for 12 days."
- ❌ "Amazing job!!! You're crushing it! 🔥🔥"

Milestone copy may borrow the register of a dōjō precept: *"Fall seven times, stand up eight."* One line, never a paragraph.

---

## 2 · Color Palette

The palette is **ink on paper**. Two neutrals do 95% of the work; one vermilion does the remaining 5%. Color is a consequence, not a decoration — exactly like the philosophy.

### 2.1 Core — Paper & Ink

| Token | Name | HEX | Use |
|---|---|---|---|
| `paper-0` | Washi | `#F7F4EE` | App background (light). Warm, never pure white |
| `paper-1` | Rice | `#FFFEFA` | Cards, raised surfaces |
| `paper-2` | Stone | `#ECE8E0` | Recessed wells, input fields, hairline fills |
| `ink-0` | Sumi | `#17161A` | Primary text, the wordmark. Warm near-black, never `#000` |
| `ink-1` | Charcoal | `#4A4843` | Secondary text |
| `ink-2` | Ash | `#8B877E` | Tertiary text, placeholders, disabled |
| `line` | Hairline | `#DAD5CB` | 1px borders and dividers only |

### 2.2 Accent — The Seal

| Token | Name | HEX | Use |
|---|---|---|---|
| `shu` | Vermilion | `#B43A2B` | The one accent: the seal, primary action, the active day, a broken streak. Max ~5% of any screen |
| `shu-deep` | Lacquer | `#8E2E22` | Pressed/hover state of vermilion |
| `shu-wash` | Blossom wash | `#F3E4E0` | 8–12% tint backgrounds behind vermilion elements |

### 2.3 Discipline tones — quiet semantic colors

Desaturated to sit inside the paper world. Never used as large fills.

| Token | Name | HEX | Use |
|---|---|---|---|
| `pine` | Pine | `#41594A` | Done, kept promises, positive deltas |
| `ai` | Indigo (aizome) | `#3B4A66` | Deep-work / focus contexts, links, IELTS & German study modules |
| `kin` | Old gold | `#A98F5E` | Rare: 30/60/90-day milestones only. Earned, not given |

### 2.4 Dark mode — Night Dōjō

Dark mode is charcoal paper, not OLED black. Same ink-on-paper logic, inverted.

| Token | HEX | Use |
|---|---|---|
| `night-0` | `#141317` | Background |
| `night-1` | `#1D1C21` | Cards |
| `night-2` | `#26252B` | Wells, inputs |
| `night-ink` | `#EAE6DE` | Primary text (warm, not white) |
| `night-ash` | `#8E8A82` | Secondary text |
| `night-line` | `#2F2E35` | Hairlines |
| `shu-night` | `#C8503F` | Vermilion, lifted for contrast |

**Rules**
1. No gradients on surfaces. Ever. (A 4% grain texture on `paper-0` is permitted.)
2. Vermilion never appears twice in the same component.
3. All text pairs meet WCAG AA: `ink-0` on `paper-0` = 14.9:1, `shu` on `paper-0` = 5.6:1.

---

## 3 · Typography

Three voices: a **grotesk** that runs the machine, a **mincho serif** that carries the philosophy, and a **mono** that tells the truth about numbers.

### 3.1 Typefaces

| Role | Primary | Fallback stack |
|---|---|---|
| **UI / Structure** | SF Pro (Apple platforms) / Inter (web, Android) | `-apple-system, "SF Pro Text", Inter, "Helvetica Neue", sans-serif` |
| **Editorial / Precepts** | Shippori Mincho (Google Fonts) | `"Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif` |
| **Data / Numbers** | SF Mono / JetBrains Mono | `"SF Mono", "JetBrains Mono", ui-monospace, monospace` |

The mincho is reserved for moments of meaning: the daily precept, milestone screens, the 90-day title page. If it appears more than once per screen, it is being misused.

### 3.2 Type scale (major-third, 4pt-aligned)

| Token | Size / Line | Weight | Face | Use |
|---|---|---|---|---|
| `display` | 40 / 44 | 300 Light | Mincho | 90-day title, milestone screens |
| `title-1` | 28 / 34 | 600 Semibold | Grotesk | Screen titles |
| `title-2` | 22 / 28 | 600 Semibold | Grotesk | Section headers |
| `headline` | 17 / 24 | 600 Semibold | Grotesk | Card titles, buttons |
| `body` | 17 / 26 | 400 Regular | Grotesk | Reading text — generous 1.53 line-height |
| `callout` | 15 / 20 | 400 Regular | Grotesk | Secondary rows |
| `caption` | 13 / 18 | 500 Medium | Grotesk | Labels, all-caps eyebrow (+8% tracking) |
| `data-lg` | 34 / 40 | 500 Medium | Mono, tabular | Streak counts, day number, kg, band scores |
| `data-sm` | 13 / 18 | 400 Regular | Mono, tabular | Timestamps, deltas, chart axes |

**Rules**
- Numbers that measure the self (Day 34, Band 7.5, 62.4 kg, 14-day streak) are **always mono, always tabular** — the log does not lie and does not jiggle.
- Two weights per screen maximum. Emphasis comes from space and scale, not boldness.
- All-caps only at `caption` size, only for eyebrows/labels.
- Rag-right everywhere. No justified text, no centered paragraphs (centered is allowed solely on milestone screens).

---

## 4 · Icon System

**"Kamon" icons** — named after Japanese family crests: geometric, symmetric, reduced to essence.

### 4.1 Construction

- **Grid:** 24×24 px, 2 px padding safe-area, key shapes snap to a 4 px sub-grid.
- **Stroke:** 1.5 px, `round` caps and joins. No fills except the ensō when complete.
- **Corner language:** outer silhouettes may round at 2 px; interior details stay sharp. (Soft outside, precise inside — the brand in one rule.)
- **One idea per icon.** If an icon needs three metaphors, the feature needs renaming.
- **States:** default `ink-1` → active `ink-0` → the single primary action may use `shu`. Icons never use semantic colors decoratively.

### 4.2 Core set

| Domain | Icon | Form |
|---|---|---|
| Today / Home | Ensō | Open circle, gap at 45° |
| Body | Bow | A drawn bow arc — tension, not a dumbbell |
| Mind (IELTS / German) | Brush stroke | Single vertical stroke with tapered tail |
| Craft (AI tools) | Whetstone | Rectangle with one beveled corner |
| Discipline / Streak | Stacked stones | Three horizontal bars, ascending width |
| Review / Journal | Folding screen | Two hinged panels |
| Settings | Balance | Horizontal line over a fulcrum dot |
| Complete | Closed ensō | The circle, closed and filled |

The completion interaction: tapping "done" **draws the ensō shut** — a 400 ms stroke animation closing the gap. This is the emotional core of the interface and the only place animation is allowed to be felt.

---

## 5 · Design Language

Five principles, in priority order. When they conflict, the lower number wins.

1. **Ma (間) — negative space is structure.** Space is not what's left over; it is the primary layout material. When in doubt, remove the element and keep the space.
2. **Kanso (簡素) — simplicity by subtraction.** Every screen ships at the minimum viable element count. A new element must displace an old one.
3. **Shibui (渋い) — quiet excellence.** Beauty that reveals itself over 90 days of daily use, not in a screenshot. Nothing designed to impress on first sight.
4. **Seijaku (静寂) — stillness with one point of energy.** Each screen is calm except for exactly one vermilion focal point: the next action.
5. **Kaizen (改善) — the system compounds.** The UI privileges trends over totals, streaks over scores, identity ("you are someone who shows up") over outcomes.

**Texture & depth:** flat surfaces, hairline borders, at most one shadow level (`0 1px 2px rgba(23,22,26,0.06)`). Depth is communicated by paper tone (`paper-0` → `paper-1` → `paper-2`), like sheets laid on a desk — never by heavy elevation.

**Motion:** 150–250 ms, `ease-out`, opacity + ≤8 px translate. No bounces, no springs, no confetti. The one ceremonial exception is the 400 ms ensō close.

---

## 6 · Visual Moodboard

*(Rendered board: see `design/styleguide.html`, section "Moodboard".)*

**Board 1 — Paper & Ink.** Unbleached washi texture; a single sumi-e brush stroke; a hanko seal pressed slightly imperfectly in vermilion; Muji notebook spread with a grey pencil.

**Board 2 — The Dōjō.** Raked gravel of Ryōan-ji; a wooden kendo floor lit by one window; folded gi, white on white; stacked river stones.

**Board 3 — Swiss discipline.** Müller-Brockmann poster grids; Massimo Vignelli timetables; Braun ET66 calculator; Dieter Rams' 10 principles pinned to a wall.

**Board 4 — The Athlete.** Chalked hands on a barbell, desaturated; a handwritten training log with crossed-out numbers; a runner alone at 6 a.m., long shadow; a stopwatch face.

**Board 5 — Apple restraint.** iOS Health type hierarchy; Apple Watch activity ring (as a *reference for closure*, not for triple-ring color); AirPods packaging whitespace.

**The synthesis:** warm paper worlds (1–2) give the temperature, Swiss boards (3) give the skeleton, athletic boards (4) give the honesty, Apple (5) gives the finish. Anything that would not sit comfortably on all five boards does not enter the product.

---

## 7 · UI Principles

1. **One screen, one question.** Today asks "will you keep your word?" Review asks "what did the day cost or pay?" Never both at once.
2. **The next action is always visible and always singular.** One vermilion element per screen = the next thing to do.
3. **Friction budget: zero taps to see, one tap to do.** Today's obligations are visible on open with no navigation. Marking done is a single tap. Anything requiring 3+ taps daily is a design failure.
4. **Show the consequence, not just the task.** Every commitment renders with its 90-day line: *"German · Day 34 of 90 · on pace for C1."* The long-term consequence of the current choice is ambient, not preached.
5. **Streaks bend, they don't break.** A missed day marks in `shu` on the log — acknowledged, never hidden — but the identity metric is *"days kept: 81 of 90"*, not a counter reset to zero. The system is severe about truth and generous about continuation.
6. **Numbers are sacred.** Body weight, band scores, minutes of deep work — always mono, always with their delta, never rounded to flatter.
7. **Quiet by default, ceremonial at milestones.** Days 30, 60, 90 earn the mincho display face, `kin` gold, and a full-bleed still screen. Ceremony is rare so that it means something.
8. **Respect the evening.** After the user's set shutdown time, the OS greys to review-only. Deep Work includes the discipline to stop.

---

## 8 · Layout Rules

### 8.1 Grid

- **Base unit:** 4 pt. **Rhythm unit:** 8 pt. All spacing ∈ {4, 8, 12, 16, 24, 32, 48, 64, 96}.
- **Mobile:** single column, 24 pt side margins (generous — this is ma, not waste), 4-column layout grid for internal alignment.
- **Tablet / desktop:** 8-column grid, 72 pt margins, max content width **680 pt** for reading, 1040 pt for boards. Content never spans full width on large screens.
- **Vertical rhythm:** section spacing 48 pt, card internal padding 20 pt, list-row height 56 pt (44 pt minimum touch target everywhere).

### 8.2 Composition

- **Anchored top-left.** Titles and eyebrows align to the left margin; the Swiss axis is sacred. Centered composition only on milestone screens.
- **The 60/40 rule:** at least 40% of every screen is empty space. If content exceeds 60%, split the screen.
- **Hairline discipline:** sections separate by 1 px `line` rules or by 48 pt of space — never both.
- **One card level.** Cards do not nest inside cards. If hierarchy needs depth, use indentation and hairlines.
- **The seal position:** bottom-right of the screen's primary surface, 24 pt inset — constant across the OS, like a painter's signature.

---

## 9 · Component Style Guide

All values in pt; radii intentionally small — Bushido OS is crisp, not bubbly.

### 9.1 Buttons

| Variant | Style | Use |
|---|---|---|
| **Primary (Seal)** | `shu` fill, `#FFFEFA` text, radius 8, height 52, headline type | One per screen. The next action |
| **Secondary** | `paper-1` fill, 1 px `line` border, `ink-0` text | Alternate paths |
| **Ghost** | No fill/border, `ink-1` text | Tertiary, inline |
| **Destructive** | Ghost with `shu` text — never a red fill | Deleting is quiet, not alarming |

Pressed state: fill deepens (`shu-deep`), no scale bounce. Disabled: `paper-2` fill, `ink-2` text.

### 9.2 Cards ("Sheets")

`paper-1` fill · radius 12 · 1 px `line` border · shadow `0 1px 2px rgba(23,22,26,0.06)` · padding 20. Header: caption eyebrow (all-caps, `ink-2`) + headline title. Cards never carry background images or gradients.

### 9.3 Habit row — "The Promise"

56 pt row: **[open ensō 24 px] Habit name — `body` · schedule — `data-sm` mono, right-aligned.** Tap anywhere → ensō draws closed (400 ms), name settles to `ink-1`, row remains (a kept promise is not deleted, it is *recorded*). Missed yesterday: a 3 px vermilion tick on the left edge — noted, not punished.

### 9.4 Streak & progress — "Stones"

- **Streak:** row of 2.5 px vertical strokes (tally marks), one per day kept; every 10th slightly taller. Count in `data-lg` mono. No flames, no emoji.
- **90-day campaign bar:** 90 hairline segments; kept = `ink-0`, missed = `shu`, future = `line`. Days 30/60/90 marked with `kin` dots. The whole 90 days visible at once, always.
- **Skill progress (IELTS / German / AI):** thin 2 px track in `paper-2`, fill in `ai` indigo, current value in mono with target ghosted after it: `7.0 → 8.0`.

### 9.5 Inputs

`paper-2` fill, no border at rest, radius 8, height 48, `body` type. Focus: 1.5 px `ink-0` underline slides in — no glow, no blue ring. Labels are caption eyebrows above the field, never floating placeholders.

### 9.6 Tabs / navigation

Bottom bar (mobile): 4 kamon icons + labels in `caption`. Active = `ink-0` + 2 px top indicator; inactive = `ink-2`. No pill backgrounds, no badges with counts — the OS never nags with red dots.

### 9.7 The Daily Precept

One mincho line on the Today screen, `title-2` Light, `ink-1`, rag-right, with a 2 px `shu` rule on its left edge. Rotates daily from a curated set of 90. This is the only editorial-serif element in daily use.

### 9.8 Charts (weight, study hours, deep-work minutes)

Line charts only: 1.5 px `ink-0` line, no area fill, no smoothing beyond monotone interpolation. Axes in `data-sm` `ink-2`; hairline gridlines, horizontal only. Target line: 1 px dashed `ai`. Current point: 4 px `shu` dot. A chart with more than two series is two charts.

### 9.9 Empty & error states

Empty: the open ensō, one caption line ("Nothing scheduled. Rest is training too."), no illustration mascots. Errors: plain sentence in `ink-0` on a `shu-wash` sheet — what happened, and the one action that fixes it.

---

## 10 · Overall Design Philosophy

Bushido OS is built on a single conviction: **discipline is a design problem.** Willpower fails when interfaces demand it; environments succeed when they make the right action the easy one. So the entire system is engineered to lower the cost of keeping a promise and raise the visibility of its consequence.

The aesthetic is not decoration on top of that goal — it *is* the goal. Calm paper and disciplined hairlines lower arousal so that opening the app never triggers avoidance. One vermilion action per screen removes deliberation. Mono numbers that never flatter build the self-trust that streaks are made of. The mincho precept, appearing once a day, reframes the work as a practice rather than a chore. Even the missed-day mark — visible, small, un-dramatic — encodes the deepest rule of the dōjō: *acknowledge the fall completely, then return to stance.*

Where a habit app gamifies, Bushido OS **dignifies**. There are no points, because the user is not playing; there is a seal, because she is signing her name to a day. The interface asks to be judged the way Muji judges a bowl or Rams judged a radio: does it serve, quietly, for a long time? Over 90 days the product should feel less like software and more like a well-swept floor — evidence, every morning, that someone here takes the practice seriously.

**Every choice has a long-term consequence. The design's choice is restraint. Its consequence is trust.**

---

*Files: this document (`BUSHIDO-OS-DESIGN-SYSTEM.md`) is the source of truth; `styleguide.html` renders the palette, type, moodboard, and components for review in any browser.*
