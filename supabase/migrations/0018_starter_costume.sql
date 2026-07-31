-- Every learner starts with a free accessory: the sprout cap 🌱
--  * handle_new_user now also drops it (equipped) into the new wardrobe
--  * existing users with an empty wardrobe are backfilled

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, native_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'native_language', 'English')
  );

  insert into public.user_costumes (user_id, costume_id, slot, equipped)
  values (new.id, 'sprout-cap', 'hat', true);

  return new;
end;
$$;

-- Backfill: anyone who owns nothing gets the starter cap, equipped.
insert into public.user_costumes (user_id, costume_id, slot, equipped)
select p.id, 'sprout-cap', 'hat', true
from public.profiles p
where not exists (select 1 from public.user_costumes uc where uc.user_id = p.id);

-- Make the starter free in the shop catalog too.
update public.costume_catalog set price = 0 where id = 'sprout-cap';
