-- Event "skin" costumes: a new costume slot whose item replaces the whole
-- growing tree while worn (drawn by src/lib/costume-skins.tsx; LevelCreature
-- returns the character instead of the tree when one is equipped). Taking it
-- off reveals the tree at its real stage — nothing about growth is touched.
--
-- Three historical-figure homages, all Legendary at 2000 coins with four-week
-- sale windows (mirrors availableFrom/Until in src/lib/costumes.tsx):
--   skin-hangul-king          2026-09-25 .. 2026-10-22  (Hangeul Day, Oct 9)
--   skin-turtle-ship-admiral  2027-04-14 .. 2027-05-11  (Yi Sun-sin, Apr 28)
--   skin-scholar-painter      2027-06-02 .. 2027-06-29  (Dasan, Jun 16)
--
-- costume_catalog.slot is free text (0024), and user_costumes.slot likewise
-- (0009), so no schema change: buy_costume() copies the slot onto the owned
-- row and the shop's one-per-slot equip works unchanged.
--
-- Idempotent: upsert keyed by id, safe to re-run.

insert into public.costume_catalog
  (id, price, slot, min_player_level, available_from, available_until, plus_only, min_level)
values
  ('skin-hangul-king',         2000, 'skin', null, date '2026-09-25', date '2026-10-22', false, null),
  ('skin-turtle-ship-admiral', 2000, 'skin', null, date '2027-04-14', date '2027-05-11', false, null),
  ('skin-scholar-painter',     2000, 'skin', null, date '2027-06-02', date '2027-06-29', false, null)
on conflict (id) do update
  set price            = excluded.price,
      slot             = excluded.slot,
      min_player_level = excluded.min_player_level,
      available_from   = excluded.available_from,
      available_until  = excluded.available_until,
      plus_only        = excluded.plus_only,
      min_level        = excluded.min_level;
