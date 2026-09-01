-- Tie the activity coin bonus to actual completion, not to the bare RPC call.
--
-- User's instruction, across several messages: coins should keep coming for
-- real chapter clearing with no daily ceiling (0053 already restored
-- unconditional payment), but calling the RPC without ever finishing
-- anything shouldn't pay out at all ("당연히 챕터 클리어를 해야지 코인을
-- 줘야지") — and for slang/hangul specifically, only when the quiz is
-- actually solved ("슬랭한글은 퀴즈를 풀떄만줘").
--
-- Every real completion flow already writes to a per-skill progress table
-- BEFORE calling award_xp — VocabSession/ReviewSession upsert
-- vocabulary_progress, WritingSession upserts writing_progress,
-- ReadingSession upserts reading_progress, ListeningSession upserts
-- listening_progress, GrammarQuiz upserts grammar_progress,
-- PronunciationChallenge/ChallengePlay write speaking_progress /
-- challenge_progress. So "a matching progress row was touched moments ago"
-- is a real signal the client can't get without actually running that
-- component's completion path, unlike award_xp itself which is a bare
-- RPC with no such constraint.
--
-- This is a meaningful bar-raise, not a cryptographic guarantee: someone
-- determined could still fabricate a progress-table row by hand before
-- looping award_xp, since those tables only check row ownership, not answer
-- correctness. Closing that fully would mean verifying answers server-side,
-- which is a much larger change. What this stops is the trivial case —
-- calling award_xp in a loop with nothing else — which is what was actually
-- reachable from a console with zero effort.
--
-- slang and hangul have no server-side progress table at all (slang's
-- "finished today" state lives in localStorage only; hangul never calls
-- award_xp today). There is nothing to check them against, so they get no
-- coin bonus under this scheme — closer to the user's explicit fallback
-- ("슬랭 한글은 안줘야지") than to silently trusting the client. Giving slang
-- a real per-quiz coin bonus again would need a small dedicated table to
-- record a completed quiz server-side; flagged as follow-up, not done here.
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
  v_has_recent_progress boolean := false;
  c_activity_bonus_coins constant integer := 15;
  -- Generous enough to survive real network/render latency between the
  -- progress-table write and this call, tight enough that it can't be
  -- satisfied by a stale row from an earlier, unrelated session.
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

  -- Chapter completion bonus: +15 coins, only when the matching progress
  -- table shows this account actually finished something moments ago.
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
    -- slang, hangul, quest, and anything else with no server-recorded
    -- progress table: no bonus. XP itself is unaffected either way.
    v_has_recent_progress := false;
  end if;

  if v_has_recent_progress then
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
