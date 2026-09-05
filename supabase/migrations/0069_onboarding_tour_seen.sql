-- The first-visit dashboard walkthrough (OnboardingTour) used to gate purely
-- on a browser localStorage flag. That breaks the moment the browser storage
-- itself is unreliable — most visibly, a private/incognito window wipes it
-- the second it's closed, so a learner who finishes the tour in a normal
-- window sees it again from private mode, and again every time they reopen a
-- fresh private window. This column makes "seen" a real account fact:
-- server-side, checked (and set) on every device regardless of local
-- storage. localStorage stays as a same-session fast path; this is the
-- source of truth.
alter table public.profiles
  add column if not exists onboarding_tour_seen boolean not null default false;
