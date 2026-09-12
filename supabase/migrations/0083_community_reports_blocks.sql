-- Report and block on the community boards (Google Play UGC policy).
-- Additive and idempotent: two new tables, their RLS, nothing existing changes.

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid references public.community_posts (id) on delete set null,
  comment_id uuid references public.community_comments (id) on delete set null,
  reason text not null check (reason in ('spam', 'harassment', 'sexual', 'other')),
  -- A copy of the reported text, so a report survives the author deleting it.
  snapshot text,
  created_at timestamptz not null default now()
);

create unique index if not exists community_reports_once
  on public.community_reports (reporter_id, coalesce(post_id, comment_id));

alter table public.community_reports enable row level security;

drop policy if exists "Community reports are insertable by their reporter" on public.community_reports;
create policy "Community reports are insertable by their reporter"
  on public.community_reports for insert to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "Community reports are viewable by their reporter" on public.community_reports;
create policy "Community reports are viewable by their reporter"
  on public.community_reports for select to authenticated
  using (auth.uid() = reporter_id);

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;

drop policy if exists "User blocks are viewable by the blocker" on public.user_blocks;
create policy "User blocks are viewable by the blocker"
  on public.user_blocks for select to authenticated
  using (auth.uid() = blocker_id);

drop policy if exists "User blocks are insertable by the blocker" on public.user_blocks;
create policy "User blocks are insertable by the blocker"
  on public.user_blocks for insert to authenticated
  with check (auth.uid() = blocker_id);

drop policy if exists "User blocks are deletable by the blocker" on public.user_blocks;
create policy "User blocks are deletable by the blocker"
  on public.user_blocks for delete to authenticated
  using (auth.uid() = blocker_id);
