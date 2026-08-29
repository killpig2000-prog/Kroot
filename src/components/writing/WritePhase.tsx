import { WRITING_GENRE_META, type Prompt } from "@/lib/writing";

const CARD = "border border-line rounded-[14px] bg-cream max-w-[900px]";
const LABEL = "text-[11.5px] font-semibold tracking-[.1em] uppercase text-faint";
const BTN_INK =
  "rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint";

export default function WritePhase({
  prompt,
  chapterIndex,
  response,
  setResponse,
  showHint,
  setShowHint,
  submitting,
  ready,
  onSubmit,
}: {
  prompt: Prompt;
  chapterIndex: number;
  response: string;
  setResponse: (v: string) => void;
  showHint: boolean;
  setShowHint: (v: boolean) => void;
  submitting: boolean;
  ready: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* left page — the prompt */}
        <div className="p-[clamp(20px,3vw,32px)] flex flex-col border-b md:border-b-0 md:border-r border-dashed border-line">
          <p className={`${LABEL} mb-5`}>
            Page {chapterIndex + 1} ·{" "}
            <b className="text-amber font-semibold">
              {WRITING_GENRE_META[prompt.genre].icon} {WRITING_GENRE_META[prompt.genre].label}
            </b>
          </p>
          {prompt.stimulus_kr && (
            <div className="mb-4 flex gap-2.5 items-start">
              <span className="flex-none w-8 h-8 rounded-full bg-[#EFF6FF] border border-sky-line flex items-center justify-center text-[15px]">
                💬
              </span>
              <div className="rounded-[14px] rounded-tl-[4px] bg-[#F4F4F5] border border-[#E4E4E7] px-4 py-3 max-w-[92%]">
                <p className="kr text-[15px] leading-[1.75] text-charcoal">{prompt.stimulus_kr}</p>
                {prompt.stimulus_en && (
                  <p className="text-[12.5px] text-muted leading-[1.6] mt-1.5">{prompt.stimulus_en}</p>
                )}
              </div>
            </div>
          )}
          <p className="font-bold text-[clamp(19px,2.2vw,24px)] leading-[1.45] tracking-[-0.02em] mb-3">
            <span className="text-amber">“</span>
            {prompt.prompt_en}
            <span className="text-amber">”</span>
          </p>
          <p className="kr text-[15px] text-muted leading-[1.8] mb-auto">{prompt.prompt_kr}</p>

          <div className="border border-dashed border-line rounded-[10px] bg-warm px-4 py-3.5 mt-6">
            <div className="flex items-center justify-between gap-3 text-[12.5px] font-semibold text-muted">
              <span>Stuck on a word?</span>
              <button
                className="text-[12.5px] font-semibold text-amber hover:underline"
                onClick={() => setShowHint(!showHint)}
              >
                {showHint ? "Hide hint" : "💡 Peek at a hint"}
              </button>
            </div>
            {showHint && (
              <p
                className="kr text-[15px] text-amber mt-2 leading-[1.7]"
                style={{ animation: "fadeUp .3s ease" }}
              >
                {prompt.example_kr}
              </p>
            )}
          </div>
        </div>

        {/* right page — your answer */}
        <div className="p-[clamp(20px,3vw,32px)] flex flex-col">
          <p className={`${LABEL} mb-3.5`}>Your answer</p>
          <div
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent 0 31px, #F0EEEA 31px 32px)",
            }}
          >
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="한국어로 써보세요..."
              rows={5}
              spellCheck={false}
              className="kr w-full min-h-[160px] resize-none bg-transparent border-none px-0.5 text-[17px] leading-[32px] text-charcoal placeholder:text-[#C9C2B2] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-3.5 mt-auto flex-wrap">
            <span className="text-xs text-faint">
              {ready ? "Ready when you are ✍️" : "Write a little more…"}
            </span>
            <button className={BTN_INK} onClick={onSubmit} disabled={submitting || !ready}>
              {submitting ? "Saving…" : "Check my sentence"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
