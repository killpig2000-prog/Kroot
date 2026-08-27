// A static preview of the Pronunciation Trail — the prompt card you say
// into the mic, and the score card that follows. Copy mirrors the real UI
// (see PronunciationChallenge.tsx) but this isn't live/interactive — it's a
// snapshot of the flow, not a working demo.
export default function PronunciationDemo() {
  return (
    <section className="bg-warm border-t border-dashed border-dash py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-white border-[1.5px] border-dashed border-[#CFC8B8] rounded-full px-4 py-[5px] text-xs font-extrabold text-teal -rotate-1">
          pronunciation trail · <span className="kr">발음 도장깨기</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-[#221F1B] mb-2 text-balance">
        Say it out loud. The mic keeps score.
      </h2>
      <p className="text-center text-muted text-[13.5px] max-w-[52ch] mx-auto mb-9">
        23 chapters of the sounds English speakers actually trip on — from ㄹ to double consonants.
        Nail a word at 80+ and it&apos;s cleared for good.
      </p>

      <div className="flex justify-center items-center gap-4 flex-wrap max-w-[820px] mx-auto">
        {/* prompt card */}
        <div className="w-[min(320px,100%)] bg-white border border-line rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] -rotate-1">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-teal bg-[#F0FDFA] border border-[#99F6E4] rounded-full px-3 py-1">
              🌶️ Spicy · ㄹ chapter
            </span>
            <span className="text-[11px] font-bold text-faint">best 92</span>
          </div>

          <p className="kr text-center text-[44px] font-bold leading-none mb-1">라면</p>
          <p className="text-center text-[13px] text-[#8A8478] mb-4">ramyeon · instant noodles</p>

          <p className="text-[11.5px] text-[#4A453D] bg-[#F0FDFA] border border-dashed border-[#99F6E4] rounded-[10px] px-3 py-2.5 leading-[1.6] mb-4">
            💡 Tap the tip of your tongue once against the ridge behind your top teeth — closer to
            the &apos;tt&apos; in &apos;butter&apos; than an English R or L.
          </p>

          <div className="flex justify-center">
            <span className="w-[58px] h-[58px] rounded-full bg-teal text-white grid place-items-center text-[22px] shadow-[0_4px_0_#0f766e]">
              🎤
            </span>
          </div>
        </div>

        <span aria-hidden="true" className="text-[26px] text-[#CFC8B8] rotate-90 sm:rotate-0">→</span>

        {/* result card */}
        <div className="w-[min(320px,100%)] bg-white border border-success-line rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] rotate-1">
          <p className="text-[11px] font-extrabold tracking-[.05em] uppercase text-faint mb-4 text-center">
            Result
          </p>
          <div className="flex flex-col items-center gap-2.5 mb-4">
            <p className="text-[40px] leading-none">🎉</p>
            <div className="w-full h-2 rounded-full bg-[#F3EEE1] overflow-hidden">
              <span className="block h-full w-[92%] rounded-full bg-gradient-to-r from-teal to-success" />
            </div>
            <p className="font-bold text-success-deep text-[16px]">🔥 Nailed it! · 92</p>
            <p className="text-[11px] text-faint">heard: &quot;라면&quot; · +12 XP</p>
          </div>
          <p className="text-center text-[11.5px] text-muted border-t border-dashed border-line pt-3">
            📊 23 chapters across <b className="text-teal">5 tiers</b> — 🌱 Warm-up to 👑 Legendary. Score 80+
            to clear one for good.
          </p>
        </div>
      </div>
    </section>
  );
}
