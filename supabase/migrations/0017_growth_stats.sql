-- My growth backend:
--  * speaking_progress: per-prompt completion records, so Speaking finally
--    has a stats card like the other skills.
--  * get_my_growth_stats(): every My-growth aggregate in ONE round-trip
--    (course days, per-skill counts, lifetime minutes, best streak).

create table public.speaking_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  prompt_key text not null,
  best_score smallint not null default 0 check (best_score between 0 and 100),
  completed_at timestamptz not null default now(),
  unique (user_id, prompt_key)
);

alter table public.speaking_progress enable row level security;

create policy "Speaking progress is viewable by owner"
  on public.speaking_progress for select
  using (auth.uid() = user_id);

create policy "Speaking progress is insertable by owner"
  on public.speaking_progress for insert
  with check (auth.uid() = user_id);

create policy "Speaking progress is updatable by owner"
  on public.speaking_progress for update
  using (auth.uid() = user_id);

-- One-call aggregates for the My growth page.
create function public.get_my_growth_stats()
returns table (
  course_done integer,
  listening_done integer,
  writing_done integer,
  speaking_done integer,
  total_minutes integer,
  best_streak integer
)
language sql
security definer set search_path = public
stable
as $$
  with streaks as (
    select count(*) as len
    from (
      select activity_date,
             activity_date - (row_number() over (order by activity_date))::int as grp
      from public.daily_activity
      where user_id = auth.uid() and minutes > 0
    ) runs
    group by grp
  )
  select
    (select count(*)::int from public.path_progress
      where user_id = auth.uid() and step_key like 'course-day-%'),
    (select count(*)::int from public.listening_progress
      where user_id = auth.uid() and completed_at is not null),
    (select count(*)::int from public.writing_progress where user_id = auth.uid()),
    (select count(*)::int from public.speaking_progress where user_id = auth.uid()),
    coalesce((select sum(minutes)::int from public.daily_activity where user_id = auth.uid()), 0),
    coalesce((select max(len)::int from streaks), 0);
$$;
