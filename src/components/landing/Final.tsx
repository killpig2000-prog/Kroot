import Link from "next/link";

export default function Final() {
  return (
    <>
      <section className="border-t border-[#E7E5E4] text-center py-[clamp(56px,8vw,96px)]">
        <div className="max-w-[1080px] mx-auto px-[clamp(18px,4vw,28px)]">
          <h2 className="font-extrabold text-[clamp(26px,3.6vw,40px)] leading-[1.2] tracking-[-0.025em] text-[#18181B] max-w-[560px] mx-auto mb-2.5">
            Put down roots today.
            <span className="kr block text-[0.55em] text-[#16A34A] mt-2 font-normal">
              오늘, 뿌리를 내리세요 🌱
            </span>
          </h2>
          <p className="text-[#71717A] text-[15px] mb-7">
            Completely free — from your first letter to fluent conversation. Three minutes to find
            your level. A lifetime of Korean ahead.
          </p>
          <div className="flex justify-center gap-2.5 flex-wrap">
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-[10px] bg-[#16A34A] px-[26px] py-[13px] text-[14.5px] font-semibold text-white hover:bg-[#15803D] transition-colors"
            >
              Start free
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-[10px] border border-[#E7E5E4] bg-white px-[26px] py-[13px] text-[14.5px] font-semibold text-[#18181B] hover:bg-[#FAFAF9] transition-colors"
            >
              Take the level test
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E7E5E4] bg-[#FAFAF9]">
        <div className="max-w-[1080px] mx-auto px-[clamp(18px,4vw,28px)] py-7 flex justify-between items-center gap-4 flex-wrap text-[13px] text-[#A1A1AA]">
          <span className="flex items-center gap-[9px] font-semibold text-[14.5px] text-[#18181B]">
            <span className="w-[26px] h-[26px] rounded-lg bg-[#16A34A] text-white flex items-center justify-center kr text-xs">
              한
            </span>
            Kroot
          </span>
          <div className="flex gap-5 font-medium">
            <a href="#" className="hover:text-[#18181B] transition-colors">About</a>
            <a href="#" className="hover:text-[#18181B] transition-colors">Pricing</a>
            <a href="#" className="hover:text-[#18181B] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#18181B] transition-colors">Contact</a>
          </div>
          <span>© 2026 Kroot</span>
        </div>
      </footer>
    </>
  );
}
