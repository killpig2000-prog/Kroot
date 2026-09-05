-- Enforce the word-bank cap in the database, not just in the browser.
--
-- saveToBank() (src/lib/word-bank.ts) checked the cap by reading the count and
-- then writing — from the client, with the learner's own session. Two things
-- fell out of that:
--
--   1. Two fast taps, or two tabs, both read "19 of 20 used" and both wrote,
--      so the bank could pass its cap.
--   2. RLS lets a learner write their own vocabulary_progress rows, so
--      `insert ... saved: true` straight at the REST API skipped the check
--      entirely — and extra slots are a 200-coin purchase (SLOTS_PRICE), so
--      that is a paid limit given away.
--
-- A trigger closes both, whatever the write came through. The count only runs
-- when a row is actually *becoming* saved, so the common path (every "Got it"
-- upsert during a review) still doesn't pay for it.
--
-- The client-side check stays: it's what produces the friendly "your bank is
-- full, here's where to make room" card instead of a raw constraint error.
--
-- Idempotent: safe to re-run.

create or replace function public.enforce_word_bank_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slots smallint;
  v_used integer;
begin
  -- Only when the row is newly saved: an update that leaves `saved` alone (or
  -- clears it) can't push the bank over its cap.
  if new.saved is not true then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.saved is true then
    return new;
  end if;

  -- Serialize concurrent saves for this learner: the row lock makes the
  -- count-then-write below atomic per user, which is exactly what the
  -- client-side version couldn't do.
  select word_bank_slots into v_slots
  from public.profiles
  where id = new.user_id
  for update;

  if v_slots is null then
    v_slots := 20;
  end if;

  select count(*) into v_used
  from public.vocabulary_progress
  where user_id = new.user_id
    and saved is true
    and word_key <> new.word_key;

  if v_used >= v_slots then
    raise exception 'word bank full: % of % slots used', v_used, v_slots
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_word_bank_cap on public.vocabulary_progress;
create trigger enforce_word_bank_cap
  before insert or update on public.vocabulary_progress
  for each row
  execute function public.enforce_word_bank_cap();
