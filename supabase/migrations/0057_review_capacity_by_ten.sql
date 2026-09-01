-- User: buy_review_capacity() (0056) stepped by 5, one click at a time —
-- switched to a picker of 10-unit tiers (10/20/30/40 a day) so a learner can
-- jump straight to the tier they want in one purchase. Same 200-coins-per-10
-- rate as buy_word_bank_slots() (0039).
--
-- Idempotent: safe to re-run.

alter table public.profiles
  drop constraint if exists profiles_review_capacity_bonus_range;

alter table public.profiles
  add constraint profiles_review_capacity_bonus_range
  check (review_capacity_bonus between 0 and 30);

-- Buys straight up to p_target_bonus (10/20/30), charging the cumulative
-- price for every 10-block between the current bonus and the target so a
-- learner can jump tiers in one purchase, not one click per +5.
create or replace function public.buy_review_capacity(p_target_bonus smallint)
returns smallint
language plpgsql
security definer set search_path = public
as $$
declare
  v_price_per_step constant integer := 200;
  v_step  constant smallint := 10;
  v_max   constant smallint := 30;
  v_profile public.profiles%rowtype;
  v_price integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_target_bonus < 0 or p_target_bonus > v_max or p_target_bonus % v_step <> 0 then
    raise exception 'invalid target';
  end if;

  select * into v_profile from public.profiles where id = auth.uid() for update;

  if p_target_bonus <= v_profile.review_capacity_bonus then
    raise exception 'not an upgrade';
  end if;

  v_price := ((p_target_bonus - v_profile.review_capacity_bonus) / v_step) * v_price_per_step;
  if v_profile.coins < v_price then
    raise exception 'not enough coins';
  end if;

  update public.profiles
    set coins = coins - v_price,
        review_capacity_bonus = p_target_bonus,
        updated_at = now()
  where id = auth.uid();

  return p_target_bonus;
end;
$$;

-- Drop the old single-arg version — PostgREST would otherwise see two
-- overloads and refuse to pick one.
drop function if exists public.buy_review_capacity();
