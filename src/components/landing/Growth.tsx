const LIST = [
  {
    ico: "📈",
    title: "A level that moves with you",
    desc: "Every quiz, correction, and recording feeds your CEFR level — from seed to fruit tree.",
  },
  {
    ico: "🎯",
    title: "Daily goals that reset",
    desc: "Seven small daily targets. Fill them, water your tree, keep the streak alive.",
  },
  {
    ico: "🔍",
    title: "Skill-by-skill clarity",
    desc: "See exactly which skills are thriving and which need water.",
  },
];

const STAGES = [
  { icon: "🌰", lv: "A1" },
  { icon: "🌱", lv: "A2" },
  { icon: "🪴", lv: "B1", on: true },
  { icon: "🌳", lv: "B2" },
  { icon: "🌸", lv: "C1" },
  { icon: "🍎", lv: "C2" },
];

export default function Growth() {
  return (
    <section id="grow" className="border-y border-[#E7E5E4] bg-[#FAFAF9] py-[clamp(56px,8vw,96px)]">
      <div className="max-w-[1080px] mx-auto px-[clamp(18px,4vw,28px)]">
        <div className="max-w-[560px] mb-[clamp(30px,4.5vw,48px)]">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.06em] text-[#16A34A] mb-3">
            Watch it grow
          </span>
          <h2 className="font-extrabold text-[clamp(25px,3.2vw,36px)] leading-[1.2] tracking-[-0.025em] text-[#18181B]">
            Your level is a living thing.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(24px,4vw,56px)] items-center">
          <ul className="reveal grid gap-[18px] list-none">
            {LIST.map((item) => (
              <li key={item.title} className="flex gap-[13px] items-start">
                <span className="flex-none w-[34px] h-[34px] rounded-[9px] bg-white border border-[#E7E5E4] flex items-center justify-center text-[15px]">
                  {item.ico}
                </span>
                <div>
                  <b className="block text-[15px] font-semibold text-[#18181B]">{item.title}</b>
                  <span className="text-[#71717A] text-[13.5px]">{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="reveal border border-[#E7E5E4] rounded-[14px] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.03)]">
            <div className="flex justify-between items-baseline mb-[18px]">
              <b className="text-sm font-semibold text-[#18181B]">Growth stages</b>
              <span className="text-xs text-[#A1A1AA]">A1 → C2</span>
            </div>
            <div className="grid grid-cols-6 gap-2 text-center">
              {STAGES.map((s) => (
                <div
                  key={s.lv}
                  className={`py-2.5 px-0.5 border rounded-[10px] ${
                    s.on ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E7E5E4]"
                  }`}
                >
                  <em
                    className={`not-italic text-[22px] block mb-1 ${
                      s.on ? "" : "grayscale opacity-45"
                    }`}
                  >
                    {s.icon}
                  </em>
                  <small
                    className={`text-[10.5px] font-semibold ${
                      s.on ? "text-[#16A34A]" : "text-[#A1A1AA]"
                    }`}
                  >
                    {s.lv}
                  </small>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] text-[#71717A] mt-3.5">
              Your tree grows a stage with every level —{" "}
              <b className="text-[#16A34A] font-semibold">fruit appears at C2</b>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
