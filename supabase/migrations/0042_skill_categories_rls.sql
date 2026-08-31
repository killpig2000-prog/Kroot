-- skill_categories was the only table in the schema left without RLS
-- (0001_init.sql:74). With Supabase's default grants on `public`, that leaves
-- it reachable by any anon/authenticated caller through PostgREST. It's a
-- read-only lookup table (skill keys and labels) that the app reads, so the
-- fix is: RLS on, one read policy for everyone, no write policy at all.
-- Idempotent — safe to re-run.
alter table public.skill_categories enable row level security;

drop policy if exists "Skill categories are readable by everyone" on public.skill_categories;

create policy "Skill categories are readable by everyone"
  on public.skill_categories for select
  to anon, authenticated
  using (true);
