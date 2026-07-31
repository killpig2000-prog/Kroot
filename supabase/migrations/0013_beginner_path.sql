-- Beginner Path: optional guided course for new learners.
-- Steps auto-check from existing progress tables where possible; the rest are
-- ticked manually into path_progress. The dashboard card can be hidden.

create table public.path_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  step_key text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, step_key)
);

alter table public.path_progress enable row level security;

create policy "Path progress is viewable by owner"
  on public.path_progress for select
  using (auth.uid() = user_id);

create policy "Path progress is insertable by owner"
  on public.path_progress for insert
  with check (auth.uid() = user_id);

create policy "Path progress is deletable by owner"
  on public.path_progress for delete
  using (auth.uid() = user_id);

-- Card dismissal flag; clients may update it directly (cosmetic preference).
alter table public.profiles add column path_hidden boolean not null default false;
grant update (path_hidden) on public.profiles to authenticated;
