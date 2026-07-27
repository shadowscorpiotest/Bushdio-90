# LifeHub · server setup

Everything here is optional except `schema.sql` sections 1–2, which cloud sync and media sync need.

**Nothing in this folder should ever contain a secret.** Your `service_role` key and your VAPID
private key belong in the Supabase dashboard and in function secrets — never in a committed file.

---

## 1. Database + storage (required for sync)

Supabase → **SQL Editor** → paste `schema.sql` → **Run**.

Sections 1–3 are safe as-is and can be re-run any time. **Section 4 needs two values replaced** — skip
it unless you're doing step 2 below.

Then check **Authentication → Providers → Email** is on. Turning *Confirm email* off makes the first
sign-up log you straight in.

---

## 2. Reminders with the app fully closed (optional)

Without this, reminders still work — they arrive while LifeHub is open or recently used. This step
adds real scheduled pushes that fire with the app shut.

### Before you start — what this shares

Everything else you keep in LifeHub is encrypted in your browser before upload, so the server holds
ciphertext it can't read. **This feature is the exception, deliberately.** To wake your phone on time
the server has to store:

- the **times** and **weekdays** your reminders run,
- the **short titles** shown on your lock screen (e.g. *"🧘 Morning meditation"*).

That's the whole of `push_schedule`. Your habit logs, journal, health, finances, memories and photos
stay unreadable to the server. The app says this on the screen where you switch it on, and turning it
off deletes both the schedule and the device registration.

A second honest limit: **a schedule isn't a state check.** The server can't tell whether you've
already taken your vitamins, so these fire *on time* rather than only when something's outstanding.
The conditional nudges stay in the app.

### a. Generate a VAPID key pair

These identify your server to the push services. Run locally (needs Node 16+):

```bash
npx web-push generate-vapid-keys
```

You'll get a **public** and a **private** key.

### b. Put the public key in the app

In `app.js`, near the top:

```js
const VAPID_PUBLIC = "paste-the-public-key-here";
```

Safe to commit — it's the public half. While it's empty the app hides the feature instead of offering
a switch that can't work.

### c. Set the secrets

```bash
supabase secrets set \
  VAPID_PUBLIC=<public key> \
  VAPID_PRIVATE=<private key> \
  VAPID_SUBJECT=mailto:you@example.com
```

**The private key never goes in the repo.**

### d. Deploy the function

```bash
supabase functions deploy push-tick --no-verify-jwt
```

`--no-verify-jwt` is needed because pg_cron calls it with the service-role key, not a user's token.

### e. Schedule it

Back in the SQL Editor, run **section 4** of `schema.sql` after replacing:

- `<PROJECT-REF>` — from your project URL,
- `<SERVICE-ROLE-KEY>` — Settings → API → `service_role`.

It runs every 5 minutes and only sends rows whose local time has arrived and that haven't fired today.

### f. Test it

1. Open LifeHub on the **live site** (not the in-chat preview — its sandbox blocks all of this).
2. **Profile → Reminders → Turn on**, then under *Even when the app is closed*, **Turn on**.
3. Give a habit a reminder time a few minutes out (habit → Edit → *Remind me at*).
4. **Fully close the app** and wait.

Check it fired: Supabase → **Edge Functions → push-tick → Logs**. The response says how many rows it
checked, how many were due, and how many pushes went out.

### iPhone

Web push only works for a PWA **added to the Home Screen** (iOS 16.4+), opened from that icon at least
once. In Safari-as-a-browser it will never fire — an Apple restriction, not a LifeHub bug.

---

## Undoing it

- **In the app:** *Turn off & delete from server* removes this device and its schedule.
- **Everywhere:** `select cron.unschedule('lifehub-push');` then
  `drop table public.push_schedule, public.push_subs;`

Sync and media are untouched by any of that.
