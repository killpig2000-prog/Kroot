-- Welcome gift: a free hat ("welcome-bow", drawn in src/lib/costumes.tsx)
-- every learner can claim once. The guided tour's Shop leg ends with the
-- learner actually claiming it, so buy-and-wear has been done for real on a
-- 0-coin item before they spend the 100 signup coins on anything.
-- buy_costume() already handles price 0 (coins >= 0 always passes, deducts
-- nothing) and the once-only rule is its existing "already owned" check.
-- Idempotent: upsert on id.
insert into public.costume_catalog (id, price, plus_only, slot, min_player_level, available_from, available_until)
values ('welcome-bow', 0, false, 'hat', null, null, null)
on conflict (id) do update
  set price = excluded.price, plus_only = excluded.plus_only, slot = excluded.slot,
      min_player_level = excluded.min_player_level,
      available_from = excluded.available_from, available_until = excluded.available_until;
