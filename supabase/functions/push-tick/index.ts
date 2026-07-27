// LifeHub · push-tick
//
// Called every 5 minutes by pg_cron. Finds schedule rows whose local time has arrived today and
// hasn't fired yet, and sends a web push to each of that account's registered devices.
//
// What this function can see: times, weekdays and the short lock-screen titles. That is the whole of
// `push_schedule`. It never touches `snapshots`, which is ciphertext it has no key for.
//
// Deploy:  supabase functions deploy push-tick --no-verify-jwt
// Secrets: supabase secrets set VAPID_PUBLIC=... VAPID_PRIVATE=... VAPID_SUBJECT=mailto:you@example.com

import { createClient } from "jsr:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

// How late a row may still fire. The cron runs every 5 minutes, so a slightly wider window absorbs a
// slow tick — while stopping a missed 7am reminder from ambushing you at 9pm.
const WINDOW_MIN = 15;

const pad = (n: number) => String(n).padStart(2, "0");

/** The user's own wall clock, from the tz offset their device reported. */
function localNow(tzOffsetMinutes: number) {
  const d = new Date(Date.now() + tzOffsetMinutes * 60_000);
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    minutes: d.getUTCHours() * 60 + d.getUTCMinutes(),
    weekdayMon0: (d.getUTCDay() + 6) % 7,
  };
}
const toMinutes = (hhmm: string) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

Deno.serve(async () => {
  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: rows, error } = await db.from("push_schedule").select("*");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const due = (rows ?? []).filter((r) => {
    const now = localNow(r.tz_offset ?? 0);
    if (r.last_sent === now.date) return false; // already fired today
    if (!(r.days ?? []).includes(now.weekdayMon0)) return false; // not a day it runs
    const at = toMinutes(r.at);
    return now.minutes >= at && now.minutes - at <= WINDOW_MIN;
  });
  if (!due.length) return Response.json({ checked: rows?.length ?? 0, due: 0, sent: 0 });

  const appServer = await webpush.ApplicationServer.new({
    contactInformation: VAPID_SUBJECT,
    vapidKeys: await webpush.importVapidKeys(
      { publicKey: VAPID_PUBLIC, privateKey: VAPID_PRIVATE },
      { extractable: false },
    ),
  });

  let sent = 0, dropped = 0;

  for (const row of due) {
    const { data: subs } = await db.from("push_subs").select("*").eq("user_id", row.user_id);

    if (subs?.length) {
      const payload = JSON.stringify({
        title: row.title,
        body: row.body ?? "",
        nav: row.nav ?? "",
        tag: `sched-${row.id}-${localNow(row.tz_offset ?? 0).date}`,
      });

      for (const s of subs) {
        try {
          const subscriber = appServer.subscribe({
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          });
          await subscriber.pushTextMessage(payload, {});
          sent++;
        } catch (e) {
          // 404/410 means the browser threw this subscription away — stop pushing to a dead device
          const code = (e as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) {
            await db.from("push_subs").delete().eq("endpoint", s.endpoint);
            dropped++;
          } else {
            console.error("push failed", s.endpoint.slice(0, 48), e);
          }
        }
      }
    }

    // Mark AFTER sending, one row at a time, so a crash mid-run re-sends rather than silently
    // skipping someone's whole day.
    await db.from("push_schedule")
      .update({ last_sent: localNow(row.tz_offset ?? 0).date })
      .eq("id", row.id);
  }

  return Response.json({ checked: rows?.length ?? 0, due: due.length, sent, dropped });
});
