-- One round trip for the dashboard. The page was issuing ~14 parallel REST
-- queries per view (profile ×2, costumes, quest, five progress tables, due
-- count, activity, level-test count, plus the touch_streak RPC); on the free
-- Nano instance the per-request overhead of those round trips is what caps
-- concurrent users. This function runs the same reads as one statement and
-- returns a single jsonb, touch_streak included.
--
-- SECURITY INVOKER on purpose: every table read goes through the caller's
-- RLS policies, so the function grants nothing the REST queries didn't.
-- touch_streak stays SECURITY DEFINER inside, exactly as when called alone.
--
-- Idempotent: create or replace, and safe to re-run.

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
    'listening', coalesce((
      select jsonb_agg(dialogue_id)
      from public.listening_progress where user_id = uid and completed_at is not null
    ), '[]'::jsonb),
    'reading', coalesce((
      select jsonb_agg(passage_key) from public.reading_progress where user_id = uid
    ), '[]'::jsonb),
    'writing', coalesce((
      select jsonb_agg(prompt_key) from public.writing_progress where user_id = uid
    ), '[]'::jsonb),
    'speaking', coalesce((
      select jsonb_agg(jsonb_build_object('prompt_key', prompt_key, 'best_score', best_score))
      from public.speaking_progress where user_id = uid
    ), '[]'::jsonb),
    'due_count', (
      select count(*) from public.vocabulary_progress
      where user_id = uid and next_review_at <= now()
    ),
    'activity', coalesce((
      select jsonb_agg(jsonb_build_object('activity_date', activity_date, 'minutes', minutes))
      from public.daily_activity where user_id = uid
    ), '[]'::jsonb),
    'level_tests', (
      select count(*) from public.level_test_results where user_id = uid
    ),
    'grammar', coalesce((
      select jsonb_agg(lesson_key) from public.grammar_progress where user_id = uid
    ), '[]'::jsonb),
    'vocab_keys', coalesce((
      select jsonb_agg(word_key) from public.vocabulary_progress where user_id = uid
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.dashboard_snapshot(date) to authenticated;
