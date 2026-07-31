-- Listening: situations + dialogue scripts live in code, read aloud via TTS
-- (see src/lib/listening-dialogues.ts). Only user progress and a standalone
-- listening level test are persisted here.

-- One row per user per completed dialogue. dialogue_id is a stable slug from
-- DIALOGUES in src/lib/listening-dialogues.ts, not a foreign key — content
-- lives in code so it can change freely without migrations.
create table public.listening_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  dialogue_id text not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, dialogue_id)
);

alter table public.listening_progress enable row level security;

create policy "Listening progress is viewable by owner"
  on public.listening_progress for select
  using (auth.uid() = user_id);

create policy "Listening progress is insertable by owner"
  on public.listening_progress for insert
  with check (auth.uid() = user_id);

create policy "Listening progress is updatable by owner"
  on public.listening_progress for update
  using (auth.uid() = user_id);

-- Standalone listening level test, separate from the mixed-skill level_test_results.
create table public.listening_test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  result_level public.cefr_level not null,
  score smallint not null default 0,
  total_questions smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.listening_test_results enable row level security;

create policy "Listening test results are viewable by owner"
  on public.listening_test_results for select
  using (auth.uid() = user_id);

create policy "Listening test results are insertable by owner"
  on public.listening_test_results for insert
  with check (auth.uid() = user_id);
