import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWordsForTopic } from "@/lib/vocabulary-words";

// The old /stats (Insights) page, now embedded at the bottom of My growth.
// The section keeps the #insights anchor so old /stats links land here after
// redirect.

// Emoji only — the labels are translated under profile.insights.skills.
const SKILL_EMOJI: Record<string, string> = {
  reading: "📰",
  writing: "✏️",
  listening: "🎧",
  speaking: "🎙️",
  vocabulary: "🃏",
  grammar: "📖",
  pronunciation: "🔊",
  hangul: "🔤",
  slang: "💬",
  quest: "🗺️",
};

// Leitner boxes 1-5.
const BOX_KEYS = ["1", "2", "3", "4", "5"] as const;

const CARD = "border border-line rounded-[14px] px-[22px] py-5";

export default async function InsightsSection({ userId }: { userId: string }) {
  const t = await getTranslations("profile.insights");
  const locale = await getLocale();
  const supabase = await createClient();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
  twoWeeksAgo.setHours(0, 0, 0, 0);

  const [{ data: xpRows }, { data: vocabRows }, { data: readingRows }, { data: speakingRows }] =
    await Promise.all([
      supabase
        .from("xp_events")
        .select("points, skill, created_at")
        .eq("user_id", userId)
        .gte("created_at", twoWeeksAgo.toISOString()),
      supabase
        .from("vocabulary_progress")
        .select("word_key, correct_count, incorrect_count, box")
        .eq("user_id", userId),
      supabase
        .from("reading_progress")
        .select("correct_count, incorrect_count")
        .eq("user_id", userId),
      supabase.from("speaking_progress").select("best_score").eq("user_id", userId),
    ]);

  // XP per day, last 14 days
  const xpByDay = new Map<string, number>();
  const xpBySkill = new Map<string, number>();
  for (const e of xpRows ?? []) {
    const day = e.created_at.slice(0, 10);
    xpByDay.set(day, (xpByDay.get(day) ?? 0) + e.points);
    if (e.skill) xpBySkill.set(e.skill, (xpBySkill.get(e.skill) ?? 0) + e.points);
  }
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const date = d.toISOString().slice(0, 10);
    return {
      date,
      label: d.toLocaleDateString(locale, { weekday: "narrow" }),
      xp: xpByDay.get(date) ?? 0,
    };
  });
  const maxDayXp = Math.max(...days.map((d) => d.xp), 1);
  const xpTotal14 = days.reduce((sum, d) => sum + d.xp, 0);

  const skillRows = [...xpBySkill.entries()]
    .filter(([skill]) => SKILL_EMOJI[skill])
    .sort((a, b) => b[1] - a[1]);
  const maxSkillXp = Math.max(...skillRows.map(([, xp]) => xp), 1);

  // Vocabulary accuracy + Leitner boxes + weakest words
  const vocab = vocabRows ?? [];
  const vCorrect = vocab.reduce((s, v) => s + (v.correct_count ?? 0), 0);
  const vWrong = vocab.reduce((s, v) => s + (v.incorrect_count ?? 0), 0);
  const vocabAccuracy = vCorrect + vWrong > 0 ? Math.round((vCorrect / (vCorrect + vWrong)) * 100) : null;

  const boxCounts = [0, 0, 0, 0, 0];
  for (const v of vocab) {
    const b = Math.min(5, Math.max(1, v.box ?? 1));
    boxCounts[b - 1]++;
  }
  const maxBox = Math.max(...boxCounts, 1);

  // word_key = "<topic>:<level>:<korean>"; meaning looked up from the deck.
  const meanings = new Map<string, string>();
  for (const topic of new Set(vocab.map((v) => v.word_key.split(":")[0]))) {
    for (const w of getWordsForTopic(topic)) meanings.set(w.key, w.meaning_en);
  }
  const weakest = vocab
    .filter((v) => (v.incorrect_count ?? 0) > 0)
    .sort(
      (a, b) =>
        b.incorrect_count - a.incorrect_count ||
        (a.correct_count ?? 0) - (b.correct_count ?? 0)
    )
    .slice(0, 8)
    .map((v) => {
      const [, level, korean] = v.word_key.split(":");
      return {
        korean,
        level,
        meaning: meanings.get(v.word_key),
        correct: v.correct_count ?? 0,
        wrong: v.incorrect_count ?? 0,
      };
    });

  const rCorrect = (readingRows ?? []).reduce((s, r) => s + (r.correct_count ?? 0), 0);
  const rWrong = (readingRows ?? []).reduce((s, r) => s + (r.incorrect_count ?? 0), 0);
  const readingAccuracy = rCorrect + rWrong > 0 ? Math.round((rCorrect / (rCorrect + rWrong)) * 100) : null;

  const speakingScores = (speakingRows ?? [])
    .map((r) => r.best_score)
    .filter((s): s is number => typeof s === "number");
  const speakingAvg = speakingScores.length
    ? Math.round(speakingScores.reduce((a, b) => a + b, 0) / speakingScores.length)
    : null;

  return (
    <>
      <div className="flex items-center gap-2 mt-2" id="insights">
        <b className="font-bold text-[15px] tracking-[-0.01em]">{t("title")}</b>
      </div>

      {/* headline tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("tiles.wordAccuracy"), value: vocabAccuracy !== null ? `${vocabAccuracy}%` : "—" },
          { label: t("tiles.readingAccuracy"), value: readingAccuracy !== null ? `${readingAccuracy}%` : "—" },
          { label: t("tiles.pronunciationScore"), value: speakingAvg !== null ? `${speakingAvg}` : "—" },
          { label: t("tiles.xp14"), value: `${xpTotal14}` },
        ].map((s) => (
          <div key={s.label} className={`${CARD} !px-4 !py-3.5 text-center`}>
            <b className="block text-[19px] font-extrabold tracking-[-0.02em] tabular-nums">
              {s.value}
            </b>
            <small className="text-[11.5px] text-faint">{s.label}</small>
          </div>
        ))}
      </div>

      {/* XP timeline */}
      <div className={CARD}>
        <div className="flex justify-between items-baseline mb-4 gap-3">
          <b className="font-semibold text-[15px] tracking-[-0.01em]">{t("xpTitle")}</b>
          <span className="text-[12px] text-faint font-medium">{t("xpPerDay")}</span>
        </div>
        <div className="flex items-end gap-1.5 h-[110px]" aria-hidden="true">
          {days.map((d, i) => {
            const isToday = i === days.length - 1;
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col justify-end items-center gap-1 h-full"
                title={t("xpDayTitle", { date: d.date, xp: d.xp })}
              >
                <div
                  className={`w-full max-w-[22px] rounded-t-[4px] ${
                    isToday ? "bg-amber" : d.xp > 0 ? "bg-amber-line" : "bg-line"
                  }`}
                  style={{ height: Math.max(3, Math.round((d.xp / maxDayXp) * 90)) }}
                />
                <span className={`text-[10px] leading-none ${isToday ? "text-charcoal font-semibold" : "text-faint"}`}>
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* XP by skill */}
      <div className={CARD}>
        <b className="font-semibold text-[15px] tracking-[-0.01em] block mb-3.5">
          {t("bySkillTitle")}
        </b>
        {skillRows.length === 0 ? (
          <p className="text-[13px] text-faint">{t("bySkillEmpty")}</p>
        ) : (
          <div className="grid gap-2.5">
            {skillRows.map(([skill, xp]) => (
              <div key={skill} className="flex items-center gap-3">
                <span className="flex-none w-[130px] text-[12.5px] font-semibold text-muted">
                  {SKILL_EMOJI[skill]} {t(`skills.${skill}`)}
                </span>
                <span className="flex-1 h-2.5 rounded-full bg-[var(--tint-stone)] overflow-hidden">
                  <span
                    className="block h-full rounded-full bg-success"
                    style={{ width: `${Math.round((xp / maxSkillXp) * 100)}%` }}
                  />
                </span>
                <b className="flex-none w-[52px] text-right text-[12.5px] tabular-nums">{t("xpAmount", { xp })}</b>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leitner boxes */}
      <div className={CARD}>
        <div className="flex justify-between items-baseline mb-3.5 gap-3">
          <b className="font-semibold text-[15px] tracking-[-0.01em]">{t("boxesTitle")}</b>
          <span className="text-[12px] text-faint font-medium">{t("wordCount", { n: vocab.length })}</span>
        </div>
        <div className="grid gap-2.5">
          {BOX_KEYS.map((box, i) => (
            <div key={box} className="flex items-center gap-3">
              <span className="flex-none w-[130px] text-[12.5px] font-semibold text-muted">
                {t(`boxes.${box}`)}
              </span>
              <span className="flex-1 h-2.5 rounded-full bg-[var(--tint-stone)] overflow-hidden">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.round((boxCounts[i] / maxBox) * 100)}%`,
                    background: ["#FCA5A5", "#FDBA74", "#FDE047", "#BBF7D0", "#3E7C59"][i],
                  }}
                />
              </span>
              <b className="flex-none w-[52px] text-right text-[12.5px] tabular-nums">{boxCounts[i]}</b>
            </div>
          ))}
        </div>
      </div>

      {/* weakest words */}
      <div className={CARD}>
        <div className="flex justify-between items-baseline mb-3 gap-3">
          <b className="font-semibold text-[15px] tracking-[-0.01em]">{t("weakestTitle")}</b>
          <Link href="/review" className="text-[12.5px] font-semibold text-success hover:underline">
            {t("weakestLink")}
          </Link>
        </div>
        {weakest.length === 0 ? (
          <p className="text-[13px] text-faint">{t("weakestEmpty")}</p>
        ) : (
          <div className="grid gap-1">
            {weakest.map((w) => (
              <div
                key={`${w.level}:${w.korean}`}
                className="flex items-center gap-3 py-1.5 border-b border-dashed border-line last:border-b-0"
              >
                <b className="kr flex-none text-[15px] font-semibold min-w-[90px]">{w.korean}</b>
                <span className="flex-1 min-w-0 text-[12.5px] text-muted truncate">
                  {w.meaning ?? ""}
                </span>
                <span className="flex-none text-[11.5px] font-semibold text-faint">{w.level}</span>
                <span className="flex-none text-[12px] tabular-nums">
                  <span className="text-success font-semibold">{w.correct}✓</span>{" "}
                  <span className="text-[#C13E78] font-semibold">{w.wrong}✗</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[12px] text-faint">{t("footnote")}</p>
    </>
  );
}
