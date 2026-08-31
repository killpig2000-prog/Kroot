-- 0048: let a signed-in learner write their own profiles.goal.
--
-- 0013 revoked blanket UPDATE on profiles and re-granted it column by column,
-- so coins/xp/current_level/is_admin can only move through the SECURITY
-- DEFINER RPCs. That is working as intended — but it also means a column
-- added later is denied until it is named here, and 0036 added `goal` without
-- doing so.
--
-- Effect until now: magic-link sign-ups were fine, because handle_new_user()
-- writes the goal out of the sign-up metadata and runs as definer. A learner
-- who arrived through Google OAuth has no goal in that metadata, so
-- OnboardingFlow's fallback UPDATE was the only path — and it was failing with
-- "permission denied for table profiles", losing the answer silently.
--
-- Idempotent: grant is a no-op when already held.

grant update (goal) on public.profiles to authenticated;
