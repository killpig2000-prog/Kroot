import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const OPTIONS = [
  { id: "ok", on: true },
  { id: "expensive", on: false },
  { id: "seeYou", on: false },
] as const;

export default function LevelTest() {
  const t = useTranslations("landing.levelTest");
  return (
    <section className="relative bg-cream border-t border-dashed border-dash py-[clamp(52px,8vw,88px)] px-6 overflow-hidden">
      <span aria-hidden="true" className="absolute left-[8%] bottom-[40px] font-black text-[#F0EBDD] text-[80px] -rotate-[8deg] select-none">
        가
      </span>

      <div className="text-center mb-1.5">
        <span className="inline-block bg-cream border-[1.5px] border-dashed border-dash rounded-full px-4 py-[5px] text-xs font-extrabold text-success-deep -rotate-1">
          {t("badge")} · <span className="kr">쪽지시험</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-charcoal mb-2 text-balance">
        {t("title")}
      </h2>
      <p className="text-center text-muted text-[13.5px] max-w-[52ch] mx-auto mb-8">
        {t("sub")}
      </p>

      <div className="relative max-w-[840px] mx-auto flex justify-center items-start gap-6 flex-wrap">
        {/* the quiz, on ruled paper */}
        <div
          className="relative z-10 w-[min(410px,100%)] bg-cream border border-line px-6 pt-6 pb-5 -rotate-1 shadow-[0_18px_36px_-18px_rgba(60,50,30,.35)]"
          style={{ backgroundImage: "repeating-linear-gradient(#fff 0 27px,#F2EEE4 27px 28px)" }}
        >
          <span aria-hidden="true" className="absolute -top-2 left-1/2 -translate-x-1/2 -rotate-2 w-[64px] h-[17px] border z-10" style={{ background: "rgba(253,230,138,.6)", borderColor: "rgba(217,180,90,.45)" }} />
          <div className="flex justify-between items-baseline border-b-2 border-charcoal pb-1.5 mb-3">
            <b className="text-[15px]">{t("cardTitle")}</b>
            <span className="text-[11px] text-[#8A8478]">{t("cardTag")}</span>
          </div>
          <p className="text-sm font-bold mb-2.5 text-left">
            <span className="kr">&quot;괜찮아요&quot;</span> {t("question")}
          </p>
          {OPTIONS.map((o) => (
            <span
              key={o.id}
              className={`block text-left text-[13px] rounded-[9px] px-3.5 py-2.5 mb-[7px] border-[1.5px] ${
                o.on ? "border-success bg-success-bg font-bold" : "border-line bg-cream"
              }`}
            >
              <span
                className={`inline-block w-[15px] h-[15px] rounded-full border-2 mr-2 align-[-2px] ${
                  o.on ? "border-success bg-success" : "border-dash"
                }`}
              />
              {t(`options.${o.id}`)}
            </span>
          ))}
        </div>

        {/* sticky note + CTA */}
        <div className="relative z-10 w-[min(240px,100%)]">
          <div className="bg-[#FEF9C3] border border-[#ECD98A] px-4 py-3.5 text-[12px] leading-[1.55] rotate-2 shadow-[0_10px_22px_-12px_rgba(120,100,30,.4)] text-left mb-5">
            <b className="block mb-0.5">{t("tipTitle")}</b>
            {t("tipBody")}
          </div>
          <Link
            href="/onboarding"
            className="inline-block rounded-[10px] bg-success px-[24px] py-3 text-sm font-bold text-white shadow-[0_5px_0_#2E5B41] hover:translate-y-[2px] hover:shadow-[0_3px_0_#2E5B41] transition-all"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
