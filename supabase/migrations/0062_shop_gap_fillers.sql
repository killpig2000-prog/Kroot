-- Three tier-gap shop items (src/lib/costumes.tsx): Face had zero Epic
-- pieces, Ground had one non-seasonal Rare, Friend had one Common.
--   butterfly    150  friend  common
--   jar-terrace  395  ground  rare
--   hahoe-mask   750  face    epic
-- No date window, no level gate, not plus-only.
--
-- Idempotent: upsert keyed by id, safe to re-run.

insert into public.costume_catalog
  (id, price, slot, min_player_level, available_from, available_until, plus_only, min_level)
values
  ('butterfly',   150, 'friend', null, null, null, false, null),
  ('jar-terrace', 395, 'ground', null, null, null, false, null),
  ('hahoe-mask',  750, 'face',   null, null, null, false, null)
on conflict (id) do update
  set price            = excluded.price,
      slot             = excluded.slot,
      min_player_level = excluded.min_player_level,
      available_from   = excluded.available_from,
      available_until  = excluded.available_until,
      plus_only        = excluded.plus_only,
      min_level        = excluded.min_level;
