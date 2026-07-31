import Link from "next/link";

const POINTS = [
  {
    title: "Optional, always",
    desc: "Not ready? Begin at A1 and retake it from your profile whenever you like.",
  },
  {
    title: "Mixed & quick",
    desc: "Vocabulary, grammar, and listening — about 18 seconds per question.",
  },
  {
    title: "An honest level",
    desc: "Placed on the CEFR scale used by learners and employers worldwide.",
  },
];

const OPTIONS = ["It's okay / I'm fine", "It's expensive", "See you tomorrow", "I don't know"];

export default function LevelTest() {
  return (
    <section className="border-y border-[#E7E5E4] bg-[#FAFAF9] py-[clamp(56px,8vw,96px)]">
      <div className="max-w-[1080px] mx-auto px-[clamp(18px,4vw,28px)]">
        <div className="max-w-[560px] mb-[clamp(30px,4.5vw,48px)]">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.06em] text-[#16A34A] mb-3">
            Find your level
          </span>
          <h2 className="font-extrabold text-[clamp(25px,3.2vw,36px)] leading-[1.2] tracking-[-0.025em] text-[#18181B]">
            Three minutes.
            <br />
            Your true starting point.
          </h2>
          <p className="text-[#71717A] mt-3 text-[15px]">
            Ten quick questions place you on the CEFR scale (A1–C2). Or skip it, start at A1, and
            test anytime later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(24px,4vw,56px)] items-center">
          <div className="reveal border border-[#E7E5E4] rounded-[14px] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            <p className="text-[12.5px] font-semibold text-[#A1A1AA] mb-2.5">
              Question 3 of 10 · Vocabulary
            </p>
            <p className="kr text-[28px] text-[#18181B] mb-4">&quot;괜찮아요&quot;</p>
            <div className="grid gap-[9px]">
              {OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className="px-[15px] py-3 rounded-[10px] text-sm font-medium text-left bg-white border-[1.5px] border-[#E7E5E4] text-[#18181B] transition-all hover:border-[#16A34A] hover:bg-[#F0FDF4]"
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-3.5 text-xs text-[#A1A1AA] font-medium">
              <span>~3 min total</span>
              <span>●●●○○○○○○○</span>
            </div>
          </div>

          <div className="reveal">
            <ul className="grid gap-4 list-none mb-[26px]">
              {POINTS.map((p, i) => (
                <li key={p.title} className="flex gap-[13px] items-start">
                  <span className="flex-none w-[26px] h-[26px] mt-0.5 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center text-[12.5px] font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <b className="block text-[15px] font-semibold text-[#18181B]">{p.title}</b>
                    <span className="text-[#71717A] text-[13.5px]">{p.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-[10px] bg-[#16A34A] px-[26px] py-[13px] text-[14.5px] font-semibold text-white hover:bg-[#15803D] transition-colors"
            >
              Start the level test
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
