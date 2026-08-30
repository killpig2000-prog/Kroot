import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SRS_INTERVALS_DAYS, MAX_BOX } from "@/lib/srs";

// Same green ramp as the study-garden grass, so "further along" reads the
// same way in both places.
const BOX_COLORS = ["#F0EFED", "#BBF7D0", "#6BBF8A", "#3E7C59", "#2E5B41"];

export default async function WordMemory({
  boxes,
  total,
  due,
}: {
  boxes: number[]; // counts for box 1..MAX_BOX
  total: number;
  due: number;
}) {
  const t = await getTranslations("ui.account");

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
        <b className="font-semibold text-[15px]">🧠 {t("wordMemory")}</b>
        <small className="text-[12.5px] text-faint font-medium">
          {t("wordsStudied", { count: total })}
          {due > 0 ? ` · ${t("dueNow", { count: due })}` : ""}
        </small>
      </div>

      {/* stacked bar: width in proportion to how many words sit in each box */}
      <div className="flex h-[10px] rounded-full overflow-hidden bg-line mt-3 mb-3.5">
        {boxes.map((count, i) =>
          count > 0 ? (
            <span
              key={i}
              className="block h-full"
              style={{ width: `${(count / total) * 100}%`, background: BOX_COLORS[i] }}
            />
          ) : null
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-2.5">
        {boxes.map((count, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <span
              className="w-[10px] h-[10px] rounded-full flex-none border border-line"
              style={{ background: BOX_COLORS[i] }}
            />
            <span className="min-w-0">
              <b className="block font-semibold text-[13px] leading-tight">{count}</b>
              <small className="block text-[11.5px] text-faint whitespace-nowrap">
                {SRS_INTERVALS_DAYS[i] === 1
                  ? t("everyDay")
                  : t("everyNDays", { days: SRS_INTERVALS_DAYS[i] })}
                {i === MAX_BOX - 1 ? ` · ${t("memorised")}` : ""}
              </small>
            </span>
          </div>
        ))}
      </div>

      {due > 0 && (
        <Link
          href="/review"
          className="inline-block mt-4 text-[13px] font-semibold text-success hover:translate-x-0.5 transition-transform"
        >
          {t("reviewDue", { count: due })} →
        </Link>
      )}
    </div>
  );
}
