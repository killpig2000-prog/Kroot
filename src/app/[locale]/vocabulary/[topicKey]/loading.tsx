// Mirrors the real /vocabulary/[topicKey]/session page this route redirects
// into: sidebar shell, breadcrumb, topic header, progress dots + daily
// counter, and the unrevealed flashcard (badge, Korean headword,
// romanization, "Reveal meaning" button) — so the skeleton -> real content
// swap doesn't jump.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <div className="md:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="flex gap-2 mb-[18px]">
              <div className="h-3.5 w-14 rounded-full bg-warm-2" />
              <div className="h-3.5 w-3 rounded-full bg-warm-4" />
              <div className="h-3.5 w-20 rounded-full bg-warm-2" />
              <div className="h-3.5 w-3 rounded-full bg-warm-4" />
              <div className="h-3.5 w-24 rounded-full bg-warm-3" />
            </div>

            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-[9px]">
                <div className="w-[30px] h-[30px] rounded-lg bg-[var(--tint-violet)] border border-[var(--tint-violet-line)]" />
                <div className="h-6 w-32 rounded-lg bg-warm-3" />
              </div>
              <div className="h-3.5 w-36 rounded-full bg-warm-2" />
            </div>

            <div className="max-w-[640px]">
              {/* progress dots + daily counter */}
              <div className="flex items-center justify-between gap-3 mb-[18px]">
                <div className="flex gap-[7px]">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="w-[26px] h-1.5 rounded-full bg-line" />
                  ))}
                </div>
                <div className="h-3.5 w-28 rounded-full bg-warm-2" />
              </div>

              {/* word card */}
              <div className="relative border border-line rounded-[16px] p-[clamp(24px,4vw,34px)] text-center">
                <div className="absolute top-5 right-5 h-6 w-20 rounded-full bg-warm-2" />

                <div className="h-3 w-40 rounded-full bg-warm-2 mx-auto mb-3" />
                <div className="h-[46px] w-56 rounded-lg bg-warm-3 mx-auto mb-3" />
                <div className="h-3 w-24 rounded-full bg-warm-4 mx-auto mb-6" />

                <div className="h-[42px] w-[190px] rounded-[10px] bg-[var(--tint-violet)] border-[1.5px] border-dashed border-[var(--tint-violet-line)] mx-auto" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
