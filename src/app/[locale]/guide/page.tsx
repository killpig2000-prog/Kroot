import { Fragment } from "react";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { ELIGIBILITY } from "@/lib/promotion-test";
import {
  getGuideProgress,
  resolveRoute,
  type GuideProgress,
  type GuideStationKey,
  type GuideStationView,
} from "@/lib/guide-progress";
import { LEVEL_ORDER, nextLevel, type CefrLevel } from "@/lib/tree";
import LevelCreature from "@/components/dashboard/LevelCreature";

// Each stop reuses its section's own accent from navItems, so a stop on the
// roadmap and the same entry in the sidebar read as the same thing.
type Stop = {
  key: GuideStationKey;
  icon: string;
  /** nav namespace key for this section's name. */
  navKey: string;
  href: string;
  color: string;
};

// "You are here" accents — the sun token, plus its deeper edge/ink shades.
const SUN_EDGE = "#E2A600";
const SUN_PAPER = "#FFFBEA";

const S = {
  hangul: { icon: "🔤", navKey: "hangul", href: "/hangul", color: "#C63958" },
  grammar: { icon: "📖", navKey: "grammar", href: "/grammar", color: "#423AC5" },
  vocab: { icon: "🃏", navKey: "vocabulary", href: "/vocabulary", color: "#6B33CC" },
  listen: { icon: "🎧", navKey: "listening", href: "/listening", color: "#3E7C59" },
  pron: { icon: "🌶️", navKey: "pronunciation", href: "/speaking", color: "#228980" },
  write: { icon: "✏️", navKey: "writing", href: "/writing", color: "#C47A25" },
  read: { icon: "📰", navKey: "reading", href: "/reading", color: "#3363CC" },
  slang: { icon: "💬", navKey: "slang", href: "/slang", color: "#C13E78" },
} as const;

const stop = (k: keyof typeof S): Stop => ({ key: k, ...S[k] });

const ROUTES: {
  key: "people" | "exam";
  icon: string;
  color: string;
  stops: Stop[];
}[] = [
  {
    key: "people",
    icon: "🗣️",
    color: "#228980",
    stops: [stop("hangul"), stop("vocab"), stop("listen"), stop("pron"), stop("slang")],
  },
  {
    key: "exam",
    icon: "🎓",
    color: "#423AC5",
    stops: [stop("hangul"), stop("grammar"), stop("vocab"), stop("read"), stop("write")],
  },
];

// The four stations you come back to every day, for as long as you study —
// as opposed to the roadmap above, which you walk through once. Basics
// polishes the pieces; this is the actual training ground.
const PRACTICE_STOPS: Stop[] = [stop("listen"), stop("pron"), stop("write"), stop("read")];

const FACTS = ["effort", "ability", "cosmetic"] as const;

function SectionHead({ title, note }: { title: string; note: string }) {
  return (
    <>
      <div className="flex items-baseline gap-3 mb-1.5">
        <h2 className="font-hand text-[17px] font-semibold tracking-[-0.01em] whitespace-nowrap">
          {title}
        </h2>
        <span className="h-px flex-1 bg-line -translate-y-0.5" />
      </div>
      <p className="text-[12.5px] text-muted mb-[18px] max-w-[62ch]">{note}</p>
    </>
  );
}

export default async function GuidePage() {
  const tn = await getTranslations("nav");
  const t = await getTranslations("guide");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url, current_level")
    .eq("id", user.id)
    .single();

  // Progress markers need the grade first (every station is judged at the
  // learner's level), so this is a second round trip; inside it the per-station
  // reads run in one parallel batch. Any failure just leaves the roadmap static.
  const grade = (profile?.current_level ?? "A1") as CefrLevel;
  let progress: GuideProgress | null = null;
  try {
    progress = await getGuideProgress(supabase, user.id, grade);
  } catch (e) {
    console.error("guide progress failed:", e instanceof Error ? e.message : e);
  }
  const elig = progress?.eligibility ?? null;
  const gradeUp = nextLevel(grade);

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[940px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-faint mb-4">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              {tn("garden")}
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{t("breadcrumb")}</b>
          </div>

          {/* head */}
          <div className="pb-5 mb-7 border-b border-line">
            <h1 className="font-bold text-[26px] tracking-[-0.025em] mb-1 text-balance">{tn("guide")}</h1>
          </div>

          {/* roadmaps */}
          <section className="mb-11">
            <div className="flex items-baseline gap-3 mb-[18px]">
              <h2 className="font-hand text-[17px] font-semibold tracking-[-0.01em] whitespace-nowrap">
                {t("sections.roadmaps.title")}
              </h2>
              <span className="h-px flex-1 bg-line -translate-y-0.5" />
            </div>

            <div className="flex flex-col gap-3.5">
              {ROUTES.map((route) => {
                const views: GuideStationView[] | null = progress
                  ? resolveRoute(
                      route.stops.map((s) => s.key),
                      progress
                    )
                  : null;
                return (
                <article
                  key={route.key}
                  className="relative overflow-hidden rounded-[18px] border border-line bg-cream shadow-[0_1px_2px_rgba(27,36,48,.04),0_8px_24px_-16px_rgba(27,36,48,.16)]"
                >
                  <span
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ background: route.color }}
                  />

                  {/* route header */}
                  <div
                    className="flex items-start gap-3.5 pl-6 pr-[22px] pt-[18px] pb-[17px] border-b border-[color:var(--c-warm-2)]"
                    style={{ background: `linear-gradient(to right, ${route.color}0D, transparent 60%)` }}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="inline-block text-[9.5px] font-black uppercase tracking-[.09em] px-2 py-[2.5px] rounded-full border"
                          style={{
                            color: route.color,
                            background: `${route.color}14`,
                            borderColor: `${route.color}4D`,
                          }}
                        >
                          {t(`routes.${route.key}.tag`)}
                        </span>
                        {/* on phones the pace sits beside the tag so the title keeps the full width */}
                        <span
                          className="sm:hidden flex-none text-[12px] font-black tracking-[-0.01em] tabular-nums whitespace-nowrap"
                          style={{ color: route.color }}
                        >
                          {t(`routes.${route.key}.pace`)}
                        </span>
                      </span>
                      <b className="block text-[19px] font-black tracking-[-0.02em] text-balance">
                        {t(`routes.${route.key}.name`)}
                      </b>
                    </span>
                    <span
                      className="hidden sm:inline flex-none pl-2 text-[13px] font-black tracking-[-0.01em] tabular-nums whitespace-nowrap"
                      style={{ color: route.color }}
                    >
                      {t(`routes.${route.key}.pace`)}
                    </span>
                  </div>

                  {/* stops */}
                  {/* Stops only — step number, name. Every stop is a link straight
                      into its section (the current stop's link goes straight into the
                      specific session it left off at); no per-stop description text. */}
                  <div className="relative px-3.5 pt-[22px] pb-5 flex flex-col sm:flex-row sm:items-start gap-1">
                    {route.stops.map((s, i) => {
                      const v = views?.[i] ?? null;
                      const isDone = v?.status === "done";
                      const isCurrent = v?.status === "current";
                      const hasNext = i < route.stops.length - 1;
                      return (
                      <Fragment key={s.key}>
                      <div className="flex sm:flex-1 sm:flex-col items-center gap-3.5 sm:gap-2">
                      <Link
                        href={isCurrent && v ? v.ctaHref : s.href}
                        aria-current={isCurrent ? "step" : undefined}
                        className="group flex sm:flex-col items-center sm:items-center gap-3.5 sm:gap-2 sm:text-center sm:w-full"
                      >
                        <span
                          className={`relative z-[1] flex-none w-11 h-11 rounded-[13px] flex items-center justify-center text-[15px] font-black border-[1.5px] transition-transform duration-200 group-hover:-translate-y-[3px] ${
                            isCurrent
                              ? "shadow-[0_0_0_5px_#fff,0_0_0_9px_rgba(255,214,107,.4)]"
                              : "shadow-[0_0_0_5px_#fff]"
                          }`}
                          style={
                            isCurrent
                              ? { background: SUN_PAPER, borderColor: SUN_EDGE, color: SUN_EDGE }
                              : { background: `${s.color}1A`, borderColor: `${s.color}6B`, color: s.color }
                          }
                        >
                          {isDone ? "✓" : i + 1}
                        </span>
                        <b
                          className={`block text-[14px] font-black tracking-[-0.015em] transition-colors ${
                            isDone
                              ? "text-muted line-through decoration-2 decoration-success-line"
                              : "group-hover:[color:var(--stop-color)]"
                          }`}
                          style={{ "--stop-color": s.color } as React.CSSProperties}
                        >
                          {tn(s.navKey)}
                        </b>
                      </Link>
                      </div>
                      {hasNext && (
                        <span
                          aria-hidden="true"
                          className="self-center flex-none text-[15px] font-black text-[#D6D3CC] rotate-90 sm:rotate-0 sm:self-start sm:mt-[27px]"
                        >
                          →
                        </span>
                      )}
                      </Fragment>
                      );
                    })}
                  </div>
                </article>
                );
              })}
            </div>
          </section>

          {/* practice ground: one brief intro, then the four skills as plain
              links — Basics polishes the pieces, this is where you actually
              use them, every day, for as long as you study. Kept as short
              as the rest of the page; no per-skill cards. */}
          <section className="mb-11">
            <SectionHead
              title={t("sections.practice.title")}
              note={t("sections.practice.note")}
            />

            <div className="flex flex-wrap gap-2">
              {PRACTICE_STOPS.map((s) => (
                <Link
                  key={s.key}
                  href={s.href}
                  className="text-[13.5px] font-bold rounded-full border px-3.5 py-[7px] transition-colors hover:bg-warm"
                  style={{ color: s.color, borderColor: `${s.color}6B`, background: `${s.color}0D` }}
                >
                  {tn(s.navKey)}
                </Link>
              ))}
            </div>
          </section>

          {/* how progress works: effort (tree level) vs ability (grade) vs
              cosmetic (garden) are three independent tracks — shown as a
              level-by-level growth strip so "level" reads as a visual, not
              just a number, plus what actually triggers a level (grade) test. */}
          <section className="mb-8">
            <SectionHead
              title={t("sections.progress.title")}
              note={t("sections.progress.note")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {FACTS.map((f) => (
                <div key={f} className="rounded-[14px] border border-line bg-cream px-[15px] py-3.5">
                  <span className="block text-[10px] font-black uppercase tracking-[.09em] text-faint mb-1.5">
                    {t(`facts.${f}.kicker`)}
                  </span>
                  <b className="block text-[14px] font-extrabold tracking-[-0.01em] mb-1">
                    {t(`facts.${f}.title`)}
                  </b>
                  <p className="text-[12px] text-muted leading-[1.5]">{t(`facts.${f}.body`)}</p>
                </div>
              ))}
            </div>

            {/* the growth strip — one creature per grade, so "grade" is a look, not just a letter */}
            <div className="rounded-[14px] border border-line bg-cream px-[15px] py-4 mb-3">
              <div className="flex justify-center items-end gap-2.5 sm:gap-4 flex-wrap">
                {LEVEL_ORDER.map((lv) => (
                  <figure key={lv} className="m-0 flex flex-col items-center gap-1.5 w-[54px] sm:w-[70px]">
                    <svg viewBox="0 0 220 230" className="w-full aspect-[220/230]">
                      <LevelCreature level={lv} />
                    </svg>
                    <figcaption className="text-[10.5px] font-bold text-muted">{lv}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            {/* level (grade) test: what triggers it */}
            <div className="rounded-[14px] border border-[var(--tint-violet-line)] bg-[var(--tint-violet)] px-[18px] py-4">
              <b className="block text-[15px] font-black tracking-[-0.015em] mb-2">{t("test.title")}</b>
              <p className="text-[12.5px] text-muted leading-[1.6] mb-2.5">
                {t("test.unlocksValue", {
                  words: ELIGIBILITY.targetMasteredWords,
                  passages: ELIGIBILITY.minReadingPassages,
                })}
              </p>
              {elig && gradeUp && (
                <p className={`text-[12.5px] mb-1 tabular-nums ${elig.eligible ? "text-success-deep font-semibold" : "text-muted"}`}>
                  {t("test.youStats", {
                    wordsHeld: elig.wordsMastered,
                    wordsRequired: elig.wordsRequired,
                    readingDone: elig.readingDone,
                    readingRequired: elig.readingRequired,
                  })}
                  {elig.eligible ? t("test.youReady", { from: grade, to: gradeUp }) : ""}
                </p>
              )}
            </div>
          </section>

          <p className="pt-[18px] border-t border-line text-[12.5px] text-muted max-w-[64ch]">
            {t("footer")}
          </p>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
