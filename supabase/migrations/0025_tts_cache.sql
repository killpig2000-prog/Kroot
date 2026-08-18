-- Public storage bucket for cached Gemini TTS audio. Files are keyed by a
-- content hash, so the same phrase is synthesized once and shared by everyone.

insert into storage.buckets (id, name, public)
values ('tts', 'tts', true)
on conflict (id) do nothing;

drop policy if exists "tts_public_read" on storage.objects;
create policy "tts_public_read" on storage.objects
  for select using (bucket_id = 'tts');

-- Uploads only happen through /api/tts with the caller's session.
drop policy if exists "tts_authenticated_upload" on storage.objects;
create policy "tts_authenticated_upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'tts');
