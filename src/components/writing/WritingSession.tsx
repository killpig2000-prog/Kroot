"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSaveResume } from "@/hooks/useSaveResume";
import { clearResume, isColumnMissing } from "@/lib/resume";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { track } from "@/lib/analytics";
import { MINUTES_PER_CHAPTER, type Prompt } from "@/lib/writing";
import { buildBoard, checkTiles, hashString, localScore, tilesText, type Board } from "@/lib/writing-builder";
import type { CefrLevel } from "@/lib/tree";
import WritePhase, { emptyEntry, entryDone, type Entry } from "@/components/writing/WritePhase";
import CompareResult, { type Answer } from "@/components/writing/CompareResult";

type Phase = "write" | "compare";

const CARD = "border border-line rounded-[14px] bg-cream max-w-[900px]";
const BTN_INK =
  "rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint";

export default function WritingSession({
  prompts,
  siblings = [],
  userId,
  level,
  chapterIndex,
  hasNextChapter,
}: {
  prompts: Prompt[];
  /** Same level + genre, outside this chapter — distractor pool for the boards. */
  siblings?: Prompt[];
  userId: string;
  level: CefrLevel;
  chapterIndex: number;
  hasNextChapter: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const tc = useTranslations("writing");

  const [phase, setPhase] = useState<Phase>("write");
  useSaveResume(phase === "write" ? userId : null, {
    skill: "writing",
    href: "",
    label: tc("session.chapterN", { n: chapterIndex + 1 }),
    detail: `${tc("crumb")} · ${tc("session.chapterN", { n: chapterIndex + 1 })} · ${level}`,
  });

  // Boards are deterministic per (prompt, attempt), so the server and the
  // first client render agree.
  const [entries, setEntries] = useState<Entry[]>(() => prompts.map(() => emptyEntry()));
  const pool = useMemo(() => [...prompts, ...siblings], [prompts, siblings]);
  const poolWords = useMemo(() => pool.flatMap((s) => s.example_kr.split(/\s+/)), [pool]);
  const boards = useMemo<Board[]>(
    () => prompts.map((p, i) => buildBoard(p, poolWords, hashString(`${p.key}:${entries[i].attempt}`))),
    [prompts, poolWords, entries]
  );

  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const [result, setResult] = useState<{ score: number; answers: Answer[] } | null>(null);
  const loggedMinutes = useRef(false);

  function update(index: number, patch: Partial<Entry>) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function check(index: number) {
    const board = boards[index];
    const entry = entries[index];
    const ok = checkTiles(board, entry.picked);
    const checks = entry.checks + 1;
    update(index, { checked: ok, checks });
    track("activity_completed", { kind: "writing_check", right: ok, checks });
  }

  function shuffle(index: number) {
    update(index, { attempt: entries[index].attempt + 1, picked: [], checked: null });
  }

  const answeredCount = entries.filter((e) => entryDone(e)).length;
  const ready = answeredCount === prompts.length;

  async function submit() {
    if (!ready) return;
    setSubmitting(true);

    const answers: Answer[] = prompts.map((_, i) => ({
      index: i,
      score: localScore(entries[i].checks),
      text: tilesText(boards[i], entries[i].picked),
      checks: entries[i].checks,
    }));
    const score = Math.round(answers.reduce((s, a) => s + a.score, 0) / answers.length);

    track("writing_chapter_submitted", {
      level,
      questions: prompts.length,
      retries: entries.reduce((s, e) => s + Math.max(0, e.checks - 1), 0),
    });

    const completedAt = new Date().toISOString();
    const rows = answers.map((a, i) => ({
      user_id: userId,
      prompt_key: prompts[i].key,
      response_text: a.text,
      completed_at: completedAt,
      score: a.score,
    }));
    const { error } = await supabase.from("writing_progress").upsert(rows, { onConflict: "user_id,prompt_key" });
    if (error && isColumnMissing(error)) {
      // Migration 0037 (writing_progress.score) hasn't run here yet — retry without it.
      await supabase.from("writing_progress").upsert(
        rows.map((r) => ({ user_id: r.user_id, prompt_key: r.prompt_key, response_text: r.response_text, completed_at: r.completed_at })),
        { onConflict: "user_id,prompt_key" }
      );
    }

    setResult({ score, answers });
    await logMinutesOnce();
    setSubmitting(false);
    setPhase("compare");
  }

  async function logMinutesOnce() {
    if (loggedMinutes.current) return;
    loggedMinutes.current = true;
    void clearResume(supabase, userId);

    const res = await recordCompletion(supabase, "writing", MINUTES_PER_CHAPTER);
    if (res?.leveled_up) setLevelUp(res);
  }

  async function goTo(href: string) {
    setNavigating(true);
    await logMinutesOnce();
    router.push(href);
    router.refresh();
  }

  if (phase === "write") {
    return (
      <WritePhase
        prompts={prompts}
        chapterIndex={chapterIndex}
        entries={entries}
        boards={boards}
        update={update}
        onCheck={check}
        onShuffle={shuffle}
        submitting={submitting}
        ready={ready}
        answeredCount={answeredCount}
        onSubmit={submit}
      />
    );
  }

  return (
    <CompareResult
      prompts={prompts}
      answers={result!.answers}
      score={result!.score}
      levelUp={levelUp}
      level={level}
      chapterIndex={chapterIndex}
      hasNextChapter={hasNextChapter}
      navigating={navigating}
      onGoTo={goTo}
    />
  );
}

export function WritingEmpty() {
  const t = useTranslations("writing.session");
  return (
    <div className={`${CARD} px-7 py-10 text-center`}>
      <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">{t("emptyTitle")}</h2>
      <p className="text-sm text-muted mb-6">{t("emptyBody")}</p>
      <Link href="/writing" className={BTN_INK}>
        {t("backToAll")}
      </Link>
    </div>
  );
}
