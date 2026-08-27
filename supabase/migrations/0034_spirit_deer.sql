-- Garden Shop: an Epic Friend companion (Forest Spirit Deer / 정령 사슴).
-- Display data lives in src/lib/costumes.tsx; this table only holds what
-- buy_costume() must enforce.

insert into public.costume_catalog (id, price, plus_only, slot, min_player_level, available_from, available_until)
values ('spirit-deer', 260, false, 'friend', 40, null, null)
on conflict (id) do update
  set price = excluded.price, plus_only = excluded.plus_only, slot = excluded.slot,
      min_player_level = excluded.min_player_level,
      available_from = excluded.available_from, available_until = excluded.available_until;
