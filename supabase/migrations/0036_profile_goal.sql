-- 0036: learner goal picked during onboarding ("What brought you to Korean?").
-- Stored on the profile so the dashboard can lead with the matching skill.
-- Idempotent: safe to re-run.

alter table public.profiles add column if not exists goal text;

-- Same body as 0020, plus the goal carried in sign-up metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, native_language, goal)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'native_language', 'English'),
    nullif(new.raw_user_meta_data->>'goal', '')
  );

  insert into public.user_costumes (user_id, costume_id, slot, equipped)
  values (new.id, 'sprout-cap', 'hat', true);

  return new;
end;
$$;
