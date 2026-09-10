-- 0080 — Ranking by total XP (2026-09-10, user call: "누적 XP로 가고, 리그
-- 없이, 메이플처럼 당분간").
--
-- The board used to rank this week's XP inside league beds. Beds are off
-- (0069) and the player base is small, so the board is now everyone, by
-- lifetime XP — the same axis the tree grows on, so the tallest tree on the
-- podium really is the top gardener. This week's XP stays on each row as
-- the movement ("+217 this week") and keeps paying the Sunday coins
-- through the untouched weekly league functions.
--
-- Two read-only SECURITY DEFINER functions (profiles and attendance are
-- owner-only under RLS):
--   get_xp_ranking()          top 10 + the caller's ±3 neighbourhood
--   get_gardener_rings(uuid)  one gardener's last 12 weeks, one row per day
--                             that has anything — for the tree popup's rings.
-- Idempotent: create or replace, grants re-run cleanly.

create or replace function public.get_xp_ranking()
returns table (
  rank bigint,
  total_players bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  level integer,
  xp bigint,
  xp_week bigint,
  is_me boolean,
  costume_ids text[]
)
language sql
security definer set search_path = public
stable
as $$
  with base as (
    select p.id, p.display_name, p.avatar_url,
           public.level_from_xp(p.xp) as level,
           p.xp::bigint as xp,
           coalesce((select sum(e.points) from public.xp_events e
                      where e.user_id = p.id and e.created_at >= date_trunc('week', now())), 0)::bigint as xp_week
    from public.profiles p
    where p.xp > 0 or p.id = auth.uid()
  ),
  ranked as (
    select b.*,
           row_number() over (order by b.xp desc, b.display_name, b.id) as rnk,
           count(*) over () as total
    from base b
  ),
  my_rank as (
    select rnk from ranked where id = auth.uid()
  )
  select r.rnk as rank, r.total as total_players, r.id as user_id, r.display_name, r.avatar_url,
         r.level, r.xp, r.xp_week,
         r.id = auth.uid() as is_me,
         coalesce(
           (select array_agg(uc.costume_id) from public.user_costumes uc
             where uc.user_id = r.id and uc.equipped),
           '{}'
         ) as costume_ids
  from ranked r
  where r.rnk <= 10
     or r.rnk between coalesce((select rnk from my_rank), 0) - 3
                  and coalesce((select rnk from my_rank), 0) + 3
  order by r.rnk;
$$;

revoke all on function public.get_xp_ranking() from public;
grant execute on function public.get_xp_ranking() to authenticated;

create or replace function public.get_gardener_rings(p_user_id uuid)
returns table (
  day date,
  attended boolean,
  studied boolean,
  reviewed boolean,
  xp integer
)
language sql
security definer set search_path = public
stable
as $$
  with days as (
    select d::date as day
    from generate_series(current_date - 90, current_date, interval '1 day') d
  ),
  marks as (
    select d.day,
           exists (select 1 from public.attendance_days a
                    where a.user_id = p_user_id and a.day = d.day) as attended,
           exists (select 1 from public.daily_activity da
                    where da.user_id = p_user_id and da.activity_date = d.day and da.minutes > 0) as studied,
           exists (select 1 from public.vocabulary_progress vp
                    where vp.user_id = p_user_id and vp.last_reviewed_at::date = d.day) as reviewed,
           coalesce((select sum(e.points) from public.xp_events e
                      where e.user_id = p_user_id and e.created_at::date = d.day), 0)::int as xp
    from days d
  )
  select m.day, m.attended, m.studied, m.reviewed, m.xp
  from marks m
  where auth.uid() is not null
    and (m.attended or m.studied or m.reviewed or m.xp > 0)
  order by m.day;
$$;

revoke all on function public.get_gardener_rings(uuid) from public;
grant execute on function public.get_gardener_rings(uuid) to authenticated;
