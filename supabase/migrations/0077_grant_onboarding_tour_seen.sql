-- 0077: let a signed-in learner write their own profiles.onboarding_tour_seen.
--
-- 0013 revoked blanket UPDATE on profiles and re-granted it column by column.
-- 0069 added onboarding_tour_seen but never granted it, so every client-side
-- write from OnboardingTour has been failing with "permission denied for
-- column onboarding_tour_seen" since the day it shipped — silently, because
-- the call is fire-and-forget and Supabase returns { error } instead of
-- throwing. Net effect: the server-side seen flag never actually persists,
-- so the tour replays on any new device/private window/cleared storage,
-- defeating the whole point of 0069.
--
-- Idempotent: grant is a no-op when already held.

grant update (onboarding_tour_seen) on public.profiles to authenticated;
