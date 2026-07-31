-- Vocabulary content moves to a hardcoded TS data file (src/lib/vocabulary-data/*),
-- so vocabulary_words is no longer needed. Progress now keys off a stable string
-- ("topic:level:word") instead of a DB row id.

drop table if exists public.vocabulary_progress;
drop table if exists public.vocabulary_words;

create table public.vocabulary_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  word_key text not null,
  correct_count smallint not null default 0,
  incorrect_count smallint not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, word_key)
);

alter table public.vocabulary_progress enable row level security;

create policy "Vocabulary progress is viewable by owner"
  on public.vocabulary_progress for select
  using (auth.uid() = user_id);

create policy "Vocabulary progress is insertable by owner"
  on public.vocabulary_progress for insert
  with check (auth.uid() = user_id);

create policy "Vocabulary progress is updatable by owner"
  on public.vocabulary_progress for update
  using (auth.uid() = user_id);
