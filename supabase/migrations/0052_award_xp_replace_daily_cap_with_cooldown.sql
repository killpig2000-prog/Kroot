-- 0051's daily cap (20 coin-earning awards/day) was the wrong shape: it
-- punished exactly the learners it should reward. Clearing many real
-- chapters in one sitting — a genuinely dedicated day — hit the same ceiling
-- as a scripted loop, and stopped paying out partway through. The user's
-- own words: "챕터를 많이 깨면 코인은 계속 얻어야지" (clearing lots of
-- chapters should keep earning coins).
--
-- What actually needed stopping was calling the RPC faster than any real UI
-- action can — recordCompletion() runs after logActivity() and a Supabase
-- round trip, on the far side of the learner actually reading/answering
-- something, so two genuine awards are never milliseconds apart. A short
-- cooldown between award_xp calls throttles a tight script loop to a crawl
-- without a real learner ever noticing it exists, and unlike the daily count
-- it never runs out — clear a hundred chapters in one sitting and every one
-- still pays, as long as they arrive more than a few seconds apart, which
-- real study always does.
--
-- 5 seconds: comfortably below the pace of any real completion (reading a
-- passage, answering a quiz question, finishing a pronunciation rep all take
-- longer), and long enough that a rapid-fire loop earns at roughly 1/5th its
-- previous rate instead of instantly — buying out the shop moves from
-- "seconds" to "tens of minutes of continuous unattended looping", which is
-- also outside what this cosmetic-only currency needs to defend against
-- further than that.
--
-- Milestone bonuses are unaffected — they were already unfarmable (each pays
-- at most once per account, ever) and are not part of what this replaces.
--
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
  v_last_award_at timestamptz;
  c_activity_bonus_coins constant integer := 15;
  c_activity_bonus_cooldown constant interval := interval '5 seconds';
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

  -- Chapter completion bonus: +15 coins per activity, unless the previous
  -- award for this account landed inside the cooldown window.
  select max(created_at) into v_last_award_at
  from public.xp_events
  where user_id = auth.uid();

  if v_last_award_at is null or now() - v_last_award_at >= c_activity_bonus_cooldown then
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
