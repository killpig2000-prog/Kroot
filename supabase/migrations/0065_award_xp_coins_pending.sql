-- 0063's `already_earned` meant "this call paid nothing" — accurate, but the
-- result screen used it to decide whether to hint "score 60%+ for coins",
-- and that reads wrong on a second low-scoring attempt: XP was maxed out on
-- attempt one, so attempt two's `already_earned` comes back true even though
-- the coins were never paid and are still there to earn. The chapter looked
-- permanently done when it wasn't.
--
-- Adds `coins_pending`: true whenever this item's coins are still unpaid
-- after this call — independent of whether XP happened to be exhausted
-- already. The result screen should gate the hint on this, not on
-- already_earned (which stays as it was, and is still correct for the XP
-- side of the strip).
--
-- Idempotent: create or replace, safe to re-run.

drop function if exists public.award_xp(integer, text, text, smallint);

create function public.award_xp(
  p_points integer,
  p_skill text default null,
  p_item_key text default null,
  p_score smallint default null
)
returns table (
  new_xp integer,
  new_level integer,
  leveled_up boolean,
  coins_earned integer,
  points_awarded integer,
  already_earned boolean,
  -- True when this item's coins are still unpaid after this call — the
  -- learner can still earn them by scoring at least 60% on a future attempt.
  -- Independent of already_earned: XP can be exhausted while coins are
  -- still open, on a second low-scoring try.
  coins_pending boolean
)
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
  v_activity_coins integer := 0;
  v_milestone integer;
  v_has_recent_progress boolean := false;
  v_item_key text;
  v_inserted integer := 0;
  v_first boolean := true;
  v_topup boolean := false;
  v_prior_coins integer;
  v_prior_points integer;
  v_base_points integer;
  v_final_coins_awarded integer;
  v_score_ok boolean;
  v_already boolean := false;
  v_cap integer;
  c_activity_bonus_coins constant integer := 15;
  c_proof_window constant interval := interval '2 minutes';
  c_min_score constant smallint := 60;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_points is null or p_points < 1 or p_points > 100 then
    raise exception 'points out of range';
  end if;

  v_cap := case p_skill
    when 'reading' then 15
    when 'writing' then 15
    when 'listening' then 12
    when 'speaking' then 12
    when 'vocabulary' then 10
    when 'grammar' then 10
    when 'pronunciation' then 6
    when 'hangul' then 6
    when 'slang' then 4
    when 'quest' then 10
    else 15
  end;
  v_points := least(p_points, v_cap);

  v_item_key := case
    when p_item_key is null then null
    when p_skill = 'vocabulary'
      then p_item_key || ':' || to_char((now() at time zone 'utc')::date, 'YYYY-MM-DD')
    else p_item_key
  end;

  v_score_ok := p_score is null or p_score >= c_min_score;

  if v_item_key is not null then
    insert into public.reward_grants (user_id, skill, item_key, score)
    values (auth.uid(), p_skill, v_item_key, p_score)
    on conflict (user_id, skill, item_key) do nothing;
    get diagnostics v_inserted = row_count;
    v_first := v_inserted > 0;

    if not v_first then
      select rg.points_awarded, rg.coins_awarded into v_prior_points, v_prior_coins
      from public.reward_grants rg
      where rg.user_id = auth.uid() and rg.skill = p_skill and rg.item_key = v_item_key
      for update;

      v_points := greatest(0, least(v_points, v_cap - coalesce(v_prior_points, 0)));
      v_topup := coalesce(v_prior_coins, 0) = 0 and v_score_ok;
      v_already := v_points = 0 and not v_topup;
    end if;
  end if;

  select xp, (plus_until is not null and plus_until > now())
    into v_xp, v_plus
  from public.profiles where id = auth.uid() for update;

  v_base_points := v_points;
  if v_plus and extract(isodow from now()) in (6, 7) and v_points > 0 then
    v_points := round(v_points * 1.5);
  end if;

  v_before := public.level_from_xp(v_xp);
  v_xp := v_xp + v_points;
  v_after := public.level_from_xp(v_xp);

  if p_skill = 'vocabulary' then
    select exists(
      select 1 from public.vocabulary_progress
      where user_id = auth.uid() and (created_at > now() - c_proof_window or last_reviewed_at > now() - c_proof_window)
    ) into v_has_recent_progress;
  elsif p_skill = 'writing' then
    select exists(
      select 1 from public.writing_progress
      where user_id = auth.uid() and completed_at > now() - c_proof_window
    ) into v_has_recent_progress;
  elsif p_skill = 'reading' then
    select exists(
      select 1 from public.reading_progress
      where user_id = auth.uid() and (created_at > now() - c_proof_window or last_reviewed_at > now() - c_proof_window)
    ) into v_has_recent_progress;
  elsif p_skill = 'listening' then
    select exists(
      select 1 from public.listening_progress
      where user_id = auth.uid() and completed_at > now() - c_proof_window
    ) into v_has_recent_progress;
  elsif p_skill = 'grammar' then
    select exists(
      select 1 from public.grammar_progress
      where user_id = auth.uid() and completed_at > now() - c_proof_window
    ) into v_has_recent_progress;
  elsif p_skill = 'pronunciation' then
    select exists(
      select 1 from public.speaking_progress
      where user_id = auth.uid() and completed_at > now() - c_proof_window
    ) or exists(
      select 1 from public.challenge_progress
      where user_id = auth.uid() and updated_at > now() - c_proof_window
    ) into v_has_recent_progress;
  else
    v_has_recent_progress := false;
  end if;

  if v_has_recent_progress and v_score_ok and (v_first or v_topup) then
    if v_item_key is not null then
      v_activity_coins := c_activity_bonus_coins;
      v_coins_reward := v_activity_coins;
    end if;
  end if;

  v_milestone := 10;
  while v_milestone <= 50 loop
    if v_before < v_milestone and v_after >= v_milestone then
      v_coins_reward := v_coins_reward + 150;
    end if;
    v_milestone := v_milestone + 10;
  end loop;

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

  if v_item_key is not null then
    update public.reward_grants
      set points_awarded = public.reward_grants.points_awarded + v_base_points,
          coins_awarded = public.reward_grants.coins_awarded + v_activity_coins,
          score = greatest(coalesce(public.reward_grants.score, 0), coalesce(p_score, 0)),
          updated_at = now()
    where public.reward_grants.user_id = auth.uid()
      and public.reward_grants.skill = p_skill
      and public.reward_grants.item_key = v_item_key
    returning public.reward_grants.coins_awarded into v_final_coins_awarded;
  end if;

  if v_points > 0 then
    insert into public.xp_events (user_id, points, skill)
    values (auth.uid(), v_points, p_skill);
  end if;

  return query select
    v_xp, v_after, v_after > v_before, v_coins_reward, v_points, v_already,
    v_item_key is not null and coalesce(v_final_coins_awarded, 0) = 0;
end;
$$;
