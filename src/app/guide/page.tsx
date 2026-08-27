import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { SECTIONS } from "@/components/dashboard/navItems";

const STEPS = [
  {
    n: 1,
    title: "Learn the alphabet",
    body: "40 letters, about an hour, free forever. Everything else in the app assumes you can already read Hangul.",
    href: "/hangul",
    cta: "Start Hangul →",
  },
  {
    n: 2,
    title: "Do Grammar's \"Start here\" group",
    body: "12 short lessons, in order — word order, be-verb, tenses, particles, and the basics of purpose/relative clauses/conditionals.",
    href: "/grammar",
    cta: "Open Grammar →",
  },
  {
    n: 3,
    title: "Pick one Practice track",
    body: "Listening, Reading, Writing, and Pronunciation are independent — start with whichever sounds least intimidating, not all four at once.",
    href: "/listening",
    cta: "Try Listening →",
  },
  {
    n: 4,
    title: "Water your vocabulary daily",
    body: "A few minutes a day. Words you've learned come back for spaced review on their own — no need to track it yourself.",
    href: "/vocabulary",
    cta: "Open Vocabulary →",
  },
  {
    n: 5,
    title: "Let League and the Shop pull you back",
    body: "Once studying is a habit, weekly League ranking and coins from the Shop are there for fun, not because you need them.",
    href: "/league",
    cta: "See League →",
  },
];

const TREE_FACTS = [
  {
    title: "Your tree & level",
    body: "Every study session earns XP, which grows your tree's level (1–120). Leveling up doesn't change your grade — it just means you're putting in the time.",
  },
  {
    title: "Your grade (CEFR)",
    body: "A1 through C2. Your tree only changes species when you pass a promotion test — level and grade move independently.",
  },
  {
    title: "The garden",
    body: "Costumes, skies, and companions from the Shop are entirely cosmetic — dress-up for your tree, no effect on learning.",
  },
  {
    title: "League",
    body: "A separate weekly ladder (Sprout → Diamond) ranked by how much you studied that week, not by CEFR grade. Promotion and demotion happen every Monday.",
  },
];

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
    <div className="min-h-screen bg-[#FFFFFF] text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Guide</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD] items-center justify-center text-[15px] mr-[9px]">
                🧭
              </span>
              Guide
            </h1>
            <span className="text-[13px] text-muted">how Kroot fits together</span>
          </div>

          {/* intro */}
          <div className="max-w-[820px] bg-[#F0F9FF] border border-[#BAE6FD] rounded-[14px] px-[18px] py-4 mb-7">
            <p className="text-[13.5px] text-charcoal leading-[1.65]">
              There&apos;s a lot on the sidebar. None of it is locked by order — this page is just a
              suggested path if you don&apos;t know where to start, plus a quick map of what each
              part actually does.
            </p>
          </div>

          {/* where to start */}
          <section className="max-w-[820px] mb-8">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint">
                Where to start
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <p className="text-[12.5px] text-muted mb-3">
              A suggestion, not a gate — jump around freely once you&apos;re comfortable.
            </p>

            <div className="border border-line rounded-[14px] overflow-hidden">
              {STEPS.map((s, i) => (
                <Link
                  key={s.n}
                  href={s.href}
                  className={`flex items-start gap-3.5 px-[18px] py-[15px] bg-white transition-all duration-150 hover:bg-[#F0F9FF] group ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <span className="flex-none w-8 h-8 rounded-[10px] bg-warm border border-line flex items-center justify-center text-[12.5px] font-bold text-muted transition-all group-hover:bg-[#0284C7] group-hover:border-[#0284C7] group-hover:text-white mt-0.5">
                    {s.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block font-semibold text-[15px] mb-0.5">{s.title}</b>
                    <small className="block text-[12.5px] text-muted leading-[1.5]">{s.body}</small>
                  </span>
                  <span className="flex-none text-[12px] font-semibold text-[#0284C7] whitespace-nowrap mt-1 transition-transform group-hover:translate-x-0.5">
                    {s.cta}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* what everything is */}
          <section className="max-w-[820px] mb-8">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint">
                What everything is
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <p className="text-[12.5px] text-muted mb-3">The sidebar&apos;s three groups, in one line each.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SECTIONS.map((section) => (
                <div key={section.title} className="border border-line rounded-[14px] bg-white px-4 py-3.5">
                  <b className="block text-[13px] font-bold mb-2">{section.title}</b>
                  <ul className="flex flex-col gap-2">
                    {section.items.map((item) => (
                      <li key={item.label} className="flex items-center gap-2">
                        <span
                          className="flex-none w-5 h-5 rounded-[6px] border flex items-center justify-center text-[10.5px]"
                          style={item.color ? { background: item.color.bg, borderColor: item.color.border, color: item.color.text } : undefined}
                        >
                          {item.icon}
                        </span>
                        <span className="text-[12.5px] font-medium">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* tree / level / league */}
          <section className="max-w-[820px] mb-8">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint">
                Your tree, level, and league
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <p className="text-[12.5px] text-muted mb-3">Four things that sound related but move independently.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TREE_FACTS.map((f) => (
                <div key={f.title} className="border border-line rounded-[14px] bg-white px-4 py-3.5">
                  <b className="block text-[13px] font-bold mb-1">{f.title}</b>
                  <p className="text-[12.5px] text-muted leading-[1.55]">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          <p className="max-w-[820px] text-[12.5px] text-muted">
            Everything here is self-paced — quizzes never block your progress, and there&apos;s no
            deadline on any of it. Come back to this page any time you feel lost.
          </p>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
