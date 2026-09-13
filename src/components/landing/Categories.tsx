import { useTranslations } from "next-intl";

const CATEGORIES = [
  { id: "listening", sticker: "🎧", bg: "#3E7C59" },
  { id: "pronunciation", sticker: "🎤", bg: "#2A7F72" },
  { id: "writing", sticker: "✍️", bg: "#B07A2A" },
  { id: "reading", sticker: "📖", bg: "#2F6F8F" },
  { id: "vocabulary", sticker: "🃏", bg: "#6A4FA8" },
  { id: "slang", sticker: "💬", bg: "#A9485F" },
] as const;

export default function Categories() {
  const t = useTranslations("landing.categories");
  return (
    <section id="learn" className="bg-warm border-t border-dashed border-dash py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-cream border-[1.5px] border-dashed border-dash rounded-full px-4 py-[5px] text-xs font-extrabold text-success-deep rotate-1">
          {t("badge")}
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
            <span
              aria-hidden="true"
              className="w-[34px] h-[34px] rounded-[9px] grid place-items-center text-[17px] mb-2"
              style={{ background: c.bg }}
            >
              {c.sticker}
            </span>
            <b className="block text-sm text-charcoal mb-0.5">{t(`items.${c.id}.label`)}</b>
            <span className="block text-[11.5px] text-[#8A8478] leading-[1.5]">{t(`items.${c.id}.desc`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
