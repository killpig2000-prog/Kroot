-- Rollback of 0071's vocab Day bump (15 -> 20): now that /review can pay
-- its own coins on top (0072, 2/word), a Day and a review session are two
-- separate ways to earn from vocabulary in the same day, so the Day itself
-- goes back to the same flat 15 every other skill pays. The 5-Day/day cap
-- from 0070 is untouched (still excludes review, still 5 Days), so the Day
-- ceiling is 75/day again; review adds on top of that, uncapped by it.

drop function if exists public.award_xp(integer, text, text, smallint, public.cefr_level, integer);

create function public.award_xp(
  p_points integer,
  p_skill text default null,
  p_item_key text default null,
  p_score smallint default null,
  p_level public.cefr_level default null,
  p_review_count integer default null
)
returns table (
  new_xp integer,
  new_level integer,
  leveled_up boolean,
  coins_earned integer,
  points_awarded integer,
  already_earned boolean,
  coins_pending boolean
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp integer;
  v_current_level public.cefr_level;
  v_before integer;
  v_after integer;
  v_points integer;
  v_plus boolean;
  v_coins_reward integer := 0;
  v_activity_coins integer := 0;
  v_bonus_coins integer;
  v_is_review boolean;
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
  v_below_level boolean := false;
  v_vocab_paid_today integer;
  c_activity_bonus_coins constant integer := 15;
  c_review_coins_per_word constant integer := 2;
  c_proof_window constant interval := interval '2 minutes';
  c_min_score constant smallint := 60;
  c_below_level_xp_factor constant numeric := 0.2;
  c_vocab_daily_coin_cap constant integer := 5;
  c_leveled_skills constant text[] := array['vocabulary', 'writing', 'reading', 'listening', 'grammar'];
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_points is null or p_points < 1 or p_points > 100 then
    raise exception 'points out of range';
  end if;

  v_is_review := p_skill = 'vocabulary' and p_item_key = 'review';

  -- Flat 15 for everything now, including a vocab Day — review is the only
  -- item whose coins scale with how much was actually done.
  v_bonus_coins := case
    when v_is_review and p_review_count is not null
      then c_review_coins_per_word * greatest(1, p_review_count)
    else c_activity_bonus_coins
  end;

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

  select xp, (plus_until is not null and plus_until > now()), current_level
    into v_xp, v_plus, v_current_level
  from public.profiles where id = auth.uid() for update;

  if p_level is not null and p_skill = any (c_leveled_skills) then
    v_below_level := p_level < v_current_level;
  end if;

  if v_below_level and v_points > 0 then
    v_points := greatest(1, round(v_points * c_below_level_xp_factor));
  end if;

  v_base_points := v_points;
  if v_plus and extract(isodow from now()) in (6, 7) and v_points > 0 then
    v_points := round(v_points * 1.5);
  end if;

  v_before := public.level_from_xp(v_xp);
  v_xp := v_xp + v_points;
  v_after := public.level_from_xp(v_xp);

  if p_skill = 'vocabulary' and not v_is_review then
    select count(*) into v_vocab_paid_today
    from public.reward_grants
    where user_id = auth.uid()
      and skill = 'vocabulary'
      and item_key like ('%:' || to_char((now() at time zone 'utc')::date, 'YYYY-MM-DD'))
      and item_key not like 'review:%'
      and coins_awarded > 0;
  else
    v_vocab_paid_today := 0;
  end if;

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

  if v_has_recent_progress and v_score_ok and (v_first or v_topup)
     and not v_below_level
     and (p_skill <> 'vocabulary' or v_is_review or v_vocab_paid_today < c_vocab_daily_coin_cap)
  then
    if v_item_key is not null then
      v_activity_coins := v_bonus_coins;
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
