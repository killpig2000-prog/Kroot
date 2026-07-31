-- Numeric level system (Lv.1-30) driven by XP.
-- CEFR (current_level) stays as the content-difficulty preference; the tree,
-- rewards, and rankings now key off XP instead.

alter table public.profiles
  add column xp integer not null default 0 check (xp >= 0);

-- XP needed to *reach* a level: sum of (50 + 10n) for n = 1..L-1, capped at 30.
create function public.level_from_xp(p_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
  v_level integer := 1;
begin
  while v_level < 30 and p_xp >= (v_level) * (50 + 5 * (v_level + 1)) loop
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;

-- Earn XP (server-validated, capped per call). Returns the new totals.
create function public.award_xp(p_points integer)
returns table (new_xp integer, new_level integer, leveled_up boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp integer;
  v_before integer;
  v_after integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_points is null or p_points < 1 or p_points > 100 then
    raise exception 'points out of range';
  end if;

  select xp into v_xp from public.profiles where id = auth.uid() for update;
  v_before := public.level_from_xp(v_xp);
  v_xp := v_xp + p_points;
  v_after := public.level_from_xp(v_xp);

  update public.profiles set xp = v_xp, updated_at = now() where id = auth.uid();

  return query select v_xp, v_after, v_after > v_before;
end;
$$;
