# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout — read this first

The repository root contains only a stub `README.md` and `bushido-90-complete.zip`.
**All application source code lives inside the zip archive** and is not extracted
in the repo. To work on the code:

```bash
unzip bushido-90-complete.zip    # creates bushido-90/
cd bushido-90
```

The archive contains its own `CLAUDE.md` with project conventions (summarized and
expanded below). If code changes are meant to persist in this repository, the
archive must be re-created from the modified `bushido-90/` directory (or the
extracted tree committed directly) — otherwise changes exist only locally.

## Project overview

**Bushido 90** — an AI-powered "Life Operating System" for a 90-day discipline
challenge. Luxury dark-themed web app covering daily missions, habit/metric
tracking, nutrition, workouts, projects, goals, journaling, and an AI coach.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) ·
Tailwind CSS v3 (NOT v4 — config is `tailwind.config.ts`) · Prisma 5 +
Supabase Postgres · Supabase Auth via `@supabase/ssr` · Framer Motion ·
lucide-react · Zod. Path alias: `@/*` → `./src/*`.

**Status:** shipped so far — folder structure, full Prisma schema, auth
(email + Google OAuth), app shell, live dashboard (streak/XP/scores, optimistic
task toggling, hydration logging). All other sidebar routes fall through to the
`(app)/[...soon]` catch-all "coming phase" page. Remaining phases: today/mission
planner, bushido virtues, tracker pages, nutrition, workout, projects, goals,
calendar, journal, knowledge, analytics, AI coach, settings.

## Commands

All commands run from inside `bushido-90/`:

```bash
npm install          # postinstall runs `prisma generate`
npm run dev          # start dev server → http://localhost:3000
npm run build        # production build
npm run lint         # next lint
npm run db:migrate   # prisma migrate dev (needs DATABASE_URL + DIRECT_URL)
npm run db:seed      # seed the metric registry (tsx prisma/seed-metrics.ts) — required once
npm run db:studio    # prisma studio to inspect data
```

There is no test framework configured.

**Environment:** copy `.env.example` → `.env.local`. Requires a Supabase project:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`
(pooled, port 6543, pgbouncer), `DIRECT_URL` (direct, port 5432 — used for
migrations), `NEXT_PUBLIC_SITE_URL`. The redirect URL
`http://localhost:3000/api/auth/callback` must be registered in Supabase
Auth → URL Configuration.

## Architecture

### Feature-based layout

- `src/app/` is **routing only** — pages are thin wrappers that fetch data and
  render feature components.
- `src/features/<domain>/components/` holds domain UI (auth, dashboard, …).
- `src/components/` holds shared primitives (layout shell, widgets).
- `src/services/db/` holds server-only read functions (e.g.
  `dashboard.service.ts` does one aggregated parallel read per page).
- `src/actions/` holds Server Actions for all mutations.
- `src/config/nav.ts` is the **single source of truth for routes** — add new
  routes only there. `src/config/site.ts` holds site metadata.

### Route groups & the catch-all

- `(auth)/` — public pages: login, register, forgot-password, reset-password.
- `(app)/` — protected shell (sidebar + top nav + mobile nav via `app-shell.tsx`).
- `(app)/[...soon]/` — catch-all that renders a "coming phase" page for any nav
  route not yet built. Explicit routes (e.g. `/dashboard`) always take
  precedence, so shipping a new page just means creating its folder.

### Auth flow

- `middleware.ts` → `src/lib/supabase/middleware.ts` (`updateSession`) refreshes
  the Supabase session on every request and enforces redirects: `/` routes by
  session, unauthenticated users on protected routes → `/login?next=…`,
  authenticated users on auth pages → `/dashboard` (except `/reset-password`,
  which is reached with a recovery session).
- Supabase Auth is the identity source; the Prisma `User` row uses the same id
  (`= auth.users.id`). `ensureUserRecord` in `src/actions/auth.actions.ts` is an
  idempotent upsert that provisions the app-side user (+ default settings) —
  it runs on register and in `/api/auth/callback` (which handles OAuth, email
  confirmation, and password-recovery code exchange). **Every new Supabase user
  must go through `ensureUserRecord`.**
- Guard every protected page and server action with `requireUser()` from
  `src/lib/auth.ts`. `getUser`/`getProfile` are wrapped in React `cache()` so
  they're safe to call from many components in one request.

### Data patterns

- **Reads:** server components call `src/services/db/*` functions.
- **Mutations:** Server Actions in `src/actions/*` that (1) call `requireUser()`,
  (2) validate with Zod (schemas live in `src/features/<domain>/schemas.ts`),
  (3) return `{ error }` / `{ fieldErrors }` / `{ ok }` state objects consumed
  via `useActionState`, and (4) call `revalidatePath` after writing. The client
  layers `useOptimistic` on top for instant feel.
- XP changes are transactional: task toggle updates `Task`, increments/decrements
  `User.xp`, and writes an `XpEvent` audit row in one `prisma.$transaction`.
- Zustand is reserved for pure UI state only (not yet needed). Never store
  server data in it.

### Generic metric engine

Simple tracking (sleep, water, weight, steps, mood, energy, reading,
meditation…) goes through the `MetricDefinition` + `MetricLog` models —
**do NOT create new tables for simple metrics.** Definitions are seeded by
`npm run db:seed` (idempotent upserts keyed by `key`, e.g. `"water_intake"`).
Each definition declares a value type (NUMBER/DURATION/RATING/BOOLEAN/
TIME_OF_DAY), optional min/max, and an aggregation rule (SUM/AVERAGE/LAST/
MIN/MAX) that says how multiple logs per day combine. Log values via
`logMetric(metricKey, value)` in `src/actions/tracker.actions.ts`, which
validates range and buckets by the user-local day.

### Date handling

Day-bucketed columns are `@db.Date` stored as **UTC midnight**. "Today" must
always be computed as `localToday(user.timezone)` from `src/utils/dates.ts` —
never `new Date()` truncation. `challengeDay()` gives the 1-based challenge day
clamped to 1..90 from `User.challengeStartDate`.

### Prisma schema (`prisma/schema.prisma`)

~40 models across domains: bushido virtues/scores/reflections, metric engine,
nutrition (Food/Recipe/Meal), workout (Exercise/Workout/Set/PersonalRecord),
projects/tasks/kanban/labels, goals, calendar, journal, knowledge
(folders/notes/tags/flashcards/bookmarks), focus sessions, gamification
(XpEvent), AI coach (threads/messages/insights), notifications. Design rules
baked into the schema:

- Structured domains (nutrition, workout, projects) get real relational models;
  everything simple goes through the metric engine.
- `DailySummary` is a computed rollup (written by a nightly cron) — dashboards
  read one row, not 40 aggregates.
- Every user-owned table has `userId` + `onDelete: Cascade`.

## Style conventions

Luxury dark theme — no bootstrap-feel. Design tokens live in
`tailwind.config.ts`: `base` #0B0B0C (bg), `card` #151517, `edge` #2A2A2D
(borders), `gold` #D4AF37 (restrained accents, with `deep`/`soft` variants).
Cards use `rounded-xl2` (18px) and the `card` shadow. One easing everywhere:
`cubic-bezier(.22,1,.36,1)`. Framer Motion presets are centralized in
`src/lib/framer.ts`. Respect `prefers-reduced-motion`.
