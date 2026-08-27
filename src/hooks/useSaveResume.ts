"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveResume, type ResumePoint } from "@/lib/resume";

// Records "where I am" once per mount so the dashboard's Continue card can
// send the learner straight back here. Re-fires when the unit/progress key
// changes (e.g. moving to the next dialogue line batch).
export function useSaveResume(userId: string | null | undefined, point: ResumePoint | null) {
  const supabase = useMemo(() => createClient(), []);
  const key = point ? `${point.href}|${point.label}|${point.progress ?? ""}` : "";
  useEffect(() => {
    if (!userId || !point) return;
    // An empty href means "wherever I am right now" (pathname + query).
    const href = point.href || `${location.pathname}${location.search}`;
    void saveResume(supabase, userId, { ...point, href });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, key]);
}
