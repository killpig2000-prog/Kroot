import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export type PractiseWord = {
  korean: string;
  meaning: string | null;
  slug: string | null;
  misses: number;
};

export default async function WordsToPractise({ words }: { words: PractiseWord[] }) {
  const t = await getTranslations("ui.account");

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <b className="font-semibold text-[15px]">💧 {t("wordsToPractise")}</b>
        <Link href="/review" className="text-[12.5px] font-semibold text-success">
          {t("practiseThese")} →
        </Link>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {words.map((w) => {
          const row = (
            <>
              <span className="min-w-0 flex-1">
                <b className="kr font-semibold text-[14px]">{w.korean}</b>
                {w.meaning && <span className="text-[12.5px] text-muted"> · {w.meaning}</span>}
              </span>
              <small className="flex-none text-[11.5px] font-semibold text-faint">
                {t("misses", { count: w.misses })}
              </small>
            </>
          );
          return (
            <li key={w.korean} className="flex items-center gap-2 py-1.5 border-b border-line last:border-0">
              {w.slug ? (
                <Link href={`/words/${w.slug}`} className="flex items-center gap-2 w-full min-w-0 hover:text-success">
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
