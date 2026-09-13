-- The community board left the app on 2026-09-13 (ca1ea1e: routes, nav,
-- report/block UI all removed); the owner asked for its tables to go too.
-- Destructive — posts, comments, reports and blocks are deleted for good.
-- Idempotent: re-running is a no-op. Policies, indexes, foreign keys and the
-- author_plus triggers go with their tables (cascade); the trigger function
-- from 0024 has no other caller.

drop table if exists public.community_reports cascade;
drop table if exists public.user_blocks cascade;
drop table if exists public.community_comments cascade;
drop table if exists public.community_posts cascade;
drop function if exists public.set_author_plus();

-- Expect [] — nothing left.
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('community_posts', 'community_comments', 'community_reports', 'user_blocks')
union all
select routine_name from information_schema.routines
where routine_schema = 'public' and routine_name = 'set_author_plus';
