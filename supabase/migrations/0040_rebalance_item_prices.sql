-- Rebalance item prices with clear tiers (no Plus exclusive items):
-- Common: 50 coins | Rare: 200 coins | Epic: 600 coins | Legendary: 1000 coins
-- All items purchasable with coins

delete from public.costume_catalog where price > 0;

-- Reinsert with new pricing (all purchasable)
insert into public.costume_catalog (id, price, plus_only, slot, min_player_level, available_from, available_until) values
  -- Common (50 coins) - Easy early access
  ('wildflowers',       50, false, 'ground', null, null, null),
  ('golden-hour',       50, false, 'sky',    null, null, null),
  ('sparrow',           50, false, 'friend', null, null, null),

  -- Rare (200 coins) - 1 week grind
  ('sunbeams',          200, false, 'aura',   null, null, null),
  ('pebble-path',       200, false, 'ground', null, null, null),
  ('monsoon-rain',      200, false, 'sky',    null, null, null),
  ('moonlit-night',     200, false, 'sky',    null, null, null),
  ('squirrel',          200, false, 'friend', null, null, null),
  ('tiger-hood',        200, false, 'hat',    null, null, null),
  ('golden-halo-ring',  200, false, 'aura',   null, null, null),

  -- Epic (600 coins) - 3 week goal
  ('firefly-glow',      600, false, 'aura',   null, null, null),
  ('petal-drift',       600, false, 'aura',   null, null, null),
  ('mushroom-ring',     600, false, 'ground', null, null, null),
  ('first-snow',        600, false, 'sky',    null, '2026-12-01', '2027-02-28'),
  ('autumn-leaves',     600, false, 'ground', null, '2026-10-01', '2026-11-30'),
  ('garden-cat',        600, false, 'friend', null, null, null),
  ('crown',             600, false, 'hat',    45,   null, null),
  ('sunglasses',        600, false, 'hat',    null, null, null),
  ('hanji-sky',         600, false, 'sky',    null, null, null),
  ('stone-lantern',     600, false, 'ground', null, null, null),

  -- Legendary (1000 coins) - 1.5 month ultimate goal
  ('starlight',        1000, false, 'aura',   50,   null, null),
  ('rainbow-arc',      1000, false, 'aura',   null, null, null),
  ('aurora-veil',      1000, false, 'aura',   80,   null, '2026-09-07'),
  ('dawn-mist',        1000, false, 'sky',    null, null, null),
  ('little-pond',      1000, false, 'ground', null, null, null),
  ('magpie',           1000, false, 'friend', 30,   null, null),
  ('baby-owl',         1000, false, 'friend', 60,   null, null),
  ('dokkaebi',         1000, false, 'friend', null, null, null)
on conflict (id) do update
  set price = excluded.price, plus_only = excluded.plus_only, slot = excluded.slot,
      min_player_level = excluded.min_player_level,
      available_from = excluded.available_from, available_until = excluded.available_until;
