import { Link } from "@/i18n/navigation";

const OPTIONS = [
  { label: "It's okay / I'm fine", on: true },
  { label: "It's expensive", on: false },
  { label: "See you tomorrow", on: false },
];

export default function LevelTest() {
  return (
    <section className="relative bg-[#FFFFFF] border-t border-dashed border-dash py-[clamp(52px,8vw,88px)] px-6 overflow-hidden">
      <span aria-hidden="true" className="absolute left-[8%] bottom-[40px] font-black text-[#F0EBDD] text-[80px] -rotate-[8deg] select-none">
        가
      </span>

      <div className="text-center mb-1.5">
        <span className="inline-block bg-white border-[1.5px] border-dashed border-[#CFC8B8] rounded-full px-4 py-[5px] text-xs font-extrabold text-success-deep -rotate-1">
          pop quiz · <span className="kr">쪽지시험</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-[#221F1B] mb-2 text-balance">
        Find your level in 3 minutes
      </h2>
      <p className="text-center text-muted text-[13.5px] max-w-[52ch] mx-auto mb-8">
        Ten questions find your level (A1–C2). Or skip it and start at A1 — retake it
        anytime from your profile.
      </p>

      <div className="relative max-w-[840px] mx-auto flex justify-center items-start gap-6 flex-wrap">
        {/* the quiz, on ruled paper */}
        <div
          className="relative z-10 w-[min(410px,100%)] bg-white border border-line px-6 pt-6 pb-5 -rotate-1 shadow-[0_18px_36px_-18px_rgba(60,50,30,.35)]"
          style={{ backgroundImage: "repeating-linear-gradient(#fff 0 27px,#F2EEE4 27px 28px)" }}
        >
          <span aria-hidden="true" className="absolute -top-2 left-1/2 -translate-x-1/2 -rotate-2 w-[64px] h-[17px] border z-10" style={{ background: "rgba(253,230,138,.6)", borderColor: "rgba(217,180,90,.45)" }} />
          <div className="flex justify-between items-baseline border-b-2 border-[#221F1B] pb-1.5 mb-3">
            <b className="text-[15px]">Level test · Q3</b>
            <span className="text-[11px] text-[#8A8478]">vocabulary</span>
          </div>
          <p className="text-sm font-bold mb-2.5 text-left">
            <span className="kr">&quot;괜찮아요&quot;</span> — what does it mean?
          </p>
          {OPTIONS.map((o) => (
            <span
              key={o.label}
              className={`block text-left text-[13px] rounded-[9px] px-3.5 py-2.5 mb-[7px] border-[1.5px] ${
                o.on ? "border-success bg-success-bg font-bold" : "border-line bg-[#FFFFFF]"
              }`}
            >
              <span
                className={`inline-block w-[15px] h-[15px] rounded-full border-2 mr-2 align-[-2px] ${
                  o.on ? "border-success bg-success" : "border-[#CFC8B8]"
                }`}
              />
              {o.label}
            </span>
          ))}
        </div>

        {/* sticky note + CTA */}
        <div className="relative z-10 w-[min(240px,100%)]">
          <div className="bg-[#FEF9C3] border border-[#ECD98A] px-4 py-3.5 text-[12px] leading-[1.55] rotate-2 shadow-[0_10px_22px_-12px_rgba(120,100,30,.4)] text-left mb-5">
            <b className="block mb-0.5">✏️ How it&apos;s scored</b>
            Vocabulary, grammar and listening mixed — about 18s per question. Results on the CEFR
            scale learners and employers actually use!
          </div>
          <Link
            href="/onboarding"
            className="inline-block rounded-[10px] bg-success px-[24px] py-3 text-sm font-bold text-white shadow-[0_5px_0_#15803D] hover:translate-y-[2px] hover:shadow-[0_3px_0_#15803D] transition-all"
          >
            Start the level test
          </Link>
        </div>
      </div>
    </section>
  );
}
