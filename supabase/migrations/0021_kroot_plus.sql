-- Kroot Plus: paid subscription state + Plus-exclusive costumes.
-- plus_until / stripe_customer_id are written ONLY by the Stripe webhook
-- (service role); clients keep owner-only read access via existing policies.

-- Idempotent: safe to re-run after a partial apply.
alter table public.profiles add column if not exists plus_until timestamptz;
alter table public.profiles add column if not exists stripe_customer_id text;

create index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id);

alter table public.costume_catalog add column if not exists plus_only boolean not null default false;

insert into public.costume_catalog (id, price, min_level, plus_only) values
  ('gardener-halo', 0, null, true),
  ('star-glasses', 0, null, true),
  ('golden-scarf', 0, null, true)
on conflict (id) do update set plus_only = excluded.plus_only, price = excluded.price;

-- Re-create buy_costume with the Plus gate.
create or replace function public.buy_costume(p_costume_id text)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_item public.costume_catalog%rowtype;
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_item from public.costume_catalog where id = p_costume_id;
  if not found then
    raise exception 'unknown costume';
  end if;

  select * into v_profile from public.profiles where id = auth.uid() for update;

  if exists (select 1 from public.user_costumes where user_id = auth.uid() and costume_id = p_costume_id) then
    raise exception 'already owned';
  end if;
  if v_item.plus_only and (v_profile.plus_until is null or v_profile.plus_until < now()) then
    raise exception 'plus required';
  end if;
  if v_item.min_level is not null and v_profile.current_level < v_item.min_level then
    raise exception 'level too low';
  end if;
  if v_profile.coins < v_item.price then
    raise exception 'not enough coins';
  end if;

  update public.profiles set coins = coins - v_item.price, updated_at = now()
  where id = auth.uid();

  insert into public.user_costumes (user_id, costume_id, slot, equipped)
  values (auth.uid(), p_costume_id,
          (select case when p_costume_id in ('round-glasses','sunglasses','star-glasses') then 'face'
                       when p_costume_id in ('cozy-scarf','bow-tie','golden-scarf') then 'neck'
                       else 'hat' end),
          false);

  return v_profile.coins - v_item.price;
end;
$$;
