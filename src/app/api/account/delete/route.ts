import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

// Account deletion, for the Settings row and for the store listings that
// require it.
//
// No new SQL was needed: profiles is `references auth.users (id) on delete
// cascade`, and every learner-owned table cascades from profiles in turn, so
// removing the auth user takes the whole account with it. The one row that
// deliberately survives is analytics_events, whose user_id is `on delete set
// null` — the event stays, the person doesn't.
//
// Storage is the exception: objects have no foreign key, so the avatar has to
// be removed by hand before the user goes, or it is orphaned in the bucket
// with no row left pointing at it.

export async function POST(request: Request) {
  const supabase = await createClient();
  // getUser() over getClaims() on purpose: this one verifies with the auth
  // server rather than trusting a signed claim we already hold.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (isRateLimited("account-delete", user.id, 5, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // The client already made the learner type DELETE; this is the second lock,
  // so a stray POST from anywhere else can't take an account with it.
  const body = await request.json().catch(() => null);
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: "not_confirmed" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("account delete: SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  // Avatars live at `${userId}/avatar.${ext}` — list the folder rather than
  // guessing the extension. A failure here is logged, not fatal: an orphaned
  // image is a smaller problem than an account that won't delete.
  const { data: files, error: listError } = await admin.storage.from("avatars").list(user.id);
  if (listError) {
    console.error("account delete: avatar list failed:", listError.message);
  } else if (files?.length) {
    const { error: removeError } = await admin.storage
      .from("avatars")
      .remove(files.map((f) => `${user.id}/${f.name}`));
    if (removeError) console.error("account delete: avatar remove failed:", removeError.message);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("account delete failed:", error.message);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  // The rows are gone but this browser still holds auth cookies; without this
  // the next request looks signed in and lands on a dashboard with no profile.
  await supabase.auth.signOut().catch(() => {});

  return NextResponse.json({ ok: true });
}
