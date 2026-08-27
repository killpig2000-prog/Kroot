// A generated word note is either a hanja breakdown like
// "시(試 to test) + 험(驗 to examine)" or a loanword origin like
// "from English \"coffee\"" — parse it back into structure for the memo note.
type Morpheme = { syllable: string; hanja: string; gloss: string };

export function parseMorphemeNote(
  note: string
): { parts: Morpheme[]; origin?: never } | { origin: string; parts?: never } | null {
  if (note.startsWith("from ")) return { origin: note.slice(5) };
  const parts = Array.from(note.matchAll(/([가-힣]+)\(([^\s)]+) ([^)]+)\)/g)).map((m) => ({
    syllable: m[1],
    hanja: m[2],
    gloss: m[3],
  }));
  return parts.length >= 2 ? { parts } : null;
}

// Sticky-note memo showing the word's building blocks (시 = 試 "to test" …).
export function MorphemeNote({
  data,
  className = "",
}: {
  data: NonNullable<ReturnType<typeof parseMorphemeNote>>;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="relative bg-[#FFF9DB] border border-[#EDE3B4] rounded-[6px] px-4 pt-4 pb-3 text-left shadow-[0_5px_12px_rgba(0,0,0,0.07)]">
        {/* washi-tape strip */}
        <span
          aria-hidden="true"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-[58px] h-[15px] bg-[#D8F0DD] opacity-90 rounded-[2px] rotate-[-3deg]"
        />
        <p className="text-[10.5px] font-bold tracking-[0.08em] uppercase text-[#A08F4E] mb-2">
          {data.parts ? "Word parts" : "Word origin"}
        </p>
        {data.parts ? (
          <div className="flex flex-col gap-1.5">
            {data.parts.map((p) => (
              <div key={p.syllable + p.hanja} className="flex items-baseline gap-2">
                <span className="kr text-[17px] font-bold text-charcoal leading-none">
                  {p.syllable}
                </span>
                <span className="kr text-[13px] text-[#A08F4E]">{p.hanja}</span>
                <span className="text-[12px] text-muted leading-[1.4]">{p.gloss}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-muted leading-[1.5]">from {data.origin}</p>
        )}
      </div>
    </div>
  );
}
