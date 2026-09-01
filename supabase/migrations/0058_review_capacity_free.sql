-- User decided against coins for this after all ("드롭다운에서 무료로 선택") —
-- the daily review cap becomes a free preference, not a purchase. Replaces
-- buy_review_capacity(target_bonus) (0057) with a free setter of the same
-- shape; profiles.review_capacity_bonus and its 0-30 range check are unchanged.
--
-- Idempotent: safe to re-run.

create or replace function public.set_review_capacity(p_target_bonus smallint)
returns smallint
language plpgsql
security definer set search_path = public
as $$
declare
  v_step constant smallint := 10;
  v_max  constant smallint := 30;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_target_bonus < 0 or p_target_bonus > v_max or p_target_bonus % v_step <> 0 then
    raise exception 'invalid target';
  end if;

  update public.profiles
    set review_capacity_bonus = p_target_bonus,
        updated_at = now()
  where id = auth.uid();

  return p_target_bonus;
end;
$$;

drop function if exists public.buy_review_capacity(smallint);
