-- Player level curve v4 (2026-09-12, user call): still max Lv.50 at about
-- 70% of one grade's content, but the climb bends at the fifth look instead
-- of at Lv.30 and Lv.40, and the elder tree moves from Lv.33 to Lv.38 so the
-- last two stretches take about as long as each other.
--
-- Per-level cost:
--   Lv.1-20   10 + 2*(lv-1)                 (10 … 48)
--   Lv.21-49  65 + (41*(lv-21) + 5) / 10    (65 … 180; integer division = 4.1 a level, rounded)
-- Lv.21 is 580 XP, Lv.38 is 2,243, Lv.50 is 4,131 (68-73% of any grade).
-- Mirror of xpForNext() in src/lib/level.ts — change both together.
--
-- Callers pick this up as with 0081 (award_xp, buy_costume, get_xp_ranking,
-- get_weekly_league). Levels are derived from xp; no xp or coins change.
--
-- Legendary gates follow the elder tree: 33 -> 38. Set by id, so re-running
-- is a no-op. Mirrors minPlayerLevel in src/lib/costumes.tsx.

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
  while v_level < 50 loop
    v_need := case
      when v_level < 21 then 10 + 2 * (v_level - 1)
      else 65 + (41 * (v_level - 21) + 5) / 10
    end;
    exit when p_xp < v_cum + v_need;
    v_cum := v_cum + v_need;
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;

update public.costume_catalog set min_player_level = 38
where id in ('aurora-veil', 'dokkaebi', 'golden-halo-ring', 'skin-scholar-painter');
