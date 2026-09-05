-- The ranking's tap-to-peek card shows a gardener's recent study garden
-- (the last five weeks of daily minutes) instead of only their keepsakes.
-- Two things make that possible:
--
--   1. get_weekly_league() now returns user_id, so the client can ask about
--      the person it tapped. (Return-type change, so drop + create rather
--      than create or replace; the body is otherwise identical to 0026.)
--   2. get_public_activity(p_user) returns that person's daily minutes for
--      the last 35 days. daily_activity is owner-only under RLS; this
--      SECURITY DEFINER function is the one deliberate window into it, and
--      it exposes nothing but (date, minutes) — no scores, no content — for
--      an authenticated caller, about any account. That is the same
--      publicity the weekly XP on the board already has.
--
-- Idempotent: drop if exists / create or replace; re-running is a no-op.

drop function if exists public.get_weekly_league();
create function public.get_weekly_league()
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  level integer,
  xp_week bigint,
  is_me boolean,
  costume_ids text[]
)
language sql
security definer set search_path = public
stable
as $$
  with me as (
    select league_tier from public.profiles where id = auth.uid()
  ),
  weekly as (
    select p.id, p.display_name, p.avatar_url, public.level_from_xp(p.xp) as level,
           coalesce(sum(e.points), 0) as xp_week
    from public.profiles p
    join me on p.league_tier = me.league_tier
    left join public.xp_events e
      on e.user_id = p.id and e.created_at >= date_trunc('week', now())
    group by p.id, p.display_name, p.avatar_url, p.xp
  ),
  ranked as (
    select w.*, row_number() over (order by w.xp_week desc, w.display_name) as rnk
    from weekly w
    where w.xp_week > 0 or w.id = auth.uid()
  ),
  my_rank as (
    select rnk from ranked where id = auth.uid()
  )
  select r.rnk as rank, r.id as user_id, r.display_name, r.avatar_url, r.level, r.xp_week,
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
grant execute on function public.get_weekly_league() to authenticated;

create or replace function public.get_public_activity(p_user uuid)
returns table (activity_date date, minutes integer)
language sql
security definer set search_path = public
stable
as $$
  select d.activity_date, d.minutes::integer
  from public.daily_activity d
  where auth.uid() is not null
    and d.user_id = p_user
    and d.activity_date >= (current_date - 34)
  order by d.activity_date;
$$;
revoke all on function public.get_public_activity(uuid) from public;
grant execute on function public.get_public_activity(uuid) to authenticated;
