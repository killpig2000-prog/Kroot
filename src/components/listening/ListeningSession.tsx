"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { createClient, getClientUserId } from "@/lib/supabase/client";
import { recordCompletion, awardPartialCredit, XP_POINTS } from "@/lib/activity";
import { listeningDialogueKey } from "@/lib/reward-keys";
import { type Dialogue } from "@/lib/listening-dialogues";
import type { Situation } from "@/lib/listening";
import type { CefrLevel } from "@/lib/tree";
import { loadAwardedRatio, saveAwardedRatio, clearAwardedRatio } from "@/lib/listening-resume";
import { isColumnMissing } from "@/lib/resume";
import ClipPlayer from "@/components/listening/ClipPlayer";
import ClipDone from "@/components/listening/ClipDone";
import FinishedAllCard from "@/components/listening/FinishedAllCard";
import ClipList from "@/components/listening/ClipList";

type DoneInfo = {
  dialogue: Dialogue;
  correct: boolean | null;
  xp: number;
  /** Filled in once the award_xp RPC resolves — 0 until then, never negative. */
  coinsEarned: number;
  newLevel: number | null;
};

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
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [done, setDone] = useState<DoneInfo | null>(null);
  const [justFinishedAll, setJustFinishedAll] = useState(false);
  // The clip's completion never reached the server; the checkmark has been
  // rolled back, so say why instead of letting it look like a glitch.
  const [saveFailed, setSaveFailed] = useState(false);
  const tSave = useTranslations("listening");

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
    setDone({ dialogue, correct, xp, coinsEarned: 0, newLevel: null });

    const userId = await getClientUserId(supabase);
    if (userId) {
      // quiz_correct arrived in migration 0037; save the completion without
      // it when that migration hasn't reached this environment yet.
      const row = { user_id: userId, dialogue_id: dialogue.id, completed_at: new Date().toISOString() };
      let { error } = await supabase
        .from("listening_progress")
        .upsert({ ...row, quiz_correct: correct }, { onConflict: "user_id,dialogue_id" });
      if (error && isColumnMissing(error)) {
        ({ error } = await supabase
          .from("listening_progress")
          .upsert(row, { onConflict: "user_id,dialogue_id" }));
      }
      // The clip was marked done in local state before this ran, so the list
      // would keep claiming it until a reload put the truth back. Take the
      // checkmark off instead of letting the two disagree — and say why, since
      // a checkmark that un-ticks itself with no message reads as a glitch.
      if (error) {
        setCompleted((prev) => {
          const back = new Set(prev);
          back.delete(dialogue.id);
          return back;
        });
        setSaveFailed(true);
        // Awarding XP for a clip the list now shows as unfinished is the
        // inconsistency the rollback above exists to avoid.
        setDone((prev) => (prev && prev.dialogue.id === dialogue.id ? { ...prev, xp: 0 } : prev));
        return;
      }
      setSaveFailed(false);
      const res = await recordCompletion(
        supabase,
        "listening",
        3,
        awardedRatio,
        listeningDialogueKey(dialogue.id),
        correct == null ? null : correct ? 100 : 0,
      );
      if (res?.leveled_up) setNewLevel(res.new_level);
      if (res?.coins_earned) setCoinsEarned((c) => c + res.coins_earned);
      // The screen already rendered with the local xp estimate above; merge
      // in the server-confirmed coins (and level-up, for this exact card —
      // `newLevel` state only reaches FinishedAllCard/ClipList) once the RPC
      // returns. Guarded on dialogue identity: a fast learner can already be
      // on the next clip by the time this resolves.
      setDone((prev) =>
        prev && prev.dialogue.id === dialogue.id
          ? { ...prev, coinsEarned: res?.coins_earned ?? 0, newLevel: res?.leveled_up ? res.new_level : null }
          : prev
      );
    }
  }

  // Left a clip before finishing it: pay out XP for the lines actually
  // heard so far, proportional to the dialogue's full reward.
  async function awardListeningPartial(dialogue: Dialogue, heard: number) {
    if (completed.has(dialogue.id) || heard <= 0) return;
    const ratio = heard / dialogue.lines.length;
    const awardedRatio = loadAwardedRatio(dialogue.id);
    if (!(await getClientUserId(supabase))) return;
    const { newAwardedRatio, result } = await awardPartialCredit(
      supabase,
      "listening",
      ratio,
      awardedRatio,
      listeningDialogueKey(dialogue.id),
      // Listening partway through has no quiz answer to score, and null
      // never fails the accuracy gate — there was nothing to get wrong.
      null,
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
        levelUp={{ leveled_up: newLevel !== null, new_level: newLevel ?? 0, coins_earned: coinsEarned, new_xp: 0 }}
        onBackToClips={() => setJustFinishedAll(false)}
      />
    );
  }

  if (done) {
    const idx = dialogues.indexOf(done.dialogue);
    const next = dialogues.slice(idx + 1).find((d) => !completed.has(d.id)) ?? dialogues.find((d) => !completed.has(d.id)) ?? null;
    return (
      <>
      {saveFailed && (
        <p
          role="status"
          className="max-w-[680px] mb-3 rounded-[10px] border border-amber-line bg-[var(--tint-amber)] px-4 py-2.5 text-[13px] text-charcoal"
        >
          {tSave("saveFailed")}
        </p>
      )}
      <ClipDone
        dialogue={done.dialogue}
        clipNo={idx + 1}
        clipCount={dialogues.length}
        situationLabel={situation.label}
        situationIcon={situation.icon}
        level={level}
        correct={done.correct}
        xp={done.xp}
        coinsEarned={done.coinsEarned}
        newLevel={done.newLevel}
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
      </>
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
