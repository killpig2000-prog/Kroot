import LevelCreature from "@/components/dashboard/LevelCreature";
import { LEVEL_ORDER, LEVEL_PATH } from "@/lib/tree";

// Photo sizes step up with the level so the clothesline itself reads as a
// growth curve, left to right.
const CARD = [
  { w: 118, h: 96, tilt: "-rotate-3", caption: "Day 1 — 쿨쿨… 안녕?" },
  { w: 128, h: 112, tilt: "rotate-2", caption: "Day 16 — 떡잎이 나왔어!" },
  { w: 140, h: 128, tilt: "-rotate-2", caption: "혼자 카페 주문 성공 ✌️" },
  { w: 152, h: 144, tilt: "rotate-2", caption: "드라마 자막 없이 🎬" },
  { w: 162, h: 158, tilt: "-rotate-1", caption: "벚꽃처럼 활짝 🌸" },
  { w: 172, h: 172, tilt: "rotate-1", caption: "한국 친구가 놀람 😲👑" },
];

export default function Growth() {
  return (
    <section id="grow" className="relative bg-[#FDFBF7] border-t border-dashed border-[#DDD6C8] py-[clamp(52px,8vw,88px)] px-6 overflow-hidden">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-white border-[1.5px] border-dashed border-[#CFC8B8] rounded-full px-4 py-[5px] text-xs font-extrabold text-[#15803D] -rotate-1">
          성장 앨범 · growth album
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-[#221F1B] mb-2 text-balance">
        당신의 나무는 매일 자라요
      </h2>
      <p className="text-center text-[#6B6560] text-[13.5px] max-w-[52ch] mx-auto mb-2">
        퀴즈 하나, 녹음 하나가 전부 물이 됩니다. 레벨이 오르면 나무도 한 뼘.
      </p>

      {/* clothesline */}
      <svg aria-hidden="true" className="absolute left-0 right-0 w-full h-[60px]" style={{ top: 208 }} viewBox="0 0 1000 60" preserveAspectRatio="none">
        <path d="M0 18 Q 250 44 500 30 T 1000 22" stroke="#C9BFA8" strokeWidth="2.5" fill="none" />
      </svg>

      <div className="relative z-10 flex justify-center items-end gap-4 flex-wrap mt-7 max-w-[1080px] mx-auto">
        {LEVEL_ORDER.map((lv, i) => {
          const c = CARD[i];
          return (
            <figure
              key={lv}
              className={`reveal relative m-0 bg-white border border-[#E3DDD0] p-[7px] pb-[26px] shadow-[0_14px_30px_-14px_rgba(60,50,30,.35)] ${c.tilt}`}
              style={{ width: c.w }}
            >
              <span aria-hidden="true" className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-3 h-[22px] bg-[#B98A4D] rounded-[3px] z-10" />
              <span className="absolute top-[11px] right-[11px] z-10 text-[9.5px] font-extrabold bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-[5px] px-1.5 py-px">
                {lv} · {LEVEL_PATH[lv].treeName}
              </span>
              <div
                className="relative overflow-hidden grid place-items-end justify-items-center"
                style={{ height: c.h, background: "linear-gradient(180deg,#EAF6FF 0%,#F0FDF4 70%,#E8F5DF 100%)" }}
              >
                <svg viewBox="0 0 220 230" className="w-full h-full">
                  <LevelCreature level={lv} />
                </svg>
              </div>
              <figcaption className="absolute bottom-[5px] left-0 right-0 text-center text-[10px] font-bold text-[#8A8478]">
                {c.caption}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
