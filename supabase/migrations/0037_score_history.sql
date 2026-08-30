-- Listening and Writing already compute a score at the end of a session but
-- threw it away — listening_progress only stored "completed", writing_progress
-- only the submitted text. Both are needed for the accuracy stats on the
-- account page, where those two skills were the only ones that could not be
-- scored. Idempotent: safe to re-run.

-- One clip carries at most one comprehension question; null means the clip
-- had no quiz, or it was finished before this column existed.
alter table public.listening_progress
  add column if not exists quiz_correct boolean;

-- The AI grader's per-prompt score (0-100). Null for prompts submitted before
-- this column existed, or when grading was unavailable/rate-limited.
alter table public.writing_progress
  add column if not exists score smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'writing_progress_score_range'
      and conrelid = 'public.writing_progress'::regclass
  ) then
    alter table public.writing_progress
      add constraint writing_progress_score_range check (score is null or score between 0 and 100);
  end if;
end $$;
