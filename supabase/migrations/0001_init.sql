-- Kroot core schema: profiles, level test results, daily quests

create type public.cefr_level as enum ('A1','A2','B1','B2','C1','C2');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  native_language text not null default 'English',
  current_level public.cefr_level not null default 'A1',
  level_progress smallint not null default 0 check (level_progress between 0 and 100),
  streak_days integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are editable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create function public.handle_new_user()
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
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- One row per completed (or skipped) level test.
create table public.level_test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  result_level public.cefr_level not null,
  score smallint not null default 0,
  total_questions smallint not null default 0,
  skipped boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.level_test_results enable row level security;

create policy "Level test results are viewable by owner"
  on public.level_test_results for select
  using (auth.uid() = user_id);

create policy "Level test results are insertable by owner"
  on public.level_test_results for insert
  with check (auth.uid() = user_id);

-- Seven skill categories, seeded once, referenced by quests.
create table public.skill_categories (
  key text primary key,
  label text not null,
  kr_label text not null,
  sort_order smallint not null
);

insert into public.skill_categories (key, label, kr_label, sort_order) values
  ('listening', 'Listening', '듣기', 1),
  ('speaking', 'Speaking', '말하기', 2),
  ('writing', 'Writing', '쓰기', 3),
  ('reading', 'Reading', '읽기', 4),
  ('vocabulary', 'Vocabulary', '단어', 5),
  ('slang', 'Slang', '슬랭', 6),
  ('pronunciation', 'Pronunciation', '발음', 7);

-- One quest per user per day.
create table public.daily_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_key text not null references public.skill_categories (key),
  title text not null,
  description text not null,
  quest_date date not null default current_date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, quest_date)
);

alter table public.daily_quests enable row level security;

create policy "Daily quests are viewable by owner"
  on public.daily_quests for select
  using (auth.uid() = user_id);

create policy "Daily quests are insertable by owner"
  on public.daily_quests for insert
  with check (auth.uid() = user_id);

create policy "Daily quests are updatable by owner"
  on public.daily_quests for update
  using (auth.uid() = user_id);
