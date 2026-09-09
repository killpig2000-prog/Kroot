"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { speakKorean, prefetchKorean } from "@/lib/tts";
import {
  BASIC_CONSONANTS,
  BASIC_VOWELS,
  CHO,
  COMPOUND_VOWELS,
  DOUBLE_CONSONANTS,
  JUNG,
  PRACTICE_WORDS,
  ROM_BY_JAMO,
  composeSyllable,
  type Jamo,
} from "@/lib/hangul";
import { XP_POINTS } from "@/lib/activity";
import type { TraceScore } from "@/lib/hangul-trace";
import { useBackToClose } from "@/hooks/useBackToClose";
import JamoGlyph from "@/components/hangul/JamoGlyph";
import TracePanel, { Stars, type GradedInfo, type TraceTarget } from "@/components/hangul/TracePanel";
import type { TraceMode } from "@/components/hangul/TraceCanvas";
import { useHangulProgress, type JamoProgress } from "@/components/hangul/useHangulProgress";

const GREEN = "#3E7C59";
const SOFT = "#F0FDF4";
const BRD = "#BBF7D0";
const HANGUL_ACCENT = "#B04A5E";

function speak(text: string) {
  speakKorean(text);
}

const TABS = [
  { key: "consonants", kr: "자음" },
  { key: "vowels", kr: "모음" },
  { key: "syllables", kr: "글자 만들기" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SECTION_LABEL =
  "text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2.5";

const CONSONANT_LIST: Jamo[] = [...BASIC_CONSONANTS, ...DOUBLE_CONSONANTS];
const VOWEL_LIST: Jamo[] = [...BASIC_VOWELS, ...COMPOUND_VOWELS];
const ALL_JAMO: Jamo[] = [...CONSONANT_LIST, ...VOWEL_LIST];
const JAMO_BY_CHAR = new Map(ALL_JAMO.map((j) => [j.char, j]));
const CONSONANT_SET = new Set(CONSONANT_LIST.map((j) => j.char));
const kindOf = (char: string): "consonant" | "vowel" => (CONSONANT_SET.has(char) ? "consonant" : "vowel");

/** Letters in one challenge run; fewer only when fewer have been practiced. */
const RUN_SIZE = 10;
/** Practiced letters needed before a run makes sense. */
const RUN_MIN = 3;

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function StatusBadge({ p }: { p: JamoProgress }) {
  if (p.bestStars > 0) {
    return (
      <span className="absolute top-1.5 right-2 text-[9.5px] leading-none" aria-label={`${p.bestStars}/3`}>
        <Stars n={p.bestStars} size={9.5} />
      </span>
    );
  }
  if (p.practiced) {
    return <span className="absolute top-1.5 right-2 text-[10px] font-black leading-none text-success-deep">✓</span>;
  }
  return <span className="absolute top-2 right-2 w-[7px] h-[7px] rounded-full bg-line" aria-hidden="true" />;
}

function JamoTile({
  jamo,
  progress,
  selected,
  onSelect,
  tourId,
}: {
  jamo: Jamo;
  progress: JamoProgress;
  selected: boolean;
  onSelect: () => void;
  tourId?: string;
}) {
  return (
    <button
      data-tour={tourId}
      onClick={() => {
        onSelect();
        speak(jamo.char);
      }}
      aria-pressed={selected}
      aria-label={`${jamo.char} · ${jamo.rom}`}
      className={`group relative flex flex-col items-center rounded-[14px] border bg-cream px-1.5 pt-3 pb-2 text-center transition-all duration-150 hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[.99] ${
        selected ? "border-success bg-success-bg shadow-[0_0_0_3px_#DCFCE7]" : "border-line hover:border-success-line"
      }`}
    >
      <StatusBadge p={progress} />
      <JamoGlyph
        char={jamo.char}
        className="w-11 h-11 transition-transform duration-150 group-hover:scale-110"
        width={26}
      />
      <b className="block font-semibold text-[12px] mt-1.5 leading-tight text-muted">{jamo.rom}</b>
    </button>
  );
}

function JamoGrid({
  items,
  selected,
  onSelect,
  get,
  firstItemTourId,
}: {
  items: Jamo[];
  selected: string | null;
  onSelect: (char: string) => void;
  get: (char: string) => JamoProgress;
  firstItemTourId?: string;
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2 sm:gap-2.5 text-success">
      {items.map((j, i) => (
        <JamoTile
          key={j.char}
          jamo={j}
          progress={get(j.char)}
          selected={j.char === selected}
          onSelect={() => onSelect(j.char)}
          tourId={i === 0 ? firstItemTourId : undefined}
        />
      ))}
    </div>
  );
}

const NO_PROGRESS: JamoProgress = { practiced: false, bestScore: 0, bestStars: 0 };
const noXp = async (): Promise<GradedInfo> => ({ xp: null, improved: false });

function SyllableBuilder({
  onPick,
  active,
  onChange,
}: {
  onPick: (target: TraceTarget) => void;
  active: string | null;
  onChange?: (target: TraceTarget) => void;
}) {
  const t = useTranslations("hangul");
  const [cho, setCho] = useState(0);
  const [jung, setJung] = useState(0);
  const syllable = composeSyllable(cho, jung);
  const rom = `${ROM_BY_JAMO[CHO[cho]] ?? ""}${ROM_BY_JAMO[JUNG[jung]] ?? ""}`;

  const pick = () => {
    speak(syllable);
    onPick({ char: syllable, rom, hint: `${CHO[cho]} + ${JUNG[jung]}` });
  };

  // Desktop keeps the trace panel on screen at all times, so a letter
  // combination should show up there as soon as it's picked — no extra tap.
  useEffect(() => {
    onChange?.({ char: syllable, rom, hint: `${CHO[cho]} + ${JUNG[jung]}` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cho, jung]);

  return (
    <div className="max-w-[560px]">
      <p className={SECTION_LABEL}>{t("sections.buildABlock")}</p>

      <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
        <span
          className="kr w-[72px] h-[72px] rounded-[14px] border flex items-center justify-center text-[34px]"
          style={{ background: "#FAF7EF", borderColor: "#E3DDD0" }}
        >
          {CHO[cho]}
        </span>
        <span className="text-[22px] text-faint font-light">+</span>
        <span
          className="kr w-[72px] h-[72px] rounded-[14px] border flex items-center justify-center text-[34px]"
          style={{ background: "#FAF7EF", borderColor: "#E3DDD0" }}
        >
          {JUNG[jung]}
        </span>
        <span className="text-[22px] text-faint font-light">=</span>
        <button
          onClick={pick}
          aria-pressed={active === syllable}
          className={`kr w-[96px] h-[96px] rounded-[18px] border-[1.5px] flex flex-col items-center justify-center text-[42px] leading-none transition-transform duration-150 hover:scale-105 ${
            active === syllable ? "shadow-[0_0_0_3px_#DCFCE7]" : ""
          }`}
          style={{ background: SOFT, borderColor: BRD, color: GREEN }}
          aria-label={t("trace.openPopup", { text: syllable })}
        >
          {syllable}
        </button>
      </div>
      <p className="text-center text-[13px] text-muted mb-1">
        <b className="text-success">{rom}</b>
      </p>
      <p className="text-center text-[11.5px] text-faint mb-6">{t("trace.tapToTrace")}</p>

      <p className={SECTION_LABEL}>{t("builder.consonant")} (초성)</p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {CHO.map((c, i) => (
          <button
            key={c}
            onClick={() => setCho(i)}
            className={`kr w-9 h-9 rounded-[9px] text-[17px] border transition-all ${
              i === cho
                ? "bg-success border-success text-white"
                : "bg-cream border-line text-muted hover:border-success hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[.99]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className={SECTION_LABEL}>{t("builder.vowel")} (중성)</p>
      <div className="flex flex-wrap gap-1.5">
        {JUNG.map((v, i) => (
          <button
            key={v}
            onClick={() => setJung(i)}
            className={`kr w-9 h-9 rounded-[9px] text-[17px] border transition-all ${
              i === jung
                ? "bg-success border-success text-white"
                : "bg-cream border-line text-muted hover:border-success hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[.99]"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function PracticeWordCard({ kr, rom, en }: { kr: string; rom: string; en: string }) {
  const t = useTranslations("hangul");
  const [shown, setShown] = useState(false);
  return (
    <button
      onClick={() => {
        setShown(true);
        speak(kr);
      }}
      className={`border rounded-[14px] px-4 py-4 text-center transition-all duration-150 hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[.99] ${
        shown ? "border-success-line bg-success-bg" : "border-line bg-cream hover:border-success"
      }`}
    >
      <b className="kr block text-[24px] font-medium mb-1.5">{kr}</b>
      {shown ? (
        <span className="block" style={{ animation: "fadeUp .3s ease" }}>
          <small className="block text-[12.5px] font-semibold text-success">{rom}</small>
          <small className="block text-[12px] text-muted">{en}</small>
        </span>
      ) : (
        <small className="block text-[12px] text-faint">{t("tapToReveal")} · 🔊</small>
      )}
    </button>
  );
}

// Everything this page can speak, so the whole set can be warmed up front —
// the grid is small and every tile is a plausible first tap.
const ALL_SPOKEN = [
  ...ALL_JAMO.flatMap((j) => [j.char, j.example.kr]),
  ...PRACTICE_WORDS.map((w) => w.kr),
];

/** The challenge-run button, above the tabs.
 *
 *  Two progress cards used to sit beside it — "Practiced 0/40" and
 *  "Stars ★0/120". Every tile in the grid below already wears its own
 *  dot or stars, so the cards summed up forty markers that were on screen
 *  anyway, and cost 78px of the first phone screen to do it (2026-09-10). */
function ProgressHeader({
  practiced,
  canRun,
  onRun,
}: {
  practiced: number;
  canRun: boolean;
  onRun: () => void;
}) {
  const t = useTranslations("hangul");
  return (
    <div className="flex mb-5">
      <button
        type="button"
        onClick={onRun}
        disabled={!canRun}
        title={canRun ? undefined : t("trace.challengeNeed", { n: Math.max(0, RUN_MIN - practiced) })}
        className="w-full sm:w-auto rounded-[12px] px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-40"
        style={{ background: HANGUL_ACCENT }}
      >
        {t("trace.startChallenge")}
      </button>
    </div>
  );
}

type Run = { queue: string[]; idx: number; stars: number[]; xp: number; finished: boolean };

export default function HangulExplorer({ userId }: { userId?: string | null }) {
  const t = useTranslations("hangul");
  const [tab, setTab] = useState<TabKey>("consonants");
  const [selected, setSelected] = useState<string | null>(null);
  const [syllableTarget, setSyllableTarget] = useState<TraceTarget | null>(null);
  const [syllablePreview, setSyllablePreview] = useState<TraceTarget | null>(null);
  const [mode, setMode] = useState<TraceMode>("practice");
  const [run, setRun] = useState<Run | null>(null);
  const { get, loaded, markPracticed, recordChallenge, signedIn } = useHangulProgress(userId);

  useEffect(() => {
    prefetchKorean(ALL_SPOKEN);
  }, []);

  const practicedChars = useMemo(() => ALL_JAMO.filter((j) => get(j.char).practiced).map((j) => j.char), [get]);
  const practicedCount = practicedChars.length;

  const closeSheet = useCallback(() => { setSelected(null); setSyllableTarget(null); }, []);
  // Only the mobile sheet uses Back-to-close; on desktop the panel just sits there.
  const [isSheet, setIsSheet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Desktop has the paper on screen all the time, so it never sits empty:
  // with nothing picked it shows the tab's first letter, and on the syllables
  // tab it follows the block builder live as the learner changes cho/jung —
  // no tap needed. Below lg the paper lives in a sheet, so a syllable only
  // shows there once tapped (same popup as before).
  const effectiveSelected =
    selected ?? (!isSheet && tab !== "syllables" ? (tab === "consonants" ? CONSONANT_LIST : VOWEL_LIST)[0].char : null);
  const selectedJamo = effectiveSelected ? JAMO_BY_CHAR.get(effectiveSelected) ?? null : null;
  const syllableActive = isSheet ? syllableTarget : syllablePreview;
  const activeTarget: TraceTarget | null = tab === "syllables" ? syllableActive : selectedJamo;
  const activeKind: "consonant" | "vowel" | "syllable" | null =
    tab === "syllables" ? (syllableActive ? "syllable" : null) : selectedJamo ? kindOf(selectedJamo.char) : null;

  const sheetOpen = isSheet && activeTarget !== null && run === null;
  const dismissSheet = useBackToClose(sheetOpen, closeSheet);
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [sheetOpen]);

  const nextInList = useCallback(() => {
    if (!effectiveSelected) return;
    const list = kindOf(effectiveSelected) === "consonant" ? CONSONANT_LIST : VOWEL_LIST;
    const i = list.findIndex((j) => j.char === effectiveSelected);
    const next = list[(i + 1) % list.length];
    setSelected(next.char);
    speak(next.char);
  }, [effectiveSelected]);

  const onGraded = useCallback(async (char: string, score: TraceScore): Promise<GradedInfo> => {
    return recordChallenge(char, score.score, score.stars);
  }, [recordChallenge]);

  // ----- challenge run -----
  const startRun = () => {
    if (practicedCount < RUN_MIN) return;
    const queue = shuffle(practicedChars).slice(0, RUN_SIZE);
    setRun({ queue, idx: 0, stars: [], xp: 0, finished: false });
    speak(queue[0]);
  };
  const onRunGraded = useCallback(async (char: string, score: TraceScore): Promise<GradedInfo> => {
    const info = await recordChallenge(char, score.score, score.stars);
    setRun((r) => (r ? { ...r, stars: [...r.stars, score.stars], xp: r.xp + (info.xp ? info.xp.points_awarded ?? XP_POINTS.hangul : 0) } : r));
    return info;
  }, [recordChallenge]);
  const runNext = () => {
    setRun((r) => {
      if (!r) return r;
      if (r.idx + 1 >= r.queue.length) return { ...r, finished: true };
      speak(r.queue[r.idx + 1]);
      return { ...r, idx: r.idx + 1 };
    });
  };

  const selectTile = (char: string) => {
    setSelected(char);
    setMode("practice");
  };
  const pickSyllable = (target: TraceTarget) => {
    setSyllableTarget(target);
    setMode("practice");
  };

  const tabs = (
    <div className="flex gap-2 mb-6 flex-wrap">
      {TABS.map((tab_) => (
        <button
          key={tab_.key}
          onClick={() => { setTab(tab_.key); setSelected(null); setSyllableTarget(null); }}
          className={`rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
            tab_.key === tab
              ? "bg-success border-success text-white"
              : "bg-cream border-line text-muted hover:border-faint"
          }`}
        >
          {t(`tabs.${tab_.key}`)}
          <span className="kr text-[10.5px] font-bold ml-1.5 opacity-85">{tab_.kr}</span>
        </button>
      ))}
    </div>
  );

  if (run) {
    const current = run.finished ? null : JAMO_BY_CHAR.get(run.queue[run.idx]) ?? null;
    const starsSum = run.stars.reduce((a, b) => a + b, 0);
    return (
      <div className="max-w-[560px]" style={{ animation: "fadeUp .3s ease" }}>
        <div className="flex items-center gap-3 rounded-[16px] border border-line bg-cream px-4 py-3 mb-4">
          <span className="kr flex-none w-11 h-11 rounded-[12px] flex items-center justify-center text-[20px] font-black" style={{ background: "#FBE9EE", color: HANGUL_ACCENT }}>
            {current?.char ?? "★"}
          </span>
          <div className="min-w-0 flex-1">
            <b className="block text-[13.5px]">
              {run.finished ? t("trace.runDone") : t("trace.runProgress", { i: run.idx + 1, n: run.queue.length })}
            </b>
            <span className="text-[11.5px] text-muted">{run.finished ? t("trace.runSummary", { stars: starsSum, n: run.queue.length }) : t("trace.hintFree")}</span>
          </div>
          <span className="text-[12px] font-extrabold" style={{ color: "#E2A93B" }}>★ {starsSum}</span>
          <button type="button" onClick={() => setRun(null)} className="flex-none rounded-[10px] border border-line px-3 py-1.5 text-[12px] font-bold text-muted">
            {t("trace.runExit")}
          </button>
        </div>

        {current ? (
          <TracePanel
            key={`${current.char}-${run.idx}`}
            jamo={current}
            kind={kindOf(current.char)}
            progress={get(current.char)}
            mode="challenge"
            hideModeToggle
            compact
            signedIn={signedIn}
            onPracticed={markPracticed}
            onGraded={onRunGraded}
            onNext={runNext}
            nextLabel={run.idx + 1 >= run.queue.length ? t("trace.runDone") : t("trace.next")}
          />
        ) : (
          <div className="rounded-[16px] bg-warm-2 p-6 text-center flex flex-col items-center gap-3" style={{ animation: "fadeUp .3s ease" }}>
            <Stars n={Math.min(3, Math.round(starsSum / Math.max(1, run.queue.length)))} size={28} />
            <p className="text-[15px] font-extrabold">{t("trace.runSummary", { stars: starsSum, n: run.queue.length })}</p>
            {run.xp > 0 ? <p className="text-[13px] font-bold text-success-deep">{t("trace.xpEarned", { xp: run.xp })}</p> : null}
            <div className="flex gap-2 w-full max-w-[320px] mt-1">
              <button type="button" onClick={() => setRun(null)} className="flex-1 rounded-[12px] border-[1.5px] border-line py-2.5 text-[13px] font-bold text-muted">
                {t("trace.runExit")}
              </button>
              <button type="button" onClick={startRun} className="flex-1 rounded-[12px] bg-success text-white py-2.5 text-[13px] font-bold">
                {t("trace.retry")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const panel = activeTarget ? (
    <TracePanel
      key={`${activeTarget.char}-${mode}`}
      jamo={activeTarget}
      kind={activeKind ?? "consonant"}
      progress={activeKind === "syllable" ? NO_PROGRESS : get(activeTarget.char)}
      mode={mode}
      onModeChange={setMode}
      signedIn={activeKind === "syllable" ? false : signedIn}
      onPracticed={activeKind === "syllable" ? () => {} : markPracticed}
      onGraded={activeKind === "syllable" ? noXp : onGraded}
      onNext={activeKind === "syllable" ? undefined : nextInList}
      tourStrokeId="guided-hangul-stroke"
    />
  ) : null;

  return (
    <div>
      <ProgressHeader practiced={practicedCount} canRun={loaded && practicedCount >= RUN_MIN} onRun={startRun} />
      {tabs}

      <div
        key={tab}
        className="lg:grid lg:grid-cols-[clamp(320px,34%,400px)_minmax(0,1fr)] lg:gap-7 lg:items-start"
        style={{ animation: "fadeUp .35s ease" }}
      >
        {/* desktop: the paper first, sticky, with the letters (or the block builder) as a picker beside it */}
        <aside className="hidden lg:block sticky top-5">
          <div className="rounded-[20px] border border-line bg-cream p-4">
            {panel ?? (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <span className="text-[30px]" aria-hidden="true">✍️</span>
                <p className="text-[13px] font-bold">{t("trace.pickPrompt")}</p>
                <p className="text-[11.5px] text-muted max-w-[24ch]">{t("trace.pickPromptSub")}</p>
              </div>
            )}
          </div>
        </aside>
        <div className="max-w-[980px]">
          {tab === "consonants" ? (
            <>
              <p className={SECTION_LABEL}>{t("sections.basicConsonants")} · 기본 자음</p>
              <div className="mb-7"><JamoGrid items={BASIC_CONSONANTS} selected={effectiveSelected} onSelect={selectTile} get={get} firstItemTourId="guided-hangul-first-jamo" /></div>
              <p className={SECTION_LABEL}>{t("sections.doubleConsonants")} · 쌍자음</p>
              <div className="mb-4"><JamoGrid items={DOUBLE_CONSONANTS} selected={effectiveSelected} onSelect={selectTile} get={get} /></div>
              <div className="flex gap-4 flex-wrap text-[11px] text-muted mt-1 mb-8">
                <span className="flex items-center gap-1.5"><i className="w-[7px] h-[7px] rounded-full bg-line" /> {t("trace.legendNew")}</span>
                <span className="flex items-center gap-1.5"><b className="text-success-deep">✓</b> {t("trace.legendPracticed")}</span>
                <span className="flex items-center gap-1.5"><Stars n={2} size={11} /> {t("trace.legendStars")}</span>
              </div>
            </>
          ) : tab === "vowels" ? (
            <>
              <p className={SECTION_LABEL}>{t("sections.basicVowels")} · 기본 모음</p>
              <div className="mb-7"><JamoGrid items={BASIC_VOWELS} selected={effectiveSelected} onSelect={selectTile} get={get} /></div>
              <p className={SECTION_LABEL}>{t("sections.compoundVowels")} · 복합 모음</p>
              <div className="mb-4"><JamoGrid items={COMPOUND_VOWELS} selected={effectiveSelected} onSelect={selectTile} get={get} /></div>
              <div className="flex gap-4 flex-wrap text-[11px] text-muted mt-1 mb-8">
                <span className="flex items-center gap-1.5"><i className="w-[7px] h-[7px] rounded-full bg-line" /> {t("trace.legendNew")}</span>
                <span className="flex items-center gap-1.5"><b className="text-success-deep">✓</b> {t("trace.legendPracticed")}</span>
                <span className="flex items-center gap-1.5"><Stars n={2} size={11} /> {t("trace.legendStars")}</span>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8"><SyllableBuilder onPick={pickSyllable} onChange={setSyllablePreview} active={syllableActive?.char ?? null} /></div>
              <p className={SECTION_LABEL}>{t("sections.readingPractice")} · 읽기 연습</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 max-w-[820px]">
                {PRACTICE_WORDS.map((w) => (
                  <PracticeWordCard key={w.kr} {...w} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* mobile / tablet: bottom sheet */}
      {sheetOpen && panel ? (
        <div className="lg:hidden">
          <button aria-label={t("trace.sheetClose")} onClick={dismissSheet} className="fixed inset-0 z-[60] bg-[#282319]/35 cursor-default" />
          <div
            role="dialog"
            aria-label={activeTarget?.char}
            className="sheet-up fixed left-0 right-0 bottom-0 z-[70] bg-warm border-t-[1.5px] border-dashed border-dash rounded-t-[22px] px-4 pt-2.5 pb-[max(20px,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-y-auto"
          >
            <div className="w-10 h-1 rounded-full bg-dash mx-auto mb-3" aria-hidden="true" />
            <div className="max-w-[560px] mx-auto">{panel}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
