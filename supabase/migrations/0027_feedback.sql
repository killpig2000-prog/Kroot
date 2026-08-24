-- Feedback notes from the "we're early, tell us what's broken" popup and the
-- sidebar feedback link. Private by design: users can only see their own
-- submissions, nobody else's. Idempotent for partial-apply recovery.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  page text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_idx
  on public.feedback (user_id, created_at);

alter table public.feedback enable row level security;

drop policy if exists "Feedback is viewable by its author" on public.feedback;
create policy "Feedback is viewable by its author"
  on public.feedback for select
  using (auth.uid() = user_id);

drop policy if exists "Feedback is insertable by its author" on public.feedback;
create policy "Feedback is insertable by its author"
  on public.feedback for insert
  with check (auth.uid() = user_id);
