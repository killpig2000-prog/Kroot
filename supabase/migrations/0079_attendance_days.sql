-- Growth rings (2026-09-10): one row per learner per calendar day they
-- opened the app. Studying already leaves daily_activity rows, but a day
-- you only showed up on left nothing — and the rings count showing up.
-- Additive and idempotent; no backfill (older weeks read from
-- daily_activity + vocabulary_progress at query time instead).
create table if not exists public.attendance_days (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.attendance_days enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'attendance_days' and policyname = 'attendance_days_own_read') then
    create policy attendance_days_own_read on public.attendance_days
      for select to authenticated using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'attendance_days' and policyname = 'attendance_days_own_insert') then
    create policy attendance_days_own_insert on public.attendance_days
      for insert to authenticated with check (auth.uid() = user_id);
  end if;
end $$;
