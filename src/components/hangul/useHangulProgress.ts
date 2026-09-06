"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { awardProgress, XP_POINTS, type ProgressResult } from "@/lib/activity";

export type JamoProgress = { practiced: boolean; bestScore: number; bestStars: number };
export type HangulProgressMap = Record<string, JamoProgress>;

const LOCAL_KEY = "kroot:hangul-progress";
const EMPTY: JamoProgress = { practiced: false, bestScore: 0, bestStars: 0 };

/** award_xp pays an item key once — dating it makes a letter payable once a day. */
export function hangulRewardKey(char: string, date = new Date()): string {
  return `hangul:${char}:${date.toISOString().slice(0, 10)}`;
}

function readLocal(): HangulProgressMap {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as HangulProgressMap) : {};
  } catch {
    return {};
  }
}
function writeLocal(map: HangulProgressMap) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(map)); } catch { /* private mode etc. */ }
}

/**
 * Per-jamo progress for the Hangul page. Signed in → `hangul_progress`
 * rows (RLS-scoped) and XP through award_xp; signed out (the public
 * /korean-hangul twin) → localStorage only, no XP. Same API either way so
 * the explorer doesn't care.
 */
export function useHangulProgress(userId: string | null | undefined) {
  const supabase = useMemo(() => createClient(), []);
  const [map, setMap] = useState<HangulProgressMap>({});
  const [loaded, setLoaded] = useState(false);
  // Latest map for the async writers below (they read it after an await, when
  // the closure's `map` may be stale). Kept in step by `commit` and the load.
  const mapRef = useRef<HangulProgressMap>({});

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      // Deferred a tick so the first paint matches the server's empty grid.
      Promise.resolve().then(() => {
        if (cancelled) return;
        const local = readLocal();
        mapRef.current = local;
        setMap(local);
        setLoaded(true);
      });
      return () => { cancelled = true; };
    }
    (async () => {
      const { data, error } = await supabase
        .from("hangul_progress")
        .select("jamo, practiced_at, best_score, best_stars")
        .eq("user_id", userId);
      if (cancelled) return;
      if (error) {
        // Table not applied yet, or offline — fall back to the local copy so the
        // page still shows something instead of a blank grid.
        console.error("hangul_progress load failed:", error.message);
        const local = readLocal();
        mapRef.current = local;
        setMap(local);
      } else {
        const next: HangulProgressMap = {};
        for (const r of data ?? []) {
          next[r.jamo] = { practiced: !!r.practiced_at, bestScore: r.best_score ?? 0, bestStars: r.best_stars ?? 0 };
        }
        mapRef.current = next;
        setMap(next);
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [supabase, userId]);

  const commit = useCallback((char: string, entry: JamoProgress) => {
    const next = { ...mapRef.current, [char]: entry };
    mapRef.current = next;
    setMap(next);
    if (!userId) writeLocal(next);
  }, [userId]);

  const markPracticed = useCallback(async (char: string) => {
    const cur = mapRef.current[char] ?? EMPTY;
    if (cur.practiced) return;
    commit(char, { ...cur, practiced: true });
    if (!userId) return;
    const { error } = await supabase
      .from("hangul_progress")
      .upsert({ user_id: userId, jamo: char, practiced_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id,jamo", ignoreDuplicates: false });
    if (error) console.error("hangul_progress practiced upsert failed:", error.message);
  }, [commit, supabase, userId]);

  /**
   * Record a challenge attempt. Returns the XP result (null when signed out,
   * when nothing was earned, or when today's key was already paid) and
   * whether this beat the previous best.
   */
  const recordChallenge = useCallback(async (char: string, score: number, stars: number): Promise<{ xp: ProgressResult | null; improved: boolean }> => {
    const cur = mapRef.current[char] ?? EMPTY;
    const improved = score > cur.bestScore;
    commit(char, {
      practiced: cur.practiced,
      bestScore: Math.max(cur.bestScore, score),
      bestStars: Math.max(cur.bestStars, stars),
    });
    if (!userId) return { xp: null, improved };

    const { data: existing } = await supabase
      .from("hangul_progress")
      .select("best_score, best_stars, attempts, practiced_at")
      .eq("user_id", userId)
      .eq("jamo", char)
      .maybeSingle();
    const { error } = await supabase.from("hangul_progress").upsert(
      {
        user_id: userId,
        jamo: char,
        practiced_at: existing?.practiced_at ?? null,
        best_score: Math.max(existing?.best_score ?? 0, score),
        best_stars: Math.max(existing?.best_stars ?? 0, stars),
        attempts: (existing?.attempts ?? 0) + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,jamo" }
    );
    if (error) console.error("hangul_progress challenge upsert failed:", error.message);

    if (stars < 1) return { xp: null, improved };
    const xp = await awardProgress(supabase, "hangul", hangulRewardKey(char), score);
    return { xp: xp && (xp.points_awarded ?? XP_POINTS.hangul) > 0 && !xp.already_earned ? xp : null, improved };
  }, [commit, supabase, userId]);

  const get = useCallback((char: string): JamoProgress => map[char] ?? EMPTY, [map]);

  return { progress: map, get, loaded, markPracticed, recordChallenge, signedIn: !!userId };
}
