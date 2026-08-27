const POSTS = [
  {
    stamp: "🇧🇷",
    from: "MARIA · BRAZIL",
    text: "“은/는 vs 이/가 finally clicked for me here. Three months of daily practice and counting!”",
    meta: "Question board · translated from Portuguese",
    tilt: "-rotate-2",
  },
  {
    stamp: "🇯🇵",
    from: "KENTA · JAPAN",
    text: "“Passed TOPIK Level 3 today! Six months of daily watering streaks was the answer.”",
    meta: "Free board · translated from Japanese",
    tilt: "rotate-1 mt-3",
  },
  {
    stamp: "🇳🇬",
    from: "AMARA · NIGERIA",
    text: "“Looking for a 30-min-a-week speaking partner — happy to help with your English!”",
    meta: "Language exchange · original in English",
    tilt: "-rotate-1",
  },
];

export default function Community() {
  return (
    <section id="community" className="bg-warm border-t border-dashed border-dash py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-white border-[1.5px] border-dashed border-[#CFC8B8] rounded-full px-4 py-[5px] text-xs font-extrabold text-success-deep rotate-1">
          from learners · <span className="kr">받은 엽서</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-[#221F1B] mb-2 text-balance">
        Postcards from around the world
      </h2>
      <p className="text-center text-muted text-[13.5px] mb-8">
        You&apos;re never learning alone — question board, free board, language exchange.
      </p>

      <div className="flex justify-center gap-5 flex-wrap max-w-[900px] mx-auto">
        {POSTS.map((p) => (
          <div
            key={p.from}
            className={`reveal relative w-[250px] bg-white border border-line px-[17px] pt-4 pb-3.5 text-left shadow-[0_14px_30px_-16px_rgba(60,50,30,.35)] ${p.tilt}`}
          >
            <span aria-hidden="true" className="absolute top-2.5 right-[11px] w-[34px] h-[40px] border-2 border-dashed border-[#D3C9B4] grid place-items-center text-[15px] bg-[#FFFFFF]">
              {p.stamp}
            </span>
            <p className="text-[11px] font-extrabold text-success-deep tracking-[.04em] mb-1.5">{p.from}</p>
            <p className="text-[12.5px] leading-[1.6] text-[#4A453D] mb-2.5 pr-9">{p.text}</p>
            <p className="text-[10.5px] text-faint border-t border-dashed border-line pt-[7px]">{p.meta}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
