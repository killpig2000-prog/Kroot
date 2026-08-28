import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { ELIGIBILITY } from "@/lib/promotion-test";

// Each stop reuses its section's own accent from navItems, so a stop on the
// roadmap and the same entry in the sidebar read as the same thing.
type Stop = { icon: string; label: string; href: string; color: string; task: string; freq: string };

const S = {
  hangul: { icon: "🔤", label: "Hangul", href: "/hangul", color: "#E11D48" },
  grammar: { icon: "📖", label: "Grammar", href: "/grammar", color: "#4F46E5" },
  vocab: { icon: "🃏", label: "Vocabulary", href: "/vocabulary", color: "#7C3AED" },
  listen: { icon: "🎧", label: "Listening", href: "/listening", color: "#16A34A" },
  pron: { icon: "🌶️", label: "Pronunciation", href: "/speaking", color: "#0D9488" },
  write: { icon: "✏️", label: "Writing", href: "/writing", color: "#D97706" },
  read: { icon: "📰", label: "Reading", href: "/reading", color: "#2563EB" },
  slang: { icon: "💬", label: "Slang", href: "/slang", color: "#DB2777" },
} as const;

const stop = (k: keyof typeof S, task: string, freq: string): Stop => ({ ...S[k], task, freq });

const ROUTES: {
  icon: string;
  color: string;
  tag: string;
  name: string;
  sub: string;
  pace: string;
  stops: Stop[];
}[] = [
  {
    icon: "🗣️",
    color: "#0D9488",
    tag: "Most people start here",
    name: "Use Korean with people",
    sub: "Dramas, travel, friends. Skips the grammar you don't need yet.",
    pace: "20 min a day",
    stops: [
      stop("hangul", "the 40 letters", "1 hour"),
      stop("vocab", "words that carry a conversation", "10 min a day"),
      stop("listen", "dialogues at real speed", "3× a week"),
      stop("pron", "be understood first try", "5 min a day"),
      stop("slang", "stop sounding like a textbook", "when curious"),
    ],
  },
  {
    icon: "🎓",
    color: "#4F46E5",
    tag: "If you need the certificate",
    name: "Reach B2 or pass TOPIK",
    sub: "Grammar in order, nothing skipped. Slower to feel fluent, but it holds up.",
    pace: "30 min a day",
    stops: [
      stop("hangul", "the 40 letters", "1 hour"),
      stop("grammar", "every group, in order", "1 lesson a day"),
      stop("vocab", "units through B2", "15 min a day"),
      stop("read", "articles and essays", "3× a week"),
      stop("write", "journal, then opinion", "2× a week"),
    ],
  },
];

const FACTS = [
  {
    kicker: "Effort",
    title: "Tree level 1–120",
    body: "Every session earns XP. Leveling up means time put in — it doesn't change your grade.",
  },
  {
    kicker: "Ability",
    title: "Grade A1–C2",
    body: "Moves only when you pass a promotion test. That's when your tree changes species.",
  },
  {
    kicker: "Cosmetic",
    title: "The garden",
    body: "Costumes, skies, and companions from the Shop. Dress-up only, no effect on learning.",
  },
];

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
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
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
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Guide</b>
          </div>

          {/* head */}
          <div className="pb-5 mb-7 border-b border-line">
            <h1 className="font-bold text-[26px] tracking-[-0.025em] flex items-center mb-1 text-balance">
              <span className="inline-flex w-8 h-8 rounded-[9px] bg-[#F0F9FF] text-sky-deep border border-sky-line items-center justify-center text-[16px] mr-2.5">
                🧭
              </span>
              Guide
            </h1>
            <p className="text-[13.5px] text-muted max-w-[56ch]">
              Nothing in Kroot is locked by order. Pick whichever route matches why you&apos;re
              learning Korean, and follow it stop by stop.
            </p>
          </div>

          {/* roadmaps */}
          <section className="mb-11">
            <SectionHead
              title="Roadmaps"
              note="Pick one — running both at once is how people stall. Every stop is a link, so jump in wherever you already are."
            />

            <div className="flex flex-col gap-3.5">
              {ROUTES.map((route) => (
                <article
                  key={route.name}
                  className="relative overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_1px_2px_rgba(27,36,48,.04),0_8px_24px_-16px_rgba(27,36,48,.16)]"
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
                      <span
                        className="inline-block text-[9.5px] font-black uppercase tracking-[.09em] mb-1.5 px-2 py-[2.5px] rounded-full border"
                        style={{
                          color: route.color,
                          background: `${route.color}14`,
                          borderColor: `${route.color}4D`,
                        }}
                      >
                        {route.tag}
                      </span>
                      <b className="block text-[19px] font-black tracking-[-0.02em] text-balance">
                        {route.name}
                      </b>
                      <small className="block text-[12.5px] text-muted mt-1 leading-[1.55] max-w-[62ch]">
                        {route.sub}
                      </small>
                    </span>
                    <span
                      className="flex-none pl-2 text-[13px] font-black tracking-[-0.01em] tabular-nums whitespace-nowrap"
                      style={{ color: route.color }}
                    >
                      {route.pace}
                    </span>
                  </div>

                  {/* stops */}
                  <div className="relative px-3.5 pt-[22px] pb-5 grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-0">
                    {/* Wide screens: one continuous line through the dot centres.
                        A single even colour, so no segment reads as "completed". */}
                    <span
                      aria-hidden="true"
                      className="hidden sm:block absolute top-[44px] h-0.5 rounded-full left-[calc(14px+(100%-28px)/10)] right-[calc(14px+(100%-28px)/10)]"
                      style={{ background: `${route.color}8C` }}
                    />
                    {route.stops.map((s, i) => (
                      <Link
                        key={s.label}
                        href={s.href}
                        className="group relative flex sm:flex-col items-start sm:items-center gap-3.5 sm:gap-0 sm:text-center px-0 sm:px-[7px] sm:h-full"
                      >
                        {/* Narrow screens: a connector from this dot down to the next
                            one. Per-stop, so it can't drift out of sync with row height. */}
                        {i < route.stops.length - 1 && (
                          <span
                            aria-hidden="true"
                            className="sm:hidden absolute left-[21px] top-11 w-0.5 h-[calc(100%-6px)] rounded-full"
                            style={{ background: `${route.color}8C` }}
                          />
                        )}
                        <span
                          className="relative z-[1] flex-none w-11 h-11 rounded-[13px] flex items-center justify-center text-[19px] border-[1.5px] shadow-[0_0_0_5px_#fff] transition-transform duration-200 group-hover:-translate-y-[3px]"
                          style={{ background: `${s.color}1A`, borderColor: `${s.color}6B` }}
                        >
                          {s.icon}
                          <span
                            className="absolute z-[2] -top-1.5 -left-1.5 sm:left-auto sm:-right-1.5 min-w-[18px] h-[18px] px-[5px] rounded-full text-white text-[10px] font-black flex items-center justify-center leading-none tabular-nums shadow-[0_0_0_2.5px_#fff]"
                            style={{ background: s.color }}
                          >
                            {i + 1}
                          </span>
                        </span>
                        {/* flex column on wide screens so the frequency chips all sit on
                            one line, however many lines the description above them takes */}
                        <span className="min-w-0 sm:flex sm:flex-col sm:items-center sm:flex-1">
                          <b
                            className="block text-[14px] font-black tracking-[-0.015em] sm:mt-[13px] transition-colors group-hover:[color:var(--stop-color)]"
                            style={{ "--stop-color": s.color } as React.CSSProperties}
                          >
                            {s.label}
                          </b>
                          <small className="block text-[12px] text-muted leading-[1.5] mt-1 sm:max-w-[21ch] text-balance">
                            {s.task}
                          </small>
                          {/* a data chip, not more prose */}
                          <span className="block mt-2.5 sm:mt-auto sm:pt-2.5">
                            <span
                              className="inline-block text-[10.5px] font-extrabold tracking-[.02em] rounded-full px-[9px] py-[3px] border tabular-nums whitespace-nowrap"
                              style={{
                                color: s.color,
                                background: `${s.color}14`,
                                borderColor: `${s.color}38`,
                              }}
                            >
                              {s.freq}
                            </span>
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* the two surfaces that aren't on the sidebar at all */}
          <section className="mb-11">
            <SectionHead
              title="Two things the roadmap doesn't show"
              note="Neither is a stop on the route — one runs underneath it, the other ends it."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Link
                href="/review"
                className="group flex flex-col rounded-2xl border border-line bg-white px-[18px] pt-4 pb-3.5 shadow-[0_1px_2px_rgba(27,36,48,.04),0_8px_24px_-16px_rgba(27,36,48,.16)] transition-all hover:border-sky-deep hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-3 mb-2.5">
                  <span className="flex-none w-9 h-9 rounded-[11px] bg-[#F0F9FF] border border-sky-line flex items-center justify-center text-[18px]">
                    💧
                  </span>
                  <span>
                    <span className="block text-[9.5px] font-black uppercase tracking-[.09em] text-faint">
                      Every day
                    </span>
                    <b className="block text-[16px] font-black tracking-[-0.015em] transition-colors group-hover:text-sky-deep">
                      Watering time
                    </b>
                  </span>
                </span>
                <p className="text-[12.5px] text-muted leading-[1.6] mb-3">
                  Every word you study is scheduled to come back before you&apos;d forget it. You
                  don&apos;t track any of this — you just show up and water what&apos;s due.
                </p>
                <span className="flex flex-col gap-1.5 mt-auto pt-2.5 border-t border-[color:var(--c-warm-2)] text-[11.5px] text-muted leading-[1.5]">
                  <span>
                    <em className="not-italic font-black text-[9.5px] uppercase tracking-[.07em] text-faint mr-[7px]">
                      Where
                    </em>
                    Garden → Watering time
                  </span>
                  <span>
                    <em className="not-italic font-black text-[9.5px] uppercase tracking-[.07em] text-faint mr-[7px]">
                      How long
                    </em>
                    a few minutes
                  </span>
                </span>
              </Link>

              <Link
                href="/level-test"
                className="group flex flex-col rounded-2xl border border-line bg-white px-[18px] pt-4 pb-3.5 shadow-[0_1px_2px_rgba(27,36,48,.04),0_8px_24px_-16px_rgba(27,36,48,.16)] transition-all hover:border-[#7C3AED] hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-3 mb-2.5">
                  <span className="flex-none w-9 h-9 rounded-[11px] bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[18px]">
                    🎓
                  </span>
                  <span>
                    <span className="block text-[9.5px] font-black uppercase tracking-[.09em] text-faint">
                      Now and then
                    </span>
                    <b className="block text-[16px] font-black tracking-[-0.015em] transition-colors group-hover:text-[#7C3AED]">
                      Promotion test
                    </b>
                  </span>
                </span>
                <p className="text-[12.5px] text-muted leading-[1.6] mb-3">
                  The only thing that moves your grade. A word counts once it has survived its first
                  two spaced reviews, so this fills up as you study — you never decide when
                  you&apos;re ready.
                </p>
                <span className="flex flex-col gap-1.5 mt-auto pt-2.5 border-t border-[color:var(--c-warm-2)] text-[11.5px] text-muted leading-[1.5]">
                  <span>
                    <em className="not-italic font-black text-[9.5px] uppercase tracking-[.07em] text-faint mr-[7px]">
                      Unlocks at
                    </em>
                    {ELIGIBILITY.targetMasteredWords} words of your grade still held, plus{" "}
                    {ELIGIBILITY.minReadingPassages} reading passages
                  </span>
                  <span>
                    <em className="not-italic font-black text-[9.5px] uppercase tracking-[.07em] text-faint mr-[7px]">
                      To pass
                    </em>
                    60+ in every skill, 70+ average
                  </span>
                </span>
              </Link>
            </div>
          </section>

          {/* level vs grade vs garden */}
          <section className="mb-8">
            <SectionHead
              title="How progress works"
              note="Three things that sound related but move independently."
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FACTS.map((f) => (
                <div key={f.title} className="rounded-[14px] border border-line bg-white px-[15px] py-3.5">
                  <span className="block text-[10px] font-black uppercase tracking-[.09em] text-faint mb-1.5">
                    {f.kicker}
                  </span>
                  <b className="block text-[14px] font-extrabold tracking-[-0.01em] mb-1">{f.title}</b>
                  <p className="text-[12px] text-muted leading-[1.5]">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          <p className="pt-[18px] border-t border-line text-[12.5px] text-muted max-w-[64ch]">
            Everything here is self-paced — quizzes never block your progress and nothing expires.
            Come back to this page any time you feel lost.
          </p>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
