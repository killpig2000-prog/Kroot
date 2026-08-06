-- Comments under community posts, for the page-per-post community layout.
-- Same visibility model as posts: any signed-in learner can read, you can only
-- write/delete rows that belong to you. Idempotent for partial-apply recovery.

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  author_emoji text not null default '🦊',
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_idx
  on public.community_comments (post_id, created_at);

alter table public.community_comments enable row level security;

drop policy if exists "Community comments are viewable by signed in learners" on public.community_comments;
create policy "Community comments are viewable by signed in learners"
  on public.community_comments for select
  to authenticated
  using (true);

drop policy if exists "Community comments are insertable by their author" on public.community_comments;
create policy "Community comments are insertable by their author"
  on public.community_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Community comments are deletable by their author" on public.community_comments;
create policy "Community comments are deletable by their author"
  on public.community_comments for delete
  using (auth.uid() = user_id);
