import { getTranslations } from "next-intl/server";

export type LevelTestRow = {
  id: string | number;
  created_at: string | null;
  result_level: string | null;
  score: number | null;
  total_questions: number | null;
  skills: { key: string; value: number }[];
  passed: boolean | null;
};

export default async function LevelHistory({ rows }: { rows: LevelTestRow[] }) {
  const t = await getTranslations("ui.account");
  const tn = await getTranslations("nav");

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <b className="font-semibold text-[15px] block mb-3.5">🏅 {t("levelHistory")}</b>

      <ul className="flex flex-col">
        {rows.map((r) => (
          <li key={r.id} className="py-2.5 border-b border-line last:border-0 last:pb-0 first:pt-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <b className="font-semibold text-[13.5px]">{r.result_level ?? "—"}</b>
              {r.passed === true && (
                <span className="text-[10.5px] font-semibold text-success bg-success-bg border border-success-line rounded-md px-1.5 py-px">
                  {t("passed")}
                </span>
              )}
              {r.score != null && (
                <span className="text-[12.5px] text-muted">
                  {r.total_questions ? `${r.score}/${r.total_questions}` : `${r.score}%`}
                </span>
              )}
              <span className="ml-auto text-[11.5px] text-faint whitespace-nowrap">
                {r.created_at
                  ? new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            {r.skills.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11.5px] text-faint">
                {r.skills.map((s) => (
                  <span key={s.key} className="whitespace-nowrap">
                    {tn(s.key)} {s.value}%
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
