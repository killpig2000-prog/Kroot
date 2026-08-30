import { getTranslations } from "next-intl/server";

export type AccuracyMetric = {
  /** nav.json key, so the label follows the sidebar wording */
  key: string;
  percent: number;
  /** e.g. "412/500" or "18 chapters" — always a real count, never a guess */
  note: string;
};

export default async function AccuracyStats({
  metrics,
  missingScores,
}: {
  metrics: AccuracyMetric[];
  /** nav keys with no score column yet (listening, writing) */
  missingScores: string[];
}) {
  const t = await getTranslations("ui.account");
  const tn = await getTranslations("nav");

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <b className="font-semibold text-[15px] block mb-3.5">🎯 {t("accuracy")}</b>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3.5">
        {metrics.map((m) => (
          <div key={m.key} className="min-w-0">
            <b className="block font-bold text-[19px] leading-tight tracking-[-0.02em]">{m.percent}%</b>
            <span className="block text-[12.5px] font-semibold truncate">{tn(m.key)}</span>
            <small className="block text-[11.5px] text-faint truncate">{m.note}</small>
          </div>
        ))}
      </div>

      {missingScores.length > 0 && (
        <small className="block mt-3.5 text-[11.5px] text-faint">
          {t("noScoreYet", { skills: missingScores.map((k) => tn(k)).join(" · ") })}
        </small>
      )}
    </div>
  );
}
