-- Pronunciation Challenge mode: one hard line, scored on accuracy and time.
-- Separate from speaking_progress so the practice-chapter stats (accuracy
-- averages, chapters cleared) never mix with challenge attempts.
--
-- Idempotent: safe to re-run.

create table if not exists public.challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  challenge_key text not null,
  -- Best run only: highest accuracy, and the fastest time recorded at or
  -- above that accuracy. Retries are never counted or penalised.
  best_accuracy smallint not null default 0 check (best_accuracy between 0 and 100),
  best_ms integer not null default 0 check (best_ms >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, challenge_key)
);

alter table public.challenge_progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'challenge_progress'
      and policyname = 'Challenge progress is viewable by owner'
  ) then
    create policy "Challenge progress is viewable by owner"
      on public.challenge_progress for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'challenge_progress'
      and policyname = 'Challenge progress is insertable by owner'
  ) then
    create policy "Challenge progress is insertable by owner"
      on public.challenge_progress for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'challenge_progress'
      and policyname = 'Challenge progress is updatable by owner'
  ) then
    create policy "Challenge progress is updatable by owner"
      on public.challenge_progress for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists challenge_progress_user_idx
  on public.challenge_progress (user_id);
