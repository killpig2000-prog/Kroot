import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side sign-out: expires the auth cookies with the same options they
// were set with, which the browser client can't always do reliably.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
