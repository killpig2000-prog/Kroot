-- Close the public `tts` bucket to direct writes.
--
-- 0025 created it with:
--
--   create policy "tts_authenticated_upload" on storage.objects
--     for insert to authenticated with check (bucket_id = 'tts');
--
-- and a comment saying "uploads only happen through /api/tts with the caller's
-- session". The policy did not enforce that. It has no path, size, content-type
-- or ownership constraint, and the browser client holds the same authenticated
-- session, so any signed-in user could call
-- `supabase.storage.from('tts').upload(anyName, anyBytes)` straight from a
-- console.
--
-- That mattered more than junk-file spam because the object name is fully
-- computable on the client: src/lib/tts.ts builds it as
-- sha256("edge-tts|" + voice + "|" + text) and plays the resulting public URL,
-- and /api/tts uses the identical formula. So the course content — which ships
-- in the bundle — could be enumerated, the hash computed for any phrase not yet
-- synthesized, and arbitrary audio planted under that name. Every learner who
-- reached that phrase would then hear it, served from our own domain with a
-- one-year cache-control. There is no UPDATE policy, so already-cached objects
-- were safe; the exposure was exactly the new content the route exists to
-- serve.
--
-- The fix is to stop writing as the caller. /api/tts now uploads with the
-- service-role key (see the same commit), which bypasses RLS, so no insert
-- policy is needed at all. The route is where the real constraints live: it
-- requires a session, rate-limits to 60/min/user, caps the text at 300 chars,
-- requires Hangul, and derives the filename from the very text it synthesized —
-- so an object can never disagree with its own name.
--
-- Read access is deliberately left wide open. Playback fetches these URLs
-- anonymously from every page; restricting SELECT would silence audio for
-- everyone.
--
-- Idempotent: drop if exists, and the read policy is recreated as it was.

drop policy if exists "tts_authenticated_upload" on storage.objects;

drop policy if exists "tts_public_read" on storage.objects;
create policy "tts_public_read" on storage.objects
  for select using (bucket_id = 'tts');
