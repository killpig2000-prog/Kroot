"use client";

import { useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, awardPartialCredit, XP_POINTS } from "@/lib/activity";
import { type Dialogue } from "@/lib/listening-dialogues";
import type { Situation } from "@/lib/listening";
import type { CefrLevel } from "@/lib/tree";
import { loadAwardedRatio, saveAwardedRatio, clearAwardedRatio } from "@/lib/listening-resume";
import { isColumnMissing } from "@/lib/resume";
import ClipPlayer from "@/components/listening/ClipPlayer";
import ClipDone from "@/components/listening/ClipDone";
import FinishedAllCard from "@/components/listening/FinishedAllCard";
import ClipList from "@/components/listening/ClipList";

type DoneInfo = { dialogue: Dialogue; correct: boolean | null; xp: number };

// Session: clip list → player (always starts at line 1 — no cross-visit
// resume) → done screen → next clip, and the all-done celebration after
// the last one.
export default function ListeningSession({
  dialogues,
  level,
  situation,
  completedIds,
  initialOpenId = null,
  userId,
  levelTabs,
}: {
  dialogues: Dialogue[];
  level: CefrLevel;
  situation: Situation;
  completedIds: string[];
  /** Open this clip straight away (from `?clip=`). */
  initialOpenId?: string | null;
  userId: string | null;
  /** Level switcher — hidden while a clip plays so the player sits at the top. */
  levelTabs?: ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(completedIds));
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [done, setDone] = useState<DoneInfo | null>(null);
  const [justFinishedAll, setJustFinishedAll] = useState(false);

  const doneCount = dialogues.filter((d) => completed.has(d.id)).length;

  async function completeClip(dialogue: Dialogue, correct: boolean | null) {
    const awardedRatio = loadAwardedRatio(dialogue.id);
    clearAwardedRatio(dialogue.id);
    const nowDone = new Set(completed);
    nowDone.add(dialogue.id);
    setCompleted(nowDone);
    setOpenId(null);
    const full = XP_POINTS.listening ?? 12;
    const xp = Math.max(0, full - Math.round(full * awardedRatio));
    setDone({ dialogue, correct, xp });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // quiz_correct arrived in migration 0037; save the completion without
      // it when that migration hasn't reached this environment yet.
      const row = { user_id: user.id, dialogue_id: dialogue.id, completed_at: new Date().toISOString() };
      const { error } = await supabase
        .from("listening_progress")
        .upsert({ ...row, quiz_correct: correct }, { onConflict: "user_id,dialogue_id" });
      if (error && isColumnMissing(error)) {
        await supabase.from("listening_progress").upsert(row, { onConflict: "user_id,dialogue_id" });
      }
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
    return (
      <ClipPlayer
        key={open.id}
        dialogue={open}
        clipNo={dialogues.indexOf(open) + 1}
        clipCount={dialogues.length}
        situationKey={situation.key}
        situationLabel={situation.label}
        situationIcon={situation.icon}
        level={level}
        userId={userId}
        onExit={(finalHeard) => {
          setOpenId(null);
          void awardListeningPartial(open, finalHeard);
        }}
        onFinished={(correct) => void completeClip(open, correct)}
      />
    );
  }

  // all-done celebration (after the summary button on the last clip)
  if (justFinishedAll) {
    return (
      <FinishedAllCard
        situationLabel={situation.label}
        clipCount={dialogues.length}
        level={level}
        newLevel={newLevel}
        onBackToClips={() => setJustFinishedAll(false)}
      />
    );
  }

  if (done) {
    const idx = dialogues.indexOf(done.dialogue);
    const next = dialogues.slice(idx + 1).find((d) => !completed.has(d.id)) ?? dialogues.find((d) => !completed.has(d.id)) ?? null;
    return (
      <ClipDone
        dialogue={done.dialogue}
        clipNo={idx + 1}
        clipCount={dialogues.length}
        situationLabel={situation.label}
        situationIcon={situation.icon}
        level={level}
        correct={done.correct}
        xp={done.xp}
        next={next}
        userId={userId}
        onReplay={() => {
          setDone(null);
          setOpenId(done.dialogue.id);
        }}
        onAllClips={() => setDone(null)}
        onNext={() => {
          setDone(null);
          if (next) setOpenId(next.id);
          else setJustFinishedAll(true);
        }}
      />
    );
  }

  return (
    <>
      {levelTabs}
      <ClipList
        dialogues={dialogues}
        situation={situation}
        level={level}
        completed={completed}
        doneCount={doneCount}
        newLevel={newLevel}
        onOpenClip={setOpenId}
      />
    </>
  );
}
