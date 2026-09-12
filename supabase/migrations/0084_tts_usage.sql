-- Durable per-user cap on /api/tts cache misses. Every miss is a billed
-- Google synthesis, and the route's in-memory limiter resets with each
-- serverless instance, so it can't cap anything across a day.
--
-- RLS is on with no policies: only the route's service-role client reads or
-- writes this table, so a learner can neither see nor reset their own count.
--
-- Additive and idempotent: safe to re-run.

create table if not exists public.tts_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  chars integer not null,
  created_at timestamptz not null default now()
);

create index if not exists tts_usage_user_created_idx
  on public.tts_usage (user_id, created_at desc);

alter table public.tts_usage enable row level security;
