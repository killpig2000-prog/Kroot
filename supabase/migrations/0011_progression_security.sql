-- Progression + security hardening:
--  * server-side costume catalog so prices/level gates can't be forged client-side
--  * SECURITY DEFINER RPCs for activity minutes, level progress, streaks, purchases
--  * column-level privileges so clients can no longer write coins/level/streak directly

-- ---------------------------------------------------------------------------
-- Costume catalog (mirror of src/lib/costumes.tsx; art stays in code)
-- ---------------------------------------------------------------------------
create table public.costume_catalog (
  id text primary key,
  price integer not null check (price >= 0),
  min_level public.cefr_level
);

insert into public.costume_catalog (id, price, min_level) values
  ('straw-hat', 40, null),
  ('beanie', 35, null),
  ('crown', 150, 'C1'),
  ('sprout-cap', 25, null),
  ('round-glasses', 30, null),
  ('sunglasses', 55, 'B1'),
  ('cozy-scarf', 35, null),
  ('bow-tie', 28, null);

alter table public.costume_catalog enable row level security;

create policy "Costume catalog is readable by everyone"
  on public.costume_catalog for select
  using (true);

-- ---------------------------------------------------------------------------
-- Lock down direct writes to gamification columns.
-- Clients keep UPDATE only on cosmetic profile fields; everything else goes
-- through the RPCs below. (RLS policies still apply on top of these grants.)
-- ---------------------------------------------------------------------------
revoke update on public.profiles from anon, authenticated;
grant update (display_name, native_language, avatar_url, theme)
  on public.profiles to authenticated;

-- daily_activity minutes now only move through log_activity().
revoke insert, update on public.daily_activity from anon, authenticated;

-- Costume purchases only through buy_costume(); equip toggling stays direct.
revoke insert on public.user_costumes from anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Add study minutes for today (atomic upsert, capped per call).
create function public.log_activity(p_minutes integer)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > 120 then
    raise exception 'minutes out of range';
  end if;

  insert into public.daily_activity (user_id, activity_date, minutes)
  values (auth.uid(), current_date, p_minutes)
  on conflict (user_id, activity_date)
  do update set minutes = least(public.daily_activity.minutes + excluded.minutes, 32767);
end;
$$;

-- Add level progress; rolls over into the next CEFR level at 100.
create function public.award_progress(p_points integer)
returns table (new_level public.cefr_level, new_progress smallint, leveled_up boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_level public.cefr_level;
  v_progress integer;
  v_next public.cefr_level;
  v_leveled boolean := false;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_points is null or p_points < 1 or p_points > 50 then
    raise exception 'points out of range';
  end if;

  select current_level, level_progress into v_level, v_progress
  from public.profiles where id = auth.uid() for update;

  v_progress := v_progress + p_points;

  while v_progress >= 100 loop
    v_next := case v_level
      when 'A1' then 'A2'::public.cefr_level
      when 'A2' then 'B1'::public.cefr_level
      when 'B1' then 'B2'::public.cefr_level
      when 'B2' then 'C1'::public.cefr_level
      when 'C1' then 'C2'::public.cefr_level
      else null
    end;
    if v_next is null then
      v_progress := 100; -- C2 caps out full
      exit;
    end if;
    v_level := v_next;
    v_progress := v_progress - 100;
    v_leveled := true;
  end loop;

  update public.profiles
  set current_level = v_level, level_progress = v_progress, updated_at = now()
  where id = auth.uid();

  return query select v_level, v_progress::smallint, v_leveled;
end;
$$;

-- Bump the daily streak (idempotent per day).
create function public.touch_streak()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_last date;
  v_streak integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select last_active_date, streak_days into v_last, v_streak
  from public.profiles where id = auth.uid() for update;

  if v_last = current_date then
    return v_streak;
  elsif v_last = current_date - 1 then
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  update public.profiles
  set streak_days = v_streak, last_active_date = current_date, updated_at = now()
  where id = auth.uid();

  return v_streak;
end;
$$;

-- Earn coins (quest rewards etc.), capped per call.
create function public.earn_coins(p_amount integer)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_coins integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_amount is null or p_amount < 1 or p_amount > 50 then
    raise exception 'amount out of range';
  end if;

  update public.profiles
  set coins = coins + p_amount, updated_at = now()
  where id = auth.uid()
  returning coins into v_coins;

  return v_coins;
end;
$$;

-- Atomic costume purchase with server-side price + level gate.
create function public.buy_costume(p_costume_id text)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_item public.costume_catalog%rowtype;
  v_profile public.profiles%rowtype;
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
  if v_item.min_level is not null and v_profile.current_level < v_item.min_level then
    raise exception 'level too low';
  end if;
  if v_profile.coins < v_item.price then
    raise exception 'not enough coins';
  end if;

  update public.profiles set coins = coins - v_item.price, updated_at = now()
  where id = auth.uid();

  insert into public.user_costumes (user_id, costume_id, slot, equipped)
  values (auth.uid(), p_costume_id,
          (select case when p_costume_id in ('round-glasses','sunglasses') then 'face'
                       when p_costume_id in ('cozy-scarf','bow-tie') then 'neck'
                       else 'hat' end),
          false);

  return v_profile.coins - v_item.price;
end;
$$;

-- Set level from a level test (requires a test result recorded in the last hour,
-- or resetting to A1).
create function public.apply_level_test(p_level public.cefr_level)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_level <> 'A1' and not exists (
    select 1 from public.level_test_results
    where user_id = auth.uid() and created_at > now() - interval '1 hour'
  ) then
    raise exception 'no recent level test';
  end if;

  update public.profiles
  set current_level = p_level, level_progress = 0, updated_at = now()
  where id = auth.uid();
end;
$$;
