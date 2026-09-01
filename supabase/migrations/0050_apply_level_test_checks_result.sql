-- apply_level_test() trusted its argument.
--
-- 0013 added the guard that made this function safe to expose, but it only
-- asked whether *some* level_test_results row existed for the caller in the
-- last hour:
--
--   if p_level <> 'A1' and not exists (
--     select 1 from public.level_test_results
--     where user_id = auth.uid() and created_at > now() - interval '1 hour'
--   ) then raise exception 'no recent level test'; end if;
--
-- and then wrote p_level into profiles.current_level verbatim, never comparing
-- it to the level that row actually recorded. So finishing the onboarding
-- placement test with any result — including A1 — and calling
-- `supabase.rpc("apply_level_test", { p_level: "C2" })` from the console within
-- the hour jumped the account to C2.
--
-- Self-inflicted only: it unlocks content for that learner and skews the level
-- distribution on the admin dashboard, but touches nobody else's data. Worth
-- closing anyway, because the level gate is what the promotion tests exist to
-- defend.
--
-- The check now requires a row whose result_level IS the requested level. Both
-- legitimate callers already satisfy that:
--
--   * OnboardingFlow.save() inserts result_level = p.level, then applies
--     p.level.
--   * TestRunner inserts result_level = verdict.passed ? spec.to : spec.from,
--     and calls apply only when verdict.passed — so the recorded level is
--     spec.to, which is what it applies.
--
-- The p_level = 'A1' escape hatch is kept: dropping back to the default costs a
-- learner nothing and a brand-new account has no test row yet.
--
-- Idempotent: create or replace, safe to re-run.

create or replace function public.apply_level_test(p_level public.cefr_level)
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
    where user_id = auth.uid()
      and created_at > now() - interval '1 hour'
      and result_level = p_level
  ) then
    raise exception 'no recent level test for %', p_level;
  end if;

  update public.profiles
  set current_level = p_level, level_progress = 0, updated_at = now()
  where id = auth.uid();
end;
$$;
