-- Make costume_catalog agree with src/lib/costumes.tsx, which is what the
-- shop actually renders.
--
-- The shop reads every price it shows from the COSTUMES array in
-- src/lib/costumes.tsx, but buy_costume() charges from this table. The two
-- drifted: costumes.tsx still matches migration 0030, while 0040 rebalanced
-- the table to a 50/200/600/1000 ladder and was never mirrored into the
-- client. Wherever they disagreed the learner saw one number and was charged
-- another -- "Buy & wear . 220" then "not enough coins" with 800 in the bank.
-- The screen is the source of truth here, so the table is brought to it.
--
-- Three things are corrected for all 45 items at once:
--
--   1. price       -- set to the number the shop displays.
--   2. plus_only   -- forced false everywhere. Kroot Plus is gone, so the
--                     'plus required' branch in buy_costume() can no longer be
--                     satisfied by anyone; any row left true is unbuyable.
--                     (Supersedes 0043, which priced the nine stragglers on
--                     0040's ladder instead of the client's.)
--   3. min_level   -- cleared. This is the legacy CEFR gate from 0013, still
--                     checked by buy_costume() but never modelled in the
--                     client: 'crown' was C1 and 'sunglasses' B1 on top of
--                     their visible Lv.45 / Lv.20 gates. A learner who met the
--                     level the shop showed still got a bare "level too low".
--                     min_player_level, which the UI does display, is the only
--                     gate left.
--
-- Idempotent: a single upsert keyed by id, safe to re-run.

insert into public.costume_catalog
  (id, price, slot, min_player_level, available_from, available_until, plus_only, min_level)
values

  -- common
  ('sprout-cap',            25, 'hat',      null, null, null, false, null),
  ('bow-tie',               28, 'neck',     null, null, null, false, null),
  ('round-glasses',         30, 'face',     null, null, null, false, null),
  ('wildflowers',           30, 'ground',   null, null, null, false, null),
  ('beanie',                35, 'hat',      null, null, null, false, null),
  ('cozy-scarf',            35, 'neck',     null, null, null, false, null),
  ('pebble-path',           35, 'ground',   null, null, null, false, null),
  ('cherry-blush',          40, 'face',     null, null, null, false, null),
  ('sparrow',               40, 'friend',   null, null, null, false, null),
  ('straw-hat',             40, 'hat',      null, null, null, false, null),
  ('sunbeams',              45, 'aura',     null, null, null, false, null),
  ('golden-hour',           50, 'sky',      null, null, null, false, null),

  -- rare
  ('sunglasses',            55, 'face',       20, null, null, false, null),
  ('mushroom-ring',         80, 'ground',   null, null, null, false, null),
  ('autumn-leaves',         85, 'ground',   null, '2026-10-01', '2026-11-30', false, null),
  ('golden-scarf',          85, 'neck',     null, null, null, false, null),
  ('maple-garland',         85, 'neck',     null, null, null, false, null),
  ('monsoon-rain',          85, 'sky',      null, null, null, false, null),
  ('moon-spectacles',       85, 'face',     null, null, null, false, null),
  ('star-glasses',          85, 'face',     null, null, null, false, null),
  ('moonlit-night',         90, 'sky',      null, null, null, false, null),
  ('firefly-glow',          95, 'aura',     null, null, null, false, null),
  ('gardener-halo',         95, 'hat',      null, null, null, false, null),
  ('squirrel',              95, 'friend',   null, null, null, false, null),
  ('first-snow',           100, 'sky',      null, '2026-12-01', '2027-02-28', false, null),
  ('petal-drift',          110, 'aura',     null, null, null, false, null),
  ('tiger-hood',           110, 'hat',      null, null, null, false, null),
  ('garden-cat',           120, 'friend',   null, null, null, false, null),

  -- epic
  ('crown',                150, 'hat',        45, null, null, false, null),
  ('blossom-crown',        180, 'hat',      null, null, null, false, null),
  ('hanbok-ribbon',        180, 'neck',     null, null, null, false, null),
  ('little-pond',          180, 'ground',   null, null, null, false, null),
  ('seonbi-gat',           180, 'hat',      null, null, null, false, null),
  ('stone-lantern',        180, 'ground',   null, null, null, false, null),
  ('dawn-mist',            190, 'sky',      null, null, null, false, null),
  ('hanji-sky',            190, 'sky',      null, null, null, false, null),
  ('magpie',               200, 'friend',     30, null, null, false, null),
  ('starlight',            220, 'aura',       50, null, null, false, null),
  ('baby-owl',             230, 'friend',     60, null, null, false, null),
  ('rainbow-arc',          240, 'aura',     null, null, null, false, null),
  ('spirit-deer',          260, 'friend',     40, null, null, false, null),

  -- legendary
  ('aurora-veil',          420, 'aura',       80, null, '2026-09-07', false, null),
  ('golden-halo-ring',     420, 'aura',     null, null, null, false, null),
  ('dokkaebi',             520, 'friend',   null, null, null, false, null),
  ('dragon',               520, 'friend',    100, null, null, false, null)

on conflict (id) do update set
  price            = excluded.price,
  slot             = excluded.slot,
  min_player_level = excluded.min_player_level,
  available_from   = excluded.available_from,
  available_until  = excluded.available_until,
  plus_only        = false,
  min_level        = null;

-- Belt and braces for any row not listed above (none today, but a future
-- catalog insert must not resurrect either dead gate).
update public.costume_catalog set plus_only = false where plus_only;
update public.costume_catalog set min_level = null where min_level is not null;
