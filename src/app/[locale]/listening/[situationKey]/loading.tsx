// Mirrors the real /listening/[situationKey] page (breadcrumb, back-button +
// icon header with a "clips heard" count, CEFR level tabs, situation
// progress bar, resume banner, and a stacked list of clip cards) instead of
// a generic row list, so the skeleton→content swap doesn't jump.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px]">
          {/* the lesson bar's shape, so the swap doesn't jump (2026-09-10) */}
          <div className="h-[52px] -mx-[clamp(18px,4vw,44px)] -mt-6 mb-4 border-b-[1.5px] border-dashed border-dash xl:h-9 xl:mx-0 xl:mt-0 xl:mb-5 xl:border-0" />
          <div className="animate-pulse">
            <div className="max-w-[680px]">
              {/* situation progress */}
              <div className="h-[7px] rounded-full bg-warm border border-line mb-4" />

              {/* resume banner */}
              <div className="w-full flex items-center gap-3 border-[1.5px] border-line bg-warm rounded-[13px] px-4 py-3 mb-3.5">
                <div className="w-5 h-5 rounded-full bg-warm-2 flex-none" />
                <div className="flex-1 min-w-0">
                  <div className="h-3.5 w-44 rounded-full bg-warm-2 mb-1.5" />
                  <div className="h-3 w-36 rounded-full bg-warm-4" />
                </div>
                <div className="h-3.5 w-16 rounded-full bg-warm-2 flex-none" />
              </div>

              {/* clip cards */}
              <div className="grid gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full flex items-center gap-3 rounded-[13px] px-3.5 py-3 border-[1.5px] border-line bg-cream"
                  >
                    <div className="flex-none w-[34px] h-[34px] rounded-full bg-warm border-[1.5px] border-line" />
                    <div className="flex-1 min-w-0">
                      <div className="h-3.5 w-40 rounded-full bg-warm-2 mb-1.5" />
                      <div className="h-2.5 w-24 rounded-full bg-warm-4" />
                    </div>
                    <div className="flex-none h-3 w-12 rounded-full bg-warm-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
