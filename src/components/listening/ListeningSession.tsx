"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, awardPartialCredit } from "@/lib/activity";
import { type Dialogue } from "@/lib/listening-dialogues";
import type { CefrLevel } from "@/lib/tree";
import {
  loadHeard,
  clearHeard,
  loadAwardedRatio,
  saveAwardedRatio,
  clearAwardedRatio,
} from "@/lib/listening-resume";
import ClipPlayer from "@/components/listening/ClipPlayer";
import FinishedAllCard from "@/components/listening/FinishedAllCard";
import ClipList from "@/components/listening/ClipList";

// Session: a clip list with per-clip status (done / in progress / not started)
// and a resume banner; picking a clip opens the player.
export default function ListeningSession({
  dialogues,
  level,
  situationLabel,
  situationIcon = "🎧",
  completedIds,
  header,
  levelTabs,
}: {
  dialogues: Dialogue[];
  level: CefrLevel;
  situationLabel: string;
  situationIcon?: string;
  completedIds: string[];
  /** Page title block — shown with the clip list, collapsed while a clip plays. */
  header?: ReactNode;
  /** Level switcher — hidden while a clip plays so the player sits at the top. */
  levelTabs?: ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(completedIds));
  const [openId, setOpenId] = useState<string | null>(null);
  const [heardMap, setHeardMap] = useState<Record<string, number>>({});
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [justFinishedAll, setJustFinishedAll] = useState(false);

  // localStorage is client-only — read the resume positions after mount
  // (async, so hydration matches the server-rendered "no resume" state).
  useEffect(() => {
    const t = setTimeout(() => {
      const map: Record<string, number> = {};
      for (const d of dialogues) {
        const h = loadHeard(d.id, d.lines.length);
        if (h > 0) map[d.id] = h;
      }
      setHeardMap(map);
    }, 0);
    return () => clearTimeout(t);
  }, [dialogues]);

  const doneCount = dialogues.filter((d) => completed.has(d.id)).length;
  const resumeTarget = dialogues.find((d) => !completed.has(d.id) && (heardMap[d.id] ?? 0) > 0);

  async function completeClip(dialogue: Dialogue) {
    const awardedRatio = loadAwardedRatio(dialogue.id);
    clearHeard(dialogue.id);
    clearAwardedRatio(dialogue.id);
    setHeardMap((m) => {
      const next = { ...m };
      delete next[dialogue.id];
      return next;
    });
    const nowDone = new Set(completed);
    nowDone.add(dialogue.id);
    setCompleted(nowDone);
    setOpenId(null);
    if (dialogues.every((d) => nowDone.has(d.id))) setJustFinishedAll(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("listening_progress").upsert(
        { user_id: user.id, dialogue_id: dialogue.id, completed_at: new Date().toISOString() },
        { onConflict: "user_id,dialogue_id" }
      );
      const res = await recordCompletion(supabase, "listening", 3, awardedRatio);
      if (res?.leveled_up) setNewLevel(res.new_level);
    }
  }

  // Left a clip before finishing it: pay out XP for the lines actually
  // heard so far, proportional to the dialogue's full reward.
  async function awardListeningPartial(dialogue: Dialogue, heard: number) {
    if (completed.has(dialogue.id) || heard <= 0) return;
    const ratio = heard / dialogue.lines.length;
    const awardedRatio = loadAwardedRatio(dialogue.id);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { newAwardedRatio, result } = await awardPartialCredit(
      supabase,
      "listening",
      ratio,
      awardedRatio
    );
    saveAwardedRatio(dialogue.id, newAwardedRatio);
    if (result?.leveled_up) setNewLevel(result.new_level);
  }

  const open = openId ? dialogues.find((d) => d.id === openId) : null;
  if (open) {
    // One-line header while listening: the situation and where we are in it.
    // The player itself carries the "← All clips" exit.
    return (
      <>
        <p className="flex items-center gap-2 text-[13px] text-muted mb-3 max-w-[680px]">
          <span className="inline-flex w-6 h-6 rounded-md bg-[#F0FDFA] text-teal border border-[#99F6E4] items-center justify-center text-[12px]">
            {situationIcon}
          </span>
          <b className="text-charcoal font-semibold">{situationLabel}</b>
          <span className="text-faint">·</span>
          <span className="tabular-nums">
            Clip {dialogues.indexOf(open) + 1} of {dialogues.length}
          </span>
          <span className="text-faint">·</span>
          <span>{level}</span>
        </p>
        <ClipPlayer
        key={open.id}
        dialogue={open}
        clipNo={dialogues.indexOf(open) + 1}
        clipCount={dialogues.length}
        initialHeard={heardMap[open.id] ?? 0}
        onExit={() => {
          const finalHeard = loadHeard(open.id, open.lines.length);
          setHeardMap((m) => ({ ...m, [open.id]: finalHeard }));
          setOpenId(null);
          void awardListeningPartial(open, finalHeard);
        }}
        onFinished={() => void completeClip(open)}
      />
      </>
    );
  }

  // all-done celebration (shown right after the last clip completes)
  if (justFinishedAll) {
    return (
      <>
        {header}
        <FinishedAllCard
          situationLabel={situationLabel}
          clipCount={dialogues.length}
          level={level}
          newLevel={newLevel}
          onBackToClips={() => setJustFinishedAll(false)}
        />
      </>
    );
  }

  return (
    <>
      {header}
      {levelTabs}
      <ClipList
        dialogues={dialogues}
        completed={completed}
        heardMap={heardMap}
        doneCount={doneCount}
        resumeTarget={resumeTarget}
        newLevel={newLevel}
        onOpenClip={setOpenId}
      />
    </>
  );
}
