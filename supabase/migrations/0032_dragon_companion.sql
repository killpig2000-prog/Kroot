-- Garden Shop: a Legendary Friend companion (Guardian Dragon / 용).
-- Display data lives in src/lib/costumes.tsx; this table only holds what
-- buy_costume() must enforce.

insert into public.costume_catalog (id, price, plus_only, slot, min_player_level, available_from, available_until)
values ('dragon', 520, false, 'friend', 100, null, null)
on conflict (id) do update
  set price = excluded.price, plus_only = excluded.plus_only, slot = excluded.slot,
      min_player_level = excluded.min_player_level,
      available_from = excluded.available_from, available_until = excluded.available_until;
