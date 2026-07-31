-- Costume shop: coin balance on profiles + owned/equipped costumes per user.
-- The costume catalog itself lives in code (src/lib/costumes.tsx), keyed by slug.

alter table public.profiles
  add column coins integer not null default 100 check (coins >= 0);

create table public.user_costumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  costume_id text not null,
  slot text not null,
  equipped boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, costume_id)
);

alter table public.user_costumes enable row level security;

create policy "User costumes are viewable by owner"
  on public.user_costumes for select
  using (auth.uid() = user_id);

create policy "User costumes are insertable by owner"
  on public.user_costumes for insert
  with check (auth.uid() = user_id);

create policy "User costumes are updatable by owner"
  on public.user_costumes for update
  using (auth.uid() = user_id);
