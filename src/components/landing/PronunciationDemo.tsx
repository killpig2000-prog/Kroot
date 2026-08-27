// A static preview of the Pronunciation Trail's mic-scored challenge card.
// Copy mirrors the real UI (see PronunciationChallenge.tsx) but this isn't
// live/interactive — it's a snapshot, not a working demo.
export default function PronunciationDemo() {
  return (
    <section className="bg-[#FAF7EF] border-t border-dashed border-[#DDD6C8] py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-white border-[1.5px] border-dashed border-[#CFC8B8] rounded-full px-4 py-[5px] text-xs font-extrabold text-[#0D9488] -rotate-1">
          pronunciation trail · <span className="kr">발음 도장깨기</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-[#221F1B] mb-2 text-balance">
        Say it out loud. The mic keeps score.
      </h2>
      <p className="text-center text-[#6B6560] text-[13.5px] max-w-[52ch] mx-auto mb-9">
        23 chapters of the sounds English speakers actually trip on — from ㄹ to double consonants.
        Nail a word at 80+ and it&apos;s cleared for good.
      </p>

      <div className="max-w-[380px] mx-auto bg-white border border-[#E3DDD0] rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] -rotate-1">
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#0D9488] bg-[#F0FDFA] border border-[#99F6E4] rounded-full px-3 py-1">
            🌶️ Spicy · ㄹ chapter
          </span>
          <span className="text-[11px] font-bold text-[#A19A8C]">best 92</span>
        </div>

        <p className="kr text-center text-[44px] font-bold leading-none mb-1">라면</p>
        <p className="text-center text-[13px] text-[#8A8478] mb-4">ramyeon · instant noodles</p>

        <p className="text-[11.5px] text-[#4A453D] bg-[#F0FDFA] border border-dashed border-[#99F6E4] rounded-[10px] px-3 py-2.5 leading-[1.6] mb-4">
          💡 Tap the tip of your tongue once against the ridge behind your top teeth — closer to
          the &apos;tt&apos; in &apos;butter&apos; than an English R or L.
        </p>

        <div className="flex flex-col items-center gap-2.5">
          <span className="w-[58px] h-[58px] rounded-full bg-[#0D9488] text-white grid place-items-center text-[22px] shadow-[0_4px_0_#0f766e]">
            🎤
          </span>
          <div className="w-full h-2 rounded-full bg-[#F3EEE1] overflow-hidden">
            <span className="block h-full w-[92%] rounded-full bg-gradient-to-r from-[#0D9488] to-[#16A34A]" />
          </div>
          <p className="font-bold text-[#15803D] text-[14px]">🔥 Nailed it! · 92</p>
          <p className="text-[11px] text-[#A19A8C]">heard: &quot;라면&quot; · +12 XP</p>
        </div>
      </div>
    </section>
  );
}
