-- award_xp() paid 15 coins on every call, with nothing limiting how often it
-- could be called.
--
-- The only guard is `p_points between 1 and 100`, and the RPC is reachable
-- from any signed-in browser session, so a loop of
-- `rpc("award_xp", { p_points: 1 })` minted 15 coins per iteration and bought
-- out the costume shop in seconds. Coins buy cosmetics only, so this is
-- progression integrity rather than money — but the shop is most of the
-- reward loop, and an unbounded mint empties it of meaning.
--
-- The activity bonus is now paid for the first ACTIVITY_BONUS_PER_DAY awards
-- of each UTC day and is zero after that. xp_events already records every
-- award with a timestamp, so the count comes from data we keep anyway — no new
-- table, no new column. The insert into xp_events happens after this check, so
-- the count is genuinely "awards already made today".
--
-- 20 is far above real use. XP_POINTS in src/lib/activity.ts tops out at 15 per
-- activity and its comment tunes the curve for "~2-3 activities a day", so 20
-- is roughly a 7-10x headroom over the design target; a learner would have to
-- finish twenty separate sessions in one day to notice a ceiling exists.
--
-- Milestone bonuses are deliberately left uncapped. They only pay when a level
-- boundary is crossed, and XP never decreases, so each one can pay at most once
-- per account for the life of that account — they are not farmable by repetition
-- the way the flat per-activity bonus was.
--
-- Deliberately NOT changed here: award_xp still grants XP on every call, so a
-- determined user can still inflate their own XP and level. Capping that would
-- risk silently refusing a legitimate heavy session — the exact silent-failure
-- shape that made 0039's breakage invisible for a day — and the consequence is
-- self-inflicted (a taller tree, a wrong number on the admin dashboard) rather
-- than a drain on a shared resource. With this change, total coins an account
-- can mint go from unbounded to bounded: 300/day from activity plus the fixed
-- one-time milestone ladder.
--
-- Everything else is 0045 verbatim.
-- Idempotent: create or replace, safe to re-run.

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
  v_coins_reward integer := 0;
  v_milestone integer;
  v_awards_today integer;
  c_activity_bonus_per_day constant integer := 20;
  c_activity_bonus_coins constant integer := 15;
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

  -- Chapter completion bonus: +15 coins per activity, for the first
  -- c_activity_bonus_per_day awards of the day. Counted before this call's own
  -- xp_events row is inserted below.
  select count(*) into v_awards_today
  from public.xp_events
  where user_id = auth.uid()
    and created_at >= (now() at time zone 'utc')::date;

  if v_awards_today < c_activity_bonus_per_day then
    v_coins_reward := c_activity_bonus_coins;
  end if;

  -- Milestone bonus: +150 for levels 10-50, +200 for levels 60+
  v_milestone := 10;
  while v_milestone <= 50 loop
    if v_before < v_milestone and v_after >= v_milestone then
      v_coins_reward := v_coins_reward + 150;
    end if;
    v_milestone := v_milestone + 10;
  end loop;

  -- Higher rewards for endgame (Lv.60+)
  v_milestone := 60;
  while v_milestone <= 120 loop
    if v_before < v_milestone and v_after >= v_milestone then
      v_coins_reward := v_coins_reward + 200;
    end if;
    v_milestone := v_milestone + 10;
  end loop;

  update public.profiles
    set xp = v_xp, coins = coins + v_coins_reward, updated_at = now()
  where id = auth.uid();
  insert into public.xp_events (user_id, points, skill)
  values (auth.uid(), v_points, p_skill);

  return query select v_xp, v_after, v_after > v_before;
end;
$$;
