import { WRITING_GENRE_META, MIN_RESPONSE_LENGTH, type Prompt } from "@/lib/writing";

const CARD = "border border-line rounded-[16px] bg-cream max-w-[900px] overflow-hidden";
const BTN_INK =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint";

export default function WritePhase({
  prompts,
  chapterIndex,
  responses,
  setResponse,
  submitting,
  ready,
  answeredCount,
  onSubmit,
}: {
  prompts: Prompt[];
  chapterIndex: number;
  responses: string[];
  setResponse: (index: number, v: string) => void;
  submitting: boolean;
  ready: boolean;
  answeredCount: number;
  onSubmit: () => void;
}) {
  const genreMeta = WRITING_GENRE_META[prompts[0].genre];

  return (
    <div className={CARD}>
      {/* head */}
      <div className="p-[clamp(20px,3vw,32px)] pb-5 border-b border-dashed border-line bg-cream grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber bg-[var(--tint-amber)] border border-amber-line px-2.5 py-1 rounded-full mb-2.5">
            {genreMeta.icon} {genreMeta.label}
          </span>
          <h1 className="font-extrabold text-[22px] sm:text-[24px] tracking-[-0.02em]" style={{ textWrap: "balance" }}>
            Chapter {chapterIndex + 1}
          </h1>
          <p className="text-[13.5px] text-muted mt-1">
            {prompts.length}개 질문에 답하면 한 번에 채점해 드려요.
          </p>
        </div>
        <div className="max-w-[260px] text-[12.5px] leading-[1.55] text-success bg-success-bg border border-success-line rounded-[12px] px-3 py-2.5">
          <b className="block text-[13px] text-success-deep mb-0.5">💡 더 많이 쓸수록 더 정확해요</b>
          질문마다 1–2문장이면 공통 패턴까지 잡아 드릴 수 있어요.
        </div>
      </div>

      {/* questions */}
      <div className="flex flex-col">
        {prompts.map((prompt, i) => {
          const value = responses[i] ?? "";
          const answered = value.trim().length >= MIN_RESPONSE_LENGTH;
          return (
            <div
              key={prompt.key}
              className={`grid grid-cols-1 sm:grid-cols-[56px_1fr] gap-x-4 px-5 sm:px-[clamp(20px,3vw,32px)] py-[22px] ${
                i > 0 ? "border-t border-line" : ""
              }`}
            >
              <div className="text-[13px] font-extrabold text-amber tracking-[.02em] pt-[3px] mb-2 sm:mb-0">
                Q{i + 1}
                <small className="block text-[10.5px] text-faint font-semibold tracking-[.08em] mt-0.5">
                  OF {prompts.length}
                </small>
              </div>
              <div>
                {prompt.stimulus_kr && (
                  <div className="mb-3 flex gap-2 items-start">
                    <span className="flex-none w-7 h-7 rounded-full bg-[var(--tint-sky)] border border-sky-line flex items-center justify-center text-[13px]">
                      💬
                    </span>
                    <div className="rounded-[12px] rounded-tl-[4px] bg-warm border border-line px-3.5 py-2.5 max-w-[92%]">
                      <p className="kr text-[13.5px] leading-[1.65] text-charcoal">{prompt.stimulus_kr}</p>
                      {prompt.stimulus_en && (
                        <p className="text-[11.5px] text-muted leading-[1.5] mt-1">{prompt.stimulus_en}</p>
                      )}
                    </div>
                  </div>
                )}
                <p className="kr font-bold text-[17px] leading-[1.4] mb-0.5">{prompt.prompt_kr}</p>
                <p className="text-[13px] text-muted mb-3">{prompt.prompt_en}</p>
                <div
                  className="rounded-lg"
                  style={{
                    backgroundImage: "repeating-linear-gradient(transparent 0 31px, var(--color-warm-3) 31px 32px)",
                  }}
                >
                  <textarea
                    value={value}
                    onChange={(e) => setResponse(i, e.target.value)}
                    placeholder={`예: ${prompt.example_kr}`}
                    rows={2}
                    spellCheck={false}
                    className="kr w-full min-h-[64px] resize-none bg-transparent border-none px-1 text-[15px] leading-[32px] text-charcoal placeholder:text-faint focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-xs">
                  <span className={answered ? "text-success font-semibold" : "text-faint"}>
                    {answered ? "✓ 작성 완료" : "아직 비어 있어요"}
                  </span>
                  <span className="text-faint tabular-nums">{value.length} / 500</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-[clamp(20px,3vw,32px)] py-[18px] border-t border-line bg-cream flex-wrap">
        <div className="flex items-center gap-2.5 text-[13px] text-muted">
          <span className="flex gap-1.5">
            {prompts.map((p, i) => (
              <i
                key={p.key}
                className={`w-2.5 h-2.5 rounded-full ${
                  (responses[i]?.trim().length ?? 0) >= MIN_RESPONSE_LENGTH ? "bg-success" : "bg-line"
                }`}
              />
            ))}
          </span>
          {answeredCount} / {prompts.length} 답변 완료
        </div>
        <button className={BTN_INK} onClick={onSubmit} disabled={submitting || !ready}>
          {submitting ? "Saving…" : "제출 & 피드백 받기"}
        </button>
      </div>
    </div>
  );
}
