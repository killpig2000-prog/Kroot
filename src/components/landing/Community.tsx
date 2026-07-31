const POSTS = [
  {
    avatar: "🦊",
    name: "Maria · Brazil",
    board: "Question board",
    text: "What's the difference between 은/는 and 이/가? I keep mixing them up 😅",
    tr: "⇄ Translated from Portuguese",
  },
  {
    avatar: "🐻",
    name: "Kenta · Japan",
    board: "Free board",
    text: "Passed TOPIK Level 3 today!! Six months of daily streaks paid off 🎉",
    tr: "⇄ Translated from Japanese",
  },
  {
    avatar: "🐰",
    name: "Amara · Nigeria",
    board: "Language exchange",
    text: "Looking for a partner to practice speaking 30 min a week — I can help with English!",
    tr: "⇄ Original in English",
  },
];

export default function Community() {
  return (
    <section id="community" className="py-[clamp(56px,8vw,96px)]">
      <div className="max-w-[1080px] mx-auto px-[clamp(18px,4vw,28px)]">
        <div className="max-w-[560px] mx-auto text-center mb-[clamp(30px,4.5vw,48px)]">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.06em] text-[#16A34A] mb-3">
            You&apos;re not learning alone
          </span>
          <h2 className="font-extrabold text-[clamp(25px,3.2vw,36px)] leading-[1.2] tracking-[-0.025em] text-[#18181B]">
            Every language, one community.
          </h2>
          <p className="text-[#71717A] mt-3 text-[15px]">
            Ask questions, share wins, find practice partners — every post translates with one tap.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-3.5">
          {POSTS.map((p) => (
            <div key={p.name} className="reveal border border-[#E7E5E4] rounded-[14px] bg-white p-[18px]">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="w-8 h-8 rounded-[9px] bg-[#FAFAF9] border border-[#E7E5E4] flex items-center justify-center text-sm">
                  {p.avatar}
                </span>
                <div>
                  <b className="text-[13.5px] font-semibold block leading-[1.25] text-[#18181B]">
                    {p.name}
                  </b>
                  <span className="text-[11.5px] text-[#A1A1AA]">{p.board}</span>
                </div>
              </div>
              <p className="text-[13.5px] text-[#18181B]">{p.text}</p>
              <span className="inline-block mt-2.5 text-[11.5px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-md px-2 py-0.5">
                {p.tr}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
