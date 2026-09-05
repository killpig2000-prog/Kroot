-- Replaces the ad-hoc per-item level gates from 0068 with a clean floor per
-- rarity tier: Common ungated, Rare Lv.20+, Epic Lv.50+, Legendary Lv.80+.
-- The three tree skins (2000 coins, already the game's most expensive items)
-- get their own staggered floors above the Legendary floor instead, per the
-- user's explicit request: Scholar-Painter 60, Turtle-Ship Admiral 80, King
-- of the Alphabet 100. Every value here is an exact set, not a "raise if
-- lower" — re-running is a no-op since it always lands on the same numbers.

-- Rare: 20 for every purchasable rare item. The three fair-ribbon prizes
-- (price 0, granted not bought) are intentionally left untouched — a level
-- gate on an item nobody buys through buy_costume() would do nothing.
update public.costume_catalog set min_player_level = 20
where id in (
  'sunglasses', 'gardener-halo', 'star-glasses', 'golden-scarf', 'moon-spectacles',
  'maple-garland', 'tiger-hood', 'firefly-glow', 'petal-drift', 'moonlit-night',
  'first-snow', 'monsoon-rain', 'mushroom-ring', 'jar-terrace', 'autumn-leaves',
  'squirrel', 'garden-cat'
);

-- Epic: 50 (the tree's "fully grown" milestone, level.ts FULLY_GROWN_LEVEL).
update public.costume_catalog set min_player_level = 50
where id in (
  'crown', 'blossom-crown', 'seonbi-gat', 'hahoe-mask', 'hanbok-ribbon', 'starlight',
  'rainbow-arc', 'dawn-mist', 'hanji-sky', 'little-pond', 'stone-lantern', 'magpie',
  'spirit-deer'
);
-- baby-owl was already above the new floor (60) — left as is.

-- Legendary: 80, except the three tree skins (staggered above it, set below).
update public.costume_catalog set min_player_level = 80
where id in ('aurora-veil', 'golden-halo-ring', 'dokkaebi');
-- dragon was already above the new floor (100) — left as is.

update public.costume_catalog set min_player_level = 60 where id = 'skin-scholar-painter';
update public.costume_catalog set min_player_level = 80 where id = 'skin-turtle-ship-admiral';
update public.costume_catalog set min_player_level = 100 where id = 'skin-hangul-king';
