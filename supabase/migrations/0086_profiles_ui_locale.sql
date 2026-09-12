-- The UI language a learner last used when turning reminders on, so the daily
-- push/email can be sent in that language instead of always English.
-- Additive and idempotent: safe to re-run. Null = English.

alter table public.profiles add column if not exists ui_locale text;
