const CATEGORIES = [
  { kr: "듣", en: "Listening", sticker: "🎧", bg: "#16A34A", desc: "A1–C2 클립, 자막 토글" },
  { kr: "말", en: "Speaking", sticker: "🎤", bg: "#E11D48", desc: "말하면 AI가 바로 교정" },
  { kr: "쓰", en: "Writing", sticker: "✍️", bg: "#D97706", desc: "문장 쓰면 즉시 첨삭" },
  { kr: "읽", en: "Reading", sticker: "📖", bg: "#2563EB", desc: "탭하면 단어 힌트" },
  { kr: "단", en: "Vocabulary", sticker: "🃏", bg: "#7C3AED", desc: "주제별 플래시카드 4,000+" },
  { kr: "슬", en: "Slang", sticker: "💬", bg: "#DB2777", desc: "교과서엔 없는 진짜 표현" },
  { kr: "발", en: "Pronunciation", sticker: "🗣️", bg: "#0D9488", desc: "녹음하고 비교 듣기" },
  { kr: "함", en: "Community", sticker: "🏕️", bg: "#334155", desc: "전 세계 학습자 한 보드" },
];

export default function Categories() {
  return (
    <section id="learn" className="bg-[#FAF7EF] border-t border-dashed border-[#DDD6C8] py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-white border-[1.5px] border-dashed border-[#CFC8B8] rounded-full px-4 py-[5px] text-xs font-extrabold text-[#15803D] rotate-1">
          준비물 · what&apos;s inside
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-[#221F1B] mb-2 text-balance">
        매일 꺼내 쓰는 8가지 도구
      </h2>
      <p className="text-center text-[#6B6560] text-[13.5px] mb-8">
        전부 무료 — all free. 스티커 모으듯 하나씩 해보세요.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-[880px] mx-auto">
        {CATEGORIES.map((c, i) => (
          <div
            key={c.en}
            className={`reveal relative bg-white border border-[#E3DDD0] rounded-[14px] px-4 pt-4 pb-3.5 text-left shadow-[0_10px_24px_-16px_rgba(60,50,30,.3)] ${
              i % 2 ? "rotate-1" : "-rotate-1"
            }`}
          >
            <span aria-hidden="true" className="absolute -top-2 -right-1.5 text-base rotate-12">{c.sticker}</span>
            <span
              className="kr w-[34px] h-[34px] rounded-[9px] grid place-items-center font-extrabold text-[15px] text-white mb-2"
              style={{ background: c.bg }}
            >
              {c.kr}
            </span>
            <b className="block text-sm text-[#221F1B] mb-0.5">{c.en}</b>
            <span className="block text-[11.5px] text-[#8A8478] leading-[1.5]">{c.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
