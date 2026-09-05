// Mirrors the real /profile page — header, then the analysis stack
// (headline KPIs, per-skill accuracy, skill mix, due words, level map) and
// the settings block. Identity moved to the dashboard's TreeCard, and the
// Plus upsell and Insights section are both gone, so none of those are
// drawn here either.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start md:content-stretch">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <div className="md:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
              <div className="flex items-center gap-[9px]">
                <div className="w-[30px] h-[30px] rounded-lg bg-warm-2 border border-line" />
                <div className="h-6 w-36 rounded-lg bg-warm-3" />
              </div>
            </div>

            <div className="max-w-[820px] grid grid-cols-1 gap-3.5">
              {/* headline + the numbers behind it */}
              <div className="border border-line rounded-[14px] px-[22px] py-5">
                <div className="h-4 w-56 rounded-full bg-warm-2 mb-1.5" />
                <div className="h-2.5 w-40 rounded-full bg-warm-4 mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="h-5 w-10 rounded-full bg-warm-3" />
                      <div className="h-2.5 w-16 rounded-full bg-warm-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* accuracy per skill — the point of the page */}
              <div className="border border-line rounded-[14px] px-[22px] py-5">
                <div className="h-3.5 w-32 rounded-full bg-warm-3 mb-4" />
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 mb-2.5 last:mb-0">
                    <div className="h-3 w-20 rounded-full bg-warm-2 flex-none" />
                    <div className="h-[8px] flex-1 rounded-full bg-warm-4" />
                    <div className="h-3 w-8 rounded-full bg-warm-2 flex-none" />
                  </div>
                ))}
              </div>

              {/* due words */}
              <div className="border border-line rounded-[14px] px-[22px] py-5">
                <div className="h-3.5 w-36 rounded-full bg-warm-3 mb-4" />
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-7 w-20 rounded-full bg-warm-2 border border-line" />
                  ))}
                </div>
              </div>

              {/* settings */}
              <div className="h-4 w-24 rounded-full bg-warm-3 mt-3.5" />
              <div className="border border-line rounded-[14px] px-[22px] py-5">
                <div className="h-3 w-48 rounded-full bg-warm-2 mb-3" />
                <div className="h-3 w-40 rounded-full bg-warm-4" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
