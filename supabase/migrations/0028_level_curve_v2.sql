-- Level curve v2: fast early, open-ended late.
-- Mirrors src/lib/level.ts — change both together.
--
--   Lv 1-9   : 10 XP per level  (one chapter = one level-up)
--   Lv 10-19 : 15 XP
--   Lv 20-34 : 25 XP
--   Lv 35-49 : 40 XP            (fully grown at Lv.50 = 1,215 XP)
--   Lv 50+   : 80 + 4*(lv-50)   (tree only grows taller; Lv.120 display cap)
--
-- Existing XP is untouched; levels are recomputed on read, so no backfill.
-- award_xp() keeps calling level_from_xp() and needs no change.

create or replace function public.level_from_xp(p_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
  v_level integer := 1;
  v_cum integer := 0;
  v_need integer;
begin
  while v_level < 120 loop
    v_need := case
      when v_level < 10 then 10
      when v_level < 20 then 15
      when v_level < 35 then 25
      when v_level < 50 then 40
      else 80 + 4 * (v_level - 50)
    end;
    exit when p_xp < v_cum + v_need;
    v_cum := v_cum + v_need;
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;
