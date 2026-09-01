-- Lets a learner buy past the flat 10-word daily review cap ([[review daily
-- cap]], review/page.tsx's doneForToday), +5 at a time. Mirrors
-- buy_word_bank_slots() (0039) exactly, at the same 20-coins-per-slot rate.
--
-- Idempotent: safe to re-run.

alter table public.profiles
  add column if not exists review_capacity_bonus smallint not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_review_capacity_bonus_range'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_review_capacity_bonus_range
      check (review_capacity_bonus between 0 and 20);
  end if;
end $$;

-- Buying capacity: +5 daily review slots for 100 coins, up to +20 (30/day
-- total on top of the base 10). Server-side so the price and ceiling can't
-- be argued with from the client.
create or replace function public.buy_review_capacity()
returns smallint
language plpgsql
security definer set search_path = public
as $$
declare
  v_price constant integer := 100;
  v_step  constant smallint := 5;
  v_max   constant smallint := 20;
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_profile from public.profiles where id = auth.uid() for update;

  if v_profile.review_capacity_bonus >= v_max then
    raise exception 'max capacity';
  end if;
  if v_profile.coins < v_price then
    raise exception 'not enough coins';
  end if;

  update public.profiles
    set coins = coins - v_price,
        review_capacity_bonus = least(review_capacity_bonus + v_step, v_max),
        updated_at = now()
  where id = auth.uid();

  return least(v_profile.review_capacity_bonus + v_step, v_max);
end;
$$;
