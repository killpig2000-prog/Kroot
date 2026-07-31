import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { UNIT_ICONS, getChaptersForTopic, getUnitTitle, unlockedVocabTiers } from "@/lib/vocabulary";
import { LEVEL_ORDER, nextLevel, type CefrLevel } from "@/lib/tree";


function isCefrLevel(value: string | undefined): value is CefrLevel {
  return !!value && (LEVEL_ORDER as string[]).includes(value);
}

const TOPIC_KEY = "daily-life";

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, streak_days, avatar_url, xp")
    .eq("id", user.id)
    .single();

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const sp = await searchParams;

  const { data: progressRows } = await supabase
    .from("vocabulary_progress")
    .select("word_key, last_reviewed_at")
    .eq("user_id", user.id)
    .not("last_reviewed_at", "is", null);
  const reviewedKeys = new Set((progressRows ?? []).map((r) => r.word_key));

  const unlockedTiers = unlockedVocabTiers(myLevel);

  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = unlockedTiers.has(requested) ? requested : myLevel;
  const next = nextLevel(level);

  const chapters = getChaptersForTopic(TOPIC_KEY, level);

  const units = chapters.map((words, i) => {
    const known = words.filter((w) => reviewedKeys.has(w.key)).length;
    const status = known === 0 ? "not-started" : known < words.length ? "in-progress" : "done";
    return { index: i, words, known, status };
  });
  const doneUnits = units.filter((u) => u.status === "done").length;

  // The three level pills shown in the hero: previous · current · next.
  const levelIdx = LEVEL_ORDER.indexOf(level);
  const pillLevels = LEVEL_ORDER.slice(Math.max(0, levelIdx - 1), levelIdx + 2);

  return (
    <div className="min-h-screen bg-white text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[820px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-[#A1A1AA] mb-[18px]">
            <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold">Vocabulary</b>
          </div>

          {/* growth-stage legend */}
          <div className="flex gap-4 flex-wrap mb-5 text-[13px] text-[#71717A]">
            <span>🌰 Seed</span>
            <span>🌱 Sprout</span>
            <span>🌿 Rooting</span>
            <span>🌳 Settled</span>
          </div>

          {/* level hero */}
          <div className="border border-[#E7E5E4] rounded-[16px] px-6 py-6 mb-7 flex items-center gap-5 flex-wrap">
            <span className="w-[70px] h-[70px] rounded-[14px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[34px] flex-none">
              🪴
            </span>
            <div className="flex-1 min-w-[220px]">
              <h1 className="font-bold text-[22px] tracking-[-0.02em] mb-0.5">
                Level {level} vocabulary
              </h1>
              <p className="text-sm text-[#71717A] mb-3">
                {next ? `Finish every unit to grow into ${next}` : "Top level — keep those roots strong"}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-[300px] h-2 rounded-full bg-[#E7E5E4] overflow-hidden">
                  <i
                    className="not-italic block h-full rounded-full bg-[#16A34A] transition-all"
                    style={{ width: `${units.length ? (doneUnits / units.length) * 100 : 0}%` }}
                  />
                </div>
                <b className="text-[13.5px] font-bold flex-none">
                  {doneUnits}/{units.length} units
                </b>
              </div>
            </div>
            <div className="flex gap-1.5 flex-none">
              {pillLevels.map((lv) =>
                unlockedTiers.has(lv) ? (
                  <Link
                    key={lv}
                    href={`/vocabulary?level=${lv}`}
                    className={`rounded-[10px] px-3.5 py-2 text-[13.5px] font-bold border transition-colors ${
                      lv === level
                        ? "bg-[#16A34A] border-[#16A34A] text-white"
                        : "bg-white border-[#E7E5E4] text-[#A1A1AA] hover:border-[#A1A1AA]"
                    }`}
                  >
                    {lv}
                  </Link>
                ) : (
                  <div
                    key={lv}
                    className="rounded-[10px] px-3.5 py-2 text-[13.5px] font-bold border bg-[#FAFAF9] border-[#E7E5E4] text-[#A1A1AA] grayscale opacity-60 cursor-not-allowed select-none text-center leading-tight"
                  >
                    🔒 {lv}
                    <small className="block text-[10.5px] font-bold">promotion test</small>
                  </div>
                )
              )}
            </div>
          </div>

          {/* units */}
          <h2 className="font-bold text-[16px] tracking-[-0.01em] mb-3.5">Units in {level}</h2>
          <div className="grid gap-3 mb-7">
            {units.map((u) => {
              const meta = UNIT_ICONS[u.index % UNIT_ICONS.length];
              return (
                <Link
                  key={u.index}
                  href={`/vocabulary/${TOPIC_KEY}/session?chapter=${u.index}&level=${level}`}
                  className="border border-[#E7E5E4] rounded-[14px] bg-white px-5 py-4 flex items-center gap-4 transition-all duration-150 hover:border-[#16A34A] hover:bg-[#F0FDF4] hover:-translate-y-0.5 group"
                >
                  <span
                    className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center text-[21px] flex-none transition-transform group-hover:scale-110"
                    style={{ background: meta.bg }}
                  >
                    {meta.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <b className="block font-bold text-[15.5px]">{getUnitTitle(level, u.index)}</b>
                    <small className="block text-[13px] text-[#71717A]">
                      {u.words.length} word{u.words.length === 1 ? "" : "s"}
                    </small>
                  </span>
                  <span className="text-right flex-none">
                    <span
                      className={`inline-block text-[12px] font-semibold rounded-full border px-3 py-[3px] mb-1.5 ${
                        u.status === "done"
                          ? "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]"
                          : u.status === "in-progress"
                          ? "text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]"
                          : "text-[#A1A1AA] bg-[#FAFAF9] border-[#E7E5E4]"
                      }`}
                    >
                      {u.status === "done" ? "Done" : u.status === "in-progress" ? "In progress" : "Not started"}
                    </span>
                    <small className="block text-[12.5px] text-[#A1A1AA]">
                      {u.known}/{u.words.length} known
                    </small>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* grow banner */}
          <div className="border border-[#BBF7D0] bg-[#F0FDF4] rounded-[14px] px-5 py-4 text-[13.5px] text-[#15803D] flex items-center gap-2.5">
            <span className="text-base">🌳</span>
            {next ? (
              <span>
                Complete all {units.length} units above to grow your tree into <b>{next}</b>.
              </span>
            ) : (
              <span>You&apos;ve reached the canopy — review any unit to keep it fresh.</span>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
