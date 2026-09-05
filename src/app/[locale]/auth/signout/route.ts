import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side sign-out: expires the auth cookies with the same options they
// were set with, which the browser client can't always do reliably.
export async function POST(request: Request) {
  const supabase = await createClient();
  // A swallowed failure here sent the learner back to the landing page with
  // their cookies intact — believing they'd signed out. That's the wrong way
  // to be wrong on a shared device, so say it failed and let them retry.
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("sign-out failed:", error.message);
    return NextResponse.redirect(new URL("/?error=signout", request.url), { status: 303 });
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
