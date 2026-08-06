-- Spaced-repetition review: Leitner box + due date per learned word.
-- box 1-5 maps to review intervals of 1/3/7/16/35 days (src/lib/srs.ts).
-- Rows are owner-written like the rest of vocabulary_progress.

-- Idempotent: safe to re-run after a partial apply.
alter table public.vocabulary_progress
  add column if not exists box smallint not null default 1 check (box between 1 and 5),
  add column if not exists next_review_at timestamptz not null default now();

create index if not exists vocabulary_progress_due_idx
  on public.vocabulary_progress (user_id, next_review_at);
