const CATEGORIES = [
  {
    kr: "듣",
    en: "Listening",
    krLabel: "듣기",
    bg: "#F0FDF4",
    color: "#16A34A",
    desc: "Topic-based clips from A1 to C2, with subtitles you can toggle on and off.",
  },
  {
    kr: "말",
    en: "Speaking",
    krLabel: "말하기",
    bg: "#FFF1F2",
    color: "#E11D48",
    desc: "Say it in your language, then in Korean — AI checks you and shows the most natural answer.",
  },
  {
    kr: "쓰",
    en: "Writing",
    krLabel: "쓰기",
    bg: "#FFFBEB",
    color: "#D97706",
    desc: 'Type real sentences in a workbook and get instant fixes with the "why" explained.',
  },
  {
    kr: "읽",
    en: "Reading",
    krLabel: "읽기",
    bg: "#EFF6FF",
    color: "#2563EB",
    desc: "Fresh Korean articles with tap-to-reveal word hints at your level.",
  },
  {
    kr: "단",
    en: "Vocabulary",
    krLabel: "단어",
    bg: "#F5F3FF",
    color: "#7C3AED",
    desc: "Flip cards by field — conversation, business, medical, sports — that repeat what you miss.",
  },
  {
    kr: "슬",
    en: "Slang",
    krLabel: "슬랭",
    bg: "#FDF2F8",
    color: "#DB2777",
    desc: "The Korean textbooks skip — what people in their teens and twenties actually say.",
  },
  {
    kr: "발",
    en: "Pronunciation",
    krLabel: "발음",
    bg: "#F0FDFA",
    color: "#0D9488",
    desc: "Record yourself and see exactly which sounds need work.",
  },
  {
    kr: "🏕️",
    en: "Community",
    krLabel: "",
    bg: "#F8FAFC",
    color: "#334155",
    desc: "Learners worldwide, one board — every post translates with one tap.",
  },
];

export default function Categories() {
  return (
    <section id="learn" className="py-[clamp(56px,8vw,96px)]">
      <div className="max-w-[1080px] mx-auto px-[clamp(18px,4vw,28px)]">
        <div className="max-w-[560px] mx-auto text-center mb-[clamp(30px,4.5vw,48px)]">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.06em] text-[#16A34A] mb-3">
            Seven ways to practice
          </span>
          <h2 className="font-extrabold text-[clamp(25px,3.2vw,36px)] leading-[1.2] tracking-[-0.025em] text-[#18181B]">
            Every skill, one garden.
          </h2>
          <p className="text-[#71717A] mt-3 text-[15px]">
            Seven focused modes, each with instant AI feedback — plus a community growing alongside
            you.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3.5">
          {CATEGORIES.map((c) => (
            <div
              key={c.en}
              className="reveal border border-[#E7E5E4] rounded-[14px] bg-white p-5 transition-all duration-150 hover:border-[#D4D4D8] hover:shadow-[0_8px_24px_rgba(24,24,27,.05)]"
            >
              <span
                className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center kr text-[17px] mb-3.5"
                style={{ background: c.bg, color: c.color }}
              >
                {c.kr}
              </span>
              <b className="block font-semibold text-[15px] text-[#18181B] mb-[3px]">
                {c.en}
                {c.krLabel && (
                  <small className="kr font-normal text-[#A1A1AA] ml-1.5 text-[12.5px]">
                    {c.krLabel}
                  </small>
                )}
              </b>
              <p className="text-[13.5px] text-[#71717A]">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
