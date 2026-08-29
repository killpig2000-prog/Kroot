// A static preview of the Writing flow — the prompt you're given, and the
// AI's graded result that follows. Copy mirrors the real UI (see
// WritingSession.tsx) but this isn't live/interactive — it's a snapshot of
// the flow, not a working demo.
export default function WritingFeedbackDemo() {
  return (
    <section className="bg-cream border-t border-dashed border-dash py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-cream border-[1.5px] border-dashed border-dash rounded-full px-4 py-[5px] text-xs font-extrabold text-amber rotate-1">
          AI corrections · <span className="kr">첨삭</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-charcoal mb-2 text-balance">
        Write a sentence. Get told exactly what to fix.
      </h2>
      <p className="text-center text-muted text-[13.5px] max-w-[52ch] mx-auto mb-9">
        Not just right or wrong — a natural rewrite, a grammar score, and a one-line reason, every
        single time you write.
      </p>

      <div className="flex justify-center items-start gap-4 flex-wrap max-w-[880px] mx-auto">
        {/* prompt card */}
        <div className="w-[min(340px,100%)] bg-cream border border-line rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] -rotate-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-amber bg-[var(--tint-amber)] border border-amber-line rounded-full px-3 py-1 mb-4">
            ✍️ Writing · reply prompt
          </span>

          <div className="flex gap-2.5 items-start mb-4">
            <span className="flex-none w-7 h-7 rounded-full bg-[var(--tint-sky)] border border-sky-line flex items-center justify-center text-[13px]">
              💬
            </span>
            <div className="rounded-[14px] rounded-tl-[4px] bg-[var(--tint-stone)] border border-[var(--tint-stone-line)] px-3.5 py-2.5">
              <p className="kr text-[13.5px] leading-[1.65] text-charcoal">
                어제 뭐 했어요? 저는 친구를 만났어요!
              </p>
              <p className="text-[11px] text-muted leading-[1.5] mt-1">
                What did you do yesterday? I met a friend!
              </p>
            </div>
          </div>

          <p className="text-[11px] font-extrabold text-faint tracking-[.05em] uppercase mb-1.5">
            Your answer
          </p>
          <p className="kr text-[15px] leading-[1.7] text-charcoal border border-dashed border-line rounded-[10px] px-4 py-3 min-h-[62px]">
            저는 어제 친구를 만나고 영화를 봤어요.
          </p>
        </div>

        <span aria-hidden="true" className="text-[26px] text-[#CFC8B8] rotate-90 sm:rotate-0 sm:mt-16">→</span>

        {/* result card */}
        <div className="w-[min(340px,100%)] bg-cream border border-success-line rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] rotate-1">
          <p className="text-[11px] font-extrabold tracking-[.05em] uppercase text-faint mb-3 text-center">
            Result
          </p>

          <p className="text-[11px] font-extrabold text-faint tracking-[.05em] uppercase mb-1.5">
            Natural way to say it
          </p>
          <p className="kr text-[15px] font-medium leading-[1.6] text-success bg-success-bg border border-success-line rounded-[10px] px-4 py-3 mb-4">
            저는 어제 친구를 만나서 영화를 봤어요.
          </p>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-lg border border-amber-line bg-warm px-2.5 py-1 text-muted">
              Grammar <b className="text-charcoal">88</b>/100
            </span>
          </div>
          <p className="text-[12px] text-muted leading-[1.6] mb-4">
            Good sentence! Use <span className="kr text-charcoal font-semibold">-아서/어서</span>{" "}
            instead of <span className="kr text-charcoal font-semibold">-고</span> when the second
            action happens because of the first — it reads more natural here.
          </p>
          <p className="text-center text-[11.5px] text-muted border-t border-dashed border-line pt-3">
            📊 4 genres per level — <b className="text-amber">journal, replies, description, opinion</b> —
            A1 through C2.
          </p>
        </div>
      </div>
    </section>
  );
}
