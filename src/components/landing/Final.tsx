import Link from "next/link";

export default function Final() {
  return (
    <>
      <section className="relative bg-[#FFFFFF] border-t border-dashed border-dash text-center py-[clamp(56px,9vw,92px)] px-6 overflow-hidden">
        <span aria-hidden="true" className="absolute font-black text-[#F0EBDD] leading-none select-none top-[-8px] left-[8%] text-[clamp(70px,10vw,120px)]">
          가
        </span>
        <span aria-hidden="true" className="absolute font-black text-[#F0EBDD] leading-none select-none bottom-[-16px] right-[8%] text-[clamp(60px,9vw,100px)]">
          요
        </span>
        <h2 className="relative z-10 font-black text-[clamp(24px,3.4vw,34px)] tracking-[-0.02em] text-[#221F1B] mb-2 text-balance">
          Paste in your first page today
        </h2>
        <p className="relative z-10 text-[15px] font-extrabold text-success-deep mb-5">
          <span className="kr">오늘, 뿌리를 내리세요</span> — put down roots today 🌱
        </p>
        <Link
          href="/onboarding"
          className="relative z-10 inline-block rounded-[10px] bg-success px-[28px] py-[13px] text-[14.5px] font-bold text-white shadow-[0_6px_0_#15803D] hover:translate-y-[2px] hover:shadow-[0_4px_0_#15803D] transition-all"
        >
          Start free — 3-min level test
        </Link>
        <p className="relative z-10 mt-3.5 text-[12px] italic text-[#8A8478]">
          every lesson free · no credit card · from Hangul to fluency
        </p>
      </section>

      <footer className="bg-[#FFFFFF] border-t border-dashed border-dash">
        <div className="max-w-[1080px] mx-auto px-[clamp(18px,4vw,28px)] py-6 flex justify-between items-center gap-4 flex-wrap text-[12px] text-faint">
          <span className="flex items-center gap-[9px] font-bold text-[13.5px] text-[#221F1B]">
            <span className="w-[24px] h-[24px] rounded-lg bg-success text-white flex items-center justify-center kr text-[11px]">
              한
            </span>
            Kroot
          </span>
          <div className="flex gap-5 font-medium">
            <a href="#" className="hover:text-[#221F1B] transition-colors">About</a>
            <a href="/pricing" className="hover:text-[#221F1B] transition-colors">Pricing</a>
            <a href="/privacy" className="hover:text-[#221F1B] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#221F1B] transition-colors">Contact</a>
          </div>
          <span>© 2026 Kroot</span>
        </div>
      </footer>
    </>
  );
}
