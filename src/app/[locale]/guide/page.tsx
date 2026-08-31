import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { ELIGIBILITY } from "@/lib/promotion-test";
import {
  formatDoneDate,
  getGuideProgress,
  resolveRoute,
  type GuideProgress,
  type GuideStationKey,
  type GuideStationView,
} from "@/lib/guide-progress";
import { nextLevel, type CefrLevel } from "@/lib/tree";

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
const SUN_INK = "#7A5A12";
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
            <h1 className="font-bold text-[26px] tracking-[-0.025em] flex items-center mb-1 text-balance">
              <span className="inline-flex w-8 h-8 rounded-[9px] bg-[var(--tint-sky)] text-sky-deep border border-sky-line items-center justify-center text-[16px] mr-2.5">
                🧭
              </span>
              {tn("guide")}
            </h1>
            <p className="text-[13.5px] text-muted max-w-[56ch]">
              {t("intro")}
            </p>
          </div>

          {/* roadmaps */}
          <section className="mb-11">
            <SectionHead
              title={t("sections.roadmaps.title")}
              note={t("sections.roadmaps.note")}
            />

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
                    <span
                      className="flex-none w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-[19px] border"
                      style={{ background: `${route.color}1A`, borderColor: `${route.color}4D` }}
                    >
                      {route.icon}
                    </span>
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
                      <small className="block text-[12.5px] text-muted mt-1 leading-[1.55] max-w-[62ch]">
                        {t(`routes.${route.key}.sub`)}
                      </small>
                    </span>
                    <span
                      className="hidden sm:inline flex-none pl-2 text-[13px] font-black tracking-[-0.01em] tabular-nums whitespace-nowrap"
                      style={{ color: route.color }}
                    >
                      {t(`routes.${route.key}.pace`)}
                    </span>
                  </div>

                  {/* stops */}
                  <div className="relative px-3.5 pt-[22px] pb-5 grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-0">
                    {/* Wide screens, no progress data: one continuous line through the
                        dot centres. A single even colour, so no segment reads as "completed".
                        With progress, each stop draws its own segment below instead. */}
                    {!views && (
                      <span
                        aria-hidden="true"
                        className="hidden sm:block absolute top-[44px] h-0.5 rounded-full left-[calc(14px+(100%-28px)/10)] right-[calc(14px+(100%-28px)/10)]"
                        style={{ background: `${route.color}8C` }}
                      />
                    )}
                    {route.stops.map((s, i) => {
                      const v = views?.[i] ?? null;
                      const isDone = v?.status === "done";
                      const isCurrent = v?.status === "current";
                      const isUpcoming = v?.status === "upcoming";
                      const hasNext = i < route.stops.length - 1;
                      // The segment after a done stop recedes to dots; the rest stay
                      // the route's solid line.
                      const segmentStyle: React.CSSProperties = isDone
                        ? { borderColor: "var(--c-success)" }
                        : { background: `${route.color}8C` };
                      return (
                      <Link
                        key={s.key}
                        href={isCurrent && v ? v.ctaHref : s.href}
                        aria-current={isCurrent ? "step" : undefined}
                        className={`group relative flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 sm:text-center px-0 sm:px-[7px] sm:h-full ${
                          isUpcoming ? "opacity-60 hover:opacity-100 transition-opacity" : ""
                        }`}
                      >
                        {/* Wide screens with progress: this dot's centre to the next one's */}
                        {views && hasNext && (
                          <span
                            aria-hidden="true"
                            className={`hidden sm:block absolute top-[43px] left-1/2 w-full ${
                              isDone ? "border-t-2 border-dotted" : "h-0.5 rounded-full"
                            }`}
                            style={segmentStyle}
                          />
                        )}
                        {/* Narrow screens: a connector from this dot down to the next
                            one. Per-stop, so it can't drift out of sync with row height. */}
                        {hasNext && (
                          <span
                            aria-hidden="true"
                            className={`sm:hidden absolute left-[21px] top-11 h-[calc(100%-6px)] ${
                              isDone ? "border-l-2 border-dotted" : "w-0.5 rounded-full"
                            }`}
                            style={segmentStyle}
                          />
                        )}
                        <span
                          className={`relative z-[1] flex-none w-11 h-11 rounded-[13px] flex items-center justify-center text-[19px] border-[1.5px] transition-transform duration-200 group-hover:-translate-y-[3px] ${
                            isCurrent
                              ? "shadow-[0_0_0_5px_#fff,0_0_0_9px_rgba(255,214,107,.4)]"
                              : "shadow-[0_0_0_5px_#fff]"
                          }`}
                          style={
                            isCurrent
                              ? { background: SUN_PAPER, borderColor: SUN_EDGE }
                              : { background: `${s.color}1A`, borderColor: `${s.color}6B` }
                          }
                        >
                          {s.icon}
                          <span
                            className="absolute z-[2] -top-1.5 -left-1.5 sm:left-auto sm:-right-1.5 min-w-[18px] h-[18px] px-[5px] rounded-full text-white text-[10px] font-black flex items-center justify-center leading-none tabular-nums shadow-[0_0_0_2.5px_#fff]"
                            style={{
                              background: isDone ? "var(--c-success)" : isCurrent ? SUN_EDGE : s.color,
                            }}
                          >
                            {isDone ? "✓" : i + 1}
                          </span>
                        </span>
                        {/* flex column on wide screens so the frequency chips all sit on
                            one line, however many lines the description above them takes.
                            The current stop's column becomes a small sun-paper card. */}
                        <span
                          className={`min-w-0 sm:flex sm:flex-col sm:items-center sm:flex-1 ${
                            isCurrent
                              ? "flex-1 sm:flex-none sm:w-full sm:mt-[13px] rounded-[12px] border-[1.5px] px-3 py-2.5 shadow-[0_4px_14px_-8px_rgba(226,166,0,.7)]"
                              : ""
                          }`}
                          style={isCurrent ? { background: SUN_PAPER, borderColor: SUN_EDGE } : undefined}
                        >
                          {isCurrent && (
                            <span
                              className="inline-flex items-center gap-1 self-start sm:self-center bg-sun text-[9.5px] font-black uppercase tracking-[.09em] rounded-full px-2 py-[2.5px] mb-1.5"
                              style={{ color: SUN_INK }}
                            >
                              <span aria-hidden="true">●</span> {t("youAreHere")}
                            </span>
                          )}
                          <b
                            className={`block text-[14px] font-black tracking-[-0.015em] transition-colors ${
                              isCurrent ? "" : "sm:mt-[13px]"
                            } ${
                              isDone
                                ? "text-muted line-through decoration-2 decoration-success-line"
                                : "group-hover:[color:var(--stop-color)]"
                            }`}
                            style={{ "--stop-color": s.color } as React.CSSProperties}
                          >
                            {tn(s.navKey)}
                          </b>
                          {isDone && v ? (
                            <small className="block text-[12px] font-semibold text-success-deep leading-[1.5] mt-1 tabular-nums">
                              {v.doneAt ? `${t("doneOn", { date: formatDoneDate(v.doneAt) })} · ` : ""}
                              {v.detail}
                            </small>
                          ) : (
                            <small className="block text-[12px] text-muted leading-[1.5] mt-1 sm:max-w-[21ch] text-balance">
                              {t(`routes.${route.key}.stops.${s.key}.task`)}
                            </small>
                          )}
                          {isCurrent && v && (
                            <>
                              <span
                                className="block w-full h-1.5 rounded-full mt-2.5 overflow-hidden"
                                style={{ background: "#F1E4B8" }}
                                role="progressbar"
                                aria-valuenow={v.percent}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              >
                                <span className="block h-full rounded-full bg-success" style={{ width: `${v.percent}%` }} />
                              </span>
                              <small
                                className="block text-[11.5px] font-semibold leading-[1.5] mt-1 tabular-nums"
                                style={{ color: SUN_INK }}
                              >
                                {v.detail}
                              </small>
                              {/* the stop itself is the link, so this is a styled span, not a nested button */}
                              <span className="inline-block self-start sm:self-center mt-2.5 rounded-[9px] bg-success text-white text-[12px] font-bold px-3 py-1.5 text-balance transition-colors group-hover:bg-success-deep">
                                {v.ctaLabel}
                              </span>
                            </>
                          )}
                          {isUpcoming && v && (
                            <small className="block text-[11.5px] text-faint leading-[1.5] mt-1 sm:max-w-[21ch] text-balance">
                              {v.note}
                            </small>
                          )}
                          {/* a data chip, not more prose — dropped on done/current stops,
                              where the status line has taken its place */}
                          {!isDone && !isCurrent && (
                            <span className="block mt-2.5 sm:mt-auto sm:pt-2.5">
                              <span
                                className="inline-block text-[10.5px] font-extrabold tracking-[.02em] rounded-full px-[9px] py-[3px] border tabular-nums whitespace-nowrap"
                                style={{
                                  color: s.color,
                                  background: `${s.color}14`,
                                  borderColor: `${s.color}38`,
                                }}
                              >
                                {t(`routes.${route.key}.stops.${s.key}.freq`)}
                              </span>
                            </span>
                          )}
                        </span>
                      </Link>
                      );
                    })}
                  </div>
                </article>
                );
              })}
            </div>
          </section>

          {/* the two surfaces that aren't on the sidebar at all */}
          <section className="mb-11">
            <SectionHead
              title={t("sections.extras.title")}
              note={t("sections.extras.note")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Link
                href="/review"
                className="group flex flex-col rounded-2xl border border-line bg-cream px-[18px] pt-4 pb-3.5 shadow-[0_1px_2px_rgba(27,36,48,.04),0_8px_24px_-16px_rgba(27,36,48,.16)] transition-all hover:border-sky-deep hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-3 mb-2.5">
                  <span className="flex-none w-9 h-9 rounded-[11px] bg-[var(--tint-sky)] border border-sky-line flex items-center justify-center text-[18px]">
                    💧
                  </span>
                  <span>
                    <span className="block text-[9.5px] font-black uppercase tracking-[.09em] text-faint">
                      {t("review.kicker")}
                    </span>
                    <b className="block text-[16px] font-black tracking-[-0.015em] transition-colors group-hover:text-sky-deep">
                      {t("review.title")}
                    </b>
                  </span>
                </span>
                <p className="text-[12.5px] text-muted leading-[1.6] mb-3">
                  {t("review.body")}
                </p>
                <span className="flex flex-col gap-1.5 mt-auto pt-2.5 border-t border-[color:var(--c-warm-2)] text-[11.5px] text-muted leading-[1.5]">
                  <span>
                    <em className="not-italic font-black text-[9.5px] uppercase tracking-[.07em] text-faint mr-[7px]">
                      {t("review.whereLabel")}
                    </em>
                    {t("review.whereValue")}
                  </span>
                  <span>
                    <em className="not-italic font-black text-[9.5px] uppercase tracking-[.07em] text-faint mr-[7px]">
                      {t("review.howLongLabel")}
                    </em>
                    {t("review.howLongValue")}
                  </span>
                </span>
              </Link>

              <Link
                href="/level-test"
                className="group flex flex-col rounded-2xl border border-line bg-cream px-[18px] pt-4 pb-3.5 shadow-[0_1px_2px_rgba(27,36,48,.04),0_8px_24px_-16px_rgba(27,36,48,.16)] transition-all hover:border-[#6B33CC] hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-3 mb-2.5">
                  <span className="flex-none w-9 h-9 rounded-[11px] bg-[var(--tint-violet)] border border-[var(--tint-violet-line)] flex items-center justify-center text-[18px]">
                    🎓
                  </span>
                  <span>
                    <span className="block text-[9.5px] font-black uppercase tracking-[.09em] text-faint">
                      {t("test.kicker")}
                    </span>
                    <b className="block text-[16px] font-black tracking-[-0.015em] transition-colors group-hover:text-[#6B33CC]">
                      {t("test.title")}
                    </b>
                  </span>
                </span>
                <p className="text-[12.5px] text-muted leading-[1.6] mb-3">
                  {t("test.body")}
                </p>
                <span className="flex flex-col gap-1.5 mt-auto pt-2.5 border-t border-[color:var(--c-warm-2)] text-[11.5px] text-muted leading-[1.5]">
                  <span>
                    <em className="not-italic font-black text-[9.5px] uppercase tracking-[.07em] text-faint mr-[7px]">
                      {t("test.unlocksLabel")}
                    </em>
                    {t("test.unlocksValue", {
                      words: ELIGIBILITY.targetMasteredWords,
                      passages: ELIGIBILITY.minReadingPassages,
                    })}
                  </span>
                  {elig && gradeUp && (
                    <span className={elig.eligible ? "text-success-deep font-semibold" : ""}>
                      <em className="not-italic font-black text-[9.5px] uppercase tracking-[.07em] text-faint mr-[7px]">
                        {t("test.youLabel")}
                      </em>
                      <span className="tabular-nums">
                        {t("test.youStats", {
                          wordsHeld: elig.wordsMastered,
                          wordsRequired: elig.wordsRequired,
                          readingDone: elig.readingDone,
                          readingRequired: elig.readingRequired,
                        })}
                      </span>
                      {elig.eligible ? t("test.youReady", { from: grade, to: gradeUp }) : ""}
                    </span>
                  )}
                  <span>
                    <em className="not-italic font-black text-[9.5px] uppercase tracking-[.07em] text-faint mr-[7px]">
                      {t("test.toPassLabel")}
                    </em>
                    {t("test.toPassValue")}
                  </span>
                </span>
              </Link>
            </div>
          </section>

          {/* level vs grade vs garden */}
          <section className="mb-8">
            <SectionHead
              title={t("sections.progress.title")}
              note={t("sections.progress.note")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
