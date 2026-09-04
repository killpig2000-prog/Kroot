-- Round every shop item's price to the nearest 10 coins (user request: no
-- prices ending in a non-zero digit). Mirrors the same rounding just applied
-- to the COSTUMES array in src/lib/costumes.tsx -- buy_costume() charges
-- from this table, not the client array, so both must move together (see
-- 0044's note on client/table drift).
--
-- Idempotent: plain updates by id, safe to re-run.

update public.costume_catalog set price = 80  where id = 'straw-hat';
update public.costume_catalog set price = 80  where id = 'beanie';
update public.costume_catalog set price = 70  where id = 'sprout-cap';
update public.costume_catalog set price = 80  where id = 'round-glasses';
update public.costume_catalog set price = 80  where id = 'cozy-scarf';
update public.costume_catalog set price = 90  where id = 'cherry-blush';
update public.costume_catalog set price = 320 where id = 'maple-garland';
update public.costume_catalog set price = 70  where id = 'bow-tie';
update public.costume_catalog set price = 300 where id = 'tiger-hood';
update public.costume_catalog set price = 150 where id = 'sunbeams';
update public.costume_catalog set price = 400 where id = 'jar-terrace';
update public.costume_catalog set price = 170 where id = 'sparrow';
update public.costume_catalog set price = 390 where id = 'squirrel';
update public.costume_catalog set price = 420 where id = 'garden-cat';
