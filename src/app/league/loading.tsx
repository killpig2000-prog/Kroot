// Mirrors the real /league page: breadcrumb, tier-badge header, then
// LeagueBoard's shape — movement banner slot, "my standing" callout, tier
// ladder pills, reward-tier pills, and the ranked board list with avatar +
// name + XP rows — instead of a generic row list.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[720px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="h-3.5 w-20 rounded-full bg-warm-3 mb-[18px]" />

            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
              <div className="flex items-center">
                <div className="w-[30px] h-[30px] rounded-lg bg-warm-2 border border-line mr-[9px]" />
                <div className="h-6 w-40 rounded-lg bg-warm-3" />
              </div>
              <div className="h-3.5 w-64 rounded-full bg-warm-2" />
            </div>

            <div className="grid gap-5">
              {/* my standing */}
              <div className="border-[1.5px] border-line bg-warm rounded-[14px] px-5 py-4 flex items-center gap-4 flex-wrap">
                <div className="w-7 h-7 rounded-full bg-warm-3" />
                <div className="flex-1 min-w-[200px]">
                  <div className="h-2.5 w-32 rounded-full bg-warm-2 mb-2" />
                  <div className="h-4 w-48 rounded-full bg-warm-3" />
                </div>
                <div className="h-8 w-40 rounded-[9px] bg-warm-2 border border-line" />
              </div>

              {/* tier ladder */}
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-6 w-20 rounded-full bg-warm-2 border border-line" />
                ))}
              </div>

              {/* reward tiers */}
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-24 rounded-full bg-warm-4 border border-line" />
                ))}
              </div>

              {/* board */}
              <div className="border border-line rounded-[14px] overflow-hidden bg-white">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3.5 px-[18px] py-3 ${i > 0 ? "border-t border-[#F5F5F4]" : ""}`}
                  >
                    <div className="flex-none w-8 h-8 rounded-full bg-warm-2" />
                    <div className="flex-none w-[52px] h-[52px] rounded-[12px] bg-warm-4 border border-line" />
                    <div className="flex-1 min-w-0">
                      <div className="h-3.5 w-32 rounded-full bg-warm-2 mb-1.5" />
                      <div className="h-2.5 w-14 rounded-full bg-warm-4" />
                    </div>
                    <div className="flex-none h-3.5 w-12 rounded-full bg-warm-3" />
                  </div>
                ))}
              </div>

              {/* footnote */}
              <div className="grid gap-1.5">
                <div className="h-2.5 w-full rounded-full bg-warm-4" />
                <div className="h-2.5 w-3/4 rounded-full bg-warm-4" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
