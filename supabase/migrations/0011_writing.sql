-- Writing ("Ink Spring" 잉크 샘): prompts are a hardcoded TS data file
-- (src/lib/writing-data/*). No auto-grading — a submission just marks the
-- chapter done and stores what the learner wrote, for their own reference.

create table public.writing_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  prompt_key text not null,
  response_text text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, prompt_key)
);

alter table public.writing_progress enable row level security;

create policy "Writing progress is viewable by owner"
  on public.writing_progress for select
  using (auth.uid() = user_id);

create policy "Writing progress is insertable by owner"
  on public.writing_progress for insert
  with check (auth.uid() = user_id);

create policy "Writing progress is updatable by owner"
  on public.writing_progress for update
  using (auth.uid() = user_id);
