import { useTranslations } from "next-intl";

const POSTS = [
  { id: "maria", stamp: "🇧🇷", tilt: "-rotate-2" },
  { id: "kenta", stamp: "🇯🇵", tilt: "rotate-1 mt-3" },
  { id: "amara", stamp: "🇳🇬", tilt: "-rotate-1" },
] as const;

export default function Community() {
  const t = useTranslations("landing.community");
  return (
    <section id="community" className="bg-warm border-t border-dashed border-dash py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-cream border-[1.5px] border-dashed border-dash rounded-full px-4 py-[5px] text-xs font-extrabold text-success-deep rotate-1">
          {t("badge")} · <span className="kr">받은 엽서</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-charcoal mb-2 text-balance">
        {t("title")}
      </h2>
      <p className="text-center text-muted text-[13.5px] mb-8">
        {t("sub")}
      </p>

      <div className="flex justify-center gap-5 flex-wrap max-w-[900px] mx-auto">
        {POSTS.map((p) => (
          <div
            key={p.id}
            className={`reveal relative w-[250px] bg-cream border border-line px-[17px] pt-4 pb-3.5 text-left shadow-[0_14px_30px_-16px_rgba(60,50,30,.35)] ${p.tilt}`}
          >
            <span aria-hidden="true" className="absolute top-2.5 right-[11px] w-[34px] h-[40px] border-2 border-dashed border-line grid place-items-center text-[15px] bg-cream">
              {p.stamp}
            </span>
            <p className="text-[11px] font-extrabold text-success-deep tracking-[.04em] mb-1.5">{t(`posts.${p.id}.from`)}</p>
            <p className="text-[12.5px] leading-[1.6] text-charcoal mb-2.5 pr-9">{t(`posts.${p.id}.text`)}</p>
            <p className="text-[10.5px] text-faint border-t border-dashed border-line pt-[7px]">{t(`posts.${p.id}.meta`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
