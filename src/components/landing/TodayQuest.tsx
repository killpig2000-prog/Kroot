import { useTranslations } from "next-intl";

// A static preview of the dashboard's daily quest + review + streak —
// mirrors TodaysQuestCard.tsx's real copy and shape, but this isn't
// live/interactive. Same "snapshot of the flow" pattern as
// PronunciationDemo.tsx and WritingFeedbackDemo.tsx.
export default function TodayQuest() {
  const t = useTranslations("landing.today");
  return (
    <section className="bg-cream border-t border-dashed border-dash py-[clamp(52px,8vw,88px)] px-6">
      <div className="text-center mb-1.5">
        <span className="inline-block bg-cream border-[1.5px] border-dashed border-dash rounded-full px-4 py-[5px] text-xs font-extrabold text-success-deep -rotate-1">
          {t("badge")} · <span className="kr">오늘 하루</span>
        </span>
      </div>
      <h2 className="text-center font-black text-[clamp(22px,3vw,30px)] tracking-[-0.02em] text-charcoal mb-2 text-balance">
        {t("title")}
      </h2>
      <p className="text-center text-muted text-[13.5px] max-w-[52ch] mx-auto mb-8">
        {t("sub")}
      </p>

      <div className="reveal max-w-[420px] mx-auto bg-cream border border-line rounded-[16px] p-5 shadow-[0_14px_30px_-16px_rgba(60,50,30,.3)] -rotate-1">
        <div className="flex items-center justify-between mb-3">
          <b className="text-[15px]">{t("cardTitle")}</b>
          <span className="text-[11px] font-bold text-faint">{t("dayLabel")}</span>
        </div>

        <div className="flex items-center gap-3 rounded-[12px] border-[1.5px] border-success bg-success-bg px-4 py-3 mb-2.5">
          <span className="flex-none w-9 h-9 rounded-[10px] bg-cream border border-success-line flex items-center justify-center text-[17px]">
            🎯
          </span>
          <span className="flex-1 min-w-0">
            <b className="block text-[13.5px] text-charcoal">{t("questTitle")}</b>
            <span className="block text-[12px] text-success-deep truncate">{t("questDesc")}</span>
          </span>
          <span className="flex-none rounded-full bg-success text-white text-[11.5px] font-bold px-3 py-1.5">
            {t("go")}
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-[12px] border border-line px-4 py-3">
          <span className="flex-none w-9 h-9 rounded-[10px] bg-warm border border-line flex items-center justify-center text-[17px]">
            🗂️
          </span>
          <span className="flex-1 min-w-0">
            <b className="block text-[13.5px] text-charcoal">{t("reviewTitle")}</b>
            <span className="block text-[12px] text-muted">{t("reviewDesc")}</span>
          </span>
        </div>

        <p className="mt-4 pt-3 border-t border-dashed border-line text-center text-[12px] text-muted">
          {t.rich("streak", { b: (chunks) => <b className="text-success-deep">{chunks}</b> })}
        </p>
      </div>
    </section>
  );
}
