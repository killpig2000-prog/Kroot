-- Kroot Plus perks that live in the database. Idempotent for
-- partial-apply recovery. Four pieces:
--  * Streak shield: Plus members' streaks survive one missed day.
--  * Weekend XP boost: Plus members earn 1.5x XP on Saturday/Sunday (UTC),
--    applied inside award_xp so clients can't fake it.
--  * xp_events.skill: per-skill XP log so the Plus insights page can break
--    study down by skill (old rows stay null).
--  * author_plus on community posts/comments: denormalized at insert by a
--    trigger (profiles RLS is owner-only, so readers can't join to it).
--  * New Plus-only costumes + costume_catalog.slot, so buy_costume no longer
--    hardcodes id lists.

-- ---------------------------------------------------------------------------
-- Streak shield
-- ---------------------------------------------------------------------------
create or replace function public.touch_streak()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_last date;
  v_streak integer;
  v_plus boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select last_active_date, streak_days,
         (plus_until is not null and plus_until > now())
    into v_last, v_streak, v_plus
  from public.profiles where id = auth.uid() for update;

  if v_last = current_date then
    return v_streak;
  elsif v_last = current_date - 1 then
    v_streak := v_streak + 1;
  elsif v_plus and v_last = current_date - 2 then
    -- Plus streak shield: one missed day doesn't break the run.
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  update public.profiles
  set streak_days = v_streak, last_active_date = current_date, updated_at = now()
  where id = auth.uid();

  return v_streak;
end;
$$;

-- ---------------------------------------------------------------------------
-- Weekend XP boost + per-skill XP log
-- ---------------------------------------------------------------------------
alter table public.xp_events add column if not exists skill text;

-- Boosted awards can exceed the old 100-point ceiling (100 * 1.5 = 150).
alter table public.xp_events drop constraint if exists xp_events_points_check;
alter table public.xp_events add constraint xp_events_points_check
  check (points between 1 and 200);

-- Drop the old 1-arg signature first: PostgREST can't disambiguate overloads.
-- The new default keeps already-deployed clients (no p_skill) working.
drop function if exists public.award_xp(integer);
create or replace function public.award_xp(p_points integer, p_skill text default null)
returns table (new_xp integer, new_level integer, leveled_up boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp integer;
  v_before integer;
  v_after integer;
  v_points integer;
  v_plus boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_points is null or p_points < 1 or p_points > 100 then
    raise exception 'points out of range';
  end if;

  select xp, (plus_until is not null and plus_until > now())
    into v_xp, v_plus
  from public.profiles where id = auth.uid() for update;

  v_points := p_points;
  -- Plus weekend boost: 1.5x on Saturday/Sunday (UTC).
  if v_plus and extract(isodow from now()) in (6, 7) then
    v_points := round(p_points * 1.5);
  end if;

  v_before := public.level_from_xp(v_xp);
  v_xp := v_xp + v_points;
  v_after := public.level_from_xp(v_xp);

  update public.profiles set xp = v_xp, updated_at = now() where id = auth.uid();
  insert into public.xp_events (user_id, points, skill)
  values (auth.uid(), v_points, p_skill);

  return query select v_xp, v_after, v_after > v_before;
end;
$$;

-- ---------------------------------------------------------------------------
-- AI grading quota (free plan: N gradings per UTC day; Plus unlimited)
-- ---------------------------------------------------------------------------
-- One row per grading. The API route counts today's rows before calling the
-- grader; inserting extra rows only shrinks your own quota, so an owner
-- insert policy is safe. No update/delete policies.
create table if not exists public.ai_grade_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ai_grade_log_user_day_idx
  on public.ai_grade_log (user_id, created_at);

alter table public.ai_grade_log enable row level security;

drop policy if exists "AI grade log is viewable by owner" on public.ai_grade_log;
create policy "AI grade log is viewable by owner"
  on public.ai_grade_log for select
  using (auth.uid() = user_id);

drop policy if exists "AI grade log is insertable by owner" on public.ai_grade_log;
create policy "AI grade log is insertable by owner"
  on public.ai_grade_log for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Golden author badge in the community
-- ---------------------------------------------------------------------------
alter table public.community_posts add column if not exists author_plus boolean not null default false;
alter table public.community_comments add column if not exists author_plus boolean not null default false;

-- Set authoritatively from profiles at insert time — the client payload is
-- ignored, so nobody can self-award the golden name.
create or replace function public.set_author_plus()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  select coalesce(plus_until is not null and plus_until > now(), false)
    into new.author_plus
  from public.profiles where id = new.user_id;
  new.author_plus := coalesce(new.author_plus, false);
  return new;
end;
$$;

drop trigger if exists community_posts_set_author_plus on public.community_posts;
create trigger community_posts_set_author_plus
  before insert on public.community_posts
  for each row execute function public.set_author_plus();

drop trigger if exists community_comments_set_author_plus on public.community_comments;
create trigger community_comments_set_author_plus
  before insert on public.community_comments
  for each row execute function public.set_author_plus();

-- ---------------------------------------------------------------------------
-- New Plus costumes + catalog-driven slots
-- ---------------------------------------------------------------------------
alter table public.costume_catalog add column if not exists slot text;

update public.costume_catalog set slot = case
    when id in ('round-glasses','sunglasses','star-glasses') then 'face'
    when id in ('cozy-scarf','bow-tie','golden-scarf') then 'neck'
    else 'hat'
  end
where slot is null;

insert into public.costume_catalog (id, price, min_level, plus_only, slot) values
  ('blossom-crown', 0, null, true, 'hat'),
  ('seonbi-gat', 0, null, true, 'hat'),
  ('moon-spectacles', 0, null, true, 'face'),
  ('cherry-blush', 0, null, true, 'face'),
  ('hanbok-ribbon', 0, null, true, 'neck'),
  ('maple-garland', 0, null, true, 'neck')
on conflict (id) do update
  set plus_only = excluded.plus_only, price = excluded.price, slot = excluded.slot;

-- buy_costume now reads the slot from the catalog instead of hardcoded lists.
create or replace function public.buy_costume(p_costume_id text)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_item public.costume_catalog%rowtype;
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_item from public.costume_catalog where id = p_costume_id;
  if not found then
    raise exception 'unknown costume';
  end if;

  select * into v_profile from public.profiles where id = auth.uid() for update;

  if exists (select 1 from public.user_costumes where user_id = auth.uid() and costume_id = p_costume_id) then
    raise exception 'already owned';
  end if;
  if v_item.plus_only and (v_profile.plus_until is null or v_profile.plus_until < now()) then
    raise exception 'plus required';
  end if;
  if v_item.min_level is not null and v_profile.current_level < v_item.min_level then
    raise exception 'level too low';
  end if;
  if v_profile.coins < v_item.price then
    raise exception 'not enough coins';
  end if;

  update public.profiles set coins = coins - v_item.price, updated_at = now()
  where id = auth.uid();

  insert into public.user_costumes (user_id, costume_id, slot, equipped)
  values (auth.uid(), p_costume_id, coalesce(v_item.slot, 'hat'), false);

  return v_profile.coins - v_item.price;
end;
$$;
