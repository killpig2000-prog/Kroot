-- The word bank becomes a hand-picked shortlist instead of "every word you
-- have ever studied", so a size limit can mean something.
--
--   vocabulary_progress.saved   the pick. Defaults to false, which also
--                               performs the reset the user asked for: every
--                               existing bank empties on release while the
--                               review history in the same row is untouched.
--   profiles.word_bank_slots    how many picks fit. 20 to start.
--   buy_word_bank_slots()       +10 slots for coins, mirroring
--                               buy_streak_freeze()'s shape.
--
-- Idempotent: safe to re-run.

alter table public.vocabulary_progress
  add column if not exists saved boolean not null default false;

-- The bank reads "my saved words" on every page load.
create index if not exists vocabulary_progress_saved_idx
  on public.vocabulary_progress (user_id) where saved;

alter table public.profiles
  add column if not exists word_bank_slots smallint not null default 20;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_word_bank_slots_range'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_word_bank_slots_range
      check (word_bank_slots between 20 and 60);
  end if;
end $$;

-- Buying capacity: +10 slots for 200 coins, up to 60. Server-side so the
-- price and the ceiling can't be argued with from the client.
create or replace function public.buy_word_bank_slots()
returns smallint
language plpgsql
security definer set search_path = public
as $$
declare
  v_price constant integer := 200;
  v_step  constant smallint := 10;
  v_max   constant smallint := 60;
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_profile from public.profiles where id = auth.uid() for update;

  if v_profile.word_bank_slots >= v_max then
    raise exception 'max slots';
  end if;
  -- Admins carry a sentinel coin balance; the check still holds for them.
  if v_profile.coins < v_price then
    raise exception 'not enough coins';
  end if;

  update public.profiles
    set coins = coins - v_price,
        word_bank_slots = least(word_bank_slots + v_step, v_max),
        updated_at = now()
  where id = auth.uid();

  return least(v_profile.word_bank_slots + v_step, v_max);
end;
$$;
