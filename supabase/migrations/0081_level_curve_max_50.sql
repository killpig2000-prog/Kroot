-- Player level curve v3: max Lv.50, and Lv.50 costs about 70% of one grade's
-- content (2026-09-12, user call).
--
-- A grade is ~5,700-6,100 XP of content (160 reading passages, 52 writing
-- chapters, 160 listening dialogues, its grammar and vocab Days). Lv.50 is
-- 4,144 XP — 68-73% of any grade. Per-level cost:
--   Lv.1-29   8 + 2*(lv-1)      (8 … 64)
--   Lv.30-39  85 + 5*(lv-30)    (85 … 130)  — clearly harder from 30
--   Lv.40-49  180 + 5*(lv-40)   (180 … 225) — harder again from 40
-- Mirror of xpForNext() in src/lib/level.ts — change both together.
--
-- Every caller picks this up: award_xp (level-ups and the 150-coin bonus at
-- Lv.10/20/30/40/50 — its 60..120 loop can no longer fire and is left as is),
-- buy_costume (min_player_level gates), get_xp_ranking, get_weekly_league.
-- Levels are derived from xp, so existing accounts re-level on the next read;
-- no xp or coins change.
--
-- Shop gates move to the oak's looks: Rare -> Lv.13 (sturdy tree),
-- Epic -> Lv.21 (grown tree), Legendary -> Lv.33 (elder tree), the
-- Turtle-Ship Admiral skin -> Lv.40, the dragon and the King of the Alphabet
-- skin -> Lv.50 (Guardian Tree). Set by id, so re-running is a no-op.
-- Mirrors minPlayerLevel in src/lib/costumes.tsx.

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
      when v_level < 30 then 8 + 2 * (v_level - 1)
      when v_level < 40 then 85 + 5 * (v_level - 30)
      else 180 + 5 * (v_level - 40)
    end;
    exit when p_xp < v_cum + v_need;
    v_cum := v_cum + v_need;
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;

update public.costume_catalog set min_player_level = 13
where id in ('autumn-leaves', 'firefly-glow', 'first-snow', 'garden-cat', 'gardener-halo', 'golden-scarf',
             'jar-terrace', 'maple-garland', 'monsoon-rain', 'moon-spectacles', 'moonlit-night', 'mushroom-ring',
             'petal-drift', 'squirrel', 'star-glasses', 'sunglasses', 'tiger-hood');

update public.costume_catalog set min_player_level = 21
where id in ('blossom-crown', 'crown', 'dawn-mist', 'hahoe-mask', 'hanbok-ribbon', 'hanji-sky', 'little-pond',
             'magpie', 'rainbow-arc', 'seonbi-gat', 'spirit-deer', 'starlight', 'stone-lantern', 'baby-owl');

update public.costume_catalog set min_player_level = 33
where id in ('aurora-veil', 'dokkaebi', 'golden-halo-ring', 'skin-scholar-painter');

update public.costume_catalog set min_player_level = 40
where id = 'skin-turtle-ship-admiral';

update public.costume_catalog set min_player_level = 50
where id in ('dragon', 'skin-hangul-king');
