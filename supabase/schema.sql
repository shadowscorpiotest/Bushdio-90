-- LifeHub · Supabase schema
-- Run the whole file in the SQL Editor. Sections 1–3 are idempotent: running them twice is safe.
-- Section 4 needs two values replaced before it will work — see the note there.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. The encrypted snapshot (all your structured data)
--    The server stores ciphertext it cannot read. `salt` is what lets another
--    device derive the same key from your password.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.snapshots (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  ciphertext text not null,
  iv         text not null,
  salt       text not null,
  version    bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.snapshots enable row level security;
drop policy if exists "own row" on public.snapshots;
create policy "own row" on public.snapshots
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Photos & videos — private bucket, one folder per account, files encrypted
--    in the browser before upload.
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('media', 'media', false)
on conflict (id) do nothing;

drop policy if exists "own media" on storage.objects;
create policy "own media" on storage.objects for all to authenticated
  using      (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Push (optional — only for reminders with the app FULLY CLOSED)
--
--    NOTE, deliberately: unlike everything above, `push_schedule` is stored
--    READABLE. A server cannot wake your phone at 8am without knowing that it
--    should, nor say anything useful without knowing what to say. Only the
--    times, weekdays and short lock-screen titles live here — never your logs,
--    journal, health or finances. The app states this where you switch it on.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.push_subs (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subs_user on public.push_subs(user_id);
alter table public.push_subs enable row level security;
drop policy if exists "own subs" on public.push_subs;
create policy "own subs" on public.push_subs
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.push_schedule (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  at         text not null,                             -- "HH:MM" in the user's own local time
  days       int[] not null default '{0,1,2,3,4,5,6}',  -- 0 = Monday
  title      text not null,
  body       text not null default '',
  nav        text not null default '',
  tz_offset  int not null default 0,                    -- minutes east of UTC, from the device
  last_sent  date,                                      -- so a row fires at most once a day
  created_at timestamptz not null default now()
);
create index if not exists push_schedule_user on public.push_schedule(user_id);
alter table public.push_schedule enable row level security;
drop policy if exists "own schedule" on public.push_schedule;
create policy "own schedule" on public.push_schedule
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Run the sender every 5 minutes.
--    REPLACE <PROJECT-REF> and <SERVICE-ROLE-KEY> before running this section.
--    The service-role key belongs ONLY here and in function secrets — never in
--    the app, never committed.
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- unschedule first so re-running this file can't stack duplicate jobs
select cron.unschedule('lifehub-push')
where exists (select 1 from cron.job where jobname = 'lifehub-push');

select cron.schedule('lifehub-push', '*/5 * * * *', $$
  select net.http_post(
    url     := 'https://<PROJECT-REF>.functions.supabase.co/push-tick',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <SERVICE-ROLE-KEY>'
    ),
    body    := '{}'::jsonb
  );
$$);
