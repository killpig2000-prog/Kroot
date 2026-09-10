// Mirrors ReadingChapterSessionPage's default "read" phase — the book-spread
// card with Korean | English columns (ReadingSession.tsx) — so turning a
// page / jumping from the map shows structure instead of a blank flash while
// the server fetches the next passage.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px]">
          {/* the lesson bar's shape, so the swap doesn't jump (2026-09-10) */}
          <div className="h-[52px] -mx-[clamp(18px,4vw,44px)] -mt-6 mb-4 border-b-[1.5px] border-dashed border-dash xl:h-9 xl:mx-0 xl:mt-0 xl:mb-5 xl:border-0" />
          <div className="animate-pulse">
            {/* book-spread card */}
            <div className="max-w-[880px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]">
              {/* header row: chapter pill + show-translation toggle */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="h-5 w-24 rounded-md bg-[var(--tint-sky)] border border-sky-line" />
                <div className="h-3.5 w-28 rounded-full bg-warm-2" />
              </div>

              <div className="rounded-[10px] border border-line overflow-hidden bg-warm">
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {/* Korean column */}
                  <div className="p-[clamp(14px,2.5vw,22px)] bg-cream sm:border-r border-b sm:border-b-0 border-line flex flex-col gap-2">
                    <div className="h-2.5 w-16 rounded-full bg-warm-2 mb-1" />
                    <div className="h-5 w-[75%] rounded-lg bg-warm-3 mb-2" />
                    <div className="h-4 w-full rounded-full bg-warm-3" />
                    <div className="h-4 w-[90%] rounded-full bg-warm-3" />
                    <div className="h-4 w-[95%] rounded-full bg-warm-3" />
                    <div className="h-4 w-[80%] rounded-full bg-warm-3" />
                    <div className="h-4 w-[70%] rounded-full bg-warm-3" />
                  </div>
                  {/* English column */}
                  <div className="p-[clamp(14px,2.5vw,22px)] flex flex-col gap-2">
                    <div className="h-2.5 w-16 rounded-full bg-warm-2 mb-1" />
                    <div className="h-4 w-[60%] rounded-full bg-warm-2 mb-2" />
                    <div className="h-3.5 w-full rounded-full bg-warm-4" />
                    <div className="h-3.5 w-[88%] rounded-full bg-warm-4" />
                    <div className="h-3.5 w-[92%] rounded-full bg-warm-4" />
                    <div className="h-3.5 w-[78%] rounded-full bg-warm-4" />
                    <div className="h-3.5 w-[65%] rounded-full bg-warm-4" />
                  </div>
                </div>
              </div>

              {/* continue button */}
              <div className="flex justify-end mt-5">
                <div className="h-10 w-52 rounded-[9px] bg-warm-3" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
