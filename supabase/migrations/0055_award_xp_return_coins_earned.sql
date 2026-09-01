-- Expose how many coins this call actually granted, so the client can show
-- a small "+N 🪙" next to the existing level-up line on a chapter's result
-- screen — right now the coin count changes silently in the sidebar and
-- nothing on the completion screen itself says a coin was earned at all.
--
-- Purely additive to the return shape: adds coins_earned to the result row.
-- v_coins_reward already existed and was already computed; this just returns
-- it instead of discarding it after the UPDATE. No change to when or how
-- much is awarded (that's 0053 + 0054's job).
--
-- Adding an output column changes the function's result row type, which
-- Postgres refuses under CREATE OR REPLACE ("cannot change return type of
-- existing function") — so this drops it first. Idempotent: safe to re-run.

drop function if exists public.award_xp(integer, text);

create function public.award_xp(p_points integer, p_skill text default null)
returns table (new_xp integer, new_level integer, leveled_up boolean, coins_earned integer)
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
  v_has_recent_progress boolean := false;
  c_activity_bonus_coins constant integer := 15;
  c_proof_window constant interval := interval '2 minutes';
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

  if p_skill = 'vocabulary' then
    select exists(
      select 1 from public.vocabulary_progress
      where user_id = auth.uid() and created_at > now() - c_proof_window
    ) into v_has_recent_progress;
  elsif p_skill = 'writing' then
    select exists(
      select 1 from public.writing_progress
      where user_id = auth.uid() and completed_at > now() - c_proof_window
    ) into v_has_recent_progress;
  elsif p_skill = 'reading' then
    select exists(
      select 1 from public.reading_progress
      where user_id = auth.uid() and created_at > now() - c_proof_window
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

  if v_has_recent_progress then
    v_coins_reward := c_activity_bonus_coins;
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
  insert into public.xp_events (user_id, points, skill)
  values (auth.uid(), v_points, p_skill);

  return query select v_xp, v_after, v_after > v_before, v_coins_reward;
end;
$$;
