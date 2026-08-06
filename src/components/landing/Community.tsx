const POSTS = [
  {
    stamp: "🇧🇷",
    from: "MARIA · BRAZIL",
    text: "“은/는 vs 이/가 차이를 여기서 드디어 이해했어요. 세 달째 매일 하는 중!”",
    meta: "Question board · translated from Portuguese",
    tilt: "-rotate-2",
  },
  {
    stamp: "🇯🇵",
    from: "KENTA · JAPAN",
    text: "“오늘 TOPIK 3급 합격! 매일 물 주기 스트릭 6개월이 답이었다.”",
    meta: "Free board · translated from Japanese",
    tilt: "rotate-1 mt-3",
  },
  {
    stamp: "🇳🇬",
    from: "AMARA · NIGERIA",
    text: "“주 30분 말하기 연습 파트너 구해요 — 영어 도와드릴 수 있어요!”",
    meta: "Language exchange · original in English",
    tilt: "-rotate-1",
  },
];

export default function Community() {
  return (
    <section id="community" className="bg-[#FAF7EF] border-t border-dashed border-[#DDD6C8] py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-white border-[1.5px] border-dashed border-[#CFC8B8] rounded-full px-4 py-[5px] text-xs font-extrabold text-[#15803D] rotate-1">
          받은 엽서 · from learners
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-[#221F1B] mb-2 text-balance">
        전 세계에서 도착한 소식
      </h2>
      <p className="text-center text-[#6B6560] text-[13.5px] mb-8">
        혼자 배우지 않아요 — 질문 보드, 자유 보드, 언어교환.
      </p>

      <div className="flex justify-center gap-5 flex-wrap max-w-[900px] mx-auto">
        {POSTS.map((p) => (
          <div
            key={p.from}
            className={`reveal relative w-[250px] bg-white border border-[#E3DDD0] px-[17px] pt-4 pb-3.5 text-left shadow-[0_14px_30px_-16px_rgba(60,50,30,.35)] ${p.tilt}`}
          >
            <span aria-hidden="true" className="absolute top-2.5 right-[11px] w-[34px] h-[40px] border-2 border-dashed border-[#D3C9B4] grid place-items-center text-[15px] bg-[#FDFBF7]">
              {p.stamp}
            </span>
            <p className="text-[11px] font-extrabold text-[#15803D] tracking-[.04em] mb-1.5">{p.from}</p>
            <p className="text-[12.5px] leading-[1.6] text-[#4A453D] mb-2.5 pr-9">{p.text}</p>
            <p className="text-[10.5px] text-[#A19A8C] border-t border-dashed border-[#E3DDD0] pt-[7px]">{p.meta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
