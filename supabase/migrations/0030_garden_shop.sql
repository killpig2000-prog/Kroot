-- Garden Shop: new item slots around the tree (aura / sky / ground / friend),
-- player-level locks, limited-time windows, and level-up bonus coins.
-- Catalog display data (names, drawings, rarity) lives in src/lib/costumes.tsx;
-- this table only holds what buy_costume() must enforce.

alter table public.costume_catalog
  add column if not exists min_player_level integer,
  add column if not exists available_from date,
  add column if not exists available_until date;

-- Locks now use the numeric player level (same axis the tree grows on),
-- not the CEFR test grade.
update public.costume_catalog set min_player_level = 45, min_level = null where id = 'crown';
update public.costume_catalog set min_player_level = 20, min_level = null where id = 'sunglasses';

insert into public.costume_catalog (id, price, plus_only, slot, min_player_level, available_from, available_until) values
  ('tiger-hood',       110, false, 'hat',    null, null, null),
  ('sunbeams',          45, false, 'aura',   null, null, null),
  ('firefly-glow',      95, false, 'aura',   null, null, null),
  ('petal-drift',      110, false, 'aura',   null, null, null),
  ('starlight',        220, false, 'aura',   50,   null, null),
  ('rainbow-arc',      240, false, 'aura',   null, null, null),
  ('aurora-veil',      420, false, 'aura',   80,   null, '2026-09-07'),
  ('golden-halo-ring',   0, true,  'aura',   null, null, null),
  ('golden-hour',       50, false, 'sky',    null, null, null),
  ('moonlit-night',     90, false, 'sky',    null, null, null),
  ('first-snow',       100, false, 'sky',    null, '2026-12-01', '2027-02-28'),
  ('monsoon-rain',      85, false, 'sky',    null, null, null),
  ('dawn-mist',        190, false, 'sky',    null, null, null),
  ('hanji-sky',          0, true,  'sky',    null, null, null),
  ('wildflowers',       30, false, 'ground', null, null, null),
  ('pebble-path',       35, false, 'ground', null, null, null),
  ('mushroom-ring',     80, false, 'ground', null, null, null),
  ('little-pond',      180, false, 'ground', null, null, null),
  ('autumn-leaves',     85, false, 'ground', null, '2026-10-01', '2026-11-30'),
  ('stone-lantern',      0, true,  'ground', null, null, null),
  ('sparrow',           40, false, 'friend', null, null, null),
  ('squirrel',          95, false, 'friend', null, null, null),
  ('garden-cat',       120, false, 'friend', null, null, null),
  ('magpie',           200, false, 'friend', 30,   null, null),
  ('baby-owl',         230, false, 'friend', 60,   null, null),
  ('dokkaebi',           0, true,  'friend', null, null, null)
on conflict (id) do update
  set price = excluded.price, plus_only = excluded.plus_only, slot = excluded.slot,
      min_player_level = excluded.min_player_level,
      available_from = excluded.available_from, available_until = excluded.available_until;

-- buy_costume: player-level lock + limited-time window.
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

-- award_xp: +50 coins each time a player crosses Lv.10/20/30/40/50, so the
-- fast early curve feeds the shop. Same signature as 0024 (plus boost kept).
create or replace function public.award_xp(p_points integer, p_skill text default null)
returns table (new_xp integer, new_level integer, leveled_up boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp integer;
  v_before integer;
  v_after integer;
  v_points integer;
  v_plus boolean;
  v_bonus integer := 0;
  v_milestone integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_points is null or p_points < 1 or p_points > 100 then
    raise exception 'points out of range';
  end if;

  select xp, (plus_until is not null and plus_until > now())
    into v_xp, v_plus
  from public.profiles where id = auth.uid() for update;

  v_points := p_points;
  if v_plus and extract(isodow from now()) in (6, 7) then
    v_points := round(p_points * 1.5);
  end if;

  v_before := public.level_from_xp(v_xp);
  v_xp := v_xp + v_points;
  v_after := public.level_from_xp(v_xp);

  -- milestone bonus: every multiple of 10 up to 50 crossed by this award
  v_milestone := 10;
  while v_milestone <= 50 loop
    if v_before < v_milestone and v_after >= v_milestone then
      v_bonus := v_bonus + 50;
    end if;
    v_milestone := v_milestone + 10;
  end loop;

  update public.profiles
    set xp = v_xp, coins = coins + v_bonus, updated_at = now()
  where id = auth.uid();
  insert into public.xp_events (user_id, points, skill)
  values (auth.uid(), v_points, p_skill);

  return query select v_xp, v_after, v_after > v_before;
end;
$$;
