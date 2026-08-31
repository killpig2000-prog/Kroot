-- level_test_results has had no index but its uuid primary key since 0001, so
-- every read of it is a sequential scan of the whole table -- one that grows
-- by a row per placement test and per promotion attempt, for every user.
--
-- Four hot paths hit it, all filtering on user_id:
--
--   dashboard_snapshot()          count(*) where user_id = uid   -- every dashboard load
--   promotion-server.ts:49        order by created_at desc limit 5
--   getLastServedKeys (:109)      order by created_at desc limit 5
--   OnboardingFlow.tsx:160        limit 1, gating the whole onboarding redirect
--
-- (user_id, created_at desc) serves all four: the equality column leads, and
-- the three that sort read straight down the index instead of scanning and
-- sorting. This was the only genuine index gap found on a hot path.
--
-- Idempotent: IF NOT EXISTS, safe to re-run.

create index if not exists level_test_results_user_created_idx
  on public.level_test_results (user_id, created_at desc);
