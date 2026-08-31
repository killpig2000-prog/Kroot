-- Kroot Plus was removed from the product, but buy_costume() still refuses any
-- catalog row with plus_only = true ("plus required"). Those rows are still on
-- sale in the shop — the UI reads its prices from src/lib/costumes.tsx and has
-- no idea they are gated — so a learner sees "Buy & wear · 🌰 95", pays nothing
-- and gets an error naming a subscription that no longer exists.
--
-- Migration 0040 already retired four of them (golden-halo-ring, hanji-sky,
-- stone-lantern, dokkaebi) as part of its "no Plus exclusive items" rebalance.
-- It could not reach the other nine: 0040 begins with
--   delete from public.costume_catalog where price > 0;
-- and these nine were inserted by 0021/0024 at price 0, so they survived the
-- delete and were never reinserted with a coin price.
--
-- Prices follow 0040's tier ladder (Common 50 / Rare 200 / Epic 600 /
-- Legendary 1000), assigned by each item's relative worth in the old 0030
-- scale: cherry-blush was the cheapest at 40, the 85-95 band maps to Rare, and
-- the 180 band to Epic. No item here carries a min_player_level, so none of
-- them depend on the level gate that Plus used to waive.
--
-- Idempotent: plain updates keyed by id, safe to re-run.

update public.costume_catalog set plus_only = false, price = 50
  where id = 'cherry-blush';

update public.costume_catalog set plus_only = false, price = 200
  where id in ('star-glasses', 'moon-spectacles', 'golden-scarf', 'maple-garland', 'gardener-halo');

update public.costume_catalog set plus_only = false, price = 600
  where id in ('blossom-crown', 'seonbi-gat', 'hanbok-ribbon');

-- Belt and braces: nothing anywhere should still be Plus-gated, since no code
-- path can ever satisfy the check now that profiles.plus_until is never written.
update public.costume_catalog set plus_only = false where plus_only;
