import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SkillBar from "@/components/dashboard/SkillBar";
import { PRACTICE_SKILLS, type SkillTally } from "./skill-progress";
import type { CefrLevel } from "@/lib/tree";

export default async function LearningProgress({
  cefr,
  progress,
}: {
  cefr: CefrLevel;
  progress: Record<string, SkillTally>;
}) {
  const t = await getTranslations("ui.account");
  const tn = await getTranslations("nav");

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3 mb-3.5 flex-wrap">
        <b className="font-semibold text-[15px]">📈 {t("learningProgress")}</b>
        <small className="text-[12.5px] text-faint font-medium">{t("difficulty", { level: cefr })}</small>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {PRACTICE_SKILLS.map((c) => {
          const prog = progress[c.key];
          return (
            <Link key={c.key} href={c.href} className="flex items-center gap-3 group">
              <span
                className="w-[30px] h-[30px] rounded-lg flex-none flex items-center justify-center kr text-[13px] transition-transform group-hover:scale-110"
                style={{ background: c.bg, color: c.color }}
              >
                {c.kr}
              </span>
              <span className="flex-1 min-w-0">
                <b className="font-semibold text-[13px] block">{tn(c.key)}</b>
                <SkillBar
                  percent={prog.percent}
                  note={`${prog.done}/${prog.total}${c.key === "pronunciation" ? "" : ` · ${cefr}`}`}
                />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
