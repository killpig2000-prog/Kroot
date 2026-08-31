import { useTranslations } from "next-intl";

const CATEGORIES = [
  { id: "listening", kr: "듣", sticker: "🎧", bg: "#3E7C59" },
  { id: "pronunciation", kr: "발", sticker: "🎤", bg: "#228980" },
  { id: "writing", kr: "쓰", sticker: "✍️", bg: "#C47A25" },
  { id: "reading", kr: "읽", sticker: "📖", bg: "#3363CC" },
  { id: "vocabulary", kr: "단", sticker: "🃏", bg: "#6B33CC" },
  { id: "slang", kr: "슬", sticker: "💬", bg: "#C13E78" },
] as const;

export default function Categories() {
  const t = useTranslations("landing.categories");
  return (
    <section id="learn" className="bg-warm border-t border-dashed border-dash py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-cream border-[1.5px] border-dashed border-dash rounded-full px-4 py-[5px] text-xs font-extrabold text-success-deep rotate-1">
          {t("badge")} · <span className="kr">준비물</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-charcoal mb-2 text-balance">
        {t("title")}
      </h2>
      <p className="text-center text-muted text-[13.5px] mb-8">
        {t("sub")}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 max-w-[700px] mx-auto">
        {CATEGORIES.map((c, i) => (
          <div
            key={c.id}
            className={`reveal relative bg-cream border border-line rounded-[14px] px-4 pt-4 pb-3.5 text-left shadow-[0_10px_24px_-16px_rgba(60,50,30,.3)] ${
              i % 2 ? "rotate-1" : "-rotate-1"
            }`}
          >
            <span aria-hidden="true" className="absolute -top-2 -right-1.5 text-base rotate-12">{c.sticker}</span>
            <span
              className="kr w-[34px] h-[34px] rounded-[9px] grid place-items-center font-extrabold text-[15px] text-white mb-2"
              style={{ background: c.bg }}
            >
              {c.kr}
            </span>
            <b className="block text-sm text-charcoal mb-0.5">{t(`items.${c.id}.label`)}</b>
            <span className="block text-[11.5px] text-[#8A8478] leading-[1.5]">{t(`items.${c.id}.desc`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
