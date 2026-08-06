"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion } from "@/lib/activity";
import { COURSE_TOTAL_DAYS } from "@/lib/course";

export default function CompleteButton({
  userId,
  stepKey,
  day,
  minutes,
  initiallyDone,
}: {
  userId: string;
  stepKey: string;
  day: number;
  minutes: number;
  initiallyDone: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [done, setDone] = useState(initiallyDone);
  const [saving, setSaving] = useState(false);

  async function complete() {
    setSaving(true);
    await supabase
      .from("path_progress")
      .upsert({ user_id: userId, step_key: stepKey }, { onConflict: "user_id,step_key" });
    await recordCompletion(supabase, day <= 7 ? "hangul" : "grammar", minutes);
    setDone(true);
    setSaving(false);
    router.refresh();
  }

  const hasNext = day < COURSE_TOTAL_DAYS;

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {done ? (
        <span className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0]">
          ✓ Day {day} complete
        </span>
      ) : (
        <button
          onClick={complete}
          disabled={saving}
          className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : `Mark Day ${day} complete 🌱`}
        </button>
      )}
      {done && hasNext && (
        <Link
          href={`/course/day/${day + 1}`}
          className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors"
        >
          Next: Day {day + 1} →
        </Link>
      )}
      <Link
        href="/course"
        className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-[#18181B] bg-white border border-[#E3DDD0] hover:bg-[#FAF7EF] transition-colors"
      >
        Course list
      </Link>
    </div>
  );
}
