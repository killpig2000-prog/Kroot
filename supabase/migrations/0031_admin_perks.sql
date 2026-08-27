-- Admin account perks: unlimited coins + Kroot Plus, for the account used to
-- test and demo the app (same email admin/page.tsx already gates on).
-- Idempotent: safe to re-run any time.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

update public.profiles
  set is_admin = true,
      coins = 999999999,
      plus_until = '2099-12-31T00:00:00Z',
      updated_at = now()
  where id = (select id from auth.users where email = 'killpig2000@gmail.com');

-- buy_costume: admins skip every gate (coins, Plus, level, availability
-- window) and their balance never drains.
create or replace function public.buy_costume(p_costume_id text)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_item public.costume_catalog%rowtype;
  v_profile public.profiles%rowtype;
  v_today date := (now() at time zone 'utc')::date;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_item from public.costume_catalog where id = p_costume_id;
  if not found then
    raise exception 'unknown costume';
  end if;

  select * into v_profile from public.profiles where id = auth.uid() for update;

  if exists (select 1 from public.user_costumes where user_id = auth.uid() and costume_id = p_costume_id) then
    raise exception 'already owned';
  end if;

  if v_profile.is_admin then
    insert into public.user_costumes (user_id, costume_id, slot, equipped)
    values (auth.uid(), p_costume_id, coalesce(v_item.slot, 'hat'), false);
    return v_profile.coins;
  end if;

  if v_item.plus_only and (v_profile.plus_until is null or v_profile.plus_until < now()) then
    raise exception 'plus required';
  end if;
  if v_item.min_player_level is not null and public.level_from_xp(v_profile.xp) < v_item.min_player_level then
    raise exception 'level too low';
  end if;
  if v_item.min_level is not null and v_profile.current_level < v_item.min_level then
    raise exception 'level too low';
  end if;
  if (v_item.available_from is not null and v_today < v_item.available_from)
     or (v_item.available_until is not null and v_today > v_item.available_until) then
    raise exception 'not available';
  end if;
  if v_profile.coins < v_item.price then
    raise exception 'not enough coins';
  end if;

  update public.profiles set coins = coins - v_item.price, updated_at = now()
  where id = auth.uid();

  insert into public.user_costumes (user_id, costume_id, slot, equipped)
  values (auth.uid(), p_costume_id, coalesce(v_item.slot, 'hat'), false);

  return v_profile.coins - v_item.price;
end;
$$;
