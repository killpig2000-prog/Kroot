import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SKILL_HREF } from "@/components/dashboard/QuestButton";

// The one always-visible "what to do today" card in the main column —
// replaces the old resume-or-quest-fallback Continue card entirely (no more
// "pick up where you left off"; today's quest is the single recommendation).
// Same row shape as that old Continue card: icon square, title + detail,
// arrow pill on the right.
export default function TodaysQuestCard({
  quest,
  compact = false,
}: {
  quest?: { skill_key: string; description: string; completed_at: string | null } | null;
  /** Half-width paired layout — used when this card sits side-by-side with
   * the review card on mobile. */
  compact?: boolean;
}) {
  const t = useTranslations("dashboard.quest");
  if (!quest) return null;
  const completed = !!quest.completed_at;

  if (compact) {
    // Short label only — no description sentence. It used to line-clamp the
    // full quest description here, which read as two full lines of text
    // stacked over "Go →" in a card meant to be a quick button.
    const compactInner = (
      <>
        <span className="flex-none w-9 h-9 rounded-[10px] bg-cream border border-success-line flex items-center justify-center text-[17px]">
          🎯
        </span>
        <span className="block text-[13px] font-bold text-success-deep leading-tight">
          {t("title")}
        </span>
      </>
    );

    if (completed) {
      return (
        <div className="flex flex-col items-center text-center gap-1.5 rounded-[16px] border-[1.5px] border-success bg-success-bg px-3 py-3.5 h-full">
          {compactInner}
          <span className="text-[10.5px] font-bold text-success">{t("done")}</span>
        </div>
      );
    }

    return (
      <Link
        href={SKILL_HREF[quest.skill_key] ?? "/dashboard"}
        className="group flex flex-col items-center text-center gap-1.5 rounded-[16px] border-[1.5px] border-success bg-success-bg px-3 py-3.5 h-full transition-all hover:-translate-y-0.5 hover:bg-[var(--tint-green)]"
      >
        {compactInner}
        <span className="text-[10.5px] font-bold text-success">{t("go")}</span>
      </Link>
    );
  }

  const inner = (
    <>
      <span className="flex-none w-12 h-12 rounded-[12px] bg-cream border border-success-line flex items-center justify-center text-[22px] transition-transform group-hover:scale-110">
        🎯
      </span>
      <span className="flex-1 min-w-0">
        <b className="block font-bold text-[18px] truncate text-charcoal">{t("title")}</b>
      </span>
    </>
  );

  if (completed) {
    return (
      <div className="mb-4 flex items-center gap-4 rounded-[16px] border-[1.5px] border-success bg-success-bg px-5 py-4">
        {inner}
        <span className="flex-none rounded-full bg-cream text-success text-[13px] font-bold px-4 py-2 border border-success-line">
          {t("done")}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <Link
        href={SKILL_HREF[quest.skill_key] ?? "/dashboard"}
        className="group flex items-center gap-4 rounded-[16px] border-[1.5px] border-success bg-success-bg px-5 py-4 transition-all hover:-translate-y-0.5 hover:bg-[var(--tint-green)]"
      >
        {inner}
        <span className="flex-none rounded-full bg-success text-white text-[13px] font-bold px-4 py-2 transition-transform group-hover:translate-x-0.5">
          {t("go")}
        </span>
      </Link>
    </div>
  );
}
