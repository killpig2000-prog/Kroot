-- Hangul trace-to-write progress: one row per learner per jamo. `practiced_at`
-- is set the first time every stroke of the letter is traced end to end in
-- practice mode; best_score/best_stars are the top challenge attempt (a
-- retry never lowers them). XP for a challenge goes through award_xp with a
-- per-day item key, so this table is display state only, never a ledger.
--
-- Idempotent: safe to re-run.

create table if not exists public.hangul_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  jamo text not null check (char_length(jamo) = 1),
  practiced_at timestamptz,
  best_score smallint not null default 0 check (best_score between 0 and 100),
  best_stars smallint not null default 0 check (best_stars between 0 and 3),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, jamo)
);

alter table public.hangul_progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'hangul_progress'
      and policyname = 'Hangul progress is viewable by owner'
  ) then
    create policy "Hangul progress is viewable by owner"
      on public.hangul_progress for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'hangul_progress'
      and policyname = 'Hangul progress is insertable by owner'
  ) then
    create policy "Hangul progress is insertable by owner"
      on public.hangul_progress for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'hangul_progress'
      and policyname = 'Hangul progress is updatable by owner'
  ) then
    create policy "Hangul progress is updatable by owner"
      on public.hangul_progress for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

grant select, insert, update on public.hangul_progress to authenticated;
