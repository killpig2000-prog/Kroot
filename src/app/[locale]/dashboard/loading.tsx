// Mirrors the real /dashboard page: sidebar rail, main column (greeting,
// tree/streak card, course/quest/slang callout strips, learning-progress
// card with a 2x2 skill grid, promotion strip, study-garden grass), and the
// xl+ right rail of quest/slang/word-of-day cards — so the swap from
// skeleton to real content doesn't jump.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] xl:grid-cols-[clamp(216px,17%,280px)_minmax(0,1fr)_clamp(260px,22%,340px)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <div className="md:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />

        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[26px] pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* greeting */}
            <div className="h-6 w-52 rounded-lg bg-warm-3 mb-2.5" />
            <div className="h-3.5 w-72 rounded-full bg-warm-2 mb-6" />

            {/* tree/streak card */}
            <div className="border border-line rounded-[14px] bg-white px-[22px] py-6 mb-[30px] flex items-center gap-6 flex-wrap">
              <div className="w-24 h-24 rounded-full bg-warm-2 flex-none" />
              <div className="flex-1 min-w-[200px]">
                <div className="h-4 w-28 rounded-full bg-warm-3 mb-2.5" />
                <div className="h-1.5 rounded-full bg-warm-2 mb-2" />
                <div className="h-3 w-36 rounded-full bg-warm-4" />
              </div>
            </div>

            {/* course card */}
            <div className="h-[76px] rounded-[14px] bg-warm border border-dashed border-line mb-[30px]" />

            {/* quest strip (xl:hidden on real page) */}
            <div className="xl:hidden border border-dashed border-[#CFC8B8] rounded-[12px] bg-white px-5 py-4 flex items-center gap-3.5 mb-[30px]">
              <div className="w-10 h-10 rounded-[10px] bg-warm-2 flex-none" />
              <div className="flex-1 min-w-[170px]">
                <div className="h-3.5 w-28 rounded-full bg-warm-2 mb-1.5" />
                <div className="h-3 w-48 rounded-full bg-warm-4" />
              </div>
            </div>

            {/* slang strip (xl:hidden on real page) */}
            <div className="xl:hidden flex items-center gap-3.5 border border-line rounded-[14px] bg-warm px-5 py-4 mb-[30px]">
              <div className="w-10 h-10 rounded-[10px] bg-warm-2 flex-none" />
              <div className="flex-1 min-w-[170px]">
                <div className="h-3.5 w-40 rounded-full bg-warm-2 mb-1.5" />
                <div className="h-3 w-52 rounded-full bg-warm-4" />
              </div>
            </div>

            {/* learning progress card */}
            <div className="border border-line rounded-[14px] bg-white px-[22px] py-5 mb-[14px]">
              <div className="flex items-baseline justify-between gap-3 mb-3.5">
                <div className="h-4 w-36 rounded-full bg-warm-3" />
                <div className="h-3 w-16 rounded-full bg-warm-4" />
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-3 w-24 rounded-full bg-warm-2 flex-none" />
                <div className="flex-1 h-2.5 rounded-full bg-[#F5F5F4]" />
                <div className="h-3 w-8 rounded-full bg-warm-2 flex-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-[30px] h-[30px] rounded-lg bg-warm-2 flex-none" />
                    <div className="flex-1 min-w-0">
                      <div className="h-3 w-20 rounded-full bg-warm-2 mb-1.5" />
                      <div className="h-1.5 rounded-full bg-[#F5F5F4]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* promotion status strip */}
            <div className="rounded-[14px] px-[22px] py-4 mb-[14px] border-[1.5px] border-line bg-white flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-warm-2 flex-none" />
              <div className="flex-1 min-w-[200px]">
                <div className="h-3.5 w-56 rounded-full bg-warm-2 mb-2" />
                <div className="flex gap-2.5 flex-wrap">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-3 w-20 rounded-full bg-warm-4" />
                  ))}
                </div>
              </div>
            </div>

            {/* study garden / monthly grass */}
            <div className="border border-line rounded-[14px] bg-white px-[22px] py-5">
              <div className="flex gap-6 flex-wrap mb-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-16 rounded-full bg-warm-4 mb-1.5" />
                    <div className="h-4 w-10 rounded-full bg-warm-3" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(10px,1fr))] gap-1">
                {Array.from({ length: 84 }).map((_, i) => (
                  <div key={i} className="w-full aspect-square rounded-[2px] bg-warm-2" />
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* right rail (xl+) — quest / slang / word-of-day cards */}
        <div className="hidden xl:flex flex-col gap-4 px-5 pt-[26px] pb-[60px]">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="border border-dashed border-[#CFC8B8] rounded-[12px] bg-white p-4">
              <div className="h-3.5 w-24 rounded-full bg-warm-2 mb-2" />
              <div className="h-3 w-36 rounded-full bg-warm-4" />
            </div>
            <div className="border border-line rounded-[14px] bg-warm p-4">
              <div className="h-3.5 w-28 rounded-full bg-warm-2 mb-2" />
              <div className="h-3 w-40 rounded-full bg-warm-4" />
            </div>
            <div className="border border-line rounded-[14px] bg-white p-4">
              <div className="h-3.5 w-32 rounded-full bg-warm-3 mb-2.5" />
              <div className="h-4 w-16 rounded-lg bg-warm-2 mb-2" />
              <div className="h-3 w-full rounded-full bg-warm-4 mb-1.5" />
              <div className="h-3 w-3/4 rounded-full bg-warm-4" />
            </div>
            <div className="border border-line rounded-[14px] bg-white p-4">
              <div className="h-3.5 w-20 rounded-full bg-warm-3 mb-3" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 mb-2 last:mb-0">
                  <div className="w-6 h-6 rounded-full bg-warm-2 flex-none" />
                  <div className="h-2.5 flex-1 rounded-full bg-warm-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
