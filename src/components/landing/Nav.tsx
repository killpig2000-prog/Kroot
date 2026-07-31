import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[#E7E5E4] bg-white/90 backdrop-blur-sm">
      <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 px-[clamp(18px,5vw,56px)] py-3">
        <Link
          href="/"
          className="flex items-center gap-[9px] font-semibold text-[17px] tracking-[-0.01em] text-[#18181B]"
        >
          <span className="w-[30px] h-[30px] rounded-lg bg-[#16A34A] text-white flex items-center justify-center kr text-sm">
            한
          </span>
          Kroot
        </Link>

        <div className="hidden md:flex gap-7 text-[13.5px] font-medium text-[#71717A]">
          <a href="#learn" className="hover:text-[#18181B] transition-colors">Practice</a>
          <a href="#grow" className="hover:text-[#18181B] transition-colors">How it grows</a>
          <a href="#community" className="hover:text-[#18181B] transition-colors">Community</a>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex rounded-[9px] border border-[#E7E5E4] bg-white px-[18px] py-[9px] text-[13.5px] font-semibold text-[#18181B] hover:bg-[#FAFAF9] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex rounded-[9px] bg-[#16A34A] px-[18px] py-[9px] text-[13.5px] font-semibold text-white hover:bg-[#15803D] transition-colors"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
}
