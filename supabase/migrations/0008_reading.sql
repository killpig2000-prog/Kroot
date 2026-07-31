-- Reading ("Story Grove" 이야기 정원): passage content is a hardcoded TS data
-- file (src/lib/reading-data/*), same pattern as vocabulary. Only per-user
-- comprehension-quiz results live in the database, keyed by a stable string.

create table public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  passage_key text not null,
  correct_count smallint not null default 0,
  incorrect_count smallint not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, passage_key)
);

alter table public.reading_progress enable row level security;

create policy "Reading progress is viewable by owner"
  on public.reading_progress for select
  using (auth.uid() = user_id);

create policy "Reading progress is insertable by owner"
  on public.reading_progress for insert
  with check (auth.uid() = user_id);

create policy "Reading progress is updatable by owner"
  on public.reading_progress for update
  using (auth.uid() = user_id);
