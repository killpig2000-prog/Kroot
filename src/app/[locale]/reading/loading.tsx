// Mirrors the real /reading page (breadcrumb, header, level tabs, progress
// bar, continue card, genre-grouped accordion with a zigzag path) instead of
// a generic row list, using reading's own blue accent for the continue card.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <div className="md:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            <div className="h-3.5 w-24 rounded-full bg-warm-3 mb-[18px]" />

            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
              <div className="h-7 w-40 rounded-lg bg-warm-3" />
              <div className="h-3.5 w-56 rounded-full bg-warm-2" />
            </div>

            <div className="h-3 w-72 rounded-full bg-warm-4 mb-6" />

            <div className="flex gap-2 mb-6 flex-wrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 w-16 rounded-[9px] bg-warm-2 border border-line" />
              ))}
            </div>

            <div className="flex items-center gap-3.5 border-[1.5px] border-sky-line bg-[#EFF6FF] rounded-[14px] px-5 py-4 mb-6 max-w-[720px]">
              <div className="w-10 h-10 rounded-[10px] bg-cream border border-sky-line flex-none" />
              <div className="flex-1 min-w-[170px]">
                <div className="h-3.5 w-40 rounded-full bg-sky-line/60 mb-1.5" />
                <div className="h-2.5 w-28 rounded-full bg-sky-line/40" />
              </div>
              <div className="h-3 w-14 rounded-full bg-sky-line/60" />
            </div>

            <div className="grid gap-3 max-w-[720px]">
              {Array.from({ length: 4 }).map((_, gi) => (
                <div
                  key={gi}
                  className="border border-line rounded-[14px] bg-cream overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="h-3.5 w-32 rounded-full bg-warm-2 mb-1.5" />
                      <div className="h-2.5 w-48 rounded-full bg-warm-4" />
                    </div>
                    <div className="flex-none flex items-center gap-2">
                      <div className="w-[74px] h-1.5 rounded-full bg-warm-3" />
                      <div className="h-2.5 w-8 rounded-full bg-warm-2" />
                    </div>
                  </div>
                  {gi === 0 && (
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-dashed border-line grid gap-6 py-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`flex items-center gap-3 ${i % 2 ? "flex-row-reverse text-right" : ""}`}>
                          <div className="w-11 h-11 rounded-full bg-[#EFF6FF] border border-sky-line flex-none" />
                          <div className={i % 2 ? "items-end flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
                            <div className="h-3 w-20 rounded-full bg-warm-2" />
                            <div className="h-2.5 w-32 rounded-full bg-warm-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
