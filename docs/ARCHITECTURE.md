# Bushido OS — Architecture Plan v0.1

*Companion to `PRD v0.1` and `design/BUSHIDO-OS-DESIGN-SYSTEM.md`. No code yet — this is the blueprint.*

---

## 1 · PRD Analysis

### 1.1 What's strong

- **Clear spine.** Five pillars → daily missions → XP → levels → weekly review is a coherent loop: *act → measure → reflect → adjust*. Every MVP feature feeds that loop; nothing is orphaned.
- **Scoped MVP.** Five features, explicit "do not over-engineer." The onboarding flow (name, mission, level, goals, time) maps 1:1 onto the data the dashboard needs — no speculative fields.
- **Identity framing.** "Keep the Promise" and consistency/discipline scores give the product a reason to exist beyond a todo list, and they translate directly into derivable metrics (no new user input needed).

### 1.2 Gaps the PRD leaves open (decided below)

| Open question | Decision for v0.1 |
|---|---|
| When does a "day" end? (streaks, daily score) | User's local timezone, stored on profile; day key = `YYYY-MM-DD` in that zone. A miss is a miss at local midnight — no grace windows in MVP. |
| Are missions user-defined or system-generated? | Both: onboarding seeds a default mission set per pillar from templates; user can add/edit/archive. Missions are *templates*; each day materializes completions against them. |
| XP economy — fixed or configurable? | Fixed config table in code (`lib/xp.ts`), mirrored to DB later if needed. Balancing an economy in the DB is premature. |
| Level curve | Deterministic function of lifetime XP (config array of thresholds + rank names). Never stored — always derived, so it can be rebalanced without migration. |
| What is the "daily score"? | `earned XP today / scheduled XP today` as a percentage. Derived, not stored. |
| Streak definition | Consecutive days with daily score ≥ 80% ("kept days"). Per design system: the campaign shows *days kept of 90*, a break is marked, not a reset to zero drama. |
| Photos | Supabase Storage, private bucket, signed URLs. Metadata row in Postgres. |
| Offline / multi-device | Online-first (Supabase is the source of truth). Optimistic UI for the one-tap complete; no offline sync in MVP. |

### 1.3 ⚠️ Conflicts with Design System v1.0 — reconciliation

The PRD and the shipped design system disagree in three places. Proposed resolution (PRD wins on *product mechanics*, design system wins on *presentation*):

1. **Gamification.** The design system says "no points — the OS dignifies, not gamifies." The PRD mandates XP and levels. **Resolution: keep the XP/level mechanics (they're the progress engine), render them in the restrained language** — XP as a mono number with a thin progress hairline, rank names on quiet milestone screens, no coins, no confetti, no floating "+15 XP" toasts. Ranks use the mincho serif and `kin` gold, like a belt ceremony, not a slot machine.
2. **Palette.** PRD proposes Obsidian `#0B0B0B` / Ivory `#F7F3EA` / Crimson `#A32035` / Sage `#8FA58A` / Gold `#C9A227`. These are the same *roles* as the design system tokens (ink / paper / seal / pine / kin) with slightly different values. **Resolution: keep the design-system HEX values as the single source of truth** (they were contrast-checked and warmer); map PRD names to tokens: Obsidian→`ink-0 #17161A`, Ivory→`paper-0 #F7F4EE`, Crimson→`shu #B43A2B`, Sage→`pine #41594A`, Gold→`kin #A98F5E`. If the founder prefers the PRD values, it's a 5-line token swap in `tokens.css` — the architecture doesn't care.
3. **Typography.** PRD suggests Cinzel/Playfair for headings. Cinzel is Roman-epigraphic (gladiator, not samurai) and fights the Zen direction. **Resolution: Inter for UI (both agree), Shippori Mincho for the editorial voice.** Playfair kept as a documented fallback if Latin-only licensing is ever an issue.

---

## 2 · System Architecture

### 2.1 Stack (as mandated by PRD §8)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15+, App Router, TypeScript** | Server Components by default; Server Actions for all mutations |
| Styling | **Tailwind CSS v4** | Design tokens as CSS custom properties in `@theme`; no arbitrary hex in components |
| Components | **shadcn/ui** | Restyled to Bushido tokens once at `components/ui/*`; app code never imports Radix directly |
| Data & Auth | **Supabase** (Postgres, Auth, Storage) | RLS on every table; `@supabase/ssr` for cookie-based sessions |
| Charts | **Recharts** | Wrapped once in `components/charts/` to enforce the one-line-one-truth chart style |
| Validation | **Zod** | Shared schemas: form validation client-side, re-validated inside every server action |
| Dates | **date-fns + date-fns-tz** | All "today" logic goes through `lib/dates.ts`; nothing else may call `new Date()` for day math |

### 2.2 Architectural principles

1. **Derive, don't store.** Level, daily score, streaks, consistency score are *pure functions* over two event tables (`mission_completions`, `xp_events`). No denormalized counters to drift out of sync. If it's ever slow, add a materialized view — not before.
2. **Server Actions as the only write path.** No client-side Supabase writes, no API routes for mutations. Every action: auth check → Zod parse → write → `revalidatePath`. RLS is the second lock on the same door.
3. **One-tap rule enforced in code.** Completing a mission is one server action, optimistic UI via `useOptimistic`, ensō animation plays immediately, rollback on failure. This is the interaction the whole product lives or dies on.
4. **Config over schema for the economy.** XP values, level thresholds, rank names, streak threshold live in `lib/config/` as typed constants. Rebalancing is a deploy, not a migration.
5. **Feature-folder components, shared primitives.** `components/ui` (shadcn, token-styled) and `components/patterns` (ensō check, campaign bar, stat, precept — the design-system components) are the only shared layers; everything else lives with its feature.

### 2.3 Data model (Postgres / Supabase)

```
profiles                     1 row per user (extends auth.users)
├── id (uuid, FK auth.users)
├── name, timezone
├── mission_statement        -- the 90-day mission
├── campaign_start (date)    -- day 1 of 90
├── daily_available_minutes
└── onboarded_at

mission_templates            the user's recurring promises
├── id, user_id
├── pillar        enum: discipline | body | knowledge | ai | reflection
├── time_of_day   enum: morning | day | evening
├── title, xp_value (int)
├── schedule      -- 'daily' | weekday mask (int, bit per day)
├── sort_order, archived_at
└── created_at

mission_completions          append-only log of kept promises
├── id, user_id
├── template_id (FK)
├── day_key (date)           -- local-day the completion counts for
├── completed_at (timestamptz)
└── UNIQUE (user_id, template_id, day_key)

xp_events                    append-only XP ledger
├── id, user_id
├── source        enum: mission | daily_bonus | weekly_review | adjustment
├── source_id (uuid, nullable)
├── amount (int), day_key (date)
└── created_at

weekly_reviews
├── id, user_id
├── week_start (date)  UNIQUE (user_id, week_start)
├── went_well, was_difficult, learned,
│   system_improvement, next_focus   (text)
└── completed_at

metric_definitions           user-configurable trackables
├── id, user_id
├── domain   enum: body | learning
├── name ("Weight", "German level"), unit ("kg", "CEFR"), target_value
└── sort_order

metric_entries               append-only measurements
├── id, user_id, definition_id
├── value (numeric), note
└── recorded_at (timestamptz)

progress_photos
├── id, user_id, storage_path, day_key, created_at
└── (files in private Storage bucket 'progress-photos')
```

**Derived (never stored):** lifetime XP = Σ`xp_events`; level/rank = threshold lookup; daily score = earned/scheduled XP for `day_key`; streak & consistency = fold over day keys since `campaign_start`.

**RLS:** every table gets `user_id = auth.uid()` for select/insert/update/delete. Append-only tables (`mission_completions`, `xp_events`, `metric_entries`) additionally deny update; corrections are compensating rows (`xp_events.source = 'adjustment'`), preserving the "the log does not lie" principle at the database layer.

### 2.4 Route map

```
/login  /signup                      (auth)  — Supabase Auth
/onboarding                          5-step wizard → creates profile,
                                     seeds mission_templates → /dashboard
/dashboard                           Today: greeting, Day N of 90, rank + XP
                                     hairline, today's missions by time-of-day,
                                     daily score, streak, campaign bar, precept
/missions                            manage templates (add / edit / archive)
/review                              weekly review index + status
/review/[weekStart]                  the five questions
/progress                            tabs: Body · Learning · Identity
/progress/photos                     photo timeline
/settings                            profile, timezone, export
```

Route groups: `(auth)` public + centered layout; `(app)` authenticated + tab-bar layout; middleware redirects by session & onboarding state.

---

## 3 · File Structure

```
bushido-os/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                  # centered paper layout
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── onboarding/
│   │       ├── page.tsx                # wizard shell (client)
│   │       └── actions.ts              # createProfile, seedMissions
│   ├── (app)/
│   │   ├── layout.tsx                  # auth guard + kamon tab bar
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # RSC: fetch + derive today
│   │   │   └── actions.ts              # completeMission, uncompleteMission
│   │   ├── missions/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts              # create/update/archiveTemplate
│   │   ├── review/
│   │   │   ├── page.tsx
│   │   │   ├── [weekStart]/page.tsx
│   │   │   └── actions.ts              # submitReview (+ review XP)
│   │   ├── progress/
│   │   │   ├── page.tsx
│   │   │   ├── photos/page.tsx
│   │   │   └── actions.ts              # addEntry, uploadPhoto
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── actions.ts
│   ├── layout.tsx                      # fonts, tokens, <html>
│   ├── globals.css                     # Tailwind + @theme tokens
│   └── middleware.ts                   # session refresh + route guards
│
├── components/
│   ├── ui/                             # shadcn, restyled to tokens
│   │   └── button.tsx card.tsx input.tsx tabs.tsx dialog.tsx …
│   ├── patterns/                       # design-system components
│   │   ├── enso-check.tsx              # the 400ms closing circle
│   │   ├── campaign-bar.tsx            # 90 segments
│   │   ├── stat.tsx                    # mono number + delta
│   │   ├── precept.tsx                 # daily mincho line
│   │   ├── rank-badge.tsx              # level name, quiet
│   │   ├── streak-tally.tsx
│   │   └── seal.tsx                    # 道
│   ├── dashboard/
│   │   ├── mission-list.tsx            # client: useOptimistic completion
│   │   ├── mission-row.tsx
│   │   └── daily-score.tsx
│   ├── missions/template-form.tsx
│   ├── review/review-form.tsx
│   ├── progress/
│   │   ├── metric-card.tsx
│   │   ├── entry-form.tsx
│   │   └── photo-grid.tsx
│   └── charts/
│       ├── trend-line.tsx              # 1.5px ink line, shu current dot
│       └── chart-theme.ts
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts  client.ts  middleware.ts
│   ├── config/
│   │   ├── xp.ts                       # XP_VALUES, DAILY_BONUS
│   │   ├── levels.ts                   # thresholds + rank names
│   │   ├── precepts.ts                 # the 90 daily lines
│   │   └── default-missions.ts         # onboarding seed set
│   ├── domain/                         # pure, unit-tested
│   │   ├── score.ts                    # dailyScore(completions, templates)
│   │   ├── streak.ts                   # kept days, current streak
│   │   ├── level.ts                    # xp → {level, rank, progress}
│   │   └── campaign.ts                 # day N of 90, per-day status
│   ├── dates.ts                        # localDayKey(tz), weekStart(tz)
│   └── validation/                     # zod schemas per feature
│       └── mission.ts review.ts metric.ts profile.ts
│
├── supabase/
│   ├── migrations/
│   │   ├── 0001_profiles.sql
│   │   ├── 0002_missions.sql
│   │   ├── 0003_xp_events.sql
│   │   ├── 0004_reviews.sql
│   │   ├── 0005_metrics_photos.sql
│   │   └── 0006_rls.sql
│   └── seed.sql
│
├── types/database.ts                   # supabase gen types
├── design/                             # existing design system (v1.0)
├── docs/ARCHITECTURE.md                # this file
└── package.json  tsconfig.json  tailwind/postcss config
```

**Repo note:** the existing vanilla-JS "Life OS" app (`index.html`, `app.js`, `styles.css`) is a different product generation. When coding starts, scaffold Next.js at the repo root and move the old app to `legacy/` (its GitHub Pages workflow will need updating or retiring at that point).

---

## 4 · Build Order (feature by feature, per PRD §10)

Each phase ships something usable; nothing in a later phase blocks an earlier one.

1. **Foundation** — Next.js scaffold, Tailwind `@theme` tokens from the design system, fonts, restyled shadcn primitives, `patterns/` components rendered on a static demo page. *Exit: the style guide, live in React.*
2. **Auth + Onboarding** — Supabase project, migrations 0001–0002, login/signup, 5-step wizard seeding default missions. *Exit: a new user lands on an empty dashboard with their mission at the top.*
3. **Daily Missions** — dashboard mission list, one-tap complete with ensō animation + `useOptimistic`, day-key logic. *Exit: the core loop works.*
4. **XP + Levels + Streak** — `xp_events` writes on completion, daily bonus, derivation functions (`lib/domain/*`, unit-tested first — they're pure), rank display, campaign bar, daily score. *Exit: dashboard is the full command center.*
5. **Weekly Review** — the five questions, review XP, Sunday-evening prompt state. *Exit: reflect loop closed.*
6. **Progress Tracking** — metric definitions/entries, trend-line charts, photo upload. *Exit: PRD MVP complete.*
7. **Polish pass** — empty states, error states, dark "Night Dōjō" theme, milestone screens (30/60/90), a11y audit.

**Testing:** unit tests only where logic is pure and consequential — `lib/domain/*` and `lib/dates.ts` (timezone edges: DST, day boundaries). UI is exercised manually in MVP.

**Explicit non-goals for v0.1:** AI assistant, notifications/push, social features, native mobile, offline sync, configurable XP economy, data import from the legacy app.
