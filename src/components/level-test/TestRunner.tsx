"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import {
  COOLDOWN_HOURS,
  servedKeysOf,
  testVerdict,
  type ServedPromotionTest,
  type SkillScores,
} from "@/lib/promotion-test";
import { buildBoard, checkTiles, hashString, localScore, tilesText, type Board } from "@/lib/writing-builder";
import { TileBoard } from "@/components/writing/WritingBoards";
import Mcq from "@/components/level-test/Mcq";
import ResultStage from "@/components/level-test/ResultStage";

// The promotion test: listening MCQ → reading MCQ → writing (tile boards,
// checked locally, same mechanic as the Writing feature) → verdict. No AI,
// no speaking section. Pass → apply_level_test RPC.

type Stage = "intro" | "listening" | "reading" | "writing" | "result";

const BTN_GREEN = buttonClassName("success");

type WritingEntry = { attempt: number; picked: string[]; checked: boolean | null; checks: number };
const emptyWritingEntry = (): WritingEntry => ({ attempt: 0, picked: [], checked: null, checks: 0 });

export default function TestRunner({
  userId,
  spec,
  playerLevel = 1,
}: {
  userId: string;
  spec: ServedPromotionTest;
  /** Numeric Lv.1-30 — sizes the tree in the pass animation. */
  playerLevel?: number;
}) {
  const t = useTranslations("levelTest.runner");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const totalReadingQuestions = spec.reading.reduce((n, set) => n + set.questions.length, 0);

  const [stage, setStage] = useState<Stage>("intro");
  const [listeningCorrect, setListeningCorrect] = useState(0);
  const [readingSet, setReadingSet] = useState(0);
  const [readingCorrect, setReadingCorrect] = useState(0);
  const [writingEntries, setWritingEntries] = useState<WritingEntry[]>(() => spec.writing.map(() => emptyWritingEntry()));
  const [scores, setScores] = useState<SkillScores | null>(null);
  const [promoted, setPromoted] = useState(false);

  const poolWords = useMemo(() => spec.writing.flatMap((p) => p.example_kr.split(/\s+/)), [spec.writing]);
  const writingBoards = useMemo<Board[]>(
    () => spec.writing.map((p, i) => buildBoard(p, poolWords, hashString(`${p.key}:${writingEntries[i].attempt}`))),
    [spec.writing, poolWords, writingEntries]
  );

  function updateWriting(index: number, patch: Partial<WritingEntry>) {
    setWritingEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }
  function checkWriting(index: number) {
    const ok = checkTiles(writingBoards[index], writingEntries[index].picked);
    updateWriting(index, { checked: ok, checks: writingEntries[index].checks + 1 });
  }
  function shuffleWriting(index: number) {
    updateWriting(index, { attempt: writingEntries[index].attempt + 1, picked: [], checked: null });
  }
  const writingDone = writingEntries.filter((e) => e.checked === true).length;

  async function finish() {
    const writingScore = Math.round(
      writingEntries.reduce((s, e) => s + localScore(e.checks), 0) / writingEntries.length
    );
    const skillScores: SkillScores = {
      listening: Math.round((listeningCorrect / spec.listening.length) * 100),
      reading: Math.round((readingCorrect / totalReadingQuestions) * 100),
      writing: writingScore,
    };
    setScores(skillScores);

    const verdict = testVerdict(skillScores);
    const row = {
      user_id: userId,
      result_level: verdict.passed ? spec.to : spec.from,
      score: verdict.avg,
      total_questions: 100,
      details: {
        ...skillScores,
        passed: verdict.passed,
        weakest: verdict.weakest,
        target_level: spec.to,
        servedKeys: servedKeysOf(spec),
      },
    };
    // details column arrives with migration 0014; fall back without it.
    const ins = await supabase.from("level_test_results").insert(row);
    if (ins.error) {
      const { details: _details, ...basic } = row;
      void _details;
      await supabase.from("level_test_results").insert(basic);
    }

    track("level_test_finished", { from: spec.from, to: spec.to, passed: verdict.passed, score: verdict.avg });

    if (verdict.passed) {
      const { error: applyErr } = await supabase.rpc("apply_level_test", { p_level: spec.to });
      if (!applyErr) {
        setPromoted(true);
        // The big evolution moment happens right here — don't repeat the
        // dashboard's promotion banner on top of it. Guarded because storage
        // throws in private mode: worst case the learner sees the banner
        // twice, which is far better than losing a passed promotion.
        try {
          localStorage.setItem("kroot-tree-species", spec.to);
        } catch {
          // storage blocked — the dashboard will just congratulate them again
        }
      }
      router.refresh();
    }
    setStage("result");
  }

  if (stage === "intro") {
    return (
      <div className="border border-line rounded-[14px] p-6">
        <b className="block text-[16px] mb-1.5">
          {t("introTitle", { from: spec.from, to: spec.to })}
        </b>
        <p className="text-[13.5px] text-muted mb-3">
          {t("introBody", {
            listening: spec.listening.length,
            questions: totalReadingQuestions,
            passages: spec.reading.length,
            writing: spec.writing.length,
          })}
        </p>
        <p className="text-[12.5px] text-faint mb-4">
          {t("passRule", { hours: COOLDOWN_HOURS })}
        </p>
        <button onClick={() => setStage("listening")} className={BTN_GREEN}>
          {t("start")}
        </button>
      </div>
    );
  }

  if (stage === "listening") {
    return (
      <div className="border border-line rounded-[14px] p-6">
        <Mcq
          title={t("listeningTitle")}
          questions={spec.listening}
          showKr={false}
          onDone={(c) => {
            setListeningCorrect(c);
            setStage("reading");
          }}
        />
      </div>
    );
  }

  if (stage === "reading") {
    const set = spec.reading[readingSet];
    return (
      <div className="border border-line rounded-[14px] p-6">
        <Mcq
          key={readingSet}
          title={t("readingTitle", { n: readingSet + 1, total: spec.reading.length })}
          questions={set.questions}
          showKr
          passage={set.passage}
          onDone={(c) => {
            setReadingCorrect((total) => total + c);
            if (readingSet + 1 < spec.reading.length) setReadingSet(readingSet + 1);
            else setStage("writing");
          }}
        />
      </div>
    );
  }

  if (stage === "writing") {
    return (
      <div className="border border-line rounded-[14px] p-6">
        <p className="text-[11px] font-bold tracking-[.07em] uppercase text-faint mb-2">
          {t("writingProgress", { done: writingDone, total: spec.writing.length })}
        </p>
        <div className="grid gap-5">
          {spec.writing.map((p, i) => (
            <div key={p.key} className={i > 0 ? "pt-5 border-t border-dashed border-line" : ""}>
              <p className="kr font-bold text-[15.5px] mb-1">{p.prompt_kr}</p>
              <p className="text-[13px] text-muted mb-2">{p.example_en}</p>
              <TileBoard
                board={writingBoards[i]}
                picked={writingEntries[i].picked}
                checked={writingEntries[i].checked}
                onChange={(picked) => updateWriting(i, { picked, checked: null })}
                onCheck={() => checkWriting(i)}
                onShuffle={() => shuffleWriting(i)}
              />
            </div>
          ))}
        </div>
        <div className="mt-5">
          <button onClick={finish} disabled={writingDone < spec.writing.length} className={BTN_GREEN}>
            {t("seeResults")}
          </button>
        </div>
      </div>
    );
  }

  return <ResultStage spec={spec} scores={scores} promoted={promoted} playerLevel={playerLevel} />;
}

// tilesText is used implicitly by localScore-based scoring only — kept as an
// import so future stages (e.g. reviewing a wrong answer) can rebuild text
// without re-deriving the board.
export { tilesText };
