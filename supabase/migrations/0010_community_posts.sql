-- Community ("모임"): a plain message board. Posts are readable by every signed
-- in learner — this is the one shared surface in the app — but you can only
-- write rows that belong to you. Author name/emoji/country are denormalised so
-- a post keeps the identity it was written under.

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  author_emoji text not null default '🦊',
  country text,
  board text not null default 'free' check (board in ('question', 'free', 'exchange')),
  content text not null,
  created_at timestamptz not null default now()
);

create index community_posts_created_at_idx on public.community_posts (created_at desc);

alter table public.community_posts enable row level security;

create policy "Community posts are viewable by signed in learners"
  on public.community_posts for select
  to authenticated
  using (true);

create policy "Community posts are insertable by their author"
  on public.community_posts for insert
  with check (auth.uid() = user_id);

create policy "Community posts are deletable by their author"
  on public.community_posts for delete
  using (auth.uid() = user_id);
