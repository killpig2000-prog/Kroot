-- League rows carry each player's tree character: their equipped costume ids
-- join the ranking payload so the board can render everyone's creature.
-- (user_costumes RLS stays owner-only; this definer function is the only
-- cross-user window, and it exposes nothing but equipped cosmetic ids.)

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
  )
  select row_number() over (order by w.xp_week desc, w.display_name) as rank,
         w.display_name, w.avatar_url, w.level, w.xp_week,
         w.id = auth.uid() as is_me,
         coalesce(
           (select array_agg(uc.costume_id) from public.user_costumes uc
             where uc.user_id = w.id and uc.equipped),
           '{}'
         ) as costume_ids
  from weekly w
  where w.xp_week > 0 or w.id = auth.uid()
  order by rank
  limit 50;
$$;
