import { Link } from "@/i18n/navigation";
import LevelCreature from "@/components/dashboard/LevelCreature";
import SpeechBubble from "@/components/ui/SpeechBubble";
import type { ProgressResult } from "@/lib/activity";
import type { Prompt } from "@/lib/writing";
import type { CefrLevel } from "@/lib/tree";

type GradeResult = {
  score: number;
  feedback_en: string;
  corrected_kr: string;
  /** Plus only: sentence-by-sentence corrections. */
  corrections?: { original: string; corrected: string; note: string }[];
};

const CARD = "border border-line rounded-[14px] bg-white max-w-[900px]";
const LABEL = "text-[11.5px] font-semibold tracking-[.1em] uppercase text-faint";
const BTN_AMBER =
  "rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-white bg-amber hover:bg-[#B45309] transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-charcoal bg-white border border-line hover:bg-warm transition-colors disabled:opacity-60";

function reactionFor(score: number) {
  if (score >= 90)
    return {
      anim: "cheer-wild",
      confetti: true,
      title: "Perfect!",
      verdict: "🌱 Natural! Beautifully written.",
      good: true,
      phrases: [
        { kr: "대박!! 천재예요!!", en: "you're a genius!!" },
        { kr: "완벽해요!!", en: "perfect!!" },
        { kr: "우와아아!!", en: "wooow!!" },
      ],
    };
  if (score >= 80)
    return {
      anim: "cheer-wild",
      confetti: true,
      title: "Amazing!",
      verdict: "🌱 Natural! Just about perfect.",
      good: true,
      phrases: [
        { kr: "정말 잘했어요!", en: "so well done!" },
        { kr: "최고예요!", en: "you're the best!" },
        { kr: "춤이 절로 나와요~", en: "I can't stop dancing~" },
      ],
    };
  if (score >= 50)
    return {
      anim: "cheer-big",
      confetti: false,
      title: "Nice work!",
      verdict: "💧 Almost — one small fix.",
      good: false,
      phrases: [
        { kr: "잘하고 있어요!", en: "you're doing great!" },
        { kr: "조금만 더!", en: "almost there!" },
        { kr: "쑥쑥 크고 있어요", en: "you're growing fast" },
      ],
    };
  return {
    anim: "cheer-sad",
    confetti: false,
    title: "Good try!",
    verdict: "💧 Let's fix this one together.",
    good: false,
    phrases: [
      { kr: "괜찮아요!", en: "it's okay!" },
      { kr: "같이 연습해요", en: "let's practice together" },
      { kr: "다음엔 할 수 있어요!", en: "you'll get it next time!" },
    ],
  };
}

export default function CompareResult({
  prompt,
  response,
  grade,
  limitMessage,
  levelUp,
  level,
  treeStage,
  species,
  costumeIds,
  chapterIndex,
  hasNextChapter,
  plus,
  navigating,
  onGoTo,
}: {
  prompt: Prompt;
  response: string;
  grade: GradeResult | null;
  limitMessage: string | null;
  levelUp: ProgressResult | null;
  level: CefrLevel;
  treeStage: CefrLevel;
  species?: CefrLevel;
  costumeIds?: string[];
  chapterIndex: number;
  hasNextChapter: boolean;
  plus: boolean;
  navigating: boolean;
  onGoTo: (href: string) => void;
}) {
  const reaction = grade ? reactionFor(grade.score) : null;

  return (
    <div className={`${CARD} p-[clamp(20px,3vw,32px)]`} style={{ animation: "fadeUp .4s ease" }}>
      {grade && reaction ? (
        <div className="text-center mb-6">
          <div className="relative w-[min(300px,80vw)] mx-auto pt-16">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
              <SpeechBubble phrases={reaction.phrases} large />
            </div>
            <svg viewBox="0 0 220 230" className="w-full h-auto overflow-visible" aria-hidden="true">
              {reaction.confetti && (
                <g fontSize="20">
                  <text className="confetti-pop" x="20" y="180">🎊</text>
                  <text className="confetti-pop d2" x="100" y="200">✨</text>
                  <text className="confetti-pop d3" x="180" y="180">🎉</text>
                </g>
              )}
              <g className={reaction.anim}>
                <LevelCreature level={treeStage} species={species} costumeIds={costumeIds} />
              </g>
            </svg>
          </div>

          <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-2 mb-3">{reaction.title}</h2>

          <div className="flex justify-center gap-3 flex-wrap mb-3.5">
            <span
              className={`inline-flex items-center gap-2 text-[13px] font-semibold rounded-lg border px-3 py-1.5 ${
                reaction.good
                  ? "bg-success-bg text-success border-success-line"
                  : "bg-[#FFFBEB] text-amber border-amber-line"
              }`}
            >
              {reaction.verdict}
            </span>
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold rounded-lg border border-line bg-warm px-3 py-1.5 text-muted">
              Grammar <b className="text-charcoal text-[15px]">{grade.score}</b> / 100
            </span>
          </div>

          <p className="text-sm text-muted max-w-[460px] mx-auto leading-[1.7]">
            {grade.feedback_en}
          </p>
        </div>
      ) : (
        <div className="text-center mb-6">
          <h2 className="font-bold text-[21px] tracking-[-0.02em] mb-1.5">Nice writing!</h2>
          <p className="text-sm text-muted">Here&apos;s one natural way to say it.</p>
          {limitMessage && (
            <div className="inline-flex items-center gap-2.5 border border-amber-line bg-[#FFFBEB] rounded-[10px] px-4 py-2.5 mt-3 text-left">
              <span className="text-base">🌟</span>
              <span className="text-[12.5px] text-[#92400E]">
                {limitMessage}{" "}
                <Link href="/pricing" className="font-semibold underline">
                  See Kroot Plus →
                </Link>
              </span>
            </div>
          )}
        </div>
      )}

      {levelUp && (
        <p className="text-center text-sm font-semibold text-success mb-6 -mt-3">
          🎉 Level up! You&apos;re now Lv. {levelUp.new_level}
        </p>
      )}

      <div className="grid gap-4 mb-6">
        <div>
          <p className={`${LABEL} mb-1.5`}>Your sentence</p>
          <p className="kr text-base leading-[1.7]">{response}</p>
        </div>
        <div>
          <p className={`${LABEL} mb-1.5`}>
            {grade ? "Natural way to say it" : "One way to say it"}
          </p>
          <p className="kr text-[17px] font-medium leading-[1.6] text-success bg-success-bg border border-success-line rounded-[10px] px-4 py-3">
            {grade ? grade.corrected_kr : prompt.example_kr}
          </p>
        </div>

        {/* Plus: sentence-by-sentence corrections */}
        {grade?.corrections && grade.corrections.length > 0 && (
          <div>
            <p className={`${LABEL} mb-1.5`}>🌟 Sentence by sentence</p>
            <div className="border border-amber-line rounded-[10px] overflow-hidden">
              {grade.corrections.map((c, i) => (
                <div
                  key={i}
                  className={`px-4 py-3 bg-[#FFFBEB] ${i > 0 ? "border-t border-amber-line" : ""}`}
                >
                  {c.original !== c.corrected && (
                    <p className="kr text-[14px] text-faint line-through leading-[1.6]">
                      {c.original}
                    </p>
                  )}
                  <p className="kr text-[15px] font-medium text-charcoal leading-[1.6]">
                    {c.corrected}
                  </p>
                  <p className="text-[12.5px] text-[#92400E] mt-1">{c.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2.5 flex-wrap border-t border-line pt-5">
        {hasNextChapter && !plus && !limitMessage && (
          <span className="mr-auto text-[12.5px] text-muted">
            🌙 That&apos;s today&apos;s page — the next one opens tomorrow.{" "}
            <Link href="/pricing" className="font-semibold text-amber hover:underline">
              Turn pages freely with Plus →
            </Link>
          </span>
        )}
        <button className={BTN_LINE} onClick={() => onGoTo("/dashboard")} disabled={navigating}>
          Back to Garden
        </button>
        <button className={BTN_LINE} onClick={() => onGoTo(`/writing?level=${level}`)} disabled={navigating}>
          {navigating ? "Saving…" : "All pages"}
        </button>
        {hasNextChapter && plus && (
          <button
            className={BTN_AMBER}
            onClick={() => onGoTo(`/writing/session?chapter=${chapterIndex + 1}&level=${level}`)}
            disabled={navigating}
          >
            {navigating ? "Saving…" : "Turn the page →"}
          </button>
        )}
      </div>
    </div>
  );
}
