import Link from "next/link";
import Polaroid from "@/components/landing/Polaroid";

export default function Hero() {
  return (
    <header className="relative overflow-hidden bg-[#FFFFFF] text-center px-6 pt-[clamp(56px,9vw,96px)] pb-[clamp(72px,10vw,120px)]">
      {/* giant hangul letterforms in the paper */}
      <span aria-hidden="true" className="absolute font-black text-[#F0EBDD] leading-none select-none top-[-20px] left-[38%] text-[clamp(90px,15vw,170px)]">
        한
      </span>
      <span aria-hidden="true" className="absolute font-black text-[#F0EBDD] leading-none select-none bottom-[-26px] right-[36%] text-[clamp(72px,12vw,140px)]">
        글
      </span>

      {/* polaroids framing the copy on all sides */}
      <Polaroid scene="hanok" caption="Bukchon 한옥" tape="blue" className="hidden sm:block absolute left-[2%] top-[52px] w-[166px] h-[156px] -rotate-6" />
      <Polaroid scene="night" caption="first night in Seoul" tape="yellow" className="hidden sm:block absolute left-[6%] bottom-[44px] w-[148px] h-[140px] rotate-3" />
      <Polaroid scene="food" caption="first 떡볶이 🌶️" tape="pink" className="hidden sm:block absolute right-[2%] top-[46px] w-[170px] h-[158px] rotate-6" />
      <Polaroid scene="cafe" caption="café study ☕" tape="blue" className="hidden sm:block absolute right-[6%] bottom-[38px] w-[148px] h-[140px] -rotate-3" />

      <div className="relative z-10 max-w-[540px] mx-auto">
        <h1 className="font-black text-[clamp(30px,4.6vw,48px)] leading-[1.24] tracking-[-0.02em] text-[#221F1B] mb-3.5 text-balance">
          You already love Korea.
          <br />
          <mark
            className="text-inherit px-0.5"
            style={{ background: "linear-gradient(transparent 62%, #BBF7D0 62%)" }}
          >
            Now learn to speak it.
          </mark>
        </h1>
        <p className="text-[14.5px] text-muted max-w-[44ch] mx-auto mb-6">
          K-drama, K-food, K-everything — you&apos;re halfway there. Kroot turns that love into real
          Korean, one tiny lesson a day.
        </p>
        <Link
          href="/onboarding"
          className="inline-block rounded-[10px] bg-success px-[28px] py-[13px] text-[14.5px] font-bold text-white shadow-[0_6px_0_#15803D] hover:translate-y-[2px] hover:shadow-[0_4px_0_#15803D] transition-all"
        >
          Find my level (3 min)
        </Link>
        <p className="mt-3.5 text-[12.5px] italic text-[#8A8478]">
          — every lesson free, no credit card, from 한글 to fluency
        </p>
      </div>
    </header>
  );
}
