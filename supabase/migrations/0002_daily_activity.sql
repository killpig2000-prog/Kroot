-- Tracks minutes studied per user per day, for streaks + the weekly chart on /profile.

create table public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_date date not null default current_date,
  minutes smallint not null default 0 check (minutes >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

alter table public.daily_activity enable row level security;

create policy "Daily activity is viewable by owner"
  on public.daily_activity for select
  using (auth.uid() = user_id);

create policy "Daily activity is insertable by owner"
  on public.daily_activity for insert
  with check (auth.uid() = user_id);

create policy "Daily activity is updatable by owner"
  on public.daily_activity for update
  using (auth.uid() = user_id);
