import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FAMILY_META, chapterBlurb, groupsForFamily, type SoundGroup } from "@/lib/pronunciation";

const RAINBOW =
  "conic-gradient(from 0deg, #EF4444, #F97316, #EAB308, #22C55E, #06B6D4, #6366F1, #A855F7, #EF4444)";

export type ChapterProgress = SoundGroup & {
  total: number;
  /** Words attempted at least once — drives the progress arc and "done". */
  attempted: number;
  /** Words scored 100 — all six perfect earns the rainbow ring. */
  perfect: number;
};

function Stone({ chapter }: { chapter: ChapterProgress }) {
  const t = useTranslations("pronunciation.practice");
  const allPerfect = chapter.total > 0 && chapter.perfect === chapter.total;
  const done = chapter.total > 0 && chapter.attempted === chapter.total;
  const pct = chapter.total ? chapter.attempted / chapter.total : 0;

  return (
    <Link
      href={`/speaking?chapter=${chapter.key}`}
      title={chapter.title}
      aria-label={t("openChapter", { title: chapter.title })}
      className="rounded-[12px] border-[1.5px] bg-cream px-2 pt-2.5 pb-3 text-center transition-transform hover:-translate-y-0.5"
      style={{ borderColor: allPerfect ? "#D9A23B" : done ? "var(--c-success-line)" : "var(--c-line)" }}
    >
      <span
        className="relative w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center"
        style={{
          background: allPerfect
            ? RAINBOW
            : `conic-gradient(var(--c-teal) ${pct * 360}deg, var(--c-line) 0)`,
        }}
      >
        <span className="w-[27px] h-[27px] rounded-full bg-cream flex items-center justify-center text-[11px] font-bold">
          {allPerfect ? "★" : done ? "✓" : `${chapter.attempted}/${chapter.total}`}
        </span>
      </span>
      <b className="block text-[11.5px] leading-[1.25] font-bold">{chapterBlurb(chapter.key)}</b>
    </Link>
  );
}

// Practice: every chapter open, grouped by which part of the sound system it
// teaches rather than by difficulty. Nothing is locked and nothing is ordered
// — difficulty lives in Challenge mode.
export default function PracticeGroups({ chapters }: { chapters: ChapterProgress[] }) {
  const t = useTranslations("pronunciation.practice");
  const tf = useTranslations("pronunciation.families");
  const byKey = new Map(chapters.map((c) => [c.key, c]));

  return (
    <div className="max-w-[880px] flex flex-col gap-6">
      {FAMILY_META.map((meta) => {
        const rows = groupsForFamily(meta.family)
          .map((g) => byKey.get(g.key))
          .filter((c): c is ChapterProgress => !!c);
        if (rows.length === 0) return null;
        const perfect = rows.filter((c) => c.total > 0 && c.perfect === c.total).length;

        return (
          <section key={meta.family}>
            <div className="flex items-baseline gap-2.5 mb-2.5">
              <span
                className="w-3 h-3 rounded-[4px] self-center flex-none"
                style={{ background: meta.tint }}
                aria-hidden="true"
              />
              <h2 className="font-extrabold text-[15px] tracking-[-0.01em]">{tf(meta.family)}</h2>
              <small className="text-[12px] text-faint">
                {perfect > 0
                  ? t("chapterCountPerfect", { n: rows.length, perfect })
                  : t("chapterCount", { n: rows.length })}
              </small>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 sm:gap-2.5">
              {rows.map((c) => (
                <Stone key={c.key} chapter={c} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
