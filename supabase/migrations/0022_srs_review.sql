-- Spaced-repetition review: Leitner box + due date per learned word.
-- box 1-5 maps to review intervals of 1/3/7/16/35 days (src/lib/srs.ts).
-- Rows are owner-written like the rest of vocabulary_progress.

alter table public.vocabulary_progress
  add column box smallint not null default 1 check (box between 1 and 5),
  add column next_review_at timestamptz not null default now();

create index vocabulary_progress_due_idx
  on public.vocabulary_progress (user_id, next_review_at);
