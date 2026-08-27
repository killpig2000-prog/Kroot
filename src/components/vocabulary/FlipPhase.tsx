import { buttonClassName } from "@/components/ui/Button";
import { speakKorean } from "@/lib/tts";
import WORD_NOTES from "@/lib/vocabulary-data/word-notes.json";
import { VOCAB_ROOTS, type VocabWordWithProgress } from "@/lib/vocabulary";
import { MorphemeNote, parseMorphemeNote } from "@/components/vocabulary/MorphemeNote";

const BTN_VIOLET = buttonClassName("violet");

// Growth stage of a word, from how many times it's been reviewed.
const STAGE_META = [
  { label: "🌰 Seed", cls: "bg-[#FFFBEB] text-amber" },
  { label: "🌱 Sprout", cls: "bg-success-bg text-success" },
  { label: "🌿 Rooting", cls: "bg-[#DCFCE7] text-success-deep" },
  { label: "🌳 Settled", cls: "bg-[#166534] text-white" },
];

function stageFor(reviews: number): number {
  if (reviews <= 0) return 0;
  if (reviews === 1) return 1;
  if (reviews <= 3) return 2;
  return 3;
}

export default function FlipPhase({
  words,
  index,
  word,
  wordCounts,
  topicLabel,
  flipped,
  rootOpen,
  onFlip,
  onAnswer,
  onOpenRoot,
  onCloseRoot,
}: {
  words: VocabWordWithProgress[];
  index: number;
  word: VocabWordWithProgress;
  wordCounts: { correct: number; incorrect: number };
  topicLabel: string;
  flipped: boolean;
  rootOpen: boolean;
  onFlip: () => void;
  onAnswer: (gotIt: boolean) => void;
  onOpenRoot: () => void;
  onCloseRoot: () => void;
}) {
  const stage = STAGE_META[stageFor(wordCounts.correct + wordCounts.incorrect)];
  const root = word.root ? VOCAB_ROOTS[word.root] : undefined;
  // Generated morpheme memo — hanja breakdown for Sino-Korean words,
  // origin for loanwords ("" for native/uncertain words).
  const morphemeNote = (WORD_NOTES as Record<string, string>)[word.korean] || null;
  const morpheme = morphemeNote ? parseMorphemeNote(morphemeNote) : null;

  return (
    <div className="max-w-[640px]">
      {/* progress dots + daily counter */}
      <div className="flex items-center justify-between gap-3 mb-[18px]">
        <div className="flex gap-[7px]">
          {words.map((w, k) => (
            <span
              key={w.key}
              className={`w-[26px] h-1.5 rounded-full ${
                k < index ? "bg-[#7C3AED]" : k === index ? "bg-[#7C3AED] opacity-40" : "bg-line"
              }`}
            />
          ))}
        </div>
        <span className="text-[13px] text-muted flex-none">
          Today: <b className="text-[#7C3AED]">{index}</b> of {words.length} words
        </span>
      </div>

      {/* word card */}
      <div className="relative border border-line rounded-[16px] p-[clamp(24px,4vw,34px)] text-center">
        {/* desktop: sticky-note memo in the empty space to the right */}
        {flipped && morpheme && (
          <MorphemeNote
            data={morpheme}
            className="hidden xl:block absolute left-full top-8 ml-7 w-[220px] rotate-[1.5deg]"
          />
        )}
        <span
          className={`absolute top-5 right-5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-[5px] ${stage.cls}`}
        >
          {stage.label}
        </span>

        <p className="text-xs font-semibold text-[#7C3AED] mb-1.5">
          {topicLabel} · {word.level} · word {index + 1} of {words.length}
        </p>
        <p className="kr text-[clamp(36px,6vw,46px)] mt-1.5 mb-1">
          <button
            type="button"
            onClick={() => speakKorean(word.korean)}
            title="Hear it"
            className="inline-flex items-baseline gap-2.5 hover:text-[#7C3AED] transition-colors"
          >
            {word.korean}
            <span aria-hidden="true" className="text-[20px] translate-y-[-4px]">🔊</span>
          </button>
        </p>
        <p className="text-[13.5px] text-faint mb-4">{word.romanization}</p>

        {flipped ? (
          <>
            <p
              className="text-[19px] font-semibold mb-4"
              style={{ animation: "fadeUp .3s ease" }}
            >
              {word.meaning_en}
            </p>
            {morpheme && (
              <MorphemeNote
                data={morpheme}
                className="xl:hidden -mt-1 mb-5 mx-auto w-[min(260px,100%)] rotate-[-1deg]"
              />
            )}
            <div className="grid gap-2.5 mb-[22px]" style={{ animation: "fadeUp .3s ease" }}>
              <div className="bg-warm border border-line rounded-[10px] px-4 py-3.5 text-left">
                <p className="kr text-[15px] font-medium mb-[3px]">
                  <button
                    type="button"
                    onClick={() => speakKorean(word.example_kr)}
                    title="Hear the sentence"
                    className="text-left hover:text-[#7C3AED] transition-colors"
                  >
                    {word.example_kr} <span aria-hidden="true" className="text-[12px]">🔊</span>
                  </button>
                </p>
                <p className="text-[13px] text-muted">{word.example_en}</p>
              </div>
              {word.moreExamples?.map((ex, i) => (
                <div
                  key={i}
                  className="bg-white border border-dashed border-line rounded-[10px] px-4 py-3.5 text-left"
                >
                  <p className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.05em] uppercase text-faint mb-1.5">
                    {ex.source === "reading" ? "📖 Seen in Reading" : "🎧 Seen in Listening"}
                  </p>
                  <p className="kr text-[15px] font-medium mb-[3px]">
                    <button
                      type="button"
                      onClick={() => speakKorean(ex.kr)}
                      title="Hear the sentence"
                      className="text-left hover:text-[#7C3AED] transition-colors"
                    >
                      {ex.kr} <span aria-hidden="true" className="text-[12px]">🔊</span>
                    </button>
                  </p>
                  <p className="text-[13px] text-muted">{ex.en}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2.5 justify-center flex-wrap">
              <button
                className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-danger bg-white border-[1.5px] border-[#FECACA] hover:bg-danger-bg transition-colors"
                onClick={() => onAnswer(false)}
              >
                Still learning
              </button>
              <button className={BTN_VIOLET} onClick={() => onAnswer(true)}>
                I know this →
              </button>
            </div>
          </>
        ) : (
          <button
            className="border-[1.5px] border-dashed border-[#DDD6FE] rounded-[10px] bg-[#F5F3FF] px-[22px] py-3 text-[13.5px] font-semibold text-[#7C3AED] mb-1"
            onClick={onFlip}
          >
            👀 Reveal meaning
          </button>
        )}
      </div>

      {/* bonus root banner */}
      {root && !rootOpen && (
        <div className="mt-4 border border-dashed border-[#DDD6FE] rounded-[14px] bg-[#F5F3FF] px-5 py-4 flex items-center gap-3.5">
          <span className="w-[38px] h-[38px] rounded-[10px] bg-[#7C3AED] text-white flex items-center justify-center font-bold text-[17px] flex-none kr">
            {root.syllable}
          </span>
          <div className="min-w-0">
            <b className="block text-[13.5px] font-semibold">Bonus root: {root.name}</b>
            <span className="text-[12.5px] text-[#6D28D9]">A few more words that share this root</span>
          </div>
          <button
            className="ml-auto flex-none bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg px-4 py-2 text-[12.5px] font-semibold transition-colors"
            onClick={onOpenRoot}
          >
            Explore →
          </button>
        </div>
      )}

      {/* root explore panel */}
      {root && rootOpen && (
        <div className="mt-2.5 border border-[#DDD6FE] rounded-[14px] bg-white px-[22px] py-5" style={{ animation: "fadeUp .3s ease" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center kr text-xl flex-none">
                {root.syllable}
              </span>
              <div>
                <b className="block text-[15px] font-bold">{root.name}</b>
                <span className="text-[12.5px] text-muted">{root.desc}</span>
              </div>
            </div>
            <button
              className="border-none bg-warm w-7 h-7 rounded-lg text-faint hover:text-charcoal text-[13px]"
              onClick={onCloseRoot}
              aria-label="Close root panel"
            >
              ✕
            </button>
          </div>
          <div className="grid gap-2.5">
            {root.words.map(([kr, meaning]) => (
              <div key={kr} className="flex items-center gap-3 border border-line rounded-[10px] px-3.5 py-[11px] bg-warm">
                <span className="kr text-lg flex-none min-w-[52px]">{kr}</span>
                <span className="text-[13px] text-muted">
                  <b className="text-charcoal font-semibold">{meaning}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
