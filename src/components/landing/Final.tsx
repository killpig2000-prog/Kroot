import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import BrandMark from "@/components/ui/BrandMark";

export default function Final() {
  const t = useTranslations("landing.final");
  return (
    <>
      <section className="relative bg-cream border-t border-dashed border-dash text-center py-[clamp(56px,9vw,92px)] px-6 overflow-hidden">
        <span aria-hidden="true" className="absolute font-black text-[#F0EBDD] leading-none select-none top-[-8px] left-[8%] text-[clamp(70px,10vw,120px)]">
          가
        </span>
        <span aria-hidden="true" className="absolute font-black text-[#F0EBDD] leading-none select-none bottom-[-16px] right-[8%] text-[clamp(60px,9vw,100px)]">
          요
        </span>
        <h2 className="relative z-10 font-black text-[clamp(24px,3.4vw,34px)] tracking-[-0.02em] text-charcoal mb-2 text-balance">
          {t("title")}
        </h2>
        <p className="relative z-10 text-[15px] font-extrabold text-success-deep mb-5">
          <span className="kr">오늘, 뿌리를 내리세요</span> — {t("tagline")}
        </p>
        <Link
          href="/onboarding"
          className="relative z-10 inline-block rounded-[10px] bg-success px-[28px] py-[13px] text-[14.5px] font-bold text-white shadow-[0_6px_0_#2E5B41] hover:translate-y-[2px] hover:shadow-[0_4px_0_#2E5B41] transition-all"
        >
          {t("cta")}
        </Link>
        <p className="relative z-10 mt-3.5 text-[12px] italic text-[#8A8478]">
          {t("note")}
        </p>
      </section>

      <footer className="bg-cream border-t border-dashed border-dash">
        <div className="max-w-[1080px] mx-auto px-[clamp(18px,4vw,28px)] py-6 flex justify-between items-center gap-4 flex-wrap text-[12px] text-faint">
          <span className="flex items-center gap-[9px] font-bold text-[13.5px] text-charcoal">
            <BrandMark size={24} />
            Kroot
          </span>
          <div className="flex gap-5 font-medium">
            <a href="#" className="hover:text-charcoal transition-colors">{t("about")}</a>
            <Link href="/privacy" className="hover:text-charcoal transition-colors">{t("privacy")}</Link>
            <a href="#" className="hover:text-charcoal transition-colors">{t("contact")}</a>
          </div>
          <span>{t("copyright")}</span>
        </div>
      </footer>
    </>
  );
}
