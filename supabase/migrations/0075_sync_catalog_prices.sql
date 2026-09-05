-- costume_catalog.price had drifted from src/lib/costumes.tsx (the client's
-- actual source of truth for what a card shows) on 32 of 55 items — the last
-- migration that ever wrote these prices was 0044_sync_catalog_to_shop_prices,
-- and every price bump in the TS file since then never got a matching
-- migration. buy_costume() charges off this column, so the shop had been
-- charging noticeably less than the card displayed (e.g. sunglasses showed
-- 290 but charged 55). Brings every drifted price back in line; every value
-- here is an exact set, so re-running is a no-op.
update public.costume_catalog set price = 720 where id = 'crown';
update public.costume_catalog set price = 290 where id = 'sunglasses';
update public.costume_catalog set price = 320 where id = 'gardener-halo';
update public.costume_catalog set price = 310 where id = 'star-glasses';
update public.costume_catalog set price = 330 where id = 'golden-scarf';
update public.costume_catalog set price = 760 where id = 'blossom-crown';
update public.costume_catalog set price = 740 where id = 'seonbi-gat';
update public.costume_catalog set price = 300 where id = 'moon-spectacles';
update public.costume_catalog set price = 730 where id = 'hanbok-ribbon';
update public.costume_catalog set price = 390 where id = 'firefly-glow';
update public.costume_catalog set price = 420 where id = 'petal-drift';
update public.costume_catalog set price = 820 where id = 'starlight';
update public.costume_catalog set price = 800 where id = 'rainbow-arc';
update public.costume_catalog set price = 1020 where id = 'aurora-veil';
update public.costume_catalog set price = 980 where id = 'golden-halo-ring';
update public.costume_catalog set price = 160 where id = 'golden-hour';
update public.costume_catalog set price = 410 where id = 'moonlit-night';
update public.costume_catalog set price = 430 where id = 'first-snow';
update public.costume_catalog set price = 380 where id = 'monsoon-rain';
update public.costume_catalog set price = 780 where id = 'dawn-mist';
update public.costume_catalog set price = 790 where id = 'hanji-sky';
update public.costume_catalog set price = 140 where id = 'wildflowers';
update public.costume_catalog set price = 150 where id = 'pebble-path';
update public.costume_catalog set price = 370 where id = 'mushroom-ring';
update public.costume_catalog set price = 810 where id = 'little-pond';
update public.costume_catalog set price = 400 where id = 'autumn-leaves';
update public.costume_catalog set price = 770 where id = 'stone-lantern';
update public.costume_catalog set price = 830 where id = 'magpie';
update public.costume_catalog set price = 850 where id = 'baby-owl';
update public.costume_catalog set price = 1050 where id = 'dokkaebi';
update public.costume_catalog set price = 840 where id = 'spirit-deer';
update public.costume_catalog set price = 1080 where id = 'dragon';
