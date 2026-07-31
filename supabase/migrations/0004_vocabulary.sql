-- Vocabulary: a curated word bank (public reference content) plus per-user
-- flip results, so tricky words can resurface first. Mirrors the split already
-- used for listening (static content vs. listening_progress).

create table public.vocabulary_words (
  id uuid primary key default gen_random_uuid(),
  topic_key text not null,
  level public.cefr_level not null,
  korean text not null,
  romanization text not null,
  meaning_en text not null,
  example_kr text,
  example_en text,
  created_at timestamptz not null default now()
);

alter table public.vocabulary_words enable row level security;

create policy "Vocabulary words are publicly readable"
  on public.vocabulary_words for select
  using (true);

create table public.vocabulary_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  word_id uuid not null references public.vocabulary_words (id) on delete cascade,
  correct_count smallint not null default 0,
  incorrect_count smallint not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, word_id)
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
