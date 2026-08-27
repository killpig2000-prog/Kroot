// A static preview of the AI corrections a Writing page shows after
// grading. Copy mirrors the real UI (see WritingSession.tsx) but this isn't
// live/interactive — it's a snapshot, not a working demo.
export default function WritingFeedbackDemo() {
  return (
    <section className="bg-[#FFFFFF] border-t border-dashed border-[#DDD6C8] py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-white border-[1.5px] border-dashed border-[#CFC8B8] rounded-full px-4 py-[5px] text-xs font-extrabold text-[#D97706] rotate-1">
          AI corrections · <span className="kr">첨삭</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-[#221F1B] mb-2 text-balance">
        Write a sentence. Get told exactly what to fix.
      </h2>
      <p className="text-center text-[#6B6560] text-[13.5px] max-w-[52ch] mx-auto mb-9">
        Not just right or wrong — a natural rewrite, a grammar score, and a one-line reason, every
        single time you write.
      </p>

      <div className="max-w-[420px] mx-auto bg-white border border-[#E3DDD0] rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] rotate-1">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A] rounded-full px-3 py-1 mb-4">
          ✍️ Writing · reply prompt
        </span>

        <p className="text-[11px] font-extrabold text-[#A19A8C] tracking-[.05em] uppercase mb-1.5">
          Your sentence
        </p>
        <p className="kr text-[15px] leading-[1.7] mb-4">저는 어제 친구를 만나고 영화를 봤어요.</p>

        <p className="text-[11px] font-extrabold text-[#A19A8C] tracking-[.05em] uppercase mb-1.5">
          Natural way to say it
        </p>
        <p className="kr text-[15px] font-medium leading-[1.6] text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-[10px] px-4 py-3 mb-4">
          저는 어제 친구를 만나서 영화를 봤어요.
        </p>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-lg border border-[#FDE68A] bg-[#FAF7EF] px-2.5 py-1 text-[#6B6560]">
            Grammar <b className="text-[#18181B]">88</b>/100
          </span>
        </div>
        <p className="text-[12px] text-[#6B6560] leading-[1.6]">
          Good sentence! Use <span className="kr text-[#221F1B] font-semibold">-아서/어서</span>{" "}
          instead of <span className="kr text-[#221F1B] font-semibold">-고</span> when the second
          action happens because of the first — it reads more natural here.
        </p>
      </div>
    </section>
  );
}
