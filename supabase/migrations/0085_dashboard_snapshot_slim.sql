-- dashboard_snapshot without the lists nothing reads any more.
--
-- 0041 returned every completed listening/reading/writing/speaking/grammar
-- key, all daily_activity rows and every vocabulary word_key on each Garden
-- load, for door gauges that were removed on 2026-09-10. The page reads
-- profile, extras, streak, costumes, quest, due_count and level_tests only.
--
-- due_count now counts the same queue as /review: a word bookmarked into the
-- word bank is planted with next_review_at = now() but is not due until it
-- has been answered at least once (ATTEMPTED_FILTER in src/lib/word-bank.ts).
-- The page counts this itself too; this keeps the RPC's fallback honest.
--
-- Same signature, SECURITY INVOKER, create or replace: safe to re-run. The
-- page tolerates both the old and the new shape.

create or replace function public.dashboard_snapshot(p_today date)
returns jsonb
language plpgsql
security invoker
as $$
declare
  uid uuid := auth.uid();
  v_streak integer;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  v_streak := public.touch_streak();

  return jsonb_build_object(
    'profile', (
      select to_jsonb(p) from (
        select display_name, current_level, xp, streak_days, last_active_date, avatar_url, created_at
        from public.profiles where id = uid
      ) p
    ),
    'extras', (
      select to_jsonb(e) from (
        select streak_freezes, reminder_push, reminder_email
        from public.profiles where id = uid
      ) e
    ),
    'streak', v_streak,
    'costumes', coalesce((
      select jsonb_agg(jsonb_build_object('costume_id', costume_id, 'equipped', equipped))
      from public.user_costumes where user_id = uid
    ), '[]'::jsonb),
    'quest', (
      select to_jsonb(q) from (
        select id, skill_key, title, description, completed_at
        from public.daily_quests where user_id = uid and quest_date = p_today
        limit 1
      ) q
    ),
    'due_count', (
      select count(*) from public.vocabulary_progress
      where user_id = uid
        and next_review_at <= now()
        and (correct_count > 0 or incorrect_count > 0)
    ),
    'level_tests', (
      select count(*) from public.level_test_results where user_id = uid
    )
  );
end;
$$;

grant execute on function public.dashboard_snapshot(date) to authenticated;
