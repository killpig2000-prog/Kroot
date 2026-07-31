-- League board scales to any player count: instead of a flat top-50, return
-- the top 10 plus a window of ±3 around the caller. The client draws a "…"
-- divider where ranks jump.

drop function public.get_weekly_league();

create function public.get_weekly_league()
returns table (
  rank bigint,
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
    select current_level from public.profiles where id = auth.uid()
  ),
  weekly as (
    select p.id, p.display_name, p.avatar_url, public.level_from_xp(p.xp) as level,
           coalesce(sum(e.points), 0) as xp_week
    from public.profiles p
    join me on p.current_level = me.current_level
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
  select r.rnk as rank, r.display_name, r.avatar_url, r.level, r.xp_week,
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
