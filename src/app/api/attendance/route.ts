import { NextResponse } from "next/server";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { isTableMissing } from "@/lib/resume";
import { iso } from "@/lib/study-garden";

// Growth rings: the Garden calls this once when it opens. The first call of
// the day inserts today's attendance row and says so (`first: true`), which
// is the moment the ring's segment draws in on the page; every later call
// that day hits the primary key and answers `first: false`, so nothing on
// the client needs to remember anything.
//
// "Today" is the server's day, the same clock streaks and the quest use.

export async function POST() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isRateLimited("attendance", user.id, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const day = iso(new Date());
  const { error } = await supabase.from("attendance_days").insert({ user_id: user.id, day });
  if (!error) return NextResponse.json({ first: true, day });
  // 23505: already there — an ordinary second open of the day.
  // 42P01: migration 0079 not applied yet — behave as "not first", quietly.
  if (error.code === "23505" || isTableMissing(error)) return NextResponse.json({ first: false, day });
  console.error("attendance insert failed:", error.message);
  return NextResponse.json({ error: "insert_failed" }, { status: 500 });
}
