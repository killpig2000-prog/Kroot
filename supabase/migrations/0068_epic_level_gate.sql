-- Epic and Legendary items should all carry a level lock, not just the ones
-- that happened to get one when added — the user asked for a consistent
-- floor: Lv.30 for every Epic+ item that doesn't already require more.
-- (Some already gate higher — crown 45, starlight 50, magpie 30, baby-owl 60,
-- spirit-deer 40, aurora-veil 80, dragon 100 — those are left untouched,
-- since they already satisfy "at least 30".) Idempotent: only touches rows
-- currently null, so re-running is a no-op and a manually-set higher value
-- elsewhere is never lowered.
update public.costume_catalog
set min_player_level = 30
where min_player_level is null
  and id in (
    'blossom-crown', 'seonbi-gat', 'hahoe-mask', 'hanbok-ribbon', 'rainbow-arc',
    'golden-halo-ring', 'dawn-mist', 'hanji-sky', 'little-pond', 'stone-lantern',
    'dokkaebi'
  );

-- The three tree skins get their own, higher floors instead of the blanket
-- 30 above — 2000 coins is already a late-game price, and the user wants
-- these specifically staggered: Scholar-Painter 50, Turtle-Ship Admiral 60,
-- King of the Alphabet 80.
update public.costume_catalog set min_player_level = 50 where id = 'skin-scholar-painter';
update public.costume_catalog set min_player_level = 60 where id = 'skin-turtle-ship-admiral';
update public.costume_catalog set min_player_level = 80 where id = 'skin-hangul-king';
